const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  setupMfa,
  verifyMfa,
  disableMfa,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email', verifyEmail);
router.post('/mfa/setup', protect, setupMfa);
router.post('/mfa/verify', protect, verifyMfa);
router.post('/mfa/disable', protect, disableMfa);

module.exports = router;
