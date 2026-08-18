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
  assignProviderManually 
} = require('../controllers/requestController');

// 1. Auth / OTP
router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);

// 2. Disambiguate
router.post('/disambiguate', checkDisambiguation);

// 3. Provider CRUD
router.post('/providers', registerProvider);
router.get('/providers', getProviders);
router.put('/providers/:id', updateProvider);
router.delete('/providers/:id', deleteProvider);

// 4. Requests & WoZ
router.post('/requests', createRequest);
router.get('/requests/pending', getPendingRequests);
router.post('/requests/assign', assignProviderManually);

module.exports = router;