const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-2fa', authController.send2FA);
router.post('/verify-2fa', authController.verify2FA);

module.exports = router;
