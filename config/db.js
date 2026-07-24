const mongoose = require("mongoose");
require("dotenv").config();

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeMongoTarget(mongoUri) {
  try {
    const parsed = new URL(
      mongoUri.replace(/^mongodb(\+srv)?:\/\//, "http://"),
    );
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname}`;
  } catch {
    return "(could not parse URI)";
  }
}

/**
 * Connect to MongoDB with exponential backoff.
 * Exits the process with code 1 if all attempts fail (Railway will restart).
 */
const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/marketplace";

  console.log("Attempting to connect to MongoDB...");
  console.log("MongoDB target:", describeMongoTarget(mongoUri));

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log("MongoDB connected successfully");
      return mongoose.connection;
    } catch (err) {
      lastError = err;
      console.error(
        `MongoDB connection error (attempt ${attempt}/${MAX_RETRIES}):`,
        err.message,
      );
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Retrying MongoDB connection in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  console.error(
    "MongoDB connection failed after retries:",
    lastError && lastError.message,
  );
  process.exit(1);
};

module.exports = connectDB;
