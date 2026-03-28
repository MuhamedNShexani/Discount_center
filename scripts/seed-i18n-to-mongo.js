/**
 * One-time (or repeatable) import of bundled i18n resources into TranslationEntry.
 * Reads frontend/src/i18nResources.js, builds union of keys across en/ar/ku, upserts rows.
 *
 * Usage (from project root, with MONGO_URI in .env):
 *   node scripts/seed-i18n-to-mongo.js
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const TranslationEntry = require("../models/TranslationEntry");

function loadResourcesFromFile() {
  const srcPath = path.join(__dirname, "../frontend/src/i18nResources.js");
  let code = fs.readFileSync(srcPath, "utf8");
  code = code.replace(/^\s*export\s+const\s+resources\s*=/m, "const resources =");
  code += "\nmodule.exports = resources;\n";
  const tmpPath = path.join(__dirname, "_i18n_resources_seed_tmp.cjs");
  fs.writeFileSync(tmpPath, code, "utf8");
  try {
    delete require.cache[require.resolve(tmpPath)];
    return require(tmpPath);
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // ignore
    }
  }
}

function str(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
}

async function run() {
  if (!process.env.MONGO_URI) {
    process.env.MONGO_URI = "mongodb://localhost:27017/storeplace";
    console.warn("MONGO_URI not set; using default local URI.");
  }

  await connectDB();
  const resources = loadResourcesFromFile();
  const enT = resources?.en?.translation || {};
  const arT = resources?.ar?.translation || {};
  const kuT = resources?.ku?.translation || {};

  const allKeys = new Set([
    ...Object.keys(enT),
    ...Object.keys(arT),
    ...Object.keys(kuT),
  ]);

  const ops = [];
  for (const key of allKeys) {
    if (typeof key !== "string" || !key) continue;
    ops.push({
      updateOne: {
        filter: { key },
        update: {
          $set: {
            en: str(enT[key]),
            ar: str(arT[key]),
            ku: str(kuT[key]),
          },
        },
        upsert: true,
      },
    });
  }

  const BATCH = 400;
  let total = 0;
  for (let i = 0; i < ops.length; i += BATCH) {
    const chunk = ops.slice(i, i + BATCH);
    const res = await TranslationEntry.bulkWrite(chunk, { ordered: false });
    total +=
      (res.upsertedCount || 0) +
      (res.modifiedCount || 0) +
      (res.matchedCount || 0);
    console.log(
      `Batch ${Math.floor(i / BATCH) + 1}: ${chunk.length} ops (upserted: ${res.upsertedCount}, modified: ${res.modifiedCount})`,
    );
  }

  console.log(`Done. Unique keys: ${allKeys.size}. bulkWrite batches completed.`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
