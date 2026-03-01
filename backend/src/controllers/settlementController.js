const {
    simulateSettlement,
    getSettlementHistory,
} = require('../services/settlement.service');

/**
 * POST /api/groups/:groupId/settle
 * Mark debts as settled WITHOUT real payment.
 */
exports.settleGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const result = await simulateSettlement(groupId);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * GET /api/groups/:groupId/settlements
 * View settlement history for a group.
 */
exports.getSettlementHistory = async (req, res) => {
    try {
        const { groupId } = req.params;
        const history = await getSettlementHistory(groupId);
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
