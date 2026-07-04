import React, { memo } from "react";
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import { useTranslation } from "react-i18next";

/** Small data-driven badges — backend has no `badge` field yet; safe no-op until it does. */
const BADGE_STYLES = {
  new: { bg: "#22C55E", label: "New" },
  popular: { bg: "#8B5CF6", label: "Popular" },
  trending: { bg: "#EC4899", label: "Trending" },
};

/** Deterministic accent per store type — cycles a fixed palette so colors stay stable across renders. */
const ICON_COLOR_PALETTE = [
  "#22C55E",
  "#EC4899",
  "#EF4444",
  "#64748B",
  "#F97316",
  "#8B5CF6",
  "#06B6D4",
  "#EAB308",
];

export function getStoreTypeAccentColor(id) {
  const key = String(id || "");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return ICON_COLOR_PALETTE[hash % ICON_COLOR_PALETTE.length];
}

function formatStoreCount(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

const StoreTypeCard = memo(function StoreTypeCard({
  icon,
  label,
  count,
  badge,
  selected,
  onSelect,
  accentColor,
  isAll,
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.palette.mode === "dark";
  const formattedCount = formatStoreCount(count);
  const badgeStyle = badge ? BADGE_STYLES[badge] : null;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.();
    }
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={
        formattedCount
          ? `${label}, ${formattedCount} ${t("stores", { defaultValue: "stores" })}`
          : label
      }
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      sx={{
        position: "relative",
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        width: { xs: 108, sm: 116, md: 122 },
        minHeight: { xs: 100, sm: 106, md: 110 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.4,
        px: 1,
        py: 1.25,
        borderRadius: "22px",
        cursor: "pointer",
        userSelect: "none",
        outline: "none",
        transition:
          "transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 250ms ease, background 250ms ease, border-color 250ms ease",
        ...(selected
          ? {
              background: "linear-gradient(135deg, #1E6FD9 0%, #4A90E2 100%)",
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow:
                "0 10px 26px rgba(30,111,217,0.42), 0 0 0 3px rgba(30,111,217,0.16)",
              transform: "scale(1.04)",
            }
          : {
              background: isDark ? alpha("#fff", 0.06) : "#F8F9FB",
              border: `1px solid ${isDark ? alpha("#fff", 0.09) : alpha("#0d111c", 0.07)}`,
              boxShadow: isDark
                ? "0 2px 10px rgba(0,0,0,0.25)"
                : "0 2px 10px rgba(15,23,42,0.05)",
            }),
        "&:hover": selected
          ? undefined
          : {
              transform: "translateY(-3px)",
              borderColor: "var(--brand-primary-blue, #1E6FD9)",
              boxShadow: isDark
                ? "0 8px 22px rgba(0,0,0,0.35)"
                : "0 8px 22px rgba(30,111,217,0.14)",
            },
        "&:active": {
          transform: selected ? "scale(1.01)" : "translateY(-1px) scale(0.98)",
        },
        "&:focus-visible": {
          boxShadow: `0 0 0 3px ${alpha("#1E6FD9", 0.45)}`,
        },
      }}
    >
      {badgeStyle && (
        <Box
          sx={{
            position: "absolute",
            top: 6,
            right: 6,
            px: 0.7,
            py: 0.15,
            borderRadius: "999px",
            bgcolor: badgeStyle.bg,
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.55rem",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.4,
              letterSpacing: "0.02em",
            }}
          >
            {t(badgeStyle.label, { defaultValue: badgeStyle.label })}
          </Typography>
        </Box>
      )}

      {isAll ? (
        <HomeRoundedIcon
          sx={{
            fontSize: { xs: 32, sm: 36 },
            color: selected ? "#fff" : "var(--brand-primary-blue, #1E6FD9)",
          }}
        />
      ) : (
        <Box
          sx={{
            width: { xs: 40, sm: 44 },
            height: { xs: 40, sm: 44 },
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: selected
              ? "rgba(255,255,255,0.22)"
              : alpha(accentColor || "#1E6FD9", isDark ? 0.28 : 0.16),
            transition: "background 250ms ease",
          }}
        >
          {icon ? (
            <Box
              component="span"
              sx={{
                fontSize: { xs: "1.35rem", sm: "1.5rem" },
                lineHeight: 1,
              }}
            >
              {icon}
            </Box>
          ) : (
            <HomeRoundedIcon
              sx={{
                fontSize: { xs: 22, sm: 24 },
                color: selected ? "#fff" : accentColor || "text.secondary",
              }}
            />
          )}
        </Box>
      )}

      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "0.74rem",
          lineHeight: 1.2,
          textAlign: "center",
          color: selected ? "#fff" : "text.primary",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          wordBreak: "break-word",
        }}
      >
        {label}
      </Typography>

      {formattedCount && (
        <Typography
          sx={{
            fontSize: "0.62rem",
            fontWeight: 600,
            color: selected
              ? "rgba(255,255,255,0.85)"
              : isDark
                ? alpha("#fff", 0.5)
                : "text.secondary",
            lineHeight: 1,
          }}
        >
          {formattedCount} {t("stores", { defaultValue: "stores" })}
        </Typography>
      )}
    </Box>
  );
});

export default StoreTypeCard;
