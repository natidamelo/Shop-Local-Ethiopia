const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  stripeCreateIntent,
  paypalCreateOrder,
  paypalCaptureOrder,
  flutterwaveInitiate,
  chapaInitiate,
  chapaVerify,
  getMyPayments,
} = require('../controllers/paymentController');

router.get('/my-payments', protect, getMyPayments);
router.post('/stripe/create-intent', protect, stripeCreateIntent);
router.post('/paypal/create-order', protect, paypalCreateOrder);
router.post('/paypal/capture', protect, paypalCaptureOrder);
router.post('/flutterwave/initiate', protect, flutterwaveInitiate);
router.post('/chapa/initiate', protect, chapaInitiate);
router.get('/chapa/verify/:txRef', protect, chapaVerify);

module.exports = router;
