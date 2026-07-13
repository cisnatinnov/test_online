const express = require('express');
const router = express.Router();
const estateController = require('../controllers/estateController');

router.get('/', estateController.listEstates);
router.post('/', estateController.createEstate);
router.get('/:id/trees', estateController.getTrees);
router.post('/:id/tree', estateController.createTree);
router.get('/:id/stats', estateController.getStats);
router.get('/:id/drone-plan', estateController.getDronePlan);

module.exports = router;
