import { isEmbeddedWebView } from "./isEmbeddedWebView";

/**
 * Native Google Sign-In bridge (Flutter InAppWebView) — same style as FCM:
 *
 * Web → Flutter (request):
 *   - window.__DASHKAN_GOOGLE_SIGN_IN__(payload)
 *   - window.flutter_inappwebview.callHandler('dashkanGoogleSignIn', payload)
 *   - CustomEvent `dashkan:google-sign-in-request`
 *
 * Flutter → Web (session after POST /api/auth/google):
 *   - window.__DASHKAN_AUTH_TOKEN__ = '<appJwt>'
 *   - optional window.__DASHKAN_AUTH_USER__ = JSON.stringify(user)
 *   - CustomEvent `dashkan:auth-session` with detail { token, user? }
 *     (listen on both window and document; CustomEvent does not bubble by default)
 *
 * Flutter → Web (error):
 *   - CustomEvent `dashkan:auth-error` with detail { message }
 */

export const DASHKAN_GOOGLE_SIGN_IN_REQUEST_EVENT =
  "dashkan:google-sign-in-request";
export const DASHKAN_AUTH_SESSION_EVENT = "dashkan:auth-session";
export const DASHKAN_AUTH_ERROR_EVENT = "dashkan:auth-error";
export const DASHKAN_GOOGLE_SIGN_IN_HANDLER = "dashkanGoogleSignIn";

const LOG = (...args) => console.log("[DASHKAN_WEB]", ...args);

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

  LOG("requestNativeGoogleSignIn", detail);

  window.dispatchEvent(
    new CustomEvent(DASHKAN_GOOGLE_SIGN_IN_REQUEST_EVENT, {
      detail,
      bubbles: true,
    }),
  );

  if (typeof window.__DASHKAN_GOOGLE_SIGN_IN__ === "function") {
    try {
      window.__DASHKAN_GOOGLE_SIGN_IN__(detail);
      LOG("called __DASHKAN_GOOGLE_SIGN_IN__");
      return true;
    } catch (e) {
      console.warn("[DASHKAN_WEB] __DASHKAN_GOOGLE_SIGN_IN__ failed:", e);
    }
  }

  if (typeof window.flutter_inappwebview?.callHandler === "function") {
    try {
      void window.flutter_inappwebview.callHandler(
        DASHKAN_GOOGLE_SIGN_IN_HANDLER,
        detail,
      );
      LOG("called flutter_inappwebview.callHandler(dashkanGoogleSignIn)");
      return true;
    } catch (e) {
      console.warn("[DASHKAN_WEB] dashkanGoogleSignIn callHandler failed:", e);
    }
  }

  return isEmbeddedWebView();
}

function normalizeDetail(raw) {
  if (raw == null) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw;
  return {};
}

export function readInjectedToken(detail = {}) {
  const d = normalizeDetail(detail);
  if (typeof d.token === "string" && d.token.trim()) {
    return d.token.trim();
  }
  if (typeof window !== "undefined" && typeof window.__DASHKAN_AUTH_TOKEN__ === "string") {
    return window.__DASHKAN_AUTH_TOKEN__.trim();
  }
  try {
    const ls = localStorage.getItem("token");
    if (ls && String(ls).trim()) return String(ls).trim();
  } catch {
    /* ignore */
  }
  return "";
}

export function readInjectedUser(detail = {}) {
  const d = normalizeDetail(detail);
  if (d.user && typeof d.user === "object") return d.user;
  if (typeof d.user === "string" && d.user.trim()) {
    try {
      return JSON.parse(d.user);
    } catch {
      return null;
    }
  }
  if (typeof window !== "undefined" && typeof window.__DASHKAN_AUTH_USER__ === "string") {
    try {
      return JSON.parse(window.__DASHKAN_AUTH_USER__);
    } catch {
      return null;
    }
  }
  try {
    const raw = localStorage.getItem("user");
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

/** Read whatever Flutter already injected (event detail optional). */
export function readNativeAuthPayload(detail) {
  const d = normalizeDetail(detail);
  return {
    token: readInjectedToken(d),
    user: readInjectedUser(d),
  };
}

function addDualListener(eventName, handler) {
  window.addEventListener(eventName, handler, true);
  document.addEventListener(eventName, handler, true);
  return () => {
    window.removeEventListener(eventName, handler, true);
    document.removeEventListener(eventName, handler, true);
  };
}

/**
 * Wire Flutter → Web session injection.
 * Listens on window + document (capture) because CustomEvent does not bubble by default.
 */
export function installNativeGoogleAuthBridge({ onSession, onError } = {}) {
  if (typeof window === "undefined") return () => {};
  if (typeof onSession !== "function") return () => {};

  LOG("installNativeGoogleAuthBridge: attaching listeners");

  const applyFromDetail = (detail, source) => {
    const payload = readNativeAuthPayload(detail);
    LOG("auth payload resolved", {
      source,
      hasToken: Boolean(payload.token),
      tokenPreview: payload.token
        ? `${payload.token.slice(0, 12)}…`
        : "(empty)",
      hasUser: Boolean(payload.user),
      userKeys:
        payload.user && typeof payload.user === "object"
          ? Object.keys(payload.user)
          : [],
      localStorageToken: Boolean(localStorage.getItem("token")),
      localStorageUser: Boolean(localStorage.getItem("user")),
      globalToken: typeof window.__DASHKAN_AUTH_TOKEN__,
      globalUser: typeof window.__DASHKAN_AUTH_USER__,
    });
    if (!payload.token) {
      LOG("skip onSession: no token in detail/globals/localStorage");
      return;
    }
    void onSession(payload);
  };

  const sessionHandler = (event) => {
    LOG("auth-session received", {
      target: event?.target === document ? "document" : "window/other",
      type: event?.type,
      detail: event?.detail,
    });
    applyFromDetail(event?.detail, "event");
  };

  const errorHandler = (event) => {
    const message =
      (typeof event?.detail?.message === "string" && event.detail.message) ||
      (typeof window.__DASHKAN_AUTH_ERROR__ === "string" &&
        window.__DASHKAN_AUTH_ERROR__) ||
      "Google sign-in failed";
    LOG("auth-error received", message);
    onError?.(message);
  };

  const removeSession = addDualListener(
    DASHKAN_AUTH_SESSION_EVENT,
    sessionHandler,
  );
  const removeError = addDualListener(DASHKAN_AUTH_ERROR_EVENT, errorHandler);

  // Flutter may set globals before the SPA mounts (same as FCM).
  if (typeof window.__DASHKAN_AUTH_TOKEN__ === "string") {
    LOG("found pre-injected __DASHKAN_AUTH_TOKEN__ on install");
    applyFromDetail({}, "preinjected-global");
  }

  return () => {
    LOG("installNativeGoogleAuthBridge: removing listeners");
    removeSession();
    removeError();
  };
}
