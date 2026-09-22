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

// 🌟 SADELEŞTİRİLMİŞ, TERTEMİZ EŞLEŞTİRME MOTORU
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

  // keywords dizisindeki (Örn: "ekmek", "su") kelimelerden HERHANGİ BİRİ (.some) eşleşirse TRUE döner
  return keywords.some(kw => {
    const cleanKw = normalizeTr(kw).trim();
    if (cleanKw.length < 2) return false;
    
    // Sağlayıcı kelimesinin ilk 4 harfini kök olarak al ("ekmek" -> "ekme", "su" -> "su")
    const root = cleanKw.slice(0, 4); 
    
    // Müşterinin yazdığı metin, bu kökü barındırıyorsa eşleşme başarılıdır
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
        contact_value: '*** ** ** (Eşleşince Görünür)' // Havuzdaki herkes için maskele
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

    await pool.query(`INSERT INTO request_interests (request_id, provider_id, status) VALUES ($1, $2, 'WAITING') ON CONFLICT DO NOTHING`, [requestId, providerId]);

    const reqCheck = await pool.query(`SELECT matched_provider_id, contact_value FROM requests WHERE id = $1`, [requestId]);
    
    if (reqCheck.rows.length > 0 && !reqCheck.rows[0].matched_provider_id) {
      await pool.query(`UPDATE requests SET matched_provider_id = $1, status = 'MATCHED' WHERE id = $2`, [providerId, requestId]);
      await pool.query(`UPDATE request_interests SET status = 'ACTIVE' WHERE request_id = $1 AND provider_id = $2`, [requestId, providerId]);
      
      const provCheck = await pool.query(`SELECT name FROM service_providers WHERE id = $1`, [providerId]);
      
      await logSms(requestId, 'USER', reqCheck.rows[0].contact_value, `Talebinizle ilgilenen ilk sağlayıcı (${provCheck.rows[0].name}) bulundu. Lütfen sisteme girip değerlendirin.`);
    }

    res.status(200).json({ status: 'success', message: 'Talebe talip oldunuz ve sıraya girdiniz.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const getUserRequests = async (req, res) => {
  try {
    const { phone } = req.query;
    const { rows: requests } = await pool.query(
      `SELECT r.*, 
        sp.name as provider_name, sp.phone as provider_phone, sp.email as provider_email,
        (SELECT rating FROM reviews rv WHERE rv.request_id = r.id AND rv.reviewer_type = 'CUSTOMER' LIMIT 1) as customer_rating
       FROM requests r
       LEFT JOIN service_providers sp ON r.matched_provider_id = sp.id
       WHERE r.contact_value LIKE $1
       ORDER BY r.created_at DESC;`,
      [`%${phone}%`]
    );

    for (let r of requests) {
      if (r.status !== 'CANCELLED') {
        const { rows: queued } = await pool.query(
          `SELECT sp.id, sp.name, sp.phone, sp.priority_score, ri.status as interest_status 
           FROM request_interests ri
           JOIN service_providers sp ON ri.provider_id = sp.id
           WHERE ri.request_id = $1
           ORDER BY ri.created_at ASC;`,
          [r.id]
        );
        r.queuedProviders = queued;
      }
    }

    res.status(200).json({ status: 'success', requests });
  } catch (error) {
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
    const { requestId } = req.params; // req.params olarak DÜZELTİLDİ
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
      if (newStatus === 'ACCEPTED') {
        await logSms(updatedReq.id, 'USER', updatedReq.contact_value, `Talebiniz sağlayıcı tarafından kabul edildi. İletişime geçilecektir.`);
      } else if (newStatus === 'PROVIDER_COMPLETED') {
        await logSms(updatedReq.id, 'USER', updatedReq.contact_value, `Sağlayıcı işlemi tamamladığını bildirdi. Lütfen onaylayıp değerlendirin.`);
      }
    }
    res.status(200).json({ status: 'success', request: rows[0] });
  } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
};

const getProviderAssignedRequests = async (req, res) => {
  try {
    const { providerId } = req.query;
    if (!providerId) return res.status(404).json({ message: 'Provider ID gerekli' });

    const { rows } = await pool.query(
      `SELECT r.*, 
        (SELECT rating FROM reviews rv WHERE rv.request_id = r.id AND rv.reviewer_type = 'PROVIDER' LIMIT 1) as provider_rating
       FROM requests r
       WHERE r.matched_provider_id = $1 
       AND r.status IN ('MATCHED', 'ACCEPTED', 'PROVIDER_COMPLETED', 'COMPLETED', 'CANCELLED')
       ORDER BY r.updated_at DESC;`,
      [providerId]
    );

    // GİZLİLİK KALKANI: Sağlayıcı henüz kabul etmediyse iletişim bilgisini maskele
    const secureRows = rows.map(r => {
      if (!['ACCEPTED', 'PROVIDER_COMPLETED', 'COMPLETED'].includes(r.status)) {
        return {
          ...r,
          contact_value: '*** ** ** (İşi Kabul Edince Görünür)' // Maskelenmiş değer
        };
      }
      return r;
    });

    res.status(200).json({ status: 'success', requests: secureRows });
  } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
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