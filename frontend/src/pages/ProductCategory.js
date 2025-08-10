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
  IconButton,
  Rating,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { productAPI, categoryAPI } from "../services/api";
import CategoryIcon from "@mui/icons-material/Category";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BusinessIcon from "@mui/icons-material/Business";
import StorefrontIcon from "@mui/icons-material/Storefront";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import StarIcon from "@mui/icons-material/Star";
import MenuIcon from "@mui/icons-material/Menu";
import StoreIcon from "@mui/icons-material/Store";
import CloseIcon from "@mui/icons-material/Close";
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

  // Mobile layout states
  const [selectedStoreType, setSelectedStoreType] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 900 ? "market" : "all"
  );
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Mobile view mode: 'categories' → list categories, 'products' → show products of selected category
  const [mobileViewMode, setMobileViewMode] = useState("categories");

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
    store: "",
    barcode: "",
    discount: false,
  });

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Store types for filtering
  const storeTypes = [
    // { value: "all", label: "All Store Types", icon: "🏪" },
    { value: "market", label: t("Market"), icon: "🛒" },
    { value: "clothes", label: t("Clothes"), icon: "👕" },
    { value: "electronic", label: t("Electronics"), icon: "📱" },
    { value: "cosmetic", label: t("Beauty & Care"), icon: "💄" },
  ];

  useEffect(() => {
    fetchCategories();
  }, [selectedStoreType]);

  // On first mount on mobile, lock the store type to the first option
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 900) {
      setSelectedStoreType("market");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep filtered list in sync when inputs change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, selectedCategoryType, filters]);

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
      let response;
      if (selectedStoreType === "all") {
        response = await categoryAPI.getAll();
      } else {
        response = await categoryAPI.getByStoreType(selectedStoreType);
      }
      setCategories(response.data);
      // Mobile: start in categories view; Desktop: preselect first category
      if (response.data.length > 0) {
        if (window.innerWidth >= 900) {
          setSelectedCategory(response.data[0]);
          await fetchCategoryTypes(response.data[0]._id);
          await fetchProductsByCategory(response.data[0]._id);
        } else {
          setSelectedCategory(null);
          setCategoryTypes([]);
          setProducts([]);
          setFilteredProducts([]);
          setMobileViewMode("categories");
        }
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryTypes = async (categoryId) => {
    try {
      const response = await categoryAPI.getTypes(categoryId);
      setCategoryTypes(response.data);
    } catch (err) {
      console.error("Error fetching category types:", err);
      setCategoryTypes([]);
    }
  };

  const fetchProductsByCategory = async (categoryId) => {
    try {
      const response = await productAPI.getByCategory(categoryId);
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
      setFilteredProducts([]);
    }
  };

  const handleCategoryChange = async (category) => {
    setSelectedCategory(category);
    setSelectedCategoryType(null);
    await fetchCategoryTypes(category._id);
    await fetchProductsByCategory(category._id);
    // On mobile, switch into products view
    if (window.innerWidth < 900) {
      setMobileViewMode("products");
    }
  };

  const handleCategoryTypeChange = (categoryType) => {
    setSelectedCategoryType(categoryType);
  };

  const handleStoreTypeChange = (storeType) => {
    // Allow selection of any store type (initial default set on mount only)
    setSelectedStoreType(storeType);
    setSelectedCategory(null);
    setSelectedCategoryType(null);
    setCategoryTypes([]);
    setProducts([]);
    setFilteredProducts([]);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
    if (isAuthenticated) {
      recordView(product._id);
    }
  };

  const handleLikeClick = async (productId, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setLoginNotificationOpen(true);
      return;
    }

    try {
      setLikeLoading({ ...likeLoading, [productId]: true });
      await toggleLike(productId);
      setLikeStates({
        ...likeStates,
        [productId]: !likeStates[productId],
      });
      setLikeCounts({
        ...likeCounts,
        [productId]:
          (likeCounts[productId] || 0) + (likeStates[productId] ? -1 : 1),
      });
    } catch (err) {
      console.error("Error toggling like:", err);
    } finally {
      setLikeLoading({ ...likeLoading, [productId]: false });
    }
  };

  const isDiscountValid = (product) => {
    const hasPriceDrop =
      product.previousPrice &&
      product.newPrice &&
      parseFloat(product.previousPrice) > parseFloat(product.newPrice);
    return Boolean(product.isDiscount) || Boolean(hasPriceDrop);
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (filters.name) {
      filtered = filtered.filter((product) =>
        product.name?.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.brand) {
      filtered = filtered.filter(
        (product) => product.brandId?.name === filters.brand
      );
    }

    if (filters.store) {
      filtered = filtered.filter(
        (product) => product.storeId?.name === filters.store
      );
    }

    if (filters.barcode) {
      filtered = filtered.filter((product) =>
        product.barcode?.includes(filters.barcode)
      );
    }

    if (filters.discount) {
      filtered = filtered.filter((product) => isDiscountValid(product));
    }

    if (selectedCategoryType) {
      filtered = filtered.filter(
        (product) => product.categoryTypeId === selectedCategoryType._id
      );
    }

    setFilteredProducts(filtered);
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  const getBrands = () => {
    const brands = products
      .map((product) => product.brandId?.name)
      .filter(Boolean);
    return [...new Set(brands)];
  };

  const getStores = () => {
    const stores = products
      .map((product) => product.storeId?.name)
      .filter(Boolean);
    return [...new Set(stores)];
  };

  const formatPrice = (price) => {
    if (typeof price !== "number") return `${t("ID")} 0`;
    return ` ${price.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} ${t("ID")}`;
  };

  const calculateDiscount = (previousPrice, newPrice) => {
    if (
      previousPrice === undefined ||
      previousPrice === null ||
      newPrice === undefined ||
      newPrice === null
    ) {
      return null;
    }
    const prev = Number(previousPrice);
    const next = Number(newPrice);
    if (
      !Number.isFinite(prev) ||
      !Number.isFinite(next) ||
      prev <= 0 ||
      prev <= next
    ) {
      return null;
    }
    const discount = ((prev - next) / prev) * 100;
    return Math.round(discount);
  };

  const getCategoryTypeName = (categoryTypeId, categoryId) => {
    if (!categoryTypeId || !categoryId) return "";
    const category = categories.find((cat) => cat._id === categoryId);
    if (!category) return "";
    const categoryType = category.types.find(
      (type) => type._id === categoryTypeId
    );
    return categoryType ? categoryType.name : "";
  };

  const renderMobileLayout = () => (
    <Box sx={{ display: { xs: "block", md: "none" } }}>
      {/* Left vertical rail: Store types (top bar stays global like other pages) */}
      <Box
        sx={{
          position: "fixed",
          top: 64,
          left: 0,
          width: 88,
          bottom: 0,
          borderRight: "1px solid #eee",
          backgroundColor: "#fafafa",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          py: 2,
          gap: 1.5,
        }}
      >
        {storeTypes.map((type) => (
          <Button
            key={type.value}
            onClick={() => handleStoreTypeChange(type.value)}
            variant={selectedStoreType === type.value ? "contained" : "text"}
            sx={{
              mx: 1,
              justifyContent: "flex-start",
              minWidth: 0,
              borderRadius: 2,
              textTransform: "none",

              backgroundColor:
                selectedStoreType === type.value
                  ? theme.palette.mode === "dark"
                    ? "#40916c"
                    : "#34495e"
                  : "transparent",
              color: selectedStoreType === type.value ? "white" : "inherit",
              "&:hover": {
                backgroundColor:
                  selectedStoreType === type.value
                    ? theme.palette.mode === "dark"
                      ? "#40916c"
                      : "#34495e"
                    : "transparent",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Avatar
                sx={{
                  bgcolor:
                    selectedStoreType === type.value ? "white" : "#e8f5e9",
                  color: "#2d6a4f",
                  width: 40,
                  height: 40,
                  mb: 0.5,
                }}
              >
                <Typography component="span" role="img" aria-label={type.label}>
                  {type.icon}
                </Typography>
              </Avatar>
              <Typography variant="caption" sx={{ textAlign: "center" }}>
                {type.label}
              </Typography>
            </Box>
          </Button>
        ))}
      </Box>

      {/* Right content area */}
      <Box
        sx={{
          pl: "96px",
          pt: 8,
          pr: 2,
          color: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
        }}
      >
        {mobileViewMode === "categories" && (
          <>
            <Typography
              sx={{
                my: 2,
                fontWeight: 600,
                color: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
              }}
            >
              {t("Categories")}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 1.5,
              }}
            >
              {categories.map((category) => (
                <Box key={category._id} sx={{ display: "flex" }}>
                  <Card
                    onClick={() => handleCategoryChange(category)}
                    sx={{
                      cursor: "pointer",
                      textAlign: "center",
                      p: 1.5,
                      width: "100%",
                    }}
                  >
                    <Avatar
                      src={
                        category.image
                          ? `${process.env.REACT_APP_BACKEND_URL}${category.image}`
                          : undefined
                      }
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: "#52b788",
                        color: "white",
                        mx: "auto",
                        mb: 1,
                      }}
                    >
                      {category.icon || category.name?.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {category.name}
                    </Typography>
                  </Card>
                </Box>
              ))}
            </Box>
          </>
        )}

        {mobileViewMode === "products" && selectedCategory && (
          <>
            {/* Simple header with back to categories to mimic other pages' top bar */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
                }}
              >
                {selectedCategory?.name}
              </Typography>
              <Button
                size="small"
                onClick={() => setMobileViewMode("categories")}
                sx={{
                  color: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
                }}
              >
                {t("Back")}
              </Button>
            </Box>
            {/* Category Types Filter */}
            {categoryTypes.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {/* <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Filter by Category Type
                </Typography> */}
                <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1 }}>
                  <Chip
                    label={t("All Types")}
                    onClick={() => setSelectedCategoryType(null)}
                    variant={
                      selectedCategoryType === null ? "filled" : "outlined"
                    }
                    color="primary"
                    sx={{
                      backgroundColor:
                        selectedCategoryType === null
                          ? theme.palette.mode === "dark"
                            ? "#40916c"
                            : "#34495e"
                          : "transparent",
                      color:
                        selectedCategoryType === null ? "white" : "inherit",
                    }}
                  />
                  {categoryTypes.map((type) => (
                    <Chip
                      key={type._id}
                      label={type.name}
                      onClick={() => setSelectedCategoryType(type)}
                      variant={
                        selectedCategoryType?._id === type._id
                          ? "filled"
                          : "outlined"
                      }
                      color="primary"
                      sx={{
                        backgroundColor:
                          selectedCategoryType?._id === type._id
                            ? theme.palette.mode === "dark"
                              ? "#40916c"
                              : "#34495e"
                            : "transparent",
                        color:
                          selectedCategoryType?._id === type._id
                            ? "white"
                            : "inherit",
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Products Grid - enforce 2 columns via CSS grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 1,
              }}
            >
              {filteredProducts.map((product) => (
                <Box key={product._id} sx={{ display: "flex" }}>
                  <Card
                    onClick={() => handleProductClick(product)}
                    sx={{
                      cursor: "pointer",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "scale(1.01)" },
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {/* Image */}
                    {product.image ? (
                      <CardMedia
                        component="img"
                        image={`${process.env.REACT_APP_BACKEND_URL}${product.image}`}
                        alt={product.name || "Product image"}
                        sx={{
                          height: 130,
                          objectFit: "contain",
                          backgroundColor: theme.palette.grey[200],
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 130,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: theme.palette.grey[200],
                        }}
                      >
                        <ShoppingCartIcon
                          sx={{
                            fontSize: 36,
                            color:
                              theme.palette.mode === "dark"
                                ? "#40916c"
                                : "#34495e",
                          }}
                        />
                      </Box>
                    )}

                    {/* Content */}
                    <CardContent
                      sx={{
                        p: 1.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        flexGrow: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          textAlign: "center",
                          minHeight: "2.4em",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {product.name || "\u00A0"}
                      </Typography>

                      {/* Category type chip or N/A */}
                      {/* <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Chip
                          label={
                            product.categoryTypeId
                              ? getCategoryTypeName(
                                  product.categoryTypeId,
                                  product.categoryId
                                )
                              : "N/A"
                          }
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.7rem",
                            color: "#2d6a4f",
                            backgroundColor: "rgba(82,183,136,0.12)",
                          }}
                        />
                      </Box> */}

                      {/* Optional meta */}
                      {product.storeId?.name && (
                        <Typography
                          variant="caption"
                          color="secondarytext."
                          sx={{ display: "block", textAlign: "center" }}
                        >
                          {product.storeId.name}
                        </Typography>
                      )}

                      <Box sx={{ mt: "auto" }}>
                        {/* Price + discount */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          {isDiscountValid(product) &&
                            product.previousPrice && (
                              <Typography
                                variant="caption"
                                sx={{
                                  textDecoration: "line-through",
                                  color: "text.secondary",
                                }}
                              >
                                {formatPrice(product.previousPrice)}
                              </Typography>
                            )}
                          {product.newPrice && (
                            <Typography
                              variant="body2"
                              sx={{ color: "#52b788", fontWeight: 700 }}
                            >
                              {formatPrice(product.newPrice)}
                            </Typography>
                          )}
                          {isDiscountValid(product) && (
                            <Chip
                              label={(() => {
                                const off = calculateDiscount(
                                  product.previousPrice,
                                  product.newPrice
                                );
                                return off === null ? t("Discount") : `${off}%`;
                              })()}
                              size="small"
                              sx={{
                                backgroundColor: "#e53e3e",
                                color: "white",
                                height: 18,
                                fontSize: "0.65rem",
                              }}
                            />
                          )}
                        </Box>

                        {/* View details button
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          sx={{
                            mt: 1,
                            textTransform: "none",
                            borderColor: "#52b788",
                            color: "#2d6a4f",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick(product);
                          }}
                        >
                          View details
                        </Button> */}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );

  const renderDesktopLayout = () => (
    <Box sx={{ display: { xs: "none", md: "block" } }}>
      {/* Desktop layout - keeping existing design */}
      <Box sx={{ py: 8, px: 3 }}>
        {/* Store Type Filter */}
        <Box sx={{ mb: 3 }}>
          {/* <Typography variant="h6" sx={{ mb: 2 }}>
            Filter by Store Type
          </Typography> */}
          <Box sx={{ display: "flex", gap: 2 }}>
            {storeTypes.map((type) => (
              <Button
                key={type.value}
                variant={
                  selectedStoreType === type.value ? "contained" : "outlined"
                }
                onClick={() => handleStoreTypeChange(type.value)}
                sx={{
                  backgroundColor:
                    selectedStoreType === type.value
                      ? theme.palette.mode === "dark"
                        ? "#40916c"
                        : "#34495e"
                      : "transparent",
                  color:
                    selectedStoreType === type.value
                      ? "white"
                      : theme.palette.mode === "dark"
                      ? "#40916c"
                      : "#34495e",
                  borderColor:
                    theme.palette.mode === "dark" ? "#40916c" : "#34495e",
                  "&:hover": {
                    backgroundColor:
                      selectedStoreType === type.value
                        ? theme.palette.mode === "dark"
                          ? "#40916c"
                          : "#34495e"
                        : "rgba(82, 183, 136, 0.1)",
                  },
                }}
              >
                {type.icon} {type.label}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Main Category Tabs */}
        {categories.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
              border: "1px solid #e9ecef",
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
                }}
              >
                <CategoryIcon
                  sx={{
                    color:
                      theme.palette.mode === "dark" ? "#40916c" : "#34495e",
                  }}
                />
                {t("Categories")}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {categories.map((category) => (
                  <Button
                    key={category._id}
                    variant={
                      selectedCategory?._id === category._id
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => handleCategoryChange(category)}
                    sx={{
                      backgroundColor:
                        selectedCategory?._id === category._id
                          ? theme.palette.mode === "dark"
                            ? "#40916c"
                            : "#34495e"
                          : "transparent",
                      color:
                        selectedCategory?._id === category._id
                          ? "white"
                          : theme.palette.mode === "dark"
                          ? "#40916c"
                          : "#34495e",
                      borderColor:
                        theme.palette.mode === "dark" ? "#40916c" : "#34495e",
                      "&:hover": {
                        backgroundColor:
                          selectedCategory?._id === category._id
                            ? theme.palette.mode === "dark"
                              ? "#40916c"
                              : "#34495e"
                            : "rgba(82, 183, 136, 0.1)",
                      },
                    }}
                  >
                    <Avatar
                      src={
                        category.image
                          ? `${process.env.REACT_APP_BACKEND_URL}${category.image}`
                          : undefined
                      }
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor:
                          selectedCategory?._id === category._id
                            ? "white"
                            : theme.palette.mode === "dark"
                            ? "#40916c"
                            : "#34495e",
                        color:
                          selectedCategory?._id === category._id
                            ? theme.palette.mode === "dark"
                              ? "#40916c"
                              : "#34495e"
                            : "white",
                        fontSize: "0.75rem",
                        mr: 1,
                      }}
                    >
                      {category.icon || category.name.charAt(0)}
                    </Avatar>
                    {category.name}
                  </Button>
                ))}
              </Box>
            </Box>
          </Paper>
        )}

        {/* Category Types Tabs */}
        {selectedCategory && categoryTypes.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
              border: "1px solid #e9ecef",
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: theme.palette.mode === "dark" ? "#40916c" : "#34495e",
                }}
              >
                <ExpandMoreIcon
                  sx={{
                    color:
                      theme.palette.mode === "dark" ? "#40916c" : "#34495e",
                  }}
                />
                {t("Types")} - {selectedCategory.name}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button
                  variant={
                    selectedCategoryType === null ? "contained" : "outlined"
                  }
                  onClick={() => setSelectedCategoryType(null)}
                  sx={{
                    backgroundColor:
                      selectedCategoryType === null
                        ? theme.palette.mode === "dark"
                          ? "#40916c"
                          : "#34495e"
                        : "transparent",
                    color:
                      selectedCategoryType === null
                        ? "white"
                        : theme.palette.mode === "dark"
                        ? "#40916c"
                        : "#34495e",
                    borderColor:
                      theme.palette.mode === "dark" ? "#40916c" : "#34495e",
                    "&:hover": {
                      backgroundColor:
                        selectedCategoryType === null
                          ? "#40916c"
                          : "rgba(82, 183, 136, 0.1)",
                    },
                  }}
                >
                  All Types
                </Button>
                {categoryTypes.map((type) => (
                  <Button
                    key={type._id}
                    variant={
                      selectedCategoryType?._id === type._id
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => setSelectedCategoryType(type)}
                    sx={{
                      backgroundColor:
                        selectedCategoryType?._id === type._id
                          ? theme.palette.mode === "dark"
                            ? "#40916c"
                            : "#34495e"
                          : "transparent",
                      color:
                        selectedCategoryType?._id === type._id
                          ? "white"
                          : theme.palette.mode === "dark"
                          ? "#40916c"
                          : "#34495e",
                      borderColor:
                        theme.palette.mode === "dark" ? "#40916c" : "#34495e",
                      "&:hover": {
                        backgroundColor:
                          selectedCategoryType?._id === type._id
                            ? theme.palette.mode === "dark"
                              ? "#40916c"
                              : "#34495e"
                            : "rgba(82, 183, 136, 0.1)",
                      },
                    }}
                  >
                    {type.name}
                  </Button>
                ))}
              </Box>
            </Box>
          </Paper>
        )}

        {selectedCategory && (
          <>
            {/* Products Grid - enforce 2 columns via CSS grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 2,
              }}
            >
              {filteredProducts.map((product) => (
                <Box key={product._id} sx={{ display: "flex" }}>
                  <Card
                    onClick={() => handleProductClick(product)}
                    sx={{
                      cursor: "pointer",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "scale(1.01)" },
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {product.image ? (
                      <CardMedia
                        component="img"
                        image={`${process.env.REACT_APP_BACKEND_URL}${product.image}`}
                        alt={product.name || "Product image"}
                        sx={{
                          height: 180,
                          objectFit: "contain",
                          backgroundColor: theme.palette.grey[100],
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 180,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: theme.palette.grey[100],
                        }}
                      >
                        <ShoppingCartIcon
                          sx={{ fontSize: 56, color: theme.palette.grey[400] }}
                        />
                      </Box>
                    )}
                    <CardContent
                      sx={{
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        flexGrow: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          textAlign: "center",
                          minHeight: "2.6em",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          color:
                            theme.palette.mode === "dark" ? "white" : "black",
                        }}
                      >
                        {product.name || "\u00A0"}
                      </Typography>

                      {/* {product.categoryTypeId && (
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <Chip
                            label={getCategoryTypeName(
                              product.categoryTypeId,
                              product.categoryId
                            )}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.75rem",
                              color: "#2d6a4f",
                              backgroundColor: "rgba(82,183,136,0.12)",
                            }}
                          />
                        </Box>
                      )} */}

                      {product.storeId?.name && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", textAlign: "center" }}
                        >
                          {product.storeId.name}
                        </Typography>
                      )}

                      <Box sx={{ mt: "auto" }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          {isDiscountValid(product) &&
                            product.previousPrice && (
                              <Typography
                                variant="body2"
                                sx={{
                                  textDecoration: "line-through",
                                  color: "text.secondary",
                                }}
                              >
                                {formatPrice(product.previousPrice)}
                              </Typography>
                            )}
                          {product.newPrice && (
                            <Typography
                              variant="body1"
                              sx={{ color: "#52b788", fontWeight: 700 }}
                            >
                              {formatPrice(product.newPrice)}
                            </Typography>
                          )}
                          {isDiscountValid(product) && (
                            <Chip
                              label={(() => {
                                const off = calculateDiscount(
                                  product.previousPrice,
                                  product.newPrice
                                );
                                return off === null ? t("Discount") : `${off}%`;
                              })()}
                              size="small"
                              sx={{
                                backgroundColor: "#e53e3e",
                                color: "white",
                                height: 20,
                                fontSize: "0.7rem",
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    </Box>
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
    <>
      {renderMobileLayout()}
      {renderDesktopLayout()}

      {/* Product Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedProduct?.name}
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {selectedProduct.image ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={`${process.env.REACT_APP_BACKEND_URL}${selectedProduct.image}`}
                    alt={selectedProduct.name}
                    sx={{ objectFit: "contain", borderRadius: 1 }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 400,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: theme.palette.grey[200],
                      borderRadius: 1,
                    }}
                  >
                    <ShoppingCartIcon
                      sx={{ fontSize: 80, color: theme.palette.grey[400] }}
                    />
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom>
                  {selectedProduct.name}
                </Typography>

                {selectedProduct.description && (
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {selectedProduct.description}
                  </Typography>
                )}

                {selectedProduct.brandId?.name && (
                  <Typography
                    variant="body1"
                    gutterBottom
                    sx={{ cursor: "pointer" }}
                    onClick={() => {
                      setDialogOpen(false);
                      navigate(`/brands/${selectedProduct.brandId._id}`);
                    }}
                  >
                    <strong>Brand:</strong> {selectedProduct.brandId.name}
                  </Typography>
                )}

                {selectedProduct.storeId?.name && (
                  <Typography
                    variant="body1"
                    gutterBottom
                    sx={{ cursor: "pointer" }}
                    onClick={() => {
                      setDialogOpen(false);
                      navigate(`/stores/${selectedProduct.storeId._id}`);
                    }}
                  >
                    <strong>{t("Store")}:</strong>{" "}
                    {selectedProduct.storeId.name}
                  </Typography>
                )}

                {isDiscountValid(selectedProduct) && (
                  <Box sx={{ mt: 2 }}>
                    {selectedProduct.previousPrice ? (
                      <Typography
                        variant="h6"
                        sx={{
                          textDecoration: "line-through",
                          color: "text.secondary",
                        }}
                      >
                        {formatPrice(selectedProduct.previousPrice)}
                      </Typography>
                    ) : (
                      ""
                    )}
                    <Typography
                      variant="h4"
                      sx={{ color: "#52b788", fontWeight: 600 }}
                    >
                      {formatPrice(selectedProduct.newPrice)}
                    </Typography>
                    <Chip
                      label={(() => {
                        const off = calculateDiscount(
                          selectedProduct.previousPrice,
                          selectedProduct.newPrice
                        );
                        return off === null ? t("Discount") : `${off}%`;
                      })()}
                      size="large"
                      sx={{
                        backgroundColor: "#52b788",
                        color: "white",
                        fontSize: "1rem",
                        mt: 1,
                      }}
                    />
                  </Box>
                )}

                {!isDiscountValid(selectedProduct) &&
                  selectedProduct.newPrice && (
                    <Typography
                      variant="h4"
                      sx={{ color: "#52b788", fontWeight: 600, mt: 2 }}
                    >
                      {formatPrice(selectedProduct.newPrice)}
                    </Typography>
                  )}

                <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                  <IconButton
                    onClick={(e) => handleLikeClick(selectedProduct._id, e)}
                    disabled={likeLoading[selectedProduct._id]}
                    sx={{
                      border: "2px solid #52b788",
                      color: likeStates[selectedProduct._id]
                        ? "#52b788"
                        : "inherit",
                    }}
                  >
                    {likeStates[selectedProduct._id] ? (
                      <FavoriteIcon />
                    ) : (
                      <FavoriteBorderIcon />
                    )}
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Login Notification Dialog */}
      <Dialog
        open={loginNotificationOpen}
        onClose={() => setLoginNotificationOpen(false)}
      >
        <DialogTitle>Login Required</DialogTitle>
        <DialogContent>
          <Typography>Please log in to like products.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginNotificationOpen(false)}>Close</Button>
          <Button onClick={() => navigate("/login")} variant="contained">
            Login
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductCategory;
