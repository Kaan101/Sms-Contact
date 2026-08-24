const express = require('express');
const router = express.Router();

const { sendOtp, verifyOtp } = require('../controllers/authController');
const { checkDisambiguation } = require('../controllers/disambiguateController');
const { 
  registerProvider, 
  getProviders,
  getProviderByPhone,
  updateProvider, 
  deleteProvider 
} = require('../controllers/providerController');
const { 
  createRequest, 
  getOpenPoolRequests,     // YENİ
  joinRequestPool,         // YENİ
  getUserRequests,
  getProviderAssignedRequests,
  passToNextProvider,
  selectCandidateProvider,
  updateRequestStatus,
  getPendingRequests,
  getMatchedRequests,
  assignProviderManually,
  getOutboundNotifications,
  deleteRequest
} = require('../controllers/requestController');
const {
  getFeatures,
  createFeature,
  updateFeature,
  deleteFeature
} = require('../controllers/featureController');
const {
  submitReview,
  getReviewsByRequest
} = require('../controllers/reviewController');
const {
  getTests,
  createTest,
  updateTest,
  deleteTest
} = require('../controllers/testController');

// 1. Dosyanın en üstüne import edin
const { getSettings, updateSetting } = require('../controllers/settingsController');

// 2. Rotaları (router) tanımladığınız yere ekleyin
router.get('/settings', getSettings);
router.put('/settings', updateSetting);

// 1. Auth / OTP
router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);

// 2. Disambiguation
router.post('/disambiguate', checkDisambiguation);

// 3. Servis Sağlayıcılar
router.post('/providers', registerProvider);
router.get('/providers', getProviders);
router.get('/providers/by-phone', getProviderByPhone);
router.put('/providers/:id', updateProvider);
router.delete('/providers/:id', deleteProvider);

// 4. Talepler ve Havuz (Marketplace Queue)
router.post('/requests', createRequest);
router.get('/requests/pool', getOpenPoolRequests);                   // 🌟 YENİ: Havuzdaki talepleri getir
router.post('/requests/:requestId/join-pool', joinRequestPool);      // 🌟 YENİ: Sağlayıcı havuza katılır
router.get('/requests/my-requests', getUserRequests);
router.get('/requests/provider-requests', getProviderAssignedRequests);
router.post('/requests/:requestId/next-provider', passToNextProvider);
router.post('/requests/:requestId/select-candidate', selectCandidateProvider);
router.post('/requests/:requestId/status', updateRequestStatus);
router.delete('/requests/:requestId', deleteRequest);

// 5. WoZ & Bildirimler
router.get('/requests/pending', getPendingRequests);
router.get('/requests/matched', getMatchedRequests);
router.post('/requests/assign', assignProviderManually);
router.get('/notifications', getOutboundNotifications);

// 6. Proje Yol Haritası
router.get('/features', getFeatures);
router.post('/features', createFeature);
router.put('/features/:id', updateFeature);
router.delete('/features/:id', deleteFeature);

// 7. Değerlendirme & Yorum
router.post('/reviews', submitReview);
router.get('/reviews/:requestId', getReviewsByRequest);

// 8. Sistem Test Senaryoları
router.get('/tests', getTests);
router.post('/tests', createTest);
router.put('/tests/:id', updateTest);
router.delete('/tests/:id', deleteTest);

module.exports = router;