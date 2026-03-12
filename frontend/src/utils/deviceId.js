// Generate a unique device ID for anonymous user tracking
export const generateDeviceId = () => {
  // Try to get existing device ID from localStorage
  let deviceId = localStorage.getItem("deviceId");

  if (!deviceId) {
    // Generate a new, purely random ID (per installation) – no fingerprinting
    if (window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      deviceId = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } else {
      // Fallback: pseudo-random string
      deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // Store in localStorage so this device keeps its own account
    localStorage.setItem("deviceId", deviceId);
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
