import React from "react";
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
        pb: 1, // Add padding bottom for safe area
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
        }}
      >
        <BottomNavigation
          value={location.pathname}
          showLabels
          sx={{
            background: "transparent",
            "& .MuiBottomNavigationAction-root": {
              color: "rgba(255,255,255,0.7)",
              minWidth: "auto",
              padding: "6px 8px",
              "&.Mui-selected": {
                color: "white",
                "& .MuiBottomNavigationAction-label": {
                  fontSize: "0.75rem",
                  fontWeight: 600,
                },
              },
              "& .MuiBottomNavigationAction-label": {
                fontSize: "0.7rem",
                fontWeight: 500,
                marginTop: "4px",
                transition: "all 0.3s ease",
              },
              "& .MuiSvgIcon-root": {
                fontSize: "1.5rem",
                transition: "all 0.3s ease",
              },
            },
            "& .MuiBottomNavigationAction-root.Mui-selected .MuiSvgIcon-root": {
              transform: "scale(1.1)",
            },
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.name}
              value={item.path}
              icon={item.icon}
              component={Link}
              to={item.path}
              sx={{
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 1,
                },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default BottomNavigationBar;
