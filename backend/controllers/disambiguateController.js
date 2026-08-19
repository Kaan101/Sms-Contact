const { pool } = require('../config/db');

// Metni analiz eder ve gerekirse netleştirme seçenekleri döner
const checkDisambiguation = async (req, res) => {
  try {
    const { queryText } = req.body;

    if (!queryText || queryText.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Sorgu metni boş olamaz.' });
    }

    const cleanText = queryText.trim().toLowerCase();

    // Sözlük tablosunun varlığını ve verileri güvenle sorgula
    let dictRows = [];
    try {
      const result = await pool.query('SELECT * FROM disambiguation_dictionary;');
      dictRows = result.rows;
    } catch (dbErr) {
      // Tablo henüz yoksa veya boşsa pas geç
      dictRows = [];
    }

    // Eşleşen bir tetikleyici kelime var mı?
    const matchedRule = dictRows.find(row => cleanText.includes(row.trigger_keyword.toLowerCase()));

    if (matchedRule) {
      return res.status(200).json({
        status: 'ambiguous',
        triggerKeyword: matchedRule.trigger_keyword,
        message: matchedRule.clarification_message,
        options: matchedRule.options // JSONB formatında seçenekler
      });
    }

    // Belirsizlik yoksa doğrudan devam edebilir
    return res.status(200).json({
      status: 'clear',
      message: 'Metin net, doğrudan eşleştirmeye geçilebilir.'
    });
  } catch (error) {
    console.error('Disambiguation hatası:', error);
    // Hata durumunda akışın kesilmemesi için clear dönüyoruz ki talep doğrudan oluşturulabilsin
    return res.status(200).json({
      status: 'clear',
      message: 'Doğrudan işleme devam ediliyor.'
    });
  }
};

module.exports = {
  checkDisambiguation
};