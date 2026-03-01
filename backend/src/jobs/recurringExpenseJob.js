/**
 * Optional cron job for recurring expense processing.
 * System works correctly even if this never runs —
 * POST /api/recurring-expenses/trigger is the primary mechanism.
 */

let cronStarted = false;

function startRecurringExpenseJob() {
    if (cronStarted) return;

    let cron;
    try {
        cron = require('node-cron');
    } catch (_e) {
        console.log('ℹ️  node-cron not installed — recurring expenses will only be processed via manual trigger.');
        return;
    }

    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        try {
            const { processRecurringExpenses } = require('../services/recurringExpense.service');
            const created = await processRecurringExpenses();
            if (created.length > 0) {
                console.log(`⏰ Cron: processed ${created.length} recurring expense(s)`);
            }
        } catch (err) {
            console.error('⏰ Cron: recurring expense error:', err.message);
        }
    });

    cronStarted = true;
    console.log('⏰ Recurring expense cron job started (hourly)');
}

module.exports = { startRecurringExpenseJob };
