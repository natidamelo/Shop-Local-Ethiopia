const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const {
  getAllOrders,
  updateOrderStatus,
  getAnalytics,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/orderController');
const { getAdminSettings, updateSettings } = require('../controllers/settingsController');
const {
  getFinancialOverview,
  getTransactions,
  getRevenueChart,
  processRefund,
} = require('../controllers/financialController');
const {
  getInventorySummary,
  getLowStockProducts,
  adjustStock,
  setStock,
  bulkAdjustStock,
  getStockHistory,
  getAllMovements,
  updateThreshold,
} = require('../controllers/stockController');

router.use(protect, adminOnly);

router.get('/analytics', getAnalytics);

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

router.get('/settings', getAdminSettings);
router.put('/settings', updateSettings);

// Inventory routes
router.get('/inventory/summary', getInventorySummary);
router.get('/inventory/low-stock', getLowStockProducts);
router.get('/inventory/movements', getAllMovements);
router.put('/inventory/bulk-adjust', bulkAdjustStock);
router.put('/inventory/:productId/adjust', adjustStock);
router.put('/inventory/:productId/set', setStock);
router.put('/inventory/:productId/threshold', updateThreshold);
router.get('/inventory/:productId/history', getStockHistory);

// Financial routes
router.get('/financial/overview', getFinancialOverview);
router.get('/financial/transactions', getTransactions);
router.get('/financial/revenue-chart', getRevenueChart);
router.post('/financial/refund/:paymentId', processRefund);

module.exports = router;
