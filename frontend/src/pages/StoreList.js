import React, { useState, useEffect, useMemo } from "react";
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
import { storeAPI, adAPI, storeTypeAPI } from "../services/api";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Loader from "../components/Loader";
import { useTranslation } from "react-i18next";

// ------------------ Reusable StoreCard ------------------
const StoreCard = ({ store, index, theme, t, onClick }) => {
  return (
    <Fade in={true} timeout={300 + index * 100}>
      <Card
        onClick={onClick}
        sx={{
          cursor: "pointer",
          display: "flex",
          flexDirection: { xs: "row", sm: "column" },
          alignItems: { xs: "stretch", sm: "initial" },
          borderRadius: 4,
          overflow: "hidden",
          width: { xs: "100%", sm: 260, md: 280 }, // full width on mobile
          height: { xs: 180, sm: "auto" },
          transition: "0.35s ease",
          boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
              : "#ffffff",
          "&:hover": {
            transform: { xs: "none", sm: "translateY(-8px) scale(1.02)" },
            boxShadow: "0 12px 28px rgba(0,0,0,0.2)",
            "& .store-image": { transform: { xs: "none", sm: "scale(1.08)" } },
            "& .store-arrow": { opacity: 1, transform: "translateX(6px)" },
          },
        }}
      >
        {/* Store Image */}
        <Box
          sx={{
            position: "relative",
            height: { xs: "100%", sm: 180 },
            width: { xs: 120, sm: "100%" },
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg,rgb(255, 255, 255) 0%, #34495e 100%)"
                : "linear-gradient(135deg,rgb(0, 0, 0) 0%, #34495e 100%)",
            flexShrink: { xs: 0, sm: 1 },
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
            p: { xs: 1.2, sm: 2 },
            display: "flex",
            flexDirection: "column",
            gap: 0.8,
            flexGrow: 1,
            textAlign: { xs: "left", sm: "center" },
            justifyContent: { xs: "center", sm: "flex-start" },
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 700,
              color: theme.palette.mode === "dark" ? "white" : "black",
              textAlign: { xs: "center", sm: "center" },
              fontSize: { xs: "1rem", sm: "1.1rem" },
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
                  {t(store.storeType.icon) || "🏪"}
                </span>
              }
              size="small"
              sx={{
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(82, 183, 136, 0.15)"
                    : "rgba(82, 183, 136, 0.1)",
                color: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
                border: `1px solid ${
                  theme.palette.mode === "dark"
                    ? "rgba(82, 183, 136, 0.3)"
                    : "rgba(82, 183, 136, 0.2)"
                }`,
                fontWeight: 600,
                alignSelf: { xs: "flex-start", sm: "center" },
              }}
            />
          )}

          {/* Address & Phone */}
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              display: { xs: "block", sm: "-webkit-box" },
              WebkitLineClamp: { sm: 2 },
              WebkitBoxOrient: { sm: "vertical" },
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
  const [bannerAds, setBannerAds] = useState([]);

  const storeTypeParam = searchParams.get("type");
  const [selectedTypeId, setSelectedTypeId] = useState(storeTypeParam || "all");
  const [storeTypes, setStoreTypes] = useState([]);

  useEffect(() => {
    fetchStores();
    fetchStoreTypes();
    fetchAds();
  }, []);

  // Helper: safely return a string id from string/Object/populated
  function getID(id) {
    if (typeof id === "string") return id;
    if (id && typeof id === "object") {
      return id.$oid || String(id._id) || String(id);
    }
    return id;
  }

  useEffect(() => {
    if (stores.length > 0) {
      if (selectedTypeId && selectedTypeId !== "all") {
        setFilteredStores(
          stores.filter((s) => getID(s.storeTypeId) === selectedTypeId)
        );
      } else {
        setFilteredStores(stores);
      }
    }
  }, [stores, selectedTypeId]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await storeAPI.getVisible();
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

  const fetchStoreTypes = async () => {
    try {
      const res = await storeTypeAPI.getAll();
      setStoreTypes(res.data || []);
    } catch (e) {
      // fail silently for store types
    }
  };

  const fetchAds = async () => {
    try {
      const res = await adAPI.getAll({ page: "stores" });
      setBannerAds(res.data || []);
    } catch (e) {
      // fail silently for banner ads
    }
  };

  const bannerSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      { breakpoint: 1024, settings: { dots: true, arrows: false } },
      {
        breakpoint: 600,
        settings: { dots: true, arrows: false, autoplaySpeed: 4000 },
      },
    ],
  };

  const fallbackBannerImages = [];
  const bannerImages = useMemo(() => {
    if (bannerAds && bannerAds.length > 0) {
      return bannerAds
        .filter((a) => !!a.image)
        .map((a) =>
          a.image.startsWith("http")
            ? a.image
            : `${process.env.REACT_APP_BACKEND_URL}${a.image}`
        );
    }
    return fallbackBannerImages;
  }, [bannerAds]);

  const handleStoreClick = (store) => navigate(`/stores/${store._id}`);

  if (loading) return <Loader message={t("Loading...")} />;
  if (error) return <Loader message={error} />;

  return (
    <Box sx={{ py: 6, px: { xs: 1, sm: 2, md: 4 } }}>
      {/* Banner Slider Section (from Ads: pages includes stores/all) */}
      <Box
        sx={{
          mb: 2,
          // position: { xs: "sticky", md: "static" },
          top: { xs: 60, md: "auto" },
          zIndex: { xs: 1000, md: "auto" },
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: { xs: "100px", sm: "150px", md: "250px" },
            borderRadius: { xs: 2, md: 3 },
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            mb: 3,
            mt: { xs: 2, md: 5 },
          }}
        >
          {bannerImages.length > 0 && (
            <Slider {...bannerSettings}>
              {bannerAds
                .filter((a) => !!a.image)
                .map((ad, index) => (
                  <div key={ad._id || index}>
                    <img
                      onClick={() =>
                        ad.brandId
                          ? navigate(`/brands/${ad.brandId}`)
                          : ad.storeId
                          ? navigate(`/stores/${ad.storeId}`)
                          : ad.giftId
                          ? navigate(`/gifts/${ad.giftId}`)
                          : null
                      }
                      src={
                        ad.image.startsWith("http")
                          ? ad.image
                          : `${process.env.REACT_APP_BACKEND_URL}${ad.image}`
                      }
                      alt={`Banner ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        cursor:
                          ad.brandId || ad.storeId || ad.giftId
                            ? "pointer"
                            : "default",
                      }}
                    />
                  </div>
                ))}
            </Slider>
          )}
        </Box>
      </Box>
      {/* Store Type Filter - Inline on page */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          gap: 1,
          overflowX: "auto",
          color: theme.palette.mode === "dark" ? "white" : "black",
        }}
      >
        {[{ _id: "all", name: t("All"), icon: "🏪" }, ...storeTypes].map(
          (tItem) => (
            <Chip
              key={tItem._id}
              label={`${tItem.icon || "🏪"} ${t(tItem.name)}`}
              onClick={() => setSelectedTypeId(tItem._id)}
              color={selectedTypeId === tItem._id ? "primary" : "default"}
              variant={selectedTypeId === tItem._id ? "filled" : "outlined"}
              sx={{
                flexShrink: 0,
                backgroundColor:
                  selectedTypeId === tItem._id
                    ? theme.palette.mode === "dark"
                      ? "#40916c"
                      : "#34495e"
                    : "transparent",
                color: selectedTypeId === tItem._id ? "white" : "inherit",
              }}
            />
          )
        )}
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
