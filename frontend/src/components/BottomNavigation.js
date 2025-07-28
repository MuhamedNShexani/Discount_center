import React, { useMemo } from "react";
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Home as HomeIcon,
  Category as CategoryIcon,
  Store as StoreIcon,
  Business as BusinessIcon,
  CardGiftcard as CardGiftcardIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const BottomNavigationBar = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Function to determine the active navigation item
  const getActiveValue = () => {
    const pathname = location.pathname;

    // Check for exact matches first
    if (pathname === "/") return "/";
    if (pathname === "/categories") return "/categories";
    if (pathname === "/gifts") return "/gifts";

    // Check for markets (including nested routes)
    if (pathname.startsWith("/markets")) return "/markets";

    // Check for brands (including nested routes)
    if (pathname.startsWith("/brands")) return "/brands";

    // Default to home if no match
    return "/";
  };

  // Memoize the active value to prevent unnecessary re-renders
  const activeValue = useMemo(() => getActiveValue(), [location.pathname]);

  const navItems = [
    { name: t("Home"), path: "/", icon: <HomeIcon /> },
    { name: t("Categories"), path: "/categories", icon: <CategoryIcon /> },
    { name: t("Markets"), path: "/markets", icon: <StoreIcon /> },
    { name: t("Brands"), path: "/brands", icon: <BusinessIcon /> },
    { name: t("Gifts"), path: "/gifts", icon: <CardGiftcardIcon /> },
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
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
              : "linear-gradient(135deg, #52b788 0%, #40916c 100%)",
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
                backgroundColor: "rgba(255,255,255,0.15) !important",
              },
            },
          }}
        >
          {navItems.map((item) => {
            const isActive = activeValue === item.path;

            return (
              <BottomNavigationAction
                key={item.path}
                label={item.name}
                value={item.path}
                icon={item.icon}
                component={Link}
                to={item.path}
                sx={{
                  color: isActive
                    ? "white !important"
                    : "rgba(255,255,255,0.8) !important",
                  backgroundColor: isActive
                    ? "rgba(255,255,255,0.15) !important"
                    : "transparent !important",
                  borderRadius: isActive ? 1 : 0,
                  minWidth: "auto",
                  padding: "6px 8px",
                  transition: "all 0.3s ease",
                  "&.Mui-selected": {
                    color: "white !important",
                    backgroundColor: "rgba(255,255,255,0.15) !important",
                  },
                  "&.MuiBottomNavigationAction-root": {
                    color: isActive
                      ? "white !important"
                      : "rgba(255,255,255,0.8) !important",
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.15) !important"
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
    </Box>
  );
};

export default BottomNavigationBar;
