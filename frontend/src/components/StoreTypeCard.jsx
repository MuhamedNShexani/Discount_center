import React, { memo } from "react";
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import { useTranslation } from "react-i18next";
import { resolveMediaUrl } from "../utils/mediaUrl";

/** Small data-driven badges — backend has no `badge` field yet; safe no-op until it does. */
const BADGE_STYLES = {
  new: { bg: "#22C55E", label: "New" },
  popular: { bg: "#8B5CF6", label: "Popular" },
  trending: { bg: "#F97316", label: "New" },
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
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return n.toLocaleString();
}

const StoreTypeCard = memo(function StoreTypeCard({
  icon,
  picture,
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
  const pictureSrc = picture ? resolveMediaUrl(picture) : "";

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
        width: { xs: 112, sm: 118, md: 124 },
        minHeight: { xs: 138, sm: 144, md: 148 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 0,
        px: 0.75,
        pt: 1.25,
        pb: 1,
        borderRadius: "20px",
        cursor: "pointer",
        userSelect: "none",
        outline: "none",
        overflow: "hidden",
        transition:
          "transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 220ms ease, background 220ms ease, border-color 220ms ease",
        ...(selected
          ? {
              background: "linear-gradient(160deg, #1E6FD9 0%, #4A90E2 100%)",
              border: "1px solid rgba(255,255,255,0.28)",
              boxShadow: "0 10px 24px rgba(30,111,217,0.45)",
            }
          : {
              background: isDark
                ? "linear-gradient(180deg, #1a2332 0%, #141c28 100%)"
                : "#F8F9FB",
              border: `1px solid ${isDark ? alpha("#fff", 0.08) : alpha("#0d111c", 0.07)}`,
              boxShadow: isDark
                ? "0 2px 10px rgba(0,0,0,0.28)"
                : "0 2px 10px rgba(15,23,42,0.05)",
            }),
        "&:hover": selected
          ? {
              transform: "translateY(-2px)",
              boxShadow: "0 14px 28px rgba(30,111,217,0.5)",
            }
          : {
              transform: "translateY(-3px)",
              borderColor: "var(--brand-primary-blue, #1E6FD9)",
              boxShadow: isDark
                ? "0 8px 22px rgba(0,0,0,0.35)"
                : "0 8px 22px rgba(30,111,217,0.14)",
            },
        "&:active": {
          transform: selected ? "scale(0.98)" : "translateY(-1px) scale(0.98)",
        },
        "&:focus-visible": {
          boxShadow: `0 0 0 3px ${alpha("#1E6FD9", 0.45)}`,
        },
      }}
    >
      {badgeStyle && !selected && (
        <Box
          sx={{
            position: "absolute",
            top: 7,
            right: 7,
            px: 0.65,
            py: 0.2,
            borderRadius: "999px",
            bgcolor: badgeStyle.bg,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            zIndex: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.52rem",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.35,
              letterSpacing: "0.02em",
            }}
          >
            {t(badgeStyle.label, { defaultValue: badgeStyle.label })}
          </Typography>
        </Box>
      )}

      {/* Top visual — picture / icon area (~top half of card) */}
      <Box
        sx={{
          width: "100%",
          flex: "1 1 auto",
          minHeight: { xs: 68, sm: 72 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 0.5,
        }}
      >
        {isAll ? (
          <StorefrontRoundedIcon
            sx={{
              fontSize: { xs: 40, sm: 42 },
              color: selected ? "#fff" : "var(--brand-primary-blue, #1E6FD9)",
              filter: selected
                ? "drop-shadow(0 4px 10px rgba(0,0,0,0.2))"
                : "none",
            }}
          />
        ) : pictureSrc ? (
          <Box
            component="img"
            src={pictureSrc}
            alt={label}
            sx={{
              width: { xs: 100, sm: 80 },
              height: { xs: 100, sm: 80 },
              objectFit: "contain",
              display: "block",
              filter: selected
                ? "drop-shadow(0 4px 10px rgba(0,0,0,0.18))"
                : "drop-shadow(0 2px 6px rgba(0,0,0,0.22))",
            }}
          />
        ) : (
          <Box
            sx={{
              width: { xs: 60, sm: 64 },
              height: { xs: 60, sm: 64 },
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: selected
                ? "rgba(255,255,255,0.18)"
                : alpha(accentColor || "#1E6FD9", isDark ? 0.22 : 0.14),
            }}
          >
            {icon ? (
              <Box
                component="span"
                sx={{
                  fontSize: { xs: "1.75rem", sm: "1.9rem" },
                  lineHeight: 1,
                }}
              >
                {icon}
              </Box>
            ) : (
              <StorefrontRoundedIcon
                sx={{
                  fontSize: { xs: 30, sm: 32 },
                  color: selected ? "#fff" : accentColor || "text.secondary",
                }}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Bottom labels */}
      <Box
        sx={{
          width: "100%",
          textAlign: "center",
          mt: "auto",
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: "0.72rem", sm: "0.76rem" },
            lineHeight: 1.25,
            color: selected ? "#fff" : isDark ? "#fff" : "text.primary",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
            px: 0.25,
          }}
        >
          {label}
        </Typography>

        {formattedCount ? (
          <Typography
            sx={{
              mt: 0.35,
              fontSize: "0.6rem",
              fontWeight: 600,
              color: selected
                ? "rgba(255,255,255,0.82)"
                : isDark
                  ? alpha("#fff", 0.48)
                  : "text.secondary",
              lineHeight: 1.2,
            }}
          >
            {formattedCount} {t("stores", { defaultValue: "stores" })}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
});

export default StoreTypeCard;
