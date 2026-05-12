/**
 * WebView-safe external navigation: avoid trapping Facebook, Maps, WhatsApp, etc. inside the shell.
 * Prefer programmatic use via openExternal(); global capture listener installed by useExternalLinkInterceptor.
 */

import { openWhatsAppLink } from "./openWhatsAppLink";

/** Backend hostname allowed as “internal” if linked directly (rare). */
const DEFAULT_INTERNAL_EXTRA_HOSTS = ["idashkan-production.up.railway.app"];

/** Domains where assigning location is preferred over window.open (deep links & maps).
 *  WhatsApp https URLs are NOT here — they go through openWhatsAppLink (whatsapp://) to avoid WKWebView loading web.whatsapp.com. */
const FORCE_LOCATION_SUBSTRINGS = [
  "maps.google.",
  "google.com/maps",
  "maps.app.goo.gl",
  "goo.gl/maps",
  "waze.com",
  "waze.me",
  "facebook.com",
  "fb.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "linkedin.com",
  "youtube.com",
  "youtu.be",
  "snapchat.com",
  "pinterest.com",
  "reddit.com",
  "threads.net",
  "t.me/",
  "telegram.me",
];

function normalizeHost(hostname) {
  return String(hostname || "")
    .toLowerCase()
    .replace(/^www\./, "");
}

function parseExtraHostsFromEnv() {
  const raw = (import.meta.env.VITE_INTERNAL_LINK_HOSTS || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => normalizeHost(s.trim()))
    .filter(Boolean);
}

/**
 * Hostnames considered same-site for SPA navigation (no external handoff).
 */
export function getInternalHostnameSet() {
  const set = new Set();
  if (typeof window !== "undefined" && window.location?.hostname) {
    set.add(normalizeHost(window.location.hostname));
  }
  for (const h of DEFAULT_INTERNAL_EXTRA_HOSTS) {
    set.add(normalizeHost(h));
  }
  for (const h of parseExtraHostsFromEnv()) {
    set.add(h);
  }
  set.add("localhost");
  set.add("127.0.0.1");
  set.add("::1");
  return set;
}

function hostnameIsAllowedInternal(hostname) {
  const h = normalizeHost(hostname);
  if (!h) return false;
  const allowed = getInternalHostnameSet();
  if (allowed.has(h)) return true;
  return false;
}

/**
 * True when the URL should leave the WebView / open with system handlers.
 */
export function isExternalUrl(rawUrl) {
  if (typeof rawUrl !== "string") return false;
  const t = rawUrl.trim();
  if (!t) return false;
  if (t.startsWith("#")) return false;
  const lower = t.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:"))
    return false;

  if (
    lower.startsWith("tel:") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("whatsapp:") ||
    lower.startsWith("sms:") ||
    lower.startsWith("geo:") ||
    lower.startsWith("maps:") ||
    lower.startsWith("viber:") ||
    lower.startsWith("tg:")
  ) {
    return true;
  }

  if (typeof window === "undefined") return false;

  let resolved;
  try {
    resolved = new URL(t, window.location.href);
  } catch {
    return false;
  }

  if (resolved.protocol === "file:") return false;

  const host = resolved.hostname;
  if (!host) return false;

  if (hostnameIsAllowedInternal(host)) return false;

  const origin = window.location.origin;
  try {
    if (resolved.origin === origin) return false;
  } catch {
    /* ignore */
  }

  return true;
}

function shouldUseLocationNavigation(url) {
  const lower = String(url).toLowerCase();
  if (/^tel:|^mailto:|^whatsapp:|^sms:|^geo:|^maps:|^viber:|^tg:/.test(lower)) {
    return true;
  }
  for (const sub of FORCE_LOCATION_SUBSTRINGS) {
    if (lower.includes(sub)) return true;
  }
  return false;
}

function isAndroid() {
  return (
    typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent)
  );
}

/** iPhone / iPad / iPod (includes iPadOS 13+ desktop UA). */
function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return (
    navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1
  );
}

/** Instagram / Facebook / TikTok deep links use the same flow on Android and iOS (WKWebView-safe). */
function isMobileDevice() {
  return isAndroid() || isIOS();
}

/** Maps / Waze / Apple Maps links — hand off to native apps on Android WebView (in-web maps GPS is often wrong). */
function isMapsHandoffUrl(url) {
  const lower = String(url).toLowerCase();
  if (lower.startsWith("geo:") || lower.startsWith("maps:")) return true;
  return (
    lower.includes("maps.google.") ||
    lower.includes("google.com/maps") ||
    lower.includes("maps.app.goo.gl") ||
    lower.includes("goo.gl/maps") ||
    lower.includes("waze.com") ||
    lower.includes("waze.me") ||
    lower.includes("maps.apple.com")
  );
}

function isInstagramHttpsUrl(url) {
  if (!/^https?:\/\//i.test(String(url))) return false;
  try {
    const u = new URL(url);
    const h = u.hostname.replace(/^www\./, "").toLowerCase();
    return h === "instagram.com" || h.endsWith(".instagram.com");
  } catch {
    return false;
  }
}

function isFacebookHttpsUrl(url) {
  if (!/^https?:\/\//i.test(String(url))) return false;
  try {
    const u = new URL(url);
    let h = u.hostname.replace(/^www\./, "").toLowerCase();
    if (h.startsWith("m.")) {
      h = h.slice(2);
    }
    return (
      h === "facebook.com" ||
      h.endsWith(".facebook.com") ||
      h === "fb.com" ||
      h.endsWith(".fb.com") ||
      h === "fb.watch"
    );
  } catch {
    return false;
  }
}

function isTikTokHttpsUrl(url) {
  if (!/^https?:\/\//i.test(String(url))) return false;
  try {
    const u = new URL(url);
    let h = u.hostname.replace(/^www\./, "").toLowerCase();
    if (h.startsWith("m.")) {
      h = h.slice(2);
    }
    return (
      h === "tiktok.com" ||
      h.endsWith(".tiktok.com") ||
      h === "vm.tiktok.com" ||
      h === "vt.tiktok.com"
    );
  } catch {
    return false;
  }
}

/** Path segments that are not profile usernames (posts, reels, etc.). */
const INSTAGRAM_RESERVED_FIRST_SEGMENT = new Set([
  "p",
  "reel",
  "reels",
  "tv",
  "stories",
  "explore",
  "accounts",
  "about",
  "legal",
  "help",
  "support",
  "web",
  "static",
  "download",
  "press",
  "developer",
  "directory",
  "locations",
  "graph",
  "direct",
]);

/**
 * First path segment for profile URLs like instagram.com/mybrand/
 * Returns null for /p/, /reel/, etc.
 */
function extractInstagramProfileUsername(urlString) {
  try {
    const u = new URL(urlString);
    const h = u.hostname.replace(/^www\./, "").toLowerCase();
    if (h !== "instagram.com" && !h.endsWith(".instagram.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    const first = parts[0];
    if (INSTAGRAM_RESERVED_FIRST_SEGMENT.has(first.toLowerCase())) return null;
    if (!/^[A-Za-z0-9._]+$/.test(first)) return null;
    return first;
  } catch {
    return null;
  }
}

/**
 * Mobile WebViews load instagram.com in-shell; IG's "Open app" uses intent:// which breaks.
 * Prefer native app deep link first for profile URLs, then fall back to https.
 */
function openInstagramOutOfWebView(httpsUrl) {
  const mobile = isMobileDevice();
  const username = extractInstagramProfileUsername(httpsUrl);
  if (mobile && username) {
    const appUrl = `instagram://user?username=${encodeURIComponent(username)}`;
    let fallbackTimer = window.setTimeout(() => {
      fallbackTimer = null;
      tryOpenExternalHttps(httpsUrl);
    }, 900);

    const cancelFallback = () => {
      if (fallbackTimer != null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState === "hidden") cancelFallback();
      },
      { once: true },
    );
    window.addEventListener("pagehide", cancelFallback, { once: true });

    try {
      window.location.href = appUrl;
    } catch {
      cancelFallback();
      tryOpenExternalHttps(httpsUrl);
    }
    return;
  }

  tryOpenExternalHttps(httpsUrl);
}

/**
 * Same pattern as Instagram: avoid loading facebook.com in WebView first (Open app → intent:// breaks).
 * `fb://facewebmodal/f?href=` passes the full https URL into the Facebook app when installed.
 */
function openFacebookOutOfWebView(httpsUrl) {
  const mobile = isMobileDevice();
  if (mobile) {
    const appUrl = `fb://facewebmodal/f?href=${encodeURIComponent(httpsUrl)}`;
    let fallbackTimer = window.setTimeout(() => {
      fallbackTimer = null;
      tryOpenExternalHttps(httpsUrl);
    }, 900);

    const cancelFallback = () => {
      if (fallbackTimer != null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState === "hidden") cancelFallback();
      },
      { once: true },
    );
    window.addEventListener("pagehide", cancelFallback, { once: true });

    try {
      window.location.href = appUrl;
    } catch {
      cancelFallback();
      tryOpenExternalHttps(httpsUrl);
    }
    return;
  }

  tryOpenExternalHttps(httpsUrl);
}

/** Not /@handle profile routes — videos, tags, short-link hosts, etc. */
const TIKTOK_RESERVED_FIRST_SEGMENT = new Set([
  "tag",
  "music",
  "discover",
  "following",
  "foryou",
  "for-you",
  "live",
  "trending",
  "legal",
  "static",
  "node",
  "embed",
  "share",
  "v",
  "video",
  "photo",
  "search",
  "explore",
  "t",
]);

/**
 * Profile URLs: tiktok.com/@handle or tiktok.com/handle (vm/vt short links → null).
 */
function extractTikTokProfileUsername(urlString) {
  try {
    const u = new URL(urlString);
    let host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host.startsWith("m.")) {
      host = host.slice(2);
    }
    if (host === "vm.tiktok.com" || host === "vt.tiktok.com") return null;
    if (host !== "tiktok.com" && !host.endsWith(".tiktok.com")) return null;

    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    const first = parts[0];
    if (TIKTOK_RESERVED_FIRST_SEGMENT.has(first.toLowerCase())) return null;

    let handle = first.startsWith("@") ? first.slice(1) : first;
    if (!handle || !/^[A-Za-z0-9._]+$/.test(handle)) return null;
    return handle;
  } catch {
    return null;
  }
}

/**
 * Same pattern as Instagram: try native app (`tiktok://user/profile/`) then https fallback.
 */
function openTikTokOutOfWebView(httpsUrl) {
  const mobile = isMobileDevice();
  const username = extractTikTokProfileUsername(httpsUrl);
  if (mobile && username) {
    const appUrl = `tiktok://user/profile/${encodeURIComponent(username)}`;
    let fallbackTimer = window.setTimeout(() => {
      fallbackTimer = null;
      tryOpenExternalHttps(httpsUrl);
    }, 900);

    const cancelFallback = () => {
      if (fallbackTimer != null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState === "hidden") cancelFallback();
      },
      { once: true },
    );
    window.addEventListener("pagehide", cancelFallback, { once: true });

    try {
      window.location.href = appUrl;
    } catch {
      cancelFallback();
      tryOpenExternalHttps(httpsUrl);
    }
    return;
  }

  tryOpenExternalHttps(httpsUrl);
}

/**
 * Never assign `intent://...` from JS inside embedded Android WebViews — they show ERR_UNKNOWN_URL_SCHEME.
 * Native shells must intercept intents in WebViewClient; until then use plain https opens only.
 */
function tryOpenExternalHttps(url) {
  const u = String(url || "").trim();
  if (!u) return;
  try {
    const w = window.open(u, "_blank");
    if (w != null && !w.closed) return;
  } catch {
    /* ignore */
  }
  try {
    window.location.assign(u);
  } catch {
    try {
      window.location.href = u;
    } catch {
      /* ignore */
    }
  }
}

function openAndroidMapsHandoff(originalUrl) {
  tryOpenExternalHttps(originalUrl);
}

/**
 * iOS: same https handoff as Instagram (tryOpenExternalHttps). Apple Maps → maps:// first.
 */
function openIosMapsHandoff(originalUrl) {
  const lower = String(originalUrl).toLowerCase();

  if (lower.includes("maps.apple.com")) {
    try {
      const u = new URL(originalUrl);
      window.location.href = `maps://maps.apple.com${u.pathname}${u.search}${u.hash}`;
      return;
    } catch {
      tryOpenExternalHttps(originalUrl);
      return;
    }
  }

  tryOpenExternalHttps(originalUrl);
}

/**
 * https://wa.me, api.whatsapp.com, web.whatsapp.com, etc. (not whatsapp: — handled above).
 */
function isWhatsAppWebOrHttpsUrl(url) {
  const s = String(url || "").trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  /** Custom scheme — always route through openWhatsAppLink */
  if (lower.startsWith("whatsapp:")) return true;
  try {
    const resolved = new URL(
      s,
      typeof window !== "undefined"
        ? window.location.href
        : "https://localhost/",
    );
    const h = resolved.hostname.replace(/^www\./, "").toLowerCase();
    return h === "wa.me" || h === "whatsapp.com" || h.endsWith(".whatsapp.com");
  } catch {
    return /\bwa\.me\b|whatsapp\.com/i.test(s);
  }
}

/**
 * Opens an external URL: tries a new browsing context first when appropriate, then falls back safely.
 * @param {string} url
 */
export function openExternal(url) {
  const u = String(url || "").trim();
  if (!u || u.toLowerCase().startsWith("javascript:")) return;

  /** Never assign WhatsApp https URLs to location — iOS WKWebView loads web WhatsApp in-shell. Use deep links. */
  if (isWhatsAppWebOrHttpsUrl(u)) {
    openWhatsAppLink(u);
    return;
  }

  if (shouldUseLocationNavigation(u)) {
    if (isMobileDevice() && isInstagramHttpsUrl(u)) {
      openInstagramOutOfWebView(u);
    } else if (isMobileDevice() && isFacebookHttpsUrl(u)) {
      openFacebookOutOfWebView(u);
    } else if (isMobileDevice() && isTikTokHttpsUrl(u)) {
      openTikTokOutOfWebView(u);
    } else if (isAndroid() && isMapsHandoffUrl(u)) {
      openAndroidMapsHandoff(u);
    } else if (isIOS() && isMapsHandoffUrl(u)) {
      openIosMapsHandoff(u);
    } else if (/^https?:\/\//i.test(u) && isMapsHandoffUrl(u)) {
      tryOpenExternalHttps(u);
    } else {
      try {
        window.location.href = u;
      } catch {
        /* ignore */
      }
    }
    return;
  }

  tryOpenExternalHttps(u);
}
