const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    marketId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Market",
        required: false,
      },
    ],
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: false,
    },
    productId: {
      type: String, // Product barcode
      required: false,
    },
    expireDate: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Gift", giftSchema);
