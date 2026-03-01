const express = require('express');
const router = express.Router();
const {
    createTransaction,
    makePayment,
    getTransactions,
} = require('../controllers/transactionController');

router.post('/', createTransaction);
router.post('/:id/pay', makePayment);
router.get('/', getTransactions);

module.exports = router;
