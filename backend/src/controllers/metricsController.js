const { computeReductionMetrics } = require('../services/metrics.service');

/**
 * GET /api/groups/:groupId/metrics
 * Return optimization efficiency metrics.
 */
exports.getMetrics = async (req, res) => {
    try {
        const { groupId } = req.params;
        const metrics = await computeReductionMetrics(groupId);
        res.json({ success: true, ...metrics });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
