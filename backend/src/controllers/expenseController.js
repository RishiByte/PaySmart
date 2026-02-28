const Expense = require('../models/Expense');

exports.createExpense = async (req, res) => {
    try {
        const { group, paidBy, amount, participants, description } = req.body;

        const expense = await Expense.create({
            group,
            paidBy,
            amount,
            participants,
            description,
        });

        res.status(201).json(expense);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getExpenses = async (req, res) => {
    try {
        const filter = {};
        if (req.query.group) filter.group = req.query.group;
        const expenses = await Expense.find(filter).sort({ createdAt: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
