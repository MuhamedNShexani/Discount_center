import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Select,
  MenuItem,
  Avatar,
  Paper,
} from "@mui/material";
import {
  Home as HomeIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Store as StoreIcon,
  Login as LoginIcon,
  CardGiftcard as CardGiftcardIcon,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./context/AuthContext";

const NavigationBar = ({ darkMode, setDarkMode }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));
  const lang = i18n.language;
  const location = useLocation();

  const handleLangChange = (event) => {
    i18n.changeLanguage(event.target.value);
  };

  const navItems = [
    { name: t("Main Page"), path: "/", icon: <HomeIcon /> },
    { name: t("Products"), path: "/categories", icon: <CategoryIcon /> },
    { name: t("Markets"), path: "/markets", icon: <StoreIcon /> },
    { name: t("Brands"), path: "/brands", icon: <BusinessIcon /> },
    { name: t("Gifts"), path: "/gifts", icon: <CardGiftcardIcon /> },
    // Only show Admin link for specific admin email
    ...(user && user.email === "mshexani45@gmail.com"
      ? [
          {
            name: t("Admin"),
            path: "/admin/specific",
            icon: <AdminPanelSettingsIcon />,
          },
        ]
      : []),
  ];

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
              : "linear-gradient(135deg, #52b788 0%, #40916c 100%)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.1)"
              : "rgba(255,255,255,0.2)"
          }`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 8px 32px rgba(0,0,0,0.3)"
              : "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        <Toolbar
          sx={{ justifyContent: "space-between", px: { xs: 1, sm: 2, md: 4 } }}
        >
          {/* Logo and Brand */}
          <Box display="flex" alignItems="center">
            <Avatar
              sx={{
                mr: 2,
                width: 40,
                height: 40,
                background: "linear-gradient(135deg, #ffffff20, #ffffff40)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              <StoreIcon sx={{ color: "white", fontSize: 24 }} />
            </Avatar>
            <Typography
              variant="h5"
              component={Link}
              to="/"
              sx={{
                textDecoration: "none",
                color: "white",
                fontWeight: 700,
                fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                background: "linear-gradient(45deg, #ffffff, #f0f0f0)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              {t("Market Products")}
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {isSmUp && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    color: "white",
                    textTransform: "none",
                    fontSize: "1.3rem",
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    minWidth: "auto",
                    position: "relative",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    backgroundColor:
                      location.pathname === item.path
                        ? "rgba(255,255,255,0.2)"
                        : "transparent",
                    backdropFilter:
                      location.pathname === item.path ? "blur(10px)" : "none",
                    border:
                      location.pathname === item.path
                        ? "1px solid rgba(255,255,255,0.3)"
                        : "1px solid transparent",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(10px)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    },
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: -2,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: location.pathname === item.path ? "80%" : "0%",
                      height: 2,
                      backgroundColor: "white",
                      borderRadius: 1,
                      transition: "width 0.3s ease",
                    },
                  }}
                >
                  {item.name}
                </Button>
              ))}
              {/* Login/Logout Button */}
              {user ? (
                <Button
                  onClick={logout}
                  startIcon={<LoginIcon />}
                  sx={{
                    color: "white",
                    textTransform: "none",
                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                    px: { xs: 1, sm: 2 },
                    py: 0.8,
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.2)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  {t("Logout")}
                </Button>
              ) : (
                <Button
                  component={Link}
                  to="/login"
                  startIcon={<LoginIcon />}
                  sx={{
                    color: "white",
                    textTransform: "none",
                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                    px: { xs: 1, sm: 2 },
                    py: 0.8,
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.2)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  {t("Login")}
                </Button>
              )}
            </Box>
          )}

          {/* Controls */}
          <Box display="flex" alignItems="center" gap={{ xs: 2, sm: 1 }}>
            {/* Language Selector */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 2,
              }}
            >
              <Select
                value={lang}
                onChange={handleLangChange}
                size="small"
                variant="standard"
                disableUnderline
                sx={{
                  color: "white",
                  minWidth: { xs: 60, sm: 80 },
                  px: { xs: 0.5, sm: 1 },
                  "& .MuiSvgIcon-root": {
                    color: "white",
                  },
                  "& .MuiSelect-select": {
                    py: 0.5,
                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                  },
                }}
              >
                <MenuItem value="en">🇺🇸 EN</MenuItem>
                <MenuItem value="ar">🇸🇦 AR</MenuItem>
                <MenuItem value="ku">🏳️ KU</MenuItem>
              </Select>
            </Paper>

            {/* Dark Mode Toggle */}
            <IconButton
              onClick={() => setDarkMode(!darkMode)}
              sx={{
                color: "white",
                backgroundColor: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
                transition: "all 0.3s ease",
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.2)",
                  transform: "scale(1.1) rotate(180deg)",
                },
              }}
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default NavigationBar;
