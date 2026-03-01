const { calculateGroupBalances } = require('../services/balance.service');

exports.getGroupBalances = async (req, res) => {
    try {
        const { groupId } = req.params;

        const balances = await calculateGroupBalances(groupId);

        res.json({
            success: true,
            balances,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

exports.getOptimizedBalances = async (req, res) => {
    try {
        const { groupId } = req.params;

        const transactions = await calculateGroupBalances(groupId);

        res.json({
            success: true,
            groupId,
            optimizedTransactions: transactions,
            transactionCount: transactions.length,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};
