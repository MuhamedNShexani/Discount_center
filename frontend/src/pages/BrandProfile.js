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
import { brandAPI, productAPI, giftAPI } from "../services/api";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import { useTranslation } from "react-i18next";
import Loader from "../components/Loader";

const BrandProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const { t } = useTranslation();

  const [brand, setBrand] = useState(null);
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

  // Filter states
  const [filters, setFilters] = useState({
    name: "",
    market: "",
    barcode: "",
    type: "",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (id) {
      fetchBrandData();
    }
  }, [id]);

  const fetchBrandData = async () => {
    try {
      setLoading(true);

      // Fetch brand details
      const brandResponse = await brandAPI.getById(id);
      setBrand(brandResponse.data);

      // Fetch products for this brand
      const productsResponse = await productAPI.getByBrand(id);
      setProducts(productsResponse.data);

      // Fetch gifts for this brand
      const giftsResponse = await giftAPI.getByBrand(id);
      setGifts(giftsResponse.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          err.message ||
          "Network error. Please check your connection."
      );
      console.error("Error fetching brand data:", err);
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

  // Filter products based on current filters
  const getFilteredProducts = () => {
    return products.filter((product) => {
      const matchesName = product.name
        .toLowerCase()
        .includes(filters.name.toLowerCase());
      const matchesMarket =
        !filters.market ||
        (product.marketId &&
          product.marketId.name &&
          product.marketId.name
            .toLowerCase()
            .includes(filters.market.toLowerCase()));
      const matchesBarcode =
        !filters.barcode ||
        (product.barcode &&
          product.barcode
            .toLowerCase()
            .includes(filters.barcode.toLowerCase()));
      const matchesType =
        !filters.type ||
        product.type.toLowerCase().includes(filters.type.toLowerCase());

      return matchesName && matchesMarket && matchesBarcode && matchesType;
    });
  };

  // Separate products into discounted and non-discounted
  const getDiscountedProducts = () => {
    return getFilteredProducts().filter((product) => product.isDiscount);
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

  // Get unique markets for filter dropdown
  const getMarkets = () => {
    const markets = products
      .map((product) => product.marketId)
      .filter((market) => market && market.name)
      .map((market) => market.name);
    return [...new Set(markets)].sort();
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

  // Render gift card
  const renderGiftCard = (gift) => {
    const remainingDays = getRemainingDays(gift.expireDate);

    return (
      <Card
        key={gift._id}
        sx={{
          display: "flex",
          height: { xs: "150px", sm: "250px", md: "280px" },
          width: "100%",
          borderRadius: 2,
          overflow: "hidden",
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

          {/* Market Info */}
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            {gift.marketId && gift.marketId.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                  <Store
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
                      fontWeight: 500,
                    }}
                  >
                    {t("Markets")}:
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {gift.marketId.map((market, index) => (
                    <Typography
                      key={market._id}
                      variant="body2"
                      onClick={() => {
                        navigate(`/markets/${market._id}?tab=gifts`);
                      }}
                      sx={{
                        fontSize: {
                          xs: "0.5rem",
                          sm: "0.75rem",
                          md: "0.75rem",
                        },
                        color: theme.palette.text.secondary,
                        fontFamily: "NRT reg, Arial, sans-serif",
                        cursor: "pointer",
                        userSelect: "none",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(82, 183, 136, 0.1)"
                            : "rgba(82, 183, 136, 0.05)",
                        border: `1px solid ${
                          theme.palette.mode === "dark"
                            ? "rgba(82, 183, 136, 0.2)"
                            : "rgba(82, 183, 136, 0.1)"
                        }`,
                        "&:hover": {
                          textDecoration: "underline",
                          color: "#52b788",
                          backgroundColor:
                            theme.palette.mode === "dark"
                              ? "rgba(82, 183, 136, 0.2)"
                              : "rgba(82, 183, 136, 0.1)",
                        },
                      }}
                    >
                      {market.name}
                    </Typography>
                  ))}
                </Box>
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
  const renderProductCard = (product, index) => {
    const discount = calculateDiscount(product.previousPrice, product.newPrice);
    const remainingDays = getRemainingDays(product.expireDate);

    return (
      <Fade in={true} timeout={300 + index * 50} key={product._id}>
        <Card
          component={Link}
          to={`/products/${product._id}`}
          sx={{
            height: { xs: "280px", sm: "320px", md: "350px" },
            width: { xs: "100%", sm: "280px", md: "280px" },
            maxWidth: { xs: "100%", sm: "280px", md: "280px" },
            minWidth: { xs: "auto", sm: "280px", md: "280px" },
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            borderRadius: { xs: 2, sm: 3, md: 3 },
            overflow: "hidden",
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #34495e 0%, #2c3e50 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            border: `1px solid ${
              theme.palette.mode === "dark" ? "#4a5568" : "#e2e8f0"
            }`,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 32px rgba(0,0,0,0.3)"
                : "0 8px 32px rgba(0,0,0,0.1)",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "translateY(-8px) scale(1.02)",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 20px 40px rgba(0,0,0,0.4)"
                  : "0 20px 40px rgba(0,0,0,0.15)",
              "& .product-image": {
                transform: "scale(1.1)",
              },
            },
          }}
        >
          {/* Product Image */}
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              height: { xs: "140px", sm: "160px", md: "180px" },
              flexShrink: 0,
            }}
          >
            {product.image ? (
              <CardMedia
                component="img"
                height="180"
                image={`${process.env.REACT_APP_BACKEND_URL}${product.image}`}
                alt={product.name}
                className="product-image"
                sx={{
                  objectFit: "contain",
                  width: "100%",
                  height: "100%",
                  transition: "transform 0.4s ease",
                  p: { xs: 1, sm: 0, md: 0 },
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
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)"
                      : "linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)",
                }}
              >
                <StorefrontIcon
                  sx={{
                    fontSize: 60,
                    color:
                      theme.palette.mode === "dark" ? "#718096" : "#a0aec0",
                  }}
                />
              </Box>
            )}

            {/* Badges */}
            <Box
              sx={{
                position: "absolute",
                top: 12,
                left: 12,
                right: 12,
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Chip
                  label={t(product.type)}
                  sx={{
                    backgroundColor: "rgba(82, 183, 136, 0.9)",
                    color: "white",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    backdropFilter: "blur(10px)",
                  }}
                />
                {discount > 0 && (
                  <Chip
                    label={`-${discount}%`}
                    sx={{
                      backgroundColor: "#e53e3e",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      boxShadow: "0 4px 12px rgba(229, 62, 62, 0.4)",
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Product Content */}
          <CardContent
            sx={{
              p: 2,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: "140px",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: "1rem",
                lineHeight: 1.3,
                mb: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {product.name}
            </Typography>

            {/* Market name if available */}
            {product.marketId && product.marketId.name && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: "0.875rem",
                  mb: 1,
                  fontStyle: "italic",
                }}
              >
                {product.marketId.name}
              </Typography>
            )}

            {/* Price Section */}
            <Box sx={{ mt: "auto" }}>
              {/* Expiry Info */}
              {remainingDays !== null && (
                <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                  <LocalOfferIcon sx={{ fontSize: 16, color: "#52b788" }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        remainingDays > 7
                          ? "#52b788"
                          : remainingDays > 0
                          ? "#f59e0b"
                          : "#ef4444",
                      fontWeight: 600,
                    }}
                  >
                    {remainingDays > 0
                      ? `${remainingDays} ${t("days remaining")}`
                      : t("Expired")}
                  </Typography>
                </Box>
              )}

              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                {product.previousPrice &&
                  product.previousPrice > product.newPrice && (
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: "line-through",
                        color: theme.palette.text.secondary,
                        fontSize: "0.875rem",
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
                    fontSize: "1.125rem",
                  }}
                >
                  {formatPrice(product.newPrice)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    );
  };

  // Render products grouped by type
  const renderProductsByType = (productList) => {
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
              renderProductCard(product, index)
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
      onClick={toggleFilters}
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
        sx={{
          display: { xs: "flex", md: "none" },
          mb: 2,
          justifyContent: "space-between",
          alignItems: "center",
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
              <InputLabel>{t("Market")}</InputLabel>
              <Select
                value={filters.market}
                onChange={(e) => handleFilterChange("market", e.target.value)}
                label={t("Market")}
              >
                <MenuItem value="">{t("All Markets")}</MenuItem>
                {getMarkets().map((market) => (
                  <MenuItem key={market} value={market}>
                    {market}
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

  if (loading) return <Loader message="Loading brand details..." />;
  if (error) return <Loader message={error} />;
  if (!brand) return <Alert severity="error">Brand not found</Alert>;

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
          borderColor: theme.palette.mode === "dark" ? "#52b788" : "#40916c",
          color: theme.palette.mode === "dark" ? "#52b788" : "#40916c",
          "&:hover": {
            borderColor: theme.palette.mode === "dark" ? "#40916c" : "#52b788",
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(82, 183, 136, 0.1)"
                : "rgba(64, 145, 108, 0.1)",
          },
        }}
      >
        {t("Back")}
      </Button>

      {/* Enhanced Brand Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: 4,
          overflow: "hidden",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
              : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
          border: `1px solid ${
            theme.palette.mode === "dark" ? "#34495e" : "#e9ecef"
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
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #52b788 0%, #40916c 100%)"
                : "linear-gradient(135deg, #52b788 0%, #40916c 100%)",
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
          {/* Mobile Layout - Logo and Name on same row */}
          <Box
            alignItems="center"
            sx={{
              display: { xs: "flex", md: "none" },
              gap: 2,
              mb: 2,
            }}
          >
            {brand.logo ? (
              <Avatar
                src={`${process.env.REACT_APP_BACKEND_URL}${brand.logo}`}
                alt={brand.name}
                sx={{
                  width: 60,
                  height: 60,
                  border: "3px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
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
                }}
              >
                <Business sx={{ fontSize: 30 }} />
              </Avatar>
            )}
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: "1.2rem",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                color: "white",
              }}
            >
              {brand.name}
            </Typography>
          </Box>

          {/* Mobile Layout - Address, Phone, Description, Chips */}
          <Box sx={{ display: { xs: "block", md: "none" } }}>
            {brand.address && (
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
                  {brand.address}
                </Typography>
              </Box>
            )}

            {brand.phone && (
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
                  {brand.phone}
                </Typography>
              </Box>
            )}

            {brand.description && (
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.875rem",
                  opacity: 0.9,
                  lineHeight: 1.4,
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  mb: 2,
                  color: "white",
                }}
              >
                {brand.description}
              </Typography>
            )}

            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Chip
                icon={<Store />}
                label={`${products.length} ${t("Products")}`}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  fontSize: "0.75rem",
                  "& .MuiChip-icon": {
                    color: "white",
                    fontSize: "1rem",
                  },
                }}
              />
              <Chip
                icon={<LocalOfferIcon />}
                label={`${discountedProducts.length} ${t("Discounted")}`}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  fontSize: "0.75rem",
                  "& .MuiChip-icon": {
                    color: "white",
                    fontSize: "1rem",
                  },
                }}
              />
            </Box>
          </Box>

          {/* Desktop Layout */}
          <Box
            position="relative"
            zIndex={1}
            sx={{ display: { xs: "none", md: "block" } }}
          >
            <Grid
              container
              spacing={{ xs: 2, sm: 3, md: 4 }}
              alignItems="center"
            >
              <Grid item xs={12} md={3}>
                {brand.logo ? (
                  <Avatar
                    src={`${process.env.REACT_APP_BACKEND_URL}${brand.logo}`}
                    alt={brand.name}
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
                    fontSize: { xs: "1.5rem", sm: "2rem", md: "3rem" },
                    textShadow: "0 4px 8px rgba(0,0,0,0.3)",
                    textAlign: { xs: "center", md: "left" },
                    mb: 2,
                    color: "white",
                  }}
                >
                  {brand.name}
                </Typography>

                <Box sx={{ mb: 3 }}>
                  {brand.address && (
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
                        {brand.address}
                      </Typography>
                    </Box>
                  )}

                  {brand.phone && (
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
                        {brand.phone}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {brand.description && (
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
                    {brand.description}
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
                    icon={<ShoppingCartIcon />}
                    label={t("Premium Brand")}
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.2)",
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
          </Box>
        </Box>
      </Paper>

      {/* Enhanced Products Section with Tabs */}
      <Box sx={{ mb: 4 }}>
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
                    theme.palette.mode === "dark" ? "#52b788" : "#52b788",
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
            <Tab
              label={`${t("All Products")} (${nonDiscountedProducts.length})`}
              icon={<StorefrontIcon />}
              iconPosition="start"
              sx={{
                textTransform: "none",
                width: { xs: "100px", sm: "100px", md: "100%" },
              }}
            />
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
                    color: theme.palette.text.secondary,
                    maxWidth: 500,
                    mx: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  {t("This brand hasn't added any discount products yet.")}
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
                    color: theme.palette.text.secondary,
                    maxWidth: 500,
                    mx: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  {t("This brand hasn't added any gifts yet.")}
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

        {activeTab === 2 && (
          <Box>
            {nonDiscountedProducts.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  px: 4,
                }}
              >
                <LocalOfferIcon
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
                  {t("This brand hasn't added any regular products yet.")}
                </Typography>
              </Box>
            ) : (
              renderProductsByType(nonDiscountedProducts)
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BrandProfile;
