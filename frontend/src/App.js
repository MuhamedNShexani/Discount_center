import "./i18n";
import React, { useState, useMemo, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Container, Typography, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";

// Import pages
import MainPage from "./pages/MainPage";
import MarketList from "./pages/MarketList";
import ProductCategory from "./pages/ProductCategory";
import DataEntryForm from "./pages/DataEntryForm";
import ProductDetail from "./pages/ProductDetail";
import MarketProfile from "./pages/MarketProfile";
import NavigationBar from "./NavigationBar"; // Make sure this path is correct
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

// Footer component remains the same
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

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language || "en");

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
            main: "#2B8264", // Dark green (main brand color)
            light: "#58A789", // Lighter green for hover/highlights
            dark: "#1E5F49", // Darker green
          },
          secondary: {
            main: "#A5D6C2", // Soft mint green (secondary/accent)
            light: "#CFF0E5",
            dark: "#78B39B",
          },
          background: darkMode
            ? {
                default: "#1A2D28", // deep greenish background
                paper: "#24423B",
              }
            : {
                default: "#F4FAF8", // very light mint/white
                paper: "#FFFFFF",
              },
          text: darkMode
            ? {
                primary: "#FFFFFF",
                secondary: "#A5D6C2",
              }
            : {
                primary: "#2B2B2B",
                secondary: "#2B8264",
              },
          error: { main: "#D32F2F" },
          warning: { main: "#ED6C02" },
          success: { main: "#2E7D32" },
          info: { main: "#0288D1" },
          divider: darkMode ? "#396A5A" : "#CFF0E5",
        },
        typography: {
          h1: { color: darkMode ? "#FFFFFF" : "#2B8264" },
          h2: { color: darkMode ? "#FFFFFF" : "#2B8264" },
          h3: { color: darkMode ? "#FFFFFF" : "#2B8264" },
          h4: { color: darkMode ? "#FFFFFF" : "#2B8264" },
          h5: { color: darkMode ? "#FFFFFF" : "#2B8264" },
          h6: { color: darkMode ? "#FFFFFF" : "#2B8264" },
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: darkMode ? "#24423B" : "#2B8264",
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
                backgroundColor: darkMode ? "#2B8264" : "#2B8264",
                "&:hover": {
                  backgroundColor: darkMode ? "#1E5F49" : "#1E5F49",
                },
              },
              outlined: {
                borderColor: "#2B8264",
                color: "#2B8264",
                "&:hover": {
                  borderColor: "#1E5F49",
                  backgroundColor: darkMode
                    ? "rgba(43, 130, 100, 0.2)"
                    : "rgba(43, 130, 100, 0.04)",
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: darkMode
                  ? "0 4px 12px rgba(0,0,0,0.15)"
                  : "0 4px 12px rgba(43,130,100,0.1)",
                border: darkMode
                  ? "1px solid #396A5A"
                  : "1px solid rgba(165, 214, 194, 0.3)",
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: { borderRadius: 16 },
              colorPrimary: {
                backgroundColor: "#A5D6C2",
                color: "#1E5F49",
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
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh", // Make the Box cover the full viewport height
          }}
        >
          <NavigationBar
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            lang={lang}
            // setLang={setLang} // setLang is not used directly by NavigationBar anymore
            handleLangChange={handleLangChange}
            t={t}
            // i18n={i18n} // i18n is not used directly by NavigationBar anymore
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1, // Allows this Box to expand and push the footer down
              py: 3,
              backgroundColor: (theme) => theme.palette.background.default,
            }}
          >
            <Container maxWidth="lg">
              <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/markets" element={<MarketList />} />
                <Route path="/markets/:id" element={<MarketProfile />} />
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
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
}

// Root component remains the same
const Root = () => (
  <AuthProvider>
    <Router>
      <ScrollToTop />
      <App />
    </Router>
  </AuthProvider>
);

export default Root;
