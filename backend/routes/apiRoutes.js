const express = require('express');
const router = express.Router();

const { sendOtp, verifyOtp } = require('../controllers/authController');
const { checkDisambiguation } = require('../controllers/disambiguateController');
const { 
  registerProvider, 
  getProviders, 
  updateProvider, 
  deleteProvider 
} = require('../controllers/providerController');
const { 
  createRequest, 
  getUserRequests,
  passToNextProvider,
  selectCandidateProvider,
  updateRequestStatus,
  getPendingRequests,
  getMatchedRequests,
  assignProviderManually,
  getOutboundNotifications
} = require('../controllers/requestController');

// Auth / OTP
router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);

// Disambiguation
router.post('/disambiguate', checkDisambiguation);

// Servis Sağlayıcılar
router.post('/providers', registerProvider);
router.get('/providers', getProviders);
router.put('/providers/:id', updateProvider);
router.delete('/providers/:id', deleteProvider);

// Talepler & Çoklu Aday Yönetimi
router.post('/requests', createRequest);
router.get('/requests/my-requests', getUserRequests);
router.post('/requests/:requestId/next-provider', passToNextProvider);
router.post('/requests/:requestId/select-candidate', selectCandidateProvider);

// Durum Güncelleme (POST olarak güncellendi)
router.post('/requests/:requestId/status', updateRequestStatus);

// WoZ ve Loglar
router.get('/requests/pending', getPendingRequests);
router.get('/requests/matched', getMatchedRequests);
router.post('/requests/assign', assignProviderManually);
router.get('/notifications', getOutboundNotifications);

module.exports = router;