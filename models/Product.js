const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  barcode: { type: String, required: false },
  type: { type: String, required: true },
  image: { type: String },
  previousPrice: { type: Number },
  newPrice: { type: Number },
  isDiscount: { type: Boolean, default: false },
  weight: { type: String },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  marketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Market",
    required: false,
  },
  expireDate: { type: Date },
});

module.exports = mongoose.model("Product", productSchema);
