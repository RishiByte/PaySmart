const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        fromUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        toUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
        remainingAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'partial', 'completed'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
