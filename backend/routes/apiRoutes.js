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

// Auth / OTP Rotaları
router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);

// Niyet Netleştirme
router.post('/disambiguate', checkDisambiguation);

// Servis Veren CRUD
router.post('/providers', registerProvider);
router.get('/providers', getProviders);
router.put('/providers/:id', updateProvider);
router.delete('/providers/:id', deleteProvider);

// Talepler ve WoZ Operatör Havuzu
router.post('/requests', createRequest);
router.get('/requests/pending', getPendingRequests);
router.post('/requests/assign', assignProviderManually);

module.exports = router;