const mongoose = require("mongoose");

const marketSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  address: { type: String },
  phone: { type: String },
  description: { type: String },
  isVip: { type: Boolean, default: false },
});

module.exports = mongoose.model("Market", marketSchema);
