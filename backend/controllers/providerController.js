const { pool } = require('../config/db');

// 1. CREATE: Yeni Servis Veren Ekle
exports.registerProvider = async (req, res) => {
  try {
    const { name, phone, email, serviceKeywords, communicationChannels, priorityScore } = req.body;

    if (!name || !phone || !serviceKeywords || !communicationChannels) {
      return res.status(400).json({
        status: 'error',
        message: 'İsim, telefon, anahtar kelimeler ve iletişim kanalları zorunludur.'
      });
    }

    const insertQuery = `
      INSERT INTO service_providers 
      (name, phone, email, service_keywords, communication_channels, priority_score)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [
      name.trim(),
      phone.trim(),
      email ? email.trim() : null,
      serviceKeywords,
      communicationChannels,
      priorityScore || 100
    ];

    const { rows } = await pool.query(insertQuery, values);

    res.status(201).json({
      status: 'success',
      message: 'Servis veren başarıyla eklendi.',
      provider: rows[0]
    });
  } catch (error) {
    console.error('Servis veren ekleme hatası:', error.message);
    res.status(500).json({ status: 'error', message: 'Sunucu hatası.' });
  }
};

// 2. READ: Tüm Servis Verenleri Listele
exports.getProviders = async (req, res) => {
  try {
    const selectQuery = `
      SELECT * FROM service_providers 
      ORDER BY is_active DESC, priority_score DESC, created_at DESC;
    `;
    const { rows } = await pool.query(selectQuery);

    res.status(200).json({
      status: 'success',
      providers: rows
    });
  } catch (error) {
    console.error('Servis verenleri getirme hatası:', error.message);
    res.status(500).json({ status: 'error', message: 'Sunucu hatası.' });
  }
};

// 3. UPDATE: Servis Veren Güncelle
exports.updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, serviceKeywords, communicationChannels, priorityScore, isActive } = req.body;

    const updateQuery = `
      UPDATE service_providers
      SET 
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        service_keywords = COALESCE($4, service_keywords),
        communication_channels = COALESCE($5, communication_channels),
        priority_score = COALESCE($6, priority_score),
        is_active = COALESCE($7, is_active)
      WHERE id = $8
      RETURNING *;
    `;

    const values = [
      name ? name.trim() : null,
      phone ? phone.trim() : null,
      email !== undefined ? email : null,
      serviceKeywords || null,
      communicationChannels || null,
      priorityScore !== undefined ? priorityScore : null,
      isActive !== undefined ? isActive : null,
      id
    ];

    const { rows } = await pool.query(updateQuery, values);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Servis veren bulunamadı.' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Servis veren başarıyla güncellendi.',
      provider: rows[0]
    });
  } catch (error) {
    console.error('Servis veren güncelleme hatası:', error.message);
    res.status(500).json({ status: 'error', message: 'Sunucu hatası.' });
  }
};

// 4. DELETE: Servis Vereni Sil
exports.deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;

    // Taleplerdeki ilişkileri bozmamak için önce kontrol edebilir veya doğrudan silebiliriz
    const deleteQuery = `DELETE FROM service_providers WHERE id = $1 RETURNING *;`;
    const { rows } = await pool.query(deleteQuery, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Servis veren bulunamadı.' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Servis veren başarıyla silindi.'
    });
  } catch (error) {
    console.error('Servis veren silme hatası:', error.message);
    res.status(500).json({ status: 'error', message: 'Sunucu hatası veya ilişkili kayıt var.' });
  }
};