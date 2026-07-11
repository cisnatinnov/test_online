const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const identityController = require('../controllers/identityController');

router.get('/', authenticateToken, identityController.getIdentities);
router.post('/', authenticateToken, authorize('admin'), identityController.createIdentity);
router.put('/:id', authenticateToken, identityController.updateIdentity);

module.exports = router;
