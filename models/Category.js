const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  nameEn: { type: String, required: false },
  nameAr: { type: String, required: false },
  nameKu: { type: String, required: false },
  description: {
    type: String,
    required: false,
  },
  descriptionEn: { type: String, required: false },
  descriptionAr: { type: String, required: false },
  descriptionKu: { type: String, required: false },
  image: {
    type: String,
    required: false,
  },
  icon: {
    type: String,
    required: false,
  },
  storeTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StoreType",
    required: true,
  },
  types: [
    {
      name: {
        type: String,
        required: true,
      },
      nameEn: { type: String, required: false },
      nameAr: { type: String, required: false },
      nameKu: { type: String, required: false },
      description: {
        type: String,
        required: false,
      },
      descriptionEn: { type: String, required: false },
      descriptionAr: { type: String, required: false },
      descriptionKu: { type: String, required: false },
      image: {
        type: String,
        required: false,
      },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
categorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Category", categorySchema);
