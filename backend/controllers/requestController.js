const { pool } = require('../config/db');

// Yardımcı: SMS Bildirim Simülasyonu
const triggerSimulatedNotifications = async (requestId, reqData, providerData, eventType = 'MATCHED') => {
  try {
    const channel = reqData.preferred_channel || 'PHONE';
    let userMsg = '';
    let providerMsg = '';

    if (eventType === 'MATCHED') {
      userMsg = `[Sms-Contact] Talebiniz #${requestId} '${providerData.name}' ile eşleştirildi. Sağlayıcı onayı bekleniyor.`;
      providerMsg = `[Sms-Contact] Yeni İş Fırsatı (#${requestId})! Müşteri Tel: ${reqData.contact_value}. İhtiyaç: "${reqData.raw_text}". Tercih: ${channel}. Lütfen kabul edin veya pas geçin.`;
    } else if (eventType === 'ACCEPTED') {
      userMsg = `[Sms-Contact] Müjde! '${providerData.name}' talebinizi kabul etti. ${channel === 'PHONE' ? 'Arama başlatılıyor...' : 'SMS üzerinden yazacak.'} İletişim: ${providerData.phone}`;
      providerMsg = `[Sms-Contact] #${requestId} numaralı talebi kabul ettiniz. Müşteri (${reqData.contact_value}) ile iletişime geçebilirsiniz.`;
    } else if (eventType === 'COMPLETED') {
      userMsg = `[Sms-Contact] #${requestId} numaralı talebiniz başarıyla tamamlandı olarak işaretlendi.`;
      providerMsg = `[Sms-Contact] #${requestId} numaralı iş 'Tamamlandı' olarak onaylandı.`;
    } else if (eventType === 'CANCELLED') {
      userMsg = `[Sms-Contact] #${requestId} numaralı talep iptal edildi.`;
      providerMsg = `[Sms-Contact] #${requestId} numaralı talep iptal edildi.`;
    }

    if (userMsg && providerMsg) {
      await pool.query(`
        INSERT INTO outbound_notifications (request_id, recipient_type, recipient_phone, channel, message_body)
        VALUES 
          ($1, 'USER', $2, 'SMS', $3),
          ($1, 'PROVIDER', $4, 'SMS', $5);
      `, [requestId, reqData.contact_value, userMsg, providerData.phone, providerMsg]);
    }
  } catch (err) {
    console.error('SMS loglama hatası:', err.message);
  }
};

// 1. Yeni Talep Oluşturma
const createRequest = async (req, res) => {
  try {
    const { rawText, disambiguationChoice, contactValue, preferredChannel } = req.body;

    if (!rawText || !contactValue) {
      return res.status(400).json({ status: 'error', message: 'Metin ve iletişim bilgisi zorunludur.' });
    }

    const textToAnalyze = (disambiguationChoice || rawText).toLowerCase();
    const tokens = textToAnalyze
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

    const { rows: activeProviders } = await pool.query(`
      SELECT id, name, phone, email, service_keywords, communication_channels, priority_score 
      FROM service_providers 
      WHERE is_active = TRUE 
      ORDER BY priority_score DESC, id ASC;
    `);

    const matchedCandidates = [];
    for (const provider of activeProviders) {
      const keywords = (provider.service_keywords || []).map(k => k.toLowerCase().trim());
      const hasMatch = keywords.some(k => 
        tokens.includes(k) || 
        textToAnalyze.includes(k) ||
        k.split(/\s+/).every(part => textToAnalyze.includes(part))
      );
      if (hasMatch) {
        matchedCandidates.push(provider);
      }
    }

    const topCandidates = matchedCandidates.slice(0, 3);
    const primaryProvider = topCandidates.length > 0 ? topCandidates[0] : null;
    const requestStatus = primaryProvider ? 'MATCHED' : 'MANUAL_INTERVENTION';

    const insertQuery = `
      INSERT INTO requests 
      (raw_text, disambiguation_choice, keywords, contact_value, preferred_channel, status, matched_provider_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const { rows: savedRows } = await pool.query(insertQuery, [
      rawText.trim(),
      disambiguationChoice ? disambiguationChoice.trim() : null,
      tokens,
      contactValue.trim(),
      preferredChannel || 'PHONE',
      requestStatus,
      primaryProvider ? primaryProvider.id : null
    ]);

    const createdReq = savedRows[0];

    if (primaryProvider) {
      await triggerSimulatedNotifications(createdReq.id, createdReq, primaryProvider, 'MATCHED');

      return res.status(201).json({
        status: 'success',
        message: `Talebiniz '${primaryProvider.name}' ile eşleştirildi.`,
        matchedProvider: primaryProvider,
        candidates: topCandidates,
        request: createdReq
      });
    } else {
      return res.status(201).json({
        status: 'success',
        message: 'Talebiniz alındı. Uygun sağlayıcı onaylandığında SMS ile bildirilecektir.',
        matchedProvider: null,
        candidates: [],
        request: createdReq
      });
    }
  } catch (error) {
    console.error('Talep oluşturma hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 2. Kullanıcının Kendi Talepleri
const getUserRequests = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ status: 'error', message: 'Telefon zorunludur.' });

    const { rows: userRequests } = await pool.query(`
      SELECT 
        r.*,
        p.name AS provider_name,
        p.phone AS provider_phone,
        p.email AS provider_email,
        p.priority_score AS provider_score
      FROM requests r
      LEFT JOIN service_providers p ON r.matched_provider_id = p.id
      WHERE r.contact_value = $1
      ORDER BY r.created_at DESC;
    `, [phone.trim()]);

    const { rows: allProviders } = await pool.query(`
      SELECT id, name, phone, service_keywords, priority_score 
      FROM service_providers 
      WHERE is_active = TRUE 
      ORDER BY priority_score DESC;
    `);

    const enrichedRequests = userRequests.map(reqItem => {
      const textToAnalyze = (reqItem.disambiguation_choice || reqItem.raw_text).toLowerCase();
      const tokens = textToAnalyze.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ').split(/\s+/).filter(w => w.length > 1);

      const matched = allProviders.filter(prov => {
        const kws = (prov.service_keywords || []).map(k => k.toLowerCase().trim());
        return kws.some(k => tokens.includes(k) || textToAnalyze.includes(k));
      });

      return {
        ...reqItem,
        topCandidates: matched.slice(0, 3)
      };
    });

    res.status(200).json({ status: 'success', requests: enrichedRequests });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 3. Sağlayıcıya Atanmış Gelen Talepleri Getir (YENİ)
const getProviderAssignedRequests = async (req, res) => {
  try {
    const { providerId } = req.query;
    if (!providerId) return res.status(400).json({ status: 'error', message: 'providerId zorunludur.' });

    const { rows } = await pool.query(`
      SELECT 
        r.*,
        p.name AS provider_name,
        p.phone AS provider_phone
      FROM requests r
      LEFT JOIN service_providers p ON r.matched_provider_id = p.id
      WHERE r.matched_provider_id = $1
      ORDER BY r.updated_at DESC, r.created_at DESC;
    `, [parseInt(providerId, 10)]);

    res.status(200).json({ status: 'success', requests: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. Sonraki Sağlayıcıya Geç / Pas Geç
const passToNextProvider = async (req, res) => {
  try {
    const { requestId } = req.params;
    const rId = parseInt(requestId, 10);

    const { rows: reqRows } = await pool.query('SELECT * FROM requests WHERE id = $1', [rId]);
    if (reqRows.length === 0) return res.status(404).json({ status: 'error', message: 'Talep bulunamadı.' });
    const targetReq = reqRows[0];

    const textToAnalyze = (targetReq.disambiguation_choice || targetReq.raw_text).toLowerCase();
    const tokens = textToAnalyze.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ').split(/\s+/).filter(w => w.length > 1);

    const { rows: allProviders } = await pool.query(`
      SELECT id, name, phone, service_keywords, priority_score 
      FROM service_providers 
      WHERE is_active = TRUE 
      ORDER BY priority_score DESC;
    `);

    const matched = allProviders.filter(prov => {
      const kws = (prov.service_keywords || []).map(k => k.toLowerCase().trim());
      return kws.some(k => tokens.includes(k) || textToAnalyze.includes(k));
    });

    if (matched.length <= 1) {
      // Başka sağlayıcı yoksa operatör havuzuna çek
      await pool.query("UPDATE requests SET status = 'MANUAL_INTERVENTION', matched_provider_id = NULL WHERE id = $1", [rId]);
      return res.status(200).json({
        status: 'success',
        message: 'Alternatif başka sağlayıcı bulunmadığı için talep Operatör Havuzuna aktarıldı.'
      });
    }

    const currentIndex = matched.findIndex(p => p.id === targetReq.matched_provider_id);
    const nextIndex = (currentIndex + 1) % matched.length;
    const nextProvider = matched[nextIndex];

    const { rows: updatedRows } = await pool.query(`
      UPDATE requests 
      SET matched_provider_id = $1, status = 'MATCHED', updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 
      RETURNING *;
    `, [nextProvider.id, rId]);

    await triggerSimulatedNotifications(rId, updatedRows[0], nextProvider, 'MATCHED');

    res.status(200).json({
      status: 'success',
      message: `Talep sonraki sağlayıcı '${nextProvider.name}' ile eşleştirildi.`,
      request: updatedRows[0],
      newProvider: nextProvider
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 5. Doğrudan Aday Sağlayıcı Seç
const selectCandidateProvider = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { providerId } = req.body;
    const rId = parseInt(requestId, 10);
    const pId = parseInt(providerId, 10);

    const { rows: providerRows } = await pool.query('SELECT id, name, phone FROM service_providers WHERE id = $1', [pId]);
    if (providerRows.length === 0) return res.status(404).json({ status: 'error', message: 'Sağlayıcı bulunamadı.' });

    const { rows: updatedRows } = await pool.query(`
      UPDATE requests 
      SET matched_provider_id = $1, status = 'MATCHED', updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 
      RETURNING *;
    `, [pId, rId]);

    await triggerSimulatedNotifications(rId, updatedRows[0], providerRows[0], 'MATCHED');

    res.status(200).json({
      status: 'success',
      message: `Talep başarıyla '${providerRows[0].name}' sağlayıcısına yönlendirildi.`,
      request: updatedRows[0]
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 6. Talep Durumu Güncelle (ACCEPTED, COMPLETED, CANCELLED)
const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { newStatus } = req.body;

    const allowedStatuses = ['MATCHED', 'ACCEPTED', 'COMPLETED', 'CANCELLED'];
    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({ status: 'error', message: 'Geçersiz talep durumu.' });
    }

    const { rows } = await pool.query(`
      UPDATE requests
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `, [newStatus, parseInt(requestId, 10)]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Talep bulunamadı.' });
    }

    if (rows[0].matched_provider_id) {
      const { rows: pRows } = await pool.query('SELECT id, name, phone FROM service_providers WHERE id = $1', [rows[0].matched_provider_id]);
      if (pRows.length > 0) {
        await triggerSimulatedNotifications(rows[0].id, rows[0], pRows[0], newStatus);
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Talep durumu '${newStatus}' olarak güncellendi.`,
      request: rows[0]
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 7. Bekleyen / Eşleşen / Log / WoZ Sorguları
const getPendingRequests = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM requests 
      WHERE status = 'MANUAL_INTERVENTION' OR status = 'PENDING'
      ORDER BY created_at DESC;
    `);
    res.status(200).json({ status: 'success', requests: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const getMatchedRequests = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.*,
        p.id AS provider_id,
        p.name AS provider_name,
        p.phone AS provider_phone
      FROM requests r
      LEFT JOIN service_providers p ON r.matched_provider_id = p.id
      WHERE r.status IN ('MATCHED', 'ACCEPTED', 'COMPLETED', 'CANCELLED')
      ORDER BY r.updated_at DESC, r.created_at DESC;
    `;
    const { rows } = await pool.query(query);
    res.status(200).json({ status: 'success', requests: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const assignProviderManually = async (req, res) => {
  try {
    const { requestId, providerId } = req.body;
    const rId = parseInt(requestId, 10);
    const pId = parseInt(providerId, 10);

    const { rows: providerRows } = await pool.query('SELECT id, name, phone FROM service_providers WHERE id = $1', [pId]);
    if (providerRows.length === 0) return res.status(404).json({ status: 'error', message: 'Sağlayıcı bulunamadı.' });

    const { rows: updatedRows } = await pool.query(`
      UPDATE requests
      SET matched_provider_id = $1, status = 'MATCHED', updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `, [pId, rId]);

    await triggerSimulatedNotifications(rId, updatedRows[0], providerRows[0], 'MATCHED');

    res.status(200).json({
      status: 'success',
      message: `Talep '${providerRows[0].name}' sağlayıcısına atandı.`,
      request: updatedRows[0]
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const getOutboundNotifications = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT n.*, r.raw_text 
      FROM outbound_notifications n 
      LEFT JOIN requests r ON n.request_id = r.id 
      ORDER BY n.created_at DESC LIMIT 100;
    `);
    res.status(200).json({ status: 'success', notifications: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const rId = parseInt(requestId, 10);

    if (isNaN(rId)) return res.status(400).json({ status: 'error', message: 'Geçersiz talep ID.' });

    await pool.query('DELETE FROM outbound_notifications WHERE request_id = $1', [rId]);
    const { rows } = await pool.query('DELETE FROM requests WHERE id = $1 RETURNING *;', [rId]);

    if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Silinecek talep bulunamadı.' });

    res.status(200).json({ status: 'success', message: 'Talep kalıcı olarak silindi.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  createRequest,
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