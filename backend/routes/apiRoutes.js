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
  getPendingRequests,
  getMatchedRequests,
  getUserRequests,
  updateRequestStatus,
  assignProviderManually,
  getOutboundNotifications
} = require('../controllers/requestController');

// 1. Auth / OTP
router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);

// 2. Disambiguation
router.post('/disambiguate', checkDisambiguation);

// 3. Servis Sağlayıcılar CRUD
router.post('/providers', registerProvider);
router.get('/providers', getProviders);
router.put('/providers/:id', updateProvider);
router.delete('/providers/:id', deleteProvider);

// 4. Talepler & Yaşam Döngüsü
router.post('/requests', createRequest);
router.get('/requests/pending', getPendingRequests);
router.get('/requests/matched', getMatchedRequests);
router.get('/requests/my-requests', getUserRequests);
router.patch('/requests/:requestId/status', updateRequestStatus);
router.post('/requests/assign', assignProviderManually);

// 5. Giden SMS / Bildirim Logları
router.get('/notifications', getOutboundNotifications);

module.exports = router;