/** Matches StoreProfile: localStorage key `cart.store.<storeId>.v1` */

export const CART_STORE_PREFIX = "cart.store.";
export const CART_STORE_SUFFIX = ".v1";

export function getStoreCartKey(storeId) {
  return `${CART_STORE_PREFIX}${storeId}${CART_STORE_SUFFIX}`;
}

export function readStoreCart(storeId) {
  if (!storeId) return {};
  try {
    const raw = localStorage.getItem(getStoreCartKey(storeId));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeStoreCart(storeId, cartItems) {
  if (!storeId) return;
  try {
    localStorage.setItem(
      getStoreCartKey(storeId),
      JSON.stringify(cartItems || {}),
    );
  } catch {
    // ignore
  }
}

export function countStoreCartItems(cartItems) {
  return Object.values(cartItems || {}).reduce(
    (sum, item) => sum + (Number(item?.qty) || 0),
    0,
  );
}
