const express = require('express');
const router = express.Router();

// --- BÜTÜN CONTROLLER İÇE AKTARIMLARI (DÜZENLİ) ---
const { sendOtp, verifyOtp } = require('../controllers/authController');
const { getSettings, updateSetting } = require('../controllers/settingsController');
const { checkDisambiguation } = require('../controllers/disambiguateController');
const { registerProvider, getProviders, getProviderByPhone, updateProvider, deleteProvider } = require('../controllers/providerController');
const { 
  createRequest, 
  getOpenPoolRequests,
  joinRequestPool,
  getUserRequests,
  getProviderAssignedRequests,
  passToNextProvider,
  selectCandidateProvider,
  updateRequestStatus,
  getPendingRequests,
  getMatchedRequests,
  assignProviderManually,
  getOutboundNotifications,
  deleteRequest,
  upsertProviderRequestDetails,
  createDirectReorder // ⭐ YENİ: Reorder buraya eklendi
} = require('../controllers/requestController');
const { getFeatures, createFeature, updateFeature, deleteFeature } = require('../controllers/featureController');
const { submitReview, getReviewsByRequest } = require('../controllers/reviewController');
const { getTests, createTest, updateTest, deleteTest } = require('../controllers/testController');
const { getListsByOwner, createList, addListItem, addRequestToList, removeListItem } = require('../controllers/listController');


// 1. Auth / OTP
router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);

// 2. Ayarlar
router.get('/settings', getSettings);
router.put('/settings', updateSetting);

// 3. Disambiguation (Anlam Karmaşası Çözücü)
router.post('/disambiguate', checkDisambiguation);

// 4. Özel Listeler
router.get('/lists/:ownerType/:ownerId', getListsByOwner);
router.post('/lists', createList);
router.post('/lists/:listId/items', addListItem);
router.post('/lists/:listId/requests', addRequestToList);
router.delete('/lists/items/:itemId', removeListItem);

// 5. Servis Sağlayıcılar
router.post('/providers', registerProvider);
router.get('/providers', getProviders);
router.get('/providers/by-phone', getProviderByPhone);
router.put('/providers/:id', updateProvider);
router.delete('/providers/:id', deleteProvider);

// ==========================================
// 6. TALEPLER VE HAVUZ (MARKETPLACE QUEUE)
// ==========================================

// ⭐ A) SABİT ROTALAR (PARAMETRESİZ OLANLAR ÜSTTE OLMALIDIR)
router.post('/requests/direct-reorder', createDirectReorder); // 🌟 DÜZELTİLDİ: /requests eklendi!
router.post('/requests/assign', assignProviderManually);
router.post('/requests', createRequest);

router.get('/requests/pool', getOpenPoolRequests);
router.get('/requests/my-requests', getUserRequests);
router.get('/requests/provider-requests', getProviderAssignedRequests);
router.get('/requests/pending', getPendingRequests);
router.get('/requests/matched', getMatchedRequests);

// ⭐ B) PARAMETRELİ ROTALAR (ALTTA OLMALIDIR)
router.post('/requests/:requestId/join-pool', joinRequestPool);
router.post('/requests/:requestId/next-provider', passToNextProvider);
router.post('/requests/:requestId/select-candidate', selectCandidateProvider);
router.post('/requests/:requestId/status', updateRequestStatus);
router.post('/requests/:requestId/providers/:providerId/details', upsertProviderRequestDetails);
router.delete('/requests/:requestId', deleteRequest);

// ==========================================

// 7. Bildirimler
router.get('/notifications', getOutboundNotifications);

// 8. Değerlendirme & Yorum
router.post('/reviews', submitReview);
router.get('/reviews/:requestId', getReviewsByRequest);

// 9. Proje Yol Haritası
router.get('/features', getFeatures);
router.post('/features', createFeature);
router.put('/features/:id', updateFeature);
router.delete('/features/:id', deleteFeature);

// 10. Sistem Test Senaryoları
router.get('/tests', getTests);
router.post('/tests', createTest);
router.put('/tests/:id', updateTest);
router.delete('/tests/:id', deleteTest);

router.post('/requests/:id/providers/:providerId/details', requestController.saveProviderDetails);

module.exports = router;