/**
 * One-time fix: drop the old unique index on users.phone (no longer in schema).
 * Run from project root: node scripts/drop-phone-index.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/marketplace";

async function run() {
  await mongoose.connect(uri);
  const col = mongoose.connection.db.collection("users");
  try {
    await col.dropIndex("phone_1");
    console.log("Dropped index phone_1. You can restart the backend now.");
  } catch (e) {
    if (e.code === 27 || e.codeName === "IndexNotFound") {
      console.log("Index phone_1 does not exist. You're good.");
    } else {
      console.error("Error:", e.message);
      process.exit(1);
    }
  }
  await mongoose.connection.close();
  process.exit(0);
}

run();
