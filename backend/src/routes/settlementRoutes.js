const express = require('express');
const router = express.Router();
const {
    settleGroup,
    getSettlementHistory,
} = require('../controllers/settlementController');

router.post('/:groupId/settle', settleGroup);
router.get('/:groupId/settlements', getSettlementHistory);

module.exports = router;
