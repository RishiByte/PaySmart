console.log(`[DEBUG] LOADED: ${__filename}`);
const express = require('express');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const balanceRoutes = require('./routes/balanceRoutes');

const app = express();

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/groups', balanceRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'PaySmart API running' });
});

module.exports = app;