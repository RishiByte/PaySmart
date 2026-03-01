const express = require('express');
const router = express.Router();
const { getGroupBalances, getOptimizedBalances } = require('../controllers/balanceController');

router.get('/:groupId/balances', getGroupBalances);
router.get('/:groupId/optimize', getOptimizedBalances);

module.exports = router;
