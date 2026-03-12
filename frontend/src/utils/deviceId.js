// Generate a unique device ID for anonymous user tracking
const generateRandomId = () => {
  // Prefer crypto for better uniqueness
  if (window.crypto && window.crypto.getRandomValues) {
    const buf = new Uint8Array(16);
    window.crypto.getRandomValues(buf);
    return (
      "dev_" +
      Array.from(buf)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }
  // Fallback to Math.random if crypto is not available
  return (
    "dev_" +
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10)
  );
};

export const generateDeviceId = () => {
  let deviceId = null;
  try {
    deviceId = localStorage.getItem("deviceId");
  } catch {
    deviceId = null;
  }

  // If we have an old fingerprint-based ID (no "dev_" prefix), migrate to a new random one.
  if (!deviceId || !deviceId.startsWith("dev_")) {
    deviceId = generateRandomId();
    try {
      localStorage.setItem("deviceId", deviceId);
    } catch {
      // Ignore storage errors; ID will be regenerated next time if needed
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
  localStorage.removeItem("deviceId");
};
