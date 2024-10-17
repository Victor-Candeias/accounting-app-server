// Import necessary modules
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes"); // Route handlers for authentication
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const utils = require("./utils/Utils"); // Utility functions for various tasks
const Database = require("./utils/data"); // Database interactions (adjust path if needed)
require("dotenv").config(); // Load environment variables from .env file

const app = express(); // Initialize express application
const PORT = process.env.PORT || 3001; // Set the port from environment variables or default to 3001

// Middleware setup
app.use(express.json()); // Parse incoming JSON request bodies
app.use(bodyParser.json()); // Body parser to handle JSON payloads
app.use(cors()); // Enable Cross-Origin Resource Sharing for all routes

// Swagger definition
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "YAccounting App backend",
      version: "1.0.0",
      description: "API documentation using Swagger",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`, // Replace with your server URL
      },
    ],
  },
  apis: ["./*.js", "./routes/*.js"], // This includes all JS files and those specifically in the routes folder
};

// Initialize swagger-jsdoc
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Serve Swagger API docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Mount authentication routes under /api/auth
app.use("/api/auth", authRoutes);

/**
 * @swagger
 * /api/data:
 *   get:
 *     summary: Retrieve data from the database
 *     responses:
 *       200:
 *         description: Successfully retrieved data
 *       500:
 *         description: Internal server error
 */
/**
 * GET route to retrieve data from the database.
 * @route GET /api/data
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {object} - Returns retrieved data or an error message
 */
app.get("/api/data", async (req, res) => {
  try {
    // Retrieve all data from the database using query parameters
    const allData = await Database.getAll(req.query);

    // If no data found, return an empty array
    if (!allData || allData.length === 0) {
      return res.json([]); // Send an empty array when no data is retrieved
    }

    // Respond with the retrieved data
    res.json(allData);
  } catch (error) {
    console.error("Error retrieving data:", error); // Log error details for debugging
    res.status(500).json({ message: "Error retrieving data." }); // Return generic error message
  }
});

/**
 * @swagger
 * /api/data:
 *   post:
 *     summary: Add data to the database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully created new data
 *       400:
 *         description: Content is required
 *       500:
 *         description: Error adding data
 */
/**
 * POST route to add data to the database.
 * @route POST /api/data
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {object} - Returns newly created data or an error message
 */
app.post("/api/data", async (req, res) => {
  try {
    // Ensure that the required content field is provided
    if (!req.body.content) {
      return res.status(400).json({ message: "Content is required." }); // Return 400 if content is missing
    }

    // Add the new data to the database
    const newData = await Database.addData(req.body.content);

    // Respond with the newly created data
    res.status(201).json(newData); // Return the created data with 201 status
  } catch (error) {
    console.error("Error adding data:", error); // Log error details for debugging
    res.status(500).json({ message: "Error adding data." }); // Return generic error message
  }
});

/**
 * @swagger
 * /api/data/{id}:
 *   delete:
 *     summary: Remove data from the database by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the data to delete
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: No content, successful deletion
 *       404:
 *         description: Data not found
 *       500:
 *         description: Error deleting data
 */
/**
 * DELETE route to remove data from the database by ID.
 * @route DELETE /api/data/:id
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {object} - Returns a 204 No Content status or an error message
 */
app.delete("/api/data/:id", async (req, res) => {
  try {
    const { id } = req.params; // Extract ID from the URL parameters

    // Check if the ID is provided
    if (!id) {
      return res.status(400).json({ message: "ID is required." }); // Return 400 if no ID is provided
    }

    // Attempt to delete the data from the database
    const deleteData = await Database.delete(id);

    // If no data is found, return 404
    if (!deleteData) {
      return res.status(404).json({ message: "Data not found." }); // Return 404 if no matching data is found
    }

    // Return 204 No Content on successful deletion
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting data:", error); // Log error details for debugging
    res.status(500).json({ message: "Error deleting data." }); // Return generic error message
  }
});

// Start the server and listen on the specified port
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
