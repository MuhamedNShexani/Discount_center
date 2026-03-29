const axios = require("axios");

/** BCP-47 targets for Google Cloud Translation API v2 */
const TARGET_EN = "en";
const TARGET_AR = "ar";
/** Central Kurdish (Sorani) — supported by Google Translate */
const TARGET_KU_SORANI = "ckb";

const GOOGLE_TRANSLATE_URL =
  "https://translation.googleapis.com/language/translate/v2";

function getTranslateApiKey() {
  return (
    process.env.GOOGLE_TRANSLATE_API_KEY ||
    process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY
  );
}

/**
 * One v2 translate call; source language is auto-detected when omitted.
 */
async function googleTranslateOne(apiKey, text, target) {
  try {
    const { data } = await axios.post(
      `${GOOGLE_TRANSLATE_URL}?key=${encodeURIComponent(apiKey)}`,
      { q: text, target, format: "text" },
      {
        timeout: 45000,
        headers: { "Content-Type": "application/json" },
      },
    );

    if (data?.error) {
      const e = new Error(data.error.message || "Google Translate API error");
      e.googleCode = data.error.code;
      throw e;
    }

    const translated = data?.data?.translations?.[0]?.translatedText;
    if (translated == null || translated === "") {
      throw new Error("Empty translation from Google Translate.");
    }
    return translated;
  } catch (err) {
    const g = err?.response?.data?.error;
    if (g?.message) {
      const e = new Error(g.message);
      e.googleCode = g.code;
      throw e;
    }
    throw err;
  }
}

function formatGoogleFailure(err) {
  const g = err?.response?.data?.error;
  if (g?.message) {
    return `Google Translate: ${g.message}`;
  }
  if (
    err?.googleCode === 403 ||
    /API key not valid|PERMISSION_DENIED/i.test(String(err?.message))
  ) {
    return (
      "Google Translate API key is invalid or Cloud Translation API is not enabled. " +
      "Enable it in Google Cloud Console and set GOOGLE_TRANSLATE_API_KEY in .env."
    );
  }
  if (
    err?.response?.status === 429 ||
    /RESOURCE_EXHAUSTED|quota/i.test(String(err?.message))
  ) {
    return "Google Translate quota exceeded. Check billing and quotas in Google Cloud Console.";
  }
  return String(err?.message || err || "Google Translate request failed.");
}

/**
 * Same source text → en, ar, ckb in parallel.
 */
async function translateToEnArKu(apiKey, text) {
  const trimmed = String(text).trim();
  if (!trimmed) {
    throw new Error("Text is required and cannot be empty.");
  }
  const [english, arabic, kurdish] = await Promise.all([
    googleTranslateOne(apiKey, trimmed, TARGET_EN),
    googleTranslateOne(apiKey, trimmed, TARGET_AR),
    googleTranslateOne(apiKey, trimmed, TARGET_KU_SORANI),
  ]);
  return {
    english: String(english).trim(),
    arabic: String(arabic).trim(),
    kurdish: String(kurdish).trim(),
  };
}

module.exports = {
  TARGET_EN,
  TARGET_AR,
  TARGET_KU_SORANI,
  GOOGLE_TRANSLATE_URL,
  getTranslateApiKey,
  googleTranslateOne,
  formatGoogleFailure,
  translateToEnArKu,
};
