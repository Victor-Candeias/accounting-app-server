const mongoose = require("mongoose");
require("dotenv").config();

// Define user schema
const users = new mongoose.Schema(
  {
    name: { type: String, required: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

// Define data schema
const data = new mongoose.Schema(
  {
    user: { type: String, required: true },
    day: { type: String, required: true },
    month: { type: String, required: true },
    year: { type: String, required: true },
    description: { type: String, required: true },
    value: { type: String, required: true },
    entry: { type: String, required: true },
  },
  { timestamps: true }
);

// Define logs schema
const logs = new mongoose.Schema(
  {
    day: { type: String, required: true },
    level: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

class Database {
  // Static property to hold the single instance
  static instance = null;

  constructor() {
    // If an instance already exists, return it
    if (Database.instance) {
      return Database.instance;
    }

    // Otherwise, create a new instance
    this.uri = process.env.MONGO_DB_CONNECTION_STRING;
    this.connect();
    this.UsersModel = mongoose.model("users", users);
    this.DataModel = mongoose.model("data", data);
    this.LogModel = mongoose.model("logs", logs);

    // Store the instance in the static property
    Database.instance = this;
  }

  async connect() {
    try {
      await mongoose.connect(this.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("MongoDB connected successfully.");
    } catch (error) {
      console.error("MongoDB connection error:", error);
    }
  }

  // Add user
  async addUser(user) {
    const newUser = new this.UsersModel(user);
    return await newUser.save();
  }

  // Retrieve user
  async getUser(filter = {}) {
    return await this.UsersModel.find(filter);
  }

  // Add data
  async addData(data) {
    const newData = new this.DataModel(data);
    return await newData.save();
  }

  // Retrieve data
  async getAll(filter = {}) {
    return await this.DataModel.find(filter);
  }

  // Update data by ID
  async update(id, data) {
    return await this.DataModel.findByIdAndUpdate(id, data, { new: true });
  }

  // Delete data by ID
  async delete(id) {
    return await this.DataModel.findByIdAndDelete(id);
  }

  // Add logs
  async addLogs(log) {
    const logEntry = new this.LogModel(log);
    return await logEntry.save();
  }
}

// Export the singleton instance
module.exports = new Database();
