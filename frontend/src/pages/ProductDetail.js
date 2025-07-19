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

import StorefrontIcon from "@mui/icons-material/Storefront";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DescriptionIcon from "@mui/icons-material/Description";
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
    if (typeof price !== "number") return "ID 0";
    return `ID ${price.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
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
                  <Typography variant="h6" color="text.secondary">
                    {t("By")}: {product.companyId.name}
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

              {/* Company Information */}
              {product.companyId && (
                <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <BusinessIcon
                        sx={{ fontSize: 24, mr: 1, color: "primary.main" }}
                      />
                      <Typography variant="h6" gutterBottom>
                        {t("Company Information")}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <BusinessIcon
                        sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                      />
                      <Typography variant="body1" gutterBottom>
                        <strong>{t("name")}:</strong> {product.companyId.name}
                      </Typography>
                    </Box>
                    {product.companyId.address && (
                      <Box display="flex" alignItems="center" mb={1}>
                        <LocationOnIcon
                          sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                        />
                        <Typography variant="body1" gutterBottom>
                          <strong>{t("address")}:</strong>{" "}
                          {product.companyId.address}
                        </Typography>
                      </Box>
                    )}
                    {product.companyId.phone && (
                      <Box display="flex" alignItems="center" mb={1}>
                        <PhoneIcon
                          sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                        />
                        <Typography variant="body1" gutterBottom>
                          <strong>{t("Phone")}:</strong>{" "}
                          {product.companyId.phone}
                        </Typography>
                      </Box>
                    )}
                    {product.companyId.description && (
                      <Box display="flex" alignItems="flex-start" mb={1}>
                        <DescriptionIcon
                          sx={{
                            fontSize: 16,
                            mr: 1,
                            mt: 0.5,
                            color: "text.secondary",
                          }}
                        />
                        <Typography variant="body1">
                          <strong>{t("Description")}:</strong>{" "}
                          {product.companyId.description}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <Box sx={{ mt: 4 }}>
                <Button variant="contained" size="large" sx={{ mr: 2 }}>
                  {t("Contact Seller")}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate(`/markets/${product.companyId?._id}`)}
                >
                  {t("View Company")}
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
