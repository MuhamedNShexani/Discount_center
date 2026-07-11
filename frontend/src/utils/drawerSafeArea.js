import React from "react";
import { Box } from "@mui/material";

/** Bottom inset for fullscreen / slide-over drawers. */
export const DRAWER_SAFE_BOTTOM = "env(safe-area-inset-bottom, 0px)";

/** Top inset for drawer chrome (status bar / notch). */
export const DRAWER_SAFE_TOP = "env(safe-area-inset-top, 0px)";

/** Standard MUI Drawer paper styles with safe-area-friendly flex layout. */
export function drawerPaperSx(isDark, extra = {}) {
  return {
    borderRadius: 0,
    background: isDark ? "#0f1927" : "#ffffff",
    borderLeft: isDark
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid #eef0f4",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    maxHeight: "100dvh",
    pb: DRAWER_SAFE_BOTTOM,
    ...extra,
  };
}

/** Fills the notch area with the drawer background (no interactive content). */
export function DrawerSafeAreaTop({ bgcolor }) {
  return (
    <Box
      aria-hidden
      sx={{
        height: DRAWER_SAFE_TOP,
        flexShrink: 0,
        bgcolor: bgcolor || "inherit",
      }}
    />
  );
}

/** Wrap drawer body below the safe-area strip. */
export function DrawerBody({ children, sx }) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/** Embedded drawer page shell (Gifts, Find Job, etc.). */
export function embeddedDrawerPageSx(extra = {}) {
  return {
    width: { xs: "100vw", sm: 420 },
    maxWidth: "100%",
    height: "100dvh",
    overflow: "auto",
    boxSizing: "border-box",
    pt: `calc(20px + ${DRAWER_SAFE_TOP})`,
    pb: `calc(24px + ${DRAWER_SAFE_BOTTOM})`,
    ...extra,
  };
}
