// backend/services/cronJob.js
const pool = require('../config/db');

// Mevcut sıradaki sağlayıcıyı düşürüp, kuyrukta başkası varsa ona geçiren, yoksa havuza atan mantık
const passProviderLogic = async (requestId, currentProviderId) => {
  try {
    // 1. Mevcut sağlayıcıyı SKIPPED yap
    await pool.query(
      `UPDATE request_interests SET status = 'SKIPPED' WHERE request_id = $1 AND provider_id = $2`,
      [requestId, currentProviderId]
    );

    // 2. Kuyruktaki sıradaki kişiyi bul
    const { rows: nextInQueue } = await pool.query(
      `SELECT provider_id FROM request_interests WHERE request_id = $1 AND status = 'WAITING' ORDER BY created_at ASC LIMIT 1`,
      [requestId]
    );

    if (nextInQueue.length > 0) {
      // 3a. Sıradaki varsa ona ata (Durum MATCHED olur, yeni sağlayıcı seçimi beklenir)
      const nextProviderId = nextInQueue[0].provider_id;
      await pool.query(`UPDATE requests SET matched_provider_id = $1, status = 'MATCHED', updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [nextProviderId, requestId]);
      await pool.query(`UPDATE request_interests SET status = 'ACTIVE' WHERE request_id = $1 AND provider_id = $2`, [requestId, nextProviderId]);
    } else {
      // 3b. Kimse yoksa havuza geri düşür
      await pool.query(`UPDATE requests SET matched_provider_id = NULL, status = 'POOL', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [requestId]);
    }
  } catch (err) {
    console.error('Otomatik Pas Geçme Hatası:', err);
  }
};

const runAutoPassJob = async () => {
  try {
    // 1. Parametreleri Çek
    const { rows: settings } = await pool.query(`SELECT setting_key, setting_value FROM system_settings`);
    const setMap = {};
    settings.forEach(s => setMap[s.setting_key] = s.setting_value);

    // Frontend ile uyumlu yeni parametreler ve varsayılanları
    const poolLifespanHours = parseInt(setMap['pool_lifespan_hours'] || '72', 10);
    const selectionMins = parseInt(setMap['customer_selection_timeout_mins'] || '60', 10);
    const completionHours = parseInt(setMap['provider_completion_timeout_hours'] || '48', 10);
    const approvalHours = parseInt(setMap['customer_approval_timeout_hours'] || '24', 10);

    // KURAL 1: POOL (Açık Havuz) - Süresi dolanları iptal et
    const poolQuery = `
      UPDATE requests 
      SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP 
      WHERE status IN ('POOL', 'PENDING') 
      AND created_at < NOW() - INTERVAL '${poolLifespanHours} hours'
      RETURNING id
    `;
    const { rows: expiredPool } = await pool.query(poolQuery);
    if (expiredPool.length > 0) {
       console.log(`[SİSTEM BOTU] Havuz süresi dolan ${expiredPool.length} talep iptal edildi.`);
    }

    // KURAL 2: MATCHED (Müşteri veya Sağlayıcı Seçimi Bekliyor)
    // NOT: Müşteri süresinde onay vermediyse veya sağlayıcı kabul etmediyse
    const matchedQuery = `
      SELECT id, matched_provider_id FROM requests 
      WHERE status = 'MATCHED' AND updated_at < NOW() - INTERVAL '${selectionMins} minutes'
    `;
    const { rows: expiredMatched } = await pool.query(matchedQuery);

    for (const req of expiredMatched) {
      if (req.matched_provider_id) {
         await passProviderLogic(req.id, req.matched_provider_id);
         console.log(`[SİSTEM BOTU] Talep #${req.id} onaylanmadığı için kuyruktaki sıradaki kişiye aktarıldı (veya havuza düşürüldü).`);
      }
    }

    // KURAL 3: ACCEPTED (Sağlayıcı İşi Aldı, Teslimat Bekleniyor)
    const acceptedQuery = `
      SELECT id, matched_provider_id FROM requests 
      WHERE status = 'ACCEPTED' AND updated_at < NOW() - INTERVAL '${completionHours} hours'
    `;
    const { rows: expiredAccepted } = await pool.query(acceptedQuery);

    for (const req of expiredAccepted) {
      if (req.matched_provider_id) {
          // İşi teslim edemediği için sağlayıcı düşürülür
          await passProviderLogic(req.id, req.matched_provider_id);
          console.log(`[SİSTEM BOTU] Talep #${req.id} teslim edilmediği için sağlayıcıdan alındı.`);
      }
    }

    // KURAL 4: PROVIDER_COMPLETED (Müşteri Onayı Bekliyor)
    const approvalQuery = `
      UPDATE requests 
      SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP 
      WHERE status = 'PROVIDER_COMPLETED' 
      AND updated_at < NOW() - INTERVAL '${approvalHours} hours'
      RETURNING id
    `;
    const { rows: autoApproved } = await pool.query(approvalQuery);
    if (autoApproved.length > 0) {
        console.log(`[SİSTEM BOTU] Müşteri onayı gelmeyen ${autoApproved.length} teslimat otomatik onaylandı (COMPLETED).`);
    }

  } catch (err) {
    console.error('[CRON ERROR]', err);
  }
};

// Sistemi Başlat (Her 1 dakikada bir kontrol eder)
const startCronJobs = () => {
  setInterval(runAutoPassJob, 60 * 1000);
  console.log('⏳ Sistem Botu Başlatıldı: Zaman aşımları kontrol ediliyor...');
};

module.exports = { startCronJobs };