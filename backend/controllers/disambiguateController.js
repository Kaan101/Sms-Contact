const { pool } = require('../config/db');

const checkDisambiguation = async (req, res) => {
  try {
    const { queryText } = req.body;

    if (!queryText || queryText.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Sorgu metni boş olamaz.' });
    }

    const cleanText = queryText.trim().toLowerCase();

    let dictRows = [];
    try {
      const result = await pool.query('SELECT * FROM disambiguation_dictionary;');
      dictRows = result.rows;
    } catch (dbErr) {
      dictRows = [];
    }

    const matchedRule = dictRows.find(row => cleanText.includes(row.trigger_keyword.toLowerCase()));

    if (matchedRule) {
      return res.status(200).json({
        status: 'ambiguous',
        triggerKeyword: matchedRule.trigger_keyword,
        message: matchedRule.clarification_message,
        options: matchedRule.options
      });
    }

    return res.status(200).json({
      status: 'clear',
      message: 'Metin net.'
    });
  } catch (error) {
    console.error('Disambiguation hatası:', error);
    return res.status(200).json({
      status: 'clear',
      message: 'Doğrudan devam ediliyor.'
    });
  }
};

module.exports = {
  checkDisambiguation
};