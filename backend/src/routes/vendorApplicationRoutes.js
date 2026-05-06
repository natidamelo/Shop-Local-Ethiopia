const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createVendorApplication,
  getMyVendorApplications,
  getAllVendorApplications,
  getVendorApplicationById,
  updateVendorApplicationAdmin,
  getVendorApplicationStats,
} = require('../controllers/vendorApplicationController');

// Vendor/bazar application submission (must be logged in so we can link to their account)
router.post('/', protect, createVendorApplication);

// Logged-in user: view own applications
router.get('/my', protect, getMyVendorApplications);

// Admin: reporting & management
router.get('/admin/stats', protect, adminOnly, getVendorApplicationStats);
router.get('/admin', protect, adminOnly, getAllVendorApplications);
router.get('/admin/:id', protect, adminOnly, getVendorApplicationById);
router.put('/admin/:id', protect, adminOnly, updateVendorApplicationAdmin);

module.exports = router;

