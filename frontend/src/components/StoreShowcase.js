import React, { memo } from "react";
import { Box, Typography, IconButton, Button } from "@mui/material";
import { Link } from "react-router-dom";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BusinessIcon from "@mui/icons-material/Business";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import VerifiedIcon from "@mui/icons-material/Verified";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { alpha, useTheme } from "@mui/material/styles";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { useTranslation } from "react-i18next";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { useLocalizedContent } from "../hooks/useLocalizedContent";
import { useUserTracking } from "../hooks/useUserTracking";

const StoreShowcase = memo(function StoreShowcase({ stores }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { locName } = useLocalizedContent();
  const { isStoreFollowed, toggleFollowStore } = useUserTracking();
  const isDark = theme.palette.mode === "dark";
  const isRtl = i18n.dir() === "rtl";

  if (!stores || stores.length === 0) return null;

  const vipStores = stores.filter((s) => Boolean(s?.isVip));
  const displayStores = vipStores.length > 0 ? vipStores : stores;
  const isVipMode = vipStores.length > 0;

  const slideCount = displayStores.length;
  const clamp = (max) => Math.max(1, Math.min(max, slideCount));
  const desktopShow = clamp(4);

  const settings = {
    dots: false,
    infinite: slideCount > desktopShow,
    speed: 4500,
    autoplay: slideCount > desktopShow,
    autoplaySpeed: 900,
    cssEase: "linear",
    slidesToShow: desktopShow,
    slidesToScroll: 1,
    arrows: false,
    variableWidth: true,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: clamp(3), variableWidth: true } },
      { breakpoint: 600, settings: { slidesToShow: clamp(2), variableWidth: true } },
    ],
  };

  return (
    <Box
      sx={{
        borderRadius: "20px",
        overflow: "hidden",
        background: isDark
          ? "linear-gradient(145deg, #0f1f3d 0%, #162035 100%)"
          : "linear-gradient(145deg, #f0f7ff 0%, #ffffff 100%)",
        border: isDark
          ? "1px solid rgba(30,111,217,0.25)"
          : "1px solid #dbeafe",
        boxShadow: isDark
          ? "0 4px 20px rgba(0,0,0,0.4)"
          : "0 4px 20px rgba(30,111,217,0.08)",
        my: { xs: 1.5, sm: 2 },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 2.5 },
          py: { xs: 1.2, sm: 1.4 },
          borderBottom: isDark
            ? "1px solid rgba(30,111,217,0.2)"
            : "1px solid #dbeafe",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              background: isVipMode
                ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                : "linear-gradient(135deg, #1E6FD9 0%, #4A90E2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isVipMode
                ? "0 3px 8px rgba(245,158,11,0.4)"
                : "0 3px 8px rgba(30,111,217,0.4)",
            }}
          >
            {isVipMode ? (
              <WorkspacePremiumIcon sx={{ fontSize: 16, color: "white" }} />
            ) : (
              <StorefrontIcon sx={{ fontSize: 16, color: "white" }} />
            )}
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "0.95rem", sm: "1.05rem" },
                color: isDark ? "rgba(255,255,255,0.95)" : "#111827",
                lineHeight: 1.2,
              }}
            >
              {t(isVipMode ? "VIP Stores" : "Featured Stores")}
            </Typography>
            {isVipMode && (
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? "rgba(245,158,11,0.8)" : "#b45309",
                  display: "block",
                  lineHeight: 1,
                  fontSize: "0.68rem",
                }}
              >
                {t("Exclusive Partners")}
              </Typography>
            )}
          </Box>
        </Box>

        <Button
          component={Link}
          to="/stores"
          size="small"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8rem",
            color: "var(--color-primary, #1E6FD9)",
            px: 1,
            py: 0.5,
            borderRadius: 2,
            "&:hover": {
              background: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(30,111,217,0.06)",
            },
          }}
        >
          {t("See All")}
        </Button>
      </Box>

      {/* Carousel */}
      <Box sx={{ px: { xs: 1, sm: 1.5 }, py: { xs: 1.5, sm: 2 } }}>
        <Slider {...settings}>
          {displayStores.map((store) => {
            const followed = isStoreFollowed?.(store._id);
            return (
              <Box key={store._id} sx={{ px: 0.6 }}>
                <Box
                  component={Link}
                  to={`/stores/${store._id}`}
                  sx={{
                    display: "block",
                    width: { xs: 168, sm: 190 },
                    textDecoration: "none",
                    borderRadius: "18px",
                    overflow: "hidden",
                    position: "relative",
                    bgcolor: isDark ? alpha("#fff", 0.05) : "#fff",
                    border: `1px solid ${isDark ? alpha("#fff", 0.08) : alpha("#0d111c", 0.08)}`,
                    boxShadow: isDark
                      ? "0 4px 16px rgba(0,0,0,0.3)"
                      : "0 4px 14px rgba(15,23,42,0.08)",
                    transition: "transform 220ms ease, box-shadow 220ms ease",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: isDark
                        ? "0 10px 26px rgba(0,0,0,0.4)"
                        : "0 10px 24px rgba(15,23,42,0.14)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "16 / 11",
                      overflow: "hidden",
                      background: isDark
                        ? "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)"
                        : "linear-gradient(160deg, #dbeafe 0%, #eff6ff 100%)",
                    }}
                  >
                    {store.logo ? (
                      <Box
                        component="img"
                        src={resolveMediaUrl(store.logo)}
                        alt={locName(store)}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BusinessIcon
                          sx={{
                            fontSize: 44,
                            color: isDark ? "rgba(30,111,217,0.7)" : "#3b82f6",
                          }}
                        />
                      </Box>
                    )}

                    <IconButton
                      aria-label={t("Follow", { defaultValue: "Follow" })}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFollowStore?.(store._id);
                      }}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 8,
                        [isRtl ? "left" : "right"]: 8,
                        width: 28,
                        height: 28,
                        bgcolor: alpha("#fff", 0.92),
                        "&:hover": { bgcolor: "#fff" },
                        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                      }}
                    >
                      {followed ? (
                        <FavoriteIcon sx={{ fontSize: 16, color: "#EF4444" }} />
                      ) : (
                        <FavoriteBorderIcon sx={{ fontSize: 16, color: "#374151" }} />
                      )}
                    </IconButton>
                  </Box>

                  <Box sx={{ p: 1.1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.5 }}>
                      <Typography
                        noWrap
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.82rem",
                          color: isDark ? "rgba(255,255,255,0.95)" : "#111827",
                          minWidth: 0,
                        }}
                      >
                        {locName(store)}
                      </Typography>
                      {store.isVip && (
                        <VerifiedIcon
                          sx={{ fontSize: 15, color: "#4A90E2", flexShrink: 0 }}
                        />
                      )}
                    </Box>

                    {store.isHasDelivery && (
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.4,
                          px: 0.9,
                          py: 0.25,
                          borderRadius: "999px",
                          bgcolor: isDark
                            ? alpha("#22C55E", 0.18)
                            : alpha("#22C55E", 0.12),
                        }}
                      >
                        <LocalShippingIcon
                          sx={{ fontSize: 12, color: "#22C55E" }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            color: "#16A34A",
                          }}
                        >
                          {t("Delivery")}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Slider>
      </Box>
    </Box>
  );
});

export default StoreShowcase;
