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

// Auth / OTP
router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);

// Disambiguation
router.post('/disambiguate', checkDisambiguation);

// Servis Sağlayıcılar
router.post('/providers', registerProvider);
router.get('/providers', getProviders);
router.get('/providers/by-phone', getProviderByPhone);
router.put('/providers/:id', updateProvider);
router.delete('/providers/:id', deleteProvider);

// Talepler & Süreç
router.post('/requests', createRequest);
router.get('/requests/my-requests', getUserRequests);
router.get('/requests/provider-requests', getProviderAssignedRequests);
router.post('/requests/:requestId/next-provider', passToNextProvider);
router.post('/requests/:requestId/select-candidate', selectCandidateProvider);
router.post('/requests/:requestId/status', updateRequestStatus);
router.delete('/requests/:requestId', deleteRequest);

// WoZ ve Loglar
router.get('/requests/pending', getPendingRequests);
router.get('/requests/matched', getMatchedRequests);
router.post('/requests/assign', assignProviderManually);
router.get('/notifications', getOutboundNotifications);

// Proje Özellikleri / Yol Haritası CRUD
router.get('/features', getFeatures);
router.post('/features', createFeature);
router.put('/features/:id', updateFeature);
router.delete('/features/:id', deleteFeature);

module.exports = router;