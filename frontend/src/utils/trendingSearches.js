export const DEFAULT_TRENDING_SEARCHES = [
  "Restaurants",
  "Fashion",
  "Electronics",
  "Nearby stores",
  "Gifts",
  "Shopping",
];

export const MAX_TRENDING_SEARCHES = 12;

/** Normalize admin-configured trending search chips for the search page. */
export function normalizeTrendingSearches(input) {
  if (!Array.isArray(input)) return [...DEFAULT_TRENDING_SEARCHES];
  const seen = new Set();
  const out = [];
  for (const raw of input) {
    const term = String(raw || "").trim();
    if (!term || term.length > 80) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(term);
    if (out.length >= MAX_TRENDING_SEARCHES) break;
  }
  return out.length > 0 ? out : [...DEFAULT_TRENDING_SEARCHES];
}
