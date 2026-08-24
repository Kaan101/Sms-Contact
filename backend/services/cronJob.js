// backend/services/cronJob.js
const { pool } = require('../config/db');

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
      // 3a. Sıradaki varsa ona ata
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
    // Parametreleri çek
    const { rows: settings } = await pool.query(`SELECT setting_key, setting_value FROM system_settings`);
    const setMap = {};
    settings.forEach(s => setMap[s.setting_key] = s.setting_value);

    // Ayarlanmamışsa default: 15 dakika ve 24 saat
    const matchedMins = parseInt(setMap['timeout_matched_mins'] || '15', 10);
    const acceptedHours = parseInt(setMap['timeout_accepted_hours'] || '24', 10);

    // KURAL 1: MATCHED (Onay Bekliyor) durumunda olup süresi dolanlar
    const matchedQuery = `
      SELECT id, matched_provider_id FROM requests 
      WHERE status = 'MATCHED' AND updated_at < NOW() - INTERVAL '${matchedMins} minutes'
    `;
    const { rows: expiredMatched } = await pool.query(matchedQuery);

    for (const req of expiredMatched) {
      await passProviderLogic(req.id, req.matched_provider_id);
      console.log(`[SİSTEM BOTU] Talep #${req.id} sağlayıcı kabul etmediği için otomatik pas geçildi.`);
    }

    // KURAL 2: ACCEPTED (İşe Başlandı) durumunda olup süresi dolanlar
    const acceptedQuery = `
      SELECT id, matched_provider_id FROM requests 
      WHERE status = 'ACCEPTED' AND updated_at < NOW() - INTERVAL '${acceptedHours} hours'
    `;
    const { rows: expiredAccepted } = await pool.query(acceptedQuery);

    for (const req of expiredAccepted) {
      await passProviderLogic(req.id, req.matched_provider_id);
      console.log(`[SİSTEM BOTU] Talep #${req.id} teslim edilmediği için otomatik pas geçildi.`);
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