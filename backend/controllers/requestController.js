const { pool } = require('../config/db');

// 1. Yeni Talep Oluşturma ve Kural Tabanlı Eşleştirme
exports.createRequest = async (req, res) => {
  try {
    const { rawText, disambiguationChoice, contactValue, preferredChannel } = req.body;

    if (!rawText || !contactValue) {
      return res.status(400).json({ status: 'error', message: 'Metin ve iletişim bilgisi zorunludur.' });
    }

    const textToAnalyze = (disambiguationChoice || rawText).toLowerCase();
    const tokens = textToAnalyze
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

    // Servis verenleri puan sırasına göre al
    const { rows: providers } = await pool.query(`
      SELECT * FROM service_providers 
      WHERE is_active = TRUE 
      ORDER BY priority_score DESC;
    `);

    let matchedProvider = null;
    for (const provider of providers) {
      const keywords = (provider.service_keywords || []).map(k => k.toLowerCase());
      const hasMatch = keywords.some(k => tokens.includes(k) || textToAnalyze.includes(k));
      if (hasMatch) {
        matchedProvider = provider;
        break;
      }
    }

    const status = matchedProvider ? 'MATCHED' : 'MANUAL_INTERVENTION';
    const matchedId = matchedProvider ? matchedProvider.id : null;

    const insertQuery = `
      INSERT INTO requests 
      (raw_text, disambiguation_choice, keywords, contact_value, preferred_channel, status, matched_provider_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const { rows: savedRows } = await pool.query(insertQuery, [
      rawText,
      disambiguationChoice || null,
      tokens,
      contactValue,
      preferredChannel || 'PHONE',
      status,
      matchedId
    ]);

    const createdReq = savedRows[0];

    if (matchedProvider) {
      const channels = matchedProvider.communication_channels || ['PHONE'];
      const channelUsed = channels.includes(preferredChannel) ? preferredChannel : channels[0];
      return res.status(201).json({
        status: 'success',
        message: `Talebiniz '${matchedProvider.name}' ile eşleştirildi. En kısa sürede ${channelUsed} üzerinden iletişime geçilecek.`,
        matchedProvider: {
          name: matchedProvider.name,
          phone: matchedProvider.phone,
          channelUsed: channelUsed
        },
        request: createdReq
      });
    } else {
      return res.status(201).json({
        status: 'success',
        message: 'Talebiniz alındı. Uygun servis sağlayıcı onaylandığında sizinle iletişime geçilecektir.',
        matchedProvider: null,
        request: createdReq
      });
    }
  } catch (error) {
    console.error('Talep oluşturma hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 2. Bekleyen / Müdahale Gerektiren Talepleri Getir
exports.getPendingRequests = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM requests 
      WHERE status = 'MANUAL_INTERVENTION' OR status = 'PENDING'
      ORDER BY created_at DESC;
    `);

    res.status(200).json({
      status: 'success',
      requests: rows
    });
  } catch (error) {
    console.error('Bekleyen talepleri getirme hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 3. Operatörün Talebi Belirli Bir Servis Verene Manuel Ataması (DÜZELTİLDİ)
exports.assignProviderManually = async (req, res) => {
  try {
    const { requestId, providerId } = req.body;

    if (!requestId || !providerId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Talep ID (requestId) ve Servis Veren ID (providerId) zorunludur.' 
      });
    }

    const rId = parseInt(requestId, 10);
    const pId = parseInt(providerId, 10);

    const updateQuery = `
      UPDATE requests
      SET matched_provider_id = $1,
          status = 'MATCHED'
      WHERE id = $2
      RETURNING *;
    `;

    const { rows } = await pool.query(updateQuery, [pId, rId]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Talep kaydı bulunamadı.' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Talep başarıyla servis verene atandı.',
      request: rows[0]
    });
  } catch (error) {
    console.error('Manuel atama hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};