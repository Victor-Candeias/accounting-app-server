const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;
const cors = require('cors');
const crypto = require('crypto');
const authRoutes = require('./routes/authRoutes');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

// Encryption key (32 bytes for AES-256)
const ENCRYPTION_KEY = crypto.randomBytes(32); // Replace with a static key for consistency
const IV_LENGTH = 16; // AES block size

// Middleware to parse JSON body
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());  // Enable CORS for all routes

app.use('/api/auth', authRoutes);

// Path to the text file "database"
const dbFilePath = path.join(__dirname, 'db', 'database.txt');
const USERS_FILE = path.join(__dirname, '../db/users.txt');
const SALT_ROUNDS = 10;

// GET route to read from the text file
app.get('/api/data', (req, res) => {
  fs.readFile(dbFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Error reading file' });
    }
    res.json({ content: decrypt(data) });
  });
});

// POST route to write to the text file
app.post('/api/data', (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'No content provided' });
  }

  fs.writeFile(dbFilePath, encrypt(content), (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error writing to file' });
    }
    res.json({ message: 'File updated successfully' });
  });
});
  
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Encrypt the data
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }
  
  // Decrypt the data
  function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
