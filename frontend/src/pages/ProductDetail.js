import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { productAPI } from "../services/api";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import BusinessIcon from "@mui/icons-material/Business";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import DescriptionIcon from "@mui/icons-material/Description";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getById(id);
      setProduct(response.data);
    } catch (err) {
      setError("Failed to load product details. Please try again.");
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (typeof price !== "number") return `0 ${t("ID")}`;
    return ` ${price.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} ${t("ID")}`;
  };

  const calculateDiscount = (previousPrice, newPrice) => {
    if (!previousPrice || !newPrice) return 0;
    return Math.round(((previousPrice - newPrice) / previousPrice) * 100);
  };

  const calculateRemainingDays = (expireDate) => {
    if (!expireDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day

    const expire = new Date(expireDate);
    expire.setHours(0, 0, 0, 0); // Set to start of day

    const diffTime = expire.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!product) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Product not found.
      </Alert>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        {t("Back")}
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Grid container spacing={4}>
          {/* Product Image */}
          <Grid xs={12} md={6}>
            {product.image ? (
              <CardMedia
                component="img"
                image={`${process.env.REACT_APP_BACKEND_URL}${product.image}`}
                alt={product.name}
                sx={{
                  height: 400,
                  objectFit: "cover",
                  borderRadius: 2,
                }}
              />
            ) : (
              <Box
                sx={{
                  height: 400,
                  bgcolor: "grey.100",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                }}
              >
                <ShoppingCartIcon sx={{ fontSize: 80, color: "grey.400" }} />
              </Box>
            )}
          </Grid>

          {/* Product Details */}
          <Grid xs={12} md={6}>
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <ShoppingCartIcon
                  sx={{ fontSize: 32, mr: 2, color: "primary.main" }}
                />
                <Typography variant="h3" component="h1" gutterBottom>
                  {product.name}
                </Typography>
              </Box>

              <Chip
                label={product.type}
                color="primary"
                sx={{ mb: 2 }}
                icon={<StorefrontIcon />}
                component={RouterLink}
                to="/categories"
                state={{ category: product.type }}
                clickable
              />

              {product.companyId && (
                <Box display="flex" alignItems="center" mb={2}>
                  <BusinessIcon
                    sx={{ fontSize: 20, mr: 1, color: "text.secondary" }}
                  />
                  <Typography
                    variant="h6"
                    onClick={() =>
                      navigate(`/companies/${product.companyId._id}`)
                    }
                    color="text.secondary"
                    sx={{
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {t("Company")}:{" "}
                    <span style={{ color: "black", fontWeight: "bold" }}>
                      {product.companyId.name}
                    </span>
                  </Typography>
                </Box>
              )}
              {product.marketId && (
                <Box display="flex" alignItems="center" mb={2}>
                  <StorefrontIcon
                    sx={{ fontSize: 20, mr: 1, color: "text.secondary" }}
                  />
                  <Typography
                    variant="h6"
                    onClick={() => navigate(`/markets/${product.marketId._id}`)}
                    color="text.secondary"
                    sx={{
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {t("Market")}:{" "}
                    <span style={{ color: "black", fontWeight: "bold" }}>
                      {product.marketId.name}
                    </span>
                  </Typography>
                </Box>
              )}

              {/* Remaining Days Display */}
              {product.expireDate && (
                <Box display="flex" alignItems="center" mb={2}>
                  {(() => {
                    const remainingDays = calculateRemainingDays(
                      product.expireDate
                    );
                    if (remainingDays !== null) {
                      if (remainingDays > 0) {
                        return (
                          <Box display="flex" alignItems="center">
                            <AccessTimeIcon
                              sx={{
                                fontSize: 20,
                                mr: 1,
                                color: "success.main",
                              }}
                            />
                            <Typography
                              variant="h6"
                              color="success.main"
                              sx={{ fontWeight: "bold" }}
                            >
                              {remainingDays} {t("days remaining")}
                            </Typography>
                          </Box>
                        );
                      } else if (remainingDays === 0) {
                        return (
                          <Box display="flex" alignItems="center">
                            <AccessTimeIcon
                              sx={{
                                fontSize: 20,
                                mr: 1,
                                color: "warning.main",
                              }}
                            />
                            <Typography
                              variant="h6"
                              color="warning.main"
                              sx={{ fontWeight: "bold" }}
                            >
                              Expires today!
                            </Typography>
                          </Box>
                        );
                      } else {
                        return (
                          <Box display="flex" alignItems="center">
                            <AccessTimeIcon
                              sx={{ fontSize: 20, mr: 1, color: "error.main" }}
                            />
                            <Typography
                              variant="h6"
                              color="error.main"
                              sx={{ fontWeight: "bold" }}
                            >
                              {t("Expired")} {Math.abs(remainingDays)}{" "}
                              {t("day")}
                              {Math.abs(remainingDays) !== 1 ? "s" : ""} ago
                            </Typography>
                          </Box>
                        );
                      }
                    }
                    return null;
                  })()}
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Pricing Section */}
              <Box sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Typography variant="h4" color="primary" gutterBottom>
                    <span style={{ color: "black" }}>{t("Price")}:</span>{" "}
                    {formatPrice(product.newPrice)}
                  </Typography>
                </Box>

                {product.previousPrice &&
                  product.previousPrice > product.newPrice && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{ textDecoration: "line-through" }}
                      >
                        {formatPrice(product.previousPrice)}
                      </Typography>
                      <Chip
                        icon={<LocalOfferIcon />}
                        label={`-${calculateDiscount(
                          product.previousPrice,
                          product.newPrice
                        )}% OFF`}
                        color="error"
                        size="large"
                      />
                    </Box>
                  )}
              </Box>

              {/* Product Details Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  {t("Product Details")}
                </Typography>
                {/* Description */}

                {/* Barcode */}
                {product.barcode && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="body1">
                      <strong>{t("Barcode")}:</strong> {product.barcode}
                    </Typography>
                  </Box>
                )}

                {/* Weight */}
                {product.weight && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="body1">
                      <strong>{t("Weight")}:</strong> {product.weight}
                    </Typography>
                  </Box>
                )}
                {product.description && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <DescriptionIcon
                      sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                    />
                    <Typography variant="body1">
                      <strong>{t("Description")}:</strong> {product.description}
                    </Typography>
                  </Box>
                )}

                {/* Discount Status */}
                <Box display="flex" alignItems="center" mb={1}>
                  <LocalOfferIcon
                    sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                  />
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ mt: 4 }}>
                <Button variant="contained" size="large" sx={{ mr: 2 }}>
                  {t("Contact Seller")}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProductDetail;
