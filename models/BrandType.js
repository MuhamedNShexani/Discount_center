const mongoose = require("mongoose");

const brandTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BrandType", brandTypeSchema);
