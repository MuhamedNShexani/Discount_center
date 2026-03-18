import React, { useEffect, useRef, useState } from "react";
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
  Badge,
  ListItemButton,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
  Favorite as FavoriteIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocationOn as LocationOnIcon,
  PrivacyTip as PrivacyTipIcon,
  ContactSupport as ContactSupportIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./context/AuthContext";
import { useUserTracking } from "./hooks/useUserTracking";
import kurdishFlag from "./styles/kurdish_flag.jpg";
import { useCityFilter } from "./context/CityFilterContext";
import { useAppSettings } from "./context/AppSettingsContext";
import { useNotifications } from "./context/NotificationContext";
import { useContentRefresh } from "./context/ContentRefreshContext";

// Set to true to show notification center (bell, profile toggle, enable banner)
const NOTIFICATIONS_CENTER_ENABLED = false;

const NavigationBar = ({ darkMode, setDarkMode }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { user, logout, deactivate } = useAuth();
  const { user: guestUser, updateGuestName } = useUserTracking();
  const { selectedCity, changeCity, cities } = useCityFilter();
  const { openWhatsApp } = useAppSettings();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    fetchNotifications,
    pushSupported,
    pushPermission,
    pushSubscribing,
    requestPushPermission,
    pushEnabled,
    setPushEnabled,
    pushEnableError,
    setPushEnableError,
  } = useNotifications();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));
  const { triggerRefresh } = useContentRefresh();
  const lang = i18n.language;
  const location = useLocation();
  const isAuthenticated = !!user;
  const isAdmin = !!user && user.email === "mshexani45@gmail.com";
  const [showMobileNavbar, setShowMobileNavbar] = useState(true);
  const lastScrollYRef = useRef(0);
  // Profile menu state
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);

  // Notification menu state
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

  // Admin dropdown state
  const [adminAnchorEl, setAdminAnchorEl] = useState(null);

  // Stores dropdown state
  const [storesAnchorEl, setStoresAnchorEl] = useState(null);

  // City submenu state (desktop profile)
  const [cityAnchorEl, setCityAnchorEl] = useState(null);

  const [guestNameDialogOpen, setGuestNameDialogOpen] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState("");
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateSnackbar, setDeactivateSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [confirmPushOpen, setConfirmPushOpen] = useState(false);

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

  const handleAdminMenuOpen = (event) => {
    setAdminAnchorEl(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const handleDeactivateClick = () => {
    handleProfileMenuClose();
    setDeactivateDialogOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    setDeactivating(true);
    const result = await deactivate();
    setDeactivating(false);
    setDeactivateDialogOpen(false);
    setDeactivateSnackbar({
      open: true,
      message: result.success
        ? result.message ||
          t(
            "Account deactivated. You have 30 days to log in again to reactivate.",
          )
        : result.message,
      severity: result.success ? "success" : "error",
    });
  };

  const navItems = [
    { name: t("Main Page"), path: "/", icon: <HomeIcon /> },
    { name: t("Search"), path: "/search", icon: <SearchIcon /> },
    { name: t("Products"), path: "/categories", icon: <CategoryIcon /> },
    { name: t("Favourites"), path: "/favourites", icon: <FavoriteIcon /> },
    { name: t("Brands"), path: "/brands", icon: <BusinessIcon /> },
    { name: t("Gifts"), path: "/gifts", icon: <CardGiftcardIcon /> },
    // Data Entry is now admin-only via Admin dropdown; no extra nav item for non-admins
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

  useEffect(() => {
    if (isSmUp) {
      setShowMobileNavbar(true);
      return undefined;
    }

    lastScrollYRef.current = window.scrollY || 0;

    const handleScroll = () => {
      const currentY = window.scrollY || 0;
      const prevY = lastScrollYRef.current;

      // Always show when at top.
      if (currentY <= 0) {
        setShowMobileNavbar(true);
        lastScrollYRef.current = 0;
        return;
      }

      // Ignore tiny movement to avoid flicker.
      if (Math.abs(currentY - prevY) < 4) return;

      if (currentY > prevY) {
        // Scrolling down -> hide
        setShowMobileNavbar(false);
      } else {
        // Scrolling up -> show
        setShowMobileNavbar(true);
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSmUp]);

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background:
            "linear-gradient(120deg, #1E6FD9 0%, #4A90E2 56%, #FF7A1A 100%)",
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
          transform: isSmUp
            ? "translateY(0)"
            : showMobileNavbar
            ? "translateY(0)"
            : "translateY(-110%)",
          transition: "transform 260ms ease",
          willChange: "transform",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: isSmUp ? "space-between" : "flex-start",
            px: { xs: 1, sm: 2, md: 4 },
            ...(isSmUp ? {} : { minHeight: 56 }),
          }}
        >
          {/* Mobile navbar: Notification | Favourites | App name (center) | Search | Profile */}
          {!isSmUp && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                justifyContent: "space-between",
                gap: 0.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.9 }}>
                {NOTIFICATIONS_CENTER_ENABLED && (
                  <IconButton
                    onClick={handleNotificationMenuOpen}
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
                    <Badge badgeContent={unreadCount} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                )}
                <IconButton
                  component={Link}
                  to="/search"
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
                  <SearchIcon />
                </IconButton>
                <IconButton
                  onClick={() => triggerRefresh?.()}
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
                  aria-label={t("Refresh")}
                >
                  <RefreshIcon />
                </IconButton>
              </Box>
              <Typography
                component={Link}
                to="/"
                sx={{
                  flex: 1,
                  textAlign: "center",
                  textDecoration: "none",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  background: "linear-gradient(45deg, #ffffff, #FFF5EC)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  transition: "all 0.3s ease",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              >
                {t("Discount Center")}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.9 }}>
                <IconButton
                  component={Link}
                  to="/favourites"
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
                  <FavoriteIcon />
                </IconButton>
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
              </Box>
            </Box>
          )}

          {/* Desktop: Logo and Brand */}
          {isSmUp && (
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
                {t("Discount Center")}
              </Typography>
            </Box>
          )}

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

              {/* Remaining nav items (Brands, Gifts, Admin) - exclude Favourites (moved to profile) */}
              {navItems
                .slice(2)
                .filter((item) => item.path !== "/favourites")
                .map((item) => (
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
              {/* Admin dropdown (Data Entry + Users + Dashboard) - for admin users only */}
              {isAdmin && (
                <>
                  <Button
                    onClick={handleAdminMenuOpen}
                    startIcon={<AdminPanelSettingsIcon />}
                    endIcon={<ExpandMoreIcon />}
                    sx={{
                      color: "white",
                      textTransform: "none",
                      fontSize: "1.3rem",
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      minWidth: "auto",
                      backgroundColor: location.pathname.startsWith("/admin")
                        ? "rgba(255,255,255,0.2)"
                        : "transparent",
                      border: location.pathname.startsWith("/admin")
                        ? "1px solid rgba(255,255,255,0.3)"
                        : "1px solid transparent",
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.15)",
                        borderColor: "rgba(255,255,255,0.5)",
                      },
                    }}
                  >
                    {t("Admin")}
                  </Button>
                  <Menu
                    anchorEl={adminAnchorEl}
                    open={Boolean(adminAnchorEl)}
                    onClose={handleAdminMenuClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                    transformOrigin={{ vertical: "top", horizontal: "center" }}
                    PaperProps={{
                      sx: {
                        mt: 1.5,
                        minWidth: 180,
                        backgroundColor:
                          theme.palette.mode === "dark" ? "#1E6FD9" : "#fff",
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                      },
                    }}
                  >
                    <MenuItem
                      component={Link}
                      to="/admin"
                      onClick={handleAdminMenuClose}
                      selected={location.pathname === "/admin"}
                    >
                      <ListItemIcon>
                        <AdminPanelSettingsIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={t("Data Entry")} />
                    </MenuItem>
                    <MenuItem
                      component={Link}
                      to="/admin/users"
                      onClick={handleAdminMenuClose}
                      selected={location.pathname === "/admin/users"}
                    >
                      <ListItemIcon>
                        <PeopleIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={t("Users")} />
                    </MenuItem>
                    <MenuItem
                      component={Link}
                      to="/admin/dashboard"
                      onClick={handleAdminMenuClose}
                      selected={location.pathname === "/admin/dashboard"}
                    >
                      <ListItemIcon>
                        <DashboardIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={t("Admin Dashboard")} />
                    </MenuItem>
                  </Menu>
                </>
              )}
              {NOTIFICATIONS_CENTER_ENABLED && (
                <IconButton
                  onClick={handleNotificationMenuOpen}
                  sx={{
                    color: "white",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    transition: "all 0.3s ease",
                    width: 40,
                    height: 40,
                    ml: 0.5,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.2)",
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              )}
              {/* Desktop Profile Icon (contains Favourites, Login/Logout, City, Mode) */}
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
                  ml: 0.5,
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.2)",
                    transform: "scale(1.1)",
                  },
                }}
              >
                <PersonIcon />
              </IconButton>
            </Box>
          )}

          {/* Controls - desktop only (mobile has its own navbar above) */}
          {isSmUp && (
            <Box display="flex" alignItems="center" gap={{ xs: 2, sm: 1 }}>
              {/* Desktop Controls */}
              <>
                {/* Language Selector (desktop - stays in navbar) */}
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
                    <MenuItem value="ku">
                      <Box
                        component="span"
                        display="flex"
                        alignItems="center"
                        gap={1}
                      >
                        <img
                          src={kurdishFlag}
                          alt="Kurdish"
                          style={{
                            width: 20,
                            height: 14,
                            objectFit: "cover",
                            borderRadius: 2,
                          }}
                        />
                        {t("Kurdish")}
                      </Box>
                    </MenuItem>
                  </Select>
                </Paper>
              </>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {NOTIFICATIONS_CENTER_ENABLED && (
        <Menu
          anchorEl={notificationAnchorEl}
          open={Boolean(notificationAnchorEl)}
          onClose={handleNotificationMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 320,
              maxWidth: 380,
              maxHeight: 400,
              backgroundColor:
                theme.palette.mode === "dark" ? "#1E6FD9" : "#fff",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {t("Notifications")}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                {unreadCount > 0 && (
                  <Button
                    size="small"
                    onClick={() => markAllAsRead()}
                    sx={{ textTransform: "none" }}
                  >
                    {t("Mark all read")}
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    size="small"
                    onClick={() => clearAll()}
                    sx={{ textTransform: "none", color: "text.secondary" }}
                  >
                    {t("Clear notifications")}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
          {pushSupported && pushPermission === "default" && (
            <Box
              sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}
            >
              <Button
                fullWidth
                variant="outlined"
                size="small"
                disabled={pushSubscribing}
                onClick={() => requestPushPermission()}
                sx={{ textTransform: "none" }}
              >
                {pushSubscribing
                  ? t("Enabling...")
                  : t("Enable system notifications")}
              </Button>
            </Box>
          )}
          <Box sx={{ maxHeight: 280, overflow: "auto" }}>
            {notifications.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ p: 2, textAlign: "center" }}
              >
                {t("No notifications")}
              </Typography>
            ) : (
              notifications.map((n) => (
                <ListItemButton
                  key={n._id}
                  onClick={() => {
                    markAsRead(n._id);
                  }}
                  sx={{
                    py: 1.5,
                    px: 2,
                    backgroundColor: n.read ? "transparent" : "action.hover",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ width: "100%" }}>
                    <Typography
                      variant="body2"
                      fontWeight={n.read ? 400 : 600}
                      sx={{ mb: 0.25 }}
                    >
                      {n.title}
                    </Typography>
                    {n.body && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {n.body.length > 120
                          ? `${n.body.slice(0, 120)}...`
                          : n.body}
                      </Typography>
                    )}
                    {n.link && (
                      <Typography
                        component={Link}
                        to={n.link}
                        variant="caption"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(n._id);
                          handleNotificationMenuClose();
                        }}
                        sx={{
                          display: "inline-block",
                          mt: 0.5,
                          color: "primary.main",
                          textDecoration: "underline",
                          fontSize: "0.7rem",
                          "&:hover": { color: "primary.dark" },
                        }}
                      >
                        {t("View")} →
                      </Typography>
                    )}
                  </Box>
                </ListItemButton>
              ))
            )}
          </Box>
        </Menu>
      )}

      {/* Guest name dialog */}
      <Dialog
        open={guestNameDialogOpen}
        onClose={() => setGuestNameDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("Change account name")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="normal"
            label={t("Name")}
            value={guestNameInput}
            onChange={(e) => setGuestNameInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGuestNameDialogOpen(false)}>
            {t("Cancel")}
          </Button>
          <Button
            onClick={async () => {
              const name = guestNameInput.trim();
              if (!name) return;
              const res = await updateGuestName(name);
              if (res?.success) {
                setGuestNameDialogOpen(false);
              } else {
                alert(res?.message || t("Failed to update name"));
              }
            }}
          >
            {t("Save")}
          </Button>
        </DialogActions>
      </Dialog>

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
              theme.palette.mode === "dark" ? "#1E6FD9" : "#ffffff",
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
                      theme.palette.mode === "dark" ? "#1E6FD9" : "#1E6FD9",
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  {(user.displayName || user.username || "U")
                    .charAt(0)
                    .toUpperCase()}
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    color="text.primary"
                    fontWeight={600}
                    sx={{ fontSize: "1rem" }}
                  >
                    {user.displayName || user.username || t("User")}
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
                {(guestUser?.displayName || "G").charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography
                  variant="subtitle1"
                  color="text.primary"
                  fontWeight={600}
                  sx={{ fontSize: "1rem" }}
                >
                  {guestUser?.displayName || t("Guest User")}
                </Typography>
                {/* <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.8rem" }}
                >
                  {t("Not logged in")}
                </Typography> */}
              </Box>
            </Box>
          )}
        </Box>
        {!user && (
          <MenuItem
            onClick={() => {
              setGuestNameInput(guestUser?.displayName || "");
              setGuestNameDialogOpen(true);
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
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={t("Change name")}
              primaryTypographyProps={{
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            />
          </MenuItem>
        )}
        {/* Favourites - desktop only (mobile has separate Favourites icon in navbar) */}
        {isSmUp && (
          <MenuItem
            component={Link}
            to="/favourites"
            onClick={handleProfileMenuClose}
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
              <FavoriteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={t("Favourites")}
              primaryTypographyProps={{
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            />
          </MenuItem>
        )}

        {/* City Selector - in profile (desktop & mobile) - single button with submenu */}
        {
          <>
            <ListItemButton
              onClick={(e) =>
                setCityAnchorEl(cityAnchorEl ? null : e.currentTarget)
              }
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
                <LocationOnIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t("City")}
                secondary={(() => {
                  const city = cities.find((c) => c.value === selectedCity);
                  return city ? `${city.flag} ${city.label}` : "";
                })()}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
                secondaryTypographyProps={{
                  fontSize: "0.8rem",
                  color: "text.secondary",
                }}
              />
              {cityAnchorEl ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </ListItemButton>
            <Menu
              anchorEl={cityAnchorEl}
              open={Boolean(cityAnchorEl)}
              onClose={() => setCityAnchorEl(null)}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              PaperProps={{
                sx: {
                  mt: -1,
                  ml: 0.5,
                  minWidth: 160,
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#1E6FD9" : "#fff",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                },
              }}
            >
              {cities.map((city) => (
                <MenuItem
                  key={city.value}
                  onClick={() => {
                    changeCity(city.value);
                    setCityAnchorEl(null);
                  }}
                  selected={selectedCity === city.value}
                  sx={{
                    py: 1,
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
                    <LocationOnIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${city.flag} ${city.label}`}
                    primaryTypographyProps={{ fontSize: "0.875rem" }}
                  />
                </MenuItem>
              ))}
            </Menu>

            <Divider />
          </>
        }

        {/* Theme / Mode Toggle */}
        {/* <MenuItem
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
        </MenuItem> */}

        {NOTIFICATIONS_CENTER_ENABLED && (
          <>
            {/* Push / Notification Center On/Off - always visible in profile */}
            <MenuItem
              component="div"
              disableRipple
              onClick={(e) => e.stopPropagation()}
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
                <NotificationsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t("Notification center")}
                secondary={
                  !pushSupported
                    ? t("Not supported")
                    : pushEnabled
                      ? t("On")
                      : t("Off")
                }
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
                secondaryTypographyProps={{
                  fontSize: "0.75rem",
                  color: "text.secondary",
                }}
              />
              <Switch
                size="small"
                checked={pushEnabled}
                disabled={!pushSupported || pushSubscribing}
                onChange={(e) => {
                  if (e.target.checked) {
                    setConfirmPushOpen(true);
                  } else {
                    setPushEnabled(false);
                  }
                }}
                color="primary"
              />
            </MenuItem>

            {/* Confirm enable notification center */}
            <Dialog
              open={confirmPushOpen}
              onClose={() => setConfirmPushOpen(false)}
              maxWidth="xs"
              fullWidth
            >
              <DialogTitle>{t("Notification center")}</DialogTitle>
              <DialogContent>
                <Typography variant="body2" color="text.secondary">
                  {t(
                    "Enable notifications to receive updates and offers from the app?",
                  )}
                </Typography>
              </DialogContent>
              <DialogActions sx={{ px: 2, pb: 2 }}>
                <Button onClick={() => setConfirmPushOpen(false)}>
                  {t("Cancel")}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={pushSubscribing}
                  onClick={async () => {
                    setConfirmPushOpen(false);
                    if (pushPermission === "default") {
                      await requestPushPermission();
                    } else {
                      await setPushEnabled(true);
                    }
                  }}
                >
                  {pushSubscribing ? t("Enabling...") : t("Enable")}
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}

        <Divider />

        {/* Language options (mobile - inside profile, one row) */}
        {!isSmUp && (
          <>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {t("Language")}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                gap: 1,
                px: 2,
                py: 1.5,
                flexWrap: "nowrap",
              }}
            >
              <Button
                size="small"
                variant={lang === "en" ? "contained" : "outlined"}
                onClick={() => {
                  i18n.changeLanguage("en");
                  handleProfileMenuClose();
                }}
                sx={{
                  minWidth: "auto",
                  px: 1.5,
                  py: 0.75,
                  fontSize: "0.75rem",
                  whiteSpace: "nowrap",
                }}
              >
                🇺🇸 EN
              </Button>
              <Button
                size="small"
                variant={lang === "ar" ? "contained" : "outlined"}
                onClick={() => {
                  i18n.changeLanguage("ar");
                  handleProfileMenuClose();
                }}
                sx={{
                  minWidth: "auto",
                  px: 1.5,
                  py: 0.75,
                  fontSize: "0.75rem",
                  whiteSpace: "nowrap",
                }}
              >
                🇸🇦 AR
              </Button>
              <Button
                size="small"
                variant={lang === "ku" ? "contained" : "outlined"}
                onClick={() => {
                  i18n.changeLanguage("ku");
                  handleProfileMenuClose();
                }}
                sx={{
                  minWidth: "auto",
                  px: 1.5,
                  py: 0.75,
                  fontSize: "0.75rem",
                  whiteSpace: "nowrap",
                }}
              >
                <Box
                  component="span"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                >
                  <img
                    src={kurdishFlag}
                    alt=""
                    style={{
                      width: 16,
                      height: 12,
                      objectFit: "cover",
                      borderRadius: 2,
                    }}
                  />
                  {t("Kurdish")}
                </Box>
              </Button>
            </Box>
            <Divider />
          </>
        )}

        {/* Admin group (Data Entry + Dashboard) and Logout / Login */}
        {user ? (
          <>
            {isAdmin && (
              <>
                <MenuItem
                  component={Link}
                  to="/admin"
                  onClick={handleProfileMenuClose}
                  sx={{
                    py: 1.5,
                    px: 2,
                    color:
                      theme.palette.mode === "dark" ? "#e2e8f0" : "#1E6FD9",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.04)",
                    },
                  }}
                >
                  <ListItemIcon>
                    <AdminPanelSettingsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("Data Entry")}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  />
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/admin/dashboard"
                  onClick={handleProfileMenuClose}
                  sx={{
                    py: 1.5,
                    px: 2,
                    color:
                      theme.palette.mode === "dark" ? "#e2e8f0" : "#1E6FD9",
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
                <Divider />
              </>
            )}
            <>
              {/* Privacy Policy - shown for both mobile and desktop */}
              <MenuItem
                component={Link}
                to="/privacy-policy"
                onClick={handleProfileMenuClose}
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
                  <PrivacyTipIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={t("Privacy Policy")}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                />
              </MenuItem>
              {/* Contact Us - opens WhatsApp */}
              <MenuItem
                onClick={() => {
                  openWhatsApp();
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
                  <ContactSupportIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={t("Contact Us")}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                />
              </MenuItem>
              <Divider />
              {/* Deactivate Account - 30-day grace period then permanent deletion */}
              <MenuItem
                onClick={handleDeactivateClick}
                sx={{
                  py: 1.5,
                  px: 2,
                  color: theme.palette.secondary.main,
                  "&:hover": {
                    backgroundColor: "rgba(255,122,26,0.10)",
                  },
                }}
              >
                <ListItemIcon>
                  <BlockIcon sx={{ color: theme.palette.secondary.main }} />
                </ListItemIcon>
                <ListItemText
                  primary={t("Deactivate Account")}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                />
              </MenuItem>
              {/* Logout - now available on both desktop and mobile */}
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
          </>
        ) : (
          <>
            <Divider />
            {/* Privacy Policy - shown for both mobile and desktop */}
            <MenuItem
              component={Link}
              to="/privacy-policy"
              onClick={handleProfileMenuClose}
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
                <PrivacyTipIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t("Privacy Policy")}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              />
            </MenuItem>
            {/* Contact Us - opens WhatsApp */}
            <MenuItem
              onClick={() => {
                openWhatsApp();
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
                <ContactSupportIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t("Contact Us")}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              />
            </MenuItem>
            <Divider />
            {/* Login - now available on both desktop and mobile */}
            <MenuItem
              component={Link}
              to="/login"
              onClick={handleProfileMenuClose}
              sx={{
                py: 1.5,
                px: 2,
                color: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: "rgba(30,111,217,0.08)",
                },
              }}
            >
              <ListItemIcon>
                <LoginIcon sx={{ color: theme.palette.primary.main }} />
              </ListItemIcon>
              <ListItemText
                primary={t("Login")}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              />
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Deactivate Account confirmation dialog */}
      <Dialog
        open={deactivateDialogOpen}
        onClose={() => !deactivating && setDeactivateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("Deactivate Account")}</DialogTitle>
        <DialogContent>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography
              component="li"
              variant="body2"
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              {t(
                "Your account will be inactive immediately and you will be logged out.",
              )}
            </Typography>
            <Typography
              component="li"
              variant="body2"
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              {t(
                "You have 30 days to log in again to reactivate your account and cancel deletion.",
              )}
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              {t(
                "If you do not log in within 30 days, your account and all data will be permanently deleted.",
              )}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t("Are you sure you want to deactivate your account?")}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button
            onClick={() => setDeactivateDialogOpen(false)}
            disabled={deactivating}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="contained"
            sx={{
              color: "white",
              backgroundColor: "red",
            }}
            onClick={handleDeactivateConfirm}
            disabled={deactivating}
          >
            {deactivating ? t("Deactivating...") : t("Deactivate Account")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate result snackbar */}
      <Snackbar
        open={deactivateSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setDeactivateSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setDeactivateSnackbar((s) => ({ ...s, open: false }))}
          severity={deactivateSnackbar.severity}
          sx={{ width: "100%" }}
        >
          {deactivateSnackbar.message}
        </Alert>
      </Snackbar>

      {NOTIFICATIONS_CENTER_ENABLED && (
        <Snackbar
          open={!!pushEnableError}
          autoHideDuration={5000}
          onClose={() => setPushEnableError(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setPushEnableError(null)}
            severity="warning"
            sx={{ width: "100%" }}
          >
            {pushEnableError === "denied"
              ? t(
                  "Notifications blocked. Enable them in your browser settings.",
                )
              : t("Could not enable notifications. Try again.")}
          </Alert>
        </Snackbar>
      )}

      {/* Stores Dropdown removed */}
    </>
  );
};

export default NavigationBar;
