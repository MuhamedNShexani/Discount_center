const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    videoUrl: { type: String, required: true, trim: true },
    key: { type: String, trim: true },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: false,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: false,
    },
    expireDate: { type: Date, required: false },
    like: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },
    shares: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  },
);

videoSchema.index({ createdAt: -1 });

videoSchema.pre("validate", function validateOwner(next) {
  const hasStore = !!this.storeId;
  const hasBrand = !!this.brandId;

  if (hasStore === hasBrand) {
    return next(
      new Error("Video owner must be exactly one of storeId or brandId"),
    );
  }

  return next();
});

module.exports = mongoose.model("Video", videoSchema);
