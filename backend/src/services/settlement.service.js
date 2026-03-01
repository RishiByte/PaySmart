const Settlement = require('../models/Settlement');
const Expense = require('../models/Expense');

/**
 * Calculate net balances for a group, subtracting already-settled amounts.
 * This keeps the expense ledger immutable — settlements are independent records.
 *
 * @param {string} groupId
 * @returns {Promise<Array<{ from: string, to: string, amount: number }>>}
 */
async function calculateSettlementAwareBalances(groupId) {
    const expenses = await Expense.find({ group: groupId });

    if (!expenses.length) return [];

    // ── Step 1: Build net balance map from expenses ──
    const balanceMap = {};

    for (const expense of expenses) {
        const payerId = expense.paidBy.toString();
        const share = expense.amount / expense.participants.length;

        balanceMap[payerId] = (balanceMap[payerId] || 0) + expense.amount;

        for (const participant of expense.participants) {
            const participantId = participant.toString();
            balanceMap[participantId] = (balanceMap[participantId] || 0) - share;
        }
    }

    // ── Step 2: Subtract already-settled amounts ──
    const settlements = await Settlement.find({ groupId });

    for (const record of settlements) {
        for (const s of record.settlements) {
            const fromId = s.fromUser.toString();
            const toId = s.toUser.toString();
            // The settled amount effectively reduces the debt:
            // fromUser owed toUser, so fromUser's balance goes up (less negative)
            // toUser's balance goes down (less positive)
            balanceMap[fromId] = (balanceMap[fromId] || 0) + s.amount;
            balanceMap[toId] = (balanceMap[toId] || 0) - s.amount;
        }
    }

    // Round all balances to 2 decimal places
    for (const userId in balanceMap) {
        balanceMap[userId] = Math.round(balanceMap[userId] * 100) / 100;
    }

    // ── Step 3: Greedy optimized settlement (same algorithm as balance.service) ──
    const creditors = [];
    const debtors = [];

    for (const userId in balanceMap) {
        const balance = balanceMap[userId];
        if (balance > 0) creditors.push({ userId, amount: balance });
        else if (balance < 0) debtors.push({ userId, amount: Math.abs(balance) });
    }

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transactions = [];

    while (creditors.length > 0 && debtors.length > 0) {
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

        debtor.amount = Math.round((debtor.amount - settleAmount) * 100) / 100;
        creditor.amount = Math.round((creditor.amount - settleAmount) * 100) / 100;

        if (debtor.amount === 0) debtors.shift();
        if (creditor.amount === 0) creditors.shift();

        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);
    }

    return transactions;
}

/**
 * Simulate settlement: compute current debts, store as independent Settlement record.
 * Expense ledger remains immutable.
 */
async function simulateSettlement(groupId) {
    const currentDebts = await calculateSettlementAwareBalances(groupId);

    if (currentDebts.length === 0) {
        return { message: 'No outstanding debts to settle', settlement: null };
    }

    const settlement = await Settlement.create({
        groupId,
        settlements: currentDebts.map((d) => ({
            fromUser: d.from,
            toUser: d.to,
            amount: d.amount,
        })),
        settledAt: new Date(),
    });

    return { message: 'Group settled successfully', settlement };
}

/**
 * Get settlement history for a group.
 */
async function getSettlementHistory(groupId) {
    return Settlement.find({ groupId })
        .populate('settlements.fromUser', 'name email')
        .populate('settlements.toUser', 'name email')
        .sort({ settledAt: -1 });
}

module.exports = {
    simulateSettlement,
    getSettlementHistory,
    calculateSettlementAwareBalances,
};
