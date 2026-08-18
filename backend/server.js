require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const initDatabase = require('./config/initDb');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Genişletilmiş CORS İzinleri (Tüm origin ve metodlara açık)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// API Ana Rotaları
app.use('/api', apiRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SMS-Contact API çalışıyor!'
  });
});

const PORT = process.env.PORT || 5000;

// Veritabanını güvenli başlat ve dinle
(async () => {
  try {
    await connectDB();
    await initDatabase();
  } catch (err) {
    console.error('Veritabanı başlatma hatası:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Sunucu ${PORT} portunda başarıyla çalışıyor.`);
  });
})();