const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  validateCoupon,
} = require('../controllers/orderController');

// Specific routes must come before parameterised routes
router.post('/validate-coupon', optionalAuth, validateCoupon);

router.post('/', protect, createOrder);
router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

module.exports = router;
