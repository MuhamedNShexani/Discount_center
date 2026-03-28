const TranslationEntry = require("../models/TranslationEntry");

const ADMIN_EMAILS = ["mshexani45@gmail.com", "admin@gmail.com"];

const isAdminUser = (user) =>
  !!user && ADMIN_EMAILS.includes(String(user.email || "").toLowerCase());

// @route   GET /api/translations — public (UI strings)
const getPublicTranslations = async (req, res) => {
  try {
    const rows = await TranslationEntry.find({}).sort({ key: 1 }).lean();
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getPublicTranslations:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @route   PUT /api/admin/translations — upsert by key
const upsertTranslation = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Admin privileges required",
      });
    }
    const { key, en, ar, ku } = req.body || {};
    if (typeof key !== "string" || !key.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing key",
      });
    }
    const trimmed = key.trim();
    const doc = await TranslationEntry.findOneAndUpdate(
      { key: trimmed },
      {
        $set: {
          en: typeof en === "string" ? en : "",
          ar: typeof ar === "string" ? ar : "",
          ku: typeof ku === "string" ? ku : "",
        },
      },
      { new: true, upsert: true, runValidators: true },
    ).lean();

    res.json({ success: true, data: doc });
  } catch (err) {
    console.error("upsertTranslation:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @route   DELETE /api/admin/translations/:id
const deleteTranslation = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Admin privileges required",
      });
    }
    const { id } = req.params;
    const deleted = await TranslationEntry.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("deleteTranslation:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getPublicTranslations,
  upsertTranslation,
  deleteTranslation,
};
