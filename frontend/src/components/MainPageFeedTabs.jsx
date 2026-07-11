import React from "react";
import { Box, Tab, Tabs } from "@mui/material";
import { useTheme } from "@mui/material/styles";

/**
 * For You / Following tabs — Facebook-style full-width bar on mobile;
 * floating pill on desktop (unchanged).
 */
export default function MainPageFeedTabs({
  value,
  onChange,
  isMobile,
  forYouLabel,
  followingLabel,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const tabsSx = {
    minHeight: isMobile ? 48 : 44,
    width: "100%",
    px: isMobile ? 0 : 0.5,
    "& .MuiTabs-indicator": {
      display: "flex",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    "& .MuiTabs-indicatorSpan": {
      width: isMobile ? "100%" : "60%",
      maxWidth: isMobile ? 120 : undefined,
      backgroundColor: "var(--brand-accent-orange, #ff8c00)",
      borderRadius: "999px",
      height: "3px",
    },
    "& .MuiTab-root": {
      fontWeight: 700,
      textTransform: "none",
      color: isMobile
        ? isDark
          ? "rgba(255,255,255,0.55)"
          : "rgba(0,0,0,0.45)"
        : isDark
          ? "rgba(255,255,255,0.55)"
          : "rgba(0,0,0,0.45)",
      minHeight: isMobile ? 48 : 44,
      minWidth: isMobile ? 0 : "auto",
      flex: isMobile ? 1 : undefined,
      px: isMobile ? 1 : 2,
      fontSize: isMobile ? "0.9375rem" : "0.9rem",
      transition: "color 0.2s",
      "&.Mui-selected": {
        color: isMobile
          ? isDark
            ? "#fff"
            : "#050505"
          : isDark
            ? "white"
            : "#111827",
        fontWeight: 800,
      },
    },
  };

  const tabs = (
    <Tabs
      value={value}
      variant={isMobile ? "fullWidth" : "standard"}
      TabIndicatorProps={{
        children: <span className="MuiTabs-indicatorSpan" />,
      }}
      onChange={onChange}
      sx={tabsSx}
    >
      <Tab label={forYouLabel} />
      <Tab label={followingLabel} />
    </Tabs>
  );

  if (isMobile) {
    return (
      <Box
        className="mobile-main-feed-tabs"
        sx={{
          position: "fixed",
          top: "calc(var(--safe-top) + var(--nav-height))",
          left: 0,
          right: 0,
          zIndex: 1099,
          bgcolor: isDark ? "#0f1927" : "#ffffff",
          borderBottom: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          boxShadow: isDark
            ? "0 1px 0 rgba(255,255,255,0.04)"
            : "0 1px 0 rgba(0,0,0,0.04)",
        }}
      >
        {tabs}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "fixed",
        top: 75,
        left: 0,
        right: 0,
        zIndex: 1090,
        width: "fit-content",
        borderRadius: "14px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "0 auto",
        backdropFilter: "blur(12px)",
        background: isDark ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.9)",
        boxShadow: isDark
          ? "0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.07)"
          : "0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      {tabs}
    </Box>
  );
}
