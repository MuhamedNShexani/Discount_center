/** Accent palette for rotating multi-app discount chips. */
export const SHOWCASE_DISCOUNT_CHIP_PALETTE = [
  { main: "#f97316", light: "#fff7ed", text: "#c2410c", darkText: "#fdba74" },
  { main: "#3b82f6", light: "#eff6ff", text: "#1d4ed8", darkText: "#93c5fd" },
  { main: "#10b981", light: "#ecfdf5", text: "#047857", darkText: "#6ee7b7" },
  { main: "#8b5cf6", light: "#f5f3ff", text: "#6d28d9", darkText: "#c4b5fd" },
  { main: "#ec4899", light: "#fdf2f8", text: "#be185d", darkText: "#f9a8d4" },
  { main: "#14b8a6", light: "#f0fdfa", text: "#0f766e", darkText: "#5eead4" },
];

/** Hard-coded min width — fits longest chip e.g. "50% off selected items". */
export const SHOWCASE_DISCOUNT_CARD_MIN_WIDTH = 185;

/** Max store cards in the homepage horizontal row before the Show All card. */
export const SHOWCASE_DISCOUNT_CARD_PREVIEW_LIMIT = 10;

export function getShowcaseDiscountChipColors(index, isDark) {
  const palette =
    SHOWCASE_DISCOUNT_CHIP_PALETTE[
      Math.abs(Number(index) || 0) % SHOWCASE_DISCOUNT_CHIP_PALETTE.length
    ];
  return {
    bgcolor: isDark ? `${palette.main}38` : palette.light,
    color: isDark ? palette.darkText : palette.text,
    borderColor: `${palette.main}55`,
  };
}

/** Normalize API entry into rotatable offers (percent + app/public + expiry). */
export function resolveShowcaseOffers(entry) {
  if (Array.isArray(entry?.offers) && entry.offers.length > 0) {
    return entry.offers;
  }

  const offers = [];

  if (
    entry?.source === "public" &&
    Number.isFinite(Number(entry.discountPercent))
  ) {
    offers.push({
      source: "public",
      discountPercent: Number(entry.discountPercent),
      expireDate: entry.expireDate || null,
    });
  }

  const legacyApps = Array.isArray(entry?.apps)
    ? entry.apps
    : entry?.app
      ? [entry.app]
      : [];

  legacyApps.forEach((app) => {
    if (!app) return;
    offers.push({
      ...app,
      source: "app",
      discountPercent: Number(
        app.discountPercent ?? entry.discountPercent ?? 0,
      ),
      expireDate: app.expireDate ?? entry.expireDate ?? null,
    });
  });

  if (offers.length === 0 && Number.isFinite(Number(entry?.discountPercent))) {
    offers.push({
      source: entry?.source === "public" ? "public" : "app",
      discountPercent: Number(entry.discountPercent),
      expireDate: entry.expireDate || null,
      ...(entry?.app || {}),
    });
  }

  return offers;
}
