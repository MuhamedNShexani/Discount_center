/*
  Migration: Introduce StoreType collection and replace legacy string storeType fields
  - Creates StoreType documents for any distinct legacy storeType names found
  - Sets storeTypeId on Product, Category, and Store based on legacy name
  - Optionally keeps legacy storeType strings for backward compatibility
*/

require("dotenv").config();
const mongoose = require("mongoose");

const Product = require("../models/Product");
const Category = require("../models/Category");
const Store = require("../models/Store");
const StoreType = require("../models/StoreType");

async function connect() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/marketplace";
  console.log("Connecting to:", uri);
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

async function upsertStoreTypes(names) {
  const createdOrFound = new Map();
  for (const name of names) {
    if (!name || typeof name !== "string") continue;
    const trimmed = name.trim();
    if (!trimmed) continue;
    let doc = await StoreType.findOne({ name: trimmed });
    if (!doc) {
      // Try to guess a simple icon
      let icon = "🏪";
      const lower = trimmed.toLowerCase();
      if (lower.includes("market")) icon = "🛒";
      else if (lower.includes("clothes") || lower.includes("cloth"))
        icon = "👕";
      else if (lower.includes("electronic")) icon = "📱";
      else if (lower.includes("cosmetic")) icon = "💄";
      doc = await StoreType.create({ name: trimmed, icon });
      console.log("Created StoreType:", trimmed);
    } else {
      console.log("Found StoreType:", trimmed);
    }
    createdOrFound.set(trimmed, doc._id);
  }
  return createdOrFound;
}

async function migrateCollection(Model, legacyField) {
  const total = await Model.countDocuments({
    [legacyField]: { $exists: true, $ne: null },
  });
  if (total === 0) return { updated: 0 };

  const cursor = Model.find({
    [legacyField]: { $exists: true, $ne: null },
  }).cursor();
  let updated = 0;
  for await (const doc of cursor) {
    const legacy = doc[legacyField];
    if (!legacy) continue;
    const st = await StoreType.findOne({ name: legacy });
    if (!st) continue;
    if (!doc.storeTypeId || String(doc.storeTypeId) !== String(st._id)) {
      await Model.updateOne(
        { _id: doc._id },
        { $set: { storeTypeId: st._id } }
      );
      updated += 1;
    }
  }
  return { updated };
}

async function main() {
  await connect();
  try {
    const productTypes = await Product.distinct("storeType");
    const categoryTypes = await Category.distinct("storeType");
    const storeTypes = await Store.distinct("storeType");
    const allNames = Array.from(
      new Set([
        ...(productTypes || []),
        ...(categoryTypes || []),
        ...(storeTypes || []),
      ])
    );
    console.log("Discovered legacy store types:", allNames);

    const map = await upsertStoreTypes(allNames);
    console.log("StoreTypes ready:", Array.from(map.keys()));

    const productRes = await migrateCollection(Product, "storeType");
    const categoryRes = await migrateCollection(Category, "storeType");
    const storeRes = await migrateCollection(Store, "storeType");

    console.log("Migration complete:", {
      productsUpdated: productRes.updated,
      categoriesUpdated: categoryRes.updated,
      storesUpdated: storeRes.updated,
    });
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
