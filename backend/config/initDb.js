const { pool } = require('./db');

const initDatabase = async () => {
  try {
    // 1. Servis Verenler Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_providers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        service_keywords TEXT[] NOT NULL,
        communication_channels TEXT[] NOT NULL DEFAULT ARRAY['PHONE'],
        priority_score INTEGER DEFAULT 100,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. OTP Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(50) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Kullanıcı Talepleri Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        raw_text TEXT NOT NULL,
        disambiguation_choice TEXT,
        keywords TEXT[],
        contact_value VARCHAR(100) NOT NULL,
        preferred_channel VARCHAR(50) NOT NULL DEFAULT 'PHONE',
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        matched_provider_id INTEGER REFERENCES service_providers(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Niyet Netleştirme Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS disambiguation_dictionary (
        id SERIAL PRIMARY KEY,
        trigger_keyword VARCHAR(100) NOT NULL UNIQUE,
        clarification_message TEXT NOT NULL,
        options JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Örnek Niyet
    await pool.query(`
      INSERT INTO disambiguation_dictionary (trigger_keyword, clarification_message, options)
      VALUES (
        'buz pateni',
        '"buz pateni" için aradığınız hizmeti netleştirmek ister misiniz?',
        '[{"id": 1, "text": "Buz pateni sahası / pist rezervasyonu"}, {"id": 2, "text": "Buz pateni ayakkabısı / ekipman satışı"}]'::jsonb
      )
      ON CONFLICT (trigger_keyword) DO NOTHING;
    `);

    console.log('✅ PostgreSQL tabloları ve OTP sistemi hazır.');
  } catch (error) {
    console.error('⚠️ Tablo hazırlık uyarısı:', error.message);
  }
};

module.exports = initDatabase;