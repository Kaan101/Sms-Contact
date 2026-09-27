const { pool } = require('../config/db');
const { safeArray, safeUpper } = require('../utils/helpers');

// 1. Müşterinin Kendi Taleplerini ve Kuyruk Sağlayıcılarını Çek
// 1. Müşterinin Kendi Taleplerini ve Kuyruk Sağlayıcılarını Çek
const getUserRequests = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ status: 'error', message: 'Telefon numarası zorunludur.' });
    }

    // has_customer_review ile müşterinin daha önce değerlendirme yapıp yapmadığı kontrol edilir
    const { rows: requests } = await pool.query(
      `SELECT r.*, 
        sp.name as provider_name, sp.phone as provider_phone, sp.email as provider_email,
        (SELECT rating::float FROM reviews rv WHERE rv.request_id = r.id AND rv.reviewer_type = 'CUSTOMER' LIMIT 1) as customer_rating,
        COALESCE(EXISTS(SELECT 1 FROM reviews rv WHERE rv.request_id = r.id AND rv.reviewer_type = 'CUSTOMER'), false) as has_customer_review
       FROM requests r
       LEFT JOIN service_providers sp ON r.matched_provider_id = sp.id
       WHERE r.contact_value LIKE $1
       ORDER BY r.created_at DESC;`,
      [`%${phone}%`]
    );

    for (let r of requests) {
      // Eğer r.has_customer_review PostgreSQL'den object/string geliyorsa boolean'a çevir:
      r.has_customer_review = Boolean(r.has_customer_review);
      
      if (r.status !== 'CANCELLED') {
        // Sıraya giren sağlayıcılar ve ortalama puan/skorları
        const { rows: queued } = await pool.query(
          `SELECT sp.id, sp.name, sp.phone, sp.priority_score, ri.status as interest_status,
            COALESCE((SELECT AVG(rv.rating)::float FROM reviews rv JOIN requests req ON rv.request_id = req.id WHERE req.matched_provider_id = sp.id AND rv.reviewer_type = 'CUSTOMER'), 0) as avg_rating,
            COALESCE((SELECT AVG(rv.score)::float FROM reviews rv JOIN requests req ON rv.request_id = req.id WHERE req.matched_provider_id = sp.id AND rv.reviewer_type = 'CUSTOMER'), 0) as avg_score,
            COALESCE((SELECT COUNT(rv.id)::int FROM reviews rv JOIN requests req ON rv.request_id = req.id WHERE req.matched_provider_id = sp.id AND rv.reviewer_type = 'CUSTOMER'), 0) as review_count
           FROM request_interests ri
           JOIN service_providers sp ON ri.provider_id = sp.id
           WHERE ri.request_id = $1
           ORDER BY ri.created_at ASC;`,
          [r.id]
        );

        // Her sağlayıcının önceki müşteri değerlendirmeleri
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
// 2. Yeni Talep Oluştur
const createRequest = async (req, res) => {
  try {
    const { 
      rawText, 
      disambiguationChoice, 
      contactValue, 
      preferredChannel, 
      location, 
      isUrgent, 
      deadlineDatetime, 
      requestType 
    } = req.body;

    if (!rawText || !contactValue) {
      return res.status(400).json({ status: 'error', message: 'Talep metni ve iletişim bilgisi zorunludur.' });
    }

    // deadlineDatetime boş string ('') geliyorsa null'a çevirelim ki PostgreSQL Date parsing hatası (invalid input syntax for type timestamp) vermesin.
    const safeDeadline = (deadlineDatetime && deadlineDatetime.trim() !== '') ? deadlineDatetime : null;

    const { rows } = await pool.query(
      `INSERT INTO requests 
      (raw_text, disambiguation_choice, contact_value, preferred_channel, location, is_urgent, deadline_datetime, request_type, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'POOL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;`,
      [
        rawText, 
        disambiguationChoice || null, 
        contactValue, 
        preferredChannel || 'PHONE, SMS', 
        location || 'İstanbul, Türkiye', 
        Boolean(isUrgent), 
        safeDeadline, 
        requestType || 'TALEP'
      ]
    );

    res.status(201).json({ status: 'success', request: rows[0] });
  } catch (error) {
    console.error('createRequest hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 3. Talep Durumu Güncelle
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;

    const { rows } = await pool.query(
      `UPDATE requests 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *;`,
      [newStatus, parseInt(id, 10)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Talep bulunamadı.' });
    }

    res.status(200).json({ status: 'success', request: rows[0] });
  } catch (error) {
    console.error('updateRequestStatus hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. Müşterinin Belirli Bir Sağlayıcıyı Seçmesi
const selectCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { providerId } = req.body;

    const rId = parseInt(id, 10);
    const pId = parseInt(providerId, 10);

    const { rows } = await pool.query(
      `UPDATE requests 
       SET matched_provider_id = $1, status = 'MATCHED', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *;`,
      [pId, rId]
    );

    await pool.query(
      `UPDATE request_interests 
       SET status = 'SELECTED' 
       WHERE request_id = $1 AND provider_id = $2;`,
      [rId, pId]
    );

    res.status(200).json({ status: 'success', request: rows[0] });
  } catch (error) {
    console.error('selectCandidate hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 5. Sıradaki Sağlayıcıya Geç
const nextProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const rId = parseInt(id, 10);

    const { rows: currentReq } = await pool.query('SELECT * FROM requests WHERE id = $1;', [rId]);
    if (currentReq.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Talep bulunamadı.' });
    }

    const matchedId = currentReq[0].matched_provider_id;

    if (matchedId) {
      await pool.query(
        `UPDATE request_interests 
         SET status = 'SKIPPED' 
         WHERE request_id = $1 AND provider_id = $2;`,
        [rId, matchedId]
      );
    }

    const { rows: nextCandidate } = await pool.query(
      `SELECT provider_id 
       FROM request_interests 
       WHERE request_id = $1 AND status != 'SKIPPED' AND provider_id != COALESCE($2, -1)
       ORDER BY created_at ASC 
       LIMIT 1;`,
      [rId, matchedId]
    );

    if (nextCandidate.length > 0) {
      const nextId = nextCandidate[0].provider_id;
      const { rows: updated } = await pool.query(
        `UPDATE requests 
         SET matched_provider_id = $1, status = 'MATCHED', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *;`,
        [nextId, rId]
      );
      return res.status(200).json({ status: 'success', request: updated[0] });
    } else {
      const { rows: updated } = await pool.query(
        `UPDATE requests 
         SET matched_provider_id = NULL, status = 'POOL', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *;`,
        [rId]
      );
      return res.status(200).json({ status: 'success', message: 'Sırada başka sağlayıcı kalmadı, talep açık havuza aktarıldı.', request: updated[0] });
    }
  } catch (error) {
    console.error('nextProvider hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getUserRequests,
  createRequest,
  updateRequestStatus,
  selectCandidate,
  nextProvider
};