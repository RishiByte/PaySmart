console.log(`[DEBUG] LOADED: ${__filename}`);
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const balanceRoutes = require('./routes/balanceRoutes');

// Phase 2 routes
const recurringExpenseRoutes = require('./routes/recurringExpenseRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const settlementRoutes = require('./routes/settlementRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const debtGraphRoutes = require('./routes/debtGraphRoutes');

const app = express();

app.use(express.json());
app.use(cors());

// Existing routes
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/groups', balanceRoutes);

// Phase 2 routes
app.use('/api/recurring-expenses', recurringExpenseRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/groups', settlementRoutes);
app.use('/api/groups', metricsRoutes);
app.use('/api/groups', debtGraphRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'PaySmart API running' });
});

module.exports = app;