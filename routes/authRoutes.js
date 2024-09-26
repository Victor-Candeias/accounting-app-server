const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const path = require('path');

const router = express.Router();
const USERS_FILE = path.join(__dirname, '../db/users.txt');
const SALT_ROUNDS = 10;

// Function to read users from file
function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return data.split('\n').filter(Boolean).map(line => {
      const [username, password] = line.split(':');
      return { username, password };
    });
  } catch (error) {
    return [];
  }
}

// Function to write users to file
function writeUsers(users) {
  const data = users.map(user => `${user.username}:${user.password}`).join('\n');
  fs.writeFileSync(USERS_FILE, data, 'utf8');
}

// Route to handle user registration
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const users = readUsers();
  const userExists = users.some(user => user.username === username);

  if (userExists) {
    return res.status(400).json({ message: 'User already exists.' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Save user to file
  users.push({ username, password: hashedPassword });
  writeUsers(users);

  res.status(201).json({ message: 'User registered successfully.' });
});

// Route to handle user login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const users = readUsers();
  const user = users.find(user => user.username === username);

  if (!user) {
    return res.status(400).json({ message: 'User not found.' });
  }

  // Compare passwords
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(400).json({ message: 'Incorrect password.' });
  }

  res.status(200).json({ message: 'Login successful.' });
});

module.exports = router;
