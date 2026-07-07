import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Box,
  useTheme,
  Menu,
  MenuItem,
  Badge,
  Typography,
} from "@mui/material";
import {
  Home,
  Search,
  RefreshCw,
  LayoutGrid,
  Clapperboard,
  Heart,
  Store,
  Gift,
  ShoppingBag,
  ShoppingCart,
  User,
  Building2,
  Landmark,
  Briefcase,
  MapPin,
  Languages,
  Bell,
} from "lucide-react";
import { motion, LayoutGroup, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useIsMobileLayout from "../hooks/useIsMobileLayout";
import { useActiveTheme } from "../context/ActiveThemeContext";
import { useCityFilter } from "../context/CityFilterContext";
import { useContentRefresh } from "../context/ContentRefreshContext";
import { useNotifications } from "../context/NotificationContext";
import kurdishFlag from "../styles/kurdish_flag.jpg";
import {
  MAIN_PAGE_SCROLL_KEY,
  MAIN_PAGE_SCROLL_STATE_KEY,
  resetMainPageScrollPositionInSession,
  scrollWindowToTop,
} from "../utils/mainPageScrollSession";
import { prefetchSearchPageChunk } from "../utils/prefetchSearchPage";
import { useDraftCartDrawer } from "../hooks/useDraftCartDrawer";
import { useNotificationDrawer } from "../hooks/useNotificationDrawer";
import { useProfileDrawer } from "../hooks/useProfileDrawer";
import { useVisualViewportKeyboardInset } from "../hooks/useVisualViewportKeyboardInset";
import { isAndroidPerformanceMode } from "../utils/androidPerformance";
import {
  getBottomNavActiveTabStyle,
  getBottomNavBorderTop,
  getBottomNavInactiveIconColor,
  getNavShellBackground,
  resolveBottomNavSurfaceStyle,
} from "../utils/navPageThemes";

const NAV_PATH_CITY = "__nav_city__";
const NAV_PATH_LANG = "__nav_language__";
const NAV_PATH_REFRESH = "__nav_refresh__";
const NAV_PATH_NOTIFICATIONS = "__nav_notifications__";
const NAV_PATH_DRAFT_CART = "__nav_draft_cart__";
const NAV_PATH_PROFILE = "__nav_profile__";

/** Dark glass surface for the bottom bar (unchanged from pre–mobile-orange-bar fix). */
const BOTTOM_NAV_DARK_GLASS =
  "linear-gradient(118deg, rgba(7,11,20,0.78) 0%, rgba(15,23,42,0.7) 42%, rgba(23,37,84,0.62) 78%, rgba(37,99,235,0.45) 100%)";

/** MUI Box + Framer Motion — keeps layout/animation working without relying on Tailwind. */
const MotionBox = motion(Box);

/** Full-width bottom bar: shared icon + label scale (readable on wide screens). */
const NAV_ICON_SIZE = 26;
const NAV_ICON_STROKE = { idle: 2, active: 2.4 };

/** Drop focus ring after tap so drawer/nav buttons do not stay highlighted. */
function blurThen(fn) {
  return (event) => {
    event.currentTarget?.blur?.();
    fn(event);
  };
}

function persistMainPageScrollState(y) {
  try {
    const rawState = sessionStorage.getItem(MAIN_PAGE_SCROLL_STATE_KEY);
    const parsed = rawState ? JSON.parse(rawState) : {};
    sessionStorage.setItem(MAIN_PAGE_SCROLL_KEY, String(y));
    sessionStorage.setItem(
      MAIN_PAGE_SCROLL_STATE_KEY,
      JSON.stringify({
        y,
        tab: Number.isFinite(Number(parsed?.tab)) ? Number(parsed.tab) : 0,
        displayedCount: Number.isFinite(Number(parsed?.displayedCount))
          ? Number(parsed.displayedCount)
          : 0,
      }),
    );
  } catch {
    // ignore
  }
}

const BottomNavigationBar = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const reduceMotion = useReducedMotion();
  const isAndroidPerfMode = useMemo(() => isAndroidPerformanceMode(), []);
  const useLayoutAnimations = !reduceMotion && !isAndroidPerfMode;
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobileLayout();
  const { navConfig } = useActiveTheme();
  const { openDraftCart } = useDraftCartDrawer();
  const { openNotifications } = useNotificationDrawer();
  const { openProfile } = useProfileDrawer();
  const { triggerRefresh } = useContentRefresh();
  const handleBottomNavRefresh = useCallback(() => {
    if (location.pathname === "/") {
      scrollWindowToTop("auto");
      resetMainPageScrollPositionInSession();
    }
    triggerRefresh?.();
  }, [location.pathname, triggerRefresh]);
  const { selectedCity, changeCity, cities } = useCityFilter();
  const { unreadCount } = useNotifications();
  const [cityMenuAnchor, setCityMenuAnchor] = useState(null);
  const [langMenuAnchor, setLangMenuAnchor] = useState(null);
  const lastHomeTapTsRef = useRef(0);
  const lastReelsTapTsRef = useRef(0);

  const isSearchPage = /^\/search(\/|$)/.test(location.pathname);
  const keyboardInset = useVisualViewportKeyboardInset(isSearchPage);

  /** Same route matching as before — drives “active” tab + pill target. */
  const activeValue = useMemo(() => {
    let pathname = location.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    if (pathname === "/") return "/";
    if (pathname === "/reels" || pathname.startsWith("/reels/")) {
      return "/reels";
    }
    if (pathname === "/favourites") return "/favourites";
    if (pathname === "/categories") return "/categories";
    if (pathname === "/gifts") return "/gifts";
    if (pathname === "/shopping") return "/shopping";
    if (pathname === "/findjob") return "/findjob";
    if (pathname === "/search") return "/search";

    if (pathname.startsWith("/stores")) return "/stores";
    if (pathname.startsWith("/brands")) return "/brands";
    if (pathname.startsWith("/companies")) return "/companies";

    return false;
  }, [location.pathname]);

  const template = navConfig?.template || "template1";
  const showAllLabels = navConfig?.bottomNavLabelMode === "always";

  const actionMap = useMemo(
    () => ({
      home: { name: t("Home"), path: "/", Icon: Home },
      logo: {
        kind: "logo",
        name: t("Logo", { defaultValue: "Logo" }),
        path: "/",
      },
      search: { name: t("Search"), path: "/search", Icon: Search },
      refresh: {
        kind: "refresh",
        name: t("Refresh"),
        path: NAV_PATH_REFRESH,
        Icon: RefreshCw,
      },
      categories: {
        name: t("Categories"),
        path: "/categories",
        Icon: LayoutGrid,
      },
      reels: { name: t("Reels"), path: "/reels", Icon: Clapperboard },
      favourites: {
        name: t("Favourites"),
        path: "/favourites",
        Icon: Heart,
      },
      stores: { name: t("Stores"), path: "/stores", Icon: Store },
      gifts: { name: t("Gifts"), path: "/gifts", Icon: Gift },
      shopping: {
        name: t("Shopping"),
        path: "/shopping",
        Icon: ShoppingBag,
      },
      draftCart: {
        kind: "draftCart",
        name: t("Draft cart"),
        path: NAV_PATH_DRAFT_CART,
        Icon: ShoppingCart,
      },
      profile: {
        kind: "profile",
        name: t("Account"),
        path: NAV_PATH_PROFILE,
        Icon: User,
      },
      brands: { name: t("Brands"), path: "/brands", Icon: Building2 },
      companies: {
        name: t("Companies"),
        path: "/companies",
        Icon: Landmark,
      },
      jobs: {
        name: t("Find Job"),
        path: "/findjob",
        Icon: Briefcase,
      },
      city: {
        kind: "city",
        name: t("City"),
        path: NAV_PATH_CITY,
        Icon: MapPin,
      },
      language: {
        kind: "language",
        name: t("Language"),
        path: NAV_PATH_LANG,
        Icon: Languages,
      },
      notifications: {
        kind: "notifications",
        name: t("Notifications"),
        path: NAV_PATH_NOTIFICATIONS,
        Icon: Bell,
      },
    }),
    [t],
  );

  const navItems = useMemo(
    () =>
      template === "template2"
        ? [
            actionMap.home,
            actionMap.categories,
            actionMap.reels,
            actionMap.favourites,
            actionMap.profile,
          ]
        : template === "custom" || template === "custom2" || template === "custom3"
          ? [
              actionMap[navConfig?.bottomSlots?.bottomleft1] || null,
              actionMap[navConfig?.bottomSlots?.bottomleft2] || null,
              actionMap[navConfig?.bottomSlots?.center] || null,
              actionMap[navConfig?.bottomSlots?.bottomright1] || null,
              actionMap[navConfig?.bottomSlots?.bottomright2] || null,
            ]
          : [
              actionMap.home,
            actionMap.search,
              actionMap.reels,
              actionMap.stores,
            actionMap.profile,
            ],
    [template, actionMap, navConfig],
  );

  const isTemplate3 = template === "template3";

  /** Snappier spring so the active pill tracks tab switches quickly. */
  const pillTransition = useMemo(
    () =>
      reduceMotion
        ? { duration: 0.08 }
        : { type: "spring", stiffness: 820, damping: 42, mass: 0.55 },
    [reduceMotion],
  );

  const handleRouteNavigate = useCallback(
    (item) => {
      if (item.path === "/" && location.pathname === "/") {
        const now = Date.now();
        const isDoubleTap = now - lastHomeTapTsRef.current <= 450;
        lastHomeTapTsRef.current = now;
        const isAtTop = (window.scrollY || window.pageYOffset || 0) <= 8;

        if (isDoubleTap || isAtTop) {
          scrollWindowToTop("auto");
          resetMainPageScrollPositionInSession();
          triggerRefresh?.();
          return;
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (
        item.path === "/reels" &&
        (location.pathname === "/reels" ||
          location.pathname.startsWith("/reels/"))
      ) {
        const now = Date.now();
        const isDoubleTap = now - lastReelsTapTsRef.current <= 450;
        lastReelsTapTsRef.current = now;

        window.dispatchEvent(
          new CustomEvent("app:reels-nav-tap", {
            detail: { doubleTap: isDoubleTap },
          }),
        );

        if (isDoubleTap) {
          triggerRefresh?.();
          return;
        }

        return;
      }

      if (
        item.path === "/search" &&
        (location.pathname === "/search" ||
          location.pathname.startsWith("/search/"))
      ) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (location.pathname === "/" && item.path !== "/") {
        persistMainPageScrollState(window.scrollY || window.pageYOffset || 0);
      }

      if (item.path === "/search") {
        navigate("/search", {
          state: { from: `${location.pathname}${location.search}` },
        });
        return;
      }

      navigate(item.path);
    },
    [location.pathname, navigate, triggerRefresh],
  );

  /**
   * Shell chrome in `sx` only — surface colors live on inline `style` so RTL (ar/ku) does not
   * transform gradients (same pattern as `NavigationBar` AppBar + theme MuiAppBar note).
   */
  const bottomNavSafeAreaPb = "env(safe-area-inset-bottom, 0px)";
  const bottomNavShellBg = getNavShellBackground(
    location.pathname,
    isDark,
    isDark ? "#0b1220" : "#ffffff",
  );

  const glassNavSx = useMemo(
    () => ({
      display: "flex",
      width: "100%",
      maxWidth: "100%",
      minHeight: 64,
      maxHeight: "none",
      borderRadius: 0,
      alignItems: "stretch",
      overflow: "hidden",
      position: "relative",
      boxSizing: "border-box",
      paddingBottom: bottomNavSafeAreaPb,
      ...(isDark
        ? {
            backdropFilter: "blur(22px) saturate(170%)",
            WebkitBackdropFilter: "blur(22px) saturate(170%)",
            borderTop: getBottomNavBorderTop(location.pathname, true),
            borderLeft: "none",
            borderRight: "none",
            borderBottom: "none",
            boxShadow: isAndroidPerfMode
              ? "0 -2px 10px rgba(0,0,0,0.35)"
              : "0 -12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
          }
        : {
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            borderTop: getBottomNavBorderTop(location.pathname, false),
            borderLeft: "none",
            borderRight: "none",
            borderBottom: "none",
            boxShadow: isAndroidPerfMode
              ? "0 -2px 10px rgba(0,0,0,0.08)"
              : "0 -8px 30px rgba(0,0,0,0.12)",
          }),
    }),
    [isDark, isAndroidPerfMode, bottomNavSafeAreaPb, location.pathname],
  );

  const bottomNavSurfaceStyle = useMemo(
    () =>
      resolveBottomNavSurfaceStyle(location.pathname, isDark, {
        darkDefault: BOTTOM_NAV_DARK_GLASS,
        lightDefault: "rgba(255,255,255,0.98)",
      }),
    [isDark, location.pathname],
  );

  const inactiveIconColor = getBottomNavInactiveIconColor(
    isDark,
    location.pathname,
  );

  /** Equal columns + clip: stops active label/pill painting over neighbor icons. */
  const tabBtnBaseSx = {
    flex: "1 1 0",
    minWidth: 0,
    maxWidth: "100%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    bgcolor: "transparent",
    cursor: "pointer",
    p: 0,
    borderRadius: 9999,
    position: "relative",
    zIndex: 1,
    WebkitTapHighlightColor: "transparent",
    outline: "none",
    "&:focus": {
      outline: "none",
    },
    "&:focus:not(:focus-visible)": {
      outline: "none",
      backgroundColor: "transparent",
    },
    "&:focus-visible": {
      outline: "2px solid rgba(251, 146, 60, 0.95)",
      outlineOffset: 2,
    },
  };

  if (!isMobile || isSearchPage) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        zIndex: 1000,
        pointerEvents: "none",
        transform:
          keyboardInset > 0 ? `translateY(${keyboardInset}px)` : undefined,
        willChange: keyboardInset > 0 ? "transform" : undefined,
        boxSizing: "border-box",
        bgcolor: bottomNavShellBg,
      }}
    >
      <Box
        sx={{
          pointerEvents: "auto",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <LayoutGroup
          id={useLayoutAnimations ? "floating-bottom-nav" : undefined}
        >
          <Box component="nav" sx={glassNavSx} style={bottomNavSurfaceStyle}>
            {isDark ? (
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 42%)",
                }}
              />
            ) : null}
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                width: "100%",
                minWidth: 0,
                alignItems: "stretch",
                gap: isTemplate3 ? { xs: 0.25, sm: 0.75 } : { xs: 1.5, sm: 2 },
                px: isTemplate3 ? { xs: 0.5, sm: 1.5 } : { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.125 },
                boxSizing: "border-box",
              }}
            >
              {navItems.map((item, idx) => {
                if (!item) {
                  return (
                    <Box
                      key={`empty-${idx}`}
                      aria-hidden
                      sx={{ flex: 1, minWidth: 0, opacity: 0 }}
                    />
                  );
                }

                const Icon = item.Icon;
                const isRouteTab = !item.kind;
                const routeActive =
                  isRouteTab &&
                  activeValue !== false &&
                  activeValue === item.path;
                const activeTabStyle = getBottomNavActiveTabStyle(item.path, {
                  compact: isTemplate3 || isAndroidPerfMode,
                  isDark,
                  pathname: location.pathname,
                });

                if (showAllLabels) {
                  const logoActive =
                    item.kind === "logo" &&
                    activeValue !== false &&
                    activeValue === "/";
                  const isActive = routeActive || logoActive;
                  const tabKey = item.kind ? `${item.path}-${idx}` : item.path;

                  const handleAlwaysLabelClick = (event) => {
                    if (item.kind === "city") {
                      setCityMenuAnchor(event.currentTarget);
                      return;
                    }
                    if (item.kind === "language") {
                      setLangMenuAnchor(event.currentTarget);
                      return;
                    }
                    if (item.kind === "notifications") {
                      blurThen(() => openNotifications())(event);
                      return;
                    }
                    if (item.kind === "draftCart") {
                      blurThen(() => openDraftCart())(event);
                      return;
                    }
                    if (item.kind === "profile") {
                      blurThen(() => openProfile())(event);
                      return;
                    }
                    if (item.kind === "refresh") {
                      handleBottomNavRefresh();
                      return;
                    }
                    if (item.kind === "logo") {
                      handleRouteNavigate({ path: "/" });
                      return;
                    }
                    handleRouteNavigate(item);
                  };

                  return (
                    <MotionBox
                      key={tabKey}
                      component="button"
                      type="button"
                      aria-current={isActive ? "page" : undefined}
                      aria-label={item.name}
                      onPointerEnter={
                        item.path === "/search"
                          ? () => prefetchSearchPageChunk()
                          : undefined
                      }
                      onClick={handleAlwaysLabelClick}
                      whileTap={
                        useLayoutAnimations ? { scale: 0.94 } : undefined
                      }
                      sx={{
                        ...tabBtnBaseSx,
                        flex: "1 1 0%",
                        borderRadius: isTemplate3 ? "14px" : 9999,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 0.35,
                          width: "100%",
                          py: 0.7,
                          px: 0.5,
                          borderRadius: isTemplate3 ? "14px" : 9999,
                          background: isActive
                            ? activeTabStyle.background
                            : "transparent",
                          boxShadow: isActive ? activeTabStyle.boxShadow : "none",
                          transition:
                            "background 200ms ease, box-shadow 200ms ease",
                        }}
                      >
                        {item.kind === "logo" ? (
                          <Box
                            component="img"
                            src={`${import.meta.env.BASE_URL}logo512.png`}
                            alt={item.name}
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: 1.1,
                              objectFit: "cover",
                              border: isActive
                                ? "2px solid #ffffff"
                                : "2px solid transparent",
                              boxSizing: "border-box",
                            }}
                          />
                        ) : item.kind === "notifications" ? (
                          <Badge badgeContent={unreadCount} color="error">
                            <Icon
                              size={22}
                              color={isActive ? "#ffffff" : inactiveIconColor}
                              strokeWidth={
                                isActive
                                  ? NAV_ICON_STROKE.active
                                  : NAV_ICON_STROKE.idle
                              }
                            />
                          </Badge>
                        ) : (
                          <Icon
                            size={22}
                            color={isActive ? "#ffffff" : inactiveIconColor}
                            strokeWidth={
                              isActive
                                ? NAV_ICON_STROKE.active
                                : NAV_ICON_STROKE.idle
                            }
                          />
                        )}
                        <Typography
                          component="span"
                          sx={{
                            fontSize: "0.66rem",
                            fontWeight: isActive ? 800 : 600,
                            lineHeight: 1.2,
                            color: isActive ? "#ffffff" : inactiveIconColor,
                            whiteSpace: "nowrap",
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.name || item.path}
                        </Typography>
                      </Box>
                    </MotionBox>
                  );
                }

                if (item.kind === "logo") {
                  const logoActive =
                    activeValue !== false && activeValue === "/";
                  return (
                    <MotionBox
                      key={`${item.path}-${idx}`}
                      component="button"
                      type="button"
                      aria-current={logoActive ? "page" : undefined}
                      aria-label={item.name}
                      onClick={() => handleRouteNavigate({ path: "/" })}
                      whileTap={
                        useLayoutAnimations ? { scale: 0.94 } : undefined
                      }
                      whileHover={
                        useLayoutAnimations ? { scale: 1.06 } : undefined
                      }
                      sx={{
                        ...tabBtnBaseSx,
                        color: inactiveIconColor,
                      }}
                    >
                      <Box
                        component="img"
                        src={`${import.meta.env.BASE_URL}logo512.png`}
                        alt={item.name}
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: 1.25,
                          objectFit: "cover",
                          border: logoActive
                            ? "2px solid rgba(251, 146, 60, 0.95)"
                            : "2px solid transparent",
                          boxSizing: "border-box",
                        }}
                      />
                    </MotionBox>
                  );
                }

                if (item.kind === "city") {
                  return (
                    <MotionBox
                      key={`${item.path}-${idx}`}
                      component="button"
                      type="button"
                      aria-label={item.name}
                      onClick={(e) => setCityMenuAnchor(e.currentTarget)}
                      whileTap={
                        useLayoutAnimations ? { scale: 0.94 } : undefined
                      }
                      whileHover={
                        useLayoutAnimations ? { scale: 1.06 } : undefined
                      }
                      sx={{
                        ...tabBtnBaseSx,
                        color: inactiveIconColor,
                      }}
                    >
                      <Icon
                        size={NAV_ICON_SIZE}
                        color="currentColor"
                        strokeWidth={NAV_ICON_STROKE.idle}
                      />
                    </MotionBox>
                  );
                }

                if (item.kind === "language") {
                  return (
                    <MotionBox
                      key={`${item.path}-${idx}`}
                      component="button"
                      type="button"
                      aria-label={item.name}
                      onClick={(e) => setLangMenuAnchor(e.currentTarget)}
                      whileTap={
                        useLayoutAnimations ? { scale: 0.94 } : undefined
                      }
                      whileHover={
                        useLayoutAnimations ? { scale: 1.06 } : undefined
                      }
                      sx={{
                        ...tabBtnBaseSx,
                        color: inactiveIconColor,
                      }}
                    >
                      <Icon
                        size={NAV_ICON_SIZE}
                        color="currentColor"
                        strokeWidth={NAV_ICON_STROKE.idle}
                      />
                    </MotionBox>
                  );
                }

                if (item.kind === "notifications") {
                  return (
                    <MotionBox
                      key={`${item.path}-${idx}`}
                      component="button"
                      type="button"
                      aria-label={item.name}
                      onClick={blurThen(() => openNotifications())}
                      whileTap={
                        useLayoutAnimations ? { scale: 0.94 } : undefined
                      }
                      whileHover={
                        useLayoutAnimations ? { scale: 1.06 } : undefined
                      }
                      sx={{
                        ...tabBtnBaseSx,
                        color: inactiveIconColor,
                      }}
                    >
                      <Badge badgeContent={unreadCount} color="error">
                        <Icon
                          size={NAV_ICON_SIZE}
                          color="currentColor"
                          strokeWidth={NAV_ICON_STROKE.idle}
                        />
                      </Badge>
                    </MotionBox>
                  );
                }

                if (item.kind === "draftCart") {
                  return (
                    <MotionBox
                      key={`${item.path}-${idx}`}
                      component="button"
                      type="button"
                      aria-label={item.name}
                      onClick={blurThen(() => openDraftCart())}
                      whileTap={
                        useLayoutAnimations ? { scale: 0.94 } : undefined
                      }
                      whileHover={
                        useLayoutAnimations ? { scale: 1.06 } : undefined
                      }
                      sx={{
                        ...tabBtnBaseSx,
                        color: inactiveIconColor,
                      }}
                    >
                      <Icon
                        size={NAV_ICON_SIZE}
                        color="currentColor"
                        strokeWidth={NAV_ICON_STROKE.idle}
                      />
                    </MotionBox>
                  );
                }

                if (item.kind === "profile") {
                  return (
                    <MotionBox
                      key={`${item.path}-${idx}`}
                      component="button"
                      type="button"
                      aria-label={item.name}
                      onClick={blurThen(() => openProfile())}
                      whileTap={
                        useLayoutAnimations ? { scale: 0.94 } : undefined
                      }
                      whileHover={
                        useLayoutAnimations ? { scale: 1.06 } : undefined
                      }
                      sx={{
                        ...tabBtnBaseSx,
                        color: inactiveIconColor,
                      }}
                    >
                      <Icon
                        size={NAV_ICON_SIZE}
                        color="currentColor"
                        strokeWidth={NAV_ICON_STROKE.idle}
                      />
                    </MotionBox>
                  );
                }

                if (item.kind === "refresh") {
                  return (
                    <MotionBox
                      key={`${item.path}-${idx}`}
                      component="button"
                      type="button"
                      aria-label={item.name}
                      onClick={handleBottomNavRefresh}
                      whileTap={
                        useLayoutAnimations ? { scale: 0.94 } : undefined
                      }
                      whileHover={
                        useLayoutAnimations ? { scale: 1.06 } : undefined
                      }
                      sx={{
                        ...tabBtnBaseSx,
                        color: inactiveIconColor,
                      }}
                    >
                      <Icon
                        size={NAV_ICON_SIZE}
                        color="currentColor"
                        strokeWidth={NAV_ICON_STROKE.idle}
                      />
                    </MotionBox>
                  );
                }

                return (
                  <MotionBox
                    key={item.path}
                    component="button"
                    type="button"
                    aria-current={routeActive ? "page" : undefined}
                    aria-label={item.name}
                    onPointerEnter={
                      item.path === "/search"
                        ? () => prefetchSearchPageChunk()
                        : undefined
                    }
                    onClick={() => handleRouteNavigate(item)}
                    whileTap={useLayoutAnimations ? { scale: 0.94 } : undefined}
                    whileHover={
                      !useLayoutAnimations
                        ? undefined
                        : routeActive
                          ? { scale: 1.02 }
                          : { scale: 1.06 }
                    }
                    sx={{
                      ...tabBtnBaseSx,
                      // Active tab gets extra horizontal space for the label.
                      flex: routeActive ? "2.75 1 0%" : "1 1 0%",
                      zIndex: routeActive ? 2 : 1,
                    }}
                  >
                    {/* Framer `layoutId` morphs this pill between route tabs. */}
                    <Box
                      sx={{
                        position: "relative",
                        display: "flex",
                        width: "100%",
                        maxWidth: "100%",
                        minWidth: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 9999,
                        py: 0.75,
                        px: routeActive ? 1.5 : 0.5,
                        boxSizing: "border-box",
                        overflow: "hidden",
                        isolation: "isolate",
                      }}
                    >
                      {routeActive && (
                        <motion.div
                          layoutId={
                            useLayoutAnimations
                              ? "bottom-nav-active-pill"
                              : undefined
                          }
                          transition={pillTransition}
                          style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 0,
                            borderRadius: 9999,
                            background: activeTabStyle.background,
                            boxShadow: activeTabStyle.boxShadow,
                            willChange: "transform",
                            pointerEvents: "none",
                          }}
                        />
                      )}
                      <Box
                        component="span"
                        sx={{
                          position: "relative",
                          zIndex: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "row",
                          flexWrap: "nowrap",
                          gap: routeActive ? 1.125 : 0.5,
                          minWidth: 0,
                          width: "100%",
                          maxWidth: "100%",
                          px: routeActive ? 0 : 0,
                        }}
                      >
                        <Icon
                          size={NAV_ICON_SIZE}
                          color={routeActive ? "#ffffff" : inactiveIconColor}
                          strokeWidth={
                            routeActive
                              ? NAV_ICON_STROKE.active
                              : NAV_ICON_STROKE.idle
                          }
                          style={{ flexShrink: 0 }}
                        />
                        {routeActive && (
                          <Typography
                            component="span"
                            sx={{
                              flex: "1 1 auto",
                              minWidth: 0,
                              fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                              fontWeight: 650,
                              lineHeight: 1.35,
                              letterSpacing: "0.02em",
                              color: "#ffffff !important",
                              textAlign: "start",
                              overflowWrap: "anywhere",
                              wordBreak: "break-word",
                              hyphens: "auto",
                              whiteSpace: "normal",
                            }}
                          >
                            {item.name || item.path}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </MotionBox>
                );
              })}
            </Box>
          </Box>
        </LayoutGroup>
      </Box>

      <Menu
        anchorEl={cityMenuAnchor}
        open={Boolean(cityMenuAnchor)}
        onClose={() => setCityMenuAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        PaperProps={{
          sx: { mb: 1, minWidth: 200, maxHeight: 320 },
        }}
      >
        {cities.map((city) => (
          <MenuItem
            key={city.value}
            selected={selectedCity === city.value}
            onClick={() => {
              changeCity(city.value);
              setCityMenuAnchor(null);
            }}
          >
            {city.label}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={langMenuAnchor}
        open={Boolean(langMenuAnchor)}
        onClose={() => setLangMenuAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        PaperProps={{
          sx: { mb: 1, minWidth: 200 },
        }}
      >
        <MenuItem
          selected={i18n.language === "en"}
          onClick={() => {
            i18n.changeLanguage("en");
            setLangMenuAnchor(null);
          }}
        >
          🇺🇸 {t("English")}
        </MenuItem>
        <MenuItem
          selected={i18n.language === "ar"}
          onClick={() => {
            i18n.changeLanguage("ar");
            setLangMenuAnchor(null);
          }}
        >
          🇸🇦 {t("Arabic")}
        </MenuItem>
        <MenuItem
          selected={i18n.language === "ku"}
          onClick={() => {
            i18n.changeLanguage("ku");
            setLangMenuAnchor(null);
          }}
        >
          <Box
            component="span"
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <Box
              component="img"
              src={kurdishFlag}
              alt="Kurdish"
              sx={{
                width: 16,
                height: 12,
                objectFit: "cover",
                borderRadius: 0.5,
              }}
            />
            {t("Kurdish")}
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default BottomNavigationBar;
