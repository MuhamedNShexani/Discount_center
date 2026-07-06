/** Page-specific nav chrome — matches Gifts / FindJob showcase accents */

/** Default home chrome — same brand bar as top `NavigationBar` (RTL-safe via inline style). */
export const DEFAULT_NAV_BAR_GRADIENT_LIGHT =
  "linear-gradient(120deg, var(--color-primary) 0%, var(--color-secondary) 56%, var(--color-secondary) 100%)";

/** Dark glass for top/bottom nav default routes. */
export const DEFAULT_NAV_BAR_GRADIENT_DARK_GLASS =
  "linear-gradient(118deg, rgba(7,11,20,0.78) 0%, rgba(15,23,42,0.7) 42%, rgba(23,37,84,0.62) 78%, rgba(37,99,235,0.45) 100%)";

export const DEFAULT_BOTTOM_NAV_ORANGE_ACTIVE =
  "linear-gradient(90deg, #f97316 0%, #ef4444 100%)";

const GIFT_NAV_GRADIENT_LIGHT =
  "linear-gradient(120deg, #a855f7 0%, #7c3aed 56%, #9333ea 100%)";
const GIFT_NAV_GRADIENT_DARK =
  "linear-gradient(118deg, rgba(30,15,50,0.82) 0%, rgba(59,35,80,0.75) 42%, rgba(126,58,237,0.55) 78%, rgba(168,85,247,0.48) 100%)";

const JOB_NAV_GRADIENT_LIGHT =
  "linear-gradient(120deg, #10b981 0%, #059669 56%, #047857 100%)";
const JOB_NAV_GRADIENT_DARK =
  "linear-gradient(118deg, rgba(6,28,22,0.82) 0%, rgba(13,27,42,0.75) 42%, rgba(5,120,85,0.55) 78%, rgba(16,185,129,0.48) 100%)";

const GIFT_NAV_ICON_ACTIVE_BG =
  "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)";
const JOB_NAV_ICON_ACTIVE_BG =
  "linear-gradient(135deg, #059669 0%, #10b981 100%)";

const STORE_NAV_GRADIENT_LIGHT =
  "linear-gradient(120deg, #38bdf8 0%, #0ea5e9 56%, #0284c7 100%)";
const STORE_NAV_GRADIENT_DARK =
  "linear-gradient(118deg, rgba(8,20,36,0.82) 0%, rgba(12,36,64,0.75) 42%, rgba(14,116,178,0.55) 78%, rgba(56,189,248,0.48) 100%)";
const STORE_NAV_ICON_ACTIVE_BG =
  "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)";

export function getNavPageTheme(pathname) {
  const path = String(pathname || "");
  if (path.startsWith("/gifts")) return "gifts";
  if (path.startsWith("/findjob")) return "findjob";
  if (path === "/stores" || path.startsWith("/stores/")) return "stores";
  return null;
}

export function getNavBarBackground(pathname, isDark, defaultBackground) {
  const theme = getNavPageTheme(pathname);
  if (theme === "gifts") {
    return isDark ? GIFT_NAV_GRADIENT_DARK : GIFT_NAV_GRADIENT_LIGHT;
  }
  if (theme === "findjob") {
    return isDark ? JOB_NAV_GRADIENT_DARK : JOB_NAV_GRADIENT_LIGHT;
  }
  if (theme === "stores") {
    return isDark ? STORE_NAV_GRADIENT_DARK : STORE_NAV_GRADIENT_LIGHT;
  }
  return defaultBackground;
}

export function getNavShellBackground(pathname, isDark, defaultShell) {
  if (!isDark) return "#ffffff";
  const theme = getNavPageTheme(pathname);
  if (theme === "gifts") return "#1a1030";
  if (theme === "findjob") return "#0b1a14";
  if (theme === "stores") return "#0c1929";
  return defaultShell;
}

/** Bottom bar only — light mode keeps a white surface so icon pills stay readable */
export function resolveBottomNavSurfaceStyle(
  pathname,
  isDark,
  { darkDefault, lightDefault },
) {
  const theme = getNavPageTheme(pathname);
  if (isDark) {
    if (theme === "gifts") return { background: GIFT_NAV_GRADIENT_DARK };
    if (theme === "findjob") return { background: JOB_NAV_GRADIENT_DARK };
    if (theme === "stores") return { background: STORE_NAV_GRADIENT_DARK };
    return { background: darkDefault };
  }
  if (theme === "gifts" || theme === "findjob" || theme === "stores") {
    return { backgroundColor: "rgba(255,255,255,0.98)" };
  }
  return typeof lightDefault === "string" && lightDefault.startsWith("linear")
    ? { background: lightDefault }
    : { backgroundColor: lightDefault };
}

export function getBottomNavBorderTop(pathname, isDark) {
  const theme = getNavPageTheme(pathname);
  if (isDark) return "1px solid rgba(255,255,255,0.12)";
  if (theme === "gifts") return "1px solid rgba(168,85,247,0.22)";
  if (theme === "findjob") return "1px solid rgba(16,185,129,0.22)";
  if (theme === "stores") return "1px solid rgba(14,165,233,0.22)";
  return "1px solid rgba(229,231,235,0.6)";
}

export function getBottomNavInactiveIconColor(isDark, pathname) {
  const theme = getNavPageTheme(pathname);
  if (isDark && theme) return "rgba(255,255,255,0.72)";
  return isDark ? "#a1a1aa" : "#71717a";
}

/** Active route icon button — top nav custom slots */
export function getNavRouteIconActiveSx(pathname, linkTo) {
  if (!linkTo || linkTo === "/" || !String(pathname || "").startsWith(linkTo)) {
    return {};
  }
  if (linkTo.startsWith("/gifts")) {
    return {
      background: GIFT_NAV_ICON_ACTIVE_BG,
      border: "1px solid rgba(255,255,255,0.4)",
      boxShadow:
        "0 4px 14px rgba(168,85,247,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
    };
  }
  if (linkTo.startsWith("/findjob")) {
    return {
      background: JOB_NAV_ICON_ACTIVE_BG,
      border: "1px solid rgba(255,255,255,0.4)",
      boxShadow:
        "0 4px 14px rgba(16,185,129,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
    };
  }
  if (linkTo === "/stores" || linkTo.startsWith("/stores")) {
    return {
      background: STORE_NAV_ICON_ACTIVE_BG,
      border: "1px solid rgba(255,255,255,0.4)",
      boxShadow:
        "0 4px 14px rgba(14,165,233,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
    };
  }
  return {
    backgroundColor: "rgba(255,255,255,0.22)",
    border: "1px solid rgba(255,255,255,0.35)",
  };
}

/** Active tab pill — bottom nav */
export function getBottomNavActiveTabStyle(
  itemPath,
  { compact = false, isDark = false, pathname = "" } = {},
) {
  const pageTheme = getNavPageTheme(pathname);
  const onThemedDarkBar = isDark && Boolean(pageTheme);
  const onMatchingThemedTab =
    (itemPath === "/gifts" && pageTheme === "gifts") ||
    (itemPath === "/findjob" && pageTheme === "findjob") ||
    (itemPath === "/stores" && pageTheme === "stores");

  if (itemPath === "/gifts") {
    if (onThemedDarkBar && onMatchingThemedTab) {
      return {
        background: "rgba(255,255,255,0.22)",
        boxShadow: compact
          ? "0 2px 8px rgba(0,0,0,0.22)"
          : "0 6px 20px rgba(0,0,0,0.28)",
      };
    }
    return {
      background: GIFT_NAV_ICON_ACTIVE_BG,
      boxShadow: compact
        ? "0 2px 8px rgba(168,85,247,0.35)"
        : "0 10px 28px rgba(168,85,247,0.4)",
    };
  }
  if (itemPath === "/findjob") {
    if (onThemedDarkBar && onMatchingThemedTab) {
      return {
        background: "rgba(255,255,255,0.22)",
        boxShadow: compact
          ? "0 2px 8px rgba(0,0,0,0.22)"
          : "0 6px 20px rgba(0,0,0,0.28)",
      };
    }
    return {
      background: JOB_NAV_ICON_ACTIVE_BG,
      boxShadow: compact
        ? "0 2px 8px rgba(16,185,129,0.35)"
        : "0 10px 28px rgba(16,185,129,0.4)",
    };
  }
  if (itemPath === "/stores") {
    if (onThemedDarkBar && onMatchingThemedTab) {
      return {
        background: "rgba(255,255,255,0.22)",
        boxShadow: compact
          ? "0 2px 8px rgba(0,0,0,0.22)"
          : "0 6px 20px rgba(0,0,0,0.28)",
      };
    }
    return {
      background: STORE_NAV_ICON_ACTIVE_BG,
      boxShadow: compact
        ? "0 2px 8px rgba(14,165,233,0.35)"
        : "0 10px 28px rgba(14,165,233,0.4)",
    };
  }
  if (compact) {
    return {
      background: DEFAULT_BOTTOM_NAV_ORANGE_ACTIVE,
      boxShadow: "0 6px 16px rgba(249,115,22,0.4)",
    };
  }
  return {
    background: DEFAULT_BOTTOM_NAV_ORANGE_ACTIVE,
    boxShadow: "0 10px 28px rgba(249,115,22,0.45)",
  };
}

/** Side drawer selected row */
export function getNavMenuItemSelectedBg(pathname, linkTo, isDark) {
  if (linkTo?.startsWith("/gifts") && pathname.startsWith("/gifts")) {
    return isDark ? "rgba(168,85,247,0.28)" : "rgba(168,85,247,0.14)";
  }
  if (linkTo?.startsWith("/findjob") && pathname.startsWith("/findjob")) {
    return isDark ? "rgba(16,185,129,0.28)" : "rgba(16,185,129,0.14)";
  }
  if (
    (linkTo === "/stores" || linkTo?.startsWith("/stores")) &&
    (pathname === "/stores" || pathname.startsWith("/stores/"))
  ) {
    return isDark ? "rgba(56,189,248,0.28)" : "rgba(14,165,233,0.14)";
  }
  return isDark ? "rgba(30,111,217,0.22)" : "rgba(30,111,217,0.1)";
}
