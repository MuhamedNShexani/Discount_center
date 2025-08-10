import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Fade,
  useTheme,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { storeAPI } from "../services/api";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Loader from "../components/Loader";
import { useTranslation } from "react-i18next";

// ------------------ Reusable StoreCard ------------------
const StoreCard = ({ store, index, theme, t, onClick }) => {
  const getStoreTypeIcon = (type) => {
    switch (type) {
      case "market":
        return "🛒";
      case "clothes":
        return "👕";
      case "electronic":
        return "📱";
      case "cosmetic":
        return "💄";
      default:
        return "🏪";
    }
  };

  return (
    <Fade in={true} timeout={300 + index * 100}>
      <Card
        onClick={onClick}
        sx={{
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          borderRadius: 4,
          overflow: "hidden",
          width: { xs: "100%", sm: 260, md: 280 }, // full width on mobile
          transition: "0.35s ease",
          boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
              : "#ffffff",
          "&:hover": {
            transform: { xs: "none", sm: "translateY(-8px) scale(1.02)" },
            boxShadow: "0 12px 28px rgba(0,0,0,0.2)",
            "& .store-image": { transform: "scale(1.08)" },
            "& .store-arrow": { opacity: 1, transform: "translateX(6px)" },
          },
        }}
      >
        {/* Store Image */}
        <Box
          sx={{
            position: "relative",
            height: { xs: 160, sm: 180 },
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #52b788 0%, #40916c 100%)"
                : "linear-gradient(135deg, #52b788 0%, #40916c 100%)",
          }}
        >
          {store.logo ? (
            <CardMedia
              component="img"
              image={`${process.env.REACT_APP_BACKEND_URL}${store.logo}`}
              alt={store.name}
              className="store-image"
              sx={{
                objectFit: "contain",
                transition: "transform 0.4s ease",
                width: "100%",
                height: "100%",
                p: 1,
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <StorefrontIcon sx={{ fontSize: 80, opacity: 0.8 }} />
            </Box>
          )}

          {/* Gradient Overlay */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)",
            }}
          />

          {/* VIP Badge */}
          {store.isVip && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                zIndex: 2,
                backgroundColor: "white",
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                "&::before": {
                  content: '"👑"',
                  fontSize: "18px",
                },
              }}
            />
          )}

          {/* Arrow Icon */}
          <IconButton
            className="store-arrow"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: "rgba(255,255,255,0.25)",
              color: "white",
              opacity: 0,
              transition: "all 0.3s ease",
              backdropFilter: "blur(6px)",
              display: { xs: "none", sm: "flex" }, // hide arrow on mobile
              "&:hover": { backgroundColor: "rgba(255,255,255,0.35)" },
            }}
          >
            <ArrowForwardIcon />
          </IconButton>
        </Box>

        {/* Store Info */}
        <CardContent
          align="center"
          sx={{
            p: { xs: 1.5, sm: 2 },
            display: "flex",
            flexDirection: "column",
            gap: 0.8,
            flexGrow: 1,
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              textAlign: "center",
              fontSize: { xs: "1rem", sm: "1.1rem" },
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {store.name}
          </Typography>

          {store.storeType && (
            <Chip
              label={t(
                store.storeType.charAt(0).toUpperCase() +
                  store.storeType.slice(1)
              )}
              icon={
                <span style={{ fontSize: "1rem" }}>
                  {getStoreTypeIcon(store.storeType)}
                </span>
              }
              size="small"
              sx={{
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(82, 183, 136, 0.15)"
                    : "rgba(82, 183, 136, 0.1)",
                color: theme.palette.mode === "dark" ? "#52b788" : "#40916c",
                border: `1px solid ${
                  theme.palette.mode === "dark"
                    ? "rgba(82, 183, 136, 0.3)"
                    : "rgba(82, 183, 136, 0.2)"
                }`,
                fontWeight: 600,
              }}
            />
          )}

          {/* Address & Phone */}
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              fontSize: "0.8rem",
            }}
          >
            <LocationOnIcon sx={{ fontSize: 15, mr: 0.3 }} />
            {store.address || t("Address not provided")}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: "0.8rem",
            }}
          >
            <PhoneIcon sx={{ fontSize: 15, mr: 0.3 }} />
            {store.phone || t("Phone not provided")}
          </Typography>
        </CardContent>
      </Card>
    </Fade>
  );
};

// ------------------ Main StoreList Page ------------------
const StoreList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const { t } = useTranslation();

  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storeTypeParam = searchParams.get("type");
  const [selectedType, setSelectedType] = useState(storeTypeParam || "all");

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (stores.length > 0) {
      if (selectedType && selectedType !== "all") {
        setFilteredStores(stores.filter((s) => s.storeType === selectedType));
      } else {
        setFilteredStores(stores);
      }
    }
  }, [stores, selectedType]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await storeAPI.getAll();
      setStores(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          err.message ||
          t("Network error. Please check your connection.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStoreClick = (store) => navigate(`/stores/${store._id}`);

  if (loading) return <Loader message={t("Loading...")} />;
  if (error) return <Loader message={error} />;

  return (
    <Box sx={{ py: 6, px: { xs: 1, sm: 2, md: 4 } }}>
      {/* Store Type Filter - Inline on page */}
      <Box sx={{ mb: 2, display: "flex", gap: 1, overflowX: "auto" }}>
        {[
          { key: "all", label: t("All") },
          { key: "market", label: t("Market") },
          { key: "clothes", label: t("Clothes") },
          { key: "electronic", label: t("Electronics") },
          { key: "cosmetic", label: t("Cosmetics") },
        ].map((tItem) => (
          <Chip
            key={tItem.key}
            label={tItem.label}
            onClick={() => setSelectedType(tItem.key)}
            color={selectedType === tItem.key ? "primary" : "default"}
            variant={selectedType === tItem.key ? "filled" : "outlined"}
            sx={{
              flexShrink: 0,
              backgroundColor:
                selectedType === tItem.key ? "#52b788" : "transparent",
              color: selectedType === tItem.key ? "white" : "inherit",
            }}
          />
        ))}
      </Box>
      {/* <Typography
        variant="h4"
        textAlign="center"
        sx={{ fontWeight: 700, mb: 4 }}
      >
        {storeType ? t(storeType) : t("Stores")}
      </Typography> */}

      {/* Grid */}
      <Box
        display="grid"
        justifyContent="center"
        gridTemplateColumns={{
          xs: "1fr", // 1 card per row on phones
          sm: "repeat(2, 1fr)", // 2 cards on small tablets
          md: "repeat(auto-fill, minmax(280px, 1fr))", // desktop
        }}
        gap={{ xs: 2, sm: 3, md: 4 }}
      >
        {filteredStores.map((store, index) => (
          <StoreCard
            key={store._id}
            store={store}
            index={index}
            theme={theme}
            t={t}
            onClick={() => handleStoreClick(store)}
          />
        ))}
      </Box>

      {filteredStores.length === 0 && (
        <Box textAlign="center" py={6}>
          <StorefrontIcon
            sx={{
              fontSize: 100,
              color: theme.palette.mode === "dark" ? "#4a5568" : "#cbd5e0",
              mb: 2,
            }}
          />
          <Typography variant="h6" fontWeight={600}>
            {t("No stores found")}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StoreList;
