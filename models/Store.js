const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  address: { type: String },
  phone: { type: String },
  contactInfo: {
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    tiktok: { type: String, default: "" },
    snapchat: { type: String, default: "" },
  },
  locationInfo: {
    googleMaps: { type: String, default: "" },
    appleMaps: { type: String, default: "" },
    waze: { type: String, default: "" },
  },
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
  expireDate: { type: Date, default: null },
  statusAll: {
    type: String,
    enum: ["on", "off"],
    default: "on",
  },
  branches: [
    {
      name: { type: String },
      address: { type: String },
    },
  ],
  show: { type: Boolean, default: true },
  followerCount: { type: Number, default: 0 },
  lastReleaseDiscountDate: { type: Date, default: null },
});

module.exports = mongoose.model("Store", storeSchema);
