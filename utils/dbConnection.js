const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false; // Flag to track connection status

const connectDB = async () => {
  if (!isConnected) {
    try {
      await mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      isConnected = true;
      console.log('MongoDB connected successfully.');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }
  return mongoose.connection;
};

module.exports = connectDB;
