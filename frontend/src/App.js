import "./i18n";
import React, { useState, useMemo, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link as RouterLink,
  useLocation,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import BusinessIcon from "@mui/icons-material/Business";
import CategoryIcon from "@mui/icons-material/Category";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import Switch from "@mui/material/Switch";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import { useTranslation } from "react-i18next";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";

// Import pages
import MainPage from "./pages/MainPage";
import CompanyList from "./pages/CompanyList";
import ProductCategory from "./pages/ProductCategory";
import DataEntryForm from "./pages/DataEntryForm";
import ProductDetail from "./pages/ProductDetail";
import CompanyProfile from "./pages/CompanyProfile";
import { ErrorBoundary } from "./ErrorBoundary";
import NavigationBar from "./NavigationBar";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

const theme = createTheme({
  palette: {
    primary: {
      main: "#714329", // Dark brown - primary color
      light: "#B08463", // Medium brown - lighter variant
      dark: "#4A2A1A", // Darker variant
    },
    secondary: {
      main: "#B9937B", // Warm brown - secondary color
      light: "#D0B9A7", // Light brown - lighter variant
      dark: "#8B6B5A", // Darker variant
    },
    background: {
      default: "#F8F6F4", // Very light cream
      paper: "#FFFFFF", // White
    },
    text: {
      primary: "#2C1810", // Very dark brown for text
      secondary: "#714329", // Medium brown for secondary text
    },
    error: {
      main: "#D32F2F", // Keep red for errors
    },
    warning: {
      main: "#ED6C02", // Keep orange for warnings
    },
    success: {
      main: "#2E7D32", // Keep green for success
    },
    info: {
      main: "#0288D1", // Keep blue for info
    },
    divider: "#D0B9A7", // Light brown for dividers
  },
  typography: {
    h1: {
      color: "#714329",
    },
    h2: {
      color: "#714329",
    },
    h3: {
      color: "#714329",
    },
    h4: {
      color: "#714329",
    },
    h5: {
      color: "#714329",
    },
    h6: {
      color: "#714329",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#714329",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
        },
        contained: {
          backgroundColor: "#714329",
          "&:hover": {
            backgroundColor: "#5A3521",
          },
        },
        outlined: {
          borderColor: "#714329",
          color: "#714329",
          "&:hover": {
            borderColor: "#5A3521",
            backgroundColor: "rgba(113, 67, 41, 0.04)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(113, 67, 41, 0.1)",
          border: "1px solid rgba(176, 132, 99, 0.2)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
        colorPrimary: {
          backgroundColor: "#B9937B",
          color: "#FFFFFF",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

const Footer = () => (
  <Box
    component="footer"
    sx={{
      py: 2,
      px: 2,
      mt: "auto",
      backgroundColor: (theme) =>
        theme.palette.mode === "light"
          ? theme.palette.grey[200]
          : theme.palette.grey[800],
      textAlign: "right",
      borderTop: "1px solid",
      borderColor: (theme) => theme.palette.divider,
    }}
  >
    <Typography variant="body2" color="text.secondary">
      Powered By Muhamed N.Shexani@2025
    </Typography>
  </Box>
);

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language || "en");
  const location = useLocation();

  // RTL/LTR direction effect
  useEffect(() => {
    document.body.dir =
      i18n.language === "ar" || i18n.language === "ku" ? "rtl" : "ltr";
  }, [i18n.language]);

  // MUI RTL cache
  const isRtl = i18n.language === "ar" || i18n.language === "ku";
  const cacheRtl = useMemo(
    () =>
      createCache({
        key: isRtl ? "muirtl" : "muiltr",
        stylisPlugins: isRtl ? [rtlPlugin] : [],
      }),
    [isRtl]
  );

  const handleLangChange = (event) => {
    const newLang = event.target.value;
    setLang(newLang);
    i18n.changeLanguage(newLang);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: {
            main: "#714329",
            light: "#B08463",
            dark: "#4A2A1A",
          },
          secondary: {
            main: "#B9937B",
            light: "#D0B9A7",
            dark: "#8B6B5A",
          },
          background: darkMode
            ? {
                default: "#2C1810",
                paper: "#3E2723",
              }
            : {
                default: "#F8F6F4",
                paper: "#FFFFFF",
              },
          text: darkMode
            ? {
                primary: "#F8F6F4",
                secondary: "#B08463",
              }
            : {
                primary: "#2C1810",
                secondary: "#714329",
              },
          error: { main: "#D32F2F" },
          warning: { main: "#ED6C02" },
          success: { main: "#2E7D32" },
          info: { main: "#0288D1" },
          divider: darkMode ? "#5A3521" : "#D0B9A7",
        },
        typography: {
          h1: { color: darkMode ? "#F8F6F4" : "#714329" },
          h2: { color: darkMode ? "#F8F6F4" : "#714329" },
          h3: { color: darkMode ? "#F8F6F4" : "#714329" },
          h4: { color: darkMode ? "#F8F6F4" : "#714329" },
          h5: { color: darkMode ? "#F8F6F4" : "#714329" },
          h6: { color: darkMode ? "#F8F6F4" : "#714329" },
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: darkMode ? "#3E2723" : "#714329",
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: "none",
                fontWeight: 600,
              },
              contained: {
                backgroundColor: darkMode ? "#714329" : "#714329",
                "&:hover": {
                  backgroundColor: darkMode ? "#5A3521" : "#5A3521",
                },
              },
              outlined: {
                borderColor: "#714329",
                color: "#714329",
                "&:hover": {
                  borderColor: "#5A3521",
                  backgroundColor: darkMode
                    ? "rgba(113, 67, 41, 0.2)"
                    : "rgba(113, 67, 41, 0.04)",
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: darkMode
                  ? "0 4px 12px rgba(255,255,255,0.05)"
                  : "0 4px 12px rgba(113, 67, 41, 0.1)",
                border: darkMode
                  ? "1px solid #5A3521"
                  : "1px solid rgba(176, 132, 99, 0.2)",
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: { borderRadius: 16 },
              colorPrimary: {
                backgroundColor: "#B9937B",
                color: "#FFFFFF",
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: { borderRadius: 12 },
            },
          },
        },
      }),
    [darkMode]
  );

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NavigationBar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          lang={lang}
          setLang={setLang}
          handleLangChange={handleLangChange}
          t={t}
          i18n={i18n}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            py: 3,
            backgroundColor: (theme) => theme.palette.background.default,
            minHeight: "calc(100vh - 64px - 50px)",
          }}
        >
          <Container maxWidth="lg">
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/companies" element={<CompanyList />} />
              <Route path="/companies/:id" element={<CompanyProfile />} />
              <Route path="/categories" element={<ProductCategory />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <DataEntryForm />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/products/:id" element={<ProductDetail />} />
            </Routes>
          </Container>
        </Box>
        <Footer />
      </ThemeProvider>
    </CacheProvider>
  );
}

const Root = () => (
  <AuthProvider>
    <Router>
      <ScrollToTop />
      <App />
    </Router>
  </AuthProvider>
);

export default Root;
