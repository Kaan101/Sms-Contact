
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, testDbConnection } = require('./config/db');
const initDatabase = require('./config/initDb');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ... diğer kodlar
const { startCronJobs } = require('./services/cronJob');
startCronJobs(); // Sunucu kalktığında botu da çalıştır

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
    // Production'da bile olsak, sadece "eksik olan" kritik tabloları 
try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS request_provider_details (
            id SERIAL PRIMARY KEY,
            request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
            provider_id INTEGER NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
            provider_budget NUMERIC(10,2),
            provider_currency VARCHAR(10) DEFAULT 'TRY',
            provider_target_date TIMESTAMP WITH TIME ZONE,
            provider_delivered_at TIMESTAMP WITH TIME ZONE, -- YENİ EKLENEN KOLON
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
    // --- GÜVENLİ MIGRATION BİTİŞİ ---

    // Geliştirme (development) ortamında veya manuel bir komut verildiğinde initDb çalışsın,
    // Canlı (production/Railway) ortamında tabloları SIFIRLAMASIN!
    if (process.env.NODE_ENV === 'development' || process.env.INIT_DB === 'true') {
        console.log('Tablo oluşturma/güncelleme (initDb) başlatılıyor...');
        await initDatabase();
    } else {
        console.log('Production ortamı: initDb (Tablo sıfırlama) atlandı.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Sunucu ${PORT} portunda aktif.`);
    });
  } catch (error) {
    console.error('Sunucu başlatma hatası:', error);
  }
};

startServer();