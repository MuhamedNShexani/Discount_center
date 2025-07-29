import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Divider,
  Avatar,
  Badge,
  TablePagination,
  IconButton,
  Rating,
  Tooltip,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { productAPI, categoryAPI } from "../services/api";
import CategoryIcon from "@mui/icons-material/Category";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BusinessIcon from "@mui/icons-material/Business";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import StarIcon from "@mui/icons-material/Star";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useUserTracking } from "../hooks/useUserTracking";
import { useAuth } from "../context/AuthContext";

const ProductCategory = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { toggleLike, isProductLiked, recordView } = useUserTracking();

  const [categories, setCategories] = useState([]);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    market: "",
    barcode: "",
    discount: true,
  });

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filters, selectedCategoryType]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
  }, [filters, selectedCategoryType]);

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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAll();
      const allCategories = response.data;
      setCategories(allCategories);

      if (allCategories.length > 0) {
        const incomingCategory = location.state?.category;
        const incomingCategoryType = location.state?.categoryType;
        const categoryToSelect =
          incomingCategory &&
          allCategories.find((cat) => cat.name === incomingCategory)
            ? allCategories.find((cat) => cat.name === incomingCategory)
            : allCategories[0];
        setSelectedCategory(categoryToSelect);
        await fetchCategoryTypes(categoryToSelect._id);
        await fetchProductsByCategory(categoryToSelect._id);

        // If category type is provided, set it after category types are loaded
        if (incomingCategoryType) {
          const categoryTypesResponse = await categoryAPI.getTypes(
            categoryToSelect._id
          );
          const categoryTypes = categoryTypesResponse.data;
          const categoryTypeToSelect = categoryTypes.find(
            (type) => type.name === incomingCategoryType
          );
          if (categoryTypeToSelect) {
            setSelectedCategoryType(categoryTypeToSelect);
          }
        }
      }
    } catch (err) {
      setError("Failed to load categories. Please try again.");
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryTypes = async (categoryId) => {
    try {
      if (!categoryId) {
        setCategoryTypes([]);
        return;
      }
      const response = await categoryAPI.getTypes(categoryId);
      setCategoryTypes(response.data);
      setSelectedCategoryType(null); // Reset selected type when category changes
    } catch (err) {
      console.error("Error fetching category types:", err);
      setCategoryTypes([]);
    }
  };

  const fetchProductsByCategory = async (categoryId) => {
    try {
      const response = await productAPI.getAll({ category: categoryId });
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products by category:", err);
    }
  };

  const handleCategoryChange = async (event, newValue) => {
    setSelectedCategory(newValue);
    await fetchCategoryTypes(newValue._id);
    await fetchProductsByCategory(newValue._id);
  };

  const handleCategoryTypeChange = (event, newValue) => {
    setSelectedCategoryType(newValue);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
    // Record view when dialog is opened
    recordView(product._id);
  };

  // Handle like button click
  const handleLikeClick = async (productId, e) => {
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

  // Apply filters to products
  const applyFilters = () => {
    let filtered = [...products];

    // Filter by category type
    if (selectedCategoryType) {
      filtered = filtered.filter(
        (product) => product.categoryTypeId === selectedCategoryType._id
      );
    }

    // Filter by name
    if (filters.name) {
      filtered = filtered.filter((product) =>
        product.name?.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    // Filter by brand
    if (filters.brand) {
      filtered = filtered.filter((product) =>
        product.brandId?.name
          ?.toLowerCase()
          .includes(filters.brand.toLowerCase())
      );
    }

    // Filter by market
    if (filters.market) {
      filtered = filtered.filter((product) =>
        product.marketId?.name
          ?.toLowerCase()
          .includes(filters.market.toLowerCase())
      );
    }

    // Filter by barcode
    if (filters.barcode) {
      filtered = filtered.filter((product) =>
        product.barcode?.toLowerCase().includes(filters.barcode.toLowerCase())
      );
    }

    // Filter by discount
    if (filters.discount) {
      filtered = filtered.filter((product) => product.isDiscount);
    }

    setFilteredProducts(filtered);
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

  // Get unique brands for filter dropdown
  const getBrands = () => {
    const brands = products
      .map((product) => product.brandId?.name)
      .filter((name) => name)
      .map((name) => name);
    return [...new Set(brands)].sort();
  };

  // Get unique markets for filter dropdown
  const getMarkets = () => {
    const markets = products
      .map((product) => product.marketId?.name)
      .filter((name) => name)
      .map((name) => name);
    return [...new Set(markets)].sort();
  };

  const formatPrice = (price) => {
    if (typeof price !== "number") return ` ${t("0")} ${t("ID")}`;
    return ` ${price.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} ${t("ID")}`;
  };

  const calculateDiscount = (previousPrice, newPrice) => {
    if (!previousPrice || !newPrice) return 0;
    return Math.round(((previousPrice - newPrice) / previousPrice) * 100);
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

  // Render filter section
  const renderFilters = () => (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        mb: 1,
        borderRadius: { xs: 2, md: 3 },
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
          <FilterListIcon sx={{ color: "#52b788" }} />
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
        <FilterListIcon sx={{ color: "#52b788" }} />
        {t("Filters")}
      </Typography>

      <Box
        sx={{ display: { xs: filtersOpen ? "block" : "none", md: "block" } }}
      >
        <Grid container spacing={{ xs: 1, md: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={t("Search By Name")}
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl sx={{ width: { xs: "125px", md: "300px" } }} fullWidth>
              <InputLabel>{t("Brand")}</InputLabel>
              <Select
                value={filters.brand}
                onChange={(e) => handleFilterChange("brand", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                label={t("Brand")}
              >
                <MenuItem value="" sx={{ width: "250px" }}>
                  {t("All Brands")}
                </MenuItem>
                {getBrands().map((brand) => (
                  <MenuItem key={brand} value={brand}>
                    {brand}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl sx={{ width: { xs: "125px", md: "300px" } }} fullWidth>
              <InputLabel>{t("Market")}</InputLabel>
              <Select
                value={filters.market}
                onChange={(e) => handleFilterChange("market", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                label={t("Market")}
              >
                <MenuItem value="" sx={{ width: "250px" }}>
                  {t("All Markets")}
                </MenuItem>
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
              label={t("Search By Barcode")}
              value={filters.barcode}
              onChange={(e) => handleFilterChange("barcode", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.discount}
                  onChange={(e) =>
                    handleFilterChange("discount", e.target.checked)
                  }
                  onClick={(e) => e.stopPropagation()}
                  color="primary"
                />
              }
              label={t("Discount Only")}
              sx={{
                mt: 1,
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.875rem",
                  color: theme.palette.text.primary,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                setFilters({
                  name: "",
                  brand: "",
                  market: "",
                  barcode: "",
                  discount: false,
                });
              }}
              sx={{
                borderColor: "#52b788",
                color: "#52b788",
                "&:hover": {
                  borderColor: "#40916c",
                  backgroundColor: "rgba(82, 183, 136, 0.1)",
                },
              }}
            >
              {t("Clear Filters")}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );

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

  return (
    <Box sx={{ py: 8, px: { xs: 2, sm: 1.5, md: 3 } }}>
      <Box display="flex" alignItems="center" mb={3}>
        <CategoryIcon
          sx={{
            fontSize: { xs: 32, sm: 36, md: 40 },
            mr: { xs: 1, sm: 2 },
            color: theme.palette.mode === "dark" ? "contained" : "#primary",
          }}
        />
        <Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              color: theme.palette.mode === "dark" ? "contained" : "#primary",
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
            }}
          >
            {t("Products")}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: theme.palette.mode === "dark" ? "contained" : "#primary",
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
            gutterBottom
          >
            {t("Browse Your favourite products")}
          </Typography>
        </Box>
      </Box>

      {/* Main Category Tabs */}
      {categories.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: { xs: 2, md: 3 },
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            border: `1px solid ${
              theme.palette.mode === "dark" ? "#34495e" : "#e9ecef"
            }`,
          }}
        >
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: theme.palette.text.primary,
                fontSize: { xs: "1rem", md: "1.25rem" },
              }}
            >
              <CategoryIcon sx={{ color: "#52b788" }} />
              {t("Categories")}
            </Typography>
            <Tabs
              value={selectedCategory}
              onChange={handleCategoryChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTabs-indicator": {
                  backgroundColor: "#52b788",
                  height: 3,
                  borderRadius: 2,
                },
                "& .MuiTab-root": {
                  minWidth: { xs: "120px", sm: "auto" },
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                },
              }}
            >
              {categories.map((category) => (
                <Tab
                  key={category._id}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar
                        sx={{
                          width: { xs: 20, md: 24 },
                          height: { xs: 20, md: 24 },
                          bgcolor: "#52b788",
                          color: "#fff",
                          fontSize: { xs: "0.6rem", md: "0.75rem" },
                        }}
                      >
                        {category.icon || category.name.charAt(0)}
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight:
                            selectedCategory?._id === category._id ? 600 : 400,
                          fontSize: { xs: "0.7rem", sm: "0.875rem" },
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        {category.name}
                      </Typography>
                    </Box>
                  }
                  value={category}
                  sx={{
                    minHeight: { xs: 48, sm: 56 },
                    px: { xs: 1, sm: 2 },
                  }}
                />
              ))}
            </Tabs>
          </Box>
        </Paper>
      )}

      {/* Category Types Tabs */}
      {selectedCategory && categoryTypes.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: { xs: 2, md: 3 },
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            border: `1px solid ${
              theme.palette.mode === "dark" ? "#34495e" : "#e9ecef"
            }`,
          }}
        >
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: theme.palette.text.primary,
                fontSize: { xs: "1rem", md: "1.25rem" },
              }}
            >
              <ExpandMoreIcon sx={{ color: "#52b788" }} />
              {t("Category Types")} - {selectedCategory.name}
            </Typography>
            <Tabs
              value={selectedCategoryType}
              onChange={handleCategoryTypeChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTabs-indicator": {
                  backgroundColor: "#52b788",
                  height: 3,
                  borderRadius: 2,
                },
                "& .MuiTab-root": {
                  minWidth: { xs: "100px", sm: "auto" },
                },
              }}
            >
              <Tab
                label={
                  <Chip
                    label={t("All Types")}
                    size="small"
                    variant={
                      selectedCategoryType === null ? "filled" : "outlined"
                    }
                    color="primary"
                    sx={{
                      fontWeight: selectedCategoryType === null ? 600 : 400,
                      backgroundColor:
                        selectedCategoryType === null
                          ? "#52b788"
                          : "transparent",
                      color: selectedCategoryType === null ? "#fff" : "#52b788",
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                    }}
                  />
                }
                value={null}
                sx={{ minHeight: { xs: 32, md: 40 }, px: { xs: 0.5, md: 1 } }}
              />
              {categoryTypes.map((type) => (
                <Tab
                  key={type._id}
                  label={
                    <Chip
                      label={type.name}
                      size="small"
                      variant={
                        selectedCategoryType?._id === type._id
                          ? "filled"
                          : "outlined"
                      }
                      color="primary"
                      sx={{
                        fontWeight:
                          selectedCategoryType?._id === type._id ? 600 : 400,
                        backgroundColor:
                          selectedCategoryType?._id === type._id
                            ? "#52b788"
                            : "transparent",
                        color:
                          selectedCategoryType?._id === type._id
                            ? "#fff"
                            : "#52b788",
                        fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      }}
                    />
                  }
                  value={type}
                  sx={{ minHeight: { xs: 32, md: 40 }, px: { xs: 0.5, md: 1 } }}
                />
              ))}
            </Tabs>
          </Box>
        </Paper>
      )}

      {selectedCategory && (
        <>
          <Box display="flex" alignItems="center" mb={2}>
            <ShoppingCartIcon
              sx={{ fontSize: 24, mr: 1, color: theme.palette.primary.main }}
            />
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                color:
                  theme.palette.mode === "dark"
                    ? theme.palette.primary.contrastText
                    : theme.palette.text.primary,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? theme.palette.primary.main
                    : "transparent",
                fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
              }}
            >
              {selectedCategory.name}
            </Typography>
          </Box>

          {/* Filters Section */}
          {renderFilters()}

          {/* Products Grid */}
          <Grid
            container
            justifyContent="center"
            gap={3}
            spacing={{ xs: 1, md: 3 }}
            sx={{ width: { xs: "100%", md: "100%" } }}
          >
            {filteredProducts
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((product) => (
                <Grid
                  item
                  textAlign="center"
                  xs={6}
                  sm={4}
                  md={3}
                  lg={2}
                  key={product._id}
                >
                  <Card
                    sx={{
                      width: { xs: "150px", md: "220px" },
                      height: { xs: "auto", md: "100%" },
                      minHeight: { xs: "220px", md: "auto" },
                      transition: "transform 0.2s",
                      "&:hover": { transform: "scale(1.02)" },
                    }}
                  >
                    {product.image ? (
                      <CardMedia
                        component="img"
                        height="200"
                        image={`${process.env.REACT_APP_BACKEND_URL}${product.image}`}
                        alt={product.name || "Product image"}
                        sx={{
                          objectFit: "contain",
                          height: { xs: 120, sm: 160, md: 200 },
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: { xs: 120, sm: 160, md: 200 },
                          display: "flex",
                          justifyContent: "center",
                          backgroundColor: theme.palette.grey[200],
                        }}
                      >
                        <ShoppingCartIcon
                          sx={{
                            fontSize: { xs: 30, sm: 40, md: 60 },
                            color: theme.palette.grey[400],
                          }}
                        />
                      </Box>
                    )}
                    <CardContent sx={{ p: { xs: 1, md: 2 } }}>
                      <Typography
                        variant="h6"
                        component="div"
                        gutterBottom
                        sx={{
                          minHeight: { xs: 20, md: 28 },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: { xs: "0.75rem", sm: "1rem", md: "1rem" },
                        }}
                      >
                        {product.name || "\u00A0"}
                      </Typography>

                      {product.categoryTypeId && (
                        <Chip
                          label={getCategoryTypeName(
                            product.categoryTypeId,
                            product.categoryId
                          )}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: { xs: "0.5rem", sm: "0.7rem" },
                            mb: 1,
                            borderColor: "#52b788",
                            color: "#52b788",
                            backgroundColor: "rgba(82, 183, 136, 0.05)",
                            height: { xs: "16px", sm: "24px" },
                          }}
                        />
                      )}
                      {product.brandId ? (
                        <Box display="flex" mb={1}>
                          <BusinessIcon
                            sx={{
                              fontSize: { xs: 12, md: 16 },
                              mr: { xs: 0.5, md: 1 },
                              color: theme.palette.text.secondary,
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontSize: { xs: "0.55rem", sm: "0.75rem" },
                            }}
                          >
                            {product.brandId.name ? (
                              <>
                                {t("Brand")}: {product.brandId.name}
                              </>
                            ) : (
                              "\u00A0"
                            )}
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ height: { xs: 16, md: 24 }, mb: 1 }} />
                      )}
                      {product.marketId ? (
                        <Box display="flex" mb={1}>
                          <StorefrontIcon
                            sx={{
                              fontSize: { xs: 12, md: 16 },
                              mr: { xs: 0.5, md: 1 },
                              color: theme.palette.text.secondary,
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontSize: { xs: "0.55rem", sm: "0.75rem" },
                            }}
                          >
                            {product.marketId.name ? (
                              <>
                                {t("Market")}: {product.marketId.name}
                              </>
                            ) : (
                              "\u00A0"
                            )}
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ height: { xs: 16, md: 24 }, mb: 1 }} />
                      )}

                      {/* Weight and Discount Info */}
                      <Box display="flex" gap={1} mb={1}>
                        {product.isDiscount && (
                          <>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: { xs: "0.6rem", md: "0.7rem" } }}
                              color="text.secondary"
                            >
                              {product.expireDate ? (
                                <>{t("Expires")}: </>
                              ) : (
                                "\u00A0"
                              )}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="#2c3e50"
                              sx={{
                                minHeight: { xs: 16, md: 20 },
                                fontSize: { xs: "0.5rem", md: "0.7rem" },
                              }}
                            >
                              {product.expireDate
                                ? new Date(
                                    product.expireDate
                                  ).toLocaleDateString("ar-SY", {
                                    year: "numeric",
                                    month: "numeric",
                                    day: "numeric",
                                  })
                                : "\u00A0"}
                            </Typography>
                          </>
                        )}
                      </Box>
                      {/* Like, View Count, and Rating Section */}
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={1}
                        sx={{ minHeight: { xs: 24, md: 32 } }}
                      >
                        {/* Like Button */}
                        <Tooltip
                          title={
                            isAuthenticated
                              ? likeStates[product._id]
                                ? t("Unlike")
                                : t("Like")
                              : t("Login to like")
                          }
                        >
                          <IconButton
                            onClick={(e) => handleLikeClick(product._id, e)}
                            disabled={likeLoading[product._id]}
                            size="small"
                            sx={{
                              color: likeStates[product._id]
                                ? "#e91e63"
                                : theme.palette.text.secondary,
                              "&:hover": {
                                color: likeStates[product._id]
                                  ? "#c2185b"
                                  : "#e91e63",
                              },
                            }}
                          >
                            {likeLoading[product._id] ? (
                              <CircularProgress size={16} />
                            ) : likeStates[product._id] ? (
                              <FavoriteIcon
                                sx={{ fontSize: { xs: 16, md: 18 } }}
                              />
                            ) : (
                              <FavoriteBorderIcon
                                sx={{ fontSize: { xs: 16, md: 18 } }}
                              />
                            )}
                          </IconButton>
                        </Tooltip>

                        {/* Like Count */}
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: { xs: "0.6rem", md: "0.75rem" },
                            minWidth: "20px",
                            textAlign: "center",
                          }}
                        >
                          {likeCounts[product._id] || 0}
                        </Typography>

                        {/* View Count */}
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <VisibilityIcon
                            sx={{
                              fontSize: { xs: 12, md: 14 },
                              color: theme.palette.text.secondary,
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontSize: { xs: "0.6rem", md: "0.75rem" },
                            }}
                          >
                            {product.viewCount || 0}
                          </Typography>
                        </Box>

                        {/* Rating */}
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <StarIcon
                            sx={{
                              fontSize: { xs: 12, md: 14 },
                              color: "#ffc107",
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontSize: { xs: "0.6rem", md: "0.75rem" },
                            }}
                          >
                            {product.averageRating
                              ? product.averageRating.toFixed(1)
                              : "0.0"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Price and Discount Section */}
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={2}
                      >
                        <Box>
                          {product.previousPrice &&
                          product.previousPrice > product.newPrice ? (
                            <Typography
                              variant="body2"
                              color={
                                theme.palette.mode === "dark"
                                  ? "red"
                                  : "text.secondary"
                              }
                              sx={{
                                textDecoration: "line-through",
                                minHeight: { xs: 16, md: 20 },
                                fontSize: { xs: "0.6rem", md: "0.875rem" },
                              }}
                            >
                              {formatPrice(product.previousPrice)}
                            </Typography>
                          ) : (
                            <Typography
                              variant="body2"
                              sx={{ minHeight: { xs: 16, md: 20 } }}
                            >
                              {"\u00A0"}
                            </Typography>
                          )}
                          <Typography
                            variant="h6"
                            sx={{
                              color:
                                theme.palette.mode === "dark"
                                  ? "white"
                                  : theme.palette.primary.main,
                              fontWeight: 700,
                              fontSize: {
                                xs: "0.875rem",
                                sm: "1rem",
                                md: "1.125rem",
                              },
                            }}
                          >
                            {formatPrice(product.newPrice)}
                          </Typography>
                        </Box>
                        {(product.previousPrice &&
                          product.previousPrice > product.newPrice) ||
                        product.isDiscount ? (
                          <Chip
                            icon={<LocalOfferIcon />}
                            label={
                              product.previousPrice &&
                              product.previousPrice > product.newPrice
                                ? `-${calculateDiscount(
                                    product.previousPrice,
                                    product.newPrice
                                  )}%`
                                : t("Discount")
                            }
                            color="error"
                            size="small"
                            sx={{
                              fontSize: { xs: "0.5rem", sm: "0.75rem" },
                              height: { xs: "20px", sm: "24px" },
                            }}
                          />
                        ) : null}
                      </Box>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleProductClick(product)}
                        sx={{
                          mt: 2,
                          fontSize: { xs: "0.7rem", sm: "0.875rem" },
                          py: { xs: 0.5, sm: 1 },
                          minHeight: { xs: "32px", sm: "36px" },
                        }}
                      >
                        {t("View details")}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <TablePagination
                component="div"
                count={filteredProducts.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 20, 50, 100]}
                labelRowsPerPage={t("Products per page")}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} ${t("of")} ${
                    count !== -1 ? count : `${t("more than")} ${to}`
                  }`
                }
              />
            </Box>
          )}

          {filteredProducts.length === 0 &&
            selectedCategory &&
            products.length > 0 && (
              <Alert severity="info">
                {t(
                  "No products match your current filters. Try adjusting your search criteria."
                )}
              </Alert>
            )}

          {products.length === 0 && selectedCategory && (
            <Alert severity="info">
              {t("No products found in the")} {selectedCategory.name}{" "}
              {t("category")}.
            </Alert>
          )}

          {categories.length === 0 && (
            <Alert severity="info">
              No categories found. Add some products through the admin panel.
            </Alert>
          )}
        </>
      )}

      {/* Product Details Dialog */}
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
              {selectedProduct?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Paper
              elevation={2}
              sx={{ p: 3, borderRadius: 3, bgcolor: "background.default" }}
            >
              {selectedProduct.image && (
                <Box display="flex" justifyContent="center" mb={2}>
                  <img
                    src={`${process.env.REACT_APP_BACKEND_URL}${selectedProduct.image}`}
                    alt={selectedProduct.name || "Product image"}
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
                  {selectedProduct.name}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <CategoryIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {t("Category")}: {selectedProduct.categoryId?.name || "N/A"}
                  </Typography>
                </Box>
                {selectedProduct.categoryTypeId && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <ExpandMoreIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t("Type")}:{" "}
                      {getCategoryTypeName(
                        selectedProduct.categoryTypeId,
                        selectedProduct.categoryId
                      )}
                    </Typography>
                  </Box>
                )}
                {selectedProduct.brandId && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t("Brand")}: {selectedProduct.brandId.name}
                    </Typography>
                  </Box>
                )}
                {selectedProduct.marketId && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <StorefrontIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t("Market")}: {selectedProduct.marketId.name}
                    </Typography>
                  </Box>
                )}
                {selectedProduct.barcode && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary">
                      {t("Barcode")}: {selectedProduct.barcode}
                    </Typography>
                  </Box>
                )}

                {selectedProduct.expireDate && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocalOfferIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t("Expires")}:{" "}
                      {new Date(selectedProduct.expireDate).toLocaleDateString(
                        "ar-SY",
                        {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        }
                      )}
                    </Typography>
                  </Box>
                )}
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={2}
                  mt={2}
                >
                  {selectedProduct.previousPrice &&
                    selectedProduct.previousPrice >
                      selectedProduct.newPrice && (
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ textDecoration: "line-through" }}
                      >
                        {formatPrice(selectedProduct.previousPrice)}
                      </Typography>
                    )}
                  <Typography variant="h5" color="primary">
                    {formatPrice(selectedProduct.newPrice)}
                  </Typography>
                  {selectedProduct.previousPrice &&
                    selectedProduct.previousPrice >
                      selectedProduct.newPrice && (
                      <Chip
                        label={`-${calculateDiscount(
                          selectedProduct.previousPrice,
                          selectedProduct.newPrice
                        )}% OFF`}
                        color="error"
                        size="small"
                      />
                    )}
                </Box>
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

export default ProductCategory;
