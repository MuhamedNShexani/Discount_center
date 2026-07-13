import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Skeleton,
  Snackbar,
  Typography,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { storeAPI } from "../services/api";
import {
  readDraftCartGroupsByStore,
  totalDraftCartQty,
} from "../utils/draftCarts";
import {
  countStoreCartItems,
  readStoreCart,
  writeStoreCart,
} from "../utils/storeCartStorage";
import { submitStoreCartWhatsAppOrder } from "../utils/storeCartOrder";
import { formatPriceDigits } from "../utils/formatPriceNumber";
import { CartDrawerPanel } from "../components/store/CartDrawer";
import {
  DrawerBody,
  DrawerSafeAreaTop,
  drawerPaperSx,
} from "../utils/drawerSafeArea";
import { useLocalizedContent } from "../hooks/useLocalizedContent";

export const DraftCartDrawerContext = createContext(null);

export function DraftCartDrawerProvider({ children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { locName } = useLocalizedContent();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("list");
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [cartRefresh, setCartRefresh] = useState(0);
  const [detailCartItems, setDetailCartItems] = useState({});
  const [toast, setToast] = useState({ open: false, text: "" });

  const bumpCartRefresh = useCallback(() => {
    setCartRefresh((k) => k + 1);
  }, []);

  const openDraftCart = useCallback(() => {
    bumpCartRefresh();
    setView("list");
    setSelectedStoreId(null);
    setDetailCartItems({});
    setOpen(true);
  }, [bumpCartRefresh]);

  const closeDraftCart = useCallback(() => {
    setOpen(false);
    setView("list");
    setSelectedStoreId(null);
    setDetailCartItems({});
  }, []);

  const openStoreInDrawer = useCallback(
    (storeId) => {
      setSelectedStoreId(String(storeId));
      setDetailCartItems(readStoreCart(storeId));
      setView("detail");
    },
    [],
  );

  const backToList = useCallback(() => {
    bumpCartRefresh();
    setView("list");
    setSelectedStoreId(null);
    setDetailCartItems({});
  }, [bumpCartRefresh]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setStoresLoading(true);
    (async () => {
      try {
        const res = await storeAPI.getVisible({ hasDelivery: true });
        if (!cancelled) {
          setStores(Array.isArray(res?.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) setStores([]);
      } finally {
        if (!cancelled) setStoresLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, cartRefresh]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key?.startsWith("cart.store.")) bumpCartRefresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [bumpCartRefresh]);

  const draftCartGroups = useMemo(
    () => readDraftCartGroupsByStore(stores),
    [stores, cartRefresh],
  );

  const draftCartTotalQty = useMemo(
    () => totalDraftCartQty(draftCartGroups),
    [draftCartGroups],
  );

  const selectedStore = useMemo(
    () =>
      stores.find((s) => String(s._id) === String(selectedStoreId)) || null,
    [stores, selectedStoreId],
  );

  const detailCartCount = useMemo(
    () => countStoreCartItems(detailCartItems),
    [detailCartItems],
  );

  const formatPrice = useCallback(
    (price) => {
      if (typeof price !== "number") return `${t("ID")} 0`;
      return ` ${formatPriceDigits(price)} ${t("ID")}`;
    },
    [t],
  );

  const updateDetailCartQty = useCallback(
    (productId, qty) => {
      if (!selectedStoreId) return;
      setDetailCartItems((prev) => {
        const next = { ...(prev || {}) };
        const q = Math.max(0, Math.min(99, Number(qty) || 0));
        if (q <= 0) {
          delete next[productId];
        } else {
          next[productId] = { ...(next[productId] || {}), qty: q };
        }
        writeStoreCart(selectedStoreId, next);
        return next;
      });
      bumpCartRefresh();
    },
    [selectedStoreId, bumpCartRefresh],
  );

  const clearDetailCart = useCallback(() => {
    if (!selectedStoreId) return;
    setDetailCartItems({});
    writeStoreCart(selectedStoreId, {});
    bumpCartRefresh();
  }, [selectedStoreId, bumpCartRefresh]);

  const handleAddMore = useCallback(() => {
    if (!selectedStoreId) return;
    closeDraftCart();
    navigate(`/stores/${selectedStoreId}?tab=discounts`);
  }, [selectedStoreId, closeDraftCart, navigate]);

  const requestDetailOrderWhatsApp = useCallback(async () => {
    if (!selectedStore) {
      setToast({ open: true, text: t("WhatsApp number not found") });
      return;
    }
    const result = await submitStoreCartWhatsAppOrder({
      store: selectedStore,
      storeId: selectedStoreId,
      cartItems: detailCartItems,
      locName,
      onClipboardFallback: (hint) => setToast({ open: true, text: hint }),
    });
    if (!result.ok) {
      setToast({ open: true, text: t("WhatsApp number not found") });
      return;
    }
    clearDetailCart();
    backToList();
  }, [
    selectedStore,
    selectedStoreId,
    detailCartItems,
    locName,
    t,
    clearDetailCart,
    backToList,
  ]);

  const value = useMemo(
    () => ({ openDraftCart, closeDraftCart, isOpen: open }),
    [openDraftCart, closeDraftCart, open],
  );

  const detailTitleLoading = Boolean(
    selectedStoreId && storesLoading && !selectedStore,
  );
  const detailTitle = selectedStore
    ? `${locName(selectedStore)}${detailCartCount > 0 ? ` (${detailCartCount})` : ""}`
    : t("Cart");

  return (
    <DraftCartDrawerContext.Provider value={value}>
      {children}
      <Drawer
        anchor="right"
        open={open}
        onClose={closeDraftCart}
        PaperProps={{
          sx: drawerPaperSx(isDark, {
            width: { xs: "100vw", sm: 420 },
            maxWidth: "100%",
          }),
        }}
      >
        <DrawerSafeAreaTop bgcolor={isDark ? "#0f1927" : "#ffffff"} />
        <DrawerBody>
          {view === "list" ? (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                minHeight: 0,
                overflow: "auto",
                p: 2.5,
                boxSizing: "border-box",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "12px",
                      background: "linear-gradient(135deg,#f59e0b,#d97706)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 3px 8px rgba(245,158,11,0.4)",
                    }}
                  >
                    <ShoppingCartIcon sx={{ fontSize: 18, color: "white" }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: isDark ? "rgba(255,255,255,0.95)" : "#111827",
                    }}
                  >
                    {t("Draft cart")}
                  </Typography>
                  {draftCartTotalQty > 0 && (
                    <Chip
                      label={`${draftCartTotalQty}`}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        bgcolor: "#f59e0b",
                        color: "white",
                        "& .MuiChip-label": { px: 0.8 },
                      }}
                    />
                  )}
                </Box>
                <IconButton
                  edge="end"
                  onClick={closeDraftCart}
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

              {draftCartGroups.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <ShoppingCartIcon
                    sx={{
                      fontSize: 56,
                      color: isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                      mb: 1.5,
                    }}
                  />
                  <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
                    {t("No draft cart items")}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      closeDraftCart();
                      navigate("/shopping");
                    }}
                    sx={{ mt: 2, borderRadius: 2, py: 1, fontWeight: 700 }}
                  >
                    {t("Go shopping")}
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                  {draftCartGroups.map((g) => {
                    const store = stores.find(
                      (s) => String(s._id) === String(g.storeId),
                    );
                    const resolvedName = store
                      ? locName(store)
                      : g.storeName || "";
                    const showNameSkeleton =
                      storesLoading && !resolvedName;

                    return (
                    <Box
                      key={g.storeId}
                      onClick={() => openStoreInDrawer(g.storeId)}
                      sx={{
                        borderRadius: "14px",
                        overflow: "hidden",
                        cursor: "pointer",
                        background: isDark
                          ? "linear-gradient(145deg,#1a2236,#1e2a40)"
                          : "#f9fafb",
                        border: isDark
                          ? "1px solid rgba(255,255,255,0.07)"
                          : "1px solid #eef0f4",
                        p: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          background: isDark
                            ? "linear-gradient(145deg,#1e2a40,#243050)"
                            : "#f0f2f5",
                          transform: "translateX(-2px)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.2,
                          minWidth: 0,
                        }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "10px",
                            bgcolor: isDark
                              ? "rgba(245,158,11,0.15)"
                              : "rgba(245,158,11,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <StorefrontIcon sx={{ fontSize: 18, color: "#f59e0b" }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          {showNameSkeleton ? (
                            <Skeleton
                              variant="text"
                              width="72%"
                              height={22}
                              sx={{ borderRadius: 1 }}
                            />
                          ) : (
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.88rem",
                                color: isDark
                                  ? "rgba(255,255,255,0.9)"
                                  : "#111827",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {resolvedName ||
                                t("Store", { defaultValue: "Store" })}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Chip
                        label={`×${g.totalQty}`}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          bgcolor: "#f59e0b",
                          color: "white",
                          flexShrink: 0,
                          "& .MuiChip-label": { px: 0.8 },
                        }}
                      />
                    </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          ) : (
            <CartDrawerPanel
              cartCount={detailCartCount}
              cartSyncing={false}
              cartItems={detailCartItems}
              locName={locName}
              formatPrice={formatPrice}
              updateCartQty={updateDetailCartQty}
              clearCart={clearDetailCart}
              requestOrderWhatsApp={requestDetailOrderWhatsApp}
              onAddMore={handleAddMore}
              t={t}
              onClose={closeDraftCart}
              onBack={backToList}
              title={detailTitle}
              titleLoading={detailTitleLoading}
              headerAccent="linear-gradient(135deg,#f59e0b,#d97706)"
              headerShadow="0 3px 8px rgba(245,158,11,0.4)"
            />
          )}
        </DrawerBody>
      </Drawer>

      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast({ open: false, text: "" })}
        message={toast.text}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </DraftCartDrawerContext.Provider>
  );
}
