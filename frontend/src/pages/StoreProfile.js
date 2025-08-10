import React, { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Avatar,
  Chip,
  Alert,
  useTheme,
  Container,
  Paper,
  Divider,
  IconButton,
  Fade,
  Skeleton,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  Rating,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack,
  Phone,
  LocationOn,
  Business,
  Store,
  Search,
  FilterList,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import StarIcon from "@mui/icons-material/Star";
import { storeAPI, productAPI, giftAPI } from "../services/api";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import { useTranslation } from "react-i18next";
import Loader from "../components/Loader";
import { useUserTracking } from "../hooks/useUserTracking";
import { useAuth } from "../context/AuthContext";

const StoreProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { toggleLike, isProductLiked, recordView } = useUserTracking();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "gifts") return 1;
    return 0;
  });
  const [expandedTypes, setExpandedTypes] = useState({});
  const [displayCounts, setDisplayCounts] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);

  // Notification dialog state
  const [loginNotificationOpen, setLoginNotificationOpen] = useState(false);

  // Like functionality states
  const [likeCounts, setLikeCounts] = useState({});
  const [likeStates, setLikeStates] = useState({});
  const [likeLoading, setLikeLoading] = useState({});

  // Filter states
  const [filters, setFilters] = useState({
    name: "",
    brand: "",
    barcode: "",
    type: "",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (id) {
      fetchStoreData();
    }
  }, [id]);

  // Initialize like states when products change
  useEffect(() => {
    const initialLikeCounts = {};
    const initialLikeStates = {};

    products.forEach((product) => {
      initialLikeCounts[product._id] = product.likeCount || 0;
      initialLikeStates[product._id] = isProductLiked(product._id);
    });

    setLikeCounts(initialLikeCounts);
    setLikeStates(initialLikeStates);
  }, [products, isProductLiked]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);

      // Fetch store details
      const storeResponse = await storeAPI.getById(id);
      setStore(storeResponse.data);

      // Fetch products for this store
      const productsResponse = await productAPI.getByStore(id);
      setProducts(productsResponse.data);

      // Fetch gifts for this store
      const giftsResponse = await giftAPI.getByStore(id);
      setGifts(giftsResponse.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          err.message ||
          "Network error. Please check your connection."
      );
      console.error("Error fetching store data:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (previousPrice, newPrice) => {
    if (!previousPrice || !newPrice || previousPrice <= newPrice) return 0;
    return Math.round(((previousPrice - newPrice) / previousPrice) * 100);
  };

  const formatPrice = (price) => {
    if (typeof price !== "number") return `${t("ID")} 0`;
    return ` ${price.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} ${t("ID")}`;
  };

  const getRemainingDays = (expireDate) => {
    if (!expireDate) return null;
    const today = new Date();
    const expire = new Date(expireDate);
    const timeDiff = expire.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff > 0 ? daysDiff : 0;
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

  // Filter products based on current filters
  const getFilteredProducts = () => {
    return products.filter((product) => {
      const matchesName = product.name
        .toLowerCase()
        .includes(filters.name.toLowerCase());
      const matchesBrand =
        !filters.brand ||
        (product.brandId &&
          product.brandId.name &&
          product.brandId.name
            .toLowerCase()
            .includes(filters.brand.toLowerCase()));
      const matchesBarcode =
        !filters.barcode ||
        (product.barcode &&
          product.barcode
            .toLowerCase()
            .includes(filters.barcode.toLowerCase()));
      const matchesType =
        !filters.type ||
        product.type.toLowerCase().includes(filters.type.toLowerCase());

      return matchesName && matchesBrand && matchesBarcode && matchesType;
    });
  };

  // Separate products into discounted and non-discounted
  const getDiscountedProducts = () => {
    return getFilteredProducts().filter((product) => isDiscountValid(product));
  };

  const getNonDiscountedProducts = () => {
    return getFilteredProducts().filter((product) => !product.isDiscount);
  };

  // Group products by type
  const groupProductsByType = (productList) => {
    const grouped = {};
    productList.forEach((product) => {
      if (!grouped[product.type]) {
        grouped[product.type] = [];
      }
      grouped[product.type].push(product);
    });
    return grouped;
  };

  // Get unique product types for filter dropdown
  const getProductTypes = () => {
    const types = [...new Set(products.map((product) => product.type))];
    return types.sort();
  };

  // Get unique companies for filter dropdown
  const getBrands = () => {
    const brands = products
      .map((product) => product.brandId)
      .filter((brand) => brand && brand.name)
      .map((brand) => brand.name);
    return [...new Set(brands)].sort();
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Toggle expanded state for product types
  const toggleExpanded = (type) => {
    setExpandedTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));

    // Reset display count when collapsing
    if (expandedTypes[type]) {
      setDisplayCounts((prev) => ({
        ...prev,
        [type]: 10,
      }));
    }
  };

  // Load more products for a specific type
  const loadMoreProducts = (type) => {
    setDisplayCounts((prev) => ({
      ...prev,
      [type]: (prev[type] || 10) + 20,
    }));
  };

  // Handle like button click
  const handleLikeClick = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Show login notification dialog
      setLoginNotificationOpen(true);
      return;
    }

    // Prevent multiple rapid clicks
    if (likeLoading[productId]) return;

    // Optimistic update
    const currentLikeState = likeStates[productId];
    const currentLikeCount = likeCounts[productId];

    setLikeLoading((prev) => ({ ...prev, [productId]: true }));
    setLikeStates((prev) => ({ ...prev, [productId]: !currentLikeState }));
    setLikeCounts((prev) => ({
      ...prev,
      [productId]: currentLikeState
        ? currentLikeCount - 1
        : currentLikeCount + 1,
    }));

    try {
      const result = await toggleLike(productId);

      if (!result.success) {
        // Revert optimistic update on failure
        setLikeStates((prev) => ({ ...prev, [productId]: currentLikeState }));
        setLikeCounts((prev) => ({ ...prev, [productId]: currentLikeCount }));
      }
    } catch (error) {
      // Revert optimistic update on error
      setLikeStates((prev) => ({ ...prev, [productId]: currentLikeState }));
      setLikeCounts((prev) => ({ ...prev, [productId]: currentLikeCount }));
    } finally {
      setLikeLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Render gift card
  const renderGiftCard = (gift) => {
    const remainingDays = getRemainingDays(gift.expireDate);

    return (
      <Card
        key={gift._id}
        onClick={() => {
          setSelectedGift(gift);
          setDialogOpen(true);
        }}
        sx={{
          display: "flex",
          height: { xs: "150px", sm: "250px", md: "280px" },
          width: "100%",
          borderRadius: 2,
          overflow: "hidden",
          background: "linear-gradient(135deg, #34495e 0%, #2c3e50 100%)",
          border: `1px solid ${
            theme.palette.mode === "dark" ? "#4a5568" : "#e2e8f0"
          }`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 4px 16px rgba(0,0,0,0.3)"
              : "0 4px 16px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 24px rgba(0,0,0,0.4)"
                : "0 8px 24px rgba(0,0,0,0.15)",
          },
        }}
      >
        {/* Gift Image */}
        <Box
          sx={{
            width: { xs: "100px", sm: "150px", md: "400px" },
            height: "100%",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <CardMedia
            component="img"
            image={`${process.env.REACT_APP_BACKEND_URL}${gift.image}`}
            alt={gift.description}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "fill",
            }}
          />
        </Box>

        {/* Gift Content */}
        <CardContent
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: { xs: 2, sm: 2.5, md: 3 },
            minHeight: 0,
          }}
        >
          {/* Main Description */}
          <Typography
            variant="body1"
            sx={{
              alignItems: "center",
              fontSize: { xs: ".75rem", sm: "0.9rem", md: "1.5rem" },
              lineHeight: 1.4,
              mb: 2,
              color: theme.palette.text.primary,
              fontFamily: "NRT reg, Arial, sans-serif",
              overflow: { xs: "none", sm: "hidden", md: "hidden" },
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {gift.description}
          </Typography>

          {/* Brand Info */}
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            {gift.brandId && (
              <Box
                sx={{ display: "flex", alignItems: "center", mb: 1 }}
                onClick={() => {
                  navigate(`/brands/${gift.brandId._id}?tab=gifts`);
                }}
              >
                <Business
                  sx={{
                    fontSize: { xs: 12, sm: 16, md: 16 },
                    mr: 1,
                    color: "#52b788",
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: "0.5rem", sm: "0.75rem", md: "0.75rem" },
                    color: theme.palette.text.secondary,
                    fontFamily: "NRT reg, Arial, sans-serif",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  {t("Brand")}: {gift.brandId.name}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Expire Date */}
          <Box sx={{ flexShrink: 0 }}>
            {remainingDays !== null ? (
              <Chip
                label={`${t("Expires")}: ${remainingDays} ${t("days")}`}
                size="small"
                sx={{
                  bgcolor: remainingDays <= 7 ? "#ff6b6b" : "#52b788",
                  color: "white",
                  fontSize: { xs: "0.5rem", sm: "0.75rem", md: "0.75rem" },
                }}
              />
            ) : (
              <Chip
                label={t("No expiry")}
                size="small"
                sx={{
                  bgcolor: "#6c757d",
                  color: "white",
                  fontSize: { xs: "0.5rem", sm: "0.75rem", md: "0.75rem" },
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Render product card
  const renderProductCard = (product, index, showPrice = true) => {
    const discount = calculateDiscount(product.previousPrice, product.newPrice);
    const remainingDays = getRemainingDays(product.expireDate);

    return (
      <Fade in={true} timeout={300 + index * 50} key={product._id}>
        <Card
          component={Link}
          to={`/products/${product._id}`}
          sx={{
            height: { xs: "320px", sm: "380px" },
            width: { xs: "160px", sm: "220px", md: "280px" },
            maxWidth: { xs: "160px", sm: "220px", md: "280px" },
            minWidth: { xs: "160px", sm: "220px", md: "280px" },
            textDecoration: "none",
            borderRadius: 2,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            background: "white",
            border: "1px solid #e2e8f0",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
            },
          }}
        >
          {/* Product Image */}
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              height: { xs: "100px", sm: "100px" },
              flexShrink: 0,
              backgroundColor: "#f8f9fa",
            }}
          >
            {product.image ? (
              <CardMedia
                component="img"
                height="180"
                image={`${process.env.REACT_APP_BACKEND_URL}${product.image}`}
                alt={product.name}
                sx={{
                  objectFit: "contain",
                  width: "100%",
                  height: "100%",
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              />
            ) : (
              <Box
                sx={{
                  height: "100%",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f8f9fa",
                }}
              >
                <StorefrontIcon
                  sx={{
                    fontSize: 60,
                    color: "#a0aec0",
                  }}
                />
              </Box>
            )}

            {/* View Count Badge - Top Right */}
            {product.viewCount > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: "0.7rem",
                }}
              >
                <VisibilityIcon sx={{ fontSize: "0.8rem" }} />
                {product.viewCount}
              </Box>
            )}
          </Box>

          {/* Product Content */}
          <CardContent
            sx={{
              p: { xs: 1.5, md: 2 },
              flex: 1,
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {/* Product Name */}
            <Typography
              variant="h6"
              sx={{
                color: "#000000",
                fontWeight: 600,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                textAlign: "center",
                mb: 1,
                lineHeight: 1.3,
                minHeight: "2.6em",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {product.name}
            </Typography>

            {/* Brand name if available */}
            {product.brandId && product.brandId.name && (
              <Typography
                variant="body2"
                sx={{
                  color: "#666",
                  fontSize: "0.8rem",
                  mb: 1,
                  fontStyle: "italic",
                  textAlign: "center",
                }}
              >
                {product.brandId.name}
              </Typography>
            )}

            {/* Pricing Section */}
            {showPrice && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                {product.previousPrice &&
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
              </Box>
            )}

            {/* Bottom Section with Discount Badge and Like Button */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                mt: "auto",
              }}
            >
              {/* Discount Badge - Bottom Left */}
              {(discount > 0 || product.isDiscount) && (
                <Chip
                  label={discount > 0 ? `-${discount}%` : t("Discount")}
                  sx={{
                    backgroundColor: "#e53e3e",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    height: "24px",
                  }}
                />
              )}

              {/* Like Button and Count - Bottom Right */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#666",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                  }}
                >
                  {likeCounts[product._id] || product.likeCount || 0}
                </Typography>
                <IconButton
                  onClick={(e) => handleLikeClick(product._id, e)}
                  disabled={likeLoading[product._id]}
                  sx={{
                    color:
                      likeStates[product._id] || isProductLiked(product._id)
                        ? "#e53e3e"
                        : "#666",
                    "&:hover": {
                      color: "#e53e3e",
                      transform: "scale(1.1)",
                    },
                    transition: "all 0.2s ease",
                    p: 0.5,
                  }}
                  size="small"
                >
                  {likeStates[product._id] || isProductLiked(product._id) ? (
                    <FavoriteIcon sx={{ fontSize: "1.2rem" }} />
                  ) : (
                    <FavoriteBorderIcon sx={{ fontSize: "1.2rem" }} />
                  )}
                </IconButton>
              </Box>
            </Box>

            {/* Expiry Date - Bottom */}
            {product.expireDate && (
              <Typography
                variant="caption"
                sx={{
                  color: "red",
                  fontSize: { xs: "0.7rem", sm: "0.8rem" },
                  textAlign: "center",
                  mt: 1,
                  fontWeight: 500,
                }}
              >
                {t("Expire Date")}:{" "}
                {new Date(product.expireDate).toLocaleDateString("ar-SY", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                })}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Fade>
    );
  };

  // Render products grouped by type
  const renderProductsByType = (productList, showPrice = true) => {
    const groupedProducts = groupProductsByType(productList);

    return Object.entries(groupedProducts).map(([type, typeProducts]) => {
      const isExpanded = expandedTypes[type];
      const currentDisplayCount = displayCounts[type] || 10;
      const displayProducts = isExpanded
        ? typeProducts.slice(0, currentDisplayCount)
        : typeProducts.slice(0, 10);
      const hasMore =
        typeProducts.length > (isExpanded ? currentDisplayCount : 10);

      return (
        <Box key={type} sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <StorefrontIcon sx={{ color: "#52b788" }} />
            {t(type)}
            <Chip
              label={`${typeProducts.length} ${t("items")}`}
              size="small"
              sx={{
                backgroundColor: "#52b788",
                color: "white",
                fontWeight: 600,
              }}
            />
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(auto-fill, minmax(280px, 1fr))",
                md: "repeat(auto-fill, minmax(280px, 1fr))",
              },
              gap: { xs: 2, sm: 3, md: 3 },
              justifyContent: "center",
              mb: 2,
            }}
          >
            {displayProducts.map((product, index) =>
              renderProductCard(product, index, showPrice)
            )}
          </Box>

          {hasMore && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() =>
                  isExpanded ? loadMoreProducts(type) : toggleExpanded(type)
                }
                sx={{
                  borderColor: "#52b788",
                  color: "#52b788",
                  "&:hover": {
                    borderColor: "#40916c",
                    backgroundColor: "rgba(82, 183, 136, 0.1)",
                  },
                }}
              >
                {isExpanded ? t("Show More") : t("Show More")}
              </Button>
            </Box>
          )}

          {isExpanded && displayProducts.length > 10 && (
            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Button
                variant="text"
                onClick={() => toggleExpanded(type)}
                sx={{
                  color: "#666",
                  "&:hover": {
                    backgroundColor: "rgba(102, 102, 102, 0.1)",
                  },
                }}
              >
                {t("Show Less")}
              </Button>
            </Box>
          )}
        </Box>
      );
    });
  };

  // Render filter section
  const renderFilters = () => (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        mb: 1,
        borderRadius: 3,
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
            : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
        border: `1px solid ${
          theme.palette.mode === "dark" ? "#34495e" : "#e9ecef"
        }`,
      }}
    >
      {/* Mobile Filter Toggle */}
      <Box
        onClick={toggleFilters}
        sx={{
          display: { xs: "flex", md: "none" },
          mb: 2,
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: theme.palette.text.primary,
          }}
        >
          <FilterList sx={{ color: "#52b788" }} />
          {t("Filters")}
        </Typography>
      </Box>

      {/* Desktop Filter Header */}
      <Typography
        variant="h6"
        sx={{
          mb: 3,
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          gap: 1,
          color: theme.palette.text.primary,
        }}
      >
        <FilterList sx={{ color: "#52b788" }} />
        {t("Filters")}
      </Typography>

      <Box
        sx={{ display: { xs: filtersOpen ? "block" : "none", md: "block" } }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={t("Search by Name")}
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl sx={{ width: "200px" }} fullWidth>
              <InputLabel>{t("Brand")}</InputLabel>
              <Select
                value={filters.brand}
                onChange={(e) => handleFilterChange("brand", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                label={t("Brand")}
              >
                <MenuItem value="">{t("All Brands")}</MenuItem>
                {getBrands().map((brand) => (
                  <MenuItem key={brand} value={brand}>
                    {brand}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={t("Search by Barcode")}
              value={filters.barcode}
              onChange={(e) => handleFilterChange("barcode", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl sx={{ width: "200px" }} fullWidth>
              <InputLabel>{t("Product Type")}</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                label={t("Product Type")}
              >
                <MenuItem value="">{t("All Types")}</MenuItem>
                {getProductTypes().map((type) => (
                  <MenuItem key={type} value={type}>
                    {t(type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );

  if (loading) return <Loader message="Loading..." />;
  if (error) return <Loader message={error} />;
  if (!store) return <Alert severity="error">Store not found</Alert>;

  const discountedProducts = getDiscountedProducts();
  const nonDiscountedProducts = getNonDiscountedProducts();

  return (
    <Box sx={{ py: 8, px: { xs: 0.5, sm: 1.5, md: 3 } }}>
      {/* Enhanced Back Button */}
      <Button
        position="fixed"
        top={10}
        left={0}
        zIndex={100}
        variant="outlined"
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{
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

      {/* Enhanced Store Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: 4,
          overflow: "hidden",
          background: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
          border: `1px solid ${
            theme.palette.mode === "dark" ? "#40916c" : "#34495e"
          }`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 12px 40px rgba(0,0,0,0.3)"
              : "0 12px 40px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header Background */}
        <Box
          sx={{
            background: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
            p: { xs: 2, sm: 3, md: 4 },
            color: "white",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)",
            },
          }}
        >
          <Box position="relative" zIndex={1}>
            {/* Mobile Layout - Logo and Name on same row */}
            <Box
              alignItems="center"
              sx={{
                display: { xs: "flex", md: "none" },
                gap: 2,
                mb: 2,
              }}
            >
              {store.logo ? (
                <Avatar
                  src={`${process.env.REACT_APP_BACKEND_URL}${store.logo}`}
                  alt={store.name}
                  sx={{
                    width: 60,
                    height: 60,
                    border: "3px solid rgba(255,255,255,0.2)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: "rgba(255,255,255,0.2)",
                    border: "3px solid rgba(255,255,255,0.2)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                    flexShrink: 0,
                  }}
                >
                  <Business sx={{ fontSize: 30 }} />
                </Avatar>
              )}
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  color: "white",
                  flex: 1,
                }}
              >
                {store.name}
              </Typography>
            </Box>

            {/* Desktop Layout - Original Grid */}
            <Grid
              container
              spacing={{ xs: 2, sm: 3, md: 4 }}
              alignItems="center"
              sx={{ display: { xs: "none", md: "flex" } }}
            >
              <Grid item xs={12} md={3}>
                {store.logo ? (
                  <Avatar
                    src={`${process.env.REACT_APP_BACKEND_URL}${store.logo}`}
                    alt={store.name}
                    sx={{
                      width: { xs: 80, sm: 100, md: 150 },
                      height: { xs: 80, sm: 100, md: 150 },
                      border: "4px solid rgba(255,255,255,0.2)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                      mx: { xs: "auto", md: 0 },
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: { xs: 80, sm: 100, md: 150 },
                      height: { xs: 80, sm: 100, md: 150 },
                      bgcolor: "rgba(255,255,255,0.2)",
                      border: "4px solid rgba(255,255,255,0.2)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                      mx: { xs: "auto", md: 0 },
                    }}
                  >
                    <Business sx={{ fontSize: { xs: 40, sm: 50, md: 80 } }} />
                  </Avatar>
                )}
              </Grid>

              <Grid item xs={12} md={9}>
                <Typography
                  variant="h2"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "1.2rem", sm: "2rem", md: "3rem" },
                    textShadow: "0 4px 8px rgba(0,0,0,0.3)",
                    textAlign: { xs: "center", md: "left" },
                    mb: 2,
                    color: "white",
                  }}
                >
                  {store.name}
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {store.address && (
                    <Box
                      display="flex"
                      alignItems="center"
                      mb={1.5}
                      color="white"
                      justifyContent={{ xs: "center", md: "flex-start" }}
                    >
                      <LocationOn
                        sx={{ mr: 1.5, fontSize: 24, opacity: 0.9 }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: "1.125rem",
                          textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        }}
                        color="white"
                      >
                        {store.address}
                      </Typography>
                    </Box>
                  )}

                  {store.phone && (
                    <Box
                      display="flex"
                      alignItems="center"
                      mb={1.5}
                      justifyContent={{ xs: "center", md: "flex-start" }}
                    >
                      <Phone sx={{ mr: 1.5, fontSize: 24, opacity: 0.9 }} />
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: "1.125rem",
                          fontFamily: "monospace",
                          textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                          color: "white",
                        }}
                      >
                        {store.phone}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {store.description && (
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "1.125rem",
                      opacity: 0.9,
                      lineHeight: 1.6,
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      textAlign: { xs: "center", md: "left" },
                      maxWidth: 600,
                      color: "white",
                    }}
                  >
                    {store.description}
                  </Typography>
                )}

                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    gap: 2,
                    justifyContent: { xs: "center", md: "flex-start" },
                  }}
                >
                  <Chip
                    icon={<Store />}
                    label={`${products.length} ${t("Products")}`}
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "1rem",
                      px: 1,
                      backdropFilter: "blur(10px)",
                    }}
                  />
                  <Chip
                    icon={store.isVip ? "" : <ShoppingCartIcon />}
                    label={store.isVip ? t("VIP Store") : t("Premium Store")}
                    sx={{
                      backgroundColor: store.isVip
                        ? "red"
                        : "rgba(255,255,255,0.2)",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "1rem",
                      px: 1,
                      backdropFilter: "blur(10px)",
                    }}
                  />
                </Box>
              </Grid>
            </Grid>

            {/* Mobile Content - Address, Phone, Description */}
            <Box sx={{ display: { xs: "block", md: "none" } }}>
              <Box sx={{ mb: 2 }}>
                {store.address && (
                  <Box display="flex" mb={1} color="white">
                    <LocationOn sx={{ mr: 1, fontSize: 18, opacity: 0.9 }} />
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.875rem",
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      }}
                      color="white"
                    >
                      {store.address}
                    </Typography>
                  </Box>
                )}

                {store.phone && (
                  <Box display="flex" mb={1}>
                    <Phone sx={{ mr: 1, fontSize: 18, opacity: 0.9 }} />
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.875rem",
                        fontFamily: "monospace",
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                        color: "white",
                      }}
                    >
                      {store.phone}
                    </Typography>
                  </Box>
                )}
              </Box>

              {store.description && (
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    opacity: 0.9,
                    lineHeight: 1.4,
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    textAlign: "center",
                    color: "white",
                    mb: 2,
                  }}
                >
                  {store.description}
                </Typography>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: "center",
                }}
              >
                <Chip
                  icon={<Store />}
                  label={`${products.length} ${t("Products")}`}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    px: 1,
                    backdropFilter: "blur(10px)",
                  }}
                />
                <Chip
                  icon={store.isVip ? "" : <ShoppingCartIcon />}
                  label={store.isVip ? t("VIP Store") : t("Premium Store")}
                  sx={{
                    backgroundColor: store.isVip
                      ? "red"
                      : "rgba(255,255,255,0.2)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    px: 1,
                    backdropFilter: "blur(10px)",
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Enhanced Products Section with Tabs */}
      <Box sx={{ mb: 4 }}>
        {/* <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 1,
            }}
          >
            {t("Products")}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.text.secondary,
              mb: 3,
            }}
          >
            {t("Discover amazing products from this store")}
          </Typography>
          <Divider sx={{ maxWidth: 200, mx: "auto" }} />
        </Box> */}

        {/* Filter Section */}
        {renderFilters()}

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            borderRadius: 2,
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.05)"
                : "rgba(82, 183, 136, 0.05)",
            border: `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.1)"
                : "rgba(82, 183, 136, 0.1)"
            }`,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              p: 1,
              "& .MuiTab-root": {
                borderRadius: 2,
                mx: 0.5,
                transition: "all 0.3s ease",
                fontWeight: 600,
                width: { xs: "125px", sm: "100px", md: "100%" },
                fontSize: { xs: "0.875rem", sm: "1rem" },
                "&.Mui-selected": {
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#40916c" : "#52b788",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(82, 183, 136, 0.3)",
                },
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
            }}
          >
            <Tab
              label={`${t("Discounts")} (${discountedProducts.length})`}
              icon={<LocalOfferIcon />}
              iconPosition="start"
              sx={{
                textTransform: "none",
                width: { xs: "100px", sm: "100px", md: "100%" },
              }}
            />
            <Tab
              label={`${t("Gifts")} (${gifts.length})`}
              icon={<CardGiftcardIcon />}
              iconPosition="start"
              sx={{
                textTransform: "none",
                width: { xs: "100px", sm: "100px", md: "100%" },
              }}
            />
            {store?.isVip && (
              <Tab
                label={`${t("All Products")} (${nonDiscountedProducts.length})`}
                icon={<StorefrontIcon />}
                iconPosition="start"
                sx={{
                  textTransform: "none",
                  width: { xs: "100px", sm: "100px", md: "100%" },
                }}
              />
            )}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Box>
            {discountedProducts.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  px: 4,
                }}
              >
                <StorefrontIcon
                  sx={{
                    fontSize: 120,
                    color:
                      theme.palette.mode === "dark" ? "#4a5568" : "#cbd5e0",
                    mb: 3,
                  }}
                />
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  {t("No discount products available")}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.mode === "dark" ? "white" : "black",
                    maxWidth: 500,
                    mx: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  {t("This store hasn't added any discount products yet.")}
                </Typography>
              </Box>
            ) : (
              renderProductsByType(discountedProducts)
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {gifts.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  px: 4,
                }}
              >
                <CardGiftcardIcon
                  sx={{
                    fontSize: 120,
                    color:
                      theme.palette.mode === "dark" ? "#4a5568" : "#cbd5e0",
                    mb: 3,
                  }}
                />
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  {t("No gifts available")}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.mode === "dark" ? "white" : "black",
                    maxWidth: 500,
                    mx: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  {t("This store hasn't added any gifts yet.")}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr" },
                  gap: 3,
                  width: "100%",
                }}
              >
                {gifts.map((gift) => (
                  <Box key={gift._id} sx={{ display: "flex" }}>
                    {renderGiftCard(gift)}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {store?.isVip && activeTab === 2 && (
          <Box>
            {nonDiscountedProducts.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  px: 4,
                }}
              >
                <StorefrontIcon
                  sx={{
                    fontSize: 120,
                    color:
                      theme.palette.mode === "dark" ? "#4a5568" : "#cbd5e0",
                    mb: 3,
                  }}
                />
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  {t("No regular products available")}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    maxWidth: 500,
                    mx: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  {t("This store hasn't added any regular products yet.")}
                </Typography>
              </Box>
            ) : (
              renderProductsByType(nonDiscountedProducts, false)
            )}
          </Box>
        )}
      </Box>
      {/* Gift Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ShoppingCartIcon color="primary" />
            <Typography variant="h6" component="span">
              {t("Gift Information")}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedGift && (
            <Paper
              elevation={2}
              sx={{ p: 3, borderRadius: 3, bgcolor: "background.default" }}
            >
              {selectedGift.image && (
                <Box display="flex" justifyContent="center" mb={2}>
                  <img
                    src={`${process.env.REACT_APP_BACKEND_URL}${selectedGift.image}`}
                    alt={selectedGift.name || "Gift image"}
                    style={{
                      maxWidth: 220,
                      maxHeight: 220,
                      borderRadius: 16,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              )}
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography
                  variant="h6"
                  color="primary"
                  align="center"
                  gutterBottom
                >
                  {selectedGift.description}
                </Typography>

                {selectedGift.brandId && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Business fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t("Brand")}: {selectedGift.brandId.name}
                    </Typography>
                  </Box>
                )}

                {selectedGift.expireDate && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocalOfferIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t("Expires")}:{" "}
                      {new Date(selectedGift.expireDate).toLocaleDateString(
                        "ar-EG",
                        {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        }
                      )}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDialogOpen(false)}
            variant="contained"
            color="primary"
          >
            {t("Close")}
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

export default StoreProfile;
