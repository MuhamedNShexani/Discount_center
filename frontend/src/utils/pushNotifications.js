/**
 * Register the service worker for push notifications
 */
export const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return reg;
  } catch (err) {
    console.warn("Service worker registration failed:", err);
    return null;
  }
};

/**
 * Subscribe to push notifications - requires permission and vapid public key
 */
export const subscribePush = async (vapidPublicKey) => {
  if (!vapidPublicKey) throw new Error("VAPID public key required");
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
  return sub.toJSON();
};

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const isPushSupported = () =>
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

export const getPermissionState = () =>
  Notification.permission; // "granted" | "denied" | "default"
