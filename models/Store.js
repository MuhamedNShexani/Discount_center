const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  address: { type: String },
  phone: { type: String },
  description: { type: String },
  storeTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StoreType",
    required: true,
  },
  isVip: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Store", storeSchema);
