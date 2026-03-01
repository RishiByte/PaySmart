const {
    createTransaction,
    makePayment,
    getTransactions,
} = require('../services/transaction.service');

exports.createTransaction = async (req, res) => {
    try {
        const { fromUser, toUser, groupId, totalAmount } = req.body;

        if (!fromUser || !toUser || !groupId || !totalAmount) {
            return res.status(400).json({ error: 'fromUser, toUser, groupId, and totalAmount are required' });
        }

        const transaction = await createTransaction({ fromUser, toUser, groupId, totalAmount });
        res.status(201).json(transaction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.makePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'A positive payment amount is required' });
        }

        const transaction = await makePayment(id, parseFloat(amount));
        res.json(transaction);
    } catch (err) {
        const status = err.message.includes('not found') ? 404 : 400;
        res.status(status).json({ error: err.message });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await getTransactions(req.query.groupId);
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
