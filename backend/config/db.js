const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
    console.error(`PostgreSQL Bağlantı Hatası: ${error.message}`);
  }
};

module.exports = { pool, connectDB };