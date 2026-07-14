const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const libraryController = require('../controllers/libraryController');

router.get('/settings', authenticateToken, libraryController.getSettings);
router.put('/settings', authenticateToken, authorize('admin'), libraryController.updateSettings);

router.get('/stats', authenticateToken, libraryController.getStats);
router.get('/categories', authenticateToken, libraryController.getCategories);
router.get('/borrowings', authenticateToken, libraryController.listBorrowings);
router.post('/overdue/update', authenticateToken, libraryController.updateOverdueBorrowings);

router.get('/', authenticateToken, libraryController.listBooks);
router.post('/', authenticateToken, libraryController.createBook);
router.get('/:id', authenticateToken, libraryController.getBook);
router.put('/:id', authenticateToken, libraryController.updateBook);
router.delete('/:id', authenticateToken, libraryController.deleteBook);

router.post('/:id/borrow', authenticateToken, libraryController.borrowBook);
router.post('/:id/return/:borrowId', authenticateToken, libraryController.returnBook);

module.exports = router;
