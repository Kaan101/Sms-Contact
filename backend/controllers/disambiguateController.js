const { pool } = require('../config/db');

const checkDisambiguation = async (req, res) => {
  try {
    const { queryText } = req.body;

    if (!queryText) {
      return res.status(400).json({ status: 'error', message: 'queryText zorunludur.' });
    }

    const text = queryText.toLowerCase().trim();

    const { rows } = await pool.query('SELECT * FROM disambiguation_dictionary');

    let matchedItem = null;
    for (const item of rows) {
      if (text.includes(item.trigger_keyword.toLowerCase())) {
        matchedItem = item;
        break;
      }
    }

    if (matchedItem) {
      return res.status(200).json({
        status: 'ambiguous',
        triggerKeyword: matchedItem.trigger_keyword,
        message: matchedItem.clarification_message,
        options: matchedItem.options
      });
    }

    return res.status(200).json({
      status: 'clear',
      message: 'Netleştirme gerekmiyor.'
    });
  } catch (error) {
    console.error('Niyet kontrol hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

module.exports = {
  checkDisambiguation
};