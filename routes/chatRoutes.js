const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticate');
const chatController = require('../controllers/chatController');

router.get('/rooms', authenticateToken, chatController.getRooms);
router.post('/rooms', authenticateToken, chatController.createRoom);
router.get('/rooms/:roomId/messages', authenticateToken, chatController.getMessages);
router.post('/rooms/:roomId/participants', authenticateToken, chatController.addParticipants);
router.delete('/rooms/:roomId/participants/:userId', authenticateToken, chatController.removeParticipants);
router.get('/users', authenticateToken, chatController.getAllUsers);
router.get('/online', authenticateToken, chatController.getOnlineUsers);

module.exports = router;
