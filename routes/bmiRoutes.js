const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticate');
const bmiController = require('../controllers/bmiController');

router.post('/', authenticateToken, bmiController.createBMI);
router.put('/:identityId', authenticateToken, bmiController.updateBMI);
router.get('/list', authenticateToken, bmiController.getBMIList);
router.get('/history/:identityId', authenticateToken, bmiController.getHistoryBMI);

module.exports = router;
