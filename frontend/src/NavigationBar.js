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
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  ClickAwayListener,
} from "@mui/material";
import {
  Home as HomeIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Dashboard as DashboardIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Store as StoreIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  CardGiftcard as CardGiftcardIcon,
  Person as PersonIcon,
  Language as LanguageIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./context/AuthContext";
import { useCityFilter } from "./context/CityFilterContext";

const NavigationBar = ({ darkMode, setDarkMode }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { selectedCity, changeCity, cities } = useCityFilter();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));
  const lang = i18n.language;
  const location = useLocation();
  const isAuthenticated = !!user;
  const isAdmin = !!user && user.email === "mshexani45@gmail.com";
  // Profile menu state
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);

  // Stores dropdown state
  const [storesAnchorEl, setStoresAnchorEl] = useState(null);

  const handleLangChange = (event) => {
    i18n.changeLanguage(event.target.value);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleStoresMenuOpen = (event) => {
    setStoresAnchorEl(event.currentTarget);
  };

  const handleStoresMenuClose = () => {
    setStoresAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const navItems = [
    { name: t("Main Page"), path: "/", icon: <HomeIcon /> },
    { name: t("Products"), path: "/categories", icon: <CategoryIcon /> },
    { name: t("Brands"), path: "/brands", icon: <BusinessIcon /> },
    { name: t("Gifts"), path: "/gifts", icon: <CardGiftcardIcon /> },
    // Show Data Entry link for authenticated users
    ...(user && isAuthenticated
      ? [
          {
            name: t("Data Entry"),
            path: "/admin",
            icon: <AdminPanelSettingsIcon />,
          },
        ]
      : []),
    // Only show Admin link for specific admin email
    // ...(user && user.email === "mshexani45@gmail.com"
    //   ? [
    //       {
    //         name: t("Admin"),
    //         path: "/admin/specific",
    //         icon: <AdminPanelSettingsIcon />,
    //       },
    //     ]
    //   : []),
  ];

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #52b788 0%, #40916c 100%)"
              : "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
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
              {t("Store Products")}
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
              {/* First two nav items (Main Page, Products) */}
              {navItems.slice(0, 2).map((item) => (
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

              {/* Stores link (no dropdown) */}
              <Button
                component={Link}
                to="/stores"
                startIcon={<StoreIcon />}
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
                  backgroundColor: location.pathname.startsWith("/stores")
                    ? "rgba(255,255,255,0.2)"
                    : "transparent",
                  backdropFilter: location.pathname.startsWith("/stores")
                    ? "blur(10px)"
                    : "none",
                  border: location.pathname.startsWith("/stores")
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
                    width: location.pathname.startsWith("/stores")
                      ? "80%"
                      : "0%",
                    height: 2,
                    backgroundColor: "white",
                    borderRadius: 1,
                    transition: "width 0.3s ease",
                  },
                }}
              >
                {t("Stores")}
              </Button>

              {/* Remaining nav items (Brands, Gifts, Admin) */}
              {navItems.slice(2).map((item) => (
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
            {/* Desktop Controls */}
            {isSmUp && (
              <>
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

                {/* City Selector */}
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
                    value={selectedCity}
                    onChange={(e) => changeCity(e.target.value)}
                    size="small"
                    variant="standard"
                    disableUnderline
                    sx={{
                      color: "white",
                      minWidth: { xs: 80, sm: 100 },
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
                    {cities.map((city) => (
                      <MenuItem key={city.value} value={city.value}>
                        {city.flag} {city.label}
                      </MenuItem>
                    ))}
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
              </>
            )}

            {/* Mobile Controls */}
            {!isSmUp && (
              <>
                {/* Mobile Language Selector */}
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
                      minWidth: 60,
                      px: 0.5,
                      "& .MuiSvgIcon-root": {
                        color: "white",
                      },
                      "& .MuiSelect-select": {
                        py: 0.5,
                        fontSize: "0.8rem",
                      },
                    }}
                  >
                    <MenuItem value="en">🇺🇸 EN</MenuItem>
                    <MenuItem value="ar">🇸🇦 AR</MenuItem>
                    <MenuItem value="ku">🏳️ KU</MenuItem>
                  </Select>
                </Paper>

                {/* Mobile City Selector */}
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
                    value={selectedCity}
                    onChange={(e) => changeCity(e.target.value)}
                    size="small"
                    variant="standard"
                    disableUnderline
                    sx={{
                      color: "white",
                      minWidth: 80,
                      px: 0.5,
                      "& .MuiSvgIcon-root": {
                        color: "white",
                      },
                      "& .MuiSelect-select": {
                        py: 0.5,
                        fontSize: "0.8rem",
                      },
                    }}
                  >
                    {cities.map((city) => (
                      <MenuItem key={city.value} value={city.value}>
                        {city.flag} {city.label}
                      </MenuItem>
                    ))}
                  </Select>
                </Paper>

                {/* Mobile Profile Icon */}
                <IconButton
                  onClick={handleProfileMenuOpen}
                  sx={{
                    color: "white",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    transition: "all 0.3s ease",
                    width: 40,
                    height: 40,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.2)",
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <PersonIcon />
                </IconButton>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Profile Menu */}
      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            backgroundColor:
              theme.palette.mode === "dark" ? "#2c3e50" : "#ffffff",
            backdropFilter: "blur(20px)",
            border: `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.1)"
            }`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            borderRadius: 2,
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* User Info */}
        <Box
          sx={{
            px: 2,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.02)",
          }}
        >
          {user ? (
            <>
              <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#2c3e50" : "#34495e",
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  {user.firstName
                    ? user.firstName.charAt(0).toUpperCase()
                    : "U"}
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    color="text.primary"
                    fontWeight={600}
                    sx={{ fontSize: "1rem" }}
                  >
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.8rem" }}
                  >
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            </>
          ) : (
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#6c757d" : "#adb5bd",
                  fontSize: "1rem",
                  fontWeight: 600,
                }}
              >
                G
              </Avatar>
              <Box>
                <Typography
                  variant="subtitle1"
                  color="text.primary"
                  fontWeight={600}
                  sx={{ fontSize: "1rem" }}
                >
                  {t("Guest User")}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.8rem" }}
                >
                  {t("Not logged in")}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Theme Toggle */}
        <MenuItem
          onClick={() => {
            setDarkMode(!darkMode);
            handleProfileMenuClose();
          }}
          sx={{
            py: 1.5,
            px: 2,
            "&:hover": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.04)",
            },
          }}
        >
          <ListItemIcon>
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </ListItemIcon>
          <ListItemText
            primary={darkMode ? t("Light Mode") : t("Dark Mode")}
            primaryTypographyProps={{
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          />
        </MenuItem>

        <Divider />

        {/* Admin entry and Logout / Login */}
        {user ? (
          <>
            {isAdmin && (
              <MenuItem
                component={Link}
                to="/admin/dashboard"
                onClick={handleProfileMenuClose}
                sx={{
                  py: 1.5,
                  px: 2,
                  color: theme.palette.mode === "dark" ? "#e2e8f0" : "#2c3e50",
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.04)",
                  },
                }}
              >
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t("Admin Dashboard")}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                />
              </MenuItem>
            )}
            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.5,
                px: 2,
                color: "#e53e3e",
                "&:hover": {
                  backgroundColor: "rgba(229, 62, 62, 0.08)",
                },
              }}
            >
              <ListItemIcon>
                <LogoutIcon sx={{ color: "#e53e3e" }} />
              </ListItemIcon>
              <ListItemText
                primary={t("Logout")}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              />
            </MenuItem>
          </>
        ) : (
          <MenuItem
            component={Link}
            to="/login"
            onClick={handleProfileMenuClose}
            sx={{
              py: 1.5,
              px: 2,
              color: "#2c3e50",
              "&:hover": {
                backgroundColor: "rgba(64, 145, 108, 0.08)",
              },
            }}
          >
            <ListItemIcon>
              <LoginIcon sx={{ color: "#2c3e50" }} />
            </ListItemIcon>
            <ListItemText
              primary={t("Login")}
              primaryTypographyProps={{
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            />
          </MenuItem>
        )}
      </Menu>

      {/* Stores Dropdown removed */}
    </>
  );
};

export default NavigationBar;
