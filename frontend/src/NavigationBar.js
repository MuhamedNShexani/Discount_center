import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  FormControlLabel,
  Select,
  MenuItem,
  Avatar,
  Fade,
  Slide,
  Paper,
  Chip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Language as LanguageIcon,
  Store as StoreIcon,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NavigationBar = ({ darkMode, setDarkMode }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isSmUp = useMediaQuery(theme.breakpoints.up("md"));
  const lang = i18n.language;
  const location = useLocation();

  const handleLangChange = (event) => {
    i18n.changeLanguage(event.target.value);
  };

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const navItems = [
    { name: t("Main Page"), path: "/", icon: <HomeIcon /> },
    { name: t("Markets"), path: "/markets", icon: <BusinessIcon /> },
    { name: t("Categories"), path: "/categories", icon: <CategoryIcon /> },
    {
      name: t("Admin"),
      path: "/admin",
      icon: <AdminPanelSettingsIcon />,
    },
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
        <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, md: 4 } }}>
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
                fontSize: { xs: "1.25rem", md: "1.5rem" },
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    color: "white",
                    textTransform: "none",
                    fontWeight: 600,
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
            </Box>
          )}

          {/* Controls */}
          <Box display="flex" alignItems="center" gap={1}>
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
                  minWidth: 80,
                  px: 1,
                  "& .MuiSvgIcon-root": {
                    color: "white",
                  },
                  "& .MuiSelect-select": {
                    py: 0.5,
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
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.2)",
                  transform: "scale(1.1) rotate(180deg)",
                },
              }}
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>

            {/* Mobile Menu Toggle */}
            {!isSmUp && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer(true)}
                sx={{
                  color: "white",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.2)",
                    transform: "scale(1.1)",
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Enhanced Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: 280,
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(180deg, #2c3e50 0%, #34495e 100%)"
                : "linear-gradient(180deg, #52b788 0%, #40916c 100%)",
            color: "white",
            backdropFilter: "blur(20px)",
            border: "none",
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          {/* Drawer Header */}
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Avatar
              sx={{
                mx: "auto",
                mb: 2,
                width: 60,
                height: 60,
                background: "linear-gradient(135deg, #ffffff20, #ffffff40)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              <StoreIcon sx={{ color: "white", fontSize: 32 }} />
            </Avatar>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                mb: 1,
              }}
            >
              {t("Market Products")}
            </Typography>
            <Chip
              label={t("Mobile Menu")}
              size="small"
              sx={{
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                backdropFilter: "blur(10px)",
              }}
            />
          </Box>

          {/* Navigation Items */}
          <List sx={{ p: 0 }}>
            {navItems.map((item, index) => (
              <Fade in={true} timeout={300 + index * 100} key={item.path}>
                <ListItem
                  button
                  component={Link}
                  to={item.path}
                  onClick={toggleDrawer(false)}
                  selected={location.pathname === item.path}
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    backgroundColor:
                      location.pathname === item.path
                        ? "rgba(255,255,255,0.2)"
                        : "transparent",
                    backdropFilter:
                      location.pathname === item.path ? "blur(10px)" : "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(10px)",
                      transform: "translateX(8px)",
                    },
                    "&.Mui-selected": {
                      backgroundColor: "rgba(255,255,255,0.2)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: "white",
                      minWidth: 40,
                      "& .MuiSvgIcon-root": {
                        fontSize: 24,
                      },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    sx={{
                      "& .MuiTypography-root": {
                        fontWeight: location.pathname === item.path ? 700 : 500,
                        fontSize: "1rem",
                      },
                    }}
                  />
                </ListItem>
              </Fade>
            ))}
          </List>

          {/* Drawer Controls */}
          <Box
            sx={{ mt: 4, pt: 3, borderTop: "1px solid rgba(255,255,255,0.2)" }}
          >
            {/* Language Selector */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                {t("Language")}
              </Typography>
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
                  fullWidth
                  size="small"
                  variant="standard"
                  disableUnderline
                  sx={{
                    color: "white",
                    px: 2,
                    py: 1,
                    "& .MuiSvgIcon-root": {
                      color: "white",
                    },
                  }}
                >
                  <MenuItem value="en">🇺🇸 {t("English")}</MenuItem>
                  <MenuItem value="ar">🇸🇦 {t("Arabic")}</MenuItem>
                  <MenuItem value="ku">🏳️ {t("Kurdish")}</MenuItem>
                </Select>
              </Paper>
            </Box>

            {/* Dark Mode Toggle */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                {t("Theme")}
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                onClick={() => setDarkMode(!darkMode)}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.3)",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                  textTransform: "none",
                  borderRadius: 2,
                  py: 1,
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.5)",
                    backgroundColor: "rgba(255,255,255,0.2)",
                  },
                }}
              >
                {darkMode ? t("Light Mode") : t("Dark Mode")}
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default NavigationBar;
