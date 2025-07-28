const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  address: { type: String },
  phone: { type: String },
  description: { type: String },
  isVip: { type: Boolean, default: false },
});

module.exports = mongoose.model("Brand", brandSchema);
