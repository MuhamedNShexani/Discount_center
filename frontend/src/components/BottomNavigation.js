import React, { useMemo, useState } from "react";
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  useTheme,
} from "@mui/material";
import {
  Home as HomeIcon,
  Category as CategoryIcon,
  Store as StoreIcon,
  CardGiftcard as CardGiftcardIcon,
  Favorite as FavoriteIcon,
  VideoLibrary as VideoLibraryIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import useIsMobileLayout from "../hooks/useIsMobileLayout";
import { useActiveTheme } from "../context/ActiveThemeContext";

const BottomNavigationBar = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobileLayout();
  const { navConfig } = useActiveTheme();
  // No popup on mobile for stores

  // Function to determine the active navigation item
  const getActiveValue = () => {
    const pathname = location.pathname;

    // Check for exact matches first
    if (pathname === "/") return "/";
    if (pathname === "/reels") return "/reels";
    if (pathname === "/favourites") return "/favourites";
    if (pathname === "/categories") return "/categories";
    if (pathname === "/gifts") return "/gifts";
    if (pathname === "/profile") return "/profile";

    // Check for stores (including nested routes)
    if (pathname.startsWith("/stores")) return "/stores";

    // Check for brands (including nested routes)
    // if (pathname.startsWith("/brands")) return "/brands";

    // Don't highlight Home for unrelated pages
    return false;
  };

  // Memoize the active value to prevent unnecessary re-renders
  const activeValue = useMemo(() => getActiveValue(), [location.pathname]);

  const template = navConfig?.template || "template1";

  const actionMap = {
    home: { name: t("Home"), path: "/", icon: <HomeIcon /> },
    categories: {
      name: t("Categories"),
      path: "/categories",
      icon: <CategoryIcon />,
    },
    reels: { name: t("Reels"), path: "/reels", icon: <VideoLibraryIcon /> },
    favourites: {
      name: t("Favourites"),
      path: "/favourites",
      icon: <FavoriteIcon />,
    },
    stores: { name: t("Stores"), path: "/stores", icon: <StoreIcon /> },
    gifts: { name: t("Gifts"), path: "/gifts", icon: <CardGiftcardIcon /> },
    profile: { name: t("Account"), path: "/profile", icon: <PersonIcon /> },
  };

  const navItems =
    template === "template2"
      ? [
          actionMap.home,
          actionMap.categories,
          actionMap.reels,
          actionMap.favourites,
          actionMap.profile,
        ]
      : template === "custom"
        ? [
            actionMap[navConfig?.bottomSlots?.bottomleft1] || null,
            actionMap[navConfig?.bottomSlots?.bottomleft2] || null,
            actionMap[navConfig?.bottomSlots?.center] || null,
            actionMap[navConfig?.bottomSlots?.bottomright1] || null,
            actionMap[navConfig?.bottomSlots?.bottomright2] || null,
          ]
        : [
            actionMap.home,
            actionMap.categories,
            actionMap.reels,
            actionMap.stores,
            actionMap.gifts,
          ];

  if (!isMobile) {
    return null; // Only show on mobile
  }

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        pb: 0,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          borderRadius: "16px 16px 0 0",
          background:
            "linear-gradient(120deg, var(--brand-primary-blue) 0%, var(--brand-secondary-blue) 60%, var(--brand-accent-orange) 100%)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.1)"
              : "rgba(255,255,255,0.2)"
          }`,
          borderBottom: "none",
          overflow: "hidden",
          minHeight: "64px", // Ensure minimum height for visibility
          display: "flex",
          flexDirection: "column",
        }}
      >
        <BottomNavigation
          value={activeValue}
          showLabels
          sx={{
            background: "transparent !important",
            minHeight: "64px",
            "& .MuiBottomNavigationAction-root": {
              color: "rgba(255,255,255,0.8) !important",
              "&.Mui-selected": {
                color: "white !important",
                backgroundColor: "rgba(255,255,255,0.16) !important",
              },
            },
          }}
        >
          {navItems.map((item, idx) => {
            if (!item) {
              return (
                <BottomNavigationAction
                  key={`empty-${idx}`}
                  label=""
                  value={`empty-${idx}`}
                  disabled
                  sx={{
                    opacity: 0,
                    pointerEvents: "none",
                    minWidth: "auto",
                    padding: "6px 8px",
                  }}
                />
              );
            }

            const isActive = activeValue === item.path;

            return (
              <BottomNavigationAction
                key={item.path}
                label={item.name}
                value={item.path}
                icon={item.icon}
                component={Link}
                to={item.path}
                onClick={undefined}
                sx={{
                  color: isActive
                    ? "white !important"
                    : "rgba(255,255,255,0.8) !important",
                  backgroundColor: isActive
                    ? "rgba(255,255,255,0.16) !important"
                    : "transparent !important",
                  borderRadius: isActive ? 1 : 0,
                  minWidth: "auto",
                  padding: "6px 8px",
                  transition: "all 0.3s ease",
                  "&.Mui-selected": {
                    color: "white !important",
                    backgroundColor: "rgba(255,255,255,0.16) !important",
                  },
                  "&.MuiBottomNavigationAction-root": {
                    color: isActive
                      ? "white !important"
                      : "rgba(255,255,255,0.8) !important",
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.16) !important"
                      : "transparent !important",
                  },
                  "& .MuiBottomNavigationAction-label": {
                    fontSize: isActive ? "0.75rem" : "0.7rem",
                    fontWeight: isActive ? 600 : 500,
                    marginTop: "4px",
                    transition: "all 0.3s ease",
                    color: isActive
                      ? "white !important"
                      : "rgba(255,255,255,0.8) !important",
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: "1.5rem",
                    transform: isActive ? "scale(1.1)" : "scale(1)",
                    transition: "all 0.3s ease",
                    color: isActive
                      ? "white !important"
                      : "rgba(255,255,255,0.8) !important",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1) !important",
                    borderRadius: 1,
                  },
                }}
              />
            );
          })}
        </BottomNavigation>
      </Paper>

      {/* No store type popup */}
    </Box>
  );
};

export default BottomNavigationBar;
