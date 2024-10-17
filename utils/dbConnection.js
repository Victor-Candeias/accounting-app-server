const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env file

// Flag to track connection status
let isConnected = false;

/**
 * Establishes a connection to the MongoDB database if not already connected.
 * Uses mongoose to connect with options for parsing and unified topology.
 * 
 * @returns {Promise<mongoose.Connection>} - The mongoose connection object.
 * @throws Will throw an error if the connection fails.
 */
const connectDB = async () => {
  // Check if the database is already connected
  if (!isConnected) {
    try {
      // Attempt to establish a new connection
      await mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING, {
        useNewUrlParser: true,   // Use the new URL parser
        useUnifiedTopology: true // Use the new server discovery and monitoring engine
      });
      
      isConnected = true; // Set the flag to indicate a successful connection
      console.log('MongoDB connected successfully.');
    } catch (error) {
      console.error('MongoDB connection error:', error); // Log connection error details
      throw error; // Throw error to be handled by the calling code
    }
  }
  
  // Return the current mongoose connection
  return mongoose.connection;
};

// Export the connectDB function for use in other modules
module.exports = connectDB;
