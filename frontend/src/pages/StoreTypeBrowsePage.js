import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Fade,
  IconButton,
  LinearProgress,
  Skeleton,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CategoryIcon from "@mui/icons-material/Category";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { categoryAPI, productAPI, storeTypeAPI } from "../services/api";
import { useLocalizedContent } from "../hooks/useLocalizedContent";
import { useCityFilter } from "../context/CityFilterContext";
import { useUserTracking } from "../hooks/useUserTracking";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { isExpiryStillValid } from "../utils/expiryDate";
import { isStoreTypeShownOnCategoriesList } from "../utils/storeTypeVisibility";
import { productStoreMatchesCity } from "../utils/cityMatch";
import { formatPriceDigits } from "../utils/formatPriceNumber";
import { isRtlLanguage } from "../utils/isRtlLanguage";
import ProductDetailDialog from "../components/ProductDetailDialog";
import ProductViewTracker from "../components/ProductViewTracker";
import CategoryBrowseCard, {
  CATEGORY_BROWSE_GRID_SX,
} from "../components/CategoryBrowseCard";
import StoreTypeCard, {
  getStoreTypeAccentColor,
} from "../components/StoreTypeCard";
import SectionHeader from "../components/SectionHeader";

const isDiscountValid = (product) => {
  const hasPriceDrop =
    product.previousPrice &&
    product.newPrice &&
    parseFloat(product.previousPrice) > parseFloat(product.newPrice);
  return Boolean(product.isDiscount) || Boolean(hasPriceDrop);
};

const calculateDiscount = (previousPrice, newPrice) => {
  if (
    previousPrice === undefined ||
    previousPrice === null ||
    newPrice === undefined ||
    newPrice === null
  ) {
    return null;
  }
  const prev = Number(previousPrice);
  const next = Number(newPrice);
  if (
    !Number.isFinite(prev) ||
    !Number.isFinite(next) ||
    prev <= 0 ||
    prev <= next
  ) {
    return null;
  }
  return Math.round(((prev - next) / prev) * 100);
};

export default function StoreTypeBrowsePage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  const { storeTypeId, categoryId } = useParams();
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);
  const { locName } = useLocalizedContent();
  const { selectedCity } = useCityFilter();
  const { recordView } = useUserTracking();
  const productViewRecordedRef = useRef(new Set());

  const accentColor = "var(--color-primary, #1E6FD9)";
  const cardBg = isDark ? "rgba(30,36,52,1)" : "#ffffff";

  const [storeTypes, setStoreTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [selectedCategoryType, setSelectedCategoryType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeStoreType = useMemo(
    () => storeTypes.find((st) => String(st._id) === String(storeTypeId)),
    [storeTypes, storeTypeId],
  );

  const activeCategory = useMemo(
    () => categories.find((c) => String(c._id) === String(categoryId)),
    [categories, categoryId],
  );

  const isIndex = !storeTypeId;
  const browseVisibleStoreTypes = useMemo(
    () => storeTypes.filter(isStoreTypeShownOnCategoriesList),
    [storeTypes],
  );
  const isCategoriesView = Boolean(storeTypeId && !categoryId);
  const isProductsView = Boolean(storeTypeId && categoryId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await storeTypeAPI.getAll();
        if (!cancelled) setStoreTypes(res.data || []);
      } catch {
        if (!cancelled) setStoreTypes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storeTypeId) {
      setCategories([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const st =
          activeStoreType ||
          (await storeTypeAPI.getAll()).data?.find(
            (s) => String(s._id) === String(storeTypeId),
          );
        if (!st) {
          setCategories([]);
          return;
        }
        const res = await categoryAPI.getByStoreType(st.name);
        if (!cancelled) setCategories(res.data || []);
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storeTypeId, activeStoreType]);

  useEffect(() => {
    if (!categoryId) {
      setProducts([]);
      setCategoryTypes([]);
      setSelectedCategoryType(null);
      return undefined;
    }

    let cancelled = false;
    const presetCategoryType = location.state?.categoryType;
    (async () => {
      setProductsLoading(true);
      setSelectedCategoryType(null);
      try {
        const [productsRes, typesRes] = await Promise.all([
          productAPI.getByCategory(categoryId),
          categoryAPI.getTypes(categoryId),
        ]);
        if (!cancelled) {
          setProducts(productsRes.data || []);
          const types = typesRes.data || [];
          setCategoryTypes(types);
          if (presetCategoryType?._id) {
            const match = types.find(
              (type) => String(type._id) === String(presetCategoryType._id),
            );
            if (match) setSelectedCategoryType(match);
          }
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setCategoryTypes([]);
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categoryId, location.state?.categoryType]);

  useEffect(() => {
    productViewRecordedRef.current = new Set();
  }, [categoryId]);

  const handleProductBecameVisible = useCallback(
    async (productId) => {
      const result = await recordView(productId);
      if (result?.success && result?.data?.viewCount != null) {
        setProducts((prev) =>
          prev.map((p) =>
            String(p._id) === String(productId)
              ? { ...p, viewCount: result.data.viewCount }
              : p,
          ),
        );
      }
    },
    [recordView],
  );

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const filteredProducts = useMemo(() => {
    return (products || []).filter((product) => {
      if (product?.expireDate && !isExpiryStillValid(product.expireDate)) {
        return false;
      }
      if (!productStoreMatchesCity(product, selectedCity)) return false;
      if (selectedCategoryType) {
        const typeId = product.categoryTypeId?._id ?? product.categoryTypeId;
        if (String(typeId) !== String(selectedCategoryType._id)) return false;
      }
      return true;
    });
  }, [products, selectedCity, selectedCategoryType]);

  const formatPrice = useCallback(
    (price) => {
      if (typeof price !== "number") return `${t("ID")} 0`;
      return ` ${formatPriceDigits(price)} ${t("ID")}`;
    },
    [t],
  );

  const handleBack = () => {
    navigate(-1);
  };

  const pageTitle = isIndex
    ? t("Store Types", { defaultValue: "Store Types" })
    : isProductsView
      ? locName(activeCategory) || t("Products")
      : locName(activeStoreType) || t("Categories");

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "background.default",
        pb: { xs: 10, sm: 4 },
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          bgcolor: "background.default",
          px: { xs: 1.5, sm: 2 },
          pt: "max(12px, env(safe-area-inset-top, 0px))",
          pb: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <IconButton onClick={handleBack} aria-label={t("Back")} size="small">
          {isRtl ? <ArrowForwardIcon /> : <ArrowBackIcon />}
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={800} noWrap>
            {pageTitle}
          </Typography>
          {isCategoriesView && activeStoreType && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {t("Choose a category", { defaultValue: "Choose a category" })}
            </Typography>
          )}
          {isProductsView && activeCategory && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {locName(activeStoreType)}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: { xs: 1.5, sm: 2 } }}>
        {isIndex && (
          <>
            <SectionHeader
              icon={StorefrontRoundedIcon}
              title={t("Store Types", { defaultValue: "Store Types" })}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(3, 1fr)",
                  sm: "repeat(4, 1fr)",
                  md: "repeat(6, 1fr)",
                },
                gap: 1.25,
              }}
            >
              {browseVisibleStoreTypes.map((type) => (
                <Box key={type._id}>
                  <StoreTypeCard
                    picture={type.picture || ""}
                    icon={type.icon || ""}
                    label={locName(type) || t(type.name)}
                    badge={type.badge}
                    accentColor={getStoreTypeAccentColor(type._id)}
                    selected={false}
                    onSelect={() =>
                      navigate(
                        `/store-types/${encodeURIComponent(String(type._id))}`,
                      )
                    }
                  />
                </Box>
              ))}
            </Box>
          </>
        )}

        {isCategoriesView && (
          <>
            {loading ? (
              <Box sx={CATEGORY_BROWSE_GRID_SX}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rounded"
                    sx={{
                      width: "100%",
                      aspectRatio: "4 / 3",
                      borderRadius: "16px",
                    }}
                  />
                ))}
              </Box>
            ) : categories.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <CategoryIcon sx={{ fontSize: 56, opacity: 0.25, mb: 1 }} />
                <Typography color="text.secondary">
                  {t("No categories found")}
                </Typography>
              </Box>
            ) : (
              <Box sx={CATEGORY_BROWSE_GRID_SX}>
                {categories.map((category) => (
                  <CategoryBrowseCard
                    key={category._id}
                    label={locName(category)}
                    image={category.image}
                    icon={category.icon}
                    onClick={() =>
                      navigate(
                        `/store-types/${storeTypeId}/category/${category._id}`,
                      )
                    }
                  />
                ))}
              </Box>
            )}
          </>
        )}

        {isProductsView && (
          <>
            {!productsLoading && categoryTypes.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  gap: 0.75,
                  overflowX: "auto",
                  mb: 1,
                  pb: 0.5,
                  "&::-webkit-scrollbar": { display: "none" },
                  scrollbarWidth: "none",
                }}
              >
                {[null, ...categoryTypes].map((type) => {
                  const isActive =
                    type === null
                      ? selectedCategoryType === null
                      : selectedCategoryType?._id === type._id;
                  return (
                    <Chip
                      key={type?._id ?? "all"}
                      label={type === null ? t("All Types") : locName(type)}
                      onClick={() => setSelectedCategoryType(type)}
                      size="small"
                      sx={{
                        flexShrink: 0,
                        borderRadius: 99,
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "0.72rem",
                        height: 28,
                        background: isActive
                          ? "linear-gradient(135deg, var(--color-primary,#1E6FD9) 0%, var(--color-secondary,#0d47a1) 100%)"
                          : isDark
                            ? "rgba(255,255,255,0.07)"
                            : "rgba(0,0,0,0.05)",
                        color: isActive
                          ? "#fff"
                          : isDark
                            ? "rgba(255,255,255,0.75)"
                            : "rgba(0,0,0,0.65)",
                        border: "none",
                        boxShadow: isActive
                          ? "0 2px 8px rgba(30,111,217,0.3)"
                          : "none",
                        transition: "all 0.18s ease",
                      }}
                    />
                  );
                })}
              </Box>
            )}

            {productsLoading ? (
              <Box sx={{ px: 0.5 }}>
                <LinearProgress
                  sx={{ height: 3, borderRadius: 1, mb: 2, opacity: 0.95 }}
                />
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 1,
                  }}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      variant="rounded"
                      sx={{ width: "100%", height: 168, borderRadius: 1 }}
                    />
                  ))}
                </Box>
              </Box>
            ) : filteredProducts.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  pt: 8,
                  color: "text.secondary",
                }}
              >
                <ShoppingCartIcon sx={{ fontSize: 56, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2">
                  {t("No products found")}
                </Typography>
              </Box>
            ) : (
              <Fade in timeout={240} key={String(categoryId)}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 1,
                    alignItems: "stretch",
                  }}
                >
                  {filteredProducts.map((product) => {
                    const discountPct = calculateDiscount(
                      product.previousPrice,
                      product.newPrice,
                    );
                    const hasDiscount = isDiscountValid(product);
                    const discountLabel =
                      discountPct !== null ? `-${discountPct}%` : t("Discount");

                    return (
                      <ProductViewTracker
                        key={product._id}
                        productId={product._id}
                        onVisible={handleProductBecameVisible}
                        recordedIdsRef={productViewRecordedRef}
                      >
                        <Card
                          onClick={() => handleProductClick(product)}
                          sx={{
                            cursor: "pointer",
                            width: "100%",
                            height: "100%",
                            borderRadius: 1,
                            overflow: "hidden",
                            backgroundColor: cardBg,
                            boxShadow: isDark
                              ? "0 2px 8px rgba(0,0,0,0.4)"
                              : "0 2px 8px rgba(0,0,0,0.07)",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}`,
                            display: "flex",
                            flexDirection: "column",
                            transition: "transform 0.15s ease",
                            "&:active": { transform: "scale(0.97)" },
                          }}
                        >
                          <Box sx={{ position: "relative", flexShrink: 0 }}>
                            {product.image ? (
                              <CardMedia
                                component="img"
                                image={resolveMediaUrl(product.image)}
                                alt={locName(product) || "Product"}
                                sx={{
                                  height: 90,
                                  objectFit: "contain",
                                  backgroundColor: isDark
                                    ? "rgba(255,255,255,0.04)"
                                    : "rgba(0,0,0,0.03)",
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  height: 90,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: isDark
                                    ? "rgba(255,255,255,0.04)"
                                    : "rgba(0,0,0,0.03)",
                                }}
                              >
                                <ShoppingCartIcon
                                  sx={{ fontSize: 28, opacity: 0.25 }}
                                />
                              </Box>
                            )}

                            {hasDiscount && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 4,
                                  left: 4,
                                  background:
                                    "linear-gradient(135deg,#e53e3e,#c53030)",
                                  color: "#fff",
                                  fontSize: "0.55rem",
                                  fontWeight: 800,
                                  px: 0.5,
                                  py: 0.2,
                                  borderRadius: 1,
                                  pointerEvents: "none",
                                  zIndex: 2,
                                  boxShadow: "0 2px 6px rgba(229,62,62,0.45)",
                                }}
                              >
                                {discountLabel}
                              </Box>
                            )}

                            {product.viewCount > 0 && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.25,
                                  backgroundColor: "rgba(0,0,0,0.6)",
                                  backdropFilter: "blur(4px)",
                                  color: "#fff",
                                  px: 0.5,
                                  py: 0.15,
                                  borderRadius: 1,
                                  fontSize: "0.55rem",
                                  fontWeight: 600,
                                  pointerEvents: "none",
                                  zIndex: 2,
                                }}
                              >
                                <VisibilityIcon sx={{ fontSize: "0.6rem" }} />
                                {product.viewCount}
                              </Box>
                            )}
                          </Box>

                          <CardContent
                            sx={{
                              p: 0.75,
                              pt: 0.5,
                              minHeight: 78,
                              flexGrow: 1,
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.25,
                            }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.68rem",
                                lineHeight: 1.25,
                                textAlign: "center",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                color: isDark
                                  ? "rgba(255,255,255,0.9)"
                                  : "rgba(0,0,0,0.85)",
                              }}
                            >
                              {locName(product) || "\u00A0"}
                            </Typography>

                            {product.storeId && locName(product.storeId) && (
                              <Typography
                                sx={{
                                  fontSize: "0.58rem",
                                  color: accentColor,
                                  fontWeight: 600,
                                  textAlign: "center",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {locName(product.storeId)}
                              </Typography>
                            )}

                            <Box sx={{ mt: "auto", pt: 0.25 }}>
                              {isDiscountValid(product) &&
                                product.previousPrice &&
                                Number(product.previousPrice) >
                                  Number(product.newPrice) && (
                                  <Typography
                                    sx={{
                                      fontSize: "0.58rem",
                                      textDecoration: "line-through",
                                      textAlign: "center",
                                      color: isDark
                                        ? "rgba(255,100,100,0.7)"
                                        : "rgba(200,0,0,0.55)",
                                      fontWeight: 500,
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {formatPrice(product.previousPrice)}
                                  </Typography>
                                )}
                              {product.newPrice && (
                                <Typography
                                  sx={{
                                    fontSize: "0.76rem",
                                    fontWeight: 800,
                                    textAlign: "center",
                                    color: "var(--color-secondary, #0d47a1)",
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {formatPrice(product.newPrice)}
                                </Typography>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </ProductViewTracker>
                    );
                  })}
                </Box>
              </Fade>
            )}
          </>
        )}
      </Box>

      <ProductDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        product={selectedProduct}
        candidateProducts={filteredProducts}
        onProductChange={setSelectedProduct}
      />
    </Box>
  );
}
