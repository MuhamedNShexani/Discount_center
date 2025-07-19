const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  image: { type: String },
  previousPrice: { type: Number },
  newPrice: { type: Number },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Market",
    required: true,
  },
  expireDate: { type: Date },
});

module.exports = mongoose.model("Product", productSchema);
