const mongoose = require("mongoose");
const Product = require("../models/Product");

const hasDraftObj = {
  $expr: {
    $gt: [
      { $size: { $objectToArray: { $ifNull: ["$pendingDraft", {}] } } },
      0,
    ],
  },
};

const addingMatch = {
  status: "pending",
  wasEverPublished: false,
  $or: [{ pendingDraft: null }, { pendingDraft: { $exists: false } }],
};

const editingMatch = {
  $or: [
    hasDraftObj,
    {
      status: "pending",
      pendingReason: "editing",
      wasEverPublished: true,
    },
  ],
};

const allMatchOld = { $or: [{ status: "pending" }, hasDraftObj] };
const allMatchNew = { $or: [addingMatch, editingMatch] };

async function run() {
  await mongoose.connect("mongodb://localhost:27017/marketdb");
  const [adding, editing, allOld, allNew] = await Promise.all([
    Product.countDocuments(addingMatch),
    Product.countDocuments(editingMatch),
    Product.countDocuments(allMatchOld),
    Product.countDocuments(allMatchNew),
  ]);
  console.log({ adding, editing, allOld, allNew });
  const sample = await Product.find(addingMatch).limit(2).lean();
  console.log(
    "sample adding:",
    sample.map((p) => ({
      id: p._id,
      status: p.status,
      wasEverPublished: p.wasEverPublished,
      pendingDraft: p.pendingDraft,
      pendingReason: p.pendingReason,
    })),
  );
  if (sample[0]) {
    const inAllOld = await Product.countDocuments({
      $and: [allMatchOld, { _id: sample[0]._id }],
    });
    console.log("first adding sample in allOld:", inAllOld);

    const scope = { $or: [{ brandId: sample[0].brandId }] };
    const addingScoped = await Product.countDocuments({
      $and: [addingMatch, scope],
    });
    const allOldScoped = await Product.countDocuments({
      $and: [allMatchOld, scope],
    });
    console.log({ addingScoped, allOldScoped, brandId: sample[0].brandId });
  }
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
