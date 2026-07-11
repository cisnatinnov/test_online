const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const adminController = require('../controllers/adminController');

router.get('/users', authenticateToken, authorize('admin'), adminController.getAllUsers);
router.get('/all-data', authenticateToken, authorize('admin'), adminController.getAllData);

module.exports = router;
