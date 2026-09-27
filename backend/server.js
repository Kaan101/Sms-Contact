require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testDbConnection } = require('./config/db');
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
    
    // Geliştirme (development) ortamında veya manuel bir komut verildiğinde initDb çalışsın,
    // Canlı (production/Railway) ortamında tabloları SIFIRLAMASIN!
    if (process.env.NODE_ENV === 'development' || process.env.INIT_DB === 'true') {
        console.log('Tablo oluşturma/güncelleme (initDb) başlatılıyor...');
        await initDatabase();
    } else {
        console.log('Production ortamı: initDb atlandı.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Sunucu ${PORT} portunda aktif.`);
    });
  } catch (error) {
    console.error('Sunucu başlatma hatası:', error);
  }
};

startServer();