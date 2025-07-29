const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: false },
    barcode: { type: String, required: false },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    categoryTypeId: {
      type: String, // This will store the type ID within the category
      required: true,
    },
    image: { type: String },
    previousPrice: { type: Number },
    newPrice: { type: Number },
    isDiscount: { type: Boolean, default: false },
    weight: { type: String },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    marketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Market",
      required: false,
    },
    expireDate: { type: Date },
    // User tracking fields
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
