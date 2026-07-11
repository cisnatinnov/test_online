const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticate');
const reportController = require('../controllers/reportController');

router.get('/pdf/:identityId', authenticateToken, reportController.exportPDF);

module.exports = router;
