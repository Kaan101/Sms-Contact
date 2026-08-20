const { pool } = require('./db');

const initial100Providers = [
  // 1. Su & Damacana Dağıtım (10 Adet)
  ["Erikli Su Kadıköy Bayi", "+905321010001", "kadikoy@eriklibayi.com", ["su", "damacana", "erikli", "su siparişi", "kadıköy", "damacana su", "içme suyu", "sucu"], ["PHONE", "SMS"], 105],
  ["Saka Su Moda Dağıtım", "+905321010002", "moda@sakabayisi.com", ["su", "damacana", "saka", "moda", "kadıköy", "su siparişi", "ph", "doğal kaynak suyu"], ["PHONE", "SMS"], 100],
  ["Hamidiye Su Üsküdar", "+905321010003", "uskudar@hamidiyesu.com", ["su", "damacana", "hamidiye", "üsküdar", "içme suyu", "cam damacana", "sucu"], ["PHONE", "SMS"], 98],
  ["Kuzeyden Su Ataşehir", "+905321010004", "atasehir@kuzeyden.com", ["su", "damacana", "kuzeyden", "ataşehir", "su siparişi", "damacana su", "cam şişe"], ["PHONE", "SMS"], 95],
  ["Pınar Su Beşiktaş", "+905321010005", "besiktas@pinarsu.com", ["su", "damacana", "pınar", "beşiktaş", "levent", "su siparişi", "sucu"], ["PHONE", "SMS"], 94],
  ["Sırma Su Şişli Bayi", "+905321010006", "sisli@sirmabayisi.com", ["su", "damacana", "sırma", "şişli", "mecidiyeköy", "maden suyu", "su siparişi"], ["PHONE", "SMS"], 92],
  ["Hayat Su Maltepe", "+905321010007", "maltepe@hayatsu.com", ["su", "damacana", "hayat", "maltepe", "kartal", "su siparişi", "damacana su"], ["PHONE", "SMS"], 90],
  ["Munzur Su Beyoğlu", "+905321010008", "beyoglu@munzursu.com", ["su", "damacana", "munzur", "beyoğlu", "taksim", "cihangir", "doğal su"], ["PHONE", "SMS"], 89],
  ["Abant Su Bakırköy", "+905321010009", "bakirkoy@abantsu.com", ["su", "damacana", "abant", "bakırköy", "ataköy", "su sipariş", "sucu"], ["PHONE", "SMS"], 88],
  ["Taşkesti Su Pendik", "+905321010010", "pendik@taskestisu.com", ["su", "damacana", "taşkesti", "pendik", "kurtköy", "su siparişi", "damacana su"], ["PHONE", "SMS"], 87],

  // 2. Sıhhi Tesisat & Su Tesisatçısı (10 Adet)
  ["Usta Tesisat Kadıköy", "+905321020001", "kadikoy@ustatesisat.com", ["tesisat", "tesisatçı", "su kaçağı", "boru", "musluk", "tıkanıklık", "klozet", "kadıköy", "su tesisatçısı", "gider açma"], ["PHONE", "SMS"], 108],
  ["Acil Tesisat Üsküdar", "+905321020002", "uskudar@tesisatustasi.com", ["tesisat", "tesisatçı", "su sızıntısı", "lavabo açma", "pimaş", "klozet tamiri", "üsküdar", "acil tesisatçı"], ["PHONE", "SMS"], 102],
  ["Kameralı Su Kaçağı Tespiti Beşiktaş", "+905321020003", "info@kameralikacak.com", ["tesisat", "su kaçağı", "kırmadan dökmeden", "kameralı tespit", "beşiktaş", "şişli", "kaçak tespiti", "boru patlağı"], ["PHONE", "SMS"], 100],
  ["Moda Sıhhi Tesisat", "+905321020004", "moda@sihhitesisat.com", ["tesisat", "musluk", "batarya", "duşakabin", "rezervuar", "moda", "kadıköy", "su ustası", "sifon tamiri"], ["PHONE", "SMS"], 96],
  ["Ataşehir Tıkanıklık Açma", "+905321020005", "atasehir@tikaniklik.com", ["tıkanıklık", "tuvalet açma", "lavabo", "pimaş açma", "robotla açma", "ataşehir", "tesisatçı"], ["PHONE", "SMS"], 94],
  ["Şişli Tesisat & Kalorifer", "+905321020006", "sisli@tesisatkalorifer.com", ["tesisat", "kalorifer", "radyatör", "petek temizleme", "şişli", "musluk montajı", "kombi borusu"], ["PHONE", "SMS"], 92],
  ["Bakırköy Su Tesisat Ustası", "+905321020007", "bakirkoy@sutesisati.com", ["tesisat", "tesisatçı", "su kaçağı", "musluk tamiri", "bakırköy", "florya", "klozet montajı"], ["PHONE", "SMS"], 90],
  ["Maltepe Acil Tesisat Servisi", "+905321020008", "maltepe@acilsu.com", ["tesisat", "acil tesisatçı", "gider borusu", "maltepe", "kartal", "su basması", "küvet tamiri"], ["PHONE", "SMS"], 89],
  ["Beyoğlu Cihangir Tesisatçısı", "+905321020009", "cihangir@tesisatci.com", ["tesisat", "musluk", "eski bina tesisatı", "beyoğlu", "cihangir", "karaköy", "su kaçağı"], ["PHONE", "SMS"], 88],
  ["Sarıyer Boğaz Tesisat", "+905321020010", "sariyer@bogaztesisat.com", ["tesisat", "tesisatçı", "hidrofor", "su deposu", "sarıyer", "tarabya", "yeniköy", "su ustası"], ["PHONE", "SMS"], 86],

  // 3. Emlak & Gayrimenkul Danışmanlığı (10 Adet) - YENİ EKLENDİ
  ["Tarabya Emlak", "+905321030001", "tarabya@emlak.com", ["emlak", "kiralık", "satılık", "daire", "villa", "tarabya", "sarıyer", "gayrimenkul"], ["PHONE", "SMS", "WHATSAPP"], 110],
  ["Moda Gayrimenkul", "+905321030002", "moda@gayrimenkul.com", ["emlak", "kiralık daire", "satılık ev", "moda", "kadıköy", "işyeri kiralık"], ["PHONE", "WHATSAPP"], 104],
  ["Beşiktaş Boğaz Emlak", "+905321030003", "besiktas@bogazemlak.com", ["emlak", "yalı", "deniz manzaralı", "kiralık", "beşiktaş", "ortaköy"], ["PHONE", "SMS"], 102],
  ["Üsküdar Merkez Emlak", "+905321030004", "uskudar@merkezemlak.com", ["emlak", "kiralık dükkan", "arsa", "üsküdar", "satılık daire"], ["PHONE", "SMS"], 97],
  ["Ataşehir Plazalar Gayrimenkul", "+905321030005", "atasehir@plazaemlak.com", ["emlak", "ofis", "plaza katı", "kiralık ofis", "ataşehir", "batı ataşehir"], ["PHONE", "WHATSAPP"], 95],
  ["Şişli & Mecidiyeköy Emlak", "+905321030006", "sisli@emlak.com", ["emlak", "rezidans", "eşyalı kiralık", "şişli", "mecidiyeköy", "nişantaşı"], ["PHONE", "SMS"], 93],
  ["Bakırköy Sahil Gayrimenkul", "+905321030007", "bakirkoy@sahilemlak.com", ["emlak", "satılık daire", "kiralık", "bakırköy", "yeşilköy", "florya"], ["PHONE", "WHATSAPP"], 91],
  ["Maltepe Sahil Emlak", "+905321030008", "maltepe@sahilemlak.com", ["emlak", "kiralık ev", "satılık", "maltepe", "küçükyalı", "sahil yolu"], ["PHONE", "SMS"], 90],
  ["Beyoğlu Tarihi Emlak", "+905321030009", "taksim@tarihiemlak.com", ["emlak", "tarihi bina", "airbnb", "beyoğlu", "taksim", "galata"], ["PHONE", "WHATSAPP"], 89],
  ["Sarıyer Orman Emlak", "+905321030010", "sariyer@ormanemlak.com", ["emlak", "müstakil ev", "bahçeli", "kiralık villa", "sarıyer", "zekeriyaköy"], ["PHONE", "SMS"], 88]
];

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
        status VARCHAR(50) NOT NULL DEFAULT 'POOL', -- PENDING yerine POOL yapısı eklendi
        matched_provider_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 🌟 3. YENİ: TALEP HAVUZU / KUYRUK TABLOSU (Marketplace Queue)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS request_interests (
        id SERIAL PRIMARY KEY,
        request_id INTEGER REFERENCES requests(id) ON DELETE CASCADE,
        provider_id INTEGER REFERENCES service_providers(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'WAITING', -- WAITING, ACTIVE, SKIPPED
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(request_id, provider_id)
      );
    `);

    // Güvenlik & Alterlar
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

    // 8. Test Senaryoları Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        tester_name VARCHAR(100) DEFAULT 'Admin/Tester',
        test_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50) DEFAULT 'BEKLİYOR',
        result_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 🌟 100 ADET SAĞLAYICIYI VERİTABANINA YÜKLE
    const { rowCount: providerCount } = await pool.query('SELECT id FROM service_providers LIMIT 10;');
    if (providerCount < 10) {
      console.log('📦 Servis Sağlayıcılar Veritabanına Yükleniyor...');
      for (const prov of initial100Providers) {
        await pool.query(`
          INSERT INTO service_providers (name, phone, email, service_keywords, communication_channels, priority_score, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, TRUE)
          ON CONFLICT DO NOTHING;
        `, prov);
      }
      console.log('✅ Sağlayıcılar Başarıyla Eklendi!');
    }

    // Sequence Eşitlemeleri
    await pool.query(`
      SELECT setval(pg_get_serial_sequence('service_providers', 'id'), COALESCE((SELECT MAX(id) FROM service_providers), 1), true);
      SELECT setval(pg_get_serial_sequence('requests', 'id'), COALESCE((SELECT MAX(id) FROM requests), 1), true);
      SELECT setval(pg_get_serial_sequence('project_features', 'id'), COALESCE((SELECT MAX(id) FROM project_features), 1), true);
      SELECT setval(pg_get_serial_sequence('reviews', 'id'), COALESCE((SELECT MAX(id) FROM reviews), 1), true);
      SELECT setval(pg_get_serial_sequence('test_cases', 'id'), COALESCE((SELECT MAX(id) FROM test_cases), 1), true);
    `);

    console.log('✅ Veritabanı ve Marketplace/Havuz Mimarisi Hazır.');
  } catch (error) {
    console.error('❌ Tablo başlatma hatası:', error.message);
  }
};

module.exports = initDatabase;