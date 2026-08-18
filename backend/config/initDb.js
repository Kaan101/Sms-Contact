const { pool } = require('./db');

const initDatabase = async () => {
  try {
    // 1. service_providers tablosu
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

    // 2. requests tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        raw_text TEXT NOT NULL,
        disambiguation_choice TEXT,
        keywords TEXT[],
        contact_value VARCHAR(100) NOT NULL,
        preferred_channel VARCHAR(50) NOT NULL DEFAULT 'PHONE',
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        matched_provider_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. OTP tablosu
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

    // 4. KRİTİK ADIM: Eski/Bozuk Foreign Key Kısıtını Kaldır ve Doğru Tabloya Yeniden Bağla
    await pool.query(`
      ALTER TABLE requests 
      DROP CONSTRAINT IF EXISTS requests_matched_provider_id_fkey;
    `);

    await pool.query(`
      ALTER TABLE requests 
      ADD CONSTRAINT requests_matched_provider_id_fkey 
      FOREIGN KEY (matched_provider_id) 
      REFERENCES service_providers(id) 
      ON DELETE SET NULL;
    `);

    // 5. Sequence Sayacını Gerçek En Büyük ID'ye Senkronize Et
    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('service_providers', 'id'),
        COALESCE((SELECT MAX(id) FROM service_providers), 1),
        true
      );
    `);

    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('requests', 'id'),
        COALESCE((SELECT MAX(id) FROM requests), 1),
        true
      );
    `);

    // 6. Niyet Netleştirme Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS disambiguation_dictionary (
        id SERIAL PRIMARY KEY,
        trigger_keyword VARCHAR(100) NOT NULL UNIQUE,
        clarification_message TEXT NOT NULL,
        options JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ PostgreSQL Foreign Key referansları ve Sequence sayaçları sıfırlanıp onarıldı.');
  } catch (error) {
    console.error('❌ Tablo/Constraint onarım hatası:', error.message);
  }
};

module.exports = initDatabase;