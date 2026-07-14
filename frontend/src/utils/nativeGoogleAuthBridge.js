import { isEmbeddedWebView } from "./isEmbeddedWebView";

/**
 * Native Google Sign-In bridge (Flutter InAppWebView) — same style as FCM:
 *
 * Web → Flutter (request):
 *   - window.__DASHKAN_GOOGLE_SIGN_IN__(payload)   // preferred if Flutter injects it
 *   - window.flutter_inappwebview.callHandler('dashkanGoogleSignIn', payload)
 *   - CustomEvent `dashkan:google-sign-in-request`
 *
 * Flutter → Web (session after POST /api/auth/google):
 *   - window.__DASHKAN_AUTH_TOKEN__ = '<appJwt>'
 *   - optional window.__DASHKAN_AUTH_USER__ = JSON.stringify(user)
 *   - CustomEvent `dashkan:auth-session` with detail { token, user? }
 *
 * Flutter → Web (error):
 *   - CustomEvent `dashkan:auth-error` with detail { message }
 */

export const DASHKAN_GOOGLE_SIGN_IN_REQUEST_EVENT =
  "dashkan:google-sign-in-request";
export const DASHKAN_AUTH_SESSION_EVENT = "dashkan:auth-session";
export const DASHKAN_AUTH_ERROR_EVENT = "dashkan:auth-error";
export const DASHKAN_GOOGLE_SIGN_IN_HANDLER = "dashkanGoogleSignIn";

export function shouldUseNativeGoogleSignIn() {
  return isEmbeddedWebView();
}

export function hasNativeGoogleSignInBridge() {
  if (typeof window === "undefined") return false;
  if (typeof window.__DASHKAN_GOOGLE_SIGN_IN__ === "function") return true;
  if (typeof window.flutter_inappwebview?.callHandler === "function") return true;
  return false;
}

/**
 * Ask Flutter to run native Google Sign-In, call /api/auth/google, then inject JWT.
 * @returns {boolean} true if a request channel was used
 */
export function requestNativeGoogleSignIn(payload = {}) {
  if (typeof window === "undefined") return false;

  const detail =
    payload && typeof payload === "object" ? { ...payload } : {};

  window.dispatchEvent(
    new CustomEvent(DASHKAN_GOOGLE_SIGN_IN_REQUEST_EVENT, { detail }),
  );

  if (typeof window.__DASHKAN_GOOGLE_SIGN_IN__ === "function") {
    try {
      window.__DASHKAN_GOOGLE_SIGN_IN__(detail);
      return true;
    } catch (e) {
      console.warn("[Auth] __DASHKAN_GOOGLE_SIGN_IN__ failed:", e);
    }
  }

  if (typeof window.flutter_inappwebview?.callHandler === "function") {
    try {
      void window.flutter_inappwebview.callHandler(
        DASHKAN_GOOGLE_SIGN_IN_HANDLER,
        detail,
      );
      return true;
    } catch (e) {
      console.warn("[Auth] dashkanGoogleSignIn callHandler failed:", e);
    }
  }

  // WebView without handler yet — event still fired for native listeners.
  return isEmbeddedWebView();
}

function readInjectedToken(detail = {}) {
  if (typeof detail.token === "string" && detail.token.trim()) {
    return detail.token.trim();
  }
  if (typeof window.__DASHKAN_AUTH_TOKEN__ === "string") {
    return window.__DASHKAN_AUTH_TOKEN__.trim();
  }
  return "";
}

function readInjectedUser(detail = {}) {
  if (detail.user && typeof detail.user === "object") return detail.user;
  if (typeof detail.user === "string" && detail.user.trim()) {
    try {
      return JSON.parse(detail.user);
    } catch {
      return null;
    }
  }
  if (typeof window.__DASHKAN_AUTH_USER__ === "string") {
    try {
      return JSON.parse(window.__DASHKAN_AUTH_USER__);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Wire Flutter → Web session injection (mirror of installFcmTokenBridge).
 * @param {{ onSession: (payload: { token: string, user?: object|null }) => void|Promise<void>, onError?: (message: string) => void }} callbacks
 */
export function installNativeGoogleAuthBridge({ onSession, onError } = {}) {
  if (typeof window === "undefined") return () => {};
  if (typeof onSession !== "function") return () => {};

  const applyFromDetail = (detail = {}) => {
    const token = readInjectedToken(detail);
    if (!token) return;
    const user = readInjectedUser(detail);
    void onSession({ token, user });
  };

  const sessionHandler = (event) => {
    applyFromDetail(event?.detail || {});
  };

  const errorHandler = (event) => {
    const message =
      (typeof event?.detail?.message === "string" && event.detail.message) ||
      (typeof window.__DASHKAN_AUTH_ERROR__ === "string" &&
        window.__DASHKAN_AUTH_ERROR__) ||
      "Google sign-in failed";
    onError?.(message);
  };

  window.addEventListener(DASHKAN_AUTH_SESSION_EVENT, sessionHandler);
  window.addEventListener(DASHKAN_AUTH_ERROR_EVENT, errorHandler);

  // Flutter may set globals before the SPA mounts (same as FCM).
  if (typeof window.__DASHKAN_AUTH_TOKEN__ === "string") {
    applyFromDetail({});
  }

  return () => {
    window.removeEventListener(DASHKAN_AUTH_SESSION_EVENT, sessionHandler);
    window.removeEventListener(DASHKAN_AUTH_ERROR_EVENT, errorHandler);
  };
}
