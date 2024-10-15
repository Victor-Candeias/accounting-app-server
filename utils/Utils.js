const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const winston = require("winston");
const path = require("path");
require("dotenv").config();

/**
 * AES block size
 */
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(process.env.ENCRYPTION_KEY)
  .digest("base64")
  .substring(0, 32);
const IV_LENGTH = 16;
const SALT_ROUNDS = 10;
const complexityRules =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Setup winston logger to log messages to a file
const logger = winston.createLogger({
  level: "info", // Set the log level (e.g., info, error, debug)
  format: winston.format.combine(
    winston.format.timestamp(), // Adds a timestamp to each log
    winston.format.json() // Logs the output in JSON format
  ),
  transports: [
    // Logs to a file named `app.log`
    new winston.transports.File({ filename: "logs/app.log" }),

    // Step 2: Conditionally log to the console in development mode
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Adds color to console logs
        winston.format.simple() // Simplifies the console output
      ),
    }),
  ],
});

/**
 * Encryption key (32 bytes for AES-256)
 */
function GetEncryptionKey() {
  // Key and IV must have valid lengths
  const key = crypto
    .createHash("sha256")
    .update(process.env.SECRET_KEY)
    .digest(); // Creates a 32-byte key
  const iv = Buffer.alloc(16, 0); // Example IV of 16 bytes, update this as needed

  // Decrypt function using aes-256-cbc
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

  // Example encrypted data (update with your own)
  let encrypted = "your-encrypted-data-here";

  // Decrypting data
  let decrypted = decipher.update(encrypted, "hex", "utf-8");
  decrypted += decipher.final("utf-8");

  console.log("Decrypted:", decrypted);

  return decrypted;
}

function createToken(user) {
  // Payload: data to be included in the token
  const payload = {
    id: user.id,
    username: user.name,
    role: user.role,
  };

  // Sign the token with the secret key and set an expiration time
  const token = jwt.sign(payload, process.env.ENCRYPTION_KEY, {
    expiresIn: "1h",
  }); // Token expires in 1 hour

  return token;
}

function verifyToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(403).send("Token required");
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(401).send("Invalid token");
    }

    req.user = user; // Store user info for use in the request
    next();
  });
}

// Encrypt the data
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

// Decrypt the data
function decrypt(text) {
  if (!text) {
    return "";
  }

  const textParts = text.split(":");
  const iv = Buffer.from(textParts[0], "hex");
  const encryptedText = Buffer.from(textParts[1], "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function validatePasswordRules(password) {
  return complexityRules.test(password);
}

module.exports = {
  createToken,
  verifyToken,
  encrypt,
  decrypt,
  SALT_ROUNDS,
  logger,
  GetEncryptionKey,
  validatePasswordRules,
};
