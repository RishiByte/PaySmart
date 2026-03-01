const Transaction = require('../models/Transaction');

/**
 * Create a new partial-payment transaction.
 */
async function createTransaction(data) {
    const { fromUser, toUser, groupId, totalAmount } = data;

    const transaction = await Transaction.create({
        fromUser,
        toUser,
        groupId,
        totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        status: 'pending',
    });

    return transaction;
}

/**
 * Record a partial (or full) payment against a transaction.
 * Updates paidAmount, remainingAmount, and status accordingly.
 */
async function makePayment(transactionId, amount) {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status === 'completed') throw new Error('Transaction already completed');
    if (amount <= 0) throw new Error('Payment amount must be positive');
    if (amount > transaction.remainingAmount) {
        throw new Error(`Payment amount exceeds remaining balance of ${transaction.remainingAmount}`);
    }

    transaction.paidAmount = Math.round((transaction.paidAmount + amount) * 100) / 100;
    transaction.remainingAmount = Math.round((transaction.totalAmount - transaction.paidAmount) * 100) / 100;

    if (transaction.remainingAmount === 0) {
        transaction.status = 'completed';
    } else {
        transaction.status = 'partial';
    }

    await transaction.save();
    return transaction;
}

/**
 * Get transactions, optionally filtered by groupId.
 */
async function getTransactions(groupId) {
    const filter = {};
    if (groupId) filter.groupId = groupId;
    return Transaction.find(filter)
        .populate('fromUser', 'name email')
        .populate('toUser', 'name email')
        .sort({ createdAt: -1 });
}

module.exports = { createTransaction, makePayment, getTransactions };
