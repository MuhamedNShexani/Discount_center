import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Box,
  Drawer,
  IconButton,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PercentIcon from "@mui/icons-material/Percent";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useNavigate, Navigate } from "react-router-dom";
import { appAPI } from "../services/api";
import { useLocalizedContent } from "../hooks/useLocalizedContent";
import { useCityFilter } from "./CityFilterContext";
import { storeMatchesSelectedCity } from "../utils/cityMatch";
import { getSyncErrorHint } from "../utils/apiError";
import DiscountStoreCard, {
  ORANGE_ACCENT,
} from "../components/storeWideDiscount/DiscountStoreCard";
import {
  DRAWER_SAFE_BOTTOM,
  DrawerBody,
  DrawerSafeAreaTop,
  drawerPaperSx,
} from "../utils/drawerSafeArea";

export const StoreWideDiscountDrawerContext = createContext(null);

const ORANGE_GRADIENT_ICON =
  "linear-gradient(135deg, #f97316 0%, #ef4444 100%)";

function StoreWideDiscountDrawerContent({ onClose }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { locName } = useLocalizedContent();
  const { selectedCity } = useCityFilter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await appAPI.getShowcaseStores();
      const data = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setItems(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          getSyncErrorHint(
            err,
            t("Network error. Please check your connection."),
          ),
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(
    () =>
      (items || []).filter((entry) =>
        storeMatchesSelectedCity(entry?.store, selectedCity),
      ),
    [items, selectedCity],
  );

  const handleStoreClick = (storeId) => {
    onClose?.();
    navigate(`/stores/${storeId}`);
  };

  return (
    <Box
      sx={{
        width: { xs: "100vw", sm: 420 },
        maxWidth: "100%",
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ p: 2.5, flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "12px",
                background: ORANGE_GRADIENT_ICON,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 3px 8px rgba(249,115,22,0.4)",
                flexShrink: 0,
              }}
            >
              <PercentIcon sx={{ fontSize: 18, color: "white" }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: isDark ? "rgba(255,255,255,0.95)" : "#111827",
                  lineHeight: 1.25,
                }}
              >
                {t("Stores with store-wide discounts")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("All products discount stores subtitle")}
              </Typography>
            </Box>
          </Box>
          <IconButton
            edge="end"
            onClick={onClose}
            size="small"
            sx={{
              bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6",
              "&:hover": {
                bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#e9ecf0",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: 2,
          pb: `max(16px, ${DRAWER_SAFE_BOTTOM})`,
        }}
      >
        {error ? (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        ) : null}

        {loading ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 1.5,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={220}
                sx={{ borderRadius: "16px" }}
              />
            ))}
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box
            sx={{
              py: 5,
              textAlign: "center",
              borderRadius: "20px",
              border: `1px dashed ${isDark ? alpha("#fff", 0.15) : alpha(ORANGE_ACCENT, 0.25)}`,
              bgcolor: isDark ? alpha("#fff", 0.03) : "#fff7ed",
            }}
          >
            <StorefrontIcon
              sx={{ fontSize: 48, color: ORANGE_ACCENT, mb: 1, opacity: 0.7 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {t("No store-wide discounts")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("No stores with store-wide discounts in this city")}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 1.5,
            }}
          >
            {filteredItems.map((entry) => {
              const storeId = entry?.store?._id;
              if (!storeId) return null;
              return (
                <DiscountStoreCard
                  key={String(storeId)}
                  entry={entry}
                  isDark={isDark}
                  locName={locName}
                  t={t}
                  onClick={() => handleStoreClick(storeId)}
                />
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export function StoreWideDiscountDrawerProvider({ children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);

  const openStoreWideDiscounts = useCallback(() => setOpen(true), []);
  const closeStoreWideDiscounts = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({
      openStoreWideDiscounts,
      closeStoreWideDiscounts,
      isOpen: open,
    }),
    [openStoreWideDiscounts, closeStoreWideDiscounts, open],
  );

  return (
    <StoreWideDiscountDrawerContext.Provider value={value}>
      {children}
      <Drawer
        anchor="right"
        open={open}
        onClose={closeStoreWideDiscounts}
        PaperProps={{
          sx: drawerPaperSx(isDark),
        }}
      >
        {open ? (
          <>
            <DrawerSafeAreaTop bgcolor={isDark ? "#0f1927" : "#ffffff"} />
            <DrawerBody>
              <StoreWideDiscountDrawerContent onClose={closeStoreWideDiscounts} />
            </DrawerBody>
          </>
        ) : null}
      </Drawer>
    </StoreWideDiscountDrawerContext.Provider>
  );
}

export function StoreWideDiscountRouteRedirect() {
  const { openStoreWideDiscounts } = useContext(StoreWideDiscountDrawerContext);

  useEffect(() => {
    openStoreWideDiscounts?.();
  }, [openStoreWideDiscounts]);

  return <Navigate to="/" replace />;
}
