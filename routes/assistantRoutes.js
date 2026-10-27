const express = require('express');
const rateLimit = require('express-rate-limit');
const authenticateToken = require('../middlewares/authenticate');
const assistant = require('../controllers/assistantController');
const router = express.Router();
router.use(authenticateToken);
router.get('/status', assistant.getStatus);
router.post('/chat', rateLimit({
  windowMs: 60 * 1000, max: 15,
  keyGenerator: req => String(req.user.id),
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: 'AI_RATE_LIMITED' },
}), assistant.streamReply);
module.exports = router;
