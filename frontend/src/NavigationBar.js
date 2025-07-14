import React from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Typography,
  Select,
  MenuItem,
  Switch,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import BusinessIcon from "@mui/icons-material/Business";
import CategoryIcon from "@mui/icons-material/Category";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import { useAuth } from "./context/AuthContext";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";

export default function NavigationBar({
  darkMode,
  setDarkMode,
  lang,
  setLang,
  handleLangChange,
  t,
  i18n,
}) {
  const location = useLocation();
  const { user, logout } = useAuth();
  return (
    <AppBar
      position="static"
      sx={{ backgroundColor: darkMode ? "#3E2723" : "#714329" }}
    >
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              mr: 1,
            }}
          >
            <Box
              component="img"
              src="/logo192.png"
              alt="Logo"
              sx={{
                height: 56,
                width: 76,
                mr: 2,
                borderRadius: "50%",
                objectFit: "cover",
                background: "#fff",
              }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{ color: "#FFFFFF", fontWeight: 700 }}
            >
              {t("Market Products")}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
          <WbSunnyIcon
            sx={{ color: darkMode ? "#B08463" : "#FFD600", fontSize: 22 }}
          />
          <Switch
            checked={darkMode}
            onChange={() => setDarkMode((prev) => !prev)}
            color="default"
            inputProps={{ "aria-label": "theme switch" }}
          />
          <NightsStayIcon
            sx={{ color: darkMode ? "#FFD600" : "#B08463", fontSize: 22 }}
          />
        </Box>
        <Select
          value={lang}
          onChange={handleLangChange}
          size="small"
          sx={{
            mr: 2,
            color: "#fff",
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 1,
            minWidth: 90,
            ".MuiSvgIcon-root": { color: "#fff" },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                backgroundColor: darkMode ? "#3E2723" : "#fff",
                color: darkMode ? "#fff" : "#714329",
              },
            },
          }}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="ar">العربية</MenuItem>
          <MenuItem value="ku">کوردی</MenuItem>
        </Select>
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            gap: 3,
          }}
        >
          <Button
            sx={{
              color: "#FFFFFF",
              fontSize: 18,
              py: 1.5,
              px: 3,
              backgroundColor:
                location.pathname === "/"
                  ? "rgba(255,255,255,0.18)"
                  : "inherit",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            }}
            component={RouterLink}
            to="/"
            startIcon={<HomeIcon />}
          >
            {t("Main Page")}
          </Button>
          <Button
            sx={{
              color: "#FFFFFF",
              fontSize: 18,
              py: 1.5,
              px: 3,
              backgroundColor: location.pathname.startsWith("/companies")
                ? "rgba(255,255,255,0.18)"
                : "inherit",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            }}
            component={RouterLink}
            to="/companies"
            startIcon={<BusinessIcon />}
          >
            {t("Companies")}
          </Button>
          <Button
            sx={{
              color: "#FFFFFF",
              fontSize: 18,
              py: 1.5,
              px: 3,
              backgroundColor: location.pathname.startsWith("/categories")
                ? "rgba(255,255,255,0.18)"
                : "inherit",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            }}
            component={RouterLink}
            to="/categories"
            startIcon={<CategoryIcon />}
          >
            {t("Categories")}
          </Button>
          {user ? (
            <>
              <Button
                sx={{
                  color: "#FFFFFF",
                  fontSize: 18,
                  py: 1.5,
                  px: 3,
                  backgroundColor: location.pathname.startsWith("/admin")
                    ? "rgba(255,255,255,0.18)"
                    : "inherit",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                }}
                component={RouterLink}
                to="/admin"
                startIcon={<AdminPanelSettingsIcon />}
              >
                {t("Admin")}
              </Button>
              <Button
                sx={{
                  color: "#FFFFFF",
                  fontSize: 18,
                  py: 1.5,
                  px: 3,
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                }}
                onClick={logout}
                startIcon={<LogoutIcon />}
              >
                {t("Logout")}
              </Button>
            </>
          ) : (
            <Button
              sx={{
                color: "#FFFFFF",
                fontSize: 18,
                py: 1.5,
                px: 3,
                backgroundColor: location.pathname.startsWith("/login")
                  ? "rgba(255,255,255,0.18)"
                  : "inherit",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
              }}
              component={RouterLink}
              to="/login"
              startIcon={<LoginIcon />}
            >
              {t("Login")}
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
