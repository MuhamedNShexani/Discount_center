import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NightsStayIcon from "@mui/icons-material/NightsStay"; // Moon icon for dark mode
import WbSunnyIcon from "@mui/icons-material/WbSunny"; // Sun icon for light mode
import LanguageIcon from "@mui/icons-material/Language";
import HomeIcon from "@mui/icons-material/Home";
import BusinessIcon from "@mui/icons-material/Business"; // Changed from StorefrontIcon for consistency with user's code
import CategoryIcon from "@mui/icons-material/Category";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link as RouterLink, useLocation } from "react-router-dom"; // Using RouterLink for clarity
import { useAuth } from "./context/AuthContext";

export default function NavigationBar({
  darkMode,
  setDarkMode,
  lang,
  handleLangChange,
  t,
}) {
  const theme = useTheme();
  // Check if screen is small (mobile)
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth(); // Using 'user' as per your AuthContext usage
  const location = useLocation(); // To highlight active link

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
    { name: t("Companies"), path: "/companies", icon: <BusinessIcon /> },
    { name: t("Categories"), path: "/categories", icon: <CategoryIcon /> },
    {
      name: t("Admin"),
      path: "/admin",
      icon: <AdminPanelSettingsIcon />,
      protected: true,
    }, // Protected route
  ];

  return (
    <AppBar position="static" sx={{ backgroundColor: "#2B8264" }}>
      <Toolbar>
        {/* Logo and Title - Always visible, aligned left */}
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            mr: 2, // Margin right for spacing
            flexShrink: 0, // Prevent shrinking on small screens
          }}
        >
          <Box
            component="img"
            src="/logo192.png" // Ensure this path is correct
            alt="Logo"
            sx={{
              height: 56,
              width: 76,
              mr: { xs: 1, sm: 2 }, // Smaller margin on xs
              borderRadius: "50%",
              objectFit: "cover",
              background: "#fff",
            }}
          />
          <Typography
            variant="h6"
            component="div"
            sx={{
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: { xs: "1rem", sm: "1.25rem" }, // Responsive font size
              whiteSpace: "nowrap", // Prevent wrapping
            }}
          >
            {t("Market Products")}
          </Typography>
        </Box>

        {isMobile ? (
          <>
            {/* Mobile: Hamburger menu icon on the right */}
            <Box sx={{ flexGrow: 1 }} /> {/* Pushes menu icon to the right */}
            <IconButton
              edge="end" // Aligns to the end (right)
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ ml: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor={theme.direction === "rtl" ? "left" : "right"} // Drawer opens from right for LTR, left for RTL
              open={drawerOpen}
              onClose={toggleDrawer(false)}
              PaperProps={{
                sx: {
                  width: 250, // Fixed width for the drawer
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <Box
                sx={{ width: 250 }}
                role="presentation"
                onClick={toggleDrawer(false)}
                onKeyDown={toggleDrawer(false)}
              >
                <List>
                  {navItems.map((item) =>
                    item.protected && !user ? null : ( // Only show admin if logged in
                      <ListItem
                        button
                        key={item.name}
                        component={RouterLink}
                        to={item.path}
                        selected={location.pathname === item.path} // Highlight active link
                        sx={{
                          color: "#FFFFFF",
                          "&.Mui-selected": {
                            backgroundColor: theme.palette.action.selected,
                          },
                          "&:hover": {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.name} />
                      </ListItem>
                    )
                  )}

                  {/* Language Selector in Drawer */}
                  <ListItem>
                    <ListItemIcon sx={{ color: theme.palette.text.secondary }}>
                      <LanguageIcon />
                    </ListItemIcon>
                    <FormControlLabel
                      control={
                        <Select
                          value={lang}
                          onChange={handleLangChange}
                          size="small"
                          sx={{
                            color: theme.palette.text.primary,
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: theme.palette.divider,
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: theme.palette.primary.main,
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: theme.palette.primary.main,
                            },
                            "& .MuiSvgIcon-root": {
                              color: theme.palette.text.secondary,
                            },
                          }}
                        >
                          <MenuItem value="en">{t("English")}</MenuItem>
                          <MenuItem value="ar">{t("Arabic")}</MenuItem>
                          <MenuItem value="ku">{t("Kurdish")}</MenuItem>
                        </Select>
                      }
                      label="" // Label is handled by ListItemText
                      labelPlacement="start"
                    />
                  </ListItem>

                  {/* Dark Mode Toggle in Drawer */}
                  <ListItem>
                    <ListItemIcon sx={{ color: theme.palette.text.secondary }}>
                      {darkMode ? <WbSunnyIcon /> : <NightsStayIcon />}
                    </ListItemIcon>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={darkMode}
                          onChange={() => setDarkMode(!darkMode)}
                          name="darkMode"
                          color="primary"
                        />
                      }
                      label={darkMode ? t("Dark Mode") : t("Light Mode")}
                      sx={{ color: theme.palette.text.primary }}
                    />
                  </ListItem>

                  {/* Login/Logout Button in Drawer */}
                  <ListItem
                    button
                    onClick={
                      user
                        ? logout
                        : () => {
                            /* navigate to login */
                          }
                    } // Add actual navigation if not logged in
                    component={user ? "div" : RouterLink} // Use RouterLink if not logged in
                    to={user ? "" : "/login"} // Navigate to login if not logged in
                    sx={{
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: theme.palette.text.secondary }}>
                      {user ? <LogoutIcon /> : <LoginIcon />}
                    </ListItemIcon>
                    <ListItemText primary={user ? t("Logout") : t("Login")} />
                  </ListItem>
                </List>
              </Box>
            </Drawer>
          </>
        ) : (
          <>
            {/* Desktop: Regular navigation buttons */}
            <Box
              sx={{
                flexGrow: 1, // Pushes elements to the right
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end", // Aligns items to the right
                gap: 2, // Spacing between items
              }}
            >
              {navItems.map((item) =>
                item.protected && !user ? null : (
                  <Button
                    key={item.name}
                    color="inherit"
                    component={RouterLink}
                    to={item.path}
                    sx={{
                      color: "#FFFFFF",
                      mx: 0.5, // Reduced horizontal margin for better fit
                      fontWeight:
                        location.pathname === item.path ? "bold" : "normal",
                      borderBottom:
                        location.pathname === item.path
                          ? "2px solid white"
                          : "none",
                      "&:hover": {
                        borderBottom: "2px solid white",
                      },
                      fontSize: { sm: 14, md: 16, lg: 18 }, // Responsive font size
                      py: 1, // Adjusted padding
                      px: 2, // Adjusted padding
                    }}
                  >
                    {item.name}
                  </Button>
                )
              )}

              {/* Theme Switch */}
              <Box sx={{ display: "flex", alignItems: "center", mx: 1 }}>
                <WbSunnyIcon sx={{ color: "#FFD600", fontSize: 22 }} />
                <Switch
                  checked={darkMode}
                  onChange={() => setDarkMode((prev) => !prev)}
                  color="default"
                  inputProps={{ "aria-label": "theme switch" }}
                  sx={{
                    "& .MuiSwitch-thumb": {
                      backgroundColor: darkMode ? "#2B8264" : "#fff", // Thumb color
                    },
                    "& .MuiSwitch-track": {
                      backgroundColor: darkMode ? "#2B8264" : "#714329", // Track color
                      opacity: 1,
                    },
                    "&.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#714329 !important", // Track color when checked
                    },
                  }}
                />
                <NightsStayIcon sx={{ color: "#FFD600", fontSize: 22 }} />
              </Box>

              {/* Language Selector */}
              <Select
                value={lang}
                onChange={handleLangChange}
                size="small"
                sx={{
                  color: "#FFFFFF",
                  backgroundColor: darkMode
                    ? "rgba(19, 18, 18, 0.08)"
                    : "rgba(255,255,255,0.08)",
                  borderRadius: 1,
                  minWidth: 90,
                  ".MuiSvgIcon-root": {
                    color: "#FFFFFF",
                  },
                  "& .MuiOutlinedInput-notchedOutline": { border: 0 }, // Remove border
                  "&:hover .MuiOutlinedInput-notchedOutline": { border: 0 },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    border: 0,
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: "#2B8264",
                      color: "#FFFFFF",
                    },
                  },
                }}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="ar">العربية</MenuItem>
                <MenuItem value="ku">کوردی</MenuItem>
              </Select>

              {/* Login/Logout Button */}
              {user ? (
                <Button
                  onClick={logout}
                  startIcon={<LogoutIcon />}
                  sx={{
                    color: "#FFFFFF",
                    ml: 1,
                    fontSize: { sm: 14, md: 16, lg: 18 }, // Responsive font size
                    py: 1,
                    px: 2,
                  }}
                >
                  {t("Logout")}
                </Button>
              ) : (
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/login"
                  startIcon={<LoginIcon />}
                  sx={{
                    color: "#FFFFFF",
                    ml: 1,
                    fontSize: { sm: 14, md: 16, lg: 18 }, // Responsive font size
                    py: 1,
                    px: 2,
                  }}
                >
                  {t("Login")}
                </Button>
              )}
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
