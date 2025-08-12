/*
  Migration: Introduce BrandType collection and replace legacy string `type` on Brand
  - Creates BrandType documents for any distinct legacy Brand.type names found
  - Sets brandTypeId on Brand based on legacy name
*/

require("dotenv").config();
const mongoose = require("mongoose");

const Brand = require("../models/Brand");
const BrandType = require("../models/BrandType");

async function connect() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/marketplace";
  console.log("Connecting to:", uri);
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

async function upsertBrandTypes(names) {
  const createdOrFound = new Map();
  for (const name of names) {
    if (!name || typeof name !== "string") continue;
    const trimmed = name.trim();
    if (!trimmed) continue;
    let doc = await BrandType.findOne({ name: trimmed });
    if (!doc) {
      // Simple emoji guess
      let icon = "🏷️";
      const lower = trimmed.toLowerCase();
      if (lower.includes("food") || lower.includes("grocery")) icon = "🍞";
      else if (lower.includes("fashion") || lower.includes("clothes"))
        icon = "👗";
      else if (lower.includes("tech") || lower.includes("elect")) icon = "🔌";
      doc = await BrandType.create({ name: trimmed, icon });
      console.log("Created BrandType:", trimmed);
    } else {
      console.log("Found BrandType:", trimmed);
    }
    createdOrFound.set(trimmed, doc._id);
  }
  return createdOrFound;
}

async function migrateBrands() {
  const total = await Brand.countDocuments({
    type: { $exists: true, $ne: null },
  });
  if (total === 0) return { updated: 0 };

  const distinct = await Brand.distinct("type", { type: { $ne: null } });
  const map = await upsertBrandTypes(distinct);

  const cursor = Brand.find({ type: { $exists: true, $ne: null } }).cursor();
  let updated = 0;
  for await (const doc of cursor) {
    const name = (doc.type || "").trim();
    if (!name) continue;
    const bt = await BrandType.findOne({ name });
    if (!bt) continue;
    if (!doc.brandTypeId || String(doc.brandTypeId) !== String(bt._id)) {
      await Brand.updateOne(
        { _id: doc._id },
        { $set: { brandTypeId: bt._id } }
      );
      updated += 1;
    }
  }
  return { updated };
}

async function main() {
  await connect();
  try {
    const res = await migrateBrands();
    console.log("Brand types migration complete:", res);
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
