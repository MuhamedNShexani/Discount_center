import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Button,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useUserTracking } from "../hooks/useUserTracking";

const FavouritesPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getLikedProducts, toggleLike, isProductLiked, user } =
    useUserTracking();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likeStates, setLikeStates] = useState({});
  const [likeLoading, setLikeLoading] = useState({});

  // Filter out expired products (discounts with past expireDate)
  const isProductExpired = (product) => {
    if (!product.expireDate) return false;
    const expiryDate = new Date(product.expireDate);
    return new Date() >= expiryDate;
  };

  const nonExpiredProducts = useMemo(
    () => products.filter((p) => !isProductExpired(p)),
    [products],
  );

  useEffect(() => {
    const fetchLiked = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getLikedProducts();
        if (result.success && result.data) {
          setProducts(Array.isArray(result.data) ? result.data : []);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Error fetching favourites:", err);
        setError("Failed to load favourites");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLiked();
  }, [getLikedProducts, user]);

  // Sync like states when products or user loads (use products + user to avoid unstable refs)
  useEffect(() => {
    const filtered = products.filter((p) => !isProductExpired(p));
    if (filtered.length === 0) return;
    const states = {};
    filtered.forEach((p) => {
      states[p._id] = isProductLiked(p._id);
    });
    setLikeStates(states);
  }, [products, user]);

  const formatPrice = (price) => {
    const num = typeof price === "number" ? price : parseFloat(price);
    if (!Number.isFinite(num)) return `${t("ID")} 0`;
    return ` ${num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} ${t("ID")}`;
  };

  const handleLikeClick = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (likeLoading[productId]) return;

    const isCurrentlyLiked = likeStates[productId] ?? isProductLiked(productId);
    setLikeLoading((prev) => ({ ...prev, [productId]: true }));
    setLikeStates((prev) => ({ ...prev, [productId]: !isCurrentlyLiked }));

    try {
      const result = await toggleLike(productId);
      if (!result.success) {
        setLikeStates((prev) => ({ ...prev, [productId]: isCurrentlyLiked }));
      } else if (!isCurrentlyLiked) {
        // Unlike - remove from list
        setProducts((prev) => prev.filter((p) => p._id !== productId));
      }
    } catch (err) {
      setLikeStates((prev) => ({ ...prev, [productId]: isCurrentlyLiked }));
    } finally {
      setLikeLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    return image.startsWith("http")
      ? image
      : `${process.env.REACT_APP_BACKEND_URL || ""}${image}`;
  };

  const getRemainingDays = (expireDate) => {
    if (!expireDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expire = new Date(expireDate);
    expire.setHours(0, 0, 0, 0);
    const diffTime = expire.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatExpireDate = (expireDate) => {
    if (!expireDate) return null;
    const d = new Date(expireDate);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getMarketInfo = (product) => {
    const store = product.storeId;
    const brand = product.brandId;
    if (store?.name || store?.logo)
      return { name: store.name, logo: store.logo };
    if (brand?.name || brand?.logo)
      return { name: brand.name, logo: brand.logo };
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ py: 3, px: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{
            mt: { xs: 4, md: 3 },
            mb: 3,
            borderRadius: 2,
            borderColor: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
            color: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
            "&:hover": {
              borderColor:
                theme.palette.mode === "dark" ? "#40916c" : "#34495e",
              backgroundColor:
                theme.palette.mode === "dark" ? "#40916c" : "#34495e",
              color: theme.palette.mode === "dark" ? "#52b788" : "white",
            },
          }}
        >
          {t("Back")}
        </Button>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="40vh"
        >
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 3, px: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{
            mt: { xs: 4, md: 3 },
            mb: 3,
            borderRadius: 2,
            borderColor: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
            color: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
            "&:hover": {
              borderColor:
                theme.palette.mode === "dark" ? "#40916c" : "#34495e",
              backgroundColor:
                theme.palette.mode === "dark" ? "#40916c" : "#34495e",
              color: theme.palette.mode === "dark" ? "#52b788" : "white",
            },
          }}
        >
          {t("Back")}
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3, px: 2, pb: { xs: 10, sm: 3 } }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{
          mt: { xs: 4, md: 3 },
          mb: 3,
          borderRadius: 2,
          borderColor: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
          color: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
          "&:hover": {
            borderColor: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
            backgroundColor:
              theme.palette.mode === "dark" ? "#40916c" : "#34495e",
            color: theme.palette.mode === "dark" ? "#52b788" : "white",
          },
        }}
      >
        {t("Back")}
      </Button>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: 700,
          color: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
        }}
      >
        {t("Favourites")}
      </Typography>

      {nonExpiredProducts.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 2,
          }}
        >
          <FavoriteBorderIcon sx={{ fontSize: 80, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t("No favourites yet")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("Like products to add them to your favourites")}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              sm: "repeat(3, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
            width: "100%",
          }}
        >
          {nonExpiredProducts.map((product) => {
            const isLiked =
              likeStates[product._id] ?? isProductLiked(product._id);
            const remainingDays = getRemainingDays(product.expireDate);
            const market = getMarketInfo(product);

            return (
              <Card
                key={product._id}
                component={Link}
                to={`/products/${product._id}`}
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  width: "100%",
                  minWidth: 0,
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.02)" },
                }}
              >
                {/* Logo and market name at top */}
                {market && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1,
                      borderBottom: 1,
                      borderColor: "divider",
                    }}
                  >
                    {market.logo ? (
                      <Box
                        component="img"
                        src={getImageUrl(market.logo)}
                        alt={market.name}
                        sx={{
                          width: 24,
                          height: 24,
                          objectFit: "contain",
                          borderRadius: 0.5,
                        }}
                      />
                    ) : (
                      <StorefrontIcon
                        sx={{ fontSize: 20, color: "text.secondary" }}
                      />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {market.name}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ position: "relative" }}>
                  {product.image ? (
                    <CardMedia
                      component="img"
                      image={getImageUrl(product.image)}
                      alt={product.name}
                      sx={{
                        height: 160,
                        objectFit: "contain",
                        backgroundColor: theme.palette.grey[100],
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 160,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: theme.palette.grey[100],
                      }}
                    >
                      <ShoppingCartIcon
                        sx={{ fontSize: 48, color: "grey.400" }}
                      />
                    </Box>
                  )}
                  <IconButton
                    onClick={(e) => handleLikeClick(product._id, e)}
                    disabled={likeLoading[product._id]}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "rgba(255,255,255,0.9)",
                      "&:hover": { backgroundColor: "white" },
                    }}
                  >
                    {isLiked ? (
                      <FavoriteIcon
                        sx={{ color: "#e53e3e", fontSize: "1.2rem" }}
                      />
                    ) : (
                      <FavoriteBorderIcon sx={{ fontSize: "1.2rem" }} />
                    )}
                  </IconButton>
                  {remainingDays !== null && remainingDays <= 30 && (
                    <Chip
                      label={
                        remainingDays === 0
                          ? t("Expires today")
                          : `${remainingDays} ${t("days left")}`
                      }
                      size="small"
                      sx={{
                        position: "absolute",
                        bottom: 8,
                        left: 8,
                        backgroundColor:
                          remainingDays <= 3 ? "#e53e3e" : "#f59e0b",
                        color: "white",
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {product.name}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    {product.previousPrice &&
                      product.newPrice &&
                      product.previousPrice > product.newPrice && (
                        <Typography
                          variant="body2"
                          sx={{
                            textDecoration: "line-through",
                            color: "red",
                            fontSize: { xs: "0.8rem", sm: "0.9rem" },
                            fontWeight: 500,
                          }}
                        >
                          {formatPrice(product.previousPrice)}
                        </Typography>
                      )}
                    {product.newPrice && (
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#52b788",
                          fontWeight: 700,
                          fontSize: { xs: "1.1rem", sm: "1.3rem" },
                        }}
                      >
                        {formatPrice(product.newPrice)}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default FavouritesPage;
