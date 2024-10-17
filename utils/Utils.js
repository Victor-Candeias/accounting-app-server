const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const winston = require("winston");
const path = require("path");
require("dotenv").config();

/**
 * The encryption key used for AES encryption, derived from an environment variable.
 * @constant {string}
 */
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(process.env.ENCRYPTION_KEY)
  .digest("base64")
  .substring(0, 32);

/**
 * The initialization vector (IV) length for AES encryption.
 * @constant {number}
 */
const IV_LENGTH = 16;

/**
 * The number of rounds used for salting in bcrypt password hashing.
 * @constant {number}
 */
const SALT_ROUNDS = 10;

/**
 * Regex pattern for password complexity requirements.
 * - Must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.
 * - Minimum length of 8 characters.
 * @constant {RegExp}
 */
const complexityRules =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Winston logger setup for logging messages to a file and console (in development mode).
 */
const logger = winston.createLogger({
  level: "info", // Logging level (info, error, debug)
  format: winston.format.combine(
    winston.format.timestamp(), // Adds timestamps to logs
    winston.format.json() // Logs messages in JSON format
  ),
  transports: [
    // Logs messages to a file called `app.log`
    new winston.transports.File({ filename: "logs/app.log" }),

    // Conditionally log to the console in development mode
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Colorized logs for the console
        winston.format.simple() // Simplified console output
      ),
    }),
  ],
});

/**
 * Creates a JWT token for the specified user.
 * @param {Object} user - The user object for whom the token is generated.
 * @param {string} user.id - The ID of the user.
 * @param {string} user.name - The username of the user.
 * @param {string} user.role - The role of the user.
 * @returns {string} - The generated JWT token.
 */
function createToken(user) {
  const payload = {
    id: user.id,
    username: user.name,
    role: user.role,
  };

  return jwt.sign(payload, process.env.ENCRYPTION_KEY, {
    expiresIn: "1h", // Token expires in 1 hour
  });
}

/**
 * Middleware to verify the JWT token in the request headers.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - The next middleware function.
 */
function verifyToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(403).send("Token required");
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(401).send("Invalid token");
    }

    req.user = user; // Attach the user to the request object
    next();
  });
}

/**
 * Encrypts a given text using AES-256-CBC encryption.
 * @param {string} text - The plaintext to be encrypted.
 * @returns {string} - The encrypted text in the format `iv:encryptedData`.
 */
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

/**
 * Decrypts a given encrypted text using AES-256-CBC decryption.
 * @param {string} text - The encrypted text in the format `iv:encryptedData`.
 * @returns {string} - The decrypted plaintext.
 */
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

/**
 * Validates a password based on complexity rules.
 * @param {string} password - The password to be validated.
 * @returns {boolean} - Returns `true` if the password passes the complexity rules, otherwise `false`.
 */
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
  validatePasswordRules,
};
