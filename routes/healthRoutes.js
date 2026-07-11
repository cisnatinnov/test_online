const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/', healthController.getHealth);
router.get('/ready', healthController.getReady);
router.get('/live', healthController.getLive);
router.get('/stats', healthController.getStats);

module.exports = router;
