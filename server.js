const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();

// Debug environment variables
console.log("Environment variables:");
console.log("MONGO_URI:", process.env.MONGO_URI || "Using default");
console.log("PORT:", process.env.PORT);

// Connect Database
if (!process.env.MONGO_URI) {
  console.log("MONGO_URI not found in environment, using default connection");
  process.env.MONGO_URI = "mongodb://localhost:27017/marketplace";
}

connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/markets", require("./routes/market"));
app.use("/api/brands", require("./routes/brand"));
app.use("/api/products", require("./routes/product"));
app.use("/api/categories", require("./routes/category"));
app.use("/api/gifts", require("./routes/gift"));
app.use("/api/users", require("./routes/user"));
app.use("/api/auth", require("./routes/auth"));

const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server started on http://0.0.0.0:${PORT}`)
);

// Debug message for frontend
console.log("Compiled successfully!");
console.log("You can now view frontend in the browser.");
console.log("Local: http://localhost:3000");
