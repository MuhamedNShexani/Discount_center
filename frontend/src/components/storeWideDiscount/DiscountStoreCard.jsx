import React, { memo } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import RotatingDiscountOffer from "./RotatingDiscountOffer";

export const ORANGE_ACCENT = "#f97316";

const DiscountStoreCard = memo(function DiscountStoreCard({
  entry,
  isDark,
  onClick,
  locName,
  t,
}) {
  const store = entry?.store;
  if (!store) return null;
  const storeName = locName(store) || store.name || "";
  const logo = resolveMediaUrl(store.logo);

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        cursor: "pointer",
        borderRadius: "16px",
        overflow: "hidden",
        height: "100%",
        bgcolor: isDark ? alpha("#fff", 0.05) : "#fff",
        border: `1px solid ${isDark ? alpha("#fff", 0.08) : alpha(ORANGE_ACCENT, 0.18)}`,
        boxShadow: isDark
          ? "0 4px 14px rgba(0,0,0,0.28)"
          : "0 4px 14px rgba(15,23,42,0.06)",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: isDark
            ? "0 8px 24px rgba(0,0,0,0.35)"
            : "0 8px 24px rgba(249,115,22,0.12)",
        },
      }}
    >
      <Box
        sx={{
          height: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: isDark ? alpha(ORANGE_ACCENT, 0.12) : "#fff7ed",
        }}
      >
        {logo ? (
          <Box
            component="img"
            src={logo}
            alt={storeName}
            sx={{
              width: 72,
              height: 72,
              borderRadius: "16px",
              objectFit: "cover",
            }}
          />
        ) : (
          <StorefrontIcon sx={{ fontSize: 48, color: ORANGE_ACCENT }} />
        )}
      </Box>
      <CardContent
        sx={{
          p: 1.5,
          "&:last-child": { pb: 1.5 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "0.9rem",
            lineHeight: 1.3,
            mb: 0.75,
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
      </CardContent>
    </Card>
  );
});

export default DiscountStoreCard;
