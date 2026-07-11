const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticate');
const moneyController = require('../controllers/moneyController');

router.post('/expense', authenticateToken, moneyController.createExpense);
router.get('/expense', authenticateToken, moneyController.getExpenses);
router.put('/expense/:id', authenticateToken, moneyController.updateExpense);
router.delete('/expense/:id', authenticateToken, moneyController.deleteExpense);

router.post('/saving', authenticateToken, moneyController.createSaving);
router.get('/saving', authenticateToken, moneyController.getSavings);
router.put('/saving/:id', authenticateToken, moneyController.updateSaving);
router.delete('/saving/:id', authenticateToken, moneyController.deleteSaving);

router.get('/chart', authenticateToken, moneyController.getChart);
router.get('/summary', authenticateToken, moneyController.getSummary);

module.exports = router;
