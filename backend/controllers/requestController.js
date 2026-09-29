const { pool } = require('../config/db');

const logSms = async (requestId, type, phone, body) => {
  try {
    await pool.query(
      `INSERT INTO outbound_notifications (request_id, recipient_type, recipient_phone, message_body) 
       VALUES ($1, $2, $3, $4)`,
      [requestId, type, phone, body]
    );
  } catch (error) {
    console.error('SMS Loglama Hatası:', error);
  }
};

const createRequest = async (req, res) => {
  try {
    const { rawText, disambiguationChoice, contactValue, preferredChannel, location, isUrgent, deadlineDatetime } = req.body;
    
    const { rows: requestRows } = await pool.query(
      `INSERT INTO requests (raw_text, disambiguation_choice, contact_value, preferred_channel, location, is_urgent, deadline_datetime, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'POOL') 
       RETURNING *;`,
      [rawText, disambiguationChoice, contactValue, preferredChannel || 'PHONE', location, isUrgent || false, deadlineDatetime || null]
    );

    const newRequest = requestRows[0];
    await logSms(newRequest.id, 'USER', contactValue, `Talebiniz alınmış ve servis havuzuna eklenmiştir. Hizmet sağlayıcılar sıraya girdiğinde size bilgi vereceğiz.`);

    res.status(201).json({ status: 'success', request: newRequest });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Sunucu hatası' });
  }
};

const normalizeTr = (str) => {
  return String(str || '')
    .replace(/İ/g, 'i').replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
};

const isSmartMatch = (rawText, providerKeywords) => {
  if (!rawText || !providerKeywords) return false;
  
  const textNorm = normalizeTr(rawText);
  const keywords = Array.isArray(providerKeywords) 
    ? providerKeywords 
    : String(providerKeywords).replace(/[{}"']/g, '').split(',');

  return keywords.some(kw => {
    const cleanKw = normalizeTr(kw).trim();
    if (cleanKw.length < 2) return false;
    const root = cleanKw.slice(0, 4); 
    return textNorm.includes(root);
  });
};

const getOpenPoolRequests = async (req, res) => {
  try {
    const { providerId } = req.query;

    const provRes = await pool.query(`SELECT service_keywords FROM service_providers WHERE id = $1`, [providerId]);
    const providerKeywords = provRes.rows.length > 0 ? (provRes.rows[0].service_keywords || []) : [];

    const { rows } = await pool.query(
      `SELECT r.* FROM requests r
       WHERE r.status NOT IN ('COMPLETED', 'CANCELLED') 
       AND NOT EXISTS (
         SELECT 1 FROM request_interests ri 
         WHERE ri.request_id = r.id AND ri.provider_id = $1
       )
       ORDER BY r.created_at DESC;`,
      [providerId]
    );

    let filteredPool = [];
    if (providerKeywords && providerKeywords.length > 0) {
      filteredPool = rows.filter(req => {
        const textToSearch = `${req.raw_text || ''} ${req.disambiguation_choice || ''}`;
        return isSmartMatch(textToSearch, providerKeywords);
      }).map(req => ({
        ...req,
        contact_value: '*** ** ** (Eşleşince Görünür)' 
      }));
    }

    res.status(200).json({ status: 'success', poolRequests: filteredPool });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const joinRequestPool = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { providerId } = req.body;

    await pool.query(
      `INSERT INTO request_interests (request_id, provider_id, status) VALUES ($1, $2, 'WAITING') ON CONFLICT DO NOTHING`, 
      [requestId, providerId]
    );

    const reqCheck = await pool.query(`SELECT contact_value FROM requests WHERE id = $1`, [requestId]);
    const provCheck = await pool.query(`SELECT name FROM service_providers WHERE id = $1`, [providerId]);
    
    if (reqCheck.rows.length > 0 && provCheck.rows.length > 0) {
      await logSms(
        requestId, 
        'USER', 
        reqCheck.rows[0].contact_value, 
        `Talebinize bir sağlayıcı (${provCheck.rows[0].name}) talip oldu. Lütfen sisteme girip onaylayın (Seçin).`
      );
    }

    res.status(200).json({ status: 'success', message: 'Talebe talip oldunuz. Müşteri sizi seçtiğinde görevlerinize düşecektir.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const getUserRequests = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ status: 'error', message: 'Telefon numarası zorunludur.' });

    const { rows: requests } = await pool.query(
      `SELECT r.*, 
        sp.name as provider_name, sp.phone as provider_phone, sp.email as provider_email,
        rpd.provider_budget as matched_budget, rpd.provider_currency as matched_currency, rpd.provider_target_date as matched_target_date,
        (SELECT rating FROM reviews rv WHERE rv.request_id = r.id AND rv.reviewer_type = 'CUSTOMER' LIMIT 1) as customer_rating,
        EXISTS(SELECT 1 FROM reviews rv WHERE rv.request_id = r.id AND rv.reviewer_type = 'CUSTOMER') as has_customer_review
       FROM requests r
       LEFT JOIN service_providers sp ON r.matched_provider_id = sp.id
       LEFT JOIN request_provider_details rpd ON (rpd.request_id = r.id AND rpd.provider_id = r.matched_provider_id)
       WHERE r.contact_value LIKE $1
       ORDER BY r.created_at DESC;`,
      [`%${phone}%`]
    );
    
    if (requests.length === 0) {
      return res.status(200).json({ status: 'success', requests: [] });
    }

    const activeRequestIds = requests.filter(r => r.status !== 'CANCELLED').map(r => r.id);

    if (activeRequestIds.length > 0) {
      const { rows: allQueued } = await pool.query(
        `SELECT sp.id, sp.name, sp.phone, sp.priority_score, ri.status as interest_status, ri.request_id,
          rpd.provider_budget, rpd.provider_currency, rpd.provider_target_date, rpd.provider_description,
          (SELECT AVG(rv.rating) FROM reviews rv JOIN requests req ON rv.request_id = req.id WHERE req.matched_provider_id = sp.id AND rv.reviewer_type = 'CUSTOMER') as avg_rating,
          (SELECT AVG(rv.score) FROM reviews rv JOIN requests req ON rv.request_id = req.id WHERE req.matched_provider_id = sp.id AND rv.reviewer_type = 'CUSTOMER') as avg_score,
          (SELECT COUNT(rv.id) FROM reviews rv JOIN requests req ON rv.request_id = req.id WHERE req.matched_provider_id = sp.id AND rv.reviewer_type = 'CUSTOMER') as review_count
         FROM request_interests ri
         JOIN service_providers sp ON ri.provider_id = sp.id
         LEFT JOIN request_provider_details rpd ON (rpd.request_id = ri.request_id AND rpd.provider_id = sp.id)
         WHERE ri.request_id = ANY($1::int[])
         ORDER BY ri.created_at ASC;`,
        [activeRequestIds]
      );

      const providerIds = [...new Set(allQueued.map(q => q.id))];

      let allReviews = [];
      if (providerIds.length > 0) {
        const { rows } = await pool.query(
          `SELECT rv.rating, rv.rating_knowledge, rv.rating_communication, rv.rating_timing, rv.rating_cost, rv.score, rv.comment, rv.rating_date, req.matched_provider_id as provider_id
           FROM reviews rv
           JOIN requests req ON rv.request_id = req.id
           WHERE req.matched_provider_id = ANY($1::int[]) AND rv.reviewer_type = 'CUSTOMER'
           ORDER BY rv.rating_date DESC;`,
          [providerIds]
        );
        allReviews = rows;
      }

      const reviewsByProvider = {};
      allReviews.forEach(rev => {
        if (!reviewsByProvider[rev.provider_id]) reviewsByProvider[rev.provider_id] = [];
        reviewsByProvider[rev.provider_id].push(rev);
      });

      const queuedByRequest = {};
      allQueued.forEach(q => {
        q.reviews = reviewsByProvider[q.id] || [];
        if (!queuedByRequest[q.request_id]) queuedByRequest[q.request_id] = [];
        queuedByRequest[q.request_id].push(q);
      });

      requests.forEach(r => {
        if (r.status !== 'CANCELLED') {
          r.queuedProviders = queuedByRequest[r.id] || [];
        } else {
          r.queuedProviders = [];
        }
      });
    } else {
      requests.forEach(r => r.queuedProviders = []);
    }

    res.status(200).json({ status: 'success', requests });
  } catch (error) {
    console.error('getUserRequests hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const passToNextProvider = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    await pool.query(
      `UPDATE request_interests SET status = 'SKIPPED' WHERE request_id = $1 AND provider_id = (SELECT matched_provider_id FROM requests WHERE id = $1)`,
      [requestId]
    );

    const { rows: nextInQueue } = await pool.query(
      `SELECT provider_id FROM request_interests WHERE request_id = $1 AND status = 'WAITING' ORDER BY created_at ASC LIMIT 1`,
      [requestId]
    );

    if (nextInQueue.length > 0) {
      const nextProviderId = nextInQueue[0].provider_id;
      await pool.query(`UPDATE requests SET matched_provider_id = $1, status = 'MATCHED' WHERE id = $2`, [nextProviderId, requestId]);
      await pool.query(`UPDATE request_interests SET status = 'ACTIVE' WHERE request_id = $1 AND provider_id = $2`, [requestId, nextProviderId]);
    } else {
      await pool.query(`UPDATE requests SET matched_provider_id = NULL, status = 'POOL' WHERE id = $1`, [requestId]);
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const selectCandidateProvider = async (req, res) => {
  try {
    const { requestId } = req.params; 
    const { providerId } = req.body;
    
    await pool.query(`UPDATE request_interests SET status = 'SKIPPED' WHERE request_id = $1 AND status = 'ACTIVE'`, [requestId]);
    await pool.query(`UPDATE requests SET matched_provider_id = $1, status = 'MATCHED' WHERE id = $2`, [providerId, requestId]);
    await pool.query(`UPDATE request_interests SET status = 'ACTIVE' WHERE request_id = $1 AND provider_id = $2`, [requestId, providerId]);

    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { newStatus } = req.body;

    const { rows } = await pool.query(
      `UPDATE requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *;`,
      [newStatus, requestId]
    );

    if (rows.length > 0) {
      const updatedReq = rows[0];

      if (newStatus === 'PROVIDER_COMPLETED' && updatedReq.matched_provider_id) {
        await pool.query(
          `UPDATE request_provider_details 
           SET provider_delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
           WHERE request_id = $1 AND provider_id = $2`,
          [requestId, updatedReq.matched_provider_id]
        );
      }

      if (newStatus === 'ACCEPTED') {
        await logSms(updatedReq.id, 'USER', updatedReq.contact_value, `Talebiniz sağlayıcı tarafından kabul edildi. İletişime geçilecektir.`);
      } else if (newStatus === 'PROVIDER_COMPLETED') {
        await logSms(updatedReq.id, 'USER', updatedReq.contact_value, `Sağlayıcı işlemi tamamladığını bildirdi. Lütfen onaylayıp değerlendirin.`);
      }
    }
    
    res.status(200).json({ status: 'success', request: rows[0] });
  } catch (error) { 
    console.error('updateRequestStatus hatası:', error);
    res.status(500).json({ status: 'error', message: error.message }); 
  }
};

const getProviderAssignedRequests = async (req, res) => {
  try {
    const { providerId } = req.query;
    if (!providerId) return res.status(404).json({ message: 'Provider ID gerekli' });

    const { rows } = await pool.query(
      `SELECT r.*, 
        (SELECT rating FROM reviews rv WHERE rv.request_id = r.id AND rv.reviewer_type = 'PROVIDER' LIMIT 1) as provider_rating,
        rpd.provider_budget,
        rpd.provider_currency,
        rpd.provider_target_date,
        rpd.provider_description,
        rpd.provider_budget as matched_budget, 
        rpd.provider_currency as matched_currency, 
        rpd.provider_target_date as matched_target_date
       FROM requests r
       LEFT JOIN request_provider_details rpd ON (rpd.request_id = r.id AND rpd.provider_id = $1)
       WHERE r.matched_provider_id = $1 
       AND r.status IN ('MATCHED', 'ACCEPTED', 'PROVIDER_COMPLETED', 'COMPLETED', 'CANCELLED')
       ORDER BY r.updated_at DESC, r.created_at DESC;`,
      [providerId]
    );

    const secureRows = rows.map(r => {
      if (!['ACCEPTED', 'PROVIDER_COMPLETED', 'COMPLETED'].includes(r.status)) {
        return {
          ...r,
          contact_value: '*** ** ** (İşi Kabul Edince Görünür)' 
        };
      }
      return r;
    });

    res.status(200).json({ status: 'success', requests: secureRows });
  } catch (error) {
    console.error('getProviderAssignedRequests hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const getMatchedRequests = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT r.*, sp.name as provider_name, sp.phone as provider_phone FROM requests r LEFT JOIN service_providers sp ON r.matched_provider_id = sp.id ORDER BY r.created_at DESC;`);
    for (let r of rows) {
      const { rows: queued } = await pool.query(`SELECT sp.name, sp.phone, ri.status as interest_status, ri.created_at FROM request_interests ri JOIN service_providers sp ON ri.provider_id = sp.id WHERE ri.request_id = $1 ORDER BY ri.created_at ASC;`, [r.id]);
      r.queueList = queued;
    }
    res.status(200).json({ status: 'success', requests: rows });
  } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
};

const getPendingRequests = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM requests WHERE status IN ('POOL', 'MANUAL_INTERVENTION') ORDER BY created_at ASC;`);
    res.status(200).json({ status: 'success', requests: rows });
  } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
};

const assignProviderManually = async (req, res) => {
  try {
    const { requestId, providerId } = req.body;
    await pool.query(`UPDATE requests SET matched_provider_id = $1, status = 'MATCHED' WHERE id = $2`, [providerId, requestId]);
    await pool.query(`INSERT INTO request_interests (request_id, provider_id, status) VALUES ($1, $2, 'ACTIVE') ON CONFLICT (request_id, provider_id) DO UPDATE SET status = 'ACTIVE'`, [requestId, providerId]);
    res.status(200).json({ status: 'success', message: 'Manuel atama başarılı.' });
  } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
};

const getOutboundNotifications = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM outbound_notifications ORDER BY created_at DESC LIMIT 100;`);
    res.status(200).json({ status: 'success', notifications: rows });
  } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
};

const deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    await pool.query(`DELETE FROM requests WHERE id = $1`, [requestId]);
    res.status(200).json({ status: 'success' });
  } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
};

// TEK TANIM: Sağlayıcı detaylarını (tutar, para birimi, tarih, açıklama) güncelleme/ekleme
const upsertProviderRequestDetails = async (req, res) => {
  try {
    const { requestId, providerId } = req.params;
    const { providerBudget, providerCurrency, providerTargetDate, providerDescription } = req.body;

    const budget = providerBudget !== undefined && providerBudget !== null && providerBudget !== '' 
      ? parseFloat(providerBudget) 
      : null;
    const targetDate = providerTargetDate ? new Date(providerTargetDate) : null;
    const currency = providerCurrency || 'TRY';

    const { rows } = await pool.query(
      `INSERT INTO request_provider_details (request_id, provider_id, provider_budget, provider_currency, provider_target_date, provider_description) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (request_id, provider_id) 
       DO UPDATE SET 
         provider_budget = EXCLUDED.provider_budget, 
         provider_currency = EXCLUDED.provider_currency,
         provider_target_date = EXCLUDED.provider_target_date, 
         provider_description = COALESCE(EXCLUDED.provider_description, request_provider_details.provider_description),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *;`,
      [parseInt(requestId, 10), parseInt(providerId, 10), budget, currency, targetDate, providerDescription || '']
    );

    res.status(200).json({ status: 'success', details: rows[0] });
  } catch (error) {
    console.error('upsertProviderRequestDetails hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Tekrarlanan siparişi oluşturma ve geçmiş detayları yeni kayda kopyalama
const createDirectReorder = async (req, res) => {
  try {
    const { 
      rawText, contactValue, preferredChannel, location, isUrgent, requestType,
      targetProviderId, suggestedBudget, suggestedTargetDate, suggestedDescription, oldRequestId
    } = req.body;

    const tProviderId = targetProviderId ? parseInt(targetProviderId, 10) : null;
    if (!tProviderId) {
      return res.status(400).json({ status: 'error', message: 'Sağlayıcı kimliği eksik.' });
    }

    let budget = suggestedBudget ? parseFloat(suggestedBudget) : null;
    let targetDate = suggestedTargetDate ? new Date(suggestedTargetDate) : null;
    let description = suggestedDescription || 'Tekrarlanan Sipariş';

    // Eğer frontend'den değerler eksik geldiyse eski sipariş detaylarından tamamla
    if ((budget === null || targetDate === null) && oldRequestId) {
      const { rows: oldDetails } = await pool.query(
        `SELECT rpd.provider_budget, rpd.provider_target_date, rpd.provider_description, r.created_at as req_created
         FROM requests r
         LEFT JOIN request_provider_details rpd ON (rpd.request_id = r.id AND rpd.provider_id = $1)
         WHERE r.id = $2 LIMIT 1`,
        [tProviderId, parseInt(oldRequestId, 10)]
      );

      if (oldDetails.length > 0) {
        if (budget === null && oldDetails[0].provider_budget) {
          budget = parseFloat(oldDetails[0].provider_budget);
        }
        if (targetDate === null && oldDetails[0].provider_target_date && oldDetails[0].req_created) {
          const diffMs = new Date(oldDetails[0].provider_target_date).getTime() - new Date(oldDetails[0].req_created).getTime();
          if (diffMs > 0) {
            targetDate = new Date(Date.now() + diffMs);
          }
        }
        if (!description && oldDetails[0].provider_description) {
          description = oldDetails[0].provider_description;
        }
      }
    }

    if (!targetDate) {
      targetDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // 1. Talebi MATCHED durumunda oluştur
    const insertReqQuery = `
      INSERT INTO requests 
      (raw_text, contact_value, preferred_channel, location, is_urgent, request_type, status, matched_provider_id)
      VALUES ($1, $2, $3, $4, $5, $6, 'MATCHED', $7)
      RETURNING *;
    `;
    const { rows: newReqRows } = await pool.query(insertReqQuery, [
      rawText || '', contactValue || '', preferredChannel || 'PHONE', location || '', isUrgent || false, requestType || 'TALEP', tProviderId
    ]);
    const newReq = newReqRows[0];

    // 2. Sağlayıcıyı eşleşme tablosuna ACTIVE olarak ekle
    await pool.query(
      `INSERT INTO request_interests (request_id, provider_id, status) VALUES ($1, $2, 'ACTIVE')`,
      [newReq.id, tProviderId]
    );

    // 3. Fiyat ve teslimat tarihini detay tablosuna ekle
    await pool.query(
      `INSERT INTO request_provider_details (request_id, provider_id, provider_budget, provider_currency, provider_target_date, provider_description) 
       VALUES ($1, $2, $3, 'TRY', $4, $5)`,
      [newReq.id, tProviderId, budget, targetDate, description]
    );

    res.status(201).json({ status: 'success', message: 'Doğrudan sipariş oluşturuldu', request: newReq });
  } catch (error) {
    console.error('Direct reorder hatası:', error);
    res.status(500).json({ status: 'error', message: `Veritabanı Hatası: ${error.message}` });
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
  deleteRequest,
  upsertProviderRequestDetails,
  createDirectReorder
};