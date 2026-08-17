const { pool } = require('./db');

const initDatabase = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS providers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255),
      service_keywords TEXT[] NOT NULL,
      communication_channels TEXT[] NOT NULL,
      priority_score INT DEFAULT 100,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS requests (
      id SERIAL PRIMARY KEY,
      raw_text TEXT NOT NULL,
      disambiguation_choice VARCHAR(255),
      keywords TEXT[],
      contact_value VARCHAR(255) NOT NULL,
      preferred_channel VARCHAR(50) DEFAULT 'PHONE',
      status VARCHAR(50) DEFAULT 'PENDING',
      matched_provider_id INT REFERENCES providers(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS disambiguations (
      id SERIAL PRIMARY KEY,
      trigger_keyword VARCHAR(100) UNIQUE NOT NULL,
      options JSONB NOT NULL
    );

    -- Örnek Çok Anlamlılık Verisi Ekle (Varsa atla)
    INSERT INTO disambiguations (trigger_keyword, options)
    VALUES (
      'buz pateni',
      '[{"id": 1, "text": "Buz pateni sahası / pist rezervasyonu"}, {"id": 2, "text": "Buz pateni ayakkabısı / ekipman satışı"}]'::jsonb
    )
    ON CONFLICT (trigger_keyword) DO NOTHING;
  `;

  try {
    if (!process.env.DATABASE_URL) return;
    await pool.query(queryText);
    console.log('PostgreSQL tabloları ve örnek niyet sözlüğü hazırlandı.');
  } catch (err) {
    console.error('Tablo başlatma hatası:', err.message);
  }
};

module.exports = initDatabase;