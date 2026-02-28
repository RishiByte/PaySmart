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
