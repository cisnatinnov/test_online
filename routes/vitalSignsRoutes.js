const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticate');
const vitalSignsController = require('../controllers/vitalSignsController');

router.post('/', authenticateToken, vitalSignsController.createVitalSigns);
router.put('/:identityId', authenticateToken, vitalSignsController.updateVitalSigns);
router.get('/latest/:identityId', authenticateToken, vitalSignsController.getLatestVitalSigns);
router.get('/history/:identityId', authenticateToken, vitalSignsController.getHistoryVitalSigns);
router.get('/list', authenticateToken, vitalSignsController.getVitalSignsList);

module.exports = router;
