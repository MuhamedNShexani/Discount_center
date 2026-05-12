/**
 * Legacy cleanup: remove viewedProducts from all User documents (field removed from schema).
 * Run once: node migrations/unset-user-viewed-products-legacy.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/marketplace";

async function run() {
  await mongoose.connect(uri);
  const col = mongoose.connection.db.collection("users");
  const result = await col.updateMany(
    { viewedProducts: { $exists: true } },
    { $unset: { viewedProducts: "" } },
  );
  console.log(
    `Unset legacy viewedProducts — matched: ${result.matchedCount}, modified: ${result.modifiedCount}`,
  );
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
