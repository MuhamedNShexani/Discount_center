const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");

    // Use default connection if MONGO_URI is not set
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/marketplace";
    let mongoTarget = mongoUri;
    try {
      const parsed = new URL(mongoUri.replace(/^mongodb(\+srv)?:\/\//, "http://"));
      mongoTarget = `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname}`;
    } catch {
      mongoTarget = "(could not parse URI)";
    }
    console.log("MongoDB target:", mongoTarget);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
