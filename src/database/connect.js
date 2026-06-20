const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.warn('MONGODB_URI is not set. Database-backed modules will not work until it is configured.');
    return null;
  }

  mongoose.set('strictQuery', true);

  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    });

    logger.success(`Connected to MongoDB database: ${connection.connection.name}`);
    return connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB.', error);
    throw error;
  }
}

module.exports = { connectDatabase };
