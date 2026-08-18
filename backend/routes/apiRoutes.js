const express = require('express');
const router = express.Router();

// Controller'ları içe aktar
const authController = require('../controllers/authController');
const disambiguateController = require('../controllers/disambiguateController');
const providerController = require('../controllers/providerController');
const requestController = require('../controllers/requestController');

// 1. Auth / OTP
router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/verify-otp', authController.verifyOtp);

// 2. Niyet Netleştirme
router.post('/disambiguate', disambiguateController.checkDisambiguation);

// 3. Servis Verenler CRUD
router.post('/providers', providerController.registerProvider);
router.get('/providers', providerController.getProviders);
router.put('/providers/:id', providerController.updateProvider);
router.delete('/providers/:id', providerController.deleteProvider);

// 4. Talepler ve WoZ Operatör Havuzu
router.post('/requests', requestController.createRequest);
router.get('/requests/pending', requestController.getPendingRequests);
router.post('/requests/assign', requestController.assignProviderManually);

module.exports = router;