const Group = require('../models/Group');
const User = require('../models/User');
const { calculateGroupBalances } = require('./balance.service');

/**
 * Build a graph-ready data structure for debt visualization.
 *
 * @param {string} groupId
 * @returns {Promise<{ nodes: Array, edges: Array }>}
 */
async function buildDebtGraph(groupId) {
    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) throw new Error('Group not found');

    const nodes = (group.members || []).map((m) => ({
        id: m._id.toString(),
        label: m.name,
        email: m.email,
    }));

    const optimizedDebts = await calculateGroupBalances(groupId);

    const edges = optimizedDebts.map((d) => {
        const fromUser = group.members.find((m) => m._id.toString() === d.from);
        const toUser = group.members.find((m) => m._id.toString() === d.to);

        return {
            from: d.from,
            to: d.to,
            fromLabel: fromUser?.name || d.from,
            toLabel: toUser?.name || d.to,
            weight: d.amount,
        };
    });

    return { nodes, edges };
}

module.exports = { buildDebtGraph };
