require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, testDbConnection } = require('./config/db');
const initDatabase = require('./config/initDb');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Bot/Cron servisleri varsa başlat
const { startCronJobs } = require('./services/cronJob');
if (typeof startCronJobs === 'function') {
  startCronJobs(); // Sunucu kalktığında botu da çalıştır
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotaları '/api' önekiyle bağla
app.use('/api', apiRoutes);

// Sağlık kontrolü
app.get('/', (req, res) => {
  res.send('Sms-Contact API çalışıyor.');
});

// Sunucuyu başlat ve DB tablolarını senkronize et
const startServer = async () => {
  try {
    await testDbConnection();
    
    // --- GÜVENLİ MIGRATION BAŞLANGICI ---
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS request_provider_details (
            id SERIAL PRIMARY KEY,
            request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
            provider_id INTEGER NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
            provider_budget NUMERIC(10,2),
            provider_currency VARCHAR(10) DEFAULT 'TRY',
            provider_target_date TIMESTAMP WITH TIME ZONE,
            provider_delivered_at TIMESTAMP WITH TIME ZONE,
            provider_description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(request_id, provider_id)
        );
      `);
      console.log('✅ Güvenli Migration: request_provider_details tablosu kontrol edildi.');
    } catch (dbError) {
      console.error('❌ Güvenli Migration hatası:', dbError.message);
    }

    // service_providers tablosuna 'tags' (dizi) sütununu güvenli şekilde ekle
    try {
      await pool.query(`
        ALTER TABLE service_providers 
        ADD COLUMN IF NOT EXISTS tags TEXT[];
      `);
      console.log('✅ Güvenli Migration: service_providers.tags sütunu kontrol edildi.');
    } catch (dbError) {
      console.error('❌ Tags Migration hatası:', dbError.message);
    }

    // service_providers tablosuna genişletilmiş profil kolonlarını güvenli şekilde ekle
    await pool.query(`
      ALTER TABLE service_providers 
      ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'MANUAL',
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Türkiye',
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS district VARCHAR(100),
      ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100),
      ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS provider_type VARCHAR(100),
      ADD COLUMN IF NOT EXISTS provider_subtype VARCHAR(100),
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    // --- GÜVENLİ MIGRATION BİTİŞİ ---

    if (process.env.NODE_ENV === 'development' || process.env.INIT_DB === 'true') {
        console.log('Tablo oluşturma/güncelleme (initDb) başlatılıyor...');
        await initDatabase();
    } else {
        console.log('Production ortamı: initDb (Tablo sıfırlama) atlandı.');
    }

    // 🚀 Railway / Docker için '0.0.0.0' eklenerek SIGTERM / Port sorunu kökten çözüldü
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Sunucu ${PORT} portunda aktif.`);
    });
  } catch (error) {
    console.error('Sunucu başlatma hatası:', error);
  }
};

startServer();