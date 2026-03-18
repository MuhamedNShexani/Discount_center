const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  brandTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BrandType",
    required: false,
  },
  address: { type: String },
  phone: { type: String },
  description: { type: String },
  isVip: { type: Boolean, default: false },
  expireDate: { type: Date, default: null },
  statusAll: {
    type: String,
    enum: ["on", "off"],
    default: "on",
  },
});

module.exports = mongoose.model("Brand", brandSchema);
