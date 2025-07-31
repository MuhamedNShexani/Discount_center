import React, { useMemo, useState } from "react";
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  ClickAwayListener,
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
  const [storesAnchorEl, setStoresAnchorEl] = useState(null);

  // Store type options for mobile selection
  const storeTypes = [
    // { type: "all", name: t("All Stores"), icon: "🏪", path: "/stores" },
    {
      type: "market",
      name: t("Markets"),
      icon: "🛒",
      path: "/stores?type=market",
    },
    {
      type: "clothes",
      name: t("Clothes"),
      icon: "👕",
      path: "/stores?type=clothes",
    },
    {
      type: "electronic",
      name: t("Electronics"),
      icon: "📱",
      path: "/stores?type=electronic",
    },
    {
      type: "cosmetic",
      name: t("Cosmetics"),
      icon: "💄",
      path: "/stores?type=cosmetic",
    },
  ];

  // Handle store type selection
  const handleStoreTypeSelect = (path) => {
    setStoresAnchorEl(null);
    // Navigate to the selected store type
    window.location.href = path;
  };

  // Handle stores button click
  const handleStoresClick = (e) => {
    e.preventDefault();
    setStoresAnchorEl(e.currentTarget);
  };

  // Handle stores menu close
  const handleStoresMenuClose = () => {
    setStoresAnchorEl(null);
  };

  // Function to determine the active navigation item
  const getActiveValue = () => {
    const pathname = location.pathname;

    // Check for exact matches first
    if (pathname === "/") return "/";
    if (pathname === "/categories") return "/categories";
    if (pathname === "/gifts") return "/gifts";

    // Check for stores (including nested routes)
    if (pathname.startsWith("/stores")) return "/stores";

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
    { name: t("Stores"), path: "/stores", icon: <StoreIcon /> },
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
              ? "linear-gradient(135deg, #52b788 0%, #40916c 100%)"
              : "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
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
            const isStoresItem = item.path === "/stores";

            return (
              <BottomNavigationAction
                key={item.path}
                label={item.name}
                value={item.path}
                icon={item.icon}
                component={isStoresItem ? "button" : Link}
                to={isStoresItem ? undefined : item.path}
                onClick={isStoresItem ? handleStoresClick : undefined}
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

      {/* Store Type Selection Dropdown */}
      <Menu
        anchorEl={storesAnchorEl}
        open={Boolean(storesAnchorEl)}
        onClose={handleStoresMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            border: `1px solid ${
              theme.palette.mode === "dark" ? "#34495e" : "#e9ecef"
            }`,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 32px rgba(0,0,0,0.3)"
                : "0 8px 32px rgba(0,0,0,0.1)",
            minWidth: 200,
          },
        }}
      >
        {storeTypes.map((storeType) => (
          <MenuItem
            key={storeType.type}
            onClick={() => handleStoreTypeSelect(storeType.path)}
            sx={{
              py: 1.5,
              px: 2,
              "&:hover": {
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(82, 183, 136, 0.1)"
                    : "rgba(82, 183, 136, 0.05)",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <span style={{ fontSize: "1.2rem" }}>{storeType.icon}</span>
            </ListItemIcon>
            <ListItemText
              primary={storeType.name}
              sx={{
                "& .MuiListItemText-primary": {
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                },
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default BottomNavigationBar;
