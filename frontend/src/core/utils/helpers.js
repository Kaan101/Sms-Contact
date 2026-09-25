export const safeString = (val) => (val ? String(val) : '');

export const safeArray = (arr) => {
  if (Array.isArray(arr)) return arr;
  if (typeof arr === 'string') {
    try {
      const parsed = JSON.parse(arr);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return arr.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};

export const safeLower = (str) => safeString(str).toLowerCase();
export const safeUpper = (str) => safeString(str).toUpperCase();

export const cleanDigits = (str) => safeString(str).replace(/\D/g, '');

export const extractGPS = (loc) => {
  const str = safeString(loc);
  if(!str) return null;
  const match = str.match(/\[GPS:\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\]/);
  if (match && match.length >= 3) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }
  return null;
};

export const extractCode = (loc) => {
  const str = safeString(loc);
  if(!str) return null;
  const match = str.match(/\[(?:CODE|HIDDENCODE):\s*(.*?)\]/);
  return match ? match[1].trim() : null;
};

export const isCodeHiddenReq = (loc) => {
  return safeString(loc).includes('[HIDDENCODE:');
};

export const extractAddress = (loc) => {
  const str = safeString(loc);
  if(!str) return 'Bilinmiyor';
  return str.replace(/\[GPS:.*?\]/g, '').replace(/\[CODE:.*?\]/g, '').replace(/\[HIDDENCODE:.*?\]/g, '').trim();
};

export const cleanContact = (str) => safeString(str).replace(/\|(SHARED|HIDDEN)/g, '');

export const getProviderContactDisplay = (req) => {
  if (!req) return '🔒 Gizli';
  const raw = safeString(req.contact_value);
  const isShared = raw.includes('|SHARED');
  const isAccepted = req.status === 'ACCEPTED' || req.status === 'PROVIDER_COMPLETED';
  if (req.status === 'POOL' || req.status === 'PENDING') return '🔒 Gizli (Havuzda)';
  if (req.status === 'MATCHED') {
    if (isShared) return cleanContact(raw);
    return '🔒 Gizli (Müşteri Onayı Bekleniyor)';
  }
  if (isAccepted) return cleanContact(raw);
  return '🔒 Gizli';
};

export const extractPhoneForWa = (str) => {
  let cleaned = cleanContact(str).replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  if (!cleaned.startsWith('90') && cleaned.length > 0) cleaned = '90' + cleaned;
  return cleaned;
};

export const getKeywordMetrics = (text) => { 
  const str = safeString(text); 
  return { charCount: str.length, wordCount: str ? str.split(',').map(k => k.trim()).filter(Boolean).length : 0 }; 
};

export const safeDate = (dateString) => {
  if (!dateString) return '';
  try { const d = new Date(dateString); if (isNaN(d.getTime())) return ''; return d.toLocaleDateString('tr-TR'); } catch { return ''; }
};

export const safeDateTime = (dateString) => {
  if (!dateString) return '';
  try { 
    const d = new Date(dateString); 
    if (isNaN(d.getTime())) return ''; 
    return d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }); 
  } catch { return ''; }
};

export const checkKeywordMatch = (text, keywords) => {
  const raw = safeLower(text);
  const kwList = safeArray(keywords);
  if (kwList.length === 0) return false;
  return kwList.some(kw => {
    const cleanKw = safeLower(kw).trim();
    return cleanKw.length > 0 && raw.includes(cleanKw);
  });
};

// frontend/src/core/utils/helpers.js içine eklenecek

export const calculateRemainingTime = (startTimeString, timeoutValue, unit = 'hours') => {
  if (!startTimeString || !timeoutValue) return null;

  const startTime = new Date(startTimeString).getTime();
  const now = new Date().getTime();
  
  // Timeout değerini milisaniyeye çevir
  const timeoutMs = unit === 'hours' 
    ? timeoutValue * 60 * 60 * 1000 
    : timeoutValue * 60 * 1000; // 'mins' varsayımı
    
  const deadline = startTime + timeoutMs;
  const remainingMs = deadline - now;

  if (remainingMs <= 0) return "Süresi Doldu";

  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  if (unit === 'hours') {
     if (remainingHours > 0) return `${remainingHours} saat ${remainingMins} dk kaldı`;
     return `${remainingMins} dk kaldı`;
  } else {
     // Birim dakika ise
     if (remainingHours > 0) return `${remainingHours} sa ${remainingMins} dk kaldı`;
     return `${remainingMins} dk kaldı`;
  }
};