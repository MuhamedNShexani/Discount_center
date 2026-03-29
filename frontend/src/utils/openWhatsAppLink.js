/**
 * Open WhatsApp without replacing the current SPA URL.
 * Using location.assign() leaves users on api.whatsapp.com when they press “back” in the
 * WebView instead of returning to the app — same fix for cart orders and Profile “Contact us”.
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

  const w = window.open(target, "_blank", "noopener,noreferrer");
  if (w && !w.closed) {
    return;
  }

  try {
    const a = document.createElement("a");
    a.href = target;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    window.location.assign(target);
  }
}
