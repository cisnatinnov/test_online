const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const healthTrafficController = require('../controllers/healthTrafficController');

router.get('/stats', authenticateToken, authorize('admin'), healthTrafficController.getTrafficStats);

module.exports = router;
