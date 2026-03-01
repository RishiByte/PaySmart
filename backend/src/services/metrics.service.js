const Expense = require('../models/Expense');
const { calculateGroupBalances } = require('./balance.service');

/**
 * Compute optimization efficiency metrics for a group.
 *
 * "Original transactions" = the naive pairwise count: every expense generates
 * one debt per non-payer participant.
 *
 * "Optimized transactions" = the greedy-minimized count from the balance service.
 *
 * @param {string} groupId
 * @returns {Promise<{ originalTransactions: number, optimizedTransactions: number, reductionPercentage: number }>}
 */
async function computeReductionMetrics(groupId) {
    const expenses = await Expense.find({ group: groupId });

    // Count naive pairwise transactions
    let originalTransactions = 0;
    for (const expense of expenses) {
        // Each participant who is NOT the payer owes once
        for (const participant of expense.participants) {
            if (participant.toString() !== expense.paidBy.toString()) {
                originalTransactions++;
            }
        }
    }

    // Optimized transactions from the greedy algorithm
    const optimized = await calculateGroupBalances(groupId);
    const optimizedTransactions = optimized.length;

    const reductionPercentage =
        originalTransactions === 0
            ? 0
            : Math.round(
                ((originalTransactions - optimizedTransactions) / originalTransactions) * 10000
            ) / 100;

    return {
        originalTransactions,
        optimizedTransactions,
        reductionPercentage,
    };
}

module.exports = { computeReductionMetrics };
