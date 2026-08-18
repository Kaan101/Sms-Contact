const { pool } = require('../config/db');

exports.createRequest = async (req, res) => {
  try {
    const { rawText, disambiguationChoice, contactValue, preferredChannel } = req.body;

    if (!rawText || !contactValue) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Talep metni ve iletişim bilgisi zorunludur.' 
      });
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
      const channels = matchedProvider.communication_channels || ['PHONE'];
      const channelUsed = channels.includes(preferredChannel) ? preferredChannel : channels[0];

      return res.status(201).json({
        status: 'success',
        message: `Talebiniz '${matchedProvider.name}' ile eşleştirildi. En kısa sürede ${channelUsed} üzerinden iletişime geçilecektir.`,
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

exports.assignProviderManually = async (req, res) => {
  try {
    const { requestId, providerId } = req.body;

    if (!requestId || !providerId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Talep ID ve Servis Sağlayıcı ID zorunludur.' 
      });
    }

    const rId = parseInt(requestId, 10);
    const pId = parseInt(providerId, 10);

    const { rows: providerRows } = await pool.query(
      'SELECT id, name FROM service_providers WHERE id = $1',
      [pId]
    );

    if (providerRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `ID ${pId} olan sağlayıcı bulunamadı.`
      });
    }

    const updateQuery = `
      UPDATE requests
      SET matched_provider_id = $1,
          status = 'MATCHED'
      WHERE id = $2
      RETURNING *;
    `;

    const { rows: updatedRows } = await pool.query(updateQuery, [pId, rId]);

    if (updatedRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Talep bulunamadı.' });
    }

    res.status(200).json({
      status: 'success',
      message: `Talep '${providerRows[0].name}' sağlayıcısına atandı.`,
      request: updatedRows[0]
    });
  } catch (error) {
    console.error('Manuel atama hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};