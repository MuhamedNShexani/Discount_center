import { userAPI } from "../services/api";
import { getResolvedApiBaseUrl } from "../config/backendUrl";
import { getDeviceId } from "./deviceId";

function tokenPreview(token) {
  if (!token || typeof token !== "string") return "(empty)";
  const t = token.trim();
  if (t.length <= 12) return `${t.slice(0, 4)}…`;
  return `${t.slice(0, 8)}…${t.slice(-4)}`;
}

function resolvePlatform() {
  if (typeof navigator === "undefined") return undefined;
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return undefined;
}

/**
 * Register an FCM token with the backend.
 * Used when the native WebView injects a token via window.__PATRIS_FCM_TOKEN__
 * or dispatches a `patris:fcm-token` CustomEvent.
 */
export async function registerFcmTokenWithBackend(fcmToken, options = {}) {
  const token = typeof fcmToken === "string" ? fcmToken.trim() : "";
  if (!token) {
    console.warn("[FCM] Registration skipped: empty token");
    return { ok: false, reason: "empty_token" };
  }

  const deviceId = options.deviceId || getDeviceId();
  const platform = options.platform || resolvePlatform();
  const apiUrl = `${getResolvedApiBaseUrl()}/users/fcm-token`;

  const body = {
    token,
    deviceId,
    ...(platform ? { platform } : {}),
    ...(options.appVersion ? { appVersion: options.appVersion } : {}),
    ...(options.language ? { language: options.language } : {}),
  };

  console.log("[FCM] FCM token:", tokenPreview(token));
  console.log("[FCM] API URL:", apiUrl || "/api/users/fcm-token");
  console.log("[FCM] Request body:", { ...body, token: tokenPreview(token) });

  try {
    const res = await userAPI.registerFcmToken(body, options.headers || {});
    console.log("[FCM] Response code:", res.status);
    console.log("[FCM] Response body:", res.data);
    console.log("[FCM] Registration success");
    return { ok: true, data: res.data };
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error("[FCM] Response code:", status || "(network error)");
    console.error("[FCM] Response body:", data || err.message);
    console.error("[FCM] Registration failed");
    return { ok: false, status, data, error: err };
  }
}

/** Wire native WebView → web registration bridge (optional fallback). */
export function installFcmTokenBridge() {
  if (typeof window === "undefined") return () => {};

  const handler = (event) => {
    const detail = event?.detail || {};
    const token =
      detail.token ||
      (typeof window.__PATRIS_FCM_TOKEN__ === "string"
        ? window.__PATRIS_FCM_TOKEN__
        : "");
    if (!token) return;
    void registerFcmTokenWithBackend(token, {
      deviceId: detail.deviceId,
      platform: detail.platform,
      appVersion: detail.appVersion,
      language: detail.language,
    });
  };

  window.addEventListener("patris:fcm-token", handler);

  if (typeof window.__PATRIS_FCM_TOKEN__ === "string") {
    void registerFcmTokenWithBackend(window.__PATRIS_FCM_TOKEN__, {
      platform:
        typeof window.__PATRIS_FCM_PLATFORM__ === "string"
          ? window.__PATRIS_FCM_PLATFORM__
          : undefined,
    });
  }

  return () => window.removeEventListener("patris:fcm-token", handler);
}
