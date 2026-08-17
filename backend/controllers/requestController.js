const { pool } = require('../config/db');

// Talep Oluştur ve Eşleştir
exports.createRequest = async (req, res) => {
  try {
    const { rawText, disambiguationChoice, contactValue, preferredChannel } = req.body;

    if (!rawText || !contactValue) {
      return res.status(400).json({ status: 'error', message: 'Talep metni ve iletişim bilgisi zorunludur.' });
    }

    // 1. Arama için anahtar kelimeleri çıkar
    const fullText = disambiguationChoice ? `${rawText} ${disambiguationChoice}` : rawText;
    const searchTokens = fullText.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    // 2. Akıllı Eşleştirme Sorgusu (Öncelik Puanına göre sıralı)
    // Servis verenin anahtar kelimeleri aranan kelimelerle kesişiyor mu?
    const matchQuery = `
      SELECT * FROM providers
      WHERE is_active = TRUE
        AND service_keywords && $1::text[]
      ORDER BY priority_score DESC
      LIMIT 1;
    `;

    const { rows: matchedProviders } = await pool.query(matchQuery, [searchTokens]);

    let requestStatus = 'PENDING';
    let matchedProvider = null;

    if (matchedProviders.length > 0) {
      // Eşleşme bulundu
      matchedProvider = matchedProviders[0];
      requestStatus = 'MATCHED';
    } else {
      // Eşleşme bulunamadı -> Wizard of Oz (Manuel Müdahale Havuzu)
      requestStatus = 'MANUAL_INTERVENTION';
    }

    // 3. Kanal Seçimi ve Aciliyet Optimizasyonu
    let finalChannel = preferredChannel || 'PHONE';
    if (fullText.includes('pizza') || fullText.includes('çilingir') || fullText.includes('acil')) {
      finalChannel = 'PHONE'; // Acil ihtiyaçlar her zaman telefona öncelik verir
    }

    // 4. Talebi Veritabanına Kaydet
    const insertRequestQuery = `
      INSERT INTO requests (raw_text, disambiguation_choice, keywords, contact_value, preferred_channel, status, matched_provider_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const { rows: requestRows } = await pool.query(insertRequestQuery, [
      rawText,
      disambiguationChoice || null,
      searchTokens,
      contactValue,
      finalChannel,
      requestStatus,
      matchedProvider ? matchedProvider.id : null
    ]);

    const createdRequest = requestRows[0];

    // 5. Yanıtı Döndür
    if (requestStatus === 'MATCHED') {
      return res.status(201).json({
        status: 'success',
        message: 'Talebiniz başarıyla oluşturuldu ve en uygun servis verenle eşleştirildi!',
        request: createdRequest,
        matchedProvider: {
          name: matchedProvider.name,
          priorityScore: matchedProvider.priority_score,
          channelUsed: finalChannel
        }
      });
    } else {
      return res.status(201).json({
        status: 'success',
        message: 'Talebiniz alındı. En uygun servis veren sizinle kısa süre içinde iletişime geçecektir (Manuel Destek Devrede).',
        request: createdRequest,
        isManualIntervention: true
      });
    }

  } catch (error) {
    console.error('Talep oluşturma hatası:', error.message);
    res.status(500).json({ status: 'error', message: 'Sunucu hatası.' });
  }
};

// Bekleyen ve Manuel Müdahale Gerektiren Talepleri Listele (Admin Paneli için)
exports.getPendingRequests = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM requests WHERE status IN ('PENDING', 'MANUAL_INTERVENTION') ORDER BY created_at DESC`
    );
    res.status(200).json({ status: 'success', requests: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Operatörün talebi belirli bir servis verene manuel ataması
exports.assignProviderManually = async (req, res) => {
  try {
    const { requestId, providerId } = req.body;

    if (!requestId || !providerId) {
      return res.status(400).json({ status: 'error', message: 'Talep ID ve Servis Veren ID zorunludur.' });
    }

    const updateQuery = `
      UPDATE requests
      SET matched_provider_id = $1,
          status = 'MATCHED'
      WHERE id = $2
      RETURNING *;
    `;

    const { rows } = await pool.query(updateQuery, [providerId, requestId]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Talep bulunamadı.' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Talep başarıyla servis verene atandı.',
      request: rows[0]
    });
  } catch (error) {
    console.error('Manuel atama hatası:', error.message);
    res.status(500).json({ status: 'error', message: 'Sunucu hatası.' });
  }
};