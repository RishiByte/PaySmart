const Expense = require('../models/Expense');

/**
 * Process all due recurring expenses.
 * Clones each due expense as a new (non-recurring) expense,
 * then advances nextExecutionDate on the source.
 *
 * Duplicate-execution guard: only processes when nextExecutionDate <= now.
 * After processing, nextExecutionDate is set to the future, so re-running
 * within the same cycle is a no-op.
 *
 * @returns {Promise<Array>} Array of newly created expenses
 */
async function processRecurringExpenses() {
    const now = new Date();

    const dueExpenses = await Expense.find({
        isRecurring: true,
        nextExecutionDate: { $lte: now },
    });

    const created = [];

    for (const source of dueExpenses) {
        // Clone as a one-off expense
        const cloned = await Expense.create({
            group: source.group,
            paidBy: source.paidBy,
            amount: source.amount,
            participants: source.participants,
            description: source.description
                ? `${source.description} (recurring)`
                : 'Recurring expense',
            isRecurring: false,
            sourceExpense: source._id,
        });

        created.push(cloned);

        // Advance nextExecutionDate past now (handles catch-up scenarios)
        const next = new Date(source.nextExecutionDate);
        while (next <= now) {
            switch (source.recurrenceInterval) {
                case 'daily':
                    next.setDate(next.getDate() + 1);
                    break;
                case 'weekly':
                    next.setDate(next.getDate() + 7);
                    break;
                case 'monthly':
                    next.setMonth(next.getMonth() + 1);
                    break;
                default:
                    next.setDate(next.getDate() + 1);
            }
        }

        source.nextExecutionDate = next;
        await source.save();
    }

    return created;
}

module.exports = { processRecurringExpenses };
