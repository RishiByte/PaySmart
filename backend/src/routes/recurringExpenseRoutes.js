const express = require('express');
const router = express.Router();
const {
    getRecurringExpenses,
    triggerRecurringExpenses,
} = require('../controllers/recurringExpenseController');

router.get('/', getRecurringExpenses);
router.post('/trigger', triggerRecurringExpenses);

module.exports = router;
