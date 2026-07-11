import { useEffect } from "react";

/**
 * Toggles document-level classes that drive mobile header CSS variables.
 * NavigationBar sets `mobile-header-active`; MainPage sets `mobile-main-tabs`.
 */
export function useMobileHeaderActive(active) {
  useEffect(() => {
    const root = document.documentElement;
    if (active) {
      root.classList.add("mobile-header-active");
    } else {
      root.classList.remove("mobile-header-active");
    }
    return () => root.classList.remove("mobile-header-active");
  }, [active]);
}

export function useMobileMainTabsActive(active) {
  useEffect(() => {
    const root = document.documentElement;
    if (active) {
      root.classList.add("mobile-main-tabs");
    } else {
      root.classList.remove("mobile-main-tabs");
    }
    return () => root.classList.remove("mobile-main-tabs");
  }, [active]);
}

/** Shared mobile page top offset — nav + safe area only (no feed tabs). */
export const MOBILE_NAV_OFFSET_SX = {
  pt: {
    xs: "calc(var(--safe-top) + var(--nav-height))",
    md: "113px",
  },
};

export const MOBILE_NAV_SCROLL_MARGIN_SX = {
  scrollMarginTop: {
    xs: "calc(var(--safe-top) + var(--nav-height))",
    md: "113px",
  },
};

/** Shared mobile page top offset — includes safe area, nav, and optional feed tabs. */
export const MOBILE_PAGE_OFFSET_SX = {
  pt: {
    xs: "var(--header-height)",
    md: "113px",
  },
};

export const MOBILE_SCROLL_MARGIN_SX = {
  scrollMarginTop: {
    xs: "var(--header-height)",
    md: "113px",
  },
};
