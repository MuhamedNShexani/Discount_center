import React, { memo } from "react";
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CategoryIcon from "@mui/icons-material/Category";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { resolveMediaUrl } from "../utils/mediaUrl";

/** Two-column marketplace category tile — image hero + label footer. */
const CategoryBrowseCard = memo(function CategoryBrowseCard({
  label,
  image = "",
  icon = "",
  onClick,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const imageUrl = image ? resolveMediaUrl(image) : "";
  const initial = (label || icon || "?").charAt(0);

  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      sx={{
        width: "100%",
        aspectRatio: "4 / 3",
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        bgcolor: isDark ? alpha("#fff", 0.05) : "#fff",
        border: `1px solid ${isDark ? alpha("#fff", 0.09) : alpha("#0d111c", 0.08)}`,
        boxShadow: isDark
          ? "0 6px 20px rgba(0,0,0,0.32)"
          : "0 4px 16px rgba(15,23,42,0.08)",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: isDark
            ? "0 10px 28px rgba(0,0,0,0.4)"
            : "0 8px 22px rgba(15,23,42,0.12)",
        },
        "&:active": { transform: "scale(0.98)" },
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          p: imageUrl ? 0 : 1.5,
          background: imageUrl
            ? isDark
              ? alpha("#0d111c", 0.6)
              : alpha("#f1f5f9", 1)
            : isDark
              ? `linear-gradient(160deg, ${alpha("#1E6FD9", 0.2)} 0%, ${alpha("#0d111c", 0.5)} 100%)`
              : `linear-gradient(160deg, ${alpha("#1E6FD9", 0.08)} 0%, ${alpha("#f8fafc", 1)} 100%)`,
        }}
      >
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={label || ""}
            loading="lazy"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
              objectPosition: "center",
              filter: isDark ? "brightness(0.95)" : "none",
            }}
          />
        ) : icon ? (
          <Box
            component="span"
            sx={{ fontSize: "2.4rem", lineHeight: 1, userSelect: "none" }}
          >
            {icon}
          </Box>
        ) : (
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha("#1E6FD9", isDark ? 0.28 : 0.12),
              color: isDark ? "#93c5fd" : "#1E6FD9",
              fontSize: "1.5rem",
              fontWeight: 800,
            }}
          >
            {initial}
          </Box>
        )}

        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 3,
            zIndex: 1,
            background:
              "linear-gradient(90deg, var(--color-primary,#1E6FD9) 0%, var(--brand-accent-orange,#ff8c00) 100%)",
          }}
        />
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          minHeight: 46,
          px: 1,
          py: 0.85,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          borderTop: `1px solid ${isDark ? alpha("#fff", 0.06) : alpha("#0d111c", 0.06)}`,
        }}
      >
        <CategoryIcon
          sx={{
            fontSize: 15,
            color: "var(--color-primary, #1E6FD9)",
            flexShrink: 0,
            opacity: 0.85,
          }}
        />
        <Typography
          sx={{
            flex: 1,
            minWidth: 0,
            fontWeight: 700,
            fontSize: "0.8rem",
            lineHeight: 1.25,
            color: isDark ? "rgba(255,255,255,0.92)" : "rgba(15,23,42,0.9)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {label}
        </Typography>
        <ChevronRightIcon
          sx={{
            fontSize: 18,
            flexShrink: 0,
            color: isDark ? alpha("#fff", 0.35) : alpha("#0d111c", 0.28),
          }}
        />
      </Box>
    </Box>
  );
});

export const CATEGORY_BROWSE_GRID_SX = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 1.25,
};

export default CategoryBrowseCard;
