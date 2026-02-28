const Group = require('../models/Group');

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

const getGroups = async (req, res) => {
    try {
        const groups = await Group.find().sort({ createdAt: -1 });
        return res.json(groups);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

module.exports = { createGroup, addMember, getGroups };
