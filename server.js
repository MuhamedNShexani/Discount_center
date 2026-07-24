const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
require("dotenv").config();

const { runWithAuditContext } = require("./utils/auditContext");
const { optionalAuth } = require("./middleware/auth");

const User = require("./models/User");

const app = express();

// Debug environment variables
console.log("Environment variables:");
console.log("MONGO_URI:", process.env.MONGO_URI || "Using default");
console.log("PORT:", process.env.PORT);

if (!process.env.MONGO_URI) {
  console.log("MONGO_URI not found in environment, using default connection");
  process.env.MONGO_URI = "mongodb://localhost:27017/storeplace";
}

// Middleware - CORS: allow known frontends + localhost; mobile needs explicit origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://dashkan.net",
  "https://www.dashkan.net",
  "https://idiscount.vercel.app",
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app"))
        return cb(null, true);
      return cb(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(runWithAuditContext);
// Parse Bearer JWT on every request so create/update APIs can record createdBy/updatedBy
app.use(optionalAuth);

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Health check (used for keep-alive / monitoring)
app.get("/health", (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    ok: dbReady,
    db: dbReady ? "connected" : "disconnected",
    ts: new Date().toISOString(),
  });
});

// Routes
app.use("/api/stores", require("./routes/store"));
app.use("/api/brands", require("./routes/brand"));
app.use("/api/companies", require("./routes/company"));
app.use("/api/products", require("./routes/product"));
app.use("/api/categories", require("./routes/category"));
app.use("/api/gifts", require("./routes/gift"));
app.use("/api/users", require("./routes/user"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/ads", require("./routes/ad"));
app.use("/api/cities", require("./routes/city"));
app.use("/api/store-types", require("./routes/storeType"));
app.use("/api/brand-types", require("./routes/brandType"));
app.use("/api/notifications", require("./routes/notification"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/theme", require("./routes/theme"));
app.use("/api/search", require("./routes/search"));
app.use("/api/search-analytics", require("./routes/searchAnalytics"));
app.use("/api/videos", require("./routes/video"));
app.use("/api/jobs", require("./routes/job"));
app.use("/api/apps", require("./routes/app"));
app.use("/api/translations", require("./routes/translation"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/owner-dashboard", require("./routes/ownerDashboard"));
app.use("/api/owner-analytics", require("./routes/ownerAnalytics"));
app.use("/api/app-visits", require("./routes/appVisits"));
app.use("/api/cart-orders", require("./routes/cartOrders"));
app.use("/api/feedback", require("./routes/feedback"));
app.use("/api/faqs", require("./routes/faq"));

const PORT = process.env.PORT || 5000;

async function runStartupMigrations() {
  try {
    const { seedCitiesIfEmpty } = require("./controllers/cityController");
    await seedCitiesIfEmpty();
  } catch (e) {
    console.error("[migration] cities:", e.message);
  }
  try {
    const result = await User.updateMany(
      {
        $or: [
          { role: { $exists: false } },
          { role: null },
          { role: "" },
        ],
      },
      { $set: { role: "user" } },
    );
    if (result.modifiedCount > 0) {
      console.log(
        `[migration] Default role=user applied to ${result.modifiedCount} user document(s)`,
      );
    }
  } catch (e) {
    console.error("[migration] user role:", e.message);
  }
  try {
    const { seedDefaultFaqsIfMissing } = require("./controllers/faqController");
    await seedDefaultFaqsIfMissing();
  } catch (e) {
    console.error("[migration] default FAQs:", e.message);
  }
}

function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
      } catch (err) {
        console.error("Error closing MongoDB connection:", err.message);
      }
      process.exit(0);
    });

    // Force exit if connections hang
    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

async function start() {
  // 1) MongoDB must connect before accepting traffic
  await connectDB();

  // 2) One-time seeds / migrations only after a live connection
  await runStartupMigrations();

  // 3) Listen only when DB is ready
  const { initializeFirebase } = require("./services/firebaseService");
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
    initializeFirebase();
    // Run job to delete deactivated users past grace period (every 24h)
    const deleteDeactivatedUsers = require("./jobs/deleteDeactivatedUsers");
    setInterval(
      () =>
        deleteDeactivatedUsers
          .run()
          .catch((e) => console.error("[deleteDeactivatedUsers]", e.message)),
      24 * 60 * 60 * 1000,
    );
    deleteDeactivatedUsers
      .run()
      .catch((e) => console.error("[deleteDeactivatedUsers]", e.message));
  });

  setupGracefulShutdown(server);
}

start().catch((err) => {
  console.error("Fatal startup error:", err && err.message ? err.message : err);
  process.exit(1);
});

// Local frontend is a separate process: cd frontend && npm start → http://localhost:5173
