const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticate');
const patientHealthController = require('../controllers/patientHealthController');

router.get('/risk/:identityId', authenticateToken, patientHealthController.getHealthRisk);
router.get('/trend/:identityId', authenticateToken, patientHealthController.getHealthTrend);
router.get('/alerts', authenticateToken, patientHealthController.getAlerts);
router.get('/population', authenticateToken, patientHealthController.getPopulationStats);

module.exports = router;
