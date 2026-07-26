const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const authenticateToken = require('../middlewares/authenticate');

router.get('/', healthController.getHealth);
router.get('/ready', healthController.getReady);
router.get('/live', healthController.getLive);
router.get('/stats', authenticateToken, healthController.getStats);

module.exports = router;
