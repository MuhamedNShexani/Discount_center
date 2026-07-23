/**
 * Unified notification permission helpers for browsers and Flutter WebView.
 * Flutter injects:
 *   window.__FLUTTER_NOTIFICATIONS_BRIDGE__
 *   window.flutterNotificationsEnabled
 *   window.flutterNotificationStatus
 *   window.__FLUTTER_OPEN_NOTIFICATION_SETTINGS__()
 *   window.flutter_inappwebview.callHandler("openNotificationSettings")
 * and dispatches "flutterNotificationStatus" when status changes.
 */

/** @returns {boolean} */
export function isFlutterApp() {
  try {
    return (
      typeof window !== "undefined" &&
      window.__FLUTTER_NOTIFICATIONS_BRIDGE__ === true
    );
  } catch {
    return false;
  }
}

/**
 * Raw status from Flutter or browser.
 * Flutter: "authorized" | "denied" | "notDetermined" | "provisional"
 * Browser: "granted" | "denied" | "default"
 * @returns {string}
 */
export function getNotificationStatus() {
  try {
    if (typeof window === "undefined") return "denied";

    if (isFlutterApp()) {
      const status = window.flutterNotificationStatus;
      if (typeof status === "string" && status.trim()) {
        return status.trim();
      }
      if (window.flutterNotificationsEnabled === true) return "authorized";
      if (window.flutterNotificationsEnabled === false) return "denied";
      return "notDetermined";
    }

    if (!("Notification" in window)) return "denied";
    return Notification.permission;
  } catch {
    return "denied";
  }
}

/**
 * Browser-compatible permission used by existing UI:
 * "granted" | "denied" | "default"
 * @param {string} [rawStatus]
 * @returns {"granted"|"denied"|"default"}
 */
export function toBrowserPermission(rawStatus) {
  const status =
    rawStatus != null ? String(rawStatus) : getNotificationStatus();
  if (
    status === "granted" ||
    status === "authorized" ||
    status === "provisional"
  ) {
    return "granted";
  }
  if (status === "denied") return "denied";
  return "default";
}

/** @returns {boolean} */
export function isNotificationsEnabled() {
  try {
    if (typeof window === "undefined") return false;

    if (isFlutterApp()) {
      if (window.flutterNotificationsEnabled === true) return true;
      if (window.flutterNotificationsEnabled === false) return false;
      const status = getNotificationStatus();
      return status === "authorized" || status === "provisional";
    }

    return toBrowserPermission() === "granted";
  } catch {
    return false;
  }
}

/**
 * Whether the "Enable system notifications" control should be shown.
 * Browser: only while permission is still "default" (cannot re-prompt if denied).
 * Flutter: while notifications are not enabled (opens native Settings).
 * @returns {boolean}
 */
export function shouldShowEnableNotificationsButton() {
  if (isFlutterApp()) return !isNotificationsEnabled();
  return toBrowserPermission() === "default";
}

/**
 * Request notification access.
 * Flutter → open native notification settings.
 * Browser → Notification.requestPermission().
 * @returns {Promise<"granted"|"denied"|"default">}
 */
export async function requestNotifications() {
  try {
    if (typeof window === "undefined") return "denied";

    if (isFlutterApp()) {
      let opened = false;
      try {
        if (typeof window.__FLUTTER_OPEN_NOTIFICATION_SETTINGS__ === "function") {
          window.__FLUTTER_OPEN_NOTIFICATION_SETTINGS__();
          opened = true;
        }
      } catch (e) {
        console.warn("Flutter openNotificationSettings (global):", e);
      }
      if (!opened) {
        try {
          const handler = window.flutter_inappwebview?.callHandler;
          if (typeof handler === "function") {
            await window.flutter_inappwebview.callHandler(
              "openNotificationSettings",
            );
            opened = true;
          }
        } catch (e) {
          console.warn("Flutter openNotificationSettings (callHandler):", e);
        }
      }
      return toBrowserPermission();
    }

    if (!("Notification" in window)) return "denied";
    if (typeof Notification.requestPermission !== "function") {
      return toBrowserPermission();
    }
    const permission = await Notification.requestPermission();
    return toBrowserPermission(permission);
  } catch (e) {
    console.warn("requestNotifications error:", e);
    return "denied";
  }
}

/**
 * Subscribe to Flutter notification status changes.
 * Safe to call in browsers (event simply never fires).
 * @param {() => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeFlutterNotificationStatus(callback) {
  if (typeof window === "undefined" || typeof callback !== "function") {
    return () => {};
  }

  const handler = () => {
    try {
      callback();
    } catch (e) {
      console.warn("flutterNotificationStatus listener error:", e);
    }
  };

  window.addEventListener("flutterNotificationStatus", handler);
  return () => {
    window.removeEventListener("flutterNotificationStatus", handler);
  };
}
