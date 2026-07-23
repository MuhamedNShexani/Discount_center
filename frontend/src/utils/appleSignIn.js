/**
 * Apple Sign In — Flutter WebView native bridge (+ browser placeholder).
 *
 * Flutter injects:
 *   window.__FLUTTER_APPLE_SIGN_IN_BRIDGE__ === true
 *   window.__FLUTTER_SIGN_IN_WITH_APPLE__()
 *   window.flutter_inappwebview.callHandler("signInWithApple")
 *
 * Browser Apple JS SDK is intentionally not implemented yet.
 */

/** @typedef {{
 *   identityToken?: string,
 *   authorizationCode?: string,
 *   userIdentifier?: string,
 *   email?: string,
 *   givenName?: string,
 *   familyName?: string,
 * }} AppleCredential */

export class AppleSignInError extends Error {
  /**
   * @param {string} message
   * @param {{ cancelled?: boolean }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "AppleSignInError";
    this.cancelled = Boolean(opts.cancelled);
  }
}

/**
 * True when the Flutter Apple Sign In bridge is available.
 * @returns {boolean}
 */
export function isFlutterAppleSignIn() {
  try {
    return (
      typeof window !== "undefined" &&
      window.__FLUTTER_APPLE_SIGN_IN_BRIDGE__ === true
    );
  } catch {
    return false;
  }
}

/**
 * Request native Apple credentials from Flutter (or throw for browser).
 * @returns {Promise<AppleCredential>}
 */
export async function signInWithApple() {
  if (typeof window === "undefined") {
    throw new AppleSignInError("Apple Sign In is not available");
  }

  if (!isFlutterAppleSignIn()) {
    // TODO: Apple JS Sign In (browser) — not implemented yet.
    throw new AppleSignInError(
      "Apple Sign In for browser not implemented yet.",
    );
  }

  let raw;
  try {
    if (typeof window.__FLUTTER_SIGN_IN_WITH_APPLE__ === "function") {
      raw = await window.__FLUTTER_SIGN_IN_WITH_APPLE__();
    } else if (
      typeof window.flutter_inappwebview?.callHandler === "function"
    ) {
      raw = await window.flutter_inappwebview.callHandler("signInWithApple");
    } else {
      throw new AppleSignInError(
        "Native Apple sign-in is not available. Update the app and try again.",
      );
    }
  } catch (e) {
    if (e instanceof AppleSignInError) throw e;
    throw new AppleSignInError(
      e?.message || "Apple sign-in failed",
    );
  }

  const result =
    typeof raw === "string"
      ? (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        })()
      : raw;

  if (!result || typeof result !== "object") {
    throw new AppleSignInError("Apple sign-in failed");
  }

  if (result.success === false || result.cancelled === true) {
    if (result.cancelled === true) {
      throw new AppleSignInError("cancelled", { cancelled: true });
    }
    throw new AppleSignInError(
      (typeof result.error === "string" && result.error.trim()) ||
        "Apple sign-in failed",
    );
  }

  const identityToken =
    typeof result.identityToken === "string"
      ? result.identityToken.trim()
      : "";
  if (!identityToken) {
    throw new AppleSignInError("Apple sign-in failed: missing identity token");
  }

  return {
    identityToken,
    authorizationCode:
      typeof result.authorizationCode === "string"
        ? result.authorizationCode.trim()
        : undefined,
    userIdentifier:
      typeof result.userIdentifier === "string"
        ? result.userIdentifier.trim()
        : undefined,
    email: typeof result.email === "string" ? result.email.trim() : undefined,
    givenName:
      typeof result.givenName === "string" ? result.givenName.trim() : undefined,
    familyName:
      typeof result.familyName === "string"
        ? result.familyName.trim()
        : undefined,
  };
}

/**
 * Native Apple credential → backend login via the provided AuthContext method.
 * @param {(credential: AppleCredential) => Promise<{ success: boolean, message?: string }>} authLoginWithApple
 * @returns {Promise<{ success: boolean, message?: string, cancelled?: boolean }>}
 */
export async function loginWithApple(authLoginWithApple) {
  if (typeof authLoginWithApple !== "function") {
    return { success: false, message: "Apple sign-in is not configured" };
  }
  try {
    const credential = await signInWithApple();
    return await authLoginWithApple(credential);
  } catch (e) {
    if (e?.cancelled || e instanceof AppleSignInError && e.cancelled) {
      return { success: false, cancelled: true, message: "cancelled" };
    }
    return {
      success: false,
      message:
        (e && typeof e.message === "string" && e.message) ||
        "Apple sign-in failed",
    };
  }
}

/** Simple Apple logo mark for buttons. */
export function AppleLogo({ size = 20, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill={color}
        d="M16.365 1.43c0 1.14-.46 2.2-1.22 2.99-.79.83-2.1 1.47-3.2 1.38-.13-1.1.44-2.25 1.2-3.02.8-.82 2.2-1.42 3.22-1.35zM20.5 17.2c-.58 1.34-.86 1.93-1.61 3.11-1.05 1.63-2.53 3.66-4.36 3.68-1.62.03-2.04-1.06-4.25-1.05-2.2.01-2.67 1.08-4.29 1.05-1.83-.03-3.23-1.85-4.28-3.48C-.04 17.4-.9 13.3.99 10.5c1.07-1.58 2.76-2.58 4.4-2.58 1.64 0 2.67 1.07 4.25 1.07 1.54 0 2.48-1.08 4.24-1.08 1.5 0 3.09.82 4.15 2.23-3.65 2-3.05 7.2 2.47 7.06z"
      />
    </svg>
  );
}
