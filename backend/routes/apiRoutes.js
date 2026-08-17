const express = require('express');
const router = express.Router();

const { checkDisambiguation } = require('../controllers/disambiguateController');
const { registerProvider, getProviders } = require('../controllers/providerController');
const { createRequest, getPendingRequests, assignProviderManually } = require('../controllers/requestController');

// Niyet Netleştirme
router.post('/disambiguate', checkDisambiguation);

// Servis Verenler
router.post('/providers', registerProvider);
router.get('/providers', getProviders);

// Talepler ve Eşleştirme
router.post('/requests', createRequest);
router.get('/requests/pending', getPendingRequests);
router.post('/requests/assign', assignProviderManually);

module.exports = router;