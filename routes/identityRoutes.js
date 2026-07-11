const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticate');
const identityController = require('../controllers/identityController');

router.get('/', authenticateToken, identityController.getIdentities);
router.post('/', authenticateToken, identityController.createIdentity);
router.put('/:id', authenticateToken, identityController.updateIdentity);

module.exports = router;
