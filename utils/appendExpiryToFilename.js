const { normalizeExpiryDate } = require("./normalizeExpiryDate");

/**
 * Append `-exp-YYYY-MM-DD` before the file extension when expireDate parses.
 * Used for R2 keys (videos, product images, etc.).
 */
function appendExpiryToFilename(safeName, expireDateRaw) {
  if (safeName == null || safeName === "") return safeName;
  if (expireDateRaw == null || String(expireDateRaw).trim() === "") {
    return safeName;
  }
  const exp = normalizeExpiryDate(expireDateRaw);
  if (!exp || Number.isNaN(exp.getTime())) return safeName;
  const y = exp.getFullYear();
  const m = String(exp.getMonth() + 1).padStart(2, "0");
  const d = String(exp.getDate()).padStart(2, "0");
  const suffix = `-exp-${y}-${m}-${d}`;
  const dot = safeName.lastIndexOf(".");
  if (dot > 0) {
    return `${safeName.slice(0, dot)}${suffix}${safeName.slice(dot)}`;
  }
  return `${safeName}${suffix}`;
}

module.exports = { appendExpiryToFilename };
