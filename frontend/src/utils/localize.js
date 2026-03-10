/**
 * Get the localized display value for a field that may be stored in multiple languages.
 * Handles: name_en/name_ar/name_ku, name as { en, ar, ku }, or plain string.
 * @param {object} item - The object (product, store, brand, etc.)
 * @param {string} field - Field name (default 'name')
 * @param {string} lang - Current i18n language (en, ar, ku)
 * @returns {string} Localized value or fallback
 */
export const getLocalizedName = (item, field = "name", lang) => {
  if (!item) return "";
  const base = item[field];
  if (typeof base === "object" && base !== null && (base.en || base.ar || base.ku)) {
    return base[lang] || base.en || base.ar || base.ku || "";
  }
  const key = `${field}_${lang}`;
  if (item[key] != null && item[key] !== "") return item[key];
  const enKey = `${field}_en`;
  if (item[enKey] != null) return item[enKey];
  if (typeof base === "string") return base;
  return "";
};
