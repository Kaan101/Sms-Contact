const { pool } = require('../config/db');

// 1. Yeni Servis Veren Ekleme
const registerProvider = async (req, res) => {
  try {
    const { name, phone, email, serviceKeywords, communicationChannels, priorityScore } = req.body;

    if (!name || !phone || !serviceKeywords || !communicationChannels) {
      return res.status(400).json({
        status: 'error',
        message: 'İsim, telefon, anahtar kelimeler ve iletişim kanalları zorunludur.'
      });
    }

    const keywordsArray = Array.isArray(serviceKeywords) 
      ? serviceKeywords 
      : serviceKeywords.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

    const channelsArray = Array.isArray(communicationChannels)
      ? communicationChannels
      : ['PHONE'];

    const insertQuery = `
      INSERT INTO service_providers 
      (name, phone, email, service_keywords, communication_channels, priority_score)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [
      name.trim(),
      phone.trim(),
      email && email.trim() !== '' ? email.trim() : null,
      keywordsArray,
      channelsArray,
      parseInt(priorityScore, 10) || 100
    ];

    const { rows } = await pool.query(insertQuery, values);

    res.status(201).json({
      status: 'success',
      message: 'Servis veren başarıyla eklendi.',
      provider: rows[0]
    });
  } catch (error) {
    console.error('Servis veren ekleme hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 2. Tüm Servis Verenleri Getirme
const getProviders = async (req, res) => {
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
    console.error('Servis verenleri getirme hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 3. Telefon Numarasına Göre Sağlayıcı Bilgisi Getir (Sağlayıcı Girişi İçin)
const getProviderByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ status: 'error', message: 'Telefon parametresi zorunludur.' });

    const { rows } = await pool.query('SELECT * FROM service_providers WHERE phone = $1 LIMIT 1', [phone.trim()]);

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'not_found',
        message: 'Bu telefon numarasıyla kayıtlı servis sağlayıcı bulunamadı.'
      });
    }

    res.status(200).json({
      status: 'success',
      provider: rows[0]
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. Servis Veren Güncelleme
const updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, serviceKeywords, communicationChannels, priorityScore, isActive } = req.body;

    const keywordsArray = serviceKeywords ? (
      Array.isArray(serviceKeywords) 
        ? serviceKeywords 
        : serviceKeywords.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    ) : null;

    const channelsArray = communicationChannels ? (
      Array.isArray(communicationChannels) 
        ? communicationChannels 
        : ['PHONE']
    ) : null;

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
      email !== undefined ? (email && email.trim() !== '' ? email.trim() : null) : null,
      keywordsArray,
      channelsArray,
      priorityScore !== undefined ? parseInt(priorityScore, 10) : null,
      isActive !== undefined ? isActive : null,
      id
    ];

    const { rows } = await pool.query(updateQuery, values);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Servis veren bulunamadı.' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profil başarıyla güncellendi.',
      provider: rows[0]
    });
  } catch (error) {
    console.error('Servis veren güncelleme hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 5. Servis Veren Silme
const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('UPDATE requests SET matched_provider_id = NULL WHERE matched_provider_id = $1;', [id]);
    const { rows } = await pool.query('DELETE FROM service_providers WHERE id = $1 RETURNING *;', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Servis veren bulunamadı.' });
    }

    res.status(200).json({ status: 'success', message: 'Servis veren silindi.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  registerProvider,
  getProviders,
  getProviderByPhone,
  updateProvider,
  deleteProvider
};