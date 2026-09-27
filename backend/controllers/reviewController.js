const { pool } = require('../config/db');

// 1. Detaylı Değerlendirme Kaydet ve SMS Logu Oluştur
const submitReview = async (req, res) => {
  try {
    const { requestId, reviewerType, ratings, comment } = req.body;

    const rId = parseInt(requestId, 10);
    if (isNaN(rId) || !reviewerType) {
      return res.status(400).json({ status: 'error', message: 'Geçersiz talep numarası veya değerlendiren tipi.' });
    }

    const cleanComment = (comment && String(comment).trim() !== '') ? String(comment).trim() : null;

    let ratingKnowledge = null, ratingCommunication = null, ratingTiming = null, ratingCost = null;
    let finalRating = null;
    let finalScore = null;

    // Kullanıcı "Yorum Yapmadan Geç" demediyse:
    if (ratings) {
      // 🌟 DİKKAT: Gelen veriyi kesinlikle Number (Sayı) formatına zorluyoruz!
      ratingKnowledge = Number(ratings.knowledge) || 5;
      ratingCommunication = Number(ratings.communication) || 5;
      ratingTiming = Number(ratings.timing) || 5;
      ratingCost = Number(ratings.cost) || 5;

      // 1. Düz Ortalama (Arayüzde ve genel görünümde 1-5 arası yıldız için)
      finalRating = (ratingKnowledge + ratingCommunication + ratingTiming + ratingCost) / 4.0;
      
      // 2. Ağırlıklı Sistem Skoru
      finalScore = (ratingKnowledge * 0.30 + ratingCommunication * 0.20 + ratingTiming * 0.30 + ratingCost * 0.20) * 20; 
    }

    // Talep ve sağlayıcı bilgilerini getir (SMS logu için)
    const { rows: reqRows } = await pool.query(`
      SELECT r.*, p.name AS provider_name, p.phone AS provider_phone 
      FROM requests r
      LEFT JOIN service_providers p ON r.matched_provider_id = p.id
      WHERE r.id = $1;
    `, [rId]);

    const currentReq = reqRows.length > 0 ? reqRows[0] : null;

    // Varsa eski değerlendirmeyi sil (Mükerrer kaydı önlemek için)
    await pool.query('DELETE FROM reviews WHERE request_id = $1 AND reviewer_type = $2;', [rId, reviewerType]);

    // Yeni detaylı değerlendirmeyi kaydet
    const insertQuery = `
      INSERT INTO reviews 
      (request_id, reviewer_type, rating_knowledge, rating_communication, rating_timing, rating_cost, rating, score, comment, rating_date, score_date) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const { rows: savedReview } = await pool.query(insertQuery, [rId, reviewerType, ratingKnowledge, ratingCommunication, ratingTiming, ratingCost, finalRating, finalScore, cleanComment]);

    // SMS Bildirimi Logla
    if (currentReq) {
      if (reviewerType === 'CUSTOMER') {
        const reviewSummary = finalRating ? `Ortalama Puan: ${finalRating.toFixed(1)}/5 Yıldız${cleanComment ? ` - Yorum: "${cleanComment}"` : ''}` : 'Puan vermeden onayladı.';
        const providerMsg = `[MOBOOL] Müşteriniz #${rId} numaralı hizmeti onayladı ve değerlendirdi! (${reviewSummary})`;

        if (currentReq.provider_phone) {
          await pool.query(`
            INSERT INTO outbound_notifications (request_id, recipient_type, recipient_phone, channel, message_body)
            VALUES ($1, 'PROVIDER', $2, 'SMS', $3);
          `, [rId, currentReq.provider_phone, providerMsg]);
        }
      } else if (reviewerType === 'PROVIDER') {
        const reviewSummary = finalRating ? `Puan: ${finalRating.toFixed(1)}/5 Yıldız${cleanComment ? ` - Yorum: "${cleanComment}"` : ''}` : 'Puan vermeden teslim etti.';
        const userMsg = `[MOBOOL] '${currentReq.provider_name}' hizmet tesliminde sizi değerlendirdi! (${reviewSummary})`;

        await pool.query(`
          INSERT INTO outbound_notifications (request_id, recipient_type, recipient_phone, channel, message_body)
          VALUES ($1, 'USER', $2, 'SMS', $3);
        `, [rId, currentReq.contact_value, userMsg]);
      }
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
    const { rows } = await pool.query('SELECT * FROM reviews WHERE request_id = $1;', [parseInt(requestId, 10)]);
    res.status(200).json({ status: 'success', reviews: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  submitReview,
  getReviewsByRequest
};