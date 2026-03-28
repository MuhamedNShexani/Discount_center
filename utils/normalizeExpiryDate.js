/**
 * Date-only strings (YYYY-MM-DD) become end of that local calendar day (23:59:59.999).
 * Full ISO/datetime strings are parsed and kept as-is.
 */
function normalizeExpiryDate(input) {
  if (input === undefined) return undefined;
  if (input === null || input === "") return null;
  if (typeof input === "string") {
    const s = input.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split("-").map(Number);
      return new Date(y, m - 1, d, 23, 59, 59, 999);
    }
  }
  const dt = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

module.exports = { normalizeExpiryDate };
