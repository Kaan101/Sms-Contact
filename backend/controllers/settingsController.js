// backend/controllers/settingsController.js
const { pool } = require('../config/db');

const getSettings = async (req, res) => {
  try {
    // 1. Tablo yoksa otomatik oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value VARCHAR(255),
        description TEXT
      );
    `);
    
    // 2. Varsayılan değişkeni ekle (Eğer daha önce eklenmemişse)
    await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value, description) 
      VALUES ('default_deadline_days', '10', 'Son tarihi belirlenmemiş talepler için varsayılan bekleme süresi (gün)')
      ON CONFLICT (setting_key) DO NOTHING;
    `);

    // 3. Ayarları getir
    const { rows } = await pool.query(`SELECT * FROM system_settings`);
    
    // Frontend'in kolay okuması için key-value objesine çevir
    const settingsObj = {};
    rows.forEach(r => { settingsObj[r.setting_key] = r.setting_value; });
    
    res.status(200).json({ status: 'success', settings: settingsObj });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    await pool.query(
      `UPDATE system_settings SET setting_value = $1 WHERE setting_key = $2`,
      [String(value), key]
    );
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getSettings, updateSetting };