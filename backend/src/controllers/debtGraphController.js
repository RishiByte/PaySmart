const { buildDebtGraph } = require('../services/debtGraph.service');

/**
 * GET /api/groups/:groupId/debt-graph
 * Return graph-ready structure for debt visualization.
 */
exports.getDebtGraph = async (req, res) => {
    try {
        const { groupId } = req.params;
        const graph = await buildDebtGraph(groupId);
        res.json({ success: true, ...graph });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
