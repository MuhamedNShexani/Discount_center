const MS_DAY = 86400000;
const MS_HOUR = 3600000;

/**
 * Date-only (YYYY-MM-DD) → end of that local day 23:59:59.999 as ISO for the API.
 * datetime-local (YYYY-MM-DDTHH:mm) → ISO.
 */
export function normalizeExpiryInputForApi(value) {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Value for `<input type="datetime-local" />` from an ISO date string. */
export function toDatetimeLocalValue(isoOrEmpty) {
  if (isoOrEmpty == null || isoOrEmpty === "") return "";
  const d = new Date(isoOrEmpty);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Product/offer still valid (strict instant: after now). */
export function isExpiryStillValid(expireDate) {
  if (expireDate == null || expireDate === "") return true;
  const exp = new Date(expireDate);
  if (Number.isNaN(exp.getTime())) return true;
  return exp.getTime() > Date.now();
}

/**
 * @returns {{ kind: 'none' } | { kind: 'expired' } | { kind: 'days', days: number, totalMs: number } | { kind: 'hours', hours: number, minutes: number, seconds: number, totalMs: number }}
 */
export function getExpiryRemainingInfo(expireDate, now = new Date()) {
  if (!expireDate) return { kind: "none" };
  const exp = new Date(expireDate);
  if (Number.isNaN(exp.getTime())) return { kind: "none" };
  const ms = exp.getTime() - now.getTime();
  if (ms <= 0) return { kind: "expired" };
  if (ms < MS_DAY) {
    const hours = Math.floor(ms / MS_HOUR);
    const minutes = Math.floor((ms % MS_HOUR) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return { kind: "hours", hours, minutes, seconds, totalMs: ms };
  }
  const days = Math.floor(ms / MS_DAY);
  return { kind: "days", days, totalMs: ms };
}

export function shouldShowExpiryChip(info) {
  if (!info || info.kind === "none") return false;
  if (info.kind === "expired") return true;
  if (info.kind === "hours") return true;
  if (info.kind === "days") return info.days <= 30;
  return false;
}

/** Hours + minutes countdown only (no seconds). Sub-minute remainders show as 1m. */
export function formatExpiryCountdownHm(info) {
  if (!info || info.kind !== "hours") return "";
  const { hours, minutes, totalMs } = info;
  let displayHours = hours;
  let displayMinutes = minutes;
  if (displayHours === 0 && displayMinutes === 0 && totalMs > 0) {
    displayMinutes = 1;
  }
  if (displayHours > 0) {
    return `${displayHours}h ${String(displayMinutes).padStart(2, "0")}m`;
  }
  return `${displayMinutes}m`;
}

export function formatExpiryChipLabel(info, t) {
  if (!info || info.kind === "none") return "";
  if (info.kind === "expired") return t("Expired");
  if (info.kind === "hours") {
    return formatExpiryCountdownHm(info);
  }
  if (info.kind === "days") {
    return `${info.days} ${t("days left")}`;
  }
  return "";
}

/** "Expires: …" style label for gift/detail cards (days or countdown). */
export function formatExpiryExpiresPrefixedLabel(info, t) {
  if (!info || info.kind === "none") return "";
  if (info.kind === "expired") return t("Expired");
  if (info.kind === "hours") {
    return `${t("Expires")}: ${formatExpiryCountdownHm(info)}`;
  }
  if (info.kind === "days") {
    return `${t("Expires")}: ${info.days} ${t("days")}`;
  }
  return "";
}

/** Gift card chip colors (StoreProfile / Gifts style). */
export function expiryGiftCardBg(info) {
  if (!info || info.kind === "none") return "#6c757d";
  if (info.kind === "expired") return "#e53e3e";
  if (info.kind === "hours") return "#ff6b6b";
  if (info.kind === "days" && info.days <= 7) return "#ff6b6b";
  return "var(--brand-accent-orange)";
}

/** How long ago an offer expired (for product detail). */
export function formatExpiredAgoText(expireDate, t) {
  if (!expireDate) return "";
  const exp = new Date(expireDate);
  if (Number.isNaN(exp.getTime())) return "";
  const ms = Date.now() - exp.getTime();
  if (ms <= 0) return "";
  const days = Math.floor(ms / MS_DAY);
  if (days >= 1) {
    return `${t("Expired")} ${days} ${t("day")}${days !== 1 ? "s" : ""} ago`;
  }
  const hours = Math.floor(ms / MS_HOUR);
  if (hours >= 1) {
    return `${t("Expired")} ${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }
  const minutes = Math.max(1, Math.floor(ms / 60000));
  return `${t("Expired")} ${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
}

/** Chip color: red when urgent / expired; amber otherwise. */
export function expiryChipBg(info) {
  if (!info || info.kind === "expired") return "#e53e3e";
  if (info.kind === "hours") return "#e53e3e";
  if (info.kind === "days" && info.days <= 3) return "#e53e3e";
  return "#f59e0b";
}

/** Backward-compatible: calendar-style whole days until date (for simple lists). */
export function getRemainingDays(expireDate) {
  if (!expireDate) return null;
  const info = getExpiryRemainingInfo(expireDate);
  if (info.kind === "none") return null;
  if (info.kind === "expired") return -1;
  if (info.kind === "hours") return 0;
  return info.days;
}
