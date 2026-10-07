const { pool } = require('../config/db');

// --- MASTER TAKSONOMİ VE OTOMATİK ETİKETLEME MOTORU ---
let MASTER_TAXONOMY = {};
let isTaxonomyLoaded = false;

const loadTaxonomyFromDB = async () => {
  try {
    if (!pool || typeof pool.query !== 'function') return;
    const { rows } = await pool.query('SELECT tag_name, keywords FROM lookup_tags WHERE is_active = TRUE');
    const newTaxonomy = {};

    rows.forEach((row) => {
      const cleanTag = (row.tag_name || '').replace('#', '').trim();
      if (cleanTag) {
        newTaxonomy[cleanTag] = Array.isArray(row.keywords) ? row.keywords : [];
      }
    });

    MASTER_TAXONOMY = newTaxonomy;
    isTaxonomyLoaded = true;
    console.log(`✅ Master Taksonomi DB'den yüklendi: ${Object.keys(MASTER_TAXONOMY).length} etiket aktif.`);
  } catch (error) {
    console.error('❌ Taksonomi yüklenirken hata oluştu:', error.message);
  }
};

loadTaxonomyFromDB();

const autoTagRequest = async (rawText) => {
  if (!rawText) return ['GENEL_BILDIRIM'];

  if (!isTaxonomyLoaded || Object.keys(MASTER_TAXONOMY).length === 0) {
    await loadTaxonomyFromDB();
  }

  const tags = new Set();
  const lowerText = rawText.toLowerCase();

  for (const [tag, keywords] of Object.entries(MASTER_TAXONOMY)) {
    for (const keyword of keywords) {
      if (keyword && lowerText.includes(keyword.toLowerCase().trim())) {
        tags.add(tag);
        break;
      }
    }
  }

  if (tags.size === 0) {
    tags.add('GENEL_BILDIRIM');
  }

  return Array.from(tags);
};

// --- CONTROLLER İŞLEMLERİ ---

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
    const { rawText, disambiguationChoice, contactValue, preferredChannel, location, isUrgent, deadlineDatetime, requestType } = req.body;
    
    const detectedTags = await autoTagRequest(rawText);

    const { rows: requestRows } = await pool.query(
      `INSERT INTO requests (raw_text, disambiguation_choice, contact_value, preferred_channel, location, is_urgent, deadline_datetime, request_type, status, tags) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'POOL', $9) 
       RETURNING *;`,
      [rawText, disambiguationChoice, contactValue, preferredChannel || 'PHONE', location, isUrgent || false, deadlineDatetime || null, requestType || 'TALEP', detectedTags]
    );

    const newRequest = requestRows[0];
    await logSms(newRequest.id, 'USER', contactValue, `Talebiniz alınmış ve servis havuzuna eklenmiştir. Hizmet sağlayıcılar sıraya girdiğinde size bilgi vereceğiz.`);

    res.status(201).json({ 
      status: 'success', 
      request: newRequest,
      detectedTags: detectedTags 
    });
  } catch (error) {
    console.error('createRequest hatası:', error);
    res.status(500).json({ status: 'error', message: 'Sunucu hatası: ' + error.message });
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

    let providerKeywords = [];
    if (providerId) {
      const provRes = await pool.query(`SELECT service_keywords FROM service_providers WHERE id = $1`, [providerId]);
      if (provRes.rows.length > 0) {
        providerKeywords = provRes.rows[0].service_keywords || [];
      }
    }

    const { rows } = await pool.query(
      `SELECT r.* FROM requests r
       WHERE r.status NOT IN ('COMPLETED', 'CANCELLED') 
       AND (
         $1::int IS NULL OR NOT EXISTS (
           SELECT 1 FROM request_interests ri 
           WHERE ri.request_id = r.id AND ri.provider_id = $1
         )
       )
       ORDER BY r.created_at DESC;`,
      [providerId || null]
    );

    let filteredPool = rows;
    if (providerKeywords && providerKeywords.length > 0) {
      filteredPool = rows.filter(reqItem => {
        const textToSearch = `${reqItem.raw_text || ''} ${reqItem.disambiguation_choice || ''}`;
        return isSmartMatch(textToSearch, providerKeywords);
      });
    }

    filteredPool = filteredPool.map(reqItem => ({
      ...reqItem,
      contact_value: '*** ** ** (Eşleşince Görünür)' 
    }));

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

    const cleanPhone = phone.trim();

    const { rows: requests } = await pool.query(
      `SELECT r.*, 
        sp.name as provider_name, sp.phone as provider_phone, sp.email as provider_email,
        rpd.provider_budget as matched_budget, rpd.provider_currency as matched_currency, rpd.provider_target_date as matched_target_date,
        (SELECT rating FROM reviews rv WHERE rv.request_id = r.id AND rv.reviewer_type = 'CUSTOMER' LIMIT 1) as customer_rating,
        EXISTS(SELECT 1 FROM reviews rv WHERE rv.request_id = r.id AND rv.reviewer_type = 'CUSTOMER') as has_customer_review
       FROM requests r
       LEFT JOIN service_providers sp ON r.matched_provider_id = sp.id
       LEFT JOIN request_provider_details rpd ON (rpd.request_id = r.id AND rpd.provider_id = r.matched_provider_id)
       WHERE r.contact_value LIKE $1 OR SPLIT_PART(r.contact_value, '|', 1) = $2
       ORDER BY r.created_at DESC;`,
      [`%${cleanPhone}%`, cleanPhone]
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
    const requestId = parseInt(req.params.requestId, 10);
    const providerId = parseInt(req.body.providerId, 10);

    if (isNaN(requestId) || isNaN(providerId)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Geçersiz requestId veya providerId' 
      });
    }

    const updateQuery = `
      UPDATE requests 
      SET 
        matched_provider_id = $1,
        status = 'MATCHED',
        updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;

    const { rows } = await pool.query(updateQuery, [providerId, requestId]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Talep bulunamadı' });
    }

    return res.status(200).json({ status: 'success', request: rows[0] });
  } catch (error) {
    console.error('selectCandidateProvider hatası:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: `Seçim kaydedilemedi: ${error.message}` 
    });
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
    const { providerId, phone } = req.query;
    let targetProviderId = null;

    if (providerId && !isNaN(parseInt(providerId, 10))) {
      targetProviderId = parseInt(providerId, 10);
    } else if (phone) {
      const provRes = await pool.query(
        `SELECT id FROM service_providers WHERE phone = $1 LIMIT 1`,
        [phone]
      );
      if (provRes.rows.length > 0) targetProviderId = provRes.rows[0].id;
    }

    if (!targetProviderId) {
      return res.status(200).json({ status: 'success', requests: [] });
    }

    const query = `
      SELECT 
        r.id,
        r.raw_text,
        r.status,
        r.location,
        r.is_urgent,
        r.tags,
        r.created_at,
        r.updated_at,
        r.matched_provider_id,
        CASE 
          WHEN r.matched_provider_id = $1 THEN SPLIT_PART(r.contact_value, '|', 1)
          ELSE 'Seçim yapıldıktan sonra açılacak'
        END AS contact_value,
        r.preferred_channel,
        rpd.provider_budget,
        rpd.provider_currency,
        rpd.provider_target_date,
        rpd.provider_description,
        sp.name AS provider_name,
        sp.phone AS provider_phone
      FROM requests r
      LEFT JOIN service_providers sp ON sp.id = r.matched_provider_id
      LEFT JOIN request_provider_details rpd 
        ON (rpd.request_id = r.id AND rpd.provider_id = $1)
      WHERE r.matched_provider_id = $1
      ORDER BY r.created_at DESC
      LIMIT 100;
    `;

    const { rows } = await pool.query(query, [targetProviderId]);
    return res.status(200).json({ status: 'success', requests: rows });
  } catch (error) {
    console.error('getProviderAssignedRequests hatası:', error);
    return res.status(500).json({ status: 'error', message: error.message });
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

const upsertProviderRequestDetails = async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId, 10);
    const providerId = parseInt(req.params.providerId, 10);
    const { providerBudget, providerCurrency, providerTargetDate, providerDescription } = req.body;

    const check = await pool.query(
      `SELECT id FROM request_provider_details WHERE request_id = $1 AND provider_id = $2 LIMIT 1`,
      [requestId, providerId]
    );

    let resultRow;
    if (check.rows.length > 0) {
      const updateRes = await pool.query(
        `UPDATE request_provider_details 
         SET 
           provider_budget = $1,
           provider_currency = $2,
           provider_target_date = $3,
           provider_description = $4,
           updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [
          providerBudget !== undefined && providerBudget !== '' ? parseFloat(providerBudget) : null,
          providerCurrency || 'TRY',
          providerTargetDate || null,
          providerDescription || null,
          check.rows[0].id
        ]
      );
      resultRow = updateRes.rows[0];
    } else {
      const insertRes = await pool.query(
        `INSERT INTO request_provider_details 
            (request_id, provider_id, provider_budget, provider_currency, provider_target_date, provider_description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [
          requestId,
          providerId,
          providerBudget !== undefined && providerBudget !== '' ? parseFloat(providerBudget) : null,
          providerCurrency || 'TRY',
          providerTargetDate || null,
          providerDescription || null
        ]
      );
      resultRow = insertRes.rows[0];
    }

    res.status(200).json({ status: 'success', details: resultRow });
  } catch (error) {
    console.error('upsertProviderRequestDetails hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

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

    let finalRequestType = requestType || 'TALEP';
    let newDeadlineDatetime = null;
    let budget = suggestedBudget !== undefined && suggestedBudget !== null && suggestedBudget !== '' 
      ? parseFloat(suggestedBudget) 
      : null;
    let targetDate = suggestedTargetDate ? new Date(suggestedTargetDate) : null;
    let description = suggestedDescription || 'Tekrarlanan Sipariş';

    if (oldRequestId) {
      const { rows: oldRows } = await pool.query(
        `SELECT r.request_type, r.created_at, r.deadline_datetime,
                rpd.provider_budget, rpd.provider_target_date, rpd.provider_description
         FROM requests r
         LEFT JOIN request_provider_details rpd ON (rpd.request_id = r.id AND rpd.provider_id = $1)
         WHERE r.id = $2 LIMIT 1`,
        [tProviderId, parseInt(oldRequestId, 10)]
      );

      if (oldRows.length > 0) {
        const old = oldRows[0];

        if (old.request_type) {
          finalRequestType = old.request_type;
        }

        const oldCreatedMs = old.created_at ? new Date(old.created_at).getTime() : null;

        if (oldCreatedMs && old.deadline_datetime) {
          const oldDeadlineMs = new Date(old.deadline_datetime).getTime();
          const diffDeadline = oldDeadlineMs - oldCreatedMs;
          if (diffDeadline > 0 && !isNaN(diffDeadline)) {
            newDeadlineDatetime = new Date(Date.now() + diffDeadline);
          }
        }

        if (!targetDate && oldCreatedMs && old.provider_target_date) {
          const oldTargetMs = new Date(old.provider_target_date).getTime();
          const diffTarget = oldTargetMs - oldCreatedMs;
          if (diffTarget > 0 && !isNaN(diffTarget)) {
            targetDate = new Date(Date.now() + diffTarget);
          }
        }

        if (budget === null && old.provider_budget) {
          budget = parseFloat(old.provider_budget);
        }

        if (!description && old.provider_description) {
          description = old.provider_description;
        }
      }
    }

    if (!targetDate) {
      targetDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const detectedTags = await autoTagRequest(rawText);

    const insertReqQuery = `
      INSERT INTO requests 
      (raw_text, contact_value, preferred_channel, location, is_urgent, request_type, status, matched_provider_id, deadline_datetime, tags)
      VALUES ($1, $2, $3, $4, $5, $6, 'MATCHED', $7, $8, $9)
      RETURNING *;
    `;
    const { rows: newReqRows } = await pool.query(insertReqQuery, [
      rawText || '', 
      contactValue || '', 
      preferredChannel || 'PHONE', 
      location || '', 
      isUrgent || false, 
      finalRequestType, 
      tProviderId,
      newDeadlineDatetime,
      detectedTags
    ]);
    const newReq = newReqRows[0];

    await pool.query(
      `INSERT INTO request_interests (request_id, provider_id, status) VALUES ($1, $2, 'ACTIVE')`,
      [newReq.id, tProviderId]
    );

    await pool.query(
      `INSERT INTO request_provider_details (request_id, provider_id, provider_budget, provider_currency, provider_target_date, provider_description) 
       VALUES ($1, $2, $3, 'TRY', $4, $5)`,
      [newReq.id, tProviderId, budget, targetDate, description]
    );

    res.status(201).json({ status: 'success', message: 'Doğrudan sipariş oluşturuldu', request: newReq, detectedTags });
  } catch (error) {
    console.error('Direct reorder hatası:', error);
    res.status(500).json({ status: 'error', message: `Veritabanı Hatası: ${error.message}` });
  }
};

// --- TALEP BAZLI ETİKET (TAG) YÖNETİMİ ---

const addTagToRequest = async (req, res) => {
  const { requestId } = req.params;
  const { tag } = req.body;
  try {
    const result = await pool.query(`
      UPDATE requests 
      SET tags = ARRAY(
        SELECT DISTINCT UNNEST(array_append(COALESCE(tags, '{}'), $1))
      )
      WHERE id = $2 RETURNING *`, 
      [tag, requestId]
    );
    res.json({ message: 'Tag eklendi', request: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Tag eklenemedi', error: error.message });
  }
};

const removeTagFromRequest = async (req, res) => {
  const { requestId, tagName } = req.params;
  try {
    const result = await pool.query(`
      UPDATE requests 
      SET tags = array_remove(COALESCE(tags, '{}'), $1) 
      WHERE id = $2 RETURNING *`, 
      [tagName, requestId]
    );
    res.json({ message: 'Tag çıkarıldı', request: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Tag çıkarılamadı', error: error.message });
  }
};

// --- DIŞA AKTARIM (EXPORT) ---
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
  createDirectReorder,
  addTagToRequest,
  removeTagFromRequest
};