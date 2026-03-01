const express = require('express');
const router = express.Router();
const { getDebtGraph } = require('../controllers/debtGraphController');

router.get('/:groupId/debt-graph', getDebtGraph);

module.exports = router;
