const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getShippingRates,
  calculateShipping,
  adminGetRates,
  adminUpdateRate,
  adminCreateRate,
  adminDeleteRate,
} = require('../controllers/shippingController');

// Public — used by checkout to get available methods + prices
router.get('/rates', getShippingRates);
router.post('/calculate', protect, calculateShipping);

// Admin
router.get('/admin/rates', protect, adminOnly, adminGetRates);
router.post('/admin/rates', protect, adminOnly, adminCreateRate);
router.put('/admin/rates/:id', protect, adminOnly, adminUpdateRate);
router.delete('/admin/rates/:id', protect, adminOnly, adminDeleteRate);

module.exports = router;
