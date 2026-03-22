import "./i18n";
import "./styles/kurdishFonts.css";
import React, { useState, useMemo, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  Container,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";

// Import pages
import MainPage from "./pages/MainPage";
import ReelsPage from "./pages/reels";
import StoreList from "./pages/StoreList";
import BrandList from "./pages/BrandList";
import BrandProfile from "./pages/BrandProfile";
import ProductCategory from "./pages/ProductCategory";
import DataEntryForm from "./pages/DataEntryForm";
import ProductDetail from "./pages/ProductDetail";
import StoreProfile from "./pages/StoreProfile";
import SearchPage from "./pages/SearchPage";
import Gifts from "./pages/Gifts";
import FavouritesPage from "./pages/FavouritesPage";
import AdminPage from "./pages/AdminPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import NavigationBar from "./NavigationBar";
import BottomNavigationBar from "./components/BottomNavigation";
import { AuthProvider } from "./context/AuthContext";
import { CityFilterProvider } from "./context/CityFilterContext";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { NotificationProvider } from "./context/NotificationContext";
import LoginPage from "./pages/LoginPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import NotificationEnableBanner from "./components/NotificationEnableBanner";
import { ContentRefreshProvider, useContentRefresh } from "./context/ContentRefreshContext";
import { createAppTheme } from "./theme";

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

function AppContent() {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const { t, i18n } = useTranslation();
  const { refreshKey } = useContentRefresh();
  const [lang, setLang] = useState(i18n.language || "en");
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const isReelsPage = location.pathname === "/reels";

  // RTL/LTR direction effect and language data attribute
  useEffect(() => {
    document.body.dir =
      i18n.language === "ar" || i18n.language === "ku" ? "rtl" : "ltr";

    // Add language data attribute for Kurdish font styling
    document.documentElement.setAttribute("data-lang", i18n.language);
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
    () => createAppTheme({ darkMode, language: i18n.language }),
    [darkMode, i18n.language]
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
            key={refreshKey}
            sx={{
              flexGrow: 1, // Allows this Box to expand and push the footer down
              py: isReelsPage ? 0 : 3,
              pb: isMobile ? 10 : 3, // Add bottom padding for mobile to account for bottom navigation
              backgroundColor: (theme) => theme.palette.background.default,
            }}
          >
            <Container maxWidth={isReelsPage ? false : "lg"} disableGutters={isReelsPage}>
              <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/reels" element={<ReelsPage />} />
                <Route path="/stores" element={<StoreList />} />
                <Route path="/stores/:id" element={<StoreProfile />} />
                <Route path="/categories" element={<ProductCategory />} />
                <Route path="/brands" element={<BrandList />} />
                <Route path="/brands/:id" element={<BrandProfile />} />
                <Route path="/gifts" element={<Gifts />} />
                <Route path="/favourites" element={<FavouritesPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedEmails={["mshexani45@gmail.com", "admin@gmail.com"]}>
                      <DataEntryForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedEmails={["mshexani45@gmail.com"]}>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedEmails={["mshexani45@gmail.com", "admin@gmail.com"]}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/products/:id" element={<ProductDetail />} />
              </Routes>
            </Container>
          </Box>
          <Footer />
          <BottomNavigationBar />
          {false && <NotificationEnableBanner />}
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
}

const App = () => (
  <ContentRefreshProvider>
    <AppContent />
  </ContentRefreshProvider>
);

// Root component remains the same
const Root = () => (
  <ErrorBoundary>
    <AuthProvider>
      <CityFilterProvider>
        <AppSettingsProvider>
          <NotificationProvider>
            <Router>
              <ScrollToTop />
              <App />
            </Router>
          </NotificationProvider>
        </AppSettingsProvider>
      </CityFilterProvider>
    </AuthProvider>
  </ErrorBoundary>
);

export default Root;
