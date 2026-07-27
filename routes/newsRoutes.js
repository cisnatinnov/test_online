const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const newsController = require('../controllers/newsController');

router.get('/', authenticateToken, newsController.getNews);
router.get('/latest', authenticateToken, newsController.getLatestNews);
router.get('/stats', authenticateToken, newsController.getNewsStats);
router.get('/:id', authenticateToken, newsController.getNewsById);
router.post('/refresh', authenticateToken, authorize('admin'), newsController.refreshNews);

module.exports = router;
