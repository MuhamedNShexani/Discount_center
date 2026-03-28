/**
 * WhatsApp deep links from mobile browsers / in-app WebViews (Instagram, Facebook, etc.)
 * often fail with window.open('_blank') (blocked or blank tab). Prefer api.whatsapp.com
 * and same-window navigation on iOS / WebView.
 */

/**
 * @param {string} url
 * @returns {string}
 */
export function normalizeWhatsAppUrl(url) {
  const s = String(url || "").trim();
  if (!s) return s;
  try {
    const base =
      typeof window !== "undefined" ? window.location.href : "https://localhost/";
    const u = new URL(s, base);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "wa.me") {
      const phone = u.pathname.replace(/^\//, "").replace(/\D/g, "");
      if (phone.length >= 8) {
        const text = u.searchParams.get("text");
        let out = `https://api.whatsapp.com/send?phone=${phone}`;
        if (text != null && text !== "") {
          out += `&text=${encodeURIComponent(text)}`;
        }
        return out;
      }
    }
  } catch {
    return s;
  }
  return s;
}

/**
 * @param {string} url - https wa.me or api.whatsapp.com
 */
export function openWhatsAppLink(url) {
  const target = normalizeWhatsAppUrl(url);
  if (!target) return;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const inWebView =
    /\bwv\b|; wv\)|Instagram|FBAN|FBAV|FB_IAB|Line\/|MicroMessenger|Twitter|Snapchat|Pinterest|LinkedInApp|GSA\/|CriOS/i.test(
      ua,
    );

  if (isIOS || inWebView) {
    window.location.assign(target);
    return;
  }

  const w = window.open(target, "_blank", "noopener,noreferrer");
  if (!w || w.closed) {
    window.location.assign(target);
  }
}
