// --- SAYAÇ (TIMER) MANTIĞI (Hata Toleranslı Güncelleme) ---
  let timerDisplay = null;
  let isTimerCritical = false;
  
  // 1. Veritabanında status boşsa bile varsayılan olarak POOL kabul edelim
  const currentStatus = reqStatus || 'POOL';
  
  // 2. Eğer veride tarih yoksa çökmek yerine şimdiki zamanı baz alalım (test verileri için)
  const refDate = req.updated_at || req.created_at || new Date().toISOString();

  if (currentStatus === 'POOL' || currentStatus === 'PENDING') {
     const poolLimit = Number(systemSettings?.pool_lifespan_hours) || 72;
     const remaining = calculateRemainingTime(refDate, poolLimit, 'hours');
     if (remaining) {
       timerDisplay = `Kapanış: ${remaining}`;
       isTimerCritical = remaining === "Süresi Doldu" || (remaining.includes("dk") && !remaining.includes("saat"));
     }
  } else if (currentStatus === 'MATCHED') {
     const selectLimit = Number(systemSettings?.customer_selection_timeout_mins) || 60;
     const remaining = calculateRemainingTime(refDate, selectLimit, 'mins');
     if (remaining) {
       timerDisplay = `Kalan: ${remaining}`;
       isTimerCritical = remaining === "Süresi Doldu" || (parseInt(remaining) < 15 && remaining.includes("dk") && !remaining.includes("saat"));
     }
  } else if (currentStatus === 'ACCEPTED') {
     const completionLimit = Number(systemSettings?.provider_completion_timeout_hours) || 48;
     const remaining = calculateRemainingTime(refDate, completionLimit, 'hours');
     if (remaining) {
       timerDisplay = `Teslimat: ${remaining}`;
       isTimerCritical = remaining === "Süresi Doldu" || (remaining.includes("dk") && !remaining.includes("saat"));
     }
  } else if (currentStatus === 'PROVIDER_COMPLETED') {
     const approvalLimit = Number(systemSettings?.customer_approval_timeout_hours) || 24;
     const remaining = calculateRemainingTime(refDate, approvalLimit, 'hours');
     if (remaining) {
       timerDisplay = `Onay: ${remaining}`;
     }
  }