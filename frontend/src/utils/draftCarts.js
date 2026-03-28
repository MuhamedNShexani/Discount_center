/** Matches StoreProfile: localStorage key `cart.store.<storeId>.v1` */

const PREFIX = "cart.store.";
const SUFFIX = ".v1";

/**
 * @param {Array<{ _id: string, name?: string }>} stores - used to resolve store names
 * @returns {{ storeId: string, storeName: string, totalQty: number, lines: { productId: string, name: string, qty: number }[] }[]}
 */
export function readDraftCartGroupsByStore(stores) {
  const nameById = new Map(
    (stores || []).map((s) => [String(s._id), s?.name || ""]),
  );
  const groups = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX) || !key.endsWith(SUFFIX)) continue;
      const storeId = key.slice(PREFIX.length, -SUFFIX.length);
      let parsed = {};
      try {
        parsed = JSON.parse(localStorage.getItem(key) || "{}");
      } catch {
        continue;
      }
      const rows = Object.values(parsed || {}).filter(
        (row) => (Number(row?.qty) || 0) > 0 && row?.product?._id,
      );
      if (rows.length === 0) continue;

      const lines = rows
        .map((row) => ({
          productId: String(row.product._id),
          name: row.product?.name || "-",
          qty: Number(row.qty) || 0,
        }))
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));

      const totalQty = lines.reduce((s, l) => s + l.qty, 0);
      const storeName = nameById.get(String(storeId)) || "";

      groups.push({
        storeId: String(storeId),
        storeName: storeName || String(storeId),
        totalQty,
        lines,
      });
    }
  } catch {
    return [];
  }

  groups.sort((a, b) =>
    String(a.storeName).localeCompare(String(b.storeName)),
  );
  return groups;
}

export function totalDraftCartQty(groups) {
  return (groups || []).reduce((s, g) => s + (g.totalQty || 0), 0);
}
