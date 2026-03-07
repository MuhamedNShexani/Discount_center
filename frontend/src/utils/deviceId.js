// In-memory fallback when localStorage/sessionStorage is unavailable (PWA, Android WebView, iOS Safari standalone/private)
let memoryDeviceId = null;

const getStorage = () => {
  try {
    if (typeof localStorage !== "undefined" && localStorage) return localStorage;
  } catch (_) {}
  try {
    if (typeof sessionStorage !== "undefined" && sessionStorage) return sessionStorage;
  } catch (_) {}
  return null;
};

// Generate a unique device ID for anonymous user tracking
export const generateDeviceId = () => {
  const storage = getStorage();

  // Try to get existing device ID from storage (localStorage or sessionStorage)
  let deviceId = null;
  if (storage) {
    try {
      deviceId = storage.getItem("deviceId");
    } catch (_) {}
  }

  // Fallback to in-memory if storage failed
  if (!deviceId && memoryDeviceId) return memoryDeviceId;

  if (!deviceId) {
    // Generate a new device ID using browser fingerprinting
    let fingerprint = "fallback";
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillText("Device fingerprint", 2, 2);
        fingerprint = canvas.toDataURL();
      }
    } catch (_) {}

    const userAgent = navigator.userAgent || "";
    const screenRes = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
    let timeZone = "unknown";
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
    } catch (_) {}
    const language = navigator.language || "en";

    const combined = `${fingerprint}-${userAgent}-${screenRes}-${timeZone}-${language}-${Date.now()}`;
    try {
      deviceId = btoa(unescape(encodeURIComponent(combined)))
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 32);
    } catch (_) {
      // Fallback for iOS/browsers where btoa fails with certain chars
      deviceId = `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 15)}`.slice(0, 32);
    }

    // Store in available storage or memory
    if (storage) {
      try {
        storage.setItem("deviceId", deviceId);
      } catch (_) {
        memoryDeviceId = deviceId;
      }
    } else {
      memoryDeviceId = deviceId;
    }
  }

  return deviceId;
};

// Get the current device ID
export const getDeviceId = () => {
  return generateDeviceId();
};

// Clear device ID (for testing purposes)
export const clearDeviceId = () => {
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem("deviceId");
    } catch (_) {}
  }
  memoryDeviceId = null;
};
