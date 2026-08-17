const { pool } = require('../config/db');

// Yeni Servis Veren Kaydı
exports.registerProvider = async (req, res) => {
  try {
    const { name, phone, email, serviceKeywords, communicationChannels, priorityScore } = req.body;

    if (!name || !phone || !serviceKeywords || !Array.isArray(serviceKeywords)) {
      return res.status(400).json({ status: 'error', message: 'İsim, telefon ve anahtar kelime listesi zorunludur.' });
    }

    // Anahtar kelimeleri küçük harfe çevirip normalize edelim
    const normalizedKeywords = serviceKeywords.map(k => k.toLowerCase().trim());
    const channels = communicationChannels && communicationChannels.length > 0 ? communicationChannels : ['PHONE'];

    const insertQuery = `
      INSERT INTO providers (name, phone, email, service_keywords, communication_channels, priority_score)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [name, phone, email || null, normalizedKeywords, channels, priorityScore || 100];
    const { rows } = await pool.query(insertQuery, values);

    res.status(201).json({
      status: 'success',
      message: 'Servis veren başarıyla kaydedildi.',
      provider: rows[0]
    });
  } catch (error) {
    console.error('Servis veren kayıt hatası:', error.message);
    res.status(500).json({ status: 'error', message: 'Sunucu hatası.' });
  }
};

// Tüm Servis Verenleri Listele (Admin/Test için)
exports.getProviders = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM providers ORDER BY priority_score DESC');
    res.status(200).json({ status: 'success', providers: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};