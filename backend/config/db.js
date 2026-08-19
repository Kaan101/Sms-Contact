const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sms_contact',
  max: 20, // Maksimum eşzamanlı bağlantı
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // 5 saniyede bağlanamazsa hata fırlatır, sonsuz takılmaz
});

const testDbConnection = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW();');
    client.release();
    console.log('✅ PostgreSQL Veritabanı bağlantısı başarılı:', res.rows[0].now);
  } catch (error) {
    console.error('❌ PostgreSQL bağlantı hatası:', error.message);
    throw error;
  }
};

pool.on('error', (err) => {
  console.error('Beklenmeyen veritabanı hatası:', err.message);
});

module.exports = {
  pool,
  testDbConnection
};