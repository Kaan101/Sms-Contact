const { pool } = require('../config/db');

// Çok anlamlılık kontrolü ve öneri listesi
exports.checkDisambiguation = async (req, res) => {
  try {
    const { queryText } = req.body;

    if (!queryText || queryText.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Arama metni gereklidir.' });
    }

    const normalizedText = queryText.toLowerCase().trim();

    // Veritabanındaki niyet tetikleyicilerini kontrol et
    const result = await pool.query(
      `SELECT * FROM disambiguations WHERE $1 ILIKE '%' || trigger_keyword || '%'`,
      [normalizedText]
    );

    if (result.rows.length > 0) {
      const match = result.rows[0];
      return res.status(200).json({
        status: 'ambiguous',
        triggerKeyword: match.trigger_keyword,
        message: `"${match.trigger_keyword}" için aradığınız hizmeti netleştirmek ister misiniz?`,
        options: match.options, // Örn: [{"id": 1, "text": "Paten sahası / pist rezervasyonu"}, {"id": 2, "text": "Paten ayakkabısı / ekipman"}]
        allowRawTextOption: true // "Yazdığım şekilde devam et" seçeneği
      });
    }

    // Belirsizlik yoksa doğrudan devam
    return res.status(200).json({
      status: 'clear',
      message: 'Belirsizlik tespit edilmedi, doğrudan eşleştirilebilir.'
    });

  } catch (error) {
    console.error('Niyet kontrol hatası:', error.message);
    res.status(500).json({ status: 'error', message: 'Sunucu hatası oluştu.' });
  }
};