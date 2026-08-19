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
        location VARCHAR(255) DEFAULT 'İstanbul, Türkiye',
        is_urgent BOOLEAN DEFAULT FALSE,
        deadline_datetime TIMESTAMP WITH TIME ZONE,
        preferred_channel VARCHAR(50) NOT NULL DEFAULT 'PHONE',
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        matched_provider_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE requests ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT 'İstanbul, Türkiye';
      ALTER TABLE requests ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;
      ALTER TABLE requests ADD COLUMN IF NOT EXISTS deadline_datetime TIMESTAMP WITH TIME ZONE;
      ALTER TABLE requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;
      ALTER TABLE requests DROP CONSTRAINT IF EXISTS check_status;
    `);

    // 3. Foreign key güvenli onarım
    await pool.query(`
      ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_matched_provider_id_fkey;
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
        request_id INTEGER,
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

    // 7. Değerlendirme & Yorum Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL,
        reviewer_type VARCHAR(20) NOT NULL,
        rating INTEGER,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_req_reviewer ON reviews (request_id, reviewer_type);
    `);

    // 8. Test Senaryoları Tablosu (Sistem QA Suite)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        tester_name VARCHAR(100) DEFAULT 'Admin/Tester',
        test_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50) DEFAULT 'BEKLİYOR', -- 'BEKLİYOR', 'BAŞARILI', 'BAŞARISIZ'
        result_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Otomatik 10 Kapsamlı Test Senaryosu Yükle (Eğer tablo boşsa)
    const { rowCount: testCount } = await pool.query('SELECT id FROM test_cases LIMIT 1;');
    if (testCount === 0) {
      await pool.query(`
        INSERT INTO test_cases (title, description, tester_name, status, result_notes) VALUES 
        ('TC-01: Doğal Dil Talep Ayrıştırma', 'Kullanıcının yazdığı metin tokenlara ayrılarak uygun anahtar kelimelerle eşleşiyor mu?', 'İTÜ Test Ekibi', 'BEKLİYOR', 'Beklenen: Otomatik MATCHED statüsü.'),
        ('TC-02: Mevcut Konum Tespiti', 'Tarayıcı Geolocation API üzerinden anlık konum alınıp talep alanına yazılıyor mu?', 'İTÜ Test Ekibi', 'BEKLİYOR', 'Beklenen: İlçe/Şehir formatında dolum.'),
        ('TC-03: Acil Hizmet Checkbox Doğrulaması', 'Acil checkbox işaretlendiğinde SMS logunda [🔥 ACİL] etiketi yer alıyor mu?', 'İTÜ Test Ekibi', 'BEKLİYOR', 'Beklenen: SMS gövdesinde aciliyet bilgisi.'),
        ('TC-04: En Son Tarih & Saat Entegrasyonu', 'Seçilen tarih ve saat ISO formatında deadline_datetime kolonuna kaydediliyor mu?', 'İTÜ Test Ekibi', 'BEKLİYOR', 'Beklenen: Tarih-saat eşzamanlı kayıt.'),
        ('TC-05: Sağlayıcı Bildirim ve Kabul Akışı', 'Sağlayıcı talebi ACCEPTED yaptığında kullanıcıya bilgilendirme SMSi loglanıyor mu?', 'İTÜ Test Ekibi', 'BEKLİYOR', 'Beklenen: PROVIDER ve USER SMS logları.'),
        ('TC-06: Hizmet Teslim Gate Kontrolü', 'Sağlayıcı PROVIDER_COMPLETED yaptığında müşteri ekranında onay butonu beliriyor mu?', 'İTÜ Test Ekibi', 'BEKLİYOR', 'Beklenen: Müşteri onay butonu tetiklenir.'),
        ('TC-07: Müşteri Onay ve Review (5 Yıldız)', 'Müşteri hizmeti onaylayıp yıldız verdiğinde puan ve yorum veritabanına yazılıyor mu?', 'İTÜ Test Ekibi', 'BEKLİYOR', 'Beklenen: reviews tablosu INSERT.'),
        ('TC-08: Sağlayıcı Müşteri Puanlama', 'Sağlayıcı işi teslim ettikten sonra müşteri deneyimini 5 yıldızla puanlayabiliyor mu?', 'İTÜ Test Ekibi', 'BEKLİYOR', 'Beklenen: Sağlayıcı review kaydı.'),
        ('TC-09: Çift Taraflı SMS Günlüğü', 'Tüm durum geçişlerinde outbound_notifications tablosuna tarihli SMS düşüyor mu?', 'İTÜ Test Ekibi', 'BEKLİYOR', 'Beklenen: 5 saniyede bir canlı akış.'),
        ('TC-10: Geçmiş Talep Collapsed Düzeni', 'İncelemesi tamamlanan işler Geçmiş Talepler altına collapsed ve kapalı olarak iniyor mu?', 'İTÜ Test Ekibi', 'BEKLİYOR', 'Beklenen: Temiz aktif liste.');
      `);
    }

    // Sequence Eşitlemeleri
    await pool.query(`
      SELECT setval(pg_get_serial_sequence('service_providers', 'id'), COALESCE((SELECT MAX(id) FROM service_providers), 1), true);
      SELECT setval(pg_get_serial_sequence('requests', 'id'), COALESCE((SELECT MAX(id) FROM requests), 1), true);
      SELECT setval(pg_get_serial_sequence('project_features', 'id'), COALESCE((SELECT MAX(id) FROM project_features), 1), true);
      SELECT setval(pg_get_serial_sequence('reviews', 'id'), COALESCE((SELECT MAX(id) FROM reviews), 1), true);
      SELECT setval(pg_get_serial_sequence('test_cases', 'id'), COALESCE((SELECT MAX(id) FROM test_cases), 1), true);
    `);

    console.log('✅ Veritabanı ve Test Senaryoları (QA Suite) hazırlandı.');
  } catch (error) {
    console.error('❌ Tablo başlatma hatası:', error.message);
  }
};

module.exports = initDatabase;