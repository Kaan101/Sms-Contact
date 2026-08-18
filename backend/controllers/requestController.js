const { pool } = require('../config/db');

// Yardımcı: Çift Taraflı SMS Simülasyonu Üretip Kaydeder
const triggerSimulatedNotifications = async (requestId, reqData, providerData) => {
  try {
    const channel = reqData.preferred_channel || 'PHONE';
    
    // 1. Müşteriye Giden SMS
    const userMsg = `[Sms-Contact] Talebiniz onaylandı! '${providerData.name}' işletmesi en kısa sürede ${channel === 'PHONE' ? 'sesli arama ile' : 'SMS/WhatsApp üzerinden'} size ulaşacaktır. İletişim: ${providerData.phone}`;
    
    // 2. Servis Sağlayıcıya Giden SMS
    const providerMsg = `[Sms-Contact] Yeni Talep (#${requestId})! Müşteri: ${reqData.contact_value}. İhtiyaç: "${reqData.raw_text}" ${reqData.disambiguation_choice ? `(${reqData.disambiguation_choice})` : ''}. Tercih Edilen Kanal: ${channel}.`;

    await pool.query(`
      INSERT INTO outbound_notifications (request_id, recipient_type, recipient_phone, channel, message_body)
      VALUES 
        ($1, 'USER', $2, 'SMS', $3),
        ($1, 'PROVIDER', $4, 'SMS', $5);
    `, [requestId, reqData.contact_value, userMsg, providerData.phone, providerMsg]);

    console.log(`📡 [SMS LOG SIMULATED] Request #${requestId} için kullanıcı ve sağlayıcı SMS'leri kaydedildi.`);
  } catch (err) {
    console.error('SMS loglama hatası:', err.message);
  }
};

// 1. Yeni Talep Oluşturma
const createRequest = async (req, res) => {
  try {
    const { rawText, disambiguationChoice, contactValue, preferredChannel } = req.body;

    if (!rawText || !contactValue) {
      return res.status(400).json({ status: 'error', message: 'Talep metni ve iletişim bilgisi zorunludur.' });
    }

    const textToAnalyze = (disambiguationChoice || rawText).toLowerCase();
    const tokens = textToAnalyze
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

    const { rows: activeProviders } = await pool.query(`
      SELECT id, name, phone, service_keywords, communication_channels, priority_score 
      FROM service_providers 
      WHERE is_active = TRUE 
      ORDER BY priority_score DESC, id ASC;
    `);

    let matchedProvider = null;

    if (activeProviders.length > 0) {
      for (const provider of activeProviders) {
        const keywords = (provider.service_keywords || []).map(k => k.toLowerCase().trim());
        const hasMatch = keywords.some(k => 
          tokens.includes(k) || 
          textToAnalyze.includes(k) ||
          k.split(/\s+/).every(part => textToAnalyze.includes(part))
        );

        if (hasMatch) {
          matchedProvider = provider;
          break;
        }
      }
    }

    const validMatchedId = (matchedProvider && Number.isInteger(Number(matchedProvider.id))) 
      ? Number(matchedProvider.id) 
      : null;
    
    const requestStatus = validMatchedId ? 'MATCHED' : 'MANUAL_INTERVENTION';

    const insertQuery = `
      INSERT INTO requests 
      (raw_text, disambiguation_choice, keywords, contact_value, preferred_channel, status, matched_provider_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      rawText.trim(),
      disambiguationChoice ? disambiguationChoice.trim() : null,
      tokens,
      contactValue.trim(),
      preferredChannel || 'PHONE',
      requestStatus,
      validMatchedId
    ];

    const { rows: savedRows } = await pool.query(insertQuery, values);
    const createdReq = savedRows[0];

    if (validMatchedId && matchedProvider) {
      // Çift taraflı SMS tetikle
      await triggerSimulatedNotifications(createdReq.id, createdReq, matchedProvider);

      const channels = matchedProvider.communication_channels || ['PHONE'];
      const channelUsed = channels.includes(preferredChannel) ? preferredChannel : channels[0];

      return res.status(201).json({
        status: 'success',
        message: `Talebiniz '${matchedProvider.name}' ile eşleştirildi. Bilgilendirme SMS'leri taraflara iletildi.`,
        matchedProvider: {
          id: matchedProvider.id,
          name: matchedProvider.name,
          phone: matchedProvider.phone,
          channelUsed: channelUsed
        },
        request: createdReq
      });
    } else {
      return res.status(201).json({
        status: 'success',
        message: 'Talebiniz alındı. Uygun servis sağlayıcı onaylandığında SMS ile bilgilendirileceksiniz.',
        matchedProvider: null,
        request: createdReq
      });
    }
  } catch (error) {
    console.error('Talep oluşturma hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 2. Bekleyen Talepler (WoZ)
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

// 3. Eşleşen & Süreçteki Talepler (Lifecycle Takibi)
const getMatchedRequests = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.raw_text,
        r.disambiguation_choice,
        r.contact_value,
        r.preferred_channel,
        r.status,
        r.created_at,
        r.updated_at,
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

// 4. Kullanıcının Kendi Talepleri
const getUserRequests = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ status: 'error', message: 'Telefon zorunludur.' });

    const query = `
      SELECT 
        r.id,
        r.raw_text,
        r.disambiguation_choice,
        r.contact_value,
        r.preferred_channel,
        r.status,
        r.created_at,
        p.name AS provider_name,
        p.phone AS provider_phone
      FROM requests r
      LEFT JOIN service_providers p ON r.matched_provider_id = p.id
      WHERE r.contact_value = $1
      ORDER BY r.created_at DESC;
    `;
    const { rows } = await pool.query(query, [phone.trim()]);
    res.status(200).json({ status: 'success', requests: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 5. Talep Yaşam Döngüsü Durum Güncelleme (ACCEPTED, COMPLETED, CANCELLED)
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

    res.status(200).json({
      status: 'success',
      message: `Talep durumu '${newStatus}' olarak güncellendi.`,
      request: rows[0]
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 6. Manuel Atama (WoZ)
const assignProviderManually = async (req, res) => {
  try {
    const { requestId, providerId } = req.body;
    const rId = parseInt(requestId, 10);
    const pId = parseInt(providerId, 10);

    const { rows: providerRows } = await pool.query(
      'SELECT id, name, phone FROM service_providers WHERE id = $1',
      [pId]
    );

    if (providerRows.length === 0) {
      return res.status(404).json({ status: 'error', message: `ID ${pId} olan sağlayıcı bulunamadı.` });
    }

    const updateQuery = `
      UPDATE requests
      SET matched_provider_id = $1, status = 'MATCHED', updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
    const { rows: updatedRows } = await pool.query(updateQuery, [pId, rId]);

    // SMS Simülasyonu Tetikle
    await triggerSimulatedNotifications(rId, updatedRows[0], providerRows[0]);

    res.status(200).json({
      status: 'success',
      message: `Talep '${providerRows[0].name}' sağlayıcısına atandı ve SMS logları oluşturuldu.`,
      request: updatedRows[0]
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 7. Giden SMS / Bildirim Loglarını Getir (YENİ)
const getOutboundNotifications = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        n.*,
        r.raw_text
      FROM outbound_notifications n
      LEFT JOIN requests r ON n.request_id = r.id
      ORDER BY n.created_at DESC
      LIMIT 100;
    `);

    res.status(200).json({
      status: 'success',
      notifications: rows
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  createRequest,
  getPendingRequests,
  getMatchedRequests,
  getUserRequests,
  updateRequestStatus,
  assignProviderManually,
  getOutboundNotifications
};