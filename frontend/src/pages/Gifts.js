import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Grid,
  Alert,
  Paper,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Skeleton,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { Store, Business } from "@mui/icons-material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import { giftAPI, storeAPI, brandAPI, adAPI } from "../services/api";
import BannerCarousel from "../components/BannerCarousel";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCityFilter } from "../context/CityFilterContext";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { useLocalizedContent } from "../hooks/useLocalizedContent";
import { getSyncErrorHint } from "../utils/apiError";
import {
  isExpiryStillValid,
  getExpiryRemainingInfo,
  formatExpiryDateDdMmYyyy,
  formatExpiryChipLabel,
  formatExpiryExpiresPrefixedLabel,
  expiryGiftCardBg,
} from "../utils/expiryDate";

/** Matches `SpecialOffersBanner` on MainPage */
const GIFT_ACCENT = "#a855f7";
const GIFT_ACCENT_DEEP = "#7c3aed";
const GIFT_GRADIENT_ICON = "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)";
const GIFT_GRADIENT_BTN = "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)";
const GIFT_GRADIENT_BTN_HOVER =
  "linear-gradient(135deg, #9333ea 0%, #6d28d9 100%)";

const Gifts = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const skeletonBase = isDark ? alpha("#fff", 0.08) : alpha("#0d111c", 0.07);
  const skeletonHighlight = isDark
    ? alpha("#fff", 0.12)
    : alpha("#0d111c", 0.1);
  const skeletonCardSx = {
    borderRadius: 3,
    overflow: "hidden",
    bgcolor: isDark ? alpha("#fff", 0.03) : "background.paper",
    border: `1px solid ${isDark ? alpha("#fff", 0.08) : alpha(GIFT_ACCENT, 0.18)}`,
    boxShadow: isDark
      ? "0 4px 20px rgba(0,0,0,0.35)"
      : "0 4px 16px rgba(168,85,247,0.12)",
  };
  const skeletonSx = (tone = "base") => ({
    bgcolor: tone === "highlight" ? skeletonHighlight : skeletonBase,
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  const { t } = useTranslation();
  const { locName, locDescription } = useLocalizedContent();
  const navigate = useNavigate();
  const [gifts, setGifts] = useState([]);
  const [filteredGifts, setFilteredGifts] = useState([]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const [, setStores] = useState([]);
  const [, setBrands] = useState([]);
  const [bannerAds, setBannerAds] = useState([]);
  const { selectedCity } = useCityFilter();

  // Filter states
  const [filters] = useState({
    search: "",
    store: "",
    brand: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [gifts, filters, selectedCity]);

  usePullToRefresh(fetchData);

  async function fetchData() {
    try {
      setLoading(true);
      const [giftsResponse, storesResponse, brandsResponse, adsResponse] =
        await Promise.all([
          giftAPI.getAll(),
          storeAPI.getAll(),
          brandAPI.getAll(),
          adAPI.getAll({ page: "gifts" }),
        ]);

      // Handle the API response structure: { success: true, data: gifts }
      const giftsData = Array.isArray(giftsResponse.data?.data)
        ? giftsResponse.data.data
        : [];
      const storesData = Array.isArray(storesResponse.data)
        ? storesResponse.data
        : [];
      const brandsData = Array.isArray(brandsResponse.data)
        ? brandsResponse.data
        : [];

      setGifts(giftsData);
      setStores(storesData);
      setBrands(brandsData);
      setBannerAds(adsResponse?.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          getSyncErrorHint(err, "Network error. Please check your connection."),
      );
      console.error("Error fetching gifts data:", err);
      // Set empty arrays on error to prevent "not iterable" errors
      setGifts([]);
      setStores([]);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }

  const bannerAdsWithImages = useMemo(
    () =>
      (bannerAds || [])
        .filter((ad) => !!ad.image)
        .map((ad) => ({
          _id: ad._id,
          src: resolveMediaUrl(ad.image),
          brandId: ad.brandId,
          storeId: ad.storeId,
          giftId: ad.giftId,
        })),
    [bannerAds],
  );

  const applyFilters = () => {
    // Ensure gifts is always an array
    if (!Array.isArray(gifts)) {
      setFilteredGifts([]);
      return;
    }

    let filtered = [...gifts];

    filtered = filtered.filter((gift) => {
      if (!gift?.expireDate) return true;
      return isExpiryStillValid(gift.expireDate);
    });

    // Search filter
    if (filters.search) {
      filtered = filtered.filter((gift) =>
        gift.description.toLowerCase().includes(filters.search.toLowerCase()),
      );
    }

    // Store filter
    if (filters.store) {
      filtered = filtered.filter(
        (gift) =>
          gift.storeId &&
          Array.isArray(gift.storeId) &&
          gift.storeId.some((store) => store._id === filters.store),
      );
    }

    // Brand filter
    if (filters.brand) {
      filtered = filtered.filter((gift) => gift.brandId?._id === filters.brand);
    }

    // City filter
    if (Array.isArray(filtered)) {
      filtered = filtered.filter((gift) => {
        if (!gift.storeId || gift.storeId.length === 0) {
          // If a gift is not associated with any store, it should probably be shown in all cities.
          // Or, depending on requirements, it could be hidden. I'll assume it should be shown.
          return true;
        }
        return gift.storeId.some((store) => store.storecity === selectedCity);
      });
    }

    // Sort by newest created first
    filtered.sort((a, b) => {
      const aTs = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTs = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (
        (Number.isFinite(bTs) ? bTs : 0) - (Number.isFinite(aTs) ? aTs : 0)
      );
    });

    setFilteredGifts(filtered);
  };
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  const renderGiftCard = (gift) => {
    // Safety check to ensure gift is a valid object
    if (!gift || typeof gift !== "object") {
      return null;
    }

    const giftExp = getExpiryRemainingInfo(gift.expireDate);
    const primaryStore =
      Array.isArray(gift.storeId) && gift.storeId.length > 0
        ? gift.storeId[0]
        : null;
    const brand = gift.brandId || null;

    const expiryChipSx = {
      position: "absolute",
      top: 6,
      left: 6,
      zIndex: 2,
      pointerEvents: "none",
      maxWidth: "calc(100% - 12px)",
      fontSize: { xs: "0.5rem", sm: "0.65rem", md: "0.7rem" },
      height: "auto",
      "& .MuiChip-label": {
        whiteSpace: "normal",
        textAlign: "left",
        display: "block",
        lineHeight: 1.2,
        px: 0.75,
        py: 0.25,
      },
    };

    return (
      <Card
        onClick={() => {
          setSelectedGift(gift);
          setDialogOpen(true);
        }}
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          height: { xs: "200px", sm: "250px", md: "280px" },
          width: "165px",
          borderRadius: 2,
          overflow: "hidden",
          cursor: "pointer",
          background: isDark
            ? "linear-gradient(120deg, #3b2350 0%, #1e1533 100%)"
            : "linear-gradient(120deg, #f3e8ff 0%, #ede9fe 100%)",
          border: `1px solid ${
            isDark ? alpha(GIFT_ACCENT, 0.28) : alpha(GIFT_ACCENT, 0.18)
          }`,
          boxShadow: isDark
            ? "0 4px 18px rgba(168,85,247,0.18)"
            : "0 4px 16px rgba(168,85,247,0.12)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 24px rgba(0,0,0,0.4)"
                : "0 8px 24px rgba(0,0,0,0.15)",
          },
        }}
      >
        {gift.expireDate ? (
          <Chip
            label={formatExpiryExpiresPrefixedLabel(giftExp, t)}
            size="small"
            sx={{
              ...expiryChipSx,
              bgcolor: expiryGiftCardBg(giftExp),
              color: "white",
            }}
          />
        ) : null}
        {/* Gift Image */}
        <Box
          sx={{
            width: { xs: "100%", sm: "150px", md: "200px" },
            height: { xs: 130, sm: "100%", md: "100%" },
            flexShrink: 0,
            position: "relative",
          }}
        >
          <CardMedia
            component="img"
            image={resolveMediaUrl(gift.image)}
            alt={locDescription(gift) || locName(gift) || ""}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </Box>

        {/* Gift Content */}
        <CardContent
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: { xs: 2, sm: 2.5, md: 3 },
            minHeight: 0,
          }}
        >
          {/* Store / Brand Header */}
          {activeTab === 0 && primaryStore && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 1.5,
                pb: 1,
                borderBottom: "1px solid",
                borderColor: theme.palette.divider,
                gap: 1,
              }}
            >
              {primaryStore.logo && (
                <Box
                  component="img"
                  src={resolveMediaUrl(primaryStore.logo)}
                  alt={locName(primaryStore)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1px solid rgba(0,0,0,0.1)",
                    flexShrink: 0,
                  }}
                />
              )}
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "0.7rem", sm: "0.85rem" },
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {locName(primaryStore)}
              </Typography>
            </Box>
          )}
          {activeTab === 1 && brand && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 1.5,
                pb: 1,
                borderBottom: "1px solid",
                borderColor: theme.palette.divider,
                gap: 1,
              }}
            >
              {brand.logo && (
                <Box
                  component="img"
                  src={resolveMediaUrl(brand.logo)}
                  alt={locName(brand)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1px solid rgba(0,0,0,0.1)",
                    flexShrink: 0,
                  }}
                />
              )}
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "0.7rem", sm: "0.85rem" },
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {locName(brand)}
              </Typography>
            </Box>
          )}

          {/* Main Description */}
          {/* <Typography
            variant="body1"
            sx={{
              alignItems: "center",
              fontSize: { xs: ".75rem", sm: "0.9rem", md: "1.5rem" },
              lineHeight: 1.4,
              mb: 2,
              color: theme.palette.text.primary,
              fontFamily: "NRT reg, Arial, sans-serif",
              overflow: { xs: "none", sm: "hidden", md: "hidden" },
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {gift.description}
          </Typography> */}

          {/* Store and Brand Info */}
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            {gift.storeId && gift.storeId.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                  <Store
                    sx={{
                      fontSize: { xs: 12, sm: 16, md: 16 },
                      mr: 1,
                      color: GIFT_ACCENT,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: "0.5rem", sm: "0.75rem", md: "0.75rem" },
                      color: theme.palette.text.secondary,
                      fontFamily: "NRT reg, Arial, sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {t("Stores")}:
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.5,
                  }}
                >
                  {gift.storeId.map((store, index) => (
                    <Typography
                      key={store._id}
                      variant="body2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/stores/${store._id}?tab=gifts`);
                      }}
                      sx={{
                        fontSize: {
                          xs: "0.5rem",
                          sm: "0.75rem",
                          md: "0.75rem",
                        },
                        color: theme.palette.text.secondary,
                        fontFamily: "NRT reg, Arial, sans-serif",
                        cursor: "pointer",
                        userSelect: "none",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: isDark
                          ? alpha(GIFT_ACCENT, 0.15)
                          : alpha(GIFT_ACCENT, 0.08),
                        border: `1px solid ${
                          isDark
                            ? alpha(GIFT_ACCENT, 0.28)
                            : alpha(GIFT_ACCENT, 0.16)
                        }`,
                        "&:hover": {
                          textDecoration: "underline",
                          color: GIFT_ACCENT_DEEP,
                          backgroundColor: isDark
                            ? alpha(GIFT_ACCENT, 0.24)
                            : alpha(GIFT_ACCENT, 0.14),
                        },
                      }}
                    >
                      {locName(store)}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

            {gift.brandId && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1,
                  cursor: "pointer",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/brands/${gift.brandId._id}?tab=gifts`);
                }}
              >
                <Business
                  sx={{
                    fontSize: 16,
                    mr: 1,
                    color: GIFT_ACCENT,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: "0.5rem", sm: "0.75rem", md: "0.75rem" },
                    color: theme.palette.text.secondary,
                    fontFamily: "NRT reg, Arial, sans-serif",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("Brand")}: {locName(gift.brandId)}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          py: { xs: 5, md: 10 },
          px: { xs: 0.5, sm: 1.5, md: 3 },
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <Skeleton
          variant="rounded"
          animation="wave"
          sx={{
            width: "100%",
            height: { xs: "160px", sm: "220px", md: "280px" },
            mt: 2,
            mb: 2,
            borderRadius: 3,
            ...skeletonSx("highlight"),
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.4)"
              : "0 8px 32px rgba(168,85,247,0.15)",
          }}
        />
        <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
          <Skeleton
            variant="rounded"
            animation="wave"
            width={260}
            height={42}
            sx={{ borderRadius: 2, ...skeletonSx() }}
          />
        </Box>
        <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {[110, 96, 118, 104].map((w, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              animation="wave"
              width={w}
              height={38}
              sx={{ borderRadius: "19px", ...skeletonSx() }}
            />
          ))}
        </Box>
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={i}>
              <Card sx={skeletonCardSx}>
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  sx={{
                    height: { xs: 130, sm: 160 },
                    ...skeletonSx("highlight"),
                  }}
                />
                <CardContent sx={{ p: { xs: 1, sm: 1.5 } }}>
                  <Skeleton
                    variant="text"
                    animation="wave"
                    width="85%"
                    height={24}
                    sx={skeletonSx()}
                  />
                  <Skeleton
                    variant="text"
                    animation="wave"
                    width="65%"
                    height={20}
                    sx={skeletonSx()}
                  />
                  <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, mb: 1 }}>
                    <Skeleton
                      variant="rounded"
                      animation="wave"
                      width={56}
                      height={20}
                      sx={{ borderRadius: 1, ...skeletonSx() }}
                    />
                    <Skeleton
                      variant="rounded"
                      animation="wave"
                      width={70}
                      height={20}
                      sx={{ borderRadius: 1, ...skeletonSx() }}
                    />
                  </Box>
                  <Skeleton
                    variant="rounded"
                    animation="wave"
                    width="62%"
                    height={28}
                    sx={{ borderRadius: 1.5, ...skeletonSx("highlight") }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const storeGifts = Array.isArray(filteredGifts)
    ? filteredGifts.filter(
        (gift) =>
          gift.storeId &&
          Array.isArray(gift.storeId) &&
          gift.storeId.length > 0,
      )
    : [];
  const brandGifts = Array.isArray(filteredGifts)
    ? filteredGifts.filter((gift) => gift.brandId)
    : [];

  return (
    <Box sx={{ py: { xs: 5, md: 10 }, px: { xs: 0.5, sm: 1.5, md: 3 } }}>
      {/* Ads banner — same as MainPage `BannerCarousel` */}
      <Box sx={{ mt: { xs: 2, md: 5 } }}>
        <BannerCarousel
          banners={bannerAdsWithImages}
          onBannerClick={(ad) => {
            if (ad.brandId) navigate(`/brands/${ad.brandId}`);
            else if (ad.storeId) navigate(`/stores/${ad.storeId}`);
            else if (ad.giftId) navigate(`/gifts/${ad.giftId}`);
          }}
        />
      </Box>

      {/* Header — matches MainPage Special Offers banner accent */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
          mt: { xs: 2, md: 3 },
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: GIFT_GRADIENT_ICON,
            boxShadow: "0 4px 12px rgba(168,85,247,0.4)",
          }}
        >
          <CardGiftcardIcon sx={{ color: "#fff", fontSize: "1.5rem" }} />
        </Box>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: isDark ? "#fff" : "#1f0a3d",
              lineHeight: 1.2,
            }}
          >
            {t("Gifts")}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: isDark ? alpha("#fff", 0.65) : alpha("#1f0a3d", 0.65),
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
            }}
          >
            {t("Special Offers & Discounts", {
              defaultValue: "Special Offers & Discounts",
            })}
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: 2,
          backgroundColor: isDark
            ? alpha(GIFT_ACCENT, 0.08)
            : alpha(GIFT_ACCENT, 0.06),
          border: `1px solid ${
            isDark ? alpha(GIFT_ACCENT, 0.22) : alpha(GIFT_ACCENT, 0.14)
          }`,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTabs-indicator": {
              background: GIFT_GRADIENT_BTN,
              height: 3,
              borderRadius: 2,
            },
            "& .MuiTab-root": {
              textTransform: "none",
              width: { xs: "125px", sm: "100px", md: "100%" },
              fontSize: { xs: "0.875rem", sm: "1rem" },
              fontWeight: 600,
              color: isDark ? alpha("#fff", 0.65) : alpha("#1f0a3d", 0.65),
            },
            "& .MuiTab-root.Mui-selected": {
              color: isDark ? GIFT_ACCENT : GIFT_ACCENT_DEEP,
              fontWeight: 800,
            },
            "& .MuiTab-root .MuiSvgIcon-root": {
              color: "inherit",
            },
          }}
        >
          {/* <Tab
            sx={{ width: { xs: "100px", sm: "100px", md: "100%" } }}
            label={`${t("All Gifts")} (${filteredGifts.length})`}
            icon={<CardGiftcard />}
            iconPosition="start"
          /> */}
          <Tab
            label={`${t("Store Gifts")} (${storeGifts.length})`}
            icon={<Store />}
            iconPosition="start"
          />
          <Tab
            label={`${t("Brand Gifts")} (${brandGifts.length})`}
            icon={<Business />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Content */}
      <Box>
        {/* {activeTab === 0 && (
          <Box>
            {filteredGifts.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  color: theme.palette.text.secondary,
                }}
              >
                <CardGiftcard sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  {t("No gifts available")}
                </Typography>
                <Typography variant="body1">
                  {t("No gifts match your current filters.")}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(2, 1fr)",
                  },
                  gap: 3,
                  width: "100%",
                }}
              >
                {filteredGifts.map((gift) => (
                  <Box key={gift._id} sx={{ display: "flex" }}>
                    {renderGiftCard(gift)}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )} */}

        {activeTab === 0 && (
          <Box>
            {storeGifts.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  color: theme.palette.text.secondary,
                }}
              >
                <Store sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  {t("No store gifts available")}
                </Typography>
                <Typography variant="body1">
                  {t("No store gifts match your current filters.")}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(2, 1fr)",
                  },
                  gap: 3,
                  width: "100%",
                }}
              >
                {storeGifts.map((gift) => (
                  <Box key={gift._id} sx={{ display: "flex" }}>
                    {renderGiftCard(gift)}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {brandGifts.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  color: theme.palette.text.secondary,
                }}
              >
                <Business sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  {t("No brand gifts available")}
                </Typography>
                <Typography variant="body1">
                  {t("No brand gifts match your current filters.")}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(2, 1fr)",
                  },
                  gap: 3,
                  width: "100%",
                }}
              >
                {brandGifts.map((gift) => (
                  <Box key={gift._id} sx={{ display: "flex" }}>
                    {renderGiftCard(gift)}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
      {/* Gift Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CardGiftcardIcon sx={{ color: GIFT_ACCENT }} />
            <Typography variant="h6" component="span">
              {t("Gift Information")}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedGift && (
            <Paper
              elevation={2}
              sx={{ p: 3, borderRadius: 3, bgcolor: "background.default" }}
            >
              {selectedGift.image && (
                <Box display="flex" justifyContent="center" mb={2}>
                  <img
                    src={resolveMediaUrl(selectedGift.image)}
                    alt={locName(selectedGift) || "Gift image"}
                    style={{
                      maxWidth: 220,
                      maxHeight: 220,
                      borderRadius: 16,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              )}
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography
                  variant="h8"
                  align="right"
                  textAlign="right"
                  justifyContent="right"
                  gutterBottom
                  sx={{ color: isDark ? "#fff" : "#000", fontWeight: 800 }}
                >
                  {locDescription(selectedGift)}
                </Typography>

                {selectedGift.brandId && (
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    sx={{ cursor: "pointer" }}
                    onClick={() => {
                      navigate(`/brands/${selectedGift.brandId._id}?tab=gifts`);
                    }}
                  >
                    <Business fontSize="small" color="action" />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      component="span"
                    >
                      {locName(selectedGift.brandId)}
                    </Typography>
                  </Box>
                )}

                {Array.isArray(selectedGift.storeId) &&
                  selectedGift.storeId.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.75,
                          mt: 0.5,
                        }}
                      >
                        {selectedGift.storeId.map((store) => (
                          <Chip
                            key={store._id}
                            label={locName(store)}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/stores/${store._id}?tab=gifts`);
                            }}
                            size="small"
                            sx={{
                              cursor: "pointer",
                              "&:hover": { opacity: 0.9 },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                {selectedGift.expireDate && (
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocalOfferIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {t("Expires")}:{" "}
                        {formatExpiryDateDdMmYyyy(selectedGift.expireDate)}
                      </Typography>
                    </Box>
                    {(() => {
                      const expInfo = getExpiryRemainingInfo(
                        selectedGift.expireDate,
                      );
                      const remain = formatExpiryChipLabel(expInfo, t);
                      return remain ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ pl: 3.5 }}
                        >
                          {remain}
                        </Typography>
                      ) : null;
                    })()}
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDialogOpen(false)}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 700,
              background: GIFT_GRADIENT_BTN,
              boxShadow: "0 4px 12px rgba(124,58,237,0.4)",
              "&:hover": { background: GIFT_GRADIENT_BTN_HOVER },
            }}
          >
            {t("Close")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Gifts;
