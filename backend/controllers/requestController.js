const { pool } = require('../config/db');

// 1. Müşterinin Kendi Taleplerini ve Kuyruk Sağlayıcılarını Çek (Review geçmişi ile)
const getUserRequests = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ status: 'error', message: 'Telefon numarası zorunludur.' });

    const { rows: requests } = await pool.query(
      `SELECT r.*, 
        sp.name as provider_name, sp.phone as provider_phone, sp.email as provider_email,
        (SELECT rating FROM reviews rv WHERE rv.request_id = r.id AND rv.reviewer_type = 'CUSTOMER' LIMIT 1) as customer_rating,
        EXISTS(SELECT 1 FROM reviews rv WHERE rv.request_id = r.id AND rv.reviewer_type = 'CUSTOMER') as has_customer_review
       FROM requests r
       LEFT JOIN service_providers sp ON r.matched_provider_id = sp.id
       WHERE r.contact_value LIKE $1
       ORDER BY r.created_at DESC;`,
      [`%${phone}%`]
    );

    for (let r of requests) {
      if (r.status !== 'CANCELLED') {
        const { rows: queued } = await pool.query(
          `SELECT sp.id, sp.name, sp.phone, sp.priority_score, ri.status as interest_status,
            (SELECT AVG(rv.rating) FROM reviews rv JOIN requests req ON rv.request_id = req.id WHERE req.matched_provider_id = sp.id AND rv.reviewer_type = 'CUSTOMER') as avg_rating,
            (SELECT AVG(rv.score) FROM reviews rv JOIN requests req ON rv.request_id = req.id WHERE req.matched_provider_id = sp.id AND rv.reviewer_type = 'CUSTOMER') as avg_score,
            (SELECT COUNT(rv.id) FROM reviews rv JOIN requests req ON rv.request_id = req.id WHERE req.matched_provider_id = sp.id AND rv.reviewer_type = 'CUSTOMER') as review_count
           FROM request_interests ri
           JOIN service_providers sp ON ri.provider_id = sp.id
           WHERE ri.request_id = $1
           ORDER BY ri.created_at ASC;`,
          [r.id]
        );

        for (let q of queued) {
          const { rows: provReviews } = await pool.query(
            `SELECT rv.rating, rv.rating_knowledge, rv.rating_communication, rv.rating_timing, rv.rating_cost, rv.score, rv.comment, rv.rating_date
             FROM reviews rv
             JOIN requests req ON rv.request_id = req.id
             WHERE req.matched_provider_id = $1 AND rv.reviewer_type = 'CUSTOMER'
             ORDER BY rv.rating_date DESC;`,
            [q.id]
          );
          q.reviews = provReviews;
        }

        r.queuedProviders = queued;
      }
    }

    res.status(200).json({ status: 'success', requests });
  } catch (error) {
    console.error('getUserRequests hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 2. Yeni Talep Oluştur
const createRequest = async (req, res) => {
  try {
    const { rawText, disambiguationChoice, contactValue, preferredChannel, location, isUrgent, deadlineDatetime, requestType } = req.body;
    if (!rawText || !contactValue) return res.status(400).json({ status: 'error', message: 'Talep metni ve iletişim bilgisi zorunludur.' });

    const { rows } = await pool.query(
      `INSERT INTO requests 
      (raw_text, disambiguation_choice, contact_value, preferred_channel, location, is_urgent, deadline_datetime, request_type, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'POOL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;`,
      [rawText, disambiguationChoice || null, contactValue, preferredChannel || 'PHONE, SMS', location || 'İstanbul, Türkiye', Boolean(isUrgent), deadlineDatetime || null, requestType || 'TALEP']
    );
    res.status(201).json({ status: 'success', request: rows[0] });
  } catch (error) {
    console.error('createRequest hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 3. Durum Güncelleme
const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { newStatus } = req.body;
    const { rows } = await pool.query(
      'UPDATE requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *;',
      [newStatus, parseInt(requestId, 10)]
    );
    res.status(200).json({ status: 'success', request: rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. Havuza Katıl (Provider) - apiRoutes.js'de "joinRequestPool" olarak geçiyor
const joinRequestPool = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { providerId } = req.body;
    await pool.query(
      'INSERT INTO request_interests (request_id, provider_id, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;',
      [parseInt(requestId, 10), parseInt(providerId, 10), 'PENDING']
    );
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 5. Aday Seçimi (Customer) - apiRoutes.js'de "selectCandidateProvider" olarak geçiyor
const selectCandidateProvider = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { providerId } = req.body;
    const { rows } = await pool.query(
      'UPDATE requests SET matched_provider_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *;',
      [parseInt(providerId, 10), 'MATCHED', parseInt(requestId, 10)]
    );
    await pool.query(
      'UPDATE request_interests SET status = $1 WHERE request_id = $2 AND provider_id = $3;',
      ['SELECTED', parseInt(requestId, 10), parseInt(providerId, 10)]
    );
    res.status(200).json({ status: 'success', request: rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 6. Sıradaki Sağlayıcıya Geç (Customer) - apiRoutes.js'de "passToNextProvider" olarak geçiyor
const passToNextProvider = async (req, res) => {
  try {
    const { requestId } = req.params;
    const rId = parseInt(requestId, 10);

    const { rows: currentReq } = await pool.query('SELECT matched_provider_id FROM requests WHERE id = $1;', [rId]);
    if (currentReq.length === 0) return res.status(404).json({ status: 'error', message: 'Talep bulunamadı' });

    const matchedId = currentReq[0].matched_provider_id;

    if (matchedId) {
      await pool.query('UPDATE request_interests SET status = $1 WHERE request_id = $2 AND provider_id = $3;', ['SKIPPED', rId, matchedId]);
    }

    const { rows: nextCandidate } = await pool.query(
      'SELECT provider_id FROM request_interests WHERE request_id = $1 AND status != $2 AND provider_id != COALESCE($3, -1) ORDER BY created_at ASC LIMIT 1;',
      [rId, 'SKIPPED', matchedId]
    );

    if (nextCandidate.length > 0) {
      const { rows: updated } = await pool.query(
        'UPDATE requests SET matched_provider_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *;',
        [nextCandidate[0].provider_id, 'MATCHED', rId]
      );
      return res.status(200).json({ status: 'success', request: updated[0] });
    } else {
      const { rows: updated } = await pool.query(
        'UPDATE requests SET matched_provider_id = NULL, status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *;',
        ['POOL', rId]
      );
      return res.status(200).json({ status: 'success', message: 'Sırada başka sağlayıcı kalmadı, talep havuza döndü.', request: updated[0] });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 7. Talep Sil
const deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    await pool.query('DELETE FROM requests WHERE id = $1', [parseInt(requestId, 10)]);
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 8. Admin Sağlayıcı Ata - apiRoutes.js'de "assignProviderManually" olarak geçiyor
const assignProviderManually = async (req, res) => {
  try {
    const { requestId, providerId } = req.body;
    const { rows } = await pool.query(
      'UPDATE requests SET matched_provider_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *;',
      [parseInt(providerId, 10), 'MATCHED', parseInt(requestId, 10)]
    );
    res.status(200).json({ status: 'success', request: rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 9. Bekleyenleri Getir (Admin/Tracker)
const getPendingRequests = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT r.*, sp.name as provider_name FROM requests r LEFT JOIN service_providers sp ON r.matched_provider_id = sp.id WHERE r.status IN ('POOL', 'PENDING') ORDER BY r.created_at DESC;"
    );
    res.status(200).json({ status: 'success', requests: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 10. Eşleşenleri Getir (Admin/Tracker)
const getMatchedRequests = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT r.*, sp.name as provider_name, sp.phone as provider_phone FROM requests r LEFT JOIN service_providers sp ON r.matched_provider_id = sp.id WHERE r.status NOT IN ('POOL', 'PENDING') ORDER BY r.created_at DESC;"
    );
    res.status(200).json({ status: 'success', requests: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 11. Sağlayıcının İşlerini Getir (Provider) - apiRoutes.js'de "getProviderAssignedRequests" olarak geçiyor
const getProviderAssignedRequests = async (req, res) => {
  try {
    const { providerId } = req.query;
    const { rows } = await pool.query(
      'SELECT r.*, sp.name as provider_name, sp.phone as provider_phone FROM requests r LEFT JOIN service_providers sp ON r.matched_provider_id = sp.id WHERE r.matched_provider_id = $1 OR r.id IN (SELECT request_id FROM request_interests WHERE provider_id = $1) ORDER BY r.created_at DESC;',
      [parseInt(providerId, 10)]
    );
    res.status(200).json({ status: 'success', requests: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 12. Açık Havuzu Getir (Provider) - apiRoutes.js'de "getOpenPoolRequests" olarak geçiyor
const getOpenPoolRequests = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM requests WHERE status = 'POOL' ORDER BY created_at DESC;"
    );
    res.status(200).json({ status: 'success', poolRequests: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 13. Giden Bildirimleri Getir (Admin) - apiRoutes.js'de var ama export edilmemişti
const getOutboundNotifications = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM outbound_notifications ORDER BY created_at DESC LIMIT 100;');
    res.status(200).json({ status: 'success', notifications: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};


module.exports = {
  createRequest,
  getOpenPoolRequests,
  joinRequestPool,
  getUserRequests,
  getProviderAssignedRequests,
  passToNextProvider,
  selectCandidateProvider,
  updateRequestStatus,
  getPendingRequests,
  getMatchedRequests,
  assignProviderManually,
  getOutboundNotifications,
  deleteRequest
};