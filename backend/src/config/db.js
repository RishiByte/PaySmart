const mongoose = require('mongoose');
let mongoServer; // keep reference when using in-memory server

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    if (!uri) {
      // Fallback for local development: start an in-memory MongoDB
      // Uses devDependency `mongodb-memory-server` if available
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        console.log('No MONGO_URI provided — starting in-memory MongoDB...');
        mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
      } catch (e) {
        console.error('mongodb-memory-server not available; please set MONGO_URI', e.message);
        throw e;
      }
    }

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
