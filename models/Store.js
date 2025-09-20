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
  storecity: {
    type: String,
    enum: ["Erbil", "Sulaimani", "Duhok", "Kerkuk", "Halabja"],
    required: true,
  },
  isVip: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  branches: [
    {
      name: { type: String },
      address: { type: String },
    },
  ],
  show: { type: Boolean, default: true },
});

module.exports = mongoose.model("Store", storeSchema);
