const { pool } = require('../config/db');

// 1. OTP Üret ve Gönder (Simülasyon)
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || phone.trim().length < 7) {
      return res.status(400).json({ status: 'error', message: 'Geçerli bir telefon numarası giriniz.' });
    }

    const cleanPhone = phone.trim();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    const insertQuery = `
      INSERT INTO otp_verifications (phone, otp_code, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    await pool.query(insertQuery, [cleanPhone, otpCode, expiresAt]);

    console.log(`\n🔑 [OTP SIMULATION] Telefon: ${cleanPhone} -> KOD: ${otpCode}\n`);

    res.status(200).json({
      status: 'success',
      message: 'Doğrulama kodu telefonunuza gönderildi.',
      phone: cleanPhone,
      simulatedOtp: otpCode
    });
  } catch (error) {
    console.error('OTP gönderme hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 2. OTP Doğrula
const verifyOtp = async (req, res) => {
  try {
    const { phone, otpCode } = req.body;

    if (!phone || !otpCode) {
      return res.status(400).json({ status: 'error', message: 'Telefon ve doğrulama kodu zorunludur.' });
    }

    const cleanPhone = phone.trim();
    const cleanOtp = otpCode.trim();

    const query = `
      SELECT * FROM otp_verifications
      WHERE phone = $1 AND otp_code = $2 AND is_used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [cleanPhone, cleanOtp]);

    if (rows.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Geçersiz veya süresi dolmuş doğrulama kodu.'
      });
    }

    await pool.query('UPDATE otp_verifications SET is_used = TRUE WHERE id = $1', [rows[0].id]);

    res.status(200).json({
      status: 'success',
      message: 'Giriş başarılı!',
      user: {
        phone: cleanPhone,
        authenticatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('OTP doğrulama hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

module.exports = {
  sendOtp,
  verifyOtp
};