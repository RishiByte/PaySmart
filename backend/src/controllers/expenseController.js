const Expense = require('../models/Expense');

exports.createExpense = async (req, res) => {
    try {
        const { group, paidBy, amount, participants, description,
            isRecurring, recurrenceInterval, nextExecutionDate } = req.body;

        const expenseData = { group, paidBy, amount, participants, description };

        // Add optional recurring fields if provided
        if (isRecurring) {
            expenseData.isRecurring = true;
            expenseData.recurrenceInterval = recurrenceInterval;
            expenseData.nextExecutionDate = nextExecutionDate;
        }

        const expense = await Expense.create(expenseData);

        res.status(201).json(expense);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getExpenses = async (req, res) => {
    try {
        const filter = {};
        if (req.query.group) filter.group = req.query.group;
        const expenses = await Expense.find(filter)
            .populate('paidBy', 'name email')
            .populate('participants', 'name email')
            .sort({ createdAt: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) return res.status(404).json({ error: 'Expense not found' });
        res.status(200).json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
