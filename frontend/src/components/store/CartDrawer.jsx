import React, { memo } from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Paper,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  DrawerBody,
  DrawerSafeAreaTop,
  drawerPaperSx,
} from "../../utils/drawerSafeArea";

export const CartDrawerPanel = memo(function CartDrawerPanel({
  cartCount,
  cartSyncing,
  cartItems,
  locName,
  formatPrice,
  updateCartQty,
  clearCart,
  requestOrderWhatsApp,
  onAddMore,
  t,
  onClose,
  onBack,
  title,
  titleLoading = false,
  closeButtonRef,
  headerAccent = "linear-gradient(135deg,#3b82f6,#2563eb)",
  headerShadow = "0 3px 8px rgba(37,99,235,0.35)",
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const heading =
    title ?? `${t("Cart")}${cartCount > 0 ? ` (${cartCount})` : ""}`;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: 2.5,
          pt: 2,
          pb: 1.5,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          {onBack ? (
            <IconButton
              onClick={onBack}
              size="small"
              sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6",
                "&:hover": {
                  bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#e9ecf0",
                },
              }}
              aria-label={t("Back")}
            >
              <ArrowBackIcon sx={{ fontSize: 18 }} />
            </IconButton>
          ) : null}
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "12px",
              background: headerAccent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: headerShadow,
              flexShrink: 0,
            }}
          >
            <ShoppingCartIcon sx={{ fontSize: 18, color: "white" }} />
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 800,
              color: isDark ? "rgba(255,255,255,0.95)" : "#111827",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            {titleLoading ? (
              <Skeleton
                variant="text"
                width="60%"
                height={28}
                sx={{ borderRadius: 1 }}
              />
            ) : (
              heading
            )}
          </Typography>
        </Box>
        {onClose ? (
          <IconButton
            edge="end"
            onClick={onClose}
            size="small"
            ref={closeButtonRef}
            autoFocus={!onBack}
            sx={{
              bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6",
              "&:hover": {
                bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#e9ecf0",
              },
              flexShrink: 0,
            }}
            aria-label={t("Close")}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        ) : null}
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          px: 2.5,
          py: 1,
        }}
      >
        {cartSyncing ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            {t("Loading...")}
          </Typography>
        ) : cartCount <= 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            {t("Cart is empty")}
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 1.25, py: 1 }}>
            {Object.values(cartItems || {})
              .filter((i) => (Number(i?.qty) || 0) > 0 && i?.product?._id)
              .map((item) => (
                <Paper
                  key={item.product._id}
                  variant="outlined"
                  sx={{ p: 1.25, borderRadius: 2 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 1,
                      overflow: "hidden",
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                          whiteSpace: "normal",
                        }}
                      >
                        {locName(item.product)}
                      </Typography>
                      {typeof item.product.newPrice === "number" && (
                        <Typography variant="caption" color="text.secondary">
                          {formatPrice(item.product.newPrice)}
                        </Typography>
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexShrink: 0,
                      }}
                    >
                      <IconButton
                        onClick={() =>
                          updateCartQty(
                            item.product._id,
                            (Number(item.qty) || 0) - 1,
                          )
                        }
                        size="small"
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography
                        sx={{
                          fontWeight: 900,
                          minWidth: 22,
                          textAlign: "center",
                        }}
                      >
                        {Number(item.qty) || 0}
                      </Typography>
                      <IconButton
                        onClick={() =>
                          updateCartQty(
                            item.product._id,
                            (Number(item.qty) || 0) + 1,
                          )
                        }
                        size="small"
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          px: 2.5,
          py: 2,
          flexShrink: 0,
          borderTop: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "#eef0f4",
        }}
      >
        <Button onClick={clearCart} disabled={cartCount <= 0} sx={{ flex: 1 }}>
          {t("Clear")}
        </Button>
        {onAddMore ? (
          <Button
            onClick={onAddMore}
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ flex: 1.2, fontWeight: 700 }}
          >
            {t("Add more")}
          </Button>
        ) : null}
        <Button
          onClick={requestOrderWhatsApp}
          variant="contained"
          color="success"
          startIcon={<WhatsAppIcon />}
          disabled={cartCount <= 0}
          sx={{ flex: 1.4, fontWeight: 700 }}
        >
          {t("Order")}
        </Button>
      </Box>
    </Box>
  );
});

const CartDrawer = memo(function CartDrawer({
  open,
  onClose,
  cartCount,
  cartSyncing,
  cartItems,
  locName,
  formatPrice,
  updateCartQty,
  clearCart,
  requestOrderWhatsApp,
  onAddMore,
  t,
  closeButtonRef,
  buttonRefOnExit,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: drawerPaperSx(isDark, {
          width: { xs: "100vw", sm: 420 },
          maxWidth: "100%",
        }),
      }}
      TransitionProps={{
        onEntered: () => {
          closeButtonRef?.current?.focus?.();
        },
        onExited: () => {
          buttonRefOnExit?.current?.focus?.();
        },
      }}
    >
      <DrawerSafeAreaTop bgcolor={isDark ? "#0f1927" : "#ffffff"} />
      <DrawerBody>
        <CartDrawerPanel
          cartCount={cartCount}
          cartSyncing={cartSyncing}
          cartItems={cartItems}
          locName={locName}
          formatPrice={formatPrice}
          updateCartQty={updateCartQty}
          clearCart={clearCart}
          requestOrderWhatsApp={requestOrderWhatsApp}
          onAddMore={onAddMore}
          t={t}
          onClose={onClose}
          closeButtonRef={closeButtonRef}
        />
      </DrawerBody>
    </Drawer>
  );
});

export default CartDrawer;
