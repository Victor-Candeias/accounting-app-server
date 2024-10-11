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

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
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

    res
      .status(201)
      .json({ message: "User registered successfully.", user: newUser });
  } catch (error) {
    console.error("Registration error:", error); // Log the error for debugging
    return res.status(500).json({ message: "Internal server error." }); // General error message
  }
});

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
