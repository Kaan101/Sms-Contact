const { pool } = require('../config/db');

// İnceleme / Değerlendirme Kaydet (ve SMS Logu Oluştur)
const submitReview = async (req, res) => {
  try {
    const { requestId, reviewerType, rating, comment } = req.body;

    const rId = parseInt(requestId, 10);
    if (isNaN(rId) || !reviewerType) {
      return res.status(400).json({ status: 'error', message: 'Geçersiz talep numarası veya değerlendiren tipi.' });
    }

    const numRating = rating !== null && rating !== undefined && rating !== '' ? parseInt(rating, 10) : null;
    const cleanComment = comment && comment.trim() !== '' ? comment.trim() : null;

    // Talep ve sağlayıcı bilgilerini çek
    const { rows: reqRows } = await pool.query(`
      SELECT r.*, p.name AS provider_name, p.phone AS provider_phone 
      FROM requests r
      LEFT JOIN service_providers p ON r.matched_provider_id = p.id
      WHERE r.id = $1
    `, [rId]);

    if (reqRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Talep bulunamadı.' });
    }
    const currentReq = reqRows[0];

    // Önce varsa eski kaydı silip temiz ekle (Çakışma riskini %0'a indirir)
    await pool.query(`
      DELETE FROM reviews WHERE request_id = $1 AND reviewer_type = $2;
    `, [rId, reviewerType]);

    const insertQuery = `
      INSERT INTO reviews (request_id, reviewer_type, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows: savedReview } = await pool.query(insertQuery, [rId, reviewerType, numRating, cleanComment]);

    // SMS Bildirimi Tetikle
    if (reviewerType === 'CUSTOMER') {
      const reviewSummary = numRating ? `Puan: ${numRating}/5 Yıldız${cleanComment ? ` - Yorum: "${cleanComment}"` : ''}` : 'Puan vermeden işlemi tamamladı.';
      const providerMsg = `[Sms-Contact] Müşteriniz #${rId} numaralı hizmet için değerlendirme yaptı! (${reviewSummary})`;

      if (currentReq.provider_phone) {
        await pool.query(`
          INSERT INTO outbound_notifications (request_id, recipient_type, recipient_phone, channel, message_body)
          VALUES ($1, 'PROVIDER', $2, 'SMS', $3);
        `, [rId, currentReq.provider_phone, providerMsg]);
      }
    } else if (reviewerType === 'PROVIDER') {
      const reviewSummary = numRating ? `Puan: ${numRating}/5 Yıldız${cleanComment ? ` - Yorum: "${cleanComment}"` : ''}` : 'Puan vermeden işlemi tamamladı.';
      const userMsg = `[Sms-Contact] '${currentReq.provider_name}' hizmet sonrası sizi değerlendirdi! (${reviewSummary})`;

      await pool.query(`
        INSERT INTO outbound_notifications (request_id, recipient_type, recipient_phone, channel, message_body)
        VALUES ($1, 'USER', $2, 'SMS', $3);
      `, [rId, currentReq.contact_value, userMsg]);
    }

    res.status(200).json({
      status: 'success',
      message: 'Değerlendirme başarıyla kaydedildi.',
      review: savedReview[0]
    });
  } catch (error) {
    console.error('submitReview hatası:', error);
    res.status(500).json({ status: 'error', message: `Veritabanı hatası: ${error.message}` });
  }
};

const getReviewsByRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rows } = await pool.query('SELECT * FROM reviews WHERE request_id = $1', [parseInt(requestId, 10)]);
    res.status(200).json({ status: 'success', reviews: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  submitReview,
  getReviewsByRequest
};