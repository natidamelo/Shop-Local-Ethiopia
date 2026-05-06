const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadImage, uploadImages, uploadVideo } = require('../controllers/uploadController');

// Test route to verify upload routes are working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Upload routes are working' });
});

// Single image upload
router.post('/image', protect, adminOnly, upload.single('image'), uploadImage);

// Multiple images upload
router.post('/images', protect, adminOnly, upload.array('images', 10), uploadImages);

// Single video upload
router.post('/video', protect, adminOnly, upload.single('video'), uploadVideo);

module.exports = router;
