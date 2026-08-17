const express = require('express');
const router = express.Router();

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

// Niyet Netleştirme
router.post('/disambiguate', checkDisambiguation);

// Servis Veren CRUD Rotaları
router.post('/providers', registerProvider);
router.get('/providers', getProviders);
router.put('/providers/:id', updateProvider);
router.delete('/providers/:id', deleteProvider);

// Talepler ve Operatör Eşleştirme
router.post('/requests', createRequest);
router.get('/requests/pending', getPendingRequests);
router.post('/requests/assign', assignProviderManually);

module.exports = router;