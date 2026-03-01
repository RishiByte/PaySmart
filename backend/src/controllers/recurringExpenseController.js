const Expense = require('../models/Expense');
const { processRecurringExpenses } = require('../services/recurringExpense.service');

/**
 * GET /api/recurring-expenses
 * List all recurring expenses, optionally filtered by group.
 */
exports.getRecurringExpenses = async (req, res) => {
    try {
        const filter = { isRecurring: true };
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

/**
 * POST /api/recurring-expenses/trigger
 * Manually trigger recurring expense processing.
 * Deterministic — safe for demo/hackathon use.
 */
exports.triggerRecurringExpenses = async (req, res) => {
    try {
        const created = await processRecurringExpenses();
        res.json({
            success: true,
            message: `Processed ${created.length} recurring expense(s)`,
            created,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
