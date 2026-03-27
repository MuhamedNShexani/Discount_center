import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Grid,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useNavigate } from "react-router-dom";
import { storeAPI, storeTypeAPI } from "../services/api";
import { useTranslation } from "react-i18next";

const ShoppingPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeTypes, setStoreTypes] = useState([]);
  const [selectedStoreTypeId, setSelectedStoreTypeId] = useState("all");

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

  const filteredStores = useMemo(() => {
    if (selectedStoreTypeId === "all") return deliveryStores;
    return deliveryStores.filter((s) => {
      const stId = s?.storeTypeId?._id || s?.storeTypeId || "";
      return String(stId) === String(selectedStoreTypeId);
    });
  }, [deliveryStores, selectedStoreTypeId]);

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
        }}
      >
        <LocalShippingIcon sx={{ color: "var(--brand-accent-orange)" }} />
        <Typography sx={{ fontWeight: 900 }}>{t("Shopping")}</Typography>
        <Chip
          size="small"
          label={`${filteredStores.length}`}
          sx={{ ml: "auto", bgcolor: "var(--brand-accent-orange)", color: "white" }}
        />
      </Paper>

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
        {storeTypes.map((st) => (
          <Chip
            key={st._id}
            clickable
            onClick={() => setSelectedStoreTypeId(st._id)}
            label={`${st.icon || "🏪"} ${t(st.name)}`}
            color={selectedStoreTypeId === st._id ? "primary" : "default"}
            variant={selectedStoreTypeId === st._id ? "filled" : "outlined"}
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
        <Grid container spacing={1.5}>
          {filteredStores.map((store) => (
            <Grid item xs={6} key={store._id}>
              <Card
                onClick={() => navigate(`/stores/${store._id}?tab=discounts`)}
                sx={{
                  borderRadius: 3,
                  cursor: "pointer",
                  overflow: "hidden",
                  border: `1px solid ${theme.palette.divider}`,
                  "&:hover": { boxShadow: 4 },
                }}
              >
                <Box sx={{ position: "relative", bgcolor: "background.paper" }}>
                  {store.logo ? (
                    <CardMedia
                      component="img"
                      height="120"
                      image={
                        String(store.logo).startsWith("http")
                          ? store.logo
                          : `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}${store.logo}`
                      }
                      alt={store.name}
                      sx={{ objectFit: "contain", bgcolor: "#fff" }}
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
                      <StorefrontIcon sx={{ fontSize: 44, color: "text.secondary" }} />
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
                <CardContent sx={{ p: 1.25 }}>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: "0.95rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {store.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {store.storeTypeId?.name ? t(store.storeTypeId.name) : ""}
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

