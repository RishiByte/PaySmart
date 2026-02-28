const Group = require('../models/Group');
const Expense = require('../models/Expense');

const createGroup = async (req, res) => {
    try {
        const { name, createdBy } = req.body;

        if (!name || !createdBy) {
            return res.status(400).json({ error: 'Name and createdBy are required' });
        }

        const group = new Group({ name, createdBy, members: [createdBy] });
        await group.save();

        return res.status(201).json(group);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const addMember = async (req, res) => {
    try {
        const { groupId, userId } = req.body;

        if (!groupId || !userId) {
            return res.status(400).json({ error: 'groupId and userId are required' });
        }

        const group = await Group.findByIdAndUpdate(
            groupId,
            { $addToSet: { members: userId } },
            { new: true }
        );

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        return res.status(200).json(group);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const getGroupBalances = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const expenses = await Expense.find({ group: groupId });

        // balance map: positive = owed money, negative = owes money
        const balances = {};

        // initialise all members to 0
        group.members.forEach((m) => {
            balances[m.toString()] = 0;
        });

        expenses.forEach((expense) => {
            const payer = expense.paidBy.toString();
            const share = expense.amount / expense.participants.length;

            // payer is owed the full amount
            balances[payer] = (balances[payer] || 0) + expense.amount;

            // each participant owes their share
            expense.participants.forEach((p) => {
                const pid = p.toString();
                balances[pid] = (balances[pid] || 0) - share;
            });
        });

        return res.json({ groupId, balances });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

module.exports = { createGroup, addMember, getGroupBalances };
