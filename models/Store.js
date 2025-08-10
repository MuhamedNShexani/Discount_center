const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  address: { type: String },
  phone: { type: String },
  description: { type: String },
  storeType: {
    type: String,
    enum: ["market", "clothes", "electronic", "cosmetic"],
    default: "market",
  },
  isVip: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Store", storeSchema);
