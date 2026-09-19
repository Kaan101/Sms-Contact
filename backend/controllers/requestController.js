const { pool } = require('../config/db');
const fuzz = require('fuzzball');

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

// 🌟 TÜRKÇE ODAKLI HİBRİT EŞLEŞTİRME ALGORİTMASI
const isFuzzyMatch = (rawText, providerKeywords, threshold = 65) => {
  if (!rawText || !providerKeywords) return false;
  
  const textLower = rawText.toLocaleLowerCase('tr-TR');
  
  let keywords = [];
  if (typeof providerKeywords === 'string') {
      keywords = providerKeywords.split(',');
  } else if (Array.isArray(providerKeywords)) {
      keywords = providerKeywords;
  }

  for (let keyword of keywords) {
    const kwLower = String(keyword).trim().toLocaleLowerCase('tr-TR');
    if (!kwLower || kwLower.length < 2) continue;
    
    // AŞAMA 1: Doğrudan Cümle İçinde Geçiyorsa (Örn: "su kaçağı", "ekmeki")
    if (textLower.includes(kwLower)) {
        return true;
    }
    
    // AŞAMA 2: Türkçe Ünsüz Yumuşaması (k->ğ, p->b, ç->c, t->d)
    // Sağlayıcı "ekmek" dediyse biz müşterinin cümlesinde "ekmeğ" de ararız.
    if (kwLower.length >= 3) {
        const lastChar = kwLower.slice(-1);
        const root = kwLower.slice(0, -1);
        let mutated = null;

        if (lastChar === 'k') mutated = root + 'ğ'; // ekmek -> ekmeğ
        else if (lastChar === 'p') mutated = root + 'b'; // dolap -> dolab
        else if (lastChar === 'ç') mutated = root + 'c'; // ağaç -> ağac
        else if (lastChar === 't') mutated = root + 'd'; // kilit -> kilid

        // Eğer mutasyona uğramış hali müşterinin metninde geçiyorsa ("trabzon ekmeği" -> "ekmeğ"i içerir)
        if (mutated && textLower.includes(mutated)) {
            return true;
        }

        // İstisna: "renk" -> "rengi" (k->g)
        if (lastChar === 'k' && textLower.includes(root + 'g')) {
            return true;
        }
    }

    // AŞAMA 3: Kelimeleri ayırarak 'ile başlar' veya 'ek almış' kontrolü (tesisat -> tesisatçı)
    if (!kwLower.includes(' ')) {
         const textWords = textLower.split(/[\s,.;!?()]+/);
         if (textWords.some(w => w.startsWith(kwLower))) {
             return true;
         }
    }

    // AŞAMA 4: Yazım Hataları ve Harf Kaymaları için Fuzzball
    const partialScore = fuzz.partial_ratio(kwLower, textLower);
    const tokenScore = fuzz.token_set_ratio(kwLower, textLower);
    
    if (Math.max(partialScore, tokenScore) >= threshold) {
      return true;
    }
  }
  
  return false;
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
        return isFuzzyMatch(textToSearch, providerKeywords, 65);
      });
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
    res.status(200).json({ status: 'success', requests: rows });
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