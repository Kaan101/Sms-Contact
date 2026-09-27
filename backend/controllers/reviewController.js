const { pool } = require('../config/db');

const submitReview = async (req, res) => {
  // Grab a dedicated client for the transaction
  const client = await pool.connect();

  try {
    const { requestId, reviewerType, ratings, comment } = req.body;
    const rId = parseInt(requestId, 10);

    // 1. Strict Input Validation
    const allowedReviewers = ['CUSTOMER', 'PROVIDER'];
    if (isNaN(rId) || !allowedReviewers.includes(reviewerType)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Geçersiz talep numarası veya yetkisiz değerlendiren tipi.' 
      });
    }

    const cleanComment = (comment && String(comment).trim() !== '') ? String(comment).trim() : null;

    let ratingKnowledge = null, ratingCommunication = null, ratingTiming = null, ratingCost = null;
    let finalRating = null, finalScore = null;

    // 2. Safer Default Assignments (?? instead of || allows 0 values if applicable)
    if (ratings) {
      ratingKnowledge = ratings.knowledge ?? 5;
      ratingCommunication = ratings.communication ?? 5;
      ratingTiming = ratings.timing ?? 5;
      ratingCost = ratings.cost ?? 5;

      finalRating = (ratingKnowledge + ratingCommunication + ratingTiming + ratingCost) / 4.0;
      finalScore = (ratingKnowledge * 0.30 + ratingCommunication * 0.20 + ratingTiming * 0.30 + ratingCost * 0.20) * 20; 
    }

    // Begin Transaction
    await client.query('BEGIN');

    // Fetch request and provider info
    const { rows: reqRows } = await client.query(`
      SELECT r.*, p.name AS provider_name, p.phone AS provider_phone 
      FROM requests r
      LEFT JOIN service_providers p ON r.matched_provider_id = p.id
      WHERE r.id = $1 FOR UPDATE; -- FOR UPDATE locks the row to prevent concurrent modifications
    `, [rId]);

    const currentReq = reqRows.length > 0 ? reqRows[0] : null;

    // 3. Delete old review (Transaction ensures safety, though ON CONFLICT DO UPDATE is better if schema allows)
    await client.query(
      'DELETE FROM reviews WHERE request_id = $1 AND reviewer_type = $2;', 
      [rId, reviewerType]
    );

    // Insert new review
    const insertReviewQuery = `
      INSERT INTO reviews 
      (request_id, reviewer_type, rating_knowledge, rating_communication, rating_timing, rating_cost, rating, score, comment, rating_date, score_date) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    
    const { rows: savedReview } = await client.query(insertReviewQuery, [
      rId, reviewerType, ratingKnowledge, ratingCommunication, 
      ratingTiming, ratingCost, finalRating, finalScore, cleanComment
    ]);

    // Insert SMS Log
    if (currentReq) {
      if (reviewerType === 'CUSTOMER') {
        const reviewSummary = finalRating 
          ? `Ortalama Puan: ${finalRating.toFixed(1)}/5 Yıldız${cleanComment ? ` - Yorum: "${cleanComment}"` : ''}` 
          : 'Puan vermeden onayladı.';
        const providerMsg = `[MOBOOL] Müşteriniz #${rId} numaralı hizmeti onayladı ve değerlendirdi! (${reviewSummary})`;

        if (currentReq.provider_phone) {
          await client.query(`
            INSERT INTO outbound_notifications (request_id, recipient_type, recipient_phone, channel, message_body)
            VALUES ($1, 'PROVIDER', $2, 'SMS', $3);
          `, [rId, currentReq.provider_phone, providerMsg]);
        }
      } else if (reviewerType === 'PROVIDER') {
        const reviewSummary = finalRating 
          ? `Puan: ${finalRating.toFixed(1)}/5 Yıldız${cleanComment ? ` - Yorum: "${cleanComment}"` : ''}` 
          : 'Puan vermeden teslim etti.';
        const userMsg = `[MOBOOL] '${currentReq.provider_name}' hizmet tesliminde sizi değerlendirdi! (${reviewSummary})`;

        // Ensure contact_value exists before attempting to send SMS
        if (currentReq.contact_value) {
            await client.query(`
              INSERT INTO outbound_notifications (request_id, recipient_type, recipient_phone, channel, message_body)
              VALUES ($1, 'USER', $2, 'SMS', $3);
            `, [rId, currentReq.contact_value, userMsg]);
        }
      }
    }

    // Commit Transaction
    await client.query('COMMIT');

    res.status(200).json({
      status: 'success',
      message: 'Değerlendirme başarıyla kaydedildi.',
      review: savedReview[0]
    });

  } catch (error) {
    // Rollback all changes if any query fails
    await client.query('ROLLBACK');
    console.error('submitReview transaction error:', error);
    res.status(500).json({ status: 'error', message: `Veritabanı hatası: ${error.message}` });
  } finally {
    // Always return the client to the pool
    client.release();
  }
};

const getReviewsByRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM reviews WHERE request_id = $1 ORDER BY rating_date DESC;', 
      [parseInt(requestId, 10)]
    );
    res.status(200).json({ status: 'success', reviews: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  submitReview,
  getReviewsByRequest
};