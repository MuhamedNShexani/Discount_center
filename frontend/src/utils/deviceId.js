// Generate a unique device ID for anonymous user tracking
export const generateDeviceId = () => {
  // Try to get existing device ID from localStorage
  let deviceId = localStorage.getItem("deviceId");

  if (!deviceId) {
    // Generate a new device ID using browser fingerprinting
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Device fingerprint", 2, 2);

    const fingerprint = canvas.toDataURL();

    // Combine with other browser characteristics
    const userAgent = navigator.userAgent;
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;

    // Create a hash-like string
    const combined = `${fingerprint}-${userAgent}-${screenRes}-${timeZone}-${language}`;
    deviceId = btoa(combined)
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 32);

    // Store in localStorage
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
