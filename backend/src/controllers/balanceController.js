const Expense = require('../models/Expense');

exports.getGroupBalances = async (req, res) => {
    try {
        const { groupId } = req.params;

        const expenses = await Expense.find({ group: groupId });

        const balances = {};

        for (const expense of expenses) {
            const share = expense.amount / expense.participants.length;

            // payer gets money
            balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;

            // participants owe money
            for (const user of expense.participants) {
                balances[user] = (balances[user] || 0) - share;
            }
        }

        res.json({ balances });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
