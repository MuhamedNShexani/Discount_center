import React, { memo } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { alpha, useTheme } from "@mui/material/styles";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useTranslation } from "react-i18next";
import { isRtlLanguage } from "../utils/isRtlLanguage";

/** Compact promo banner — links to /gifts, count is informational only. */
const SpecialOffersBanner = memo(function SpecialOffersBanner({ count }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);

  return (
    <Box
      component={Link}
      to="/gifts"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        textDecoration: "none",
        p: { xs: 1.5, sm: 1.75 },
        borderRadius: "18px",
        background: isDark
          ? "linear-gradient(120deg, #3b2350 0%, #1e1533 100%)"
          : "linear-gradient(120deg, #f3e8ff 0%, #ede9fe 100%)",
        border: `1px solid ${isDark ? alpha("#a855f7", 0.28) : alpha("#a855f7", 0.18)}`,
        boxShadow: isDark
          ? "0 4px 18px rgba(168,85,247,0.18)"
          : "0 4px 16px rgba(168,85,247,0.12)",
        transition: "transform 200ms ease, box-shadow 200ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: isDark
            ? "0 10px 26px rgba(168,85,247,0.28)"
            : "0 10px 24px rgba(168,85,247,0.2)",
        },
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 46,
          height: 46,
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
          boxShadow: "0 4px 12px rgba(168,85,247,0.4)",
        }}
      >
        <CardGiftcardIcon sx={{ color: "#fff", fontSize: 24 }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: "0.92rem",
            color: isDark ? "#fff" : "#1f0a3d",
            lineHeight: 1.25,
          }}
        >
          {t("Special Offers & Discounts", {
            defaultValue: "Special Offers & Discounts",
          })}
        </Typography>
        <Typography
          noWrap
          sx={{
            fontSize: "0.74rem",
            color: isDark ? alpha("#fff", 0.65) : alpha("#1f0a3d", 0.65),
          }}
        >
          {count
            ? t("{{count}} exclusive deals from top stores", {
                count,
                defaultValue: "{{count}} exclusive deals from top stores",
              })
            : t("Exclusive deals from top stores", {
                defaultValue: "Exclusive deals from top stores",
              })}
        </Typography>
      </Box>

      <Button
        variant="contained"
        size="small"
        sx={{
          flexShrink: 0,
          textTransform: "none",
          fontWeight: 800,
          borderRadius: "999px",
          px: 1.6,
          py: 0.6,
          minHeight: 0,
          background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
          boxShadow: "0 4px 12px rgba(124,58,237,0.4)",
          "&:hover": {
            background: "linear-gradient(135deg, #9333ea 0%, #6d28d9 100%)",
          },
        }}
        endIcon={
          isRtl ? (
            <ArrowBackIosNewIcon sx={{ fontSize: "12px !important" }} />
          ) : (
            <ArrowForwardIosIcon sx={{ fontSize: "12px !important" }} />
          )
        }
      >
        {t("View Deals", { defaultValue: "View Deals" })}
      </Button>
    </Box>
  );
});

export default SpecialOffersBanner;
