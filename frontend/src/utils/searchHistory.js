const STORAGE_KEY_PREFIX = "searchHistory";
const MAX_ITEMS = 10;

const getStorageKey = (userId, deviceId) => {
  if (userId) return `${STORAGE_KEY_PREFIX}_user_${userId}`;
  if (deviceId) return `${STORAGE_KEY_PREFIX}_device_${deviceId}`;
  return `${STORAGE_KEY_PREFIX}_anonymous`;
};

export const getSearchHistory = (userId, deviceId) => {
  try {
    const key = getStorageKey(userId, deviceId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const addToSearchHistory = (query, userId, deviceId) => {
  const trimmed = (query || "").trim().toLowerCase();
  if (trimmed.length < 2) return [];

  const key = getStorageKey(userId, deviceId);
  let history = getSearchHistory(userId, deviceId);
  history = history.filter((h) => h.toLowerCase() !== trimmed);
  history.unshift(trimmed);
  history = history.slice(0, MAX_ITEMS);

  try {
    localStorage.setItem(key, JSON.stringify(history));
  } catch {
    // ignore
  }
  return history;
};

export const removeFromSearchHistory = (query, userId, deviceId) => {
  const key = getStorageKey(userId, deviceId);
  let history = getSearchHistory(userId, deviceId);
  const q = (query || "").trim().toLowerCase();
  history = history.filter((h) => h.toLowerCase() !== q);
  try {
    localStorage.setItem(key, JSON.stringify(history));
  } catch {
    // ignore
  }
  return history;
};

export const clearSearchHistory = (userId, deviceId) => {
  const key = getStorageKey(userId, deviceId);
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
  return [];
};
