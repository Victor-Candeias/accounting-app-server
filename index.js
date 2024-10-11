const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const utils = require("./utils/Utils");
const Database = require("./utils/data"); // Adjust the path as necessary
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON body
app.use(express.json());
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

/*
// Middleware to handle CORS for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  // If it's an OPTIONS request, return OK (status 200) and end the response
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
*/

app.use("/api/auth", authRoutes);

app.get("/api/data", async (req, res) => {
  try {
    // Get all data from the database
    const allData = await Database.getAll(req.query);

    // Check if any data was retrieved
    if (!allData || allData.length === 0) {
      return res.json([]);
    }

    // Send the retrieved data
    res.json(allData);
  } catch (error) {
    console.error("Error retrieving data:", error); // Log the error for debugging
    res.status(500).json({ message: "Error retrieving data." }); // General error message
  }
});

app.post("/api/data", async (req, res) => {
  try {
    // Check if req.body.content is provided
    if (!req.body.content) {
      return res.status(400).json({ message: "Content is required." });
    }

    // Add data to the database
    const newData = await Database.addData(req.body.content);

    // Send the newly created data as a response
    res.status(201).json(newData);
  } catch (error) {
    console.error("Error adding data:", error); // Log the error for debugging
    res.status(500).json({ message: "Error adding data." }); // General error message
  }
});

app.delete("/api/data/:id", async (req, res) => {
  try {
    const { id } = req.params; // Extract the id from the URL parameters

    // Check if id is provided
    if (!id) {
      return res.status(400).json({ message: "ID is required." });
    }

    // Attempt to delete the data from the database using the provided id
    const deleteData = await Database.delete(id);

    // Check if the data was found and deleted
    if (!deleteData) {
      return res.status(404).json({ message: "Data not found." }); // Return 404 if no data was found
    }

    // Respond with 204 No Content to indicate success
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting data:", error); // Log the error for debugging
    res.status(500).json({ message: "Error deleting data." }); // General error message
  }
});

/*
app.post("/api/logs", async (req, res) => {
  try {
    // Ensure req.body.content exists before proceeding
    if (!req.body.content) {
      return res.status(400).json({ message: "Content is required." });
    }

    // Add the log to the database
    const newLog = await Database.addData(req.body.content);

    // Respond with the newly created log
    res.status(201).json(newLog);
  } catch (error) {
    console.error("Error adding log:", error); // Log the error for debugging
    res.status(500).json({ message: "Error adding log." }); // General error message
  }
});
*/

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
