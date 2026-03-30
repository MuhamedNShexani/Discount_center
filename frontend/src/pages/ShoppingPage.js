import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate, useLocation } from "react-router-dom";
import { storeAPI, storeTypeAPI } from "../services/api";
import { useTranslation } from "react-i18next";
import { resolveMediaUrl } from "../utils/mediaUrl";
import {
  readDraftCartGroupsByStore,
  totalDraftCartQty,
} from "../utils/draftCarts";
import { ShoppingBag as ShoppingBagIcon } from "@mui/icons-material";
import { useLocalizedContent } from "../hooks/useLocalizedContent";

const getStoreTypeId = (store) =>
  String(store?.storeTypeId?._id ?? store?.storeTypeId ?? "");

const ShoppingPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { locName } = useLocalizedContent();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeTypes, setStoreTypes] = useState([]);
  const [selectedStoreTypeId, setSelectedStoreTypeId] = useState("all");
  const [draftDrawerOpen, setDraftDrawerOpen] = useState(false);
  const [cartRefresh, setCartRefresh] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const [storesRes, typesRes] = await Promise.all([
          storeAPI.getVisible({ hasDelivery: true }),
          storeTypeAPI.getAll(),
        ]);
        setStores(Array.isArray(storesRes?.data) ? storesRes.data : []);
        setStoreTypes(Array.isArray(typesRes?.data) ? typesRes.data : []);
      } catch (e) {
        setStores([]);
        setStoreTypes([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const deliveryStores = useMemo(
    () => (stores || []).filter((s) => s?.isHasDelivery === true),
    [stores],
  );

  /** Only chips for store types that actually have a delivery store (same idea as MainPage). */
  const visibleStoreTypes = useMemo(() => {
    const idsInUse = new Set(
      deliveryStores.map((s) => getStoreTypeId(s)).filter(Boolean),
    );
    return (storeTypes || []).filter((st) => idsInUse.has(String(st._id)));
  }, [storeTypes, deliveryStores]);

  const filteredStores = useMemo(() => {
    if (selectedStoreTypeId === "all") return deliveryStores;
    return deliveryStores.filter(
      (s) => getStoreTypeId(s) === String(selectedStoreTypeId),
    );
  }, [deliveryStores, selectedStoreTypeId]);

  useEffect(() => {
    if (selectedStoreTypeId === "all") return;
    const ok = visibleStoreTypes.some(
      (st) => String(st._id) === String(selectedStoreTypeId),
    );
    if (!ok) setSelectedStoreTypeId("all");
  }, [visibleStoreTypes, selectedStoreTypeId]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key?.startsWith("cart.store.")) setCartRefresh((k) => k + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (routerLocation.state?.openDraftCart) {
      setCartRefresh((k) => k + 1);
      setDraftDrawerOpen(true);
      navigate(routerLocation.pathname, { replace: true, state: {} });
    }
  }, [routerLocation.state, routerLocation.pathname, navigate]);

  const draftCartGroups = useMemo(
    () => readDraftCartGroupsByStore(stores),
    [stores, cartRefresh],
  );

  const draftCartTotalQty = useMemo(
    () => totalDraftCartQty(draftCartGroups),
    [draftCartGroups],
  );

  const openDraftDrawer = useCallback(() => {
    setCartRefresh((k) => k + 1);
    setDraftDrawerOpen(true);
  }, []);

  return (
    <Box sx={{ py: { xs: 5, md: 8 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <ShoppingBagIcon sx={{ color: "var(--brand-accent-orange)" }} />
        <Typography sx={{ fontWeight: 900 }}>{t("Shopping")}</Typography>
        <Box sx={{ flex: 1, minWidth: 8 }} />
        <Badge
          badgeContent={draftCartTotalQty > 0 ? draftCartTotalQty : 0}
          color="warning"
          invisible={draftCartTotalQty <= 0}
          sx={{ flexShrink: 0, "& .MuiBadge-badge": { fontWeight: 800 } }}
        >
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<ShoppingCartIcon />}
            onClick={openDraftDrawer}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {t("Draft cart")}
          </Button>
        </Badge>
        {/* <Chip
          size="small"
          label={`${filteredStores.length}`}
          sx={{
            bgcolor: "var(--brand-accent-orange)",
            color: "white",
            fontWeight: 700,
            flexShrink: 0,
          }}
        /> */}
      </Paper>

      <Drawer
        anchor="right"
        open={draftDrawerOpen}
        onClose={() => setDraftDrawerOpen(false)}
      >
        <Box
          sx={{
            width: { xs: "100vw", sm: 360 },
            maxWidth: "100%",
            p: 2,
            boxSizing: "border-box",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                pr: 1,
                color: "black",
              }}
            >
              {t("Draft cart")}
            </Typography>
            <IconButton
              edge="end"
              onClick={() => setDraftDrawerOpen(false)}
              aria-label={t("Close")}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          {draftCartGroups.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              {t("No draft cart items")}
            </Typography>
          ) : (
            draftCartGroups.map((g) => (
              <Box key={g.storeId} sx={{ mb: 2 }}>
                <Button
                  fullWidth
                  onClick={() => {
                    navigate(`/stores/${g.storeId}?tab=discounts&cart=1`);
                    setDraftDrawerOpen(false);
                  }}
                  sx={{
                    justifyContent: "space-between",
                    textTransform: "none",
                    fontWeight: 800,
                    py: 1,
                    px: 1,
                    mb: 0.5,
                    color: "primary.main",
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textAlign: "left",
                    }}
                  >
                    {locName(
                      stores.find((s) => String(s._id) === String(g.storeId)),
                    ) || g.storeName}
                  </Box>
                  <Chip
                    size="small"
                    label={`×${g.totalQty}`}
                    sx={{ ml: 1, flexShrink: 0, fontWeight: 700 }}
                  />
                </Button>
                {/* <List dense disablePadding sx={{ pl: 0.5 }}>
                  {g.lines.map((line) => (
                    <ListItem
                      key={line.productId}
                      disablePadding
                      sx={{ py: 0.25 }}
                    >
                      <ListItemText
                        primary={`${line.name} × ${line.qty}`}
                        primaryTypographyProps={{
                          variant: "body2",
                          sx: { fontWeight: 500 },
                        }}
                      />
                    </ListItem>
                  ))}
                </List> */}
                <Divider sx={{ mt: 1 }} />
              </Box>
            ))
          )}
        </Box>
      </Drawer>

      {/* Store type filter (chips, not dropdown) */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          overflowX: "auto",
          pb: 1,
          mb: 2,
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Chip
          clickable
          onClick={() => setSelectedStoreTypeId("all")}
          label={t("All")}
          color={selectedStoreTypeId === "all" ? "primary" : "default"}
          variant={selectedStoreTypeId === "all" ? "filled" : "outlined"}
          sx={{ flexShrink: 0 }}
        />
        {visibleStoreTypes.map((st) => (
          <Chip
            key={st._id}
            clickable
            onClick={() => setSelectedStoreTypeId(String(st._id))}
            label={`${st.icon || "🏪"} ${locName(st) || t(st.name)}`}
            color={
              String(selectedStoreTypeId) === String(st._id)
                ? "primary"
                : "default"
            }
            variant={
              String(selectedStoreTypeId) === String(st._id)
                ? "filled"
                : "outlined"
            }
            sx={{ flexShrink: 0 }}
          />
        ))}
      </Box>

      {loading ? (
        <Typography color="text.secondary">{t("Loading...")}</Typography>
      ) : filteredStores.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          {t("No delivery stores available")}
        </Typography>
      ) : (
        <Grid container spacing={1.5} sx={{ justifyContent: "left", width: "100%" }}>
          {filteredStores.map((store) => (
            <Grid
              size={{ xs: 6 }}
              key={store._id}
              sx={{
                display: "flex",
                minWidth: 0,
              }}
            >
              <Card
                onClick={() => navigate(`/stores/${store._id}?tab=discounts`)}
                sx={{
                  minHeight: 200,
                  minWidth: 150,
                  maxWidth: 150,
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  cursor: "pointer",
                  overflow: "hidden",
                  border: `1px solid ${theme.palette.divider}`,
                  "&:hover": { boxShadow: 4 },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    bgcolor: "background.paper",
                    height: 120,
                    flexShrink: 0,
                  }}
                >
                  {store.logo ? (
                    <CardMedia
                      component="img"
                      height="120"
                      image={resolveMediaUrl(store.logo)}
                      alt={locName(store)}
                      sx={{
                        height: 120,
                        width: "100%",
                        objectFit: "contain",
                        bgcolor: "#fff",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 120,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "action.hover",
                      }}
                    >
                      <StorefrontIcon
                        sx={{ fontSize: 44, color: "text.secondary" }}
                      />
                    </Box>
                  )}
                  <Chip
                    icon={<LocalShippingIcon />}
                    label={t("Delivery")}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      bgcolor: "rgba(0,0,0,0.65)",
                      color: "white",
                      "& .MuiChip-icon": { color: "white" },
                    }}
                  />
                </Box>
                <CardContent
                  sx={{
                    p: 1.25,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    minHeight: 96,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: "0.95rem",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      textAlign: "center",
                      WebkitBoxOrient: "vertical",
                      lineHeight: 1.3,
                      minHeight: "2.6em",
                    }}
                  >
                    {locName(store)}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      display: "-webkit-box",
                      overflow: "hidden",
                      WebkitLineClamp: 2,
                      textAlign: "center",
                      WebkitBoxOrient: "vertical",
                      lineHeight: 1.3,
                      minHeight: "2.6em",
                    }}
                  >
                    {store.storeTypeId?.name
                      ? locName(store.storeTypeId) || t(store.storeTypeId.name)
                      : "\u00A0"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ShoppingPage;
