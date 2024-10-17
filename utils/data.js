const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables from .env file

// Define user schema
/**
 * User schema for storing user credentials and metadata.
 * @type {mongoose.Schema}
 */
const users = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Username (required)
    password: { type: String, required: true }, // User password (required)
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

// Define data schema
/**
 * Data schema for storing transaction or record information.
 * @type {mongoose.Schema}
 */
const data = new mongoose.Schema(
  {
    user: { type: String, required: true }, // User ID or username associated with the data
    day: { type: String, required: true }, // Day of the record
    month: { type: String, required: true }, // Month of the record
    year: { type: String, required: true }, // Year of the record
    description: { type: String, required: true }, // Description of the record
    value: { type: String, required: true }, // Transaction value or amount
    entry: { type: String, required: true }, // Type of entry (e.g., income or expense)
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

// Define logs schema
/**
 * Logs schema for tracking application logs.
 * @type {mongoose.Schema}
 */
const logs = new mongoose.Schema(
  {
    day: { type: String, required: true }, // Date of the log entry
    level: { type: String, required: true }, // Log level (e.g., info, error)
    message: { type: String, required: true }, // Log message content
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

/**
 * Singleton class for interacting with the MongoDB database.
 */
class Database {
  // Static property to hold the single instance of the Database class
  static instance = null;

  /**
   * Constructor to initialize the database connection and models.
   * If an instance already exists, return it.
   */
  constructor() {
    // If an instance already exists, return it
    if (Database.instance) {
      return Database.instance;
    }

    // Otherwise, create a new instance
    this.uri = process.env.MONGO_DB_CONNECTION_STRING; // MongoDB connection string from environment variables
    this.connect(); // Establish connection to MongoDB
    this.UsersModel = mongoose.model("users", users); // Create user model
    this.DataModel = mongoose.model("data", data); // Create data model
    this.LogModel = mongoose.model("logs", logs); // Create log model

    // Store the instance in the static property for future reuse
    Database.instance = this;
  }

  /**
   * Connect to the MongoDB database.
   * @async
   */
  async connect() {
    try {
      await mongoose.connect(this.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("MongoDB connected successfully."); // Log success message on successful connection
    } catch (error) {
      console.error("MongoDB connection error:", error); // Log error if the connection fails
    }
  }

  /**
   * Add a new user to the database.
   * @param {Object} user - The user object to be added.
   * @returns {Promise<Object>} - Returns the saved user object.
   * @async
   */
  async addUser(user) {
    const newUser = new this.UsersModel(user);
    return await newUser.save(); // Save the user to the database
  }

  /**
   * Retrieve a user or users from the database.
   * @param {Object} [filter={}] - The filter criteria for retrieving users.
   * @returns {Promise<Array>} - Returns an array of users.
   * @async
   */
  async getUser(filter = {}) {
    return await this.UsersModel.find(filter); // Find users that match the filter
  }

  /**
   * Add new data to the database.
   * @param {Object} data - The data object to be added.
   * @returns {Promise<Object>} - Returns the saved data object.
   * @async
   */
  async addData(data) {
    const newData = new this.DataModel(data);
    return await newData.save(); // Save the data to the database
  }

  /**
   * Retrieve all data or filtered data from the database.
   * @param {Object} [filter={}] - The filter criteria for retrieving data.
   * @returns {Promise<Array>} - Returns an array of data objects.
   * @async
   */
  async getAll(filter = {}) {
    return await this.DataModel.find(filter); // Find all data that matches the filter
  }

  /**
   * Update a specific data entry by its ID.
   * @param {string} id - The ID of the data entry to update.
   * @param {Object} data - The new data to update the entry with.
   * @returns {Promise<Object>} - Returns the updated data object.
   * @async
   */
  async update(id, data) {
    return await this.DataModel.findByIdAndUpdate(id, data, { new: true }); // Find data by ID and update it
  }

  /**
   * Delete a specific data entry by its ID.
   * @param {string} id - The ID of the data entry to delete.
   * @returns {Promise<Object>} - Returns the deleted data object.
   * @async
   */
  async delete(id) {
    return await this.DataModel.findByIdAndDelete(id); // Find data by ID and delete it
  }

  /**
   * Add a log entry to the logs collection.
   * @param {Object} log - The log entry to be added.
   * @returns {Promise<Object>} - Returns the saved log entry.
   * @async
   */
  async addLogs(log) {
    const logEntry = new this.LogModel(log);
    return await logEntry.save(); // Save the log entry to the database
  }
}

// Export the singleton instance of the Database class
module.exports = new Database();
