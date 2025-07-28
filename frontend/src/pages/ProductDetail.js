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
import { productAPI, categoryAPI } from "../services/api";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import BusinessIcon from "@mui/icons-material/Business";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import DescriptionIcon from "@mui/icons-material/Description";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CategoryIcon from "@mui/icons-material/Category";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const { t } = useTranslation();
  const theme = useTheme();

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getById(id);
      setProduct(response.data);
      // Fetch related products after getting the current product
      fetchRelatedProducts(response.data);
    } catch (err) {
      setError("Failed to load product details. Please try again.");
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchRelatedProducts = async (currentProduct) => {
    try {
      setRelatedLoading(true);
      // Get all products and filter for related ones
      const response = await productAPI.getAll();
      const allProducts = response.data;

      // Filter products by same category (excluding current product)
      const sameCategoryProducts = allProducts
        .filter((p) => p._id !== currentProduct._id)
        .filter((p) => {
          if (
            currentProduct.categoryId &&
            p.categoryId &&
            currentProduct.categoryId._id === p.categoryId._id
          ) {
            return true;
          }
          return false;
        })
        .slice(0, 5); // Limit to 5 products

      // Filter products by same market (excluding current product and already selected category products)
      const sameMarketProducts = allProducts
        .filter((p) => p._id !== currentProduct._id)
        .filter((p) => {
          // Exclude products already in sameCategoryProducts
          const isAlreadyInCategory = sameCategoryProducts.some(
            (catProduct) => catProduct._id === p._id
          );
          if (isAlreadyInCategory) return false;

          if (
            currentProduct.marketId &&
            p.marketId &&
            currentProduct.marketId._id === p.marketId._id
          ) {
            return true;
          }
          return false;
        })
        .slice(0, 5); // Limit to 5 products

      // Combine both arrays
      const related = [...sameCategoryProducts, ...sameMarketProducts];
      setRelatedProducts(related);
    } catch (err) {
      console.error("Error fetching related products:", err);
    } finally {
      setRelatedLoading(false);
    }
  };

  // Helper function to get category type name from categoryTypeId
  const getCategoryTypeName = (categoryTypeId, categoryId) => {
    // If categoryTypeId is available, try to find the type name
    if (categoryTypeId && categoryId) {
      const category = categories.find((cat) => cat._id === categoryId);

      if (category && category.types) {
        // First try to find by ID (converting ObjectId to string)
        let type = category.types.find(
          (t) => t._id.toString() === categoryTypeId
        );

        // If not found by ID, try to find by name directly
        if (!type) {
          type = category.types.find((t) => t.name === categoryTypeId);
        }

        if (type) {
          return type.name;
        }
      }
    }

    // Return N/A if no valid category type found
    return "N/A";
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
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: { xs: 2, md: 3 } }}
      >
        {t("Back")}
      </Button>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Product Image */}
          <Grid xs={6} md={6} alignContent="center" marginLeft={{ xs: 10 }}>
            {product.image ? (
              <CardMedia
                component="img"
                image={`${process.env.REACT_APP_BACKEND_URL}${product.image}`}
                alt={product.name}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: { xs: 150, sm: 350, md: 400 },
                  objectFit: "contain",
                  borderRadius: 2,
                }}
              />
            ) : (
              <Box
                sx={{
                  height: { xs: 150, sm: 350, md: 400 },
                  bgcolor: "grey.100",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                }}
              >
                <ShoppingCartIcon
                  sx={{
                    marginLeft: { xs: 10 },
                    fontSize: { xs: 50, sm: 70, md: 80 },
                    color: "grey.400",
                  }}
                />
              </Box>
            )}
          </Grid>

          {/* Product Details */}
          <Grid xs={6} md={6}>
            <Box>
              <Box
                display="flex"
                alignItems="center"
                mb={2}
                marginLeft={{ xs: 5 }}
              >
                <ShoppingCartIcon
                  sx={{
                    fontSize: { xs: 24, sm: 28, md: 32 },
                    mr: { xs: 1, md: 2 },
                    color: "primary.main",
                  }}
                />
                <Typography
                  variant="h3"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontSize: { xs: "1rem", sm: "2rem", md: "3rem" },
                    lineHeight: { xs: 1.2, md: 1.3 },
                  }}
                >
                  {product.name}
                </Typography>
              </Box>

              {/* Category Type Badge */}
              <Chip
                label={getCategoryTypeName(
                  product.categoryTypeId,
                  product.categoryId?._id || product.categoryId
                )}
                color="primary"
                sx={{
                  mb: 2,
                  fontSize: { xs: "0.7rem", sm: "0.875rem" },
                  height: { xs: "28px", sm: "32px" },
                }}
                icon={<CategoryIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                component={RouterLink}
                to="/categories"
                state={{
                  category: product.categoryId?.name || "All Categories",
                  categoryType: getCategoryTypeName(
                    product.categoryTypeId,
                    product.categoryId?._id || product.categoryId
                  ),
                }}
                clickable
              />

              {/* Category Details */}
              {product.categoryId && (
                <Box display="flex" alignItems="center" mb={2}>
                  <CategoryIcon
                    sx={{
                      fontSize: { xs: 16, sm: 18, md: 20 },
                      mr: { xs: 0.5, md: 1 },
                      color: "text.secondary",
                    }}
                  />
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{
                      fontWeight: "bold",
                      fontSize: { xs: "0.875rem", sm: "1rem", md: "1.25rem" },
                    }}
                  >
                    {t("Category")}:{" "}
                    <span style={{ color: "black", fontWeight: "bold" }}>
                      {product.categoryId.name || "N/A"}
                    </span>
                  </Typography>
                </Box>
              )}

              {product.brandId && (
                <Box display="flex" alignItems="center" mb={2}>
                  <BusinessIcon
                    sx={{
                      fontSize: { xs: 16, sm: 18, md: 20 },
                      mr: { xs: 0.5, md: 1 },
                      color: "text.secondary",
                    }}
                  />
                  <Typography
                    variant="h6"
                    onClick={() => navigate(`/brands/${product.brandId._id}`)}
                    color="text.secondary"
                    sx={{
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: { xs: "0.875rem", sm: "1rem", md: "1.25rem" },
                    }}
                  >
                    {t("Brand")}:{" "}
                    <span style={{ color: "black", fontWeight: "bold" }}>
                      {product.brandId.name}
                    </span>
                  </Typography>
                </Box>
              )}
              {product.marketId && (
                <Box display="flex" alignItems="center" mb={2}>
                  <StorefrontIcon
                    sx={{
                      fontSize: { xs: 16, sm: 18, md: 20 },
                      mr: { xs: 0.5, md: 1 },
                      color: "text.secondary",
                    }}
                  />
                  <Typography
                    variant="h6"
                    onClick={() => navigate(`/markets/${product.marketId._id}`)}
                    color="text.secondary"
                    sx={{
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: { xs: "0.875rem", sm: "1rem", md: "1.25rem" },
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
                                fontSize: { xs: 16, sm: 18, md: 20 },
                                mr: { xs: 0.5, md: 1 },
                                color: "success.main",
                              }}
                            />
                            <Typography
                              variant="h6"
                              color="success.main"
                              sx={{
                                fontWeight: "bold",
                                fontSize: {
                                  xs: "0.875rem",
                                  sm: "1rem",
                                  md: "1.25rem",
                                },
                              }}
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
                                fontSize: { xs: 16, sm: 18, md: 20 },
                                mr: { xs: 0.5, md: 1 },
                                color: "warning.main",
                              }}
                            />
                            <Typography
                              variant="h6"
                              color="warning.main"
                              sx={{
                                fontWeight: "bold",
                                fontSize: {
                                  xs: "0.875rem",
                                  sm: "1rem",
                                  md: "1.25rem",
                                },
                              }}
                            >
                              Expires today!
                            </Typography>
                          </Box>
                        );
                      } else {
                        return (
                          <Box display="flex" alignItems="center">
                            <AccessTimeIcon
                              sx={{
                                fontSize: { xs: 16, sm: 18, md: 20 },
                                mr: { xs: 0.5, md: 1 },
                                color: "error.main",
                              }}
                            />
                            <Typography
                              variant="h6"
                              color="error.main"
                              sx={{
                                fontWeight: "bold",
                                fontSize: {
                                  xs: "0.875rem",
                                  sm: "1rem",
                                  md: "1.25rem",
                                },
                              }}
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

              <Divider sx={{ my: { xs: 2, md: 3 } }} />

              {/* Pricing Section */}
              <Box sx={{ mb: { xs: 2, md: 3 } }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Typography
                    variant="h4"
                    color="primary"
                    gutterBottom
                    sx={{
                      fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
                    }}
                  >
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
                        gap: { xs: 1, md: 2 },
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{
                          textDecoration: "line-through",
                          fontSize: {
                            xs: "1rem",
                            sm: "1.25rem",
                            md: "1.25rem",
                          },
                        }}
                      >
                        {formatPrice(product.previousPrice)}
                      </Typography>
                      <Chip
                        icon={
                          <LocalOfferIcon
                            sx={{ fontSize: { xs: 16, sm: 20 } }}
                          />
                        }
                        label={`-${calculateDiscount(
                          product.previousPrice,
                          product.newPrice
                        )}% OFF`}
                        color="error"
                        size="large"
                        sx={{
                          fontSize: { xs: "0.7rem", sm: "0.875rem" },
                          height: { xs: "32px", sm: "40px" },
                        }}
                      />
                    </Box>
                  )}
              </Box>

              {/* Product Details Section */}
              <Box sx={{ mb: { xs: 2, md: 3 } }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    mb: 2,
                    fontSize: { xs: "1rem", sm: "1.25rem", md: "1.25rem" },
                  }}
                >
                  {t("Product Details")}
                </Typography>
                {/* Description */}

                {/* Barcode */}
                {product.barcode && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography
                      variant="body1"
                      sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                    >
                      <strong>{t("Barcode")}:</strong> {product.barcode}
                    </Typography>
                  </Box>
                )}

                {/* Weight */}
                {product.weight && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography
                      variant="body1"
                      sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                    >
                      <strong>{t("Weight")}:</strong> {product.weight}
                    </Typography>
                  </Box>
                )}
                {product.description && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <DescriptionIcon
                      sx={{
                        fontSize: { xs: 14, sm: 16 },
                        mr: { xs: 0.5, md: 1 },
                        color: "text.secondary",
                      }}
                    />
                    <Typography
                      variant="body1"
                      sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                    >
                      <strong>{t("Description")}:</strong> {product.description}
                    </Typography>
                  </Box>
                )}

                {/* Discount Status */}
                {/* <Box display="flex" alignItems="center" mb={1}>
                  <LocalOfferIcon
                    sx={{
                      fontSize: { xs: 14, sm: 16 },
                      mr: { xs: 0.5, md: 1 },
                      color: "text.secondary",
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                  >
                    <strong>{t("Discount Status")}:</strong>{" "}
                    {product.isDiscount ? t("Discounted") : t("Regular Price")}
                  </Typography>
                </Box> */}
              </Box>

              {/* Action Buttons */}
              {/* <Box sx={{ mt: 4 }}>
                {product.marketId && product.marketId._id && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate(`/markets/${product.marketId._id}`)}
                    sx={{ mr: 2 }}
                  >
                    {t("View Market")}
                  </Button>
                )}
                {product.brandId && product.brandId._id && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate(`/brands/${product.brandId._id}`)}
                    sx={{ mr: 2 }}
                  >
                    {t("View Brand")}
                  </Button>
                )}
                <Button variant="contained" size="large" sx={{ mr: 2 }}>
                  {t("Contact Seller")}
                </Button>
              </Box> */}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <Paper
          elevation={2}
          sx={{
            mt: { xs: 3, md: 4 },
            p: { xs: 2, sm: 3, md: 3 },
            borderRadius: 2,
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
                : "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              mb: { xs: 2, md: 3 },
              fontWeight: 600,
              color: theme.palette.text.primary,
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.5rem" },
            }}
          >
            <ShoppingCartIcon
              sx={{ fontSize: { xs: 20, sm: 24, md: 28 }, color: "#52b788" }}
            />
            {t("Related Products")}
          </Typography>

          {relatedLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                overflowX: "auto",
                gap: { xs: 1.5, sm: 2 },
                pb: 2,
                "&::-webkit-scrollbar": {
                  height: 8,
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#4a5568" : "#f1f1f1",
                  borderRadius: 4,
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#52b788",
                  borderRadius: 4,
                  "&:hover": {
                    backgroundColor: "#45a049",
                  },
                },
              }}
            >
              {relatedProducts.map((relatedProduct) => (
                <Card
                  key={relatedProduct._id}
                  component={RouterLink}
                  to={`/products/${relatedProduct._id}`}
                  sx={{
                    minWidth: { xs: "180px", sm: "220px", md: "250px" },
                    height: { xs: "250px", sm: "280px", md: "320px" },
                    textDecoration: "none",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: { xs: 2, sm: 3, md: 3 },
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, #34495e 0%, #2c3e50 100%)"
                        : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                    border: `1px solid ${
                      theme.palette.mode === "dark" ? "#4a5568" : "#e2e8f0"
                    }`,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 4px 16px rgba(0,0,0,0.3)"
                        : "0 4px 16px rgba(0,0,0,0.1)",
                    transition: "all 0.3s ease",
                    flexShrink: 0,
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 8px 24px rgba(0,0,0,0.4)"
                          : "0 8px 24px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  {/* Product Image */}
                  <CardMedia
                    component="img"
                    image={`${process.env.REACT_APP_BACKEND_URL}${relatedProduct.image}`}
                    alt={relatedProduct.name}
                    sx={{
                      height: { xs: "120px", sm: "140px", md: "160px" },
                      objectFit: "contain",
                      borderTopLeftRadius: { xs: 8, sm: 12, md: 12 },
                      borderTopRightRadius: { xs: 8, sm: 12, md: 12 },
                    }}
                  />
                  <CardContent
                    sx={{
                      p: { xs: 1, sm: 1.5, md: 2 },
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        component="div"
                        sx={{
                          fontSize: {
                            xs: "0.875rem",
                            sm: "1rem",
                            md: "1.125rem",
                          },
                          fontWeight: 600,
                          mb: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {relatedProduct.name}
                      </Typography>

                      {relatedProduct.categoryTypeId && (
                        <Chip
                          label={getCategoryTypeName(
                            relatedProduct.categoryTypeId,
                            relatedProduct.categoryId
                          )}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: { xs: "0.6rem", sm: "0.7rem" },
                            mb: 1,
                            borderColor: "#52b788",
                            color: "#52b788",
                            backgroundColor: "rgba(82, 183, 136, 0.05)",
                            height: { xs: "20px", sm: "24px" },
                          }}
                        />
                      )}

                      {relatedProduct.brandId && (
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <BusinessIcon
                            sx={{
                              fontSize: { xs: 12, sm: 14, md: 16 },
                              mr: 0.5,
                              color: "text.secondary",
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            }}
                          >
                            {relatedProduct.brandId.name}
                          </Typography>
                        </Box>
                      )}

                      {relatedProduct.marketId && (
                        <Box display="flex" alignItems="center" mb={1}>
                          <StorefrontIcon
                            sx={{
                              fontSize: { xs: 12, sm: 14, md: 16 },
                              mr: 0.5,
                              color: "text.secondary",
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            }}
                          >
                            {relatedProduct.marketId.name}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={1}
                      >
                        <Box>
                          {relatedProduct.previousPrice &&
                          relatedProduct.previousPrice >
                            relatedProduct.newPrice ? (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                textDecoration: "line-through",
                                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              }}
                            >
                              {formatPrice(relatedProduct.previousPrice)}
                            </Typography>
                          ) : null}
                          <Typography
                            variant="h6"
                            sx={{
                              color: "primary.main",
                              fontWeight: 700,
                              fontSize: {
                                xs: "0.875rem",
                                sm: "1rem",
                                md: "1.125rem",
                              },
                            }}
                          >
                            {formatPrice(relatedProduct.newPrice)}
                          </Typography>
                        </Box>
                        {(relatedProduct.previousPrice &&
                          relatedProduct.previousPrice >
                            relatedProduct.newPrice) ||
                        relatedProduct.isDiscount ? (
                          <Chip
                            icon={
                              <LocalOfferIcon
                                sx={{ fontSize: { xs: 12, sm: 14 } }}
                              />
                            }
                            label={
                              relatedProduct.previousPrice &&
                              relatedProduct.previousPrice >
                                relatedProduct.newPrice
                                ? `-${calculateDiscount(
                                    relatedProduct.previousPrice,
                                    relatedProduct.newPrice
                                  )}%`
                                : t("Discount")
                            }
                            color="error"
                            size="small"
                            sx={{
                              fontSize: { xs: "0.6rem", sm: "0.7rem" },
                              height: { xs: "18px", sm: "20px" },
                            }}
                          />
                        ) : null}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ProductDetail;
