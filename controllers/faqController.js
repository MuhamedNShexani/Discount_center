const Faq = require("../models/Faq");
const { canAccessDataEntryApis } = require("../utils/roleAccess");
const { DEFAULT_FAQ_SEED } = require("../utils/defaultFaqSeed");

async function upsertDefaultFaqs() {
  let inserted = 0;
  let updated = 0;
  for (const row of DEFAULT_FAQ_SEED) {
    const existing = await Faq.findOne({ seedKey: row.seedKey });
    if (existing) {
      await Faq.updateOne(
        { seedKey: row.seedKey },
        {
          $set: {
            question: row.question,
            questionEn: row.questionEn,
            questionAr: row.questionAr,
            questionKu: row.questionKu,
            answer: row.answer,
            answerEn: row.answerEn,
            answerAr: row.answerAr,
            answerKu: row.answerKu,
            sortOrder: row.sortOrder,
            active: true,
          },
        },
      );
      updated += 1;
    } else {
      await Faq.create({ ...row, active: true });
      inserted += 1;
    }
  }
  return { inserted, updated, total: DEFAULT_FAQ_SEED.length };
}

/** Called on server startup — ensures default FAQs exist in DB. */
async function seedDefaultFaqsIfMissing() {
  const count = await Faq.countDocuments();
  if (count > 0) {
    const seedCount = await Faq.countDocuments({
      seedKey: { $in: DEFAULT_FAQ_SEED.map((r) => r.seedKey) },
    });
    if (seedCount >= DEFAULT_FAQ_SEED.length) return { skipped: true };
  }
  const result = await upsertDefaultFaqs();
  console.log(
    `[migration] default FAQs: inserted=${result.inserted}, updated=${result.updated}`,
  );
  return result;
}

function normalizeFaqPayload(body = {}) {
  const sortOrder = Number(body.sortOrder);
  return {
    question: String(body.question || "").trim(),
    questionEn: String(body.questionEn || "").trim(),
    questionAr: String(body.questionAr || "").trim(),
    questionKu: String(body.questionKu || "").trim(),
    answer: String(body.answer || "").trim(),
    answerEn: String(body.answerEn || "").trim(),
    answerAr: String(body.answerAr || "").trim(),
    answerKu: String(body.answerKu || "").trim(),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    active: body.active !== false,
  };
}

const getFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find({ active: { $ne: false } })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    res.json({ data: faqs });
  } catch (err) {
    console.error("Get FAQs error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const getFaqsAdmin = async (req, res) => {
  try {
    if (!canAccessDataEntryApis(req.user)) {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    const faqs = await Faq.find()
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    res.json({ data: faqs });
  } catch (err) {
    console.error("Get FAQs admin error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const createFaq = async (req, res) => {
  try {
    if (!canAccessDataEntryApis(req.user)) {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    const payload = normalizeFaqPayload(req.body);
    if (!payload.question || !payload.answer) {
      return res
        .status(400)
        .json({ message: "Question and answer are required." });
    }
    const faq = await Faq.create(payload);
    res.status(201).json({ data: faq });
  } catch (err) {
    console.error("Create FAQ error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const updateFaq = async (req, res) => {
  try {
    if (!canAccessDataEntryApis(req.user)) {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    const payload = normalizeFaqPayload(req.body);
    if (!payload.question || !payload.answer) {
      return res
        .status(400)
        .json({ message: "Question and answer are required." });
    }
    const faq = await Faq.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!faq) return res.status(404).json({ message: "FAQ not found" });
    res.json({ data: faq });
  } catch (err) {
    console.error("Update FAQ error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const deleteFaq = async (req, res) => {
  try {
    if (!canAccessDataEntryApis(req.user)) {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    const faq = await Faq.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ message: "FAQ not found" });
    res.json({ message: "FAQ deleted" });
  } catch (err) {
    console.error("Delete FAQ error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const seedDefaultFaqs = async (req, res) => {
  try {
    if (!canAccessDataEntryApis(req.user)) {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    const result = await upsertDefaultFaqs();
    const faqs = await Faq.find()
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    res.json({
      message: "Default common questions imported.",
      ...result,
      data: faqs,
    });
  } catch (err) {
    console.error("Seed FAQs error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getFaqs,
  getFaqsAdmin,
  createFaq,
  updateFaq,
  deleteFaq,
  seedDefaultFaqs,
  seedDefaultFaqsIfMissing,
};
