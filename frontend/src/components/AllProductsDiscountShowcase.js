import React, { memo, useCallback, useMemo } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import PercentIcon from "@mui/icons-material/Percent";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { useLocalizedContent } from "../hooks/useLocalizedContent";
import { useStoreWideDiscountDrawer } from "../hooks/useStoreWideDiscountDrawer";
import RotatingDiscountOffer from "./storeWideDiscount/RotatingDiscountOffer";
import {
  SHOWCASE_DISCOUNT_CARD_MIN_WIDTH,
  SHOWCASE_DISCOUNT_CARD_PREVIEW_LIMIT,
} from "../utils/showcaseDiscountOffers";

const AllProductsDiscountShowcase = memo(function AllProductsDiscountShowcase({
  items = [],
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { locName } = useLocalizedContent();
  const { openStoreWideDiscounts } = useStoreWideDiscountDrawer();
  const isDark = theme.palette.mode === "dark";

  const handleSeeAll = useCallback(() => {
    openStoreWideDiscounts();
  }, [openStoreWideDiscounts]);

  const displayItems = useMemo(
    () => items.slice(0, SHOWCASE_DISCOUNT_CARD_PREVIEW_LIMIT),
    [items],
  );
  const showAllCard = items.length > SHOWCASE_DISCOUNT_CARD_PREVIEW_LIMIT;

  if (!items?.length) return null;

  const cardShellSx = {
    flexShrink: 0,
    width: "max-content",
    minWidth: SHOWCASE_DISCOUNT_CARD_MIN_WIDTH,
    borderRadius: "16px",
    overflow: "hidden",
    bgcolor: isDark ? alpha("#fff", 0.05) : "#fff",
    border: `1px solid ${isDark ? alpha("#fff", 0.08) : alpha("#f97316", 0.18)}`,
    boxShadow: isDark
      ? "0 4px 14px rgba(0,0,0,0.28)"
      : "0 4px 14px rgba(15,23,42,0.06)",
    transition: "transform 180ms ease",
    "&:hover": { transform: "translateY(-2px)" },
  };

  return (
    <Box
      sx={{
        borderRadius: "20px",
        overflow: "hidden",
        background: isDark
          ? "linear-gradient(145deg, #2a1408 0%, #1a1208 100%)"
          : "linear-gradient(145deg, #fff7ed 0%, #ffffff 100%)",
        border: isDark
          ? "1px solid rgba(249,115,22,0.28)"
          : "1px solid #fed7aa",
        boxShadow: isDark
          ? "0 4px 20px rgba(0,0,0,0.4)"
          : "0 4px 20px rgba(249,115,22,0.1)",
        my: { xs: 1.5, sm: 2 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 2.5 },
          py: { xs: 1.2, sm: 1.4 },
          borderBottom: isDark
            ? "1px solid rgba(249,115,22,0.2)"
            : "1px solid #fed7aa",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 3px 8px rgba(249,115,22,0.4)",
            }}
          >
            <PercentIcon sx={{ fontSize: 16, color: "white" }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              color: isDark ? "rgba(255,255,255,0.95)" : "#111827",
            }}
          >
            {t("Stores with store-wide discounts", {
              defaultValue: "Stores with store-wide discounts",
            })}
          </Typography>
        </Box>
        <Button
          onClick={handleSeeAll}
          size="small"
          sx={{
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.8rem",
            color: "#f97316",
            px: 1.2,
            py: 0.5,
            borderRadius: "10px",
            bgcolor: isDark ? "rgba(249,115,22,0.12)" : "rgba(249,115,22,0.08)",
            border: "1px solid rgba(249,115,22,0.25)",
            "&:hover": {
              bgcolor: isDark
                ? "rgba(249,115,22,0.2)"
                : "rgba(249,115,22,0.14)",
            },
          }}
        >
          {t("See All")}
        </Button>
      </Box>

      <Box
        sx={{
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1.5, sm: 2 },
          display: "flex",
          gap: { xs: 1, sm: 1.2 },
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "thin",
          scrollbarColor: isDark ? "#4a5568 transparent" : "#d1d5db transparent",
          WebkitOverflowScrolling: "touch",
          "&::-webkit-scrollbar": { height: 4 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: isDark ? "#4a5568" : "#d1d5db",
            borderRadius: 4,
          },
        }}
      >
        {displayItems.map((entry) => {
          const store = entry.store;
          const storeId = store?._id;
          if (!storeId) return null;
          const storeName = locName(store) || store.name || "";
          const logo = resolveMediaUrl(store.logo);

          return (
            <Box
              key={String(storeId)}
              component={Link}
              to={`/stores/${storeId}`}
              sx={{
                ...cardShellSx,
                display: "block",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Box
                sx={{
                  height: 88,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isDark ? alpha("#f97316", 0.12) : "#fff7ed",
                }}
              >
                {logo ? (
                  <Box
                    component="img"
                    src={logo}
                    alt={storeName}
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: "14px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <StorefrontIcon sx={{ fontSize: 40, color: "#f97316" }} />
                )}
              </Box>
              <Box
                sx={{
                  p: 1.25,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    lineHeight: 1.25,
                    mb: 0.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  {storeName}
                </Typography>
                <RotatingDiscountOffer
                  entry={entry}
                  locName={locName}
                  t={t}
                  isDark={isDark}
                />
              </Box>
            </Box>
          );
        })}

        {showAllCard ? (
          <Box
            component="button"
            type="button"
            onClick={handleSeeAll}
            aria-label={t("See All")}
            sx={{
              ...cardShellSx,
              border: isDark
                ? "1px dashed rgba(249,115,22,0.45)"
                : "1px dashed rgba(249,115,22,0.4)",
              bgcolor: isDark
                ? "linear-gradient(145deg, rgba(249,115,22,0.18), rgba(249,115,22,0.06))"
                : "linear-gradient(145deg, #fff7ed, #ffffff)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              minHeight: 188,
              cursor: "pointer",
              font: "inherit",
              color: "inherit",
              p: 1.5,
              "&:hover": {
                transform: "translateY(-2px)",
                bgcolor: isDark
                  ? "linear-gradient(145deg, rgba(249,115,22,0.28), rgba(249,115,22,0.1))"
                  : "linear-gradient(145deg, #ffedd5, #fff7ed)",
              },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
                boxShadow: "0 3px 10px rgba(249,115,22,0.35)",
              }}
            >
              <ChevronRightIcon sx={{ fontSize: 28, color: "white" }} />
            </Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "0.88rem",
                color: isDark ? "#fdba74" : "#c2410c",
                textAlign: "center",
              }}
            >
              {t("See All")}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              {t("{{count}} more stores", {
                count: items.length - SHOWCASE_DISCOUNT_CARD_PREVIEW_LIMIT,
                defaultValue: `${items.length - SHOWCASE_DISCOUNT_CARD_PREVIEW_LIMIT} more stores`,
              })}
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
});

export default AllProductsDiscountShowcase;
