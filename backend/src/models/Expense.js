const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
    {
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            required: true,
        },
        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        description: String,
        isRecurring: {
            type: Boolean,
            default: false,
        },
        recurrenceInterval: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
        },
        nextExecutionDate: {
            type: Date,
        },
        sourceExpense: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Expense',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
