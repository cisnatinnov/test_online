const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticate');
const categoryController = require('../controllers/categoryController');

router.get('/', authenticateToken, categoryController.getCategories);
router.post('/', authenticateToken, categoryController.createCategory);
router.put('/:id', authenticateToken, categoryController.updateCategory);
router.delete('/:id', authenticateToken, categoryController.deleteCategory);

module.exports = router;
