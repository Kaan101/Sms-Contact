require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testDbConnection } = require('./config/db');
const initDatabase = require('./config/initDb');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

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
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Sunucu ${PORT} portunda aktif.`);
    });
  } catch (error) {
    console.error('Sunucu başlatma hatası:', error);
  }
};

startServer();