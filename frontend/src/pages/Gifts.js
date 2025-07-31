import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  useTheme,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  CardgHeader,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { Search, FilterList, Store, Business } from "@mui/icons-material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CardGiftcard from "@mui/icons-material/CardGiftcard";
import { giftAPI, storeAPI, brandAPI } from "../services/api";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const Gifts = () => {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [gifts, setGifts] = useState([]);
  const [filteredGifts, setFilteredGifts] = useState([]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [stores, setStores] = useState([]);
  const [brands, setBrands] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    store: "",
    brand: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [gifts, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [giftsResponse, storesResponse, brandsResponse] = await Promise.all(
        [giftAPI.getAll(), storeAPI.getAll(), brandAPI.getAll()]
      );

      console.log("Gifts response:", giftsResponse);
      console.log("Stores response:", storesResponse);
      console.log("Brands response:", brandsResponse);

      // Handle the API response structure: { success: true, data: gifts }
      const giftsData = Array.isArray(giftsResponse.data?.data)
        ? giftsResponse.data.data
        : [];
      const storesData = Array.isArray(storesResponse.data)
        ? storesResponse.data
        : [];
      const brandsData = Array.isArray(brandsResponse.data)
        ? brandsResponse.data
        : [];

      setGifts(giftsData);
      setStores(storesData);
      setBrands(brandsData);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          err.message ||
          "Network error. Please check your connection."
      );
      console.error("Error fetching gifts data:", err);
      // Set empty arrays on error to prevent "not iterable" errors
      setGifts([]);
      setStores([]);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Ensure gifts is always an array
    if (!Array.isArray(gifts)) {
      setFilteredGifts([]);
      return;
    }

    let filtered = [...gifts];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter((gift) =>
        gift.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Store filter
    if (filters.store) {
      filtered = filtered.filter(
        (gift) =>
          gift.storeId &&
          Array.isArray(gift.storeId) &&
          gift.storeId.some((store) => store._id === filters.store)
      );
    }

    // Brand filter
    if (filters.brand) {
      filtered = filtered.filter((gift) => gift.brandId?._id === filters.brand);
    }

    setFilteredGifts(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getRemainingDays = (expireDate) => {
    if (!expireDate) return null;
    const today = new Date();
    const expire = new Date(expireDate);
    const timeDiff = expire.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff > 0 ? daysDiff : 0;
  };

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
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              sx={{ width: "300px" }}
              label={t("Search Gifts")}
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
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
          <Grid item xs={12} sm={6} md={4}>
            <FormControl sx={{ width: "140px" }} fullWidth>
              <InputLabel>{t("Store")}</InputLabel>
              <Select
                value={filters.store}
                onChange={(e) => handleFilterChange("store", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                label={t("Store")}
              >
                <MenuItem value="">{t("All Stores")}</MenuItem>
                {stores.map((store) => (
                  <MenuItem key={store._id} value={store._id}>
                    {store.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl sx={{ width: "140px" }} fullWidth>
              <InputLabel>{t("Brand")}</InputLabel>
              <Select
                value={filters.brand}
                onChange={(e) => handleFilterChange("brand", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                label={t("Brand")}
              >
                <MenuItem value="">{t("All Brands")}</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand._id} value={brand._id}>
                    {brand.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );

  const renderGiftCard = (gift) => {
    // Safety check to ensure gift is a valid object
    if (!gift || typeof gift !== "object") {
      return null;
    }

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
          cursor: "pointer",
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

          {/* Store and Brand Info */}
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            {gift.storeId && gift.storeId.length > 0 && (
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
                    {t("Stores")}:
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.5,
                  }}
                >
                  {gift.storeId.map((store, index) => (
                    <Typography
                      key={store._id}
                      variant="body2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/stores/${store._id}?tab=gifts`);
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
                      {store.name}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

            {gift.brandId && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1,
                  cursor: "pointer",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/brands/${gift.brandId._id}?tab=gifts`);
                }}
              >
                <Business
                  sx={{ fontSize: 16, mr: 1, color: "#52b788", flexShrink: 0 }}
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
              <Box sx={{ height: 24 }} /> // Placeholder to maintain consistent height
            )}
          </Box>
        </CardContent>
      </Card>
    );
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

  const allGifts = Array.isArray(filteredGifts) ? filteredGifts : [];
  const storeGifts = Array.isArray(filteredGifts)
    ? filteredGifts.filter(
        (gift) =>
          gift.storeId && Array.isArray(gift.storeId) && gift.storeId.length > 0
      )
    : [];
  const brandGifts = Array.isArray(filteredGifts)
    ? filteredGifts.filter((gift) => gift.brandId)
    : [];

  return (
    <Box sx={{ py: 8, px: { xs: 0.5, sm: 1.5, md: 3 } }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <CardGiftcard
          sx={{
            fontSize: { xs: 32, sm: 36, md: 40 },
            mr: { xs: 1, sm: 2 },
            color: "#52b788",
          }}
        />
        <Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              color: theme.palette.mode === "dark" ? "#52b788" : "#40916c",
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
            }}
          >
            {t("Gifts")}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            {t("Discover amazing gifts from stores and brands")}
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
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
            "& .MuiTab-root": {
              textTransform: "none",
              width: { xs: "125px", sm: "100px", md: "100%" },
              fontSize: { xs: "0.875rem", sm: "1rem" },
            },
          }}
        >
          <Tab
            sx={{ width: { xs: "100px", sm: "100px", md: "100%" } }}
            label={`${t("All Gifts")} (${allGifts.length})`}
            icon={<CardGiftcard />}
            iconPosition="start"
          />
          <Tab
            label={`${t("Store Gifts")} (${storeGifts.length})`}
            icon={<Store />}
            iconPosition="start"
          />
          <Tab
            label={`${t("Brand Gifts")} (${brandGifts.length})`}
            icon={<Business />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Content */}
      <Box>
        {activeTab === 0 && (
          <Box>
            {allGifts.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  color: theme.palette.text.secondary,
                }}
              >
                <CardGiftcard sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  {t("No gifts available")}
                </Typography>
                <Typography variant="body1">
                  {t("No gifts match your current filters.")}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "12fr" },
                  gap: 3,
                  width: "100%",
                }}
              >
                {allGifts.map((gift) => (
                  <Box key={gift._id} sx={{ display: "flex" }}>
                    {renderGiftCard(gift)}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {storeGifts.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  color: theme.palette.text.secondary,
                }}
              >
                <Store sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  {t("No store gifts available")}
                </Typography>
                <Typography variant="body1">
                  {t("No store gifts match your current filters.")}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: " 1fr" },
                  gap: 3,
                  width: "100%",
                }}
              >
                {storeGifts.map((gift) => (
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
            {brandGifts.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  color: theme.palette.text.secondary,
                }}
              >
                <Business sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  {t("No brand gifts available")}
                </Typography>
                <Typography variant="body1">
                  {t("No brand gifts match your current filters.")}
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
                {brandGifts.map((gift) => (
                  <Box key={gift._id} sx={{ display: "flex" }}>
                    {renderGiftCard(gift)}
                  </Box>
                ))}
              </Box>
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
                      {new Date(selectedGift.expireDate).toLocaleDateString()}
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
    </Box>
  );
};

export default Gifts;
