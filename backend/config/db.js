const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

const connectDB = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.log('Uyarı: DATABASE_URL tanımlanmamış, PostgreSQL bağlantısı atlandı.');
      return;
    }
    const client = await pool.connect();
    console.log('PostgreSQL (Railway) Bağlantısı Başarılı!');
    client.release();
  } catch (error) {
    console.error('PostgreSQL Bağlantı Hatası Detayı:', error.message);
  }
};

module.exports = { pool, connectDB };