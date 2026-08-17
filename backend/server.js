const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Test Route
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