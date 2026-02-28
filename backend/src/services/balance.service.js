const Expense = require('../models/Expense');

/**
 * Calculate optimized group balances using greedy debt minimization.
 * Matches the largest debtor with the largest creditor each iteration.
 * Complexity: O(U log U) where U = number of users.
 *
 * @param {string} groupId
 * @returns {Promise<Array<{ from: string, to: string, amount: number }>>}
 */
const calculateGroupBalances = async (groupId) => {
    const expenses = await Expense.find({ group: groupId });

    if (!expenses.length) {
        return [];
    }

    // ── Step 1: Build net balance map ──
    const balanceMap = {};

    for (const expense of expenses) {
        const payerId = expense.paidBy.toString();
        const share = expense.amount / expense.participants.length;

        // Payer gets credited the full amount
        balanceMap[payerId] = (balanceMap[payerId] || 0) + expense.amount;

        // Each participant owes their share
        for (const participant of expense.participants) {
            const participantId = participant.toString();
            balanceMap[participantId] = (balanceMap[participantId] || 0) - share;
        }
    }

    // Round all balances to 2 decimal places
    for (const userId in balanceMap) {
        balanceMap[userId] = Math.round(balanceMap[userId] * 100) / 100;
    }

    // ── Step 2: Separate into creditors and debtors ──
    const creditors = [];
    const debtors = [];

    for (const userId in balanceMap) {
        const balance = balanceMap[userId];
        if (balance > 0) {
            creditors.push({ userId, amount: balance });
        } else if (balance < 0) {
            debtors.push({ userId, amount: Math.abs(balance) });
        }
    }

    // ── Step 3: Greedy optimized settlement ──
    // Sort descending by amount — largest first for optimal matching
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transactions = [];

    while (creditors.length > 0 && debtors.length > 0) {
        // Always pick the largest creditor and largest debtor
        const creditor = creditors[0];
        const debtor = debtors[0];

        const settleAmount = Math.round(
            Math.min(debtor.amount, creditor.amount) * 100
        ) / 100;

        if (settleAmount > 0) {
            transactions.push({
                from: debtor.userId,
                to: creditor.userId,
                amount: settleAmount,
            });
        }

        // Reduce balances
        debtor.amount = Math.round((debtor.amount - settleAmount) * 100) / 100;
        creditor.amount = Math.round((creditor.amount - settleAmount) * 100) / 100;

        // Remove settled parties
        if (debtor.amount === 0) {
            debtors.shift();
        }
        if (creditor.amount === 0) {
            creditors.shift();
        }

        // Re-sort after each settlement to maintain greedy invariant
        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);
    }

    return transactions;
};

module.exports = { calculateGroupBalances };
