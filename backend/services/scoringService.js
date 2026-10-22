// backend/services/scoringService.js

/**
 * Sağlayıcı ve Talep verilerine göre dinamik uyum ve öncelik skoru hesaplar (0 - 100 arası).
 */
function calculateProviderScore(provider, request) {
  // 1. Müşteri Puanı (%30 ağırlık) -> 5 üzerinden normalize edilir
  const avgRating = provider.avg_rating ? parseFloat(provider.avg_rating) : 5.0;
  const ratingScore = (avgRating / 5.0) * 30;

  // 2. Yanıt Hızı (%25 ağırlık) -> Ortalama dakikaya göre ters oran
  const avgResponseMins = provider.avg_response_mins ? parseFloat(provider.avg_response_mins) : 10;
  const speedScore = Math.max(0, 25 - (avgResponseMins * 0.5));

  // 3. Tamamlama Oranı (%20 ağırlık)
  const completionRate = provider.completion_rate ? parseFloat(provider.completion_rate) : 0.95;
  const successScore = completionRate * 20;

  // 4. Etiket / Uzmanlık Örtüşmesi (%15 ağırlık)
  const providerTags = Array.isArray(provider.tags) ? provider.tags : [];
  const requestTags = Array.isArray(request.tags) ? request.tags : [];
  
  let tagScore = 15;
  if (requestTags.length > 0) {
    const matchingTags = requestTags.filter(t => 
      providerTags.some(pt => pt.toLowerCase() === t.toLowerCase())
    );
    tagScore = (matchingTags.length / requestTags.length) * 15;
  }

  // 5. Konum / Mesafe Faktörü (%10 ağırlık - baz puan)
  const locationScore = 10; 

  const totalScore = Math.round(ratingScore + speedScore + successScore + tagScore + locationScore);
  return Math.min(100, Math.max(0, totalScore));
}

module.exports = {
  calculateProviderScore
};