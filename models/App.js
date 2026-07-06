const mongoose = require("mongoose");
const auditPlugin = require("./plugins/auditPlugin");

const specialDiscountSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    discountType: {
      type: String,
      enum: ["percent_all", "percent_selected", "fixed_iqd"],
      default: "percent_all",
    },
    percentageDiscount: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
      default: null,
    },
    fixedAmountIqd: {
      type: Number,
      required: false,
      min: 0,
      default: null,
    },
    expireDate: { type: Date, default: null },
  },
  { _id: true },
);

const appSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameEn: { type: String, required: false },
    nameAr: { type: String, required: false },
    nameKu: { type: String, required: false },
    logo: { type: String, default: "" },
    specialDiscounts: {
      type: [specialDiscountSchema],
      default: [],
    },
  },
  { timestamps: true },
);

appSchema.plugin(auditPlugin);

module.exports = mongoose.model("App", appSchema);
