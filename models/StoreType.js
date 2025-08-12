const mongoose = require("mongoose");

const storeTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, required: false, trim: true }, // optional emoji or icon text
  },
  { timestamps: true }
);

module.exports = mongoose.model("StoreType", storeTypeSchema);
