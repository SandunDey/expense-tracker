const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticate } = require('../middleware/auth');

router.post('/reset/seed', authenticate, systemController.resetSampleData);

module.exports = router;
