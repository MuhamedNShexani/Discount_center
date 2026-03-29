const {
  getTranslateApiKey,
  translateToEnArKu,
  formatGoogleFailure,
} = require("../utils/googleTranslate");

const ALLOWED_TYPES = new Set([
  "product",
  "store",
  "brand",
  "category",
  "categoryType",
  "general",
  "gift",
  "reel",
  "job",
  "storeType",
  "storeBrand",
]);

/**
 * POST /api/ai/translate
 * Body: { text: string, type?: string }
 * Uses Google Cloud Translation API v2 (same text → en, ar, ckb in parallel).
 */
const translate = async (req, res) => {
  try {
    const { text, type = "general" } = req.body || {};
    const trimmed = typeof text === "string" ? text.trim() : "";

    if (!trimmed) {
      return res.status(400).json({
        success: false,
        message: "Text is required and cannot be empty.",
      });
    }

    const typeNorm = String(type).trim() || "general";
    if (!ALLOWED_TYPES.has(typeNorm)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Allowed: ${[...ALLOWED_TYPES].join(", ")}`,
      });
    }

    const apiKey = getTranslateApiKey();
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message:
          "Translation is not configured. Set GOOGLE_TRANSLATE_API_KEY (Google Cloud Translation API key) in server .env.",
      });
    }

    try {
      const { english, arabic, kurdish } = await translateToEnArKu(
        apiKey,
        trimmed,
      );

      return res.json({
        success: true,
        data: {
          english,
          arabic,
          kurdish,
        },
      });
    } catch (err) {
      console.error("[ai/translate] Google error:", err?.message || err);
      return res.status(503).json({
        success: false,
        message: formatGoogleFailure(err),
      });
    }
  } catch (err) {
    console.error("[ai/translate]", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Server error",
    });
  }
};

module.exports = {
  translate,
};
