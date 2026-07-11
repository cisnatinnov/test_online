const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticate');
const bloodSugarController = require('../controllers/bloodSugarController');

router.post('/', authenticateToken, bloodSugarController.createBloodSugar);
router.put('/:identityId', authenticateToken, bloodSugarController.updateBloodSugar);
router.get('/history/:identityId', authenticateToken, bloodSugarController.getHistoryBloodSugar);

module.exports = router;
