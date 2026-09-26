const { pool } = require('../config/db');

const getSettings = async (req, res) => {
  try {
    // 1. Tablo yoksa oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value VARCHAR(255),
        description TEXT
      );
    `);
    
    // 2. MOBOOL Standardı: Frontend ile birebir eşleşen güncel seed dataları
    const defaultSettings = [
      { key: 'pool_lifespan_hours', value: '72', desc: 'Havuz Yaşam Süresi (Saat)' },
      { key: 'customer_selection_timeout_mins', value: '60', desc: 'Müşteri Seçim Süresi (Dakika)' },
      { key: 'provider_completion_timeout_hours', value: '48', desc: 'İş Teslimat Süresi (Saat)' },
      { key: 'customer_approval_timeout_hours', value: '24', desc: 'Otomatik Onay Süresi (Saat)' },
      // Eski sistemden kalanlar (Geriye dönük uyumluluk için tutabiliriz veya silebiliriz)
      { key: 'default_deadline_days', value: '10', desc: 'Son tarihi belirlenmemiş talepler (gün)' }
    ];

    for (const item of defaultSettings) {
      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value, description) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (setting_key) DO NOTHING;`,
        [item.key, item.value, item.desc]
      );
    }

    // 3. Mevcut tüm ayarları getir
    const { rows } = await pool.query(`SELECT * FROM system_settings`);
    
    // Frontend numeric beklediği için isNaN kontrolü ile sayılara cast ediyoruz
    const settingsObj = {};
    rows.forEach(r => { 
      settingsObj[r.setting_key] = isNaN(r.setting_value) ? r.setting_value : Number(r.setting_value); 
    });
    
    res.status(200).json({ status: 'success', settings: settingsObj });
  } catch (error) {
    console.error("Settings Get Error:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key) {
      return res.status(400).json({ status: 'error', message: 'Setting key is required.' });
    }

    // MOBOOL Enterprise Yaklaşımı: UPSERT
    // Eğer setting_key veritabanında yoksa INSERT yapar, varsa mevcut olanı UPDATE eder.
    // Bu sayede arayüzden yeni bir parametre gönderildiğinde "sessiz hata" (0 rows updated) oluşmaz.
    const query = `
      INSERT INTO system_settings (setting_key, setting_value) 
      VALUES ($1, $2)
      ON CONFLICT (setting_key) 
      DO UPDATE SET setting_value = EXCLUDED.setting_value
      RETURNING *;
    `;
    
    const { rows } = await pool.query(query, [key, String(value)]);
    
    res.status(200).json({ status: 'success', data: rows[0] });
  } catch (error) {
    console.error("Settings Update Error:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getSettings, updateSetting };