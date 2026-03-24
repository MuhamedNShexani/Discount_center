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
  isVip: { type: Boolean, default: false },
  expireDate: { type: Date, default: null },
  statusAll: {
    type: String,
    enum: ["on", "off"],
    default: "on",
  },
});

module.exports = mongoose.model("Brand", brandSchema);
