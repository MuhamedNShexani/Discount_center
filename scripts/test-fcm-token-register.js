/**
 * Smoke test for POST /api/users/fcm-token (run with server + MongoDB up).
 * Usage: node scripts/test-fcm-token-register.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const FcmToken = require("../models/FcmToken");

const API_BASE = process.env.TEST_API_BASE || "http://localhost:5000/api";

async function main() {
  await connectDB();

  const deviceId = `test_device_${Date.now()}`;
  const token = `test_fcm_token_${Date.now()}_${"x".repeat(40)}`;

  const res = await fetch(`${API_BASE}/users/fcm-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      deviceId,
      platform: "android",
      appVersion: "test-script",
    }),
  });

  const body = await res.json();
  console.log("HTTP", res.status, body);

  const saved = await FcmToken.findOne({ token }).lean();
  console.log("Mongo document:", saved ? { id: saved._id, userId: saved.userId } : null);

  if (saved) {
    await FcmToken.deleteOne({ _id: saved._id });
    console.log("Cleaned up test document");
  }

  await mongoose.disconnect();
  process.exit(saved ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
