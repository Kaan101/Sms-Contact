const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const initDatabase = require('./config/initDb');
const apiRoutes = require('./routes/apiRoutes');

dotenv.config();

// Veritabanı başlat
(async () => {
  await connectDB();
  await initDatabase();
})();

const app = express();

app.use(cors());
app.use(express.json());

// API Ana Rotaları
app.use('/api', apiRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SMS-Contact API sorunsuz çalışıyor!'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda başarıyla başlatıldı.`);
});