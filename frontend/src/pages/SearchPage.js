import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Paper,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  IconButton,
  Chip,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BusinessIcon from "@mui/icons-material/Business";
import CategoryIcon from "@mui/icons-material/Category";
import HistoryIcon from "@mui/icons-material/History";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import { searchAPI, brandAPI } from "../services/api";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useActiveTheme } from "../context/ActiveThemeContext";
import { useCityFilter } from "../context/CityFilterContext";
import { getLocalizedField } from "../utils/localize";
import { useDataLanguage } from "../context/DataLanguageContext";
import { getDeviceId } from "../utils/deviceId";
import { formatPriceDigits } from "../utils/formatPriceNumber";
import {
  getSearchHistory,
  addToSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
} from "../utils/searchHistory";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { isExpiryStillValid } from "../utils/expiryDate";
import ProductDetailDialog from "../components/ProductDetailDialog";
import {
  logSearchEvent,
  recordSearchClick,
} from "../utils/searchAnalyticsTrack";
import { useDraftCartDrawer } from "../hooks/useDraftCartDrawer";
import BrandShowcase from "../components/BrandShowcase";
import { isRtlLanguage } from "../utils/isRtlLanguage";
import { getEntityId, resolveStoreTypeId } from "../utils/entityId";
import { storeMatchesSelectedCity } from "../utils/cityMatch";

/** Opens Shopping draft cart drawer (EN/KU/AR-friendly keywords). */
function isCartSearchIntent(raw) {
  const q = (raw || "").trim();
  if (q.length < 2) return false;
  const t = q.toLowerCase();
  if (
    /^(my\s*)?(cart|basket|draft|bag)$/.test(t) ||
    /^(my\s+)?(cart|basket|draft(\s+cart)?)$/.test(t) ||
    /^(shopping\s*)?(cart|bag)$/.test(t) ||
    /\b(draft\s+cart|my\s+cart|shopping\s+cart)\b/i.test(q)
  ) {
    return true;
  }
  return /سلة|کارت|باسکێت|هەڵگرتن/i.test(q);
}

function storeTypeCategoryPath(storeTypeId, categoryId, categoryTypeId) {
  const stId = getEntityId(storeTypeId);
  const catId = getEntityId(categoryId);
  if (!stId || !catId) return null;
  const base = `/store-types/${encodeURIComponent(stId)}/category/${encodeURIComponent(catId)}`;
  const typeId = getEntityId(categoryTypeId);
  return typeId
    ? `${base}?categoryTypeId=${encodeURIComponent(typeId)}`
    : base;
}

const SEARCH_SHOWCASE_SURFACE_SX = {
  borderRadius: (theme) => theme.spacing(0.5),
};

const EMPTY_SEARCH_RESULTS = {
  products: [],
  stores: [],
  brands: [],
  companies: [],
  categories: [],
  categoryTypes: [],
  storeTypes: [],
};

const SearchPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);
  const { dataLanguage } = useDataLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { openDraftCart } = useDraftCartDrawer();
  const { user } = useAuth();
  const { trendingSearches } = useActiveTheme();
  const { selectedCity } = useCityFilter();
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get("q") || "";

  const [query, setQuery] = useState(qParam);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ ...EMPTY_SEARCH_RESULTS });
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const searchPageLogIdRef = useRef(null);
  const [showcaseBrands, setShowcaseBrands] = useState([]);

  const userId = user?.id || user?._id || null;
  const deviceId = userId ? null : getDeviceId();

  const refreshRecentSearches = useCallback(() => {
    setRecentSearches(getSearchHistory(userId, deviceId));
  }, [userId, deviceId]);

  useEffect(() => {
    refreshRecentSearches();
  }, [refreshRecentSearches]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await brandAPI.getAll();
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setShowcaseBrands(
          list.filter((b) => storeMatchesSelectedCity(b, selectedCity)),
        );
      } catch {
        if (!cancelled) setShowcaseBrands([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCity]);

  const brandShowcaseSlice = useMemo(
    () => showcaseBrands.slice(0, 8),
    [showcaseBrands],
  );
  const suggestedSearches = useMemo(
    () => trendingSearches,
    [trendingSearches],
  );
  const performSearch = useCallback(
    async (q) => {
      const trimmed = (q || "").trim();
      if (trimmed.length < 2) {
        searchPageLogIdRef.current = null;
        setResults({
          products: [],
          stores: [],
          brands: [],
          companies: [],
          categories: [],
          categoryTypes: [],
          storeTypes: [],
        });
        setSearched(trimmed.length > 0);
        return;
      }
      if (isCartSearchIntent(trimmed)) {
        searchPageLogIdRef.current = null;
        setResults({
          products: [],
          stores: [],
          brands: [],
          companies: [],
          categories: [],
          categoryTypes: [],
          storeTypes: [],
        });
        openDraftCart();
        setSearched(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setSearched(true);
      try {
        const res = await searchAPI.search(trimmed, selectedCity || null);
        const data = res?.data?.data || res?.data || {};
        const visibleProducts = (data.products || []).filter((product) => {
          if (!product?.expireDate) return true;
          return isExpiryStillValid(product.expireDate);
        });
        setResults({
          products: visibleProducts,
          stores: data.stores || [],
          brands: data.brands || [],
          companies: data.companies || [],
          categories: data.categories || [],
          categoryTypes: data.categoryTypes || [],
          storeTypes: data.storeTypes || [],
        });
        const totalResults =
          visibleProducts.length +
          (data.stores || []).length +
          (data.brands || []).length +
          (data.companies || []).length +
          (data.categories || []).length +
          (data.categoryTypes || []).length +
          (data.storeTypes || []).length;
        void logSearchEvent({
          searchText: trimmed,
          resultCount: totalResults,
          source: "searchpage",
          filters: {
            category: null,
            city: selectedCity || null,
            store: null,
            sortBy: "default",
            priceMin: null,
            priceMax: null,
          },
        }).then((id) => {
          searchPageLogIdRef.current = id;
        });
        addToSearchHistory(trimmed, userId, deviceId);
        refreshRecentSearches();
      } catch (err) {
        console.error("Search error:", err);
        searchPageLogIdRef.current = null;
        setResults({
          products: [],
          stores: [],
          brands: [],
          companies: [],
          categories: [],
          categoryTypes: [],
          storeTypes: [],
        });
      } finally {
        setLoading(false);
      }
    },
    [userId, deviceId, refreshRecentSearches, selectedCity, openDraftCart],
  );

  useEffect(() => {
    if (qParam) {
      setQuery(qParam);
    } else {
      setResults({
        products: [],
        stores: [],
        brands: [],
        companies: [],
        categories: [],
        categoryTypes: [],
        storeTypes: [],
      });
      setSearched(false);
    }
  }, [qParam]);

  // Re-run search when selected city changes so results stay in the chosen city
  useEffect(() => {
    if (qParam && (qParam || "").trim().length >= 2) {
      performSearch((qParam || "").trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when city changes
  }, [selectedCity]);

  const handleSearchClick = () => {
    const trimmed = (query || "").trim();
    if (trimmed.length < 2) return;
    setSearchParams({ q: trimmed }, { replace: true });
    performSearch(trimmed);
  };

  const handleBack = useCallback(() => {
    const hasActiveSearch =
      (qParam || "").trim().length >= 2 ||
      ((query || "").trim().length >= 2 && searched);

    // First back clears results/query; second back leaves the page.
    if (hasActiveSearch) {
      setQuery("");
      setSearchParams({}, { replace: true });
      setSearched(false);
      setResults({ ...EMPTY_SEARCH_RESULTS });
      searchPageLogIdRef.current = null;
      return;
    }

    const from = location.state?.from;
    if (
      typeof from === "string" &&
      from.length > 0 &&
      !from.startsWith("/search")
    ) {
      navigate(from);
      return;
    }

    const historyIdx = window.history.state?.idx;
    if (typeof historyIdx === "number" && historyIdx > 0) {
      navigate(-1);
      return;
    }

    navigate("/");
  }, [
    navigate,
    location.state,
    qParam,
    query,
    searched,
    setSearchParams,
  ]);

  const handleRecentClick = (term) => {
    setQuery(term);
    setSearchParams({ q: term }, { replace: true });
    performSearch(term);
  };

  const handleRemoveRecent = (e, term) => {
    e.stopPropagation();
    removeFromSearchHistory(term, userId, deviceId);
    refreshRecentSearches();
  };

  const handleClearRecent = () => {
    clearSearchHistory(userId, deviceId);
    refreshRecentSearches();
  };

  const handleProductClick = (product) => {
    if (searchPageLogIdRef.current && product?._id) {
      recordSearchClick(
        searchPageLogIdRef.current,
        String(product._id),
        "product",
      );
    }
    setSelectedProduct(product);
    setProductDialogOpen(true);
  };
  const handleStoreClick = (id) => {
    if (searchPageLogIdRef.current && id) {
      recordSearchClick(searchPageLogIdRef.current, String(id), "store");
    }
    navigate(`/stores/${id}`);
  };
  const handleBrandClick = (id) => {
    if (searchPageLogIdRef.current && id) {
      recordSearchClick(searchPageLogIdRef.current, String(id), "brand");
    }
    navigate(`/brands/${id}`);
  };
  const handleCompanyClick = (id) => {
    if (searchPageLogIdRef.current && id) {
      recordSearchClick(searchPageLogIdRef.current, String(id), "company");
    }
    navigate(`/companies/${id}`);
  };

  const handleCategoryClick = (cat) => {
    const catId = getEntityId(cat?._id);
    const stId = resolveStoreTypeId(cat);
    if (!catId || !stId) return;

    if (searchPageLogIdRef.current) {
      recordSearchClick(searchPageLogIdRef.current, catId, "category");
    }

    const path = storeTypeCategoryPath(stId, catId);
    if (path) navigate(path);
  };

  const handleCategoryTypeClick = (hit) => {
    const catId = getEntityId(hit?.category?._id);
    const typeId = getEntityId(hit?.type?._id);
    const stId = resolveStoreTypeId(hit?.category);
    if (!catId || !typeId || !stId) return;

    if (searchPageLogIdRef.current) {
      recordSearchClick(
        searchPageLogIdRef.current,
        `${catId}:${typeId}`,
        "categoryType",
      );
    }

    const path = storeTypeCategoryPath(stId, catId, typeId);
    if (path) navigate(path);
  };

  const handleStoreTypeClick = (storeType) => {
    const stId = getEntityId(storeType?._id);
    if (!stId) return;

    if (searchPageLogIdRef.current) {
      recordSearchClick(searchPageLogIdRef.current, stId, "storeType");
    }

    navigate(`/store-types/${encodeURIComponent(stId)}`);
  };

  // const bannerAdsWithImages = useMemo(
  //   () =>
  //     (bannerAds || [])
  //       .filter((a) => !!a.image)
  //       .map((a) => ({
  //         _id: a._id,
  //         src: a.image.startsWith("http")
  //           ? a.image
  //           : `${import.meta.env.VITE_BACKEND_URL}${a.image}`,
  //         brandId: a.brandId,
  //         storeId: a.storeId,
  //         giftId: a.giftId,
  //       })),
  //   [bannerAds],
  // );
  // const bannerSettings = {
  //   dots: true,
  //   infinite: true,
  //   speed: 500,
  //   slidesToShow: 1,
  //   slidesToScroll: 1,
  //   autoplay: true,
  //   autoplaySpeed: 3000,
  //   responsive: [
  //     {
  //       breakpoint: 1024,
  //       settings: { dots: true, arrows: false },
  //     },
  //     {
  //       breakpoint: 600,
  //       settings: { dots: true, arrows: false, autoplaySpeed: 4000 },
  //     },
  //   ],
  // };
  const formatPrice = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return `${formatPriceDigits(n)} ${t("ID")}`;
  };

  const searchProducts = Array.isArray(results.products)
    ? results.products
    : [];
  const searchStores = Array.isArray(results.stores) ? results.stores : [];
  const searchBrands = Array.isArray(results.brands) ? results.brands : [];
  const searchCompanies = Array.isArray(results.companies)
    ? results.companies
    : [];
  const searchCategories = Array.isArray(results.categories)
    ? results.categories
    : [];
  const searchCategoryTypes = Array.isArray(results.categoryTypes)
    ? results.categoryTypes
    : [];
  const searchStoreTypes = Array.isArray(results.storeTypes)
    ? results.storeTypes
    : [];

  const hasResults =
    searchProducts.length > 0 ||
    searchStores.length > 0 ||
    searchBrands.length > 0 ||
    searchCompanies.length > 0 ||
    searchCategories.length > 0 ||
    searchCategoryTypes.length > 0 ||
    searchStoreTypes.length > 0;

  return (
    <Box
      sx={{
        pt: { xs: "max(12px, env(safe-area-inset-top))", sm: 5 },
      }}
    >
      {/* {bannerAdsWithImages.length > 0 && (
        <Box
          sx={{
            position: "relative",
            backgroundColor:
              theme.palette.mode === "dark" ? "#121212" : "#ffffff",
            borderRadius: { xs: 2, md: 3 },
            mb: 2,
            boxSizing: "border-box",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "lg",
              margin: "0 auto",
              height: { xs: "150px", sm: "200px", md: "250px" },
              borderRadius: { xs: 2, md: 3 },
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            }}
          >
            <Slider {...bannerSettings}>
              {bannerAdsWithImages.map((ad, index) => (
                <div key={ad._id || index}>
                  <img
                    onClick={() =>
                      ad.brandId
                        ? navigate(`/brands/${ad.brandId}`)
                        : ad.storeId
                          ? navigate(`/stores/${ad.storeId}`)
                          : ad.giftId
                            ? navigate(`/gifts/${ad.giftId}`)
                            : null
                    }
                    src={ad.src || ad}
                    alt={`Banner ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      cursor:
                        ad.brandId || ad.storeId || ad.giftId
                          ? "pointer"
                          : "default",
                    }}
                  />
                </div>
              ))}
            </Slider>
          </Box>
        </Box>
      )} */}

      <Paper
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: "20px",
          overflow: "hidden",
          border: `1px solid ${isDark ? alpha("#fff", 0.08) : alpha("#1e6fd9", 0.1)}`,
          background: isDark
            ? `linear-gradient(150deg, ${alpha("#1e6fd9", 0.18)} 0%, ${alpha("#6366f1", 0.08)} 45%, ${alpha("#0f1927", 0.95)} 100%)`
            : `linear-gradient(150deg, ${alpha("#1e6fd9", 0.1)} 0%, ${alpha("#6366f1", 0.04)} 40%, #fff 100%)`,
          boxShadow: isDark
            ? `0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 ${alpha("#fff", 0.06)}`
            : `0 4px 24px ${alpha("#1e6fd9", 0.08)}, inset 0 1px 0 ${alpha("#fff", 0.9)}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.25,
            pt: 1.25,
            pb: 1,
          }}
        >
          <IconButton
            type="button"
            onClick={handleBack}
            aria-label={t("Back")}
            size="small"
            sx={{
              width: 38,
              height: 38,
              flexShrink: 0,
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              bgcolor: isDark ? alpha("#fff", 0.08) : alpha("#1e6fd9", 0.08),
              border: `1px solid ${isDark ? alpha("#fff", 0.1) : alpha("#1e6fd9", 0.14)}`,
              color: isDark ? "rgba(255,255,255,0.9)" : "primary.main",
              "&:hover": {
                bgcolor: isDark ? alpha("#fff", 0.14) : alpha("#1e6fd9", 0.14),
                transform: "scale(1.04)",
              },
              transition: "all 0.15s ease",
            }}
          >
            {isRtl ? <ArrowForwardIcon /> : <ArrowBackIcon />}
          </IconButton>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                fontSize: "0.68rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: isDark ? alpha("#93c5fd", 0.85) : "primary.main",
                lineHeight: 1.2,
              }}
            >
              {t("Searching", { defaultValue: "Searching" })}
            </Typography> */}
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 800,
                fontSize: { xs: "1.25rem", sm: "1.35rem" },
                color: isDark ? alpha("#93c5fd", 0.85) : "primary.main",
                lineHeight: 1.25,
              }}
            >
              {t("Search")}
            </Typography>
          </Box>

          {/* <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #1e6fd9 0%, #6366f1 100%)",
              boxShadow: `0 4px 14px ${alpha("#1e6fd9", 0.4)}`,
            }}
          >
            <SearchIcon sx={{ fontSize: 20, color: "#fff" }} />
          </Box> */}
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            px: 1.5,
            pb: 1.5,
          }}
        >
          <TextField
            fullWidth
            autoFocus
            placeholder={t("Search for products, stores and more...")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchClick();
              }
            }}
            InputProps={{
              // startAdornment: (
              //   <InputAdornment position="start">
              //     <SearchIcon
              //       sx={{
              //         fontSize: 20,
              //         color: isDark
              //           ? "rgba(255,255,255,0.45)"
              //           : "action.active",
              //       }}
              //     />
              //   </InputAdornment>
              // ),
              endAdornment:
                (query || "").length > 0 ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label={t("Clear")}
                      onClick={() => {
                        setQuery("");
                        setSearchParams({}, { replace: true });
                        setSearched(false);
                        setResults({
                          products: [],
                          stores: [],
                          brands: [],
                          companies: [],
                          categories: [],
                          categoryTypes: [],
                          storeTypes: [],
                        });
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "14px",
                bgcolor: isDark ? alpha("#fff", 0.06) : "#fff",
                fontWeight: 500,
                "& fieldset": {
                  borderColor: isDark
                    ? alpha("#fff", 0.1)
                    : alpha("#1e6fd9", 0.16),
                },
                "&:hover fieldset": {
                  borderColor: isDark
                    ? alpha("#fff", 0.18)
                    : alpha("#1e6fd9", 0.32),
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                  borderWidth: 2,
                },
              },
            }}
          />
          <IconButton
            onClick={handleSearchClick}
            disabled={loading || (query || "").trim().length < 2}
            aria-label={t("Search")}
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
              borderRadius: "14px",
              bgcolor: "primary.main",
              color: "#fff",
              boxShadow: `0 4px 14px ${alpha("#1e6fd9", 0.35)}`,
              "&:hover": {
                bgcolor: "primary.dark",
                transform: "scale(1.04)",
              },
              "&.Mui-disabled": {
                bgcolor: isDark ? alpha("#fff", 0.08) : alpha("#1e6fd9", 0.2),
                color: isDark ? alpha("#fff", 0.35) : alpha("#1e6fd9", 0.5),
                boxShadow: "none",
              },
              transition: "all 0.15s ease",
            }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              <SearchIcon sx={{ fontSize: 22 }} />
            )}
          </IconButton>
        </Box>
      </Paper>

      {(query || "").trim().length < 2 && recentSearches.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", py: 4 }}
        >
          {t("No recent searches")}
        </Typography>
      )}

      {(query || "").trim().length < 2 && recentSearches.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 0.5,
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "action.hover",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <HistoryIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={600}>
                {t("Recent searches")}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={handleClearRecent}
              sx={{ color: "text.secondary" }}
              title={t("Clear all")}
              aria-label={t("Clear all")}
            >
              <DeleteSweepIcon fontSize="small" />
            </IconButton>
          </Box>
          <List disablePadding>
            {recentSearches.slice(0, 5).map((term) => (
              <ListItemButton
                key={term}
                onClick={() => handleRecentClick(term)}
                sx={{
                  py: 1.25,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                </ListItemAvatar>
                <ListItemText
                  primary={term}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => handleRemoveRecent(e, term)}
                  sx={{
                    color: "text.secondary",
                    "&:hover": { color: "error.main" },
                  }}
                  aria-label={t("Remove from history")}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      {(query || "").trim().length < 2 && (
        <>
          <Paper
            elevation={0}
            sx={{
              mt: recentSearches.length > 0 ? 1.5 : 0,
              mb: 1.5,
              p: 1.5,
              borderRadius: 0.5,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? alpha("#fff", 0.04) : "#fff",
            }}
          >
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <SearchIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={800}>
                {t("Trending searches", { defaultValue: "Trending searches" })}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {suggestedSearches.map((term) => (
                <Chip
                  key={term}
                  clickable
                  label={term}
                  onClick={() => handleRecentClick(term)}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 99,
                    bgcolor: isDark ? alpha("#fff", 0.07) : alpha("#1e6fd9", 0.07),
                    "&:hover": {
                      bgcolor: isDark
                        ? alpha("#1e6fd9", 0.18)
                        : alpha("#1e6fd9", 0.12),
                    },
                  }}
                />
              ))}
            </Box>
          </Paper>
          <BrandShowcase
            brands={brandShowcaseSlice}
            sx={SEARCH_SHOWCASE_SURFACE_SX}
          />
        </>
      )}

      {searched &&
        !loading &&
        !hasResults &&
        (query || "").trim().length >= 2 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 4 }}
          >
            {t("No results found")}
          </Typography>
        )}

      {searched && hasResults && (query || "").trim().length >= 2 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 0.5,
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {searchStoreTypes.length > 0 && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <StorefrontIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t("Store Types")}
                </Typography>
              </Box>
              <List disablePadding>
                {searchStoreTypes.map((storeType) => (
                  <ListItemButton
                    key={getEntityId(storeType._id) || storeType.name}
                    onClick={() => handleStoreTypeClick(storeType)}
                    sx={{
                      py: 1.5,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "grey.200",
                        }}
                      >
                        {storeType.picture ? (
                          <img
                            src={resolveMediaUrl(storeType.picture)}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : storeType.icon ? (
                          <Typography component="span" sx={{ fontSize: 22 }}>
                            {storeType.icon}
                          </Typography>
                        ) : (
                          <StorefrontIcon sx={{ color: "grey.600" }} />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        getLocalizedField(storeType, "name", dataLanguage) ||
                        storeType.name
                      }
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                ))}
              </List>
              <Divider />
            </>
          )}

          {searchCategories.length > 0 && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CategoryIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t("Categories")}
                </Typography>
              </Box>
              <List disablePadding>
                {searchCategories.map((cat) => (
                  <ListItemButton
                    key={getEntityId(cat._id) || cat.name}
                    onClick={() => handleCategoryClick(cat)}
                    sx={{
                      py: 1.5,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "grey.200",
                        }}
                      >
                        {cat.image ? (
                          <img
                            src={resolveMediaUrl(cat.image)}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <CategoryIcon sx={{ color: "grey.600" }} />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        getLocalizedField(cat, "name", dataLanguage) || cat.name
                      }
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                ))}
              </List>
              <Divider />
            </>
          )}

          {searchCategoryTypes.length > 0 && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CategoryIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t("Category types")}
                </Typography>
              </Box>
              <List disablePadding>
                {searchCategoryTypes.map((hit) => (
                  <ListItemButton
                    key={`${getEntityId(hit.category?._id)}-${getEntityId(hit.type?._id)}`}
                    onClick={() => handleCategoryTypeClick(hit)}
                    sx={{
                      py: 1.5,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "grey.200",
                        }}
                      >
                        {hit.category.image ? (
                          <img
                            src={resolveMediaUrl(hit.category.image)}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <CategoryIcon sx={{ color: "grey.600" }} />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        getLocalizedField(hit.type, "name", dataLanguage) ||
                        hit.type.name
                      }
                      secondary={
                        getLocalizedField(hit.category, "name", dataLanguage) ||
                        hit.category.name
                      }
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondaryTypographyProps={{ fontSize: "0.8rem" }}
                    />
                  </ListItemButton>
                ))}
              </List>
              <Divider />
            </>
          )}

          {searchProducts.length > 0 && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CategoryIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t("Products")}
                </Typography>
              </Box>
              <List disablePadding>
                {searchProducts.map((p, i) => (
                  <ListItemButton
                    key={p._id}
                    onClick={() => handleProductClick(p)}
                    sx={{
                      py: 1.5,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "grey.200",
                          objectFit: "contain",
                        }}
                      >
                        {p.image && (
                          <img
                            src={resolveMediaUrl(p.image)}
                            alt={p.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        )}
                        {!p.image && (
                          <CategoryIcon sx={{ color: "grey.600" }} />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        getLocalizedField(p, "name", dataLanguage) || p.name
                      }
                      secondary={
                        [
                          formatPrice(p.newPrice) || formatPrice(p.price),
                          p.brandId?.statusAll === "off"
                            ? null
                            : getLocalizedField(
                                p.brandId,
                                "name",
                                dataLanguage,
                              ) || p.brandId?.name,
                          getLocalizedField(p.storeId, "name", dataLanguage) ||
                            p.storeId?.name,
                        ]
                          .filter(Boolean)
                          .join(" • ") || undefined
                      }
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                ))}
              </List>
              <Divider />
            </>
          )}

          {searchStores.length > 0 && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <StorefrontIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t("Stores")}
                </Typography>
              </Box>
              <List disablePadding>
                {searchStores.map((s) => (
                  <ListItemButton
                    key={s._id}
                    onClick={() => handleStoreClick(s._id)}
                    sx={{
                      py: 1.5,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={s.logo ? resolveMediaUrl(s.logo) : undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "grey.200",
                        }}
                      >
                        {!s.logo && (
                          <StorefrontIcon sx={{ color: "grey.600" }} />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        getLocalizedField(s, "name", dataLanguage) || s.name
                      }
                      secondary={
                        s.storeTypeId?.name
                          ? getLocalizedField(
                              s.storeTypeId,
                              "name",
                              dataLanguage,
                            ) || t(s.storeTypeId.name)
                          : undefined
                      }
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                ))}
              </List>
              <Divider />
            </>
          )}

          {searchBrands.length > 0 && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <BusinessIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t("Brands")}
                </Typography>
              </Box>
              <List disablePadding>
                {searchBrands.map((b) => (
                  <ListItemButton
                    key={b._id}
                    onClick={() => handleBrandClick(b._id)}
                    sx={{
                      py: 1.5,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={b.logo ? resolveMediaUrl(b.logo) : undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "grey.200",
                        }}
                      >
                        {!b.logo && <BusinessIcon sx={{ color: "grey.600" }} />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        getLocalizedField(b, "name", dataLanguage) || b.name
                      }
                      secondary={
                        b.brandTypeId?.name
                          ? getLocalizedField(
                              b.brandTypeId,
                              "name",
                              dataLanguage,
                            ) || t(b.brandTypeId.name)
                          : undefined
                      }
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}

          {searchCompanies.length > 0 && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <BusinessIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t("Companies")}
                </Typography>
              </Box>
              <List disablePadding>
                {searchCompanies.map((c) => (
                  <ListItemButton
                    key={c._id}
                    onClick={() => handleCompanyClick(c._id)}
                    sx={{
                      py: 1.5,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={c.logo ? resolveMediaUrl(c.logo) : undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "grey.200",
                        }}
                      >
                        {!c.logo && <BusinessIcon sx={{ color: "grey.600" }} />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        getLocalizedField(c, "name", dataLanguage) || c.name
                      }
                      secondary={
                        c.brandTypeId?.name
                          ? getLocalizedField(
                              c.brandTypeId,
                              "name",
                              dataLanguage,
                            ) || t(c.brandTypeId.name)
                          : undefined
                      }
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}
        </Paper>
      )}

      <ProductDetailDialog
        open={productDialogOpen}
        onClose={() => {
          setProductDialogOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        candidateProducts={searchProducts}
        onProductChange={setSelectedProduct}
      />
    </Box>
  );
};

export default SearchPage;
