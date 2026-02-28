console.log(`[DEBUG] LOADED: ${__filename}`);
const express = require('express');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');

const app = express();

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'PaySmart API running' });
});

module.exports = app;