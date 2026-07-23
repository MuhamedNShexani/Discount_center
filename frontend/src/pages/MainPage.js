import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Typography,
  Button,
  Box,
  Chip,
  Alert,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Skeleton,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { storeTypeAPI, appAPI } from "../services/api";
import {
  fetchMainPageFullBundle,
  mainPageQueryKeys,
} from "../queries/mainPageQueries";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BusinessIcon from "@mui/icons-material/Business";
import CategoryIcon from "@mui/icons-material/Category";
import SearchIcon from "@mui/icons-material/Search";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StarIcon from "@mui/icons-material/Star";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Loader from "../components/Loader";
import ApiConnectionErrorPanel from "../components/ApiConnectionErrorPanel";
import BrandShowcase from "../components/BrandShowcase";
import ProductDetailDialog from "../components/ProductDetailDialog";
import CompanyShowcase from "../components/CompanyShowcase";
import StoreShowcase from "../components/StoreShowcase";
import GiftShowcase from "../components/GiftShowcase";
import SpecialOffersBanner from "../components/SpecialOffersBanner";
import FindJobShowcase from "../components/FindJobShowcase";
import AllProductsDiscountShowcase from "../components/AllProductsDiscountShowcase";
import HomeReelsSection from "../components/reels/HomeReelsSection";
import BannerCarousel from "../components/BannerCarousel";
import FilterChips from "../components/FilterChips";
import StoreTypesBrowseSection from "../components/StoreTypesBrowseSection";
import StoreGroupSection from "../components/StoreGroupSection";
import FlashDealsSection from "../components/FlashDealsSection";
import { Virtuoso } from "react-virtuoso";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useUserTracking } from "../hooks/useUserTracking";
import { useCityFilter } from "../context/CityFilterContext";
import useIsMobileLayout from "../hooks/useIsMobileLayout";
import {
  MOBILE_NAV_OFFSET_SX,
  MOBILE_NAV_SCROLL_MARGIN_SX,
} from "../hooks/useMobileHeaderLayout";
import { resolveMediaUrl } from "../utils/mediaUrl";
import {
  isExpiryStillValid,
  getExpiryRemainingInfo,
  formatExpiryChipLabel,
  expiryChipBg,
  formatExpiryDateDdMmYyyy,
} from "../utils/expiryDate";
import { useLocalizedContent } from "../hooks/useLocalizedContent";
import { useContentRefresh } from "../context/ContentRefreshContext";
import { readMainPageCache, writeMainPageCache } from "../utils/mainPageCache";
import useOnlineStatus from "../hooks/useOnlineStatus";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { resolveConnectionFailure } from "../utils/apiError";
import { formatPriceDigits } from "../utils/formatPriceNumber";
import {
  isFlutterApp as isFlutterLocationApp,
  openLocationSettings,
  requestCurrentLocation,
  LocationPermissionError,
} from "../utils/deviceLocation";
import { storeMatchesSelectedCity } from "../utils/cityMatch";
import {
  logSearchEvent,
  recordSearchClick,
} from "../utils/searchAnalyticsTrack";
import {
  MAIN_PAGE_SCROLL_KEY,
  MAIN_PAGE_SCROLL_STATE_KEY,
  resetMainPageScrollPositionInSession,
} from "../utils/mainPageScrollSession";
import {
  getSavedProductLayout,
  saveProductLayout,
} from "../utils/productLayoutPreference";
import { isAndroidPerformanceMode } from "../utils/androidPerformance";

/** Apply scroll position (some WebViews need documentElement/body as well as window). */
function applyWindowScrollY(y) {
  const top = Math.max(0, Number(y) || 0);
  try {
    window.scrollTo({ top, left: 0, behavior: "auto" });
  } catch {
    window.scrollTo(0, top);
  }
  try {
    if (document.documentElement) document.documentElement.scrollTop = top;
    if (document.body) document.body.scrollTop = top;
  } catch {
    // ignore
  }
}

/**
 * True when this document was loaded via a full refresh (F5).
 * Note: this stays "reload" for the entire SPA lifetime after one refresh, so
 * MainPage must only act on it once per document load — not on every remount when
 * returning to Home via client-side routing.
 */
function isBrowserReloadNavigation() {
  if (typeof performance === "undefined") return false;
  try {
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    if (nav && nav.type === "reload") return true;
  } catch {
    /* ignore */
  }
  try {
    // Legacy; still used in some embedded WebViews
    if (performance.navigation?.type === 1) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** After first consumption, ignore "reload" for scroll policy so Home → away → Home restores scroll. */
let mainPageReloadScrollResetConsumed = false;

/** Sentinel id for category chip: products with no categoryId */
const UNCATEGORIZED_CATEGORY_ID = "__uncategorized__";

/**
 * Normalized category id for filters, or null when the product has no category.
 * Avoids bad comparisons when categoryId is missing, null, or populated.
 */
function productCategoryIdString(product, getID) {
  const raw = getID(product?.categoryId ?? product?.category);
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s || s === "undefined" || s === "null") return null;
  return s;
}

function productHasActiveDiscount(product, isDiscountValid) {
  const hasPriceDiscount =
    product.previousPrice &&
    product.newPrice &&
    product.previousPrice > product.newPrice;
  const isDiscounted = product.isDiscount || hasPriceDiscount;
  return isDiscounted && isDiscountValid(product);
}

function groupProductsByStoreId(products, getID) {
  const map = new Map();
  for (const product of products) {
    const sid = getID(product.storeId);
    if (sid == null || sid === "") continue;
    const key = String(sid);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(product);
  }
  return map;
}

/** Prefer discounted products per store; fall back to undiscounted when a store has none. */
function mergeProductsByStoreWithDiscountFallback(
  discountedByStore,
  baseByStore,
) {
  const merged = new Map();
  const storeIds = new Set([
    ...discountedByStore.keys(),
    ...baseByStore.keys(),
  ]);
  for (const storeId of storeIds) {
    const discounted = discountedByStore.get(storeId) ?? [];
    const base = baseByStore.get(storeId) ?? [];
    const products = discounted.length > 0 ? discounted : base;
    if (products.length > 0) merged.set(storeId, products);
  }
  return merged;
}

function flattenProductsByStore(map) {
  const out = [];
  for (const products of map.values()) out.push(...products);
  return out;
}

const MainPage = () => {
  const theme = useTheme();
  const isMobile = useIsMobileLayout();
  const isAndroidPerfMode = useMemo(() => isAndroidPerformanceMode(), []);
  const navigate = useNavigate();
  const { locName, locDescription } = useLocalizedContent();
  const { refreshKey } = useContentRefresh();
  /** Same in-memory snapshot as useLayoutEffect hydrate — applied on first render so return navigation paints the feed + scroll restore immediately (no skeleton-at-top flash). */
  const [mainPageBootstrapPayload] = useState(() =>
    readMainPageCache(refreshKey),
  );
  const [stores, setStores] = useState(
    () => mainPageBootstrapPayload?.stores ?? [],
  );
  const [allProducts, setAllProducts] = useState(
    () => mainPageBootstrapPayload?.allProducts ?? [],
  );
  const [, setProductsByStore] = useState(
    () => mainPageBootstrapPayload?.productsByStore ?? {},
  );

  const [loading, setLoading] = useState(
    () => mainPageBootstrapPayload == null,
  );
  const [loadError, setLoadError] = useState(null);
  const loadStartedAtRef = useRef(0);
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState(null);
  const [storeTypes, setStoreTypes] = useState(
    () => mainPageBootstrapPayload?.storeTypes ?? [],
  );
  const [selectedStoreTypeId, setSelectedStoreTypeId] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [allCategories, setAllCategories] = useState(
    () => mainPageBootstrapPayload?.allCategories ?? [],
  );
  const [brands, setBrands] = useState(
    () => mainPageBootstrapPayload?.brands ?? [],
  );
  const [companies, setCompanies] = useState(
    () => mainPageBootstrapPayload?.companies ?? [],
  );
  const [gifts, setGifts] = useState(
    () => mainPageBootstrapPayload?.gifts ?? [],
  );
  const [jobs, setJobs] = useState(() => mainPageBootstrapPayload?.jobs ?? []);
  const [showcaseDiscountStores, setShowcaseDiscountStores] = useState(
    () => mainPageBootstrapPayload?.showcaseDiscountStores ?? [],
  );

  // Notification dialog state
  const [loginNotificationOpen, setLoginNotificationOpen] = useState(false);
  const [loginNotificationReason] = useState("like");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  // Filter toggle state for mobile
  const [filtersOpen] = useState(false);

  // Scroll to top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Stores pagination state
  const [displayedStores, setDisplayedStores] = useState([]);
  const [, setStoresPage] = useState(1);
  const [storesPerPage] = useState(8);
  const [hasMoreStores, setHasMoreStores] = useState(true);
  const [sortByNewestDiscount, setSortByNewestDiscount] = useState(false);
  const [sortByNearMe, setSortByNearMe] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  /** @type {[null|"permissionDenied"|"permissionDeniedForever"|string, Function]} */
  const [geoError, setGeoError] = useState(null);
  const [productLayout, setProductLayoutState] = useState(() =>
    getSavedProductLayout(),
  );
  const setProductLayout = useCallback((layout) => {
    setProductLayoutState(layout);
    saveProductLayout(layout);
  }, []);

  // Cache random store selections for rotating showcases (stable during renders).
  const randomShowcaseStoresRef = useRef({});
  const loadMoreSentinelRef = useRef(null);
  const loadMoreStoresRef = useRef(() => {});
  const mainPageSearchLogIdRef = useRef(null);
  /** Scroll target: banner hero (below fixed nav) — not the search row. */
  const mainPageFeedTopRef = useRef(null);

  // User tracking hook (user = device user for guests)
  const {
    toggleLike,
    toggleFollowStore,
    isProductLiked,
    isStoreFollowed,
    isAuthenticated,
    user,
    recordView,
  } = useUserTracking();

  // City filter hook
  const { selectedCity } = useCityFilter();
  const queryClient = useQueryClient();

  /** On mobile, paint banner + filters + first store rows before Flash Deals / Jobs (idle). */
  const [mobileDeferredSectionsReady, setMobileDeferredSectionsReady] =
    useState(() => !isMobile);

  // State for tracking like counts locally
  const [likeCounts, setLikeCounts] = useState(
    () => mainPageBootstrapPayload?.likeCounts ?? {},
  );
  const [likeStates, setLikeStates] = useState(
    () => mainPageBootstrapPayload?.likeStates ?? {},
  ); // Track like state per product
  const likeCountsRef = useRef({});
  const likeStatesRef = useRef({});
  likeCountsRef.current = likeCounts;
  likeStatesRef.current = likeStates;
  const [likeLoading, setLikeLoading] = useState({}); // Track loading state per product
  const likeLoadingRef = useRef({});
  likeLoadingRef.current = likeLoading;
  const [followLoading, setFollowLoading] = useState({}); // Track follow state per store
  const followLoadingRef = useRef({});
  followLoadingRef.current = followLoading;
  const mainPageScrollRestoredRef = useRef(false);
  const displayedStoresCountRef = useRef(0);
  const skipInitialSilentRefreshRef = useRef(false);
  const lastScrollPersistRef = useRef({ y: 0, at: 0 });
  /** Last window scrollY (always updated) so unmount save is correct when layout collapses before useEffect. */
  const lastKnownScrollYRef = useRef(0);

  useLayoutEffect(() => {
    return () => {
      try {
        const winY = Math.max(
          lastKnownScrollYRef.current || 0,
          window.scrollY || 0,
          window.pageYOffset || 0,
        );
        let y = winY;
        // After route change the window can read 0 before paint; keep the last deep scroll.
        try {
          const raw = sessionStorage.getItem(MAIN_PAGE_SCROLL_STATE_KEY);
          if (raw) {
            const prevY = Number(JSON.parse(raw).y);
            if (Number.isFinite(prevY) && prevY > 24 && y < 16) y = prevY;
          }
          if (y < 16) {
            const plain = sessionStorage.getItem(MAIN_PAGE_SCROLL_KEY);
            const py = plain != null ? Number(plain) : NaN;
            if (Number.isFinite(py) && py > 24) y = Math.max(y, py);
          }
        } catch {
          /* ignore */
        }
        sessionStorage.setItem(MAIN_PAGE_SCROLL_KEY, String(y));
        sessionStorage.setItem(
          MAIN_PAGE_SCROLL_STATE_KEY,
          JSON.stringify({
            y,
            displayedCount: displayedStoresCountRef.current,
          }),
        );
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    displayedStoresCountRef.current = displayedStores.length;
  }, [displayedStores.length]);

  // Handle like button click (works for both logged-in and guest/device users)
  const handleLikeClick = useCallback(
    async (productId, e) => {
      e.preventDefault();
      e.stopPropagation();

      if (likeLoadingRef.current[productId]) {
        return;
      }

      const currentLikeCount = likeCountsRef.current[productId] || 0;
      const isCurrentlyLiked =
        likeStatesRef.current[productId] || isProductLiked(productId);

      setLikeLoading((prev) => ({ ...prev, [productId]: true }));

      try {
        if (isCurrentlyLiked) {
          setLikeCounts((prev) => ({
            ...prev,
            [productId]: Math.max(0, currentLikeCount - 1),
          }));
          setLikeStates((prev) => ({
            ...prev,
            [productId]: false,
          }));
        } else {
          setLikeCounts((prev) => ({
            ...prev,
            [productId]: currentLikeCount + 1,
          }));
          setLikeStates((prev) => ({
            ...prev,
            [productId]: true,
          }));
        }

        const result = await toggleLike(productId);

        if (!result.success) {
          setLikeCounts((prev) => ({
            ...prev,
            [productId]: currentLikeCount,
          }));
          setLikeStates((prev) => ({
            ...prev,
            [productId]: isCurrentlyLiked,
          }));
          alert(result.message || "Failed to update like");
        }
      } catch (error) {
        setLikeCounts((prev) => ({
          ...prev,
          [productId]: currentLikeCount,
        }));
        setLikeStates((prev) => ({
          ...prev,
          [productId]: isCurrentlyLiked,
        }));
        alert("Failed to update like");
      } finally {
        setLikeLoading((prev) => ({ ...prev, [productId]: false }));
      }
    },
    [isProductLiked, toggleLike],
  );

  const handleFollowClick = useCallback(
    async (storeId, e) => {
      e.preventDefault();
      e.stopPropagation();
      if (followLoadingRef.current[storeId]) return;
      setFollowLoading((prev) => ({ ...prev, [storeId]: true }));
      try {
        const result = await toggleFollowStore(storeId);
        if (!result.success) {
          alert(result.message || "Failed to update follow");
        }
      } finally {
        setFollowLoading((prev) => ({ ...prev, [storeId]: false }));
      }
    },
    [toggleFollowStore],
  );

  const handleProductClick = useCallback(
    (product) => {
      setSelectedProduct(product);
      setProductDialogOpen(true);
      if (mainPageSearchLogIdRef.current && product?._id) {
        recordSearchClick(
          mainPageSearchLogIdRef.current,
          String(product._id),
          "product",
        );
      }
      if (isAuthenticated) {
        recordView(product._id);
      }
    },
    [isAuthenticated, recordView],
  );

  const [bannerAds, setBannerAds] = useState(
    () => mainPageBootstrapPayload?.bannerAds ?? [],
  );
  const isOnline = useOnlineStatus();
  const { isInternetReachable } = useNetworkStatus();
  const reachabilityPrevRef = useRef(null);

  const bannerAdsWithImages = useMemo(
    () =>
      (bannerAds || [])
        .filter((a) => !!a.image)
        .map((a) => ({
          _id: a._id,
          src: resolveMediaUrl(a.image),
          brandId: a.brandId,
          storeId: a.storeId,
          giftId: a.giftId,
        })),
    [bannerAds],
  );

  const applyMainPagePayload = useCallback((payload) => {
    setStores(payload.stores);
    setAllCategories(payload.allCategories);
    setAllProducts(payload.allProducts);
    setStoreTypes(payload.storeTypes);
    setBrands(payload.brands);
    setCompanies(payload.companies || []);
    setGifts(payload.gifts);
    setJobs(payload.jobs);
    setShowcaseDiscountStores(payload.showcaseDiscountStores || []);
    setProductsByStore(payload.productsByStore);
    setLikeCounts(payload.likeCounts);
    setLikeStates(payload.likeStates);
    setBannerAds(payload.bannerAds);
  }, []);

  const fetchData = useCallback(
    async ({ silent = false } = {}) => {
      loadStartedAtRef.current = Date.now();
      try {
        if (!silent) setLoading(true);
        setLoadError(null);
        const fullPayload = await fetchMainPageFullBundle({
          refreshKey,
          queryClient,
          onPhase1Payload: (partial) => {
            applyMainPagePayload(partial);
            if (!silent) setLoading(false);
          },
        });
        applyMainPagePayload(fullPayload);
      } catch (err) {
        const elapsed = Date.now() - loadStartedAtRef.current;
        const pad = Math.max(0, 480 - elapsed);
        await new Promise((r) => setTimeout(r, pad));
        try {
          const { variant } = await resolveConnectionFailure(err);
          const v = variant === "client" ? "generic" : variant;
          setLoadError({ variant: v });
        } catch {
          setLoadError({ variant: "generic" });
        }
        console.error("Error fetching data:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [refreshKey, applyMainPagePayload, queryClient],
  );

  /** When connectivity returns, retry home bundle and dismiss connection-related full-page errors. */
  useEffect(() => {
    const prev = reachabilityPrevRef.current;
    reachabilityPrevRef.current = isInternetReachable;
    if (prev !== false || isInternetReachable !== true) return;
    if (!loadError?.variant) return;
    const retryVariants = new Set([
      "offline",
      "backend",
      "dns",
      "timeout",
      "generic",
    ]);
    if (!retryVariants.has(loadError.variant)) return;

    let cancelled = false;
    void (async () => {
      try {
        await fetchData({ silent: true });
        if (!cancelled) setLoadError(null);
      } catch {
        /* fetchData sets loadError in catch */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isInternetReachable, loadError?.variant, fetchData]);

  useEffect(() => {
    if (!isMobile) {
      setMobileDeferredSectionsReady(true);
      return undefined;
    }
    if (loading) {
      setMobileDeferredSectionsReady(false);
      return undefined;
    }
    const schedule =
      typeof window.requestIdleCallback === "function"
        ? (cb) => window.requestIdleCallback(cb, { timeout: 2200 })
        : (cb) => window.setTimeout(cb, 320);
    const id = schedule(() => setMobileDeferredSectionsReady(true));
    return () => {
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(id);
      } else {
        window.clearTimeout(id);
      }
    };
  }, [isMobile, loading]);

  useLayoutEffect(() => {
    const cached = readMainPageCache(refreshKey);
    if (cached) {
      if (mainPageBootstrapPayload == null) {
        applyMainPagePayload(cached);
        setLoading(false);
      }
      queryClient.setQueryData(mainPageQueryKeys.hydrated(refreshKey), cached);
      setLoadError(null);
      // Skip the follow-up silent refetch whenever we hydrate from memory: refetch rebuilds
      // the payload and would change non‑VIP order (shuffle is reload-only) or fight scroll restore.
      skipInitialSilentRefreshRef.current = true;
    }
  }, [refreshKey, applyMainPagePayload, mainPageBootstrapPayload, queryClient]);

  /** Store-type visibility flags must stay fresh (browse carousel); main bundle cache can be stale. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await storeTypeAPI.getAll();
        if (cancelled) return;
        const nextStoreTypes = res.data || [];
        setStoreTypes(nextStoreTypes);
        const cached = readMainPageCache(refreshKey);
        if (cached) {
          writeMainPageCache(refreshKey, {
            ...cached,
            storeTypes: nextStoreTypes,
          });
        }
      } catch {
        /* keep cached / bundled store types */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  /** Store-wide discount offers (per-app %) must stay fresh for rotating showcase chips. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await appAPI.getShowcaseStores();
        if (cancelled) return;
        const nextShowcase = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        setShowcaseDiscountStores(nextShowcase);
        const cached = readMainPageCache(refreshKey);
        if (cached) {
          writeMainPageCache(refreshKey, {
            ...cached,
            showcaseDiscountStores: nextShowcase,
          });
        }
      } catch {
        /* keep cached showcase entries */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    const cached = readMainPageCache(refreshKey);
    if (cached) {
      if (skipInitialSilentRefreshRef.current) {
        skipInitialSilentRefreshRef.current = false;
      } else {
        fetchData({ silent: true });
      }
    } else {
      fetchData();
    }
  }, [refreshKey, fetchData]);

  const prevSelectedCityRef = useRef(null);
  useEffect(() => {
    if (prevSelectedCityRef.current === null) {
      prevSelectedCityRef.current = selectedCity;
      return;
    }
    if (prevSelectedCityRef.current !== selectedCity) {
      prevSelectedCityRef.current = selectedCity;
      fetchData({ silent: true });
    }
  }, [selectedCity, fetchData]);

  // Single window scroll handler: persist position and scroll-to-top FAB.
  useEffect(() => {
    let rafId = 0;

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const y = window.scrollY || window.pageYOffset || 0;
        lastKnownScrollYRef.current = y;

        const now = Date.now();
        const last = lastScrollPersistRef.current;
        const yDelta = Math.abs(y - last.y);
        if (now - last.at >= 250 || yDelta >= 12) {
          lastScrollPersistRef.current = { y, at: now };
          try {
            sessionStorage.setItem(MAIN_PAGE_SCROLL_KEY, String(y));
            sessionStorage.setItem(
              MAIN_PAGE_SCROLL_STATE_KEY,
              JSON.stringify({
                y,
                displayedCount: displayedStoresCountRef.current,
              }),
            );
          } catch {
            // ignore
          }
        }

        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const nextVisible = scrollTop > 600;
        setShowScrollTop((prev) => (prev === nextVisible ? prev : nextVisible));
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [isMobile]);

  /** Align to tabs + banner region; avoids landing on the search/filter row when window scroll is 0 but layout uses a tall header. */
  const scrollToMainFeedTop = useCallback((behavior = "smooth") => {
    const el = mainPageFeedTopRef.current;
    if (el) {
      el.scrollIntoView({ block: "start", behavior });
      return;
    }
    applyWindowScrollY(0);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    scrollToMainFeedTop("smooth");
  };

  // Update like states when user data changes (works for both logged-in and guest users)
  useEffect(() => {
    if ((isAuthenticated || user) && allProducts.length > 0) {
      const updatedLikeStates = {};
      allProducts.forEach((product) => {
        updatedLikeStates[product._id] = isProductLiked(product._id);
      });
      setLikeStates(updatedLikeStates);
    }
  }, [isAuthenticated, user, allProducts, isProductLiked]);

  const getID = useCallback((id) => {
    if (typeof id === "string") return id;
    if (id && typeof id === "object") {
      return id.$oid || String(id._id) || String(id);
    }
    return id;
  }, []);

  // Memoized list of categories based on the selected store type
  const filteredCategories = useMemo(() => {
    if (selectedStoreTypeId === "all") {
      return allCategories;
    }
    return allCategories.filter(
      (category) =>
        String(getID(category.storeTypeId)) === String(selectedStoreTypeId),
    );
  }, [allCategories, selectedStoreTypeId, getID]);

  // Memoized list of category types based on the selected category
  // const categoryTypes = useMemo(() => {
  //   if (!selectedCategory) {
  //     return [];
  //   }
  //   return selectedCategory.types || [];
  // }, [selectedCategory]);

  const handleStoreTypeChange = (storeTypeId) => {
    setSelectedStoreTypeId(storeTypeId === "all" ? "all" : String(storeTypeId));
    setSelectedCategory(null);
    setSelectedCategoryType(null);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedCategoryType(null);
  };

  // const handleCategoryTypeChange = (categoryType) => {
  //   setSelectedCategoryType(categoryType);
  // };

  const clearAllFilters = () => {
    setSearch("");
    setSelectedCategory(null);
    setSelectedCategoryType(null);
    setSelectedStoreTypeId("all");
    setPriceRange([0, 1000000]);
    setStoresPage(1);
  };

  const normalizeCity = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();
  const cityCanonicalMap = {
    erbil: "erbil",
    hawler: "erbil",
    hewler: "erbil",
    sulaimani: "sulaimani",
    sulaymaniyah: "sulaimani",
    sulaimany: "sulaimani",
    duhok: "duhok",
    dahuk: "duhok",
    kerkuk: "kerkuk",
    kirkuk: "kerkuk",
    halabja: "halabja",
    helebce: "halabja",
  };
  const toCanonicalCity = (value) => {
    const normalized = normalizeCity(value);
    return cityCanonicalMap[normalized] || normalized;
  };
  const selectedCityCanonical = toCanonicalCity(selectedCity);
  const normalizedSearch = useMemo(() => search.trim().toLowerCase(), [search]);
  const doesCityMatch = (candidateCity) =>
    toCanonicalCity(candidateCity) === selectedCityCanonical;

  const extractLatLngFromText = (text) => {
    if (!text || typeof text !== "string") return null;
    const cleaned = text.trim();
    const patterns = [
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
      /[?&](?:q|ll|query|daddr|saddr)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
      /(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    ];
    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
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
    return null;
  };

  const getStoreCoordinates = (store) => {
    if (!store) return null;
    const locationInfo = store.locationInfo || {};
    return (
      extractLatLngFromText(locationInfo.googleMaps) ||
      extractLatLngFromText(locationInfo.appleMaps) ||
      extractLatLngFromText(locationInfo.waze)
    );
  };

  const toRad = (deg) => (deg * Math.PI) / 180;
  const getDistanceKm = (from, to) => {
    if (!from || !to) return Number.POSITIVE_INFINITY;
    const earthRadiusKm = 6371;
    const dLat = toRad(to.lat - from.lat);
    const dLng = toRad(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(from.lat)) *
        Math.cos(toRad(to.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  };

  // Helper function to check if a discounted product has expired
  const isDiscountValid = (product) => {
    if (!product.isDiscount) return false;

    // If no expiry date, discount is always valid
    if (!product.expireDate) return true;

    return isExpiryStillValid(product.expireDate);
  };

  const getCategoryTypeName = (categoryTypeId, categoryId) => {
    if (!categoryTypeId || !categoryId) return "N/A";
    const catId =
      typeof categoryId === "object"
        ? categoryId?._id || categoryId
        : categoryId;
    const category = allCategories.find(
      (c) => c._id === catId || c._id?.toString() === String(catId),
    );
    if (!category?.types) return "N/A";
    const type = category.types.find(
      (t) =>
        t._id?.toString() === String(categoryTypeId) ||
        t.name === categoryTypeId,
    );
    return type ? locName(type) || "N/A" : "N/A";
  };

  const storeIdsInCity = useMemo(
    () =>
      new Set(
        stores
          .filter((s) => storeMatchesSelectedCity(s, selectedCity))
          .map((s) => String(getID(s._id))),
      ),
    [stores, selectedCity],
  );

  const storeById = useMemo(() => {
    const m = {};
    stores.forEach((s) => {
      m[String(getID(s._id))] = s;
    });
    return m;
  }, [stores]);

  const closeProductDialog = useCallback(() => {
    setProductDialogOpen(false);
    setSelectedProduct(null);
  }, []);

  /**
   * Use parent store's store type first so it matches store-type chips (built from stores)
   * and the store list filter. Product.storeTypeId can be stale vs store.storeTypeId.
   */
  const effectiveProductStoreTypeId = (product) => {
    const store = storeById[String(getID(product?.storeId))];
    return getID(store?.storeTypeId ?? product?.storeTypeId);
  };

  const matchesMainPageProductFilters = useCallback(
    (product, { requireDiscount = false, forStoreTypeChips = false } = {}) => {
      if (!storeIdsInCity.has(String(getID(product.storeId)))) return false;

      if (!forStoreTypeChips) {
        if (
          selectedStoreTypeId !== "all" &&
          String(effectiveProductStoreTypeId(product)) !==
            String(selectedStoreTypeId)
        ) {
          return false;
        }

        if (selectedCategory) {
          const want = String(getID(selectedCategory._id));
          const have = productCategoryIdString(product, getID);
          if (want === UNCATEGORIZED_CATEGORY_ID) {
            if (have != null) return false;
          } else if (have !== want) {
            return false;
          }
        }

        if (
          selectedCategoryType &&
          getID(product.categoryTypeId) !== getID(selectedCategoryType._id)
        ) {
          return false;
        }
      }

      if (
        product.newPrice < priceRange[0] ||
        product.newPrice > priceRange[1]
      ) {
        return false;
      }

      if (
        requireDiscount &&
        !productHasActiveDiscount(product, isDiscountValid)
      ) {
        return false;
      }

      if (product.expireDate && !isExpiryStillValid(product.expireDate)) {
        return false;
      }

      if (!forStoreTypeChips && normalizedSearch) {
        const parentStore =
          storeById[String(getID(product.storeId))] || product.storeId;
        const productNameMatch = String(locName(product) || product.name || "")
          .toLowerCase()
          .includes(normalizedSearch);
        const storeNameMatch = String(
          locName(parentStore) || parentStore?.name || "",
        )
          .toLowerCase()
          .includes(normalizedSearch);

        if (!productNameMatch && !storeNameMatch) {
          return false;
        }
      }

      return true;
    },
    [
      storeIdsInCity,
      storeById,
      selectedStoreTypeId,
      selectedCategory,
      selectedCategoryType,
      priceRange,
      normalizedSearch,
      locName,
      getID,
    ],
  );

  const productsByStoreId = useMemo(() => {
    const discounted = allProducts.filter((product) =>
      matchesMainPageProductFilters(product, { requireDiscount: true }),
    );
    const base = allProducts.filter((product) =>
      matchesMainPageProductFilters(product, { requireDiscount: false }),
    );
    return mergeProductsByStoreWithDiscountFallback(
      groupProductsByStoreId(discounted, getID),
      groupProductsByStoreId(base, getID),
    );
  }, [allProducts, matchesMainPageProductFilters, getID]);

  const filteredProducts = useMemo(
    () => flattenProductsByStore(productsByStoreId),
    [productsByStoreId],
  );

  const discountedOnlyProducts = useMemo(
    () =>
      allProducts.filter((product) =>
        matchesMainPageProductFilters(product, { requireDiscount: true }),
      ),
    [allProducts, matchesMainPageProductFilters],
  );

  /**
   * Products used only to decide which store-type chips to show.
   * Ignores category and category-type; per-store discount fallback keeps types visible.
   */
  const filteredProductsForStoreTypeChips = useMemo(() => {
    const discounted = allProducts.filter((product) =>
      matchesMainPageProductFilters(product, {
        requireDiscount: true,
        forStoreTypeChips: true,
      }),
    );
    const base = allProducts.filter((product) =>
      matchesMainPageProductFilters(product, {
        requireDiscount: false,
        forStoreTypeChips: true,
      }),
    );
    return flattenProductsByStore(
      mergeProductsByStoreWithDiscountFallback(
        groupProductsByStoreId(discounted, getID),
        groupProductsByStoreId(base, getID),
      ),
    );
  }, [allProducts, matchesMainPageProductFilters, getID]);

  const finalFilteredStoresForStoreTypeChips = useMemo(() => {
    const storeIdsWithProducts = new Set(
      filteredProductsForStoreTypeChips.map((p) => String(getID(p.storeId))),
    );
    return stores.filter((store) => {
      const storeID = getID(store._id);
      const hasMatchingProducts = storeIdsWithProducts.has(String(storeID));
      const storeNameMatch =
        normalizedSearch &&
        store.name?.toLowerCase().includes(normalizedSearch);
      const cityMatch = storeMatchesSelectedCity(store, selectedCity);
      return (hasMatchingProducts || storeNameMatch) && cityMatch;
    });
  }, [
    filteredProductsForStoreTypeChips,
    stores,
    normalizedSearch,
    selectedCity,
  ]);

  const visibleStoreTypes = useMemo(() => {
    const ids = new Set(
      finalFilteredStoresForStoreTypeChips
        .map((s) => getID(s.storeTypeId))
        .filter(Boolean)
        .map((id) => String(id)),
    );
    return storeTypes.filter((st) => ids.has(String(getID(st._id))));
  }, [storeTypes, finalFilteredStoresForStoreTypeChips]);

  /** Products for category chips when a store type is selected (ignore category; respect city + store type). */
  const filteredProductsForCategoryChips = useMemo(() => {
    if (selectedStoreTypeId === "all") return [];
    const matchCategoryChipProduct = (product, requireDiscount) => {
      if (
        !storeIdsInCity.has(String(getID(product.storeId))) ||
        String(effectiveProductStoreTypeId(product)) !==
          String(selectedStoreTypeId)
      ) {
        return false;
      }
      if (
        selectedCategoryType &&
        getID(product.categoryTypeId) !== getID(selectedCategoryType._id)
      ) {
        return false;
      }
      if (
        product.newPrice < priceRange[0] ||
        product.newPrice > priceRange[1]
      ) {
        return false;
      }
      if (
        requireDiscount &&
        !productHasActiveDiscount(product, isDiscountValid)
      ) {
        return false;
      }
      if (product.expireDate && !isExpiryStillValid(product.expireDate)) {
        return false;
      }
      return true;
    };
    const discounted = allProducts.filter((product) =>
      matchCategoryChipProduct(product, true),
    );
    const base = allProducts.filter((product) =>
      matchCategoryChipProduct(product, false),
    );
    return flattenProductsByStore(
      mergeProductsByStoreWithDiscountFallback(
        groupProductsByStoreId(discounted, getID),
        groupProductsByStoreId(base, getID),
      ),
    );
  }, [
    allProducts,
    storeIdsInCity,
    selectedStoreTypeId,
    selectedCategoryType,
    priceRange,
    getID,
  ]);

  const visibleCategories = useMemo(() => {
    if (selectedStoreTypeId === "all") return filteredCategories;
    const ids = new Set(
      filteredProductsForCategoryChips
        .map((p) => productCategoryIdString(p, getID))
        .filter(Boolean)
        .map((id) => String(id)),
    );
    const hasUncategorized = filteredProductsForCategoryChips.some(
      (p) => !productCategoryIdString(p, getID),
    );
    const cats = filteredCategories.filter((c) =>
      ids.has(String(getID(c._id))),
    );
    if (hasUncategorized) {
      return [
        {
          _id: UNCATEGORIZED_CATEGORY_ID,
          name: t("Uncategorized"),
        },
        ...cats,
      ];
    }
    return cats;
  }, [
    filteredCategories,
    filteredProductsForCategoryChips,
    selectedStoreTypeId,
    getID,
    t,
  ]);

  useEffect(() => {
    if (!selectedCategory) return;
    const sel = String(getID(selectedCategory._id));
    const ok = visibleCategories.some((c) => String(getID(c._id)) === sel);
    if (!ok) {
      setSelectedCategory(null);
      setSelectedCategoryType(null);
    }
  }, [visibleCategories, selectedCategory]);

  useEffect(() => {
    if (selectedStoreTypeId === "all") return;
    const ok = visibleStoreTypes.some(
      (st) => String(getID(st._id)) === String(selectedStoreTypeId),
    );
    if (!ok) {
      setSelectedStoreTypeId("all");
      setSelectedCategory(null);
      setSelectedCategoryType(null);
    }
  }, [visibleStoreTypes, selectedStoreTypeId]);

  const mainPageSearchAnalyticsKey = useMemo(
    () =>
      JSON.stringify({
        q: search.trim().toLowerCase(),
        city: selectedCity,
        cat: selectedCategory ? getID(selectedCategory._id) : null,
        ctype: selectedCategoryType ? getID(selectedCategoryType._id) : null,
        st: selectedStoreTypeId,
        pr: priceRange,
        sd: sortByNewestDiscount,
        sn: sortByNearMe,
      }),
    [
      search,
      selectedCity,
      selectedCategory,
      selectedCategoryType,
      selectedStoreTypeId,
      priceRange,
      sortByNewestDiscount,
      sortByNearMe,
      getID,
    ],
  );

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      mainPageSearchLogIdRef.current = null;
      return;
    }
    if (loading) return;
    const timer = window.setTimeout(() => {
      if (loading) return;
      const storeTypeObj = visibleStoreTypes.find(
        (st) => String(getID(st._id)) === String(selectedStoreTypeId),
      );
      const storeLabel =
        selectedStoreTypeId !== "all" && storeTypeObj
          ? locName(storeTypeObj)
          : null;
      let categoryLabel = null;
      if (selectedCategoryType && selectedCategory) {
        categoryLabel = `${locName(selectedCategory)} › ${locName(selectedCategoryType)}`;
      } else if (selectedCategory) {
        categoryLabel = locName(selectedCategory);
      } else if (selectedCategoryType) {
        categoryLabel = locName(selectedCategoryType);
      }
      const sortBy = sortByNearMe
        ? "near_me"
        : sortByNewestDiscount
          ? "newest_discount"
          : "default";
      void (async () => {
        const id = await logSearchEvent({
          searchText: q,
          resultCount: filteredProducts.length,
          source: "mainpage",
          filters: {
            category: categoryLabel,
            city: selectedCity || null,
            store: storeLabel,
            sortBy,
            priceMin: priceRange[0],
            priceMax: priceRange[1],
          },
        });
        mainPageSearchLogIdRef.current = id;
      })();
    }, 550);
    return () => window.clearTimeout(timer);
  }, [
    mainPageSearchAnalyticsKey,
    filteredProducts.length,
    loading,
    search,
    selectedCity,
    selectedCategory,
    selectedCategoryType,
    selectedStoreTypeId,
    visibleStoreTypes,
    sortByNearMe,
    sortByNewestDiscount,
    priceRange,
    locName,
    getID,
  ]);

  // Stores to display — derived from per-store product groups (discount-first, city-safe fallback).
  const finalFilteredStores = useMemo(() => {
    return stores.filter((store) => {
      const storeID = getID(store._id);

      const hasMatchingProducts =
        (productsByStoreId.get(String(storeID)) ?? []).length > 0;

      // Or the store name itself matches the search
      const storeNameMatch =
        normalizedSearch &&
        store.name?.toLowerCase().includes(normalizedSearch);

      // And the store must match the type filter
      const storeTypeMatch =
        selectedStoreTypeId === "all" ||
        String(getID(store.storeTypeId)) === String(selectedStoreTypeId);

      // And the store must match the city filter
      const cityMatch = storeMatchesSelectedCity(store, selectedCity);

      return (
        (hasMatchingProducts || storeNameMatch) && storeTypeMatch && cityMatch
      );
    });
  }, [
    productsByStoreId,
    stores,
    normalizedSearch,
    selectedStoreTypeId,
    selectedCity,
    getID,
  ]);

  const sortedFilteredStores = useMemo(() => {
    const baseStores = [...finalFilteredStores];
    if (!sortByNewestDiscount && !sortByNearMe) {
      return baseStores;
    }

    return baseStores.sort((a, b) => {
      let byDistance = 0;
      if (sortByNearMe && userCoords) {
        const distanceA = getDistanceKm(userCoords, getStoreCoordinates(a));
        const distanceB = getDistanceKm(userCoords, getStoreCoordinates(b));
        byDistance = distanceA - distanceB;
      }

      let byNewest = 0;
      if (sortByNewestDiscount) {
        const timeA = a?.lastReleaseDiscountDate
          ? new Date(a.lastReleaseDiscountDate).getTime()
          : 0;
        const timeB = b?.lastReleaseDiscountDate
          ? new Date(b.lastReleaseDiscountDate).getTime()
          : 0;
        byNewest = timeB - timeA;
      }

      // Mutually exclusive toggles, but keep stable ordering if data missing.
      if (sortByNearMe) return byDistance;
      return byNewest;
    });
  }, [finalFilteredStores, sortByNewestDiscount, sortByNearMe, userCoords]);

  const showcaseEligibleGifts = useMemo(() => {
    return (gifts || []).filter((g) => {
      if (!g?.expireDate) return true;
      return isExpiryStillValid(g.expireDate);
    });
  }, [gifts]);

  const showcaseEligibleJobs = useMemo(() => {
    return (jobs || []).filter((j) => {
      if (j?.active === false) return false;
      if (j?.expireDate && !isExpiryStillValid(j.expireDate)) return false;
      const jobCity = String(j?.city || "").trim();
      if (!jobCity) return true;
      return toCanonicalCity(jobCity) === selectedCityCanonical;
    });
  }, [jobs, selectedCityCanonical]);

  const showcaseEligibleAllDiscountStores = useMemo(() => {
    return (showcaseDiscountStores || []).filter((entry) => {
      const store = entry?.store;
      if (!store) return false;
      return storeMatchesSelectedCity(store, selectedCity);
    });
  }, [showcaseDiscountStores, selectedCity]);

  const storeCityById = useMemo(() => {
    const map = {};
    stores.forEach((store) => {
      map[String(getID(store?._id))] = store?.storecity || store?.city || "";
    });
    return map;
  }, [stores]);

  const topViewedProducts = useMemo(() => {
    const getViews = (product) => {
      const raw = product?.viewCount ?? product?.views ?? product?.view ?? 0;
      const count = Number(raw);
      return Number.isFinite(count) ? count : 0;
    };

    return [...discountedOnlyProducts]
      .filter((product) => {
        const productStoreId = String(getID(product?.storeId));
        const st = storeById[productStoreId];
        if (st) return storeMatchesSelectedCity(st, selectedCity);
        const productStoreCity =
          product?.storeId?.storecity || storeCityById[productStoreId];
        return !selectedCityCanonical || doesCityMatch(productStoreCity);
      })
      .sort((a, b) => getViews(b) - getViews(a))
      .slice(0, 15);
  }, [
    discountedOnlyProducts,
    selectedCityCanonical,
    storeCityById,
    storeById,
    selectedCity,
  ]);

  const HOME_REELS_AFTER_STORE_COUNT = 14;

  const mainFeedItems = useMemo(() => {
    const items = [];
    displayedStores.forEach((store, index) => {
      items.push({
        type: "store",
        key: `s-${getID(store._id)}`,
        store,
      });
      if (index + 1 === HOME_REELS_AFTER_STORE_COUNT) {
        items.push({
          type: "reels",
          key: "home-reels",
        });
      }
      if ((index + 1) % 8 === 0) {
        const blockIndex = (index + 1) / 8 - 1;
        items.push({
          type: "showcase",
          key: `sh-${blockIndex}`,
          blockIndex,
        });
      }
    });
    return items;
  }, [displayedStores, getID]);

  const brandsInSelectedCity = useMemo(
    () => brands.filter((b) => storeMatchesSelectedCity(b, selectedCity)),
    [brands, selectedCity],
  );
  const companiesInSelectedCity = useMemo(
    () => companies.filter((c) => storeMatchesSelectedCity(c, selectedCity)),
    [companies, selectedCity],
  );

  const renderRotatingShowcase = useCallback(
    (blockIndex) => {
      const variant = blockIndex % 4;
      if (variant === 0) {
        const offset = blockIndex * 8;
        const slice = brandsInSelectedCity.slice(offset, offset + 8);
        if (slice.length === 0) return null;
        return <BrandShowcase brands={slice} />;
      }
      if (variant === 1) {
        const offset = blockIndex * 8;
        const slice = companiesInSelectedCity.slice(offset, offset + 8);
        if (slice.length === 0) return null;
        return <CompanyShowcase companies={slice} />;
      }
      if (variant === 2) {
        const prevList = randomShowcaseStoresRef.current[blockIndex];
        const needFill =
          sortedFilteredStores.length > 0 &&
          (!Array.isArray(prevList) || prevList.length === 0);
        if (needFill) {
          const shuffled = [...sortedFilteredStores].sort(
            () => Math.random() - 0.5,
          );
          randomShowcaseStoresRef.current[blockIndex] = shuffled.slice(0, 20);
        }
        const storesForShowcase =
          randomShowcaseStoresRef.current[blockIndex] ?? [];
        if (storesForShowcase.length === 0) return null;
        return <StoreShowcase stores={storesForShowcase} />;
      }
      if (!showcaseEligibleGifts.length) return null;
      return <GiftShowcase gifts={showcaseEligibleGifts} />;
    },
    [
      brandsInSelectedCity,
      companiesInSelectedCity,
      showcaseEligibleGifts,
      sortedFilteredStores,
    ],
  );

  // Effect for pagination ? on mobile, preload two chunks (16 stores) so rows after the
  // first BrandShowcase block exist without depending on the infinite-scroll sentinel
  // (it often misses after route return / overlay / browser chrome). Reset rotating
  // showcase picks whenever the store list identity changes.
  useLayoutEffect(() => {
    randomShowcaseStoresRef.current = {};
    const chunk = storesPerPage;
    const initialMax = isMobile ? chunk * 2 : chunk;
    let initialCount = Math.min(sortedFilteredStores.length, initialMax);

    // When returning online, pre-expand the first slice to match saved scroll depth so
    // restoration does not race this effect resetting to 8–16 rows (fixes scroll restore).
    if (isOnline) {
      try {
        const rawState = sessionStorage.getItem(MAIN_PAGE_SCROLL_STATE_KEY);
        if (rawState) {
          const parsed = JSON.parse(rawState);
          const need = Number(parsed?.displayedCount);
          const savedY = Number(parsed?.y);
          if (
            Number.isFinite(need) &&
            need > 0 &&
            Number.isFinite(savedY) &&
            savedY > 0
          ) {
            initialCount = Math.min(
              sortedFilteredStores.length,
              Math.max(initialCount, need),
            );
          }
        }
      } catch {
        /* ignore */
      }
    }

    setDisplayedStores(sortedFilteredStores.slice(0, initialCount));
    setStoresPage(Math.max(1, Math.ceil(initialCount / chunk)));
    setHasMoreStores(initialCount < sortedFilteredStores.length);
  }, [sortedFilteredStores, storesPerPage, isMobile, isOnline]);

  const loadMoreStores = useCallback(() => {
    setStoresPage((prevPage) => {
      const nextPage = prevPage + 1;
      const newStores = sortedFilteredStores.slice(0, nextPage * storesPerPage);
      setDisplayedStores(newStores);
      setHasMoreStores(newStores.length < sortedFilteredStores.length);
      return nextPage;
    });
  }, [sortedFilteredStores, storesPerPage]);

  loadMoreStoresRef.current = loadMoreStores;

  // Infinite scroll: load next store chunk when sentinel nears the viewport (all breakpoints).
  useEffect(() => {
    if (!hasMoreStores) return undefined;
    const el = loadMoreSentinelRef.current;
    if (!el) return undefined;

    let ticking = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit || ticking) return;
        ticking = true;
        loadMoreStoresRef.current();
        window.setTimeout(() => {
          ticking = false;
        }, 400);
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMoreStores]);

  // Runs after store pagination has applied (above) so displayedStores/hasMoreStores match list depth.
  useLayoutEffect(() => {
    if (mainPageScrollRestoredRef.current) {
      return;
    }

    // Full refresh: skip session restore only on the first MainPage mount after a
    // document reload. `navigation.type` stays "reload" for the whole SPA session,
    // so we must not run this on every subsequent Home visit.
    if (!mainPageReloadScrollResetConsumed && isBrowserReloadNavigation()) {
      mainPageReloadScrollResetConsumed = true;
      resetMainPageScrollPositionInSession();
      applyWindowScrollY(0);
      requestAnimationFrame(() => applyWindowScrollY(0));
      mainPageScrollRestoredRef.current = true;
      return;
    }

    if (loading && stores.length === 0) {
      return;
    }

    // Use navigator.onLine so a brief useOnline flicker doesn't skip restore or cancel timers.
    const onlineNow =
      typeof navigator === "undefined" ? true : navigator.onLine;

    // Offline: never restore a previous scroll offset — always start at the top.
    if (!onlineNow) {
      applyWindowScrollY(0);
      mainPageScrollRestoredRef.current = true;
      return;
    }

    let attempts = 0;
    let cancelled = false;

    const restoreScroll = () => {
      if (cancelled) return;

      let targetY = 0;
      let targetDisplayedCount = 0;
      try {
        const rawState = sessionStorage.getItem(MAIN_PAGE_SCROLL_STATE_KEY);
        if (rawState) {
          const parsedState = JSON.parse(rawState);
          const parsedY = Number(parsedState?.y);
          const parsedDisplayedCount = Number(parsedState?.displayedCount);
          if (Number.isFinite(parsedY) && parsedY > 0) {
            targetY = parsedY;
          }
          if (
            Number.isFinite(parsedDisplayedCount) &&
            parsedDisplayedCount > 0
          ) {
            targetDisplayedCount = parsedDisplayedCount;
          }
        }

        // Backward compatibility with old key (plain number).
        if (targetY <= 0) {
          const raw = sessionStorage.getItem(MAIN_PAGE_SCROLL_KEY);
          const parsed = Number(raw);
          if (Number.isFinite(parsed) && parsed > 0) {
            targetY = parsed;
          }
        }
      } catch {
        targetY = 0;
        targetDisplayedCount = 0;
      }

      // Tab is no longer restored from session — always show the standard feed.

      const countReady =
        targetDisplayedCount <= 0 ||
        displayedStores.length >= targetDisplayedCount;
      if (!countReady && hasMoreStores) {
        loadMoreStoresRef.current?.();
        attempts += 1;
        if (attempts >= 40) {
          mainPageScrollRestoredRef.current = true;
          return;
        }
        window.setTimeout(restoreScroll, 120);
        return;
      }

      if (targetY <= 0) {
        mainPageScrollRestoredRef.current = true;
        return;
      }

      const scrollHeight =
        document.documentElement?.scrollHeight ||
        document.body?.scrollHeight ||
        0;
      const viewportHeight = window.innerHeight || 0;
      const maxReachableY = Math.max(0, scrollHeight - viewportHeight);
      const pageTallEnough = maxReachableY >= targetY - 8;

      // If the page is still too short to reach the old position, keep loading
      // more store blocks before attempting the final restoration.
      if (!pageTallEnough && hasMoreStores) {
        loadMoreStoresRef.current?.();
        attempts += 1;
        if (attempts >= 40) {
          mainPageScrollRestoredRef.current = true;
          return;
        }
        window.setTimeout(restoreScroll, 120);
        return;
      }

      applyWindowScrollY(targetY);
      requestAnimationFrame(() => applyWindowScrollY(targetY));
      requestAnimationFrame(() =>
        requestAnimationFrame(() => applyWindowScrollY(targetY)),
      );
      window.setTimeout(() => applyWindowScrollY(targetY), 0);
      window.setTimeout(() => applyWindowScrollY(targetY), 80);
      window.setTimeout(() => applyWindowScrollY(targetY), 250);

      const currentY = window.scrollY || window.pageYOffset || 0;
      const reached = Math.abs(currentY - targetY) <= 2;
      attempts += 1;

      if (reached || attempts >= 40 || (!hasMoreStores && !pageTallEnough)) {
        mainPageScrollRestoredRef.current = true;
        return;
      }

      window.setTimeout(restoreScroll, 120);
    };

    try {
      restoreScroll();
    } catch {
      mainPageScrollRestoredRef.current = true;
    }

    return () => {
      cancelled = true;
    };
  }, [loading, hasMoreStores, displayedStores.length, stores.length]);

  const requestUserLocation = useCallback(async () => {
    setGeoLoading(true);
    setGeoError(null);
    try {
      const loc = await requestCurrentLocation({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
      setUserCoords({
        lat: loc.latitude,
        lng: loc.longitude,
      });
      setGeoError(null);
    } catch (err) {
      const code =
        err instanceof LocationPermissionError
          ? err.code
          : err?.code || "permissionDenied";
      setGeoError(code);
      setUserCoords(null);
      setSortByNearMe(false);
    } finally {
      setGeoLoading(false);
    }
  }, []);

  const formatPrice = useCallback(
    (price) => {
      if (typeof price !== "number") return `${t("ID")} 0`;
      return ` ${formatPriceDigits(price)} ${t("ID")}`;
    },
    [t],
  );

  if (loading)
    return (
      <Box
        sx={{
          /* xs: no extra horizontal padding — App Container supplies narrow inset on mobile */
          px: { xs: 0, sm: 1.5, md: 3 },
          ...MOBILE_NAV_OFFSET_SX,
          pb: { xs: 10, sm: 4 },
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Banner skeleton (same region as BannerCarousel) */}
        <Skeleton
          variant="rounded"
          width="100%"
          height={168}
          sx={{ mb: 2, borderRadius: "16px" }}
        />

        {/* Filter chips skeleton */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mb: 2,
            overflowX: "auto",
            overflowY: "hidden",
            width: "100%",
            pb: 0.5,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {[120, 95, 110, 130, 90, 88].map((w, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width={w}
              height={34}
              sx={{ borderRadius: "999px", flexShrink: 0 }}
            />
          ))}
        </Box>

        {/* Deferred top sections (FlashDeals + Jobs) */}
        <Box
          sx={{
            mb: { xs: 1.5, sm: 2 },
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Skeleton
            variant="rounded"
            width="100%"
            height={152}
            sx={{ borderRadius: "20px" }}
          />
          <Skeleton
            variant="rounded"
            width="100%"
            height={124}
            sx={{ borderRadius: "20px" }}
          />
        </Box>

        {/* Store group skeletons (same card proportions as list rows) */}
        {[1, 2, 3].map((idx) => (
          <Box
            key={idx}
            sx={{
              mb: 2,
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              width: "100%",
            }}
          >
            {/* Store header */}
            <Box
              sx={{
                p: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                background:
                  theme.palette.mode === "dark"
                    ? "rgba(30,111,217,0.1)"
                    : "rgba(30,111,217,0.06)",
              }}
            >
              <Skeleton
                variant="rounded"
                width={52}
                height={52}
                sx={{ borderRadius: "14px", flexShrink: 0 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Skeleton variant="text" width="45%" height={24} />
                <Skeleton variant="text" width="70%" height={18} />
                <Box
                  sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}
                >
                  <Skeleton
                    variant="rounded"
                    width={100}
                    height={22}
                    sx={{ borderRadius: "999px", flexShrink: 0 }}
                  />
                  <Skeleton
                    variant="rounded"
                    width={80}
                    height={22}
                    sx={{ borderRadius: "999px", flexShrink: 0 }}
                  />
                </Box>
              </Box>
            </Box>
            {/* Products row ? horizontal scroll + non-shrinking cards (matches StoreGroupSection / ProductCard) */}
            <Box
              sx={{
                p: "12px 14px",
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                gap: { xs: 1, sm: 1.2 },
                overflowX: "auto",
                overflowY: "hidden",
                width: "100%",
                boxSizing: "border-box",
                scrollbarWidth: "thin",
              }}
            >
              {[1, 2, 3, 4, 5].map((c) => (
                <Box
                  key={c}
                  sx={{
                    flexShrink: 0,
                    width: 148,
                    minWidth: 148,
                  }}
                >
                  <Skeleton
                    variant="rounded"
                    width={148}
                    height={150}
                    sx={{ borderRadius: "12px 12px 0 0" }}
                  />
                  <Skeleton
                    variant="rounded"
                    width={148}
                    height={68}
                    sx={{ borderRadius: "0 0 12px 12px", mt: "1px" }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    );
  if (loadError?.variant) {
    return (
      <ApiConnectionErrorPanel
        variant={loadError.variant}
        onRetry={() => {
          setLoadError(null);
          fetchData();
        }}
        onReloadApp={() => {
          window.location.reload();
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        ...MOBILE_NAV_OFFSET_SX,
        pb: { xs: 2, sm: 4 },
      }}
    >
      <Box ref={mainPageFeedTopRef} sx={MOBILE_NAV_SCROLL_MARGIN_SX}>
        <BannerCarousel
          banners={bannerAdsWithImages}
          onBannerClick={(ad) => {
            if (ad.brandId) navigate(`/brands/${ad.brandId}`);
            else if (ad.storeId) navigate(`/stores/${ad.storeId}`);
            else if (ad.giftId) navigate(`/gifts/${ad.giftId}`);
          }}
        />
      </Box>
      {/* --- */}
      <Box sx={{ mb: 0 }}>
        <FilterChips
          search={search}
          onSearchChange={setSearch}
          storeTypes={visibleStoreTypes}
          selectedStoreTypeId={selectedStoreTypeId}
          onStoreTypeSelect={handleStoreTypeChange}
          allCategories={allCategories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategoryChange}
          sortByNewest={sortByNewestDiscount}
          sortByNearMe={sortByNearMe}
          onToggleNewest={() => {
            setSortByNewestDiscount((prev) => {
              const next = !prev;
              if (next) setSortByNearMe(false);
              return next;
            });
          }}
          onToggleNearMe={() => {
            setSortByNearMe((prev) => {
              const next = !prev;
              if (next) {
                setSortByNewestDiscount(false);
                requestUserLocation();
              }
              return next;
            });
          }}
          geoLoading={geoLoading}
          onClearAll={clearAllFilters}
          productLayout={productLayout}
          onLayoutChange={setProductLayout}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
        />
        {geoError && (
          <Alert
            severity="warning"
            onClose={() => setGeoError(null)}
            sx={{
              borderRadius: "14px",
              mb: 1.5,
              alignItems: "center",
            }}
            action={
              geoError === "permissionDeniedForever" &&
              isFlutterLocationApp() ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => openLocationSettings()}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  {t("Enable Location", {
                    defaultValue: "Enable Location",
                  })}
                </Button>
              ) : null
            }
          >
            {t("Location permission is required to find nearby stores.", {
              defaultValue:
                "Location permission is required to find nearby stores.",
            })}
          </Alert>
        )}
        <StoreTypesBrowseSection storeTypes={storeTypes} />
        {/* legacy filter content ? hidden, kept for price-range state wiring */}
        <Box sx={{ display: "none" }}>
          {/* Search and Basic Filters */}
          <Box
            sx={{
              mt: 3,
              display: { xs: filtersOpen ? "block" : "none", md: "block" },
            }}
          >
            <Box
              sx={{
                mb: 1,
                display: "flex",
                gap: { xs: 1, md: 2 },
                alignItems: "center",
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <TextField
                variant="outlined"
                placeholder={t("Search for products or stores...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  flex: 1,
                  width: { xs: "100%", sm: "auto" },
                  maxWidth: { xs: "100%", sm: 400 },
                  backgroundColor: "white",
                  borderRadius: 1,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "transparent",
                    },
                    "&:hover fieldset": {
                      borderColor: "transparent",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
                size="small"
                InputProps={{
                  inputProps: {
                    style: {
                      color:
                        theme.palette.mode === "dark" ? "black" : "grey.500",
                    },
                  },
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{
                          color:
                            theme.palette.mode === "dark"
                              ? "#1E6FD9"
                              : "grey.500",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Price Range Filters */}
              <Box
                sx={{
                  display: "flex",

                  gap: { xs: 0.5, sm: 1 },
                  alignItems: "center",
                  flexWrap: { xs: "wrap", sm: "nowrap" },
                }}
              >
                <TextField
                  type="number"
                  placeholder={t("Min Price")}
                  value={priceRange[0] || ""}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setPriceRange([val, priceRange[1]]);
                  }}
                  sx={{
                    width: { xs: "45%", sm: 80, md: 120 },
                    height: { xs: "35px", sm: "50px", md: "50px" },
                    backgroundColor: "white",
                    borderRadius: 1,
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "transparent" },
                      "&:hover fieldset": { borderColor: "transparent" },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
                  size="small"
                  InputProps={{
                    inputProps: {
                      style: {
                        color:
                          theme.palette.mode === "dark" ? "black" : "grey.500",
                      },
                    },
                  }}
                />

                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    color: "white",
                  }}
                >
                  -
                </Typography>

                <TextField
                  type="number"
                  placeholder={t("Max Price")}
                  value={priceRange[1] === 1000000 ? "" : priceRange[1]}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 1000000;
                    setPriceRange([priceRange[0], val]);
                  }}
                  sx={{
                    width: { xs: "45%", sm: 80, md: 120 },
                    height: { xs: "35px", sm: "50px", md: "50px" },
                    backgroundColor: "white",
                    borderRadius: 1,
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "transparent" },
                      "&:hover fieldset": { borderColor: "transparent" },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
                  size="small"
                  InputProps={{
                    inputProps: {
                      style: {
                        color:
                          theme.palette.mode === "dark" ? "black" : "grey.500",
                      },
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>
          {/* Store Type Filter */}
          <Box sx={{ mb: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: "black",
                mb: 0.5,
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              {t("Store Type")}
            </Typography>
            <Box
              sx={{
                flexWrap: "wrap",
                display: "flex",
                gap: { xs: 0.5, sm: 1 },
                alignItems: "center",
                pb: 0,
                minHeight: "20px",
                width: "100%",
                overflow: "hidden",
              }}
            >
              {[{ _id: "all", name: t("All") }, ...visibleStoreTypes].map(
                (type) => (
                  <Button
                    key={type._id}
                    variant={
                      String(selectedStoreTypeId) === String(type._id)
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => handleStoreTypeChange(type._id)}
                    sx={{
                      backgroundColor:
                        String(selectedStoreTypeId) === String(type._id)
                          ? "var(--brand-primary-blue)"
                          : "transparent",
                      color:
                        String(selectedStoreTypeId) === String(type._id)
                          ? "white"
                          : "black",
                      // borderBottom: "1px solid var(--brand-accent-orange)",
                      borderRadius: "8px",
                      px: { xs: 1.5, md: 2 },
                      py: 0.5,
                      fontSize: { xs: "0.75rem", md: "0.875rem" },
                      textTransform: "none",
                      minHeight: "32px",
                      maxWidth: "100%",
                      whiteSpace: "normal",
                      textAlign: "center",
                      lineHeight: 1.4,
                      // display: "inline-flex",
                      // flexWrap: "wrap",
                      justifyContent: "center",
                      alignItems: "center",
                      "&:hover": {
                        backgroundColor:
                          String(selectedStoreTypeId) === String(type._id)
                            ? theme.palette.mode === "dark"
                              ? "#1E6FD9"
                              : "#4A90E2"
                            : "rgba(255,255,255,0.1)",
                        borderColor: "rgba(255,255,255,0.5)",
                      },
                    }}
                  >
                    <span style={{ marginRight: "4px", flexShrink: 0 }}>
                      {type.icon || "??"}
                    </span>
                    <span
                      style={{
                        flex: "1 1 0",
                        minWidth: 0,
                        // overflowWrap: "break-word",
                        // wordBreak: "break-word",
                      }}
                    >
                      {locName(type) || t(type.name)}
                    </span>
                  </Button>
                ),
              )}
            </Box>
          </Box>

          {/* Categories Filter */}
          {selectedStoreTypeId !== "all" && (
            <Box sx={{ mt: 2, mb: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "black",
                  mb: 0.5,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                {t("Categories")}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 0.5, sm: 1 },
                  alignItems: "center",
                  justifyContent: { xs: "flex-start", md: "flex-start" },
                  overflowX: "auto",
                  overflowY: "hidden",
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                  pb: 1,
                  minHeight: "50px",
                }}
              >
                {/* Browse All Categories */}
                <Button
                  variant={selectedCategory === null ? "contained" : "outlined"}
                  onClick={() => handleCategoryChange(null)}
                  sx={{
                    backgroundColor:
                      selectedCategory === null
                        ? theme.palette.primary.main
                        : "transparent",
                    color: selectedCategory === null ? "white" : "black",
                    borderBottom: "1px solid var(--brand-accent-orange)",
                    borderRadius: "8px",
                    px: { xs: 1.5, md: 2 },
                    py: 0.5,
                    fontSize: { xs: "0.75rem", md: "0.875rem" },
                    textTransform: "none",
                    minHeight: "32px",
                    flexShrink: 0,
                    "&:hover": {
                      backgroundColor:
                        selectedCategory === null
                          ? theme.palette.mode === "dark"
                            ? theme.palette.primary.main
                            : "#4A90E2"
                          : "rgba(255,255,255,0.1)",
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                  }}
                  startIcon={<CategoryIcon sx={{ fontSize: "16px" }} />}
                >
                  {t("all")}
                </Button>

                {/* Category Filter Buttons */}
                {visibleCategories.map((category) => (
                  <Button
                    key={category._id}
                    variant={
                      selectedCategory?._id === category._id
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => handleCategoryChange(category)}
                    sx={{
                      backgroundColor:
                        selectedCategory?._id === category._id
                          ? theme.palette.primary.main
                          : "transparent",
                      color:
                        selectedCategory?._id === category._id
                          ? "white"
                          : "black",
                      borderBottom: "1px solid var(--brand-accent-orange)",
                      borderRadius: "8px",
                      px: { xs: 1.5, md: 2 },
                      py: 0.5,
                      fontSize: { xs: "0.75rem", md: "0.875rem" },
                      textTransform: "none",
                      minHeight: "32px",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                      "&:hover": {
                        backgroundColor:
                          selectedCategory?._id === category._id
                            ? theme.palette.mode === "dark"
                              ? theme.palette.primary.main
                              : "#4A90E2"
                            : "rgba(255,255,255,0.1)",
                        borderColor: "rgba(255,255,255,0.5)",
                      },
                    }}
                  >
                    {locName(category) || t(category.name)}
                  </Button>
                ))}
              </Box>
            </Box>
          )}

          {/* CCCategory Types Filter
          {selectedCategory && (
            <Box sx={{ mb: 0 }}>
             
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 0.5, sm: 1 },
                  alignItems: "center",
                  justifyContent: { xs: "flex-start", md: "flex-start" },
                  overflowX: "auto",
                  overflowY: "hidden",
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                  pb: 0,
                  minHeight: "20px",
                }}
              >
                CCAll Category Types
                <Button
                  variant={
                    selectedCategoryType === null ? "contained" : "outlined"
                  }
                  onClick={() => handleCategoryTypeChange(null)}
                  sx={{
                    backgroundColor:
                      selectedCategoryType === null
                        ? theme.palette.mode === "dark"
                          ? "#1E6FD9"
                          : "#4A90E2"
                        : "transparent",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 2,
                    px: { xs: 1.5, md: 2 },
                    py: 0.5,
                    fontSize: { xs: "0.75rem", md: "0.875rem" },
                    textTransform: "none",
                    minHeight: "32px",
                    flexShrink: 0,
                    "&:hover": {
                      backgroundColor:
                        selectedCategoryType === null
                          ? theme.palette.mode === "dark"
                            ? "#1E6FD9"
                            : "#4A90E2"
                          : "rgba(255,255,255,0.1)",
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                  }}
                  startIcon={<CategoryIcon sx={{ fontSize: "16px" }} />}
                >
                  {t("All Category Types")}
                </Button>

                CCCategory Type Filter Buttons
                {categoryTypes.map((categoryType, index) => (
                  <Button
                    key={index}
                    variant={
                      selectedCategoryType?.name === categoryType.name
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => handleCategoryTypeChange(categoryType)}
                    sx={{
                      backgroundColor:
                        selectedCategoryType?.name === categoryType.name
                          ? theme.palette.mode === "dark"
                            ? "#1E6FD9"
                            : "#4A90E2"
                          : "transparent",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: 2,
                      px: { xs: 1.5, md: 2 },
                      py: 0.5,
                      fontSize: { xs: "0.75rem", md: "0.875rem" },
                      textTransform: "none",
                      minHeight: "32px",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                      "&:hover": {
                        backgroundColor:
                          selectedCategoryType?.name === categoryType.name
                            ? theme.palette.mode === "dark"
                              ? "#1E6FD9"
                              : "#4A90E2"
                            : "rgba(255,255,255,0.1)",
                        borderColor: "rgba(255,255,255,0.5)",
                      },
                    }}
                  >
                    {t(categoryType.name)}
                  </Button>
                ))}
              </Box>
            </Box>
          )} */}

          {/* Clear Filters Button - Desktop Only */}
          <Box
            sx={{
              mt: 2,
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
            }}
          >
            <Button
              variant="outlined"
              onClick={clearAllFilters}
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.5)",
                borderRadius: 2,
                px: 3,
                py: 0.5,
                fontSize: "0.875rem",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderColor: "white",
                },
              }}
            >
              {t("Clear All Filters")}
            </Button>
          </Box>
        </Box>
        {/* end legacy hidden */}
      </Box>

      {/* --- */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {!isMobile || mobileDeferredSectionsReady ? (
              <>
                {showcaseEligibleGifts.length > 0 && (
                  <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                    <SpecialOffersBanner count={showcaseEligibleGifts.length} />
                  </Box>
                )}
                <FlashDealsSection
                  products={topViewedProducts}
                  onProductOpen={handleProductClick}
                  likeStates={likeStates}
                  isProductLiked={isProductLiked}
                  onLikeClick={handleLikeClick}
                  likeLoading={likeLoading}
                  formatPrice={formatPrice}
                  storeById={storeById}
                  getID={getID}
                />
                <FindJobShowcase jobs={showcaseEligibleJobs} />
                {showcaseEligibleAllDiscountStores.length > 0 && (
                  <AllProductsDiscountShowcase
                    items={showcaseEligibleAllDiscountStores}
                  />
                )}
              </>
            ) : (
              <Box
                sx={{
                  mb: { xs: 1.5, sm: 2 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                <Skeleton
                  variant="rounded"
                  width="100%"
                  height={152}
                  sx={{ borderRadius: "20px" }}
                />
                <Skeleton
                  variant="rounded"
                  width="100%"
                  height={124}
                  sx={{ borderRadius: "20px" }}
                />
              </Box>
            )}

        <Virtuoso
              useWindowScroll
              increaseViewportBy={{ top: 600, bottom: 1000 }}
              data={mainFeedItems}
              computeItemKey={(_, item) => item.key}
              itemContent={(_, item) => {
                if (item.type === "reels") {
                  return (
                    <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                      <HomeReelsSection />
                    </Box>
                  );
                }
                if (item.type === "showcase") {
                  const showcase = renderRotatingShowcase(item.blockIndex);
                  // Virtuoso requires every row to have non-zero size; showcases return null when empty.
                  if (!showcase) {
                    return (
                      <Box
                        aria-hidden
                        sx={{
                          minHeight: 24,
                          width: "100%",
                          visibility: "hidden",
                          pointerEvents: "none",
                        }}
                      />
                    );
                  }
                  return <Box sx={{ mb: 0 }}>{showcase}</Box>;
                }
                const productsForCard =
                  productsByStoreId.get(String(getID(item.store._id))) ?? [];
                return (
                  <StoreGroupSection
                    store={item.store}
                    products={productsForCard}
                    onProductOpen={handleProductClick}
                    isStoreFollowed={isStoreFollowed}
                    onFollowClick={handleFollowClick}
                    followLoading={followLoading[item.store._id]}
                    likeStates={likeStates}
                    isProductLiked={isProductLiked}
                    onLikeClick={handleLikeClick}
                    likeLoading={likeLoading}
                    formatPrice={formatPrice}
                    productLayout={productLayout}
                  />
                );
              }}
              components={{
                Footer: () => (
                  <Box
                    ref={hasMoreStores ? loadMoreSentinelRef : undefined}
                    sx={{
                      width: "100%",
                      minHeight: 24,
                      mt: 3,
                      mb: { xs: 4, sm: 3 },
                    }}
                    aria-hidden
                  />
                ),
              }}
            />
      </Box>

      {finalFilteredStores.length === 0 && !loading && (
        <Alert
          severity="info"
          sx={{
            borderRadius: "14px",
            mt: 2,
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(255,169,77,0.15)"
                : "#e3f2fd",
            border: `1px solid ${theme.palette.mode === "dark" ? "#FF7A1A" : "#bbdefb"}`,
          }}
        >
          {t("No stores match the current filters.")}
        </Alert>
      )}

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        open={productDialogOpen}
        onClose={closeProductDialog}
        product={selectedProduct}
        candidateProducts={allProducts}
        onProductChange={setSelectedProduct}
        storeCityById={storeCityById}
      />

      {/* Login Notification Dialog */}
      <Dialog
        open={loginNotificationOpen}
        onClose={() => setLoginNotificationOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" component="span">
              {t("Login Required")}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {loginNotificationReason === "review"
              ? t("You must login to leave reviews. Do you want to login?")
              : t("You must login to like products. Do you want to login?")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setLoginNotificationOpen(false)}
            variant="outlined"
            color="primary"
          >
            {t("No")}
          </Button>
          <Button
            onClick={() => {
              setLoginNotificationOpen(false);
              navigate("/login", {
                state: {
                  from: {
                    pathname: window.location.pathname,
                  },
                },
              });
            }}
            variant="contained"
            color="primary"
          >
            {t("Yes")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Scroll to Top Button */}
      {/* {showScrollTop && (
        <Fab
          color="primary"
          aria-label="scroll to top"
          onClick={scrollToTop}
          sx={{
            position: "fixed",
            bottom: { xs: 80, sm: 16 }, // Higher on mobile to avoid bottom navigation
            right: { xs: 16, sm: 16 },
            zIndex: 1000,
            backgroundColor:
              theme.palette.mode === "dark" ? "#4A90E2" : "#1E6FD9",
            color: "white",
            width: { xs: 48, sm: 56 }, // Slightly smaller on mobile
            height: { xs: 48, sm: 56 },
            "&:hover": {
              backgroundColor:
                theme.palette.mode === "dark" ? "#FFA94D" : "#1E6FD9",
              transform: "translateY(-2px)",
            },
            transition: "all 0.3s ease",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <KeyboardArrowUpIcon sx={{ fontSize: { xs: "20px", sm: "24px" } }} />
        </Fab>
      )} */}
    </Box>
  );
};

export default MainPage;
