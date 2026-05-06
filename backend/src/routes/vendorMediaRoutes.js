const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadImages } = require('../controllers/uploadController');

// Public endpoints for vendor media uploads (images or short videos)
// Accept multiple files in one request.

// Photo uploads for vendor application (1–10 photos)
router.post('/photos', upload.array('files', 10), uploadImages);

// Video uploads for vendor application (1–5 short videos)
router.post('/videos', upload.array('files', 5), uploadImages);

module.exports = router;

