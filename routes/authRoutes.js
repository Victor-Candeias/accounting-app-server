const express = require("express");
const fs = require("fs");
const bcrypt = require("bcrypt");
const path = require("path");
const jwt = require("jsonwebtoken");
const utils = require("../utils/Utils");
const Database = require("../utils/data");
const { level } = require("winston");
require("dotenv").config();

const router = express.Router();

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: This endpoint allows new users to register by providing a username and a password. It validates the input and hashes the password before saving it to the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the new user.
 *               password:
 *                 type: string
 *                 description: The password of the new user.
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully.
 *                 user:
 *                   type: object
 *                   description: The newly created user object.
 *       400:
 *         description: Bad Request. Username or password is missing, or user already exists.
 *       500:
 *         description: Internal Server Error.
 */
/**
 * POST /register
 * Registers a new user.
 * 
 * Request body:
 * - username: The username of the new user (string).
 * - password: The password of the new user (string).
 * 
 * Responses:
 * - 201: User registered successfully, returns a message and user details.
 * - 400: Bad Request if username or password is missing or user already exists.
 * - 500: Internal Server Error.
 */
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    if (!utils.validatePasswordRules(password)) {
      return res
        .status(400)
        .json("Password does not meet complexity requirements.");
    }

    // Check if the user already exists
    const userExists = await Database.getUser({ name: username });

    // Check if the user exists
    if (!userExists || Object.keys(userExists).length !== 0) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, utils.SALT_ROUNDS);

    const userModel = {
      name: username,
      password: hashedPassword,
    };

    // Save user to the database
    const newUser = await Database.addUser(userModel); // Ensure this is awaited

    return res
      .status(201)
      .json({ message: "User registered successfully.", user: newUser });
  } catch (error) {
    console.error("Registration error:", error); // Log the error for debugging
    return res.status(500).json({ message: "Internal server error." }); // General error message
  }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login an existing user
 *     description: This endpoint allows users to log in by providing their username and password. It validates the credentials and returns a JWT token if successful.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user logging in.
 *               password:
 *                 type: string
 *                 description: The password of the user logging in.
 *     responses:
 *       200:
 *         description: Successful login, returns a JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: The JWT token for the logged-in user.
 *       400:
 *         description: Bad Request. User not found or incorrect password.
 *       500:
 *         description: Internal Server Error.
 */
/**
 * POST /login
 * Logs in an existing user.
 * 
 * Request body:
 * - username: The username of the user logging in (string).
 * - password: The password of the user logging in (string).
 * 
 * Responses:
 * - 200: Successful login, returns a JWT token.
 * - 400: Bad Request if user not found or incorrect password.
 * - 500: Internal Server Error.
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    utils.logger.log("info", "username=" + username);
    utils.logger.log("info", "password=" + password);

    // Retrieve the user from the database
    const user = await Database.getUser({ name: username });

    // Check if the user exists
    if (!user || Object.keys(user).length === 0) {
      return res.status(400).json({ message: "User not found." });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user[0].password); // Adjust based on how user is structured

    utils.logger.log("info", "passwordMatch=" + passwordMatch);

    if (!passwordMatch) {
      return res.status(400).json({ message: "Incorrect password." });
    }

    // Create JWT token
    const token = utils.createToken(user[0]);

    utils.logger.log("info", "token=" + token);

    // Send the token to the client
    res.json({ token });
  } catch (error) {
    utils.logger.log("error", "error=" + error);

    console.error("Login error:", error); // Log the error for debugging
    return res.status(500).json({ message: "Internal server error." }); // General error message
  }
});

module.exports = router;
