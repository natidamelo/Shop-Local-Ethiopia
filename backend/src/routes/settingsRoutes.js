const express = require('express');
const router = express.Router();
const { getSettings, getBazarRegistrationStatus } = require('../controllers/settingsController');

router.get('/', getSettings);
router.get('/bazar-registration', getBazarRegistrationStatus);

module.exports = router;
