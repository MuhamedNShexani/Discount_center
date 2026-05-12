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
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) return false;

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
  if (
    /^tel:|^mailto:|^whatsapp:|^sms:|^geo:|^maps:|^viber:|^tg:/.test(lower)
  ) {
    return true;
  }
  for (const sub of FORCE_LOCATION_SUBSTRINGS) {
    if (lower.includes(sub)) return true;
  }
  return false;
}

function isAndroid() {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
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

/**
 * Avoid loading instagram.com inside WebView: IG's "Open app" uses intent:// which triggers ERR_UNKNOWN_URL_SCHEME.
 * Prefer VIEW intent into the Instagram app (fallback URL opens Chrome if app missing).
 */
function instagramHttpsToAndroidIntent(originalUrl) {
  try {
    const u = new URL(originalUrl);
    const h = u.hostname.replace(/^www\./, "").toLowerCase();
    if (h !== "instagram.com" && !h.endsWith(".instagram.com")) return null;
    const pathQueryHash = u.pathname + u.search + u.hash;
    const fallback = encodeURIComponent(originalUrl);
    const intentHost = u.hostname.toLowerCase();
    return `intent://${intentHost}${pathQueryHash}#Intent;scheme=https;package=com.instagram.android;S.browser_fallback_url=${fallback};end`;
  } catch {
    return null;
  }
}

function openAndroidInstagramHandoff(originalUrl) {
  const intent = instagramHttpsToAndroidIntent(originalUrl);
  if (intent) {
    try {
      window.location.href = intent;
      return;
    } catch {
      /* fall through */
    }
  }
  try {
    const w = window.open(originalUrl, "_blank");
    if (w == null || w.closed) {
      window.location.href = originalUrl;
    }
  } catch {
    try {
      window.location.href = originalUrl;
    } catch {
      /* ignore */
    }
  }
}

/**
 * Pull lat/lng from common maps URLs so Android can use geo: (opens in Maps app with correct pin).
 */
function extractLatLngFromMapsLikeUrl(urlString) {
  const text = String(urlString);
  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:ll|query|daddr|saddr|destination)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]center=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        return { lat, lng };
      }
    }
  }
  try {
    const u = new URL(urlString);
    const q = u.searchParams.get("q");
    if (q) {
      const trimmed = q.trim();
      const m = /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/.exec(trimmed);
      if (m) {
        const lat = Number(m[1]);
        const lng = Number(m[2]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }
    }
    const ll = u.searchParams.get("ll");
    if (ll) {
      const parts = ll.split(",");
      if (parts.length >= 2) {
        const lat = Number(parts[0]);
        const lng = Number(parts[1]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * maps.app.goo.gl / goo.gl/maps — route through Maps app so WebView resolves short links natively.
 */
function googleMapsShortLinkToAndroidIntent(originalUrl) {
  try {
    const u = new URL(originalUrl);
    const h = u.hostname.replace(/^www\./, "").toLowerCase();
    if (
      !h.includes("goo.gl") &&
      !h.includes("maps.app.goo.gl") &&
      h !== "maps.app.goo.gl"
    ) {
      return null;
    }
    const pathQueryHash = u.pathname + u.search + u.hash;
    const fallback = encodeURIComponent(originalUrl);
    const host = u.hostname.toLowerCase();
    return `intent://${host}${pathQueryHash}#Intent;scheme=https;package=com.google.android.apps.maps;S.browser_fallback_url=${fallback};end`;
  } catch {
    return null;
  }
}

function googleHttpsUrlToMapsIntent(originalUrl) {
  try {
    const u = new URL(originalUrl);
    const h = u.hostname.replace(/^www\./, "").toLowerCase();
    if (h.includes("goo.gl") || h.includes("app.goo.gl")) return null;

    const onGoogleMaps =
      h === "maps.google.com" ||
      h.endsWith(".maps.google.com") ||
      h === "google.com" ||
      (h.endsWith(".google.com") && u.pathname.startsWith("/maps"));

    if (!onGoogleMaps) return null;

    const pathQueryHash = u.pathname + u.search + u.hash;
    const fallback = encodeURIComponent(originalUrl);
    /** Keep original host (e.g. www.google.com) so path/query match desktop opens exactly. */
    const intentHost = u.hostname.toLowerCase();
    return `intent://${intentHost}${pathQueryHash}#Intent;scheme=https;package=com.google.android.apps.maps;S.browser_fallback_url=${fallback};end`;
  } catch {
    return null;
  }
}

function wazeHttpsUrlToIntent(originalUrl) {
  try {
    const u = new URL(originalUrl);
    const h = u.hostname.replace(/^www\./, "").toLowerCase();
    if (!h.includes("waze")) return null;
    const pathQueryHash = u.pathname + u.search + u.hash;
    const fallback = encodeURIComponent(originalUrl);
    const intentHost = u.hostname.toLowerCase();
    return `intent://${intentHost}${pathQueryHash}#Intent;scheme=https;package=com.waze;S.browser_fallback_url=${fallback};end`;
  } catch {
    return null;
  }
}

/**
 * On Android WebView, hand off to the Maps app with the **same** https URL as desktop (place id, path).
 * Never prefer `geo:` first — extracted @lat,lng is often camera position, not the saved place pin.
 */
function openAndroidMapsHandoff(originalUrl) {
  const googleIntent = googleHttpsUrlToMapsIntent(originalUrl);
  if (googleIntent) {
    try {
      window.location.href = googleIntent;
      return;
    } catch {
      /* fall through */
    }
  }

  const shortIntent = googleMapsShortLinkToAndroidIntent(originalUrl);
  if (shortIntent) {
    try {
      window.location.href = shortIntent;
      return;
    } catch {
      /* fall through */
    }
  }

  const wazeIntent = wazeHttpsUrlToIntent(originalUrl);
  if (wazeIntent) {
    try {
      window.location.href = wazeIntent;
      return;
    } catch {
      /* fall through */
    }
  }

  const coords = extractLatLngFromMapsLikeUrl(originalUrl);
  if (coords) {
    const geo = `geo:${coords.lat},${coords.lng}?q=${coords.lat},${coords.lng}`;
    try {
      window.location.href = geo;
      return;
    } catch {
      /* fall through */
    }
  }

  try {
    window.location.href = originalUrl;
  } catch {
    /* ignore */
  }
}

function isGoogleMapsHttpsUrl(url) {
  const lower = String(url).toLowerCase();
  return (
    lower.includes("maps.google.") ||
    lower.includes("google.com/maps") ||
    lower.includes("maps.app.goo.gl") ||
    lower.includes("goo.gl/maps")
  );
}

/**
 * iOS: open the **same** https Maps URL as desktop (`window.open` / Safari).
 * Do not use `comgooglemaps://?q=lat,lng` — it drops place IDs / path and the pin can differ from pasted links.
 */
function openIosMapsHandoff(originalUrl) {
  const lower = String(originalUrl).toLowerCase();

  const openHttpsFallback = () => {
    try {
      /** Two-arg open returns a Window; `noopener` in feature string makes browsers return null while still opening a tab → duplicate navigation if we then set location. */
      const w = window.open(originalUrl, "_blank");
      if (w == null || w.closed) {
        window.location.href = originalUrl;
      }
    } catch {
      try {
        window.location.href = originalUrl;
      } catch {
        /* ignore */
      }
    }
  };

  /** Apple Maps web links → system Maps app */
  if (lower.includes("maps.apple.com")) {
    try {
      const u = new URL(originalUrl);
      window.location.href = `maps://maps.apple.com${u.pathname}${u.search}${u.hash}`;
      return;
    } catch {
      openHttpsFallback();
      return;
    }
  }

  /** Google Maps (full URL or goo.gl): match desktop — full URL preserves exact place. */
  if (isGoogleMapsHttpsUrl(originalUrl) && /^https?:\/\//i.test(originalUrl)) {
    openHttpsFallback();
    return;
  }

  openHttpsFallback();
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
      typeof window !== "undefined" ? window.location.href : "https://localhost/",
    );
    const h = resolved.hostname.replace(/^www\./, "").toLowerCase();
    return (
      h === "wa.me" ||
      h === "whatsapp.com" ||
      h.endsWith(".whatsapp.com")
    );
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
    if (isAndroid() && isInstagramHttpsUrl(u)) {
      openAndroidInstagramHandoff(u);
    } else if (isAndroid() && isMapsHandoffUrl(u)) {
      openAndroidMapsHandoff(u);
    } else if (
      isIOS() &&
      (isInstagramHttpsUrl(u) || isMapsHandoffUrl(u))
    ) {
      openIosMapsHandoff(u);
    } else if (/^https?:\/\//i.test(u) && isMapsHandoffUrl(u)) {
      try {
        const w = window.open(u, "_blank");
        if (w == null || w.closed) {
          window.location.href = u;
        }
      } catch {
        try {
          window.location.href = u;
        } catch {
          /* ignore */
        }
      }
    } else {
      try {
        window.location.href = u;
      } catch {
        /* ignore */
      }
    }
    return;
  }

  try {
    const w = window.open(u, "_blank");
    if (w == null || w.closed) {
      window.location.href = u;
    }
  } catch {
    try {
      window.location.href = u;
    } catch {
      /* ignore */
    }
  }
}
