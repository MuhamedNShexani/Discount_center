const mongoose = require("mongoose");
const auditPlugin = require("./plugins/auditPlugin");

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 500 },
    questionEn: { type: String, trim: true, maxlength: 500, default: "" },
    questionAr: { type: String, trim: true, maxlength: 500, default: "" },
    questionKu: { type: String, trim: true, maxlength: 500, default: "" },
    answer: { type: String, required: true, trim: true, maxlength: 8000 },
    answerEn: { type: String, trim: true, maxlength: 8000, default: "" },
    answerAr: { type: String, trim: true, maxlength: 8000, default: "" },
    answerKu: { type: String, trim: true, maxlength: 8000, default: "" },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    /** Stable id for default seed rows (e.g. default-q1). */
    seedKey: { type: String, trim: true, unique: true, sparse: true },
  },
  { timestamps: true },
);

faqSchema.plugin(auditPlugin);

module.exports = mongoose.model("Faq", faqSchema);
