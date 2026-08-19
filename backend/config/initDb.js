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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    // 3. Foreign key onarımı
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

    // 4. Giden SMS Bildirim Log Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS outbound_notifications (
        id SERIAL PRIMARY KEY,
        request_id INTEGER REFERENCES requests(id) ON DELETE CASCADE,
        recipient_type VARCHAR(20) NOT NULL,
        recipient_phone VARCHAR(50) NOT NULL,
        channel VARCHAR(20) NOT NULL DEFAULT 'SMS',
        message_body TEXT NOT NULL,
        sent_status VARCHAR(20) DEFAULT 'DELIVERED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. OTP Tablosu
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

    // 6. Proje Özellikleri Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_features (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        target_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'BEKLİYOR',
        priority VARCHAR(50) NOT NULL DEFAULT 'ORTA',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Değerlendirme & Yorum Tablosu (Güvenli Unique Constraint ile)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        request_id INTEGER REFERENCES requests(id) ON DELETE CASCADE,
        reviewer_type VARCHAR(20) NOT NULL,
        rating INTEGER,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_request_reviewer'
        ) THEN
          ALTER TABLE reviews ADD CONSTRAINT unique_request_reviewer UNIQUE(request_id, reviewer_type);
        END IF;
      END $$;
    `);

    // Sequence Eşitlemeleri
    await pool.query(`
      SELECT setval(pg_get_serial_sequence('service_providers', 'id'), COALESCE((SELECT MAX(id) FROM service_providers), 1), true);
    `);
    await pool.query(`
      SELECT setval(pg_get_serial_sequence('requests', 'id'), COALESCE((SELECT MAX(id) FROM requests), 1), true);
    `);
    await pool.query(`
      SELECT setval(pg_get_serial_sequence('project_features', 'id'), COALESCE((SELECT MAX(id) FROM project_features), 1), true);
    `);
    await pool.query(`
      SELECT setval(pg_get_serial_sequence('reviews', 'id'), COALESCE((SELECT MAX(id) FROM reviews), 1), true);
    `);

    console.log('✅ Veritabanı ve durum geçişleri hazırlandı.');
  } catch (error) {
    console.error('❌ Tablo başlatma hatası:', error.message);
  }
};

module.exports = initDatabase;