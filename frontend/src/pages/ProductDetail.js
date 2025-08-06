import React, { useState, useEffect, useRef } from "react";
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
  IconButton,
  Rating,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StarIcon from "@mui/icons-material/Star";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useUserTracking } from "../hooks/useUserTracking";

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

  // User tracking hook
  const { toggleLike, recordView, addReview, isProductLiked, isAuthenticated } =
    useUserTracking();

  // State for tracking like count locally
  const [localLikeCount, setLocalLikeCount] = useState(0);
  const [localLikeState, setLocalLikeState] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const viewRecordedRef = useRef(false); // Use ref to track if view has been recorded for this product

  // Notification dialog state
  const [loginNotificationOpen, setLoginNotificationOpen] = useState(false);

  // Handle like button click
  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      // Show login notification dialog
      setLoginNotificationOpen(true);
      return;
    }

    // Prevent multiple rapid clicks
    if (likeLoading) {
      return;
    }

    // Get current state
    const currentLikeCount = localLikeCount || product?.likeCount || 0;
    const isCurrentlyLiked = localLikeState || isProductLiked(product._id);

    // Set loading state
    setLikeLoading(true);

    try {
      // Optimistically update the UI
      if (isCurrentlyLiked) {
        // Currently liked, so unlike
        setLocalLikeCount(Math.max(0, currentLikeCount - 1));
        setLocalLikeState(false);
      } else {
        // Currently not liked, so like
        setLocalLikeCount(currentLikeCount + 1);
        setLocalLikeState(true);
      }

      // Make the API call
      const result = await toggleLike(product._id);

      if (!result.success) {
        // Revert the optimistic update if the API call failed
        setLocalLikeCount(currentLikeCount);
        setLocalLikeState(isCurrentlyLiked);
        alert(result.message || "Failed to update like");
      }
    } catch (error) {
      // Revert on error
      setLocalLikeCount(currentLikeCount);
      setLocalLikeState(isCurrentlyLiked);
      alert("Failed to update like");
    } finally {
      // Clear loading state
      setLikeLoading(false);
    }
  };

  // Review state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
    // Reset view recorded state when product changes
    viewRecordedRef.current = false;
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getById(id);
      const productData = response.data;
      setProduct(productData);

      // Initialize local like count
      setLocalLikeCount(productData.likeCount || 0);

      // Record view only once when product is loaded
      if (!viewRecordedRef.current) {
        recordView(id);
        viewRecordedRef.current = true;
      }

      // Fetch related products after getting the current product
      fetchRelatedProducts(productData);
    } catch (err) {
      setError("Failed to load product details. Please try again.");
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update like state when user data changes
  useEffect(() => {
    if (product && isAuthenticated) {
      setLocalLikeState(isProductLiked(product._id));
    }
  }, [product, isAuthenticated, isProductLiked]);

  // Handle review submission
  const handleReviewSubmit = async () => {
    if (reviewRating === 0) {
      alert("Please select a rating");
      return;
    }

    try {
      setSubmittingReview(true);
      const result = await addReview(id, reviewRating, reviewComment);
      if (result.success) {
        // Update product with new rating data
        setProduct((prev) => ({
          ...prev,
          averageRating: result.data.averageRating,
          reviewCount: result.data.reviewCount,
        }));
        setReviewDialogOpen(false);
        setReviewRating(0);
        setReviewComment("");
      } else {
        alert("Failed to submit review: " + result.message);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review");
    } finally {
      setSubmittingReview(false);
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

      // Filter products by same category (excluding current product and expired discounts)
      const sameCategoryProducts = allProducts
        .filter((p) => p._id !== currentProduct._id)
        .filter((p) => {
          // Exclude expired discounted products
          if (p.isDiscount && !isDiscountValid(p)) {
            return false;
          }

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

      // Filter products by same store (excluding current product, already selected category products, and expired discounts)
      const sameStoreProducts = allProducts
        .filter((p) => p._id !== currentProduct._id)
        .filter((p) => {
          // Exclude expired discounted products
          if (p.isDiscount && !isDiscountValid(p)) {
            return false;
          }

          // Exclude products already in sameCategoryProducts
          const isAlreadyInCategory = sameCategoryProducts.some(
            (catProduct) => catProduct._id === p._id
          );
          if (isAlreadyInCategory) return false;

          if (
            currentProduct.storeId &&
            p.storeId &&
            currentProduct.storeId._id === p.storeId._id
          ) {
            return true;
          }
          return false;
        })
        .slice(0, 5); // Limit to 5 products

      // Combine both arrays
      const related = [...sameCategoryProducts, ...sameStoreProducts];
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

  // Helper function to check if a discounted product has expired
  const isDiscountValid = (product) => {
    if (!product.isDiscount) return false;

    // If no expiry date, discount is always valid
    if (!product.expireDate) return true;

    // Check if current date is before expiry date
    const currentDate = new Date();
    const expiryDate = new Date(product.expireDate);

    return currentDate < expiryDate;
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
          <Grid xs={6} md={6} alignContent="center">
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
              <Box display="flex" alignItems="center" mb={2}>
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
                    color={
                      theme.palette.mode === "dark" ? "white" : "text.secondary"
                    }
                    sx={{
                      fontWeight: "bold",
                      fontSize: { xs: "0.875rem", sm: "1rem", md: "1.25rem" },
                    }}
                  >
                    {t("Category")}:{" "}
                    <span
                      style={{
                        color:
                          theme.palette.mode === "dark"
                            ? "white"
                            : "text.secondary",
                        fontWeight: "bold",
                      }}
                    >
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
                    <span
                      style={{
                        color:
                          theme.palette.mode === "dark"
                            ? "white"
                            : "text.secondary",
                        fontWeight: "bold",
                      }}
                    >
                      {product.brandId.name}
                    </span>
                  </Typography>
                </Box>
              )}
              {product.storeId && (
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
                    onClick={() => navigate(`/stores/${product.storeId._id}`)}
                    color="text.secondary"
                    sx={{
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: { xs: "0.875rem", sm: "1rem", md: "1.25rem" },
                    }}
                  >
                    {t("Store")}:{" "}
                    <span
                      style={{
                        color:
                          theme.palette.mode === "dark"
                            ? "white"
                            : "text.secondary",
                        fontWeight: "bold",
                      }}
                    >
                      {product.storeId.name}
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
                    <span
                      style={{
                        color:
                          theme.palette.mode === "dark" ? "white" : "black",
                      }}
                    >
                      {t("Price")}:
                    </span>{" "}
                    <span
                      style={{
                        color:
                          theme.palette.mode === "dark"
                            ? "text.main"
                            : "text.primary",
                      }}
                    >
                      {formatPrice(product.newPrice)}
                    </span>
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

              {/* User Interaction Section */}
              <Box sx={{ mb: { xs: 2, md: 3 } }}>
                {/* Mobile Layout - Stacked Design */}
                <Box
                  sx={{
                    display: { xs: "flex", sm: "flex" },
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "stretch", sm: "center" },
                    gap: { xs: 1.5, sm: 2 },
                    mb: { xs: 2, sm: 2 },
                  }}
                >
                  {/* Top Row - Like Button and Stats */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: { xs: 1, sm: 2 },
                      justifyContent: { xs: "space-between", sm: "flex-start" },
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Like Button */}
                    <IconButton
                      onClick={handleLikeClick}
                      disabled={likeLoading}
                      sx={{
                        backgroundColor: localLikeState
                          ? "rgba(229, 62, 62, 0.1)"
                          : "rgba(0, 0, 0, 0.04)",
                        color: localLikeState ? "#e53e3e" : "#666",
                        "&:hover": {
                          backgroundColor: localLikeState
                            ? "rgba(229, 62, 62, 0.2)"
                            : "rgba(0, 0, 0, 0.08)",
                          transform: "scale(1.05)",
                        },
                        transition: "all 0.2s ease",
                        width: { xs: "48px", sm: "56px" },
                        height: { xs: "48px", sm: "56px" },
                      }}
                      size="large"
                    >
                      {localLikeState ? (
                        <FavoriteIcon
                          sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
                        />
                      ) : (
                        <FavoriteBorderIcon
                          sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
                        />
                      )}
                    </IconButton>

                    {/* Stats Container */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: { xs: 1.5, sm: 2 },
                        flexWrap: "wrap",
                      }}
                    >
                      {/* View Count */}
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        sx={{
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                          borderRadius: 1,
                          px: { xs: 1, sm: 1.5 },
                          py: { xs: 0.5, sm: 0.75 },
                          minWidth: { xs: "fit-content", sm: "auto" },
                        }}
                      >
                        <VisibilityIcon
                          sx={{
                            color: "text.secondary",
                            fontSize: { xs: "1rem", sm: "1.2rem" },
                          }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            fontWeight: 500,
                          }}
                        >
                          {product.viewCount || 0}
                        </Typography>
                      </Box>

                      {/* Like Count */}
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        sx={{
                          backgroundColor: "rgba(229, 62, 62, 0.1)",
                          borderRadius: 1,
                          px: { xs: 1, sm: 1.5 },
                          py: { xs: 0.5, sm: 0.75 },
                          minWidth: { xs: "fit-content", sm: "auto" },
                        }}
                      >
                        <FavoriteIcon
                          sx={{
                            color: "#e53e3e",
                            fontSize: { xs: "1rem", sm: "1.2rem" },
                          }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            fontWeight: 500,
                          }}
                        >
                          {localLikeCount || product.likeCount || 0}
                        </Typography>
                      </Box>

                      {/* Average Rating */}
                      {product.averageRating > 0 && (
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={0.5}
                          sx={{
                            backgroundColor: "rgba(255, 193, 7, 0.1)",
                            borderRadius: 1,
                            px: { xs: 1, sm: 1.5 },
                            py: { xs: 0.5, sm: 0.75 },
                            minWidth: { xs: "fit-content", sm: "auto" },
                          }}
                        >
                          <StarIcon
                            sx={{
                              color: "#ffc107",
                              fontSize: { xs: "1rem", sm: "1.2rem" },
                            }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              fontWeight: 500,
                            }}
                          >
                            {product.averageRating.toFixed(1)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Bottom Row - Review Button */}
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (!isAuthenticated) {
                        alert(t("Please log in to leave reviews."));
                        return;
                      }
                      setReviewDialogOpen(true);
                    }}
                    startIcon={<StarIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                      width: { xs: "100%", sm: "auto" },
                      height: { xs: "44px", sm: "auto" },
                      backgroundColor: "rgba(255, 193, 7, 0.05)",
                      borderColor: "#ffc107",
                      color: "#ffc107",
                      "&:hover": {
                        backgroundColor: "rgba(255, 193, 7, 0.1)",
                        borderColor: "#ffa000",
                        color: "#ffa000",
                      },
                    }}
                  >
                    {t("Write a Review")}
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: { xs: 2, md: 3 } }} />

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
                    {(product.isDiscount && isDiscountValid(product)) ? t("Discounted") : t("Regular Price")}
                  </Typography>
                </Box> */}
              </Box>

              {/* Action Buttons */}
              {/* <Box sx={{ mt: 4 }}>
                {product.storeId && product.storeId._id && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate(`/stores/${product.storeId._id}`)}
                    sx={{ mr: 2 }}
                  >
                    {t("View Store")}
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

                      {relatedProduct.storeId && (
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
                            {relatedProduct.storeId.name}
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
                        (relatedProduct.isDiscount &&
                          isDiscountValid(relatedProduct)) ? (
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

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("Write a Review")}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              {t("Rating")}:
            </Typography>
            <Rating
              value={reviewRating}
              onChange={(event, newValue) => setReviewRating(newValue)}
              size="large"
              sx={{ fontSize: "2rem" }}
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t("Comment (optional)")}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>
            {t("Cancel")}
          </Button>
          <Button
            onClick={handleReviewSubmit}
            variant="contained"
            disabled={submittingReview || reviewRating === 0}
          >
            {submittingReview ? t("Submitting...") : t("Submit Review")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Login Notification Dialog */}
      <Dialog
        open={loginNotificationOpen}
        onClose={() => setLoginNotificationOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" component="span">
              {t("Login Required")}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t("You must login to like products. Do you want to login?")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setLoginNotificationOpen(false)}
            variant="outlined"
            color="primary"
          >
            {t("No")}
          </Button>
          <Button
            onClick={() => {
              setLoginNotificationOpen(false);
              navigate("/login");
            }}
            variant="contained"
            color="primary"
          >
            {t("Yes")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductDetail;
