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
} from "@mui/material";
import { Link } from "react-router-dom";
import { productAPI } from "../services/api";
import CategoryIcon from "@mui/icons-material/Category";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BusinessIcon from "@mui/icons-material/Business";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useLocation } from "react-router-dom";

const ProductCategory = () => {
  const theme = useTheme();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { t } = useTranslation();

  // Filter states
  const [filters, setFilters] = useState({
    name: "",
    company: "",
    market: "",
    barcode: "",
    discount: false,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filters]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getCategories();
      const allCategories = response.data;
      setCategories(allCategories);

      if (allCategories.length > 0) {
        const incomingCategory = location.state?.category;
        const categoryToSelect =
          incomingCategory && allCategories.includes(incomingCategory)
            ? incomingCategory
            : allCategories[0];
        setSelectedCategory(categoryToSelect);
        await fetchProductsByCategory(categoryToSelect);
      }
    } catch (err) {
      setError("Failed to load categories. Please try again.");
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsByCategory = async (category) => {
    try {
      const response = await productAPI.getByCategory(category);
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products by category:", err);
    }
  };

  const handleCategoryChange = async (event, newValue) => {
    setSelectedCategory(newValue);
    await fetchProductsByCategory(newValue);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  // Apply filters to products
  const applyFilters = () => {
    let filtered = [...products];

    // Filter by name
    if (filters.name) {
      filtered = filtered.filter((product) =>
        product.name?.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    // Filter by company
    if (filters.company) {
      filtered = filtered.filter((product) =>
        product.companyId?.name
          ?.toLowerCase()
          .includes(filters.company.toLowerCase())
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

  // Get unique companies for filter dropdown
  const getCompanies = () => {
    const companies = products
      .map((product) => product.companyId?.name)
      .filter((name) => name)
      .map((name) => name);
    return [...new Set(companies)].sort();
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

  // Render filter section
  const renderFilters = () => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 4,
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
      <Typography
        variant="h6"
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: theme.palette.text.primary,
        }}
      >
        <FilterListIcon sx={{ color: "#52b788" }} />
        {t("Filters")}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label={t("Search By Name")}
            value={filters.name}
            onChange={(e) => handleFilterChange("name", e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl sx={{ width: "200px" }} fullWidth>
            <InputLabel>{t("Company")}</InputLabel>
            <Select
              value={filters.company}
              onChange={(e) => handleFilterChange("company", e.target.value)}
              label={t("Company")}
            >
              <MenuItem value="" sx={{ width: "250px" }}>
                {t("All Companies")}
              </MenuItem>
              {getCompanies().map((company) => (
                <MenuItem key={company} value={company}>
                  {company}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl sx={{ width: "200px" }} fullWidth>
            <InputLabel>{t("Market")}</InputLabel>
            <Select
              value={filters.market}
              onChange={(e) => handleFilterChange("market", e.target.value)}
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
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label={t("Search By Barcode")}
            value={filters.barcode}
            onChange={(e) => handleFilterChange("barcode", e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.discount}
                onChange={(e) =>
                  handleFilterChange("discount", e.target.checked)
                }
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
        <Grid item xs={12} sm={6} md={2}>
          <Button
            variant="outlined"
            onClick={() =>
              setFilters({
                name: "",
                company: "",
                market: "",
                barcode: "",
                discount: false,
              })
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
            {t("Clear Filters")}
          </Button>
        </Grid>
      </Grid>
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
    <Box sx={{ py: 8 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <CategoryIcon
          sx={{
            fontSize: 40,
            mr: 2,
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
            }}
          >
            {t("Product Categories")}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: theme.palette.mode === "dark" ? "contained" : "#primary",
            }}
            gutterBottom
          >
            {t("Browse products by category")}
          </Typography>
        </Box>
      </Box>

      {categories.length > 0 && (
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={selectedCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              p: 0.5,
              minHeight: 48,
            }}
            TabIndicatorProps={{
              style: {
                background: theme.palette.primary.main,
                height: 4,
                borderRadius: 2,
              },
            }}
          >
            {categories.map((category) => (
              <Tab
                key={category}
                label={category}
                value={category}
                icon={
                  <CategoryIcon sx={{ color: theme.palette.text.primary }} />
                }
                iconPosition="start"
                sx={{
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  mx: 0.5,
                  minHeight: 40,
                  "&.Mui-selected": {
                    color:
                      theme.palette.mode === "dark"
                        ? theme.palette.primary.contrastText
                        : theme.palette.primary.main,
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? theme.palette.primary.main
                        : theme.palette.action.selected,
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>
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
                px: 2,
                py: 0.5,
                borderRadius: 2,
                display: "inline-block",
              }}
            >
              {selectedCategory} ({filteredProducts.length})
            </Typography>
          </Box>

          {/* Filter Section */}
          {renderFilters()}
        </>
      )}

      <Grid container alignItems="center" spacing={3}>
        {filteredProducts.map((product) => (
          <Grid display="flex" key={product._id}>
            <Card
              sx={{
                width: "250px",
                height: "100%",
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
                  sx={{ objectFit: "contain" }}
                />
              ) : (
                <Box
                  sx={{
                    height: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.palette.grey[200],
                  }}
                >
                  <ShoppingCartIcon
                    sx={{ fontSize: 60, color: theme.palette.grey[400] }}
                  />
                </Box>
              )}
              <CardContent>
                <Typography
                  variant="h6"
                  component="div"
                  gutterBottom
                  sx={{ minHeight: 28 }}
                >
                  {product.name || "\u00A0"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary, minHeight: 20 }}
                  gutterBottom
                >
                  {product.type || "\u00A0"}
                </Typography>
                {product.companyId ? (
                  <Box display="flex" alignItems="center" mb={1}>
                    <BusinessIcon
                      sx={{
                        fontSize: 16,
                        mr: 1,
                        color: theme.palette.text.secondary,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {t("Company")}: {product.companyId.name}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ height: 24, mb: 1 }} />
                )}
                {product.marketId ? (
                  <Box display="flex" alignItems="center" mb={1}>
                    <StorefrontIcon
                      sx={{
                        fontSize: 16,
                        mr: 1,
                        color: theme.palette.text.secondary,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {t("Market")}: {product.marketId.name}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ height: 24, mb: 1 }} />
                )}

                {/* Weight and Discount Info */}
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  {product.weight && (
                    <Chip
                      label={product.weight}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  )}
                  {product.isDiscount && (
                    <Chip
                      label={t("Discount")}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  )}
                </Box>
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
                        color="text.secondary"
                        sx={{ textDecoration: "line-through", minHeight: 20 }}
                      >
                        {formatPrice(product.previousPrice)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ minHeight: 20 }}>
                        {"\u00A0"}
                      </Typography>
                    )}
                    <Typography
                      variant="h6"
                      sx={{
                        color:
                          theme.palette.mode === "dark"
                            ? theme.palette.success.main
                            : theme.palette.primary.main,
                        fontWeight: 700,
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
                    />
                  ) : null}
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleProductClick(product)}
                  sx={{ mt: 2 }}
                >
                  {t("View details")}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
          No products found in the {selectedCategory} category.
        </Alert>
      )}

      {categories.length === 0 && (
        <Alert severity="info">
          No categories found. Add some products through the admin panel.
        </Alert>
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
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
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
                    {t("Category")}: {selectedProduct.type}
                  </Typography>
                </Box>
                {selectedProduct.companyId && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t("Company")}: {selectedProduct.companyId.name}
                    </Typography>
                  </Box>
                )}
                {selectedProduct.expireDate && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocalOfferIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t("Expires")}:{" "}
                      {new Date(
                        selectedProduct.expireDate
                      ).toLocaleDateString()}
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
    </Box>
  );
};

export default ProductCategory;
