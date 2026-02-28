require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  console.log('⏳ Connecting to MongoDB...');
  await connectDB();
  console.log('✅ DB ready — starting server...');

  app.listen(PORT, () => {
    console.log(`🚀 PaySmart running on port ${PORT}`);
  });
};

startServer();