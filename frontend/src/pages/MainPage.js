import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  Alert,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  Select,
} from "@mui/material";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { Link } from "react-router-dom";
import { marketAPI, productAPI, categoryAPI } from "../services/api";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BusinessIcon from "@mui/icons-material/Business";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CategoryIcon from "@mui/icons-material/Category";
import SearchIcon from "@mui/icons-material/Search";
import Loader from "../components/Loader";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import banner1 from "./assests/1.png";
import banner2 from "./assests/2.png";
import banner3 from "./assests/3.png";
import banner4 from "./assests/4.png";
import banner5 from "./assests/5.png";
import banner7 from "./assests/7.png";
import banner6 from "./assests/6.png";
const MainPage = () => {
  const theme = useTheme();
  const [markets, setMarkets] = useState([]);
  const [productsByMarket, setProductsByMarket] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [showOnlyDiscount, setShowOnlyDiscount] = useState(true); // Default to showing only discounted products
  const [categories, setCategories] = useState([]);

  const bannerImages = [
    banner1,
    banner2,
    banner3,
    banner4,
    banner5,
    banner6,
    banner7,
  ];

  const bannerSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          dots: true,
          arrows: false,
        },
      },
      {
        breakpoint: 600,
        settings: {
          dots: true,
          arrows: false,
          autoplaySpeed: 4000,
        },
      },
    ],
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch categories for filter dropdown
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
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

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch markets
      const marketsResponse = await marketAPI.getAll();
      const marketsData = marketsResponse.data;
      setMarkets(marketsData);

      // Fetch products for each market (prioritize discounted products)
      const productsMap = {};
      for (const market of marketsData) {
        const productsResponse = await productAPI.getByMarket(market._id);
        const allProducts = productsResponse.data;

        // Sort products: discounted first, then by name
        const sortedProducts = allProducts.sort((a, b) => {
          // First priority: discounted products
          if (a.isDiscount && !b.isDiscount) return -1;
          if (!a.isDiscount && b.isDiscount) return 1;
          // Second priority: alphabetical by name
          return (a.name || "").localeCompare(b.name || "");
        });

        // Take first 12 products (prioritizing discounted ones)
        const products = sortedProducts.slice(0, 12);
        productsMap[market._id] = products;
      }
      setProductsByMarket(productsMap);
    } catch (err) {
      setError(
        err.response
          ? "Server error. Please try again later."
          : "Network error. Please check your connection."
      );
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (typeof price !== "number") return `${t("ID")} 0`;
    return ` ${price.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} ${t("ID")}`;
  };

  const calculateDiscount = (previousPrice, newPrice) => {
    if (!previousPrice || !newPrice) return 0;
    return Math.round(((previousPrice - newPrice) / previousPrice) * 100);
  };

  const filteredMarkets = markets.filter((market) => {
    // If market name matches search or any of its products match search/filters
    const marketNameMatch = market.name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const filteredProducts = (productsByMarket[market._id] || []).filter(
      (product) => {
        const nameMatch = product.name
          ?.toLowerCase()
          .includes(search.toLowerCase());
        const categoryMatch =
          !selectedCategory || product.categoryId === selectedCategory._id;
        const priceMatch =
          typeof product.newPrice === "number" &&
          product.newPrice >= priceRange[0] &&
          product.newPrice <= priceRange[1];
        // Auto-detect discount based on price difference
        const hasPriceDiscount =
          product.previousPrice &&
          product.newPrice &&
          product.previousPrice > product.newPrice;
        const discountMatch =
          !showOnlyDiscount ||
          product.isDiscount === true ||
          product.isDiscount === "true" ||
          hasPriceDiscount === true;

        return (
          (nameMatch || marketNameMatch) &&
          categoryMatch &&
          priceMatch &&
          discountMatch
        );
      }
    );

    return filteredProducts.length > 0;
  });

  if (loading) return <Loader message={t("Loading...")} />;
  if (error) return <Loader message={error} />;

  return (
    <Box sx={{ px: { xs: 0.5, sm: 1.5, md: 3 } }}>
      {/* Banner Slider Section */}
      <Box sx={{ mb: 4, mt: 10 }}>
        <Box
          sx={{
            width: "100%",
            height: { xs: "200px", sm: "250px", md: "300px" },
            borderRadius: { xs: 2, md: 3 },
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            mb: 3,
          }}
        >
          <Slider {...bannerSettings}>
            {bannerImages.map((src, index) => (
              <div key={index}>
                <img
                  src={src}
                  alt={`Banner ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            ))}
          </Slider>
        </Box>
      </Box>

      {/* Title and Stats Section */}
      <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
        <StorefrontIcon
          sx={{
            fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
            color: theme.palette.mode === "dark" ? "contained" : "#40916c",
            mb: 1,
          }}
        />

        <Typography
          variant="subtitle1"
          sx={{
            fontSize: { xs: "1.5rem", sm: "2rem", md: "3rem" },
            color: theme.palette.mode === "dark" ? "contained" : "#40916c",
            mb: 3,
            textAlign: "center",
            px: { xs: 1, sm: 2 },
          }}
          gutterBottom
        >
          {showOnlyDiscount
            ? t("Discover Discount Products from Various Markets")
            : t("Discover All Products from Various Markets")}
        </Typography>
      </Box>

      {/* Filters Section */}
      <Box
        sx={{
          backgroundColor: "#2c3e50",
          borderRadius: { xs: 2, md: 3 },
          p: { xs: 2, md: 3 },
          mb: 4,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        {/* Search Bar */}
        <Box
          sx={{
            mb: 2,
            display: "flex",
            gap: { xs: 1, md: 2 },
            alignItems: "center",
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <TextField
            variant="outlined"
            placeholder={t("Search for discount products...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              flex: 1,
              width: { xs: "100%", sm: "auto" },
              maxWidth: { xs: "100%", sm: 400 },

              backgroundColor: "white",
              borderRadius: 1,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "transparent",
                },
                "&:hover fieldset": {
                  borderColor: "transparent",
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
            size="small"
            InputProps={{
              inputProps: {
                style: {
                  color: theme.palette.mode === "dark" ? "black" : "grey.500",
                },
              },

              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      color:
                        theme.palette.mode === "dark" ? "#2c3e50" : "grey.500",
                    }}
                  />
                </InputAdornment>
              ),
            }}
          />

          {/* Price Range Filters */}
          <Box
            sx={{
              display: "flex",
              gap: { xs: 0.5, sm: 1 },
              alignItems: "center",
              flexWrap: { xs: "wrap", sm: "nowrap" },
            }}
          >
            <TextField
              type="number"
              placeholder={t("Min Price")}
              value={priceRange[0] || ""}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                setPriceRange([val, priceRange[1]]);
              }}
              sx={{
                width: { xs: "45%", sm: 80, md: 120 },
                backgroundColor: "white",
                borderRadius: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "transparent" },
                  "&:hover fieldset": { borderColor: "transparent" },
                  "&.Mui-focused fieldset": {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
              size="small"
              InputProps={{
                inputProps: {
                  style: {
                    color: theme.palette.mode === "dark" ? "black" : "grey.500",
                  },
                },
              }}
            />

            <Typography
              sx={{
                fontSize: "0.875rem",
                color: theme.palette.mode === "dark" ? "white" : "grey.500",
              }}
            >
              -
            </Typography>

            <TextField
              type="number"
              placeholder={t("Max Price")}
              color={theme.palette.mode === "dark" ? "#2c3e50" : "grey.500"}
              value={priceRange[1] === 1000000 ? "" : priceRange[1]}
              onChange={(e) => {
                const val = Number(e.target.value) || 1000000;
                setPriceRange([priceRange[0], val]);
              }}
              sx={{
                color: theme.palette.mode === "dark" ? "#2c3e50" : "grey.500",

                width: { xs: "45%", sm: 80, md: 120 },
                backgroundColor: "white",
                borderRadius: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "transparent" },
                  "&:hover fieldset": { borderColor: "transparent" },
                  "&.Mui-focused fieldset": {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
              size="small"
              InputProps={{
                inputProps: {
                  style: {
                    color: theme.palette.mode === "dark" ? "black" : "grey.500",
                  },
                },
              }}
            />
          </Box>
        </Box>

        {/* Category Buttons */}
        <Box
          sx={{
            display: "flex",
            gap: { xs: 0.5, sm: 1 },
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: { xs: "center", md: "flex-start" },
          }}
        >
          {/* Browse All Categories */}
          <Button
            variant={selectedCategory === null ? "contained" : "outlined"}
            onClick={() => setSelectedCategory(null)}
            sx={{
              backgroundColor:
                selectedCategory === null
                  ? theme.palette.mode === "dark"
                    ? "#34495e"
                    : "#40916c"
                  : "transparent",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 2,
              px: { xs: 1.5, md: 2 },
              py: 0.5,
              fontSize: { xs: "0.75rem", md: "0.875rem" },
              textTransform: "none",
              minHeight: "32px",
              "&:hover": {
                backgroundColor:
                  selectedCategory === null
                    ? theme.palette.mode === "dark"
                      ? "#34495e"
                      : "#40916c"
                    : "rgba(255,255,255,0.1)",
                borderColor: "rgba(255,255,255,0.5)",
              },
            }}
            startIcon={<CategoryIcon sx={{ fontSize: "16px" }} />}
          >
            {t("All Categories")}
          </Button>

          {/* Hot Deals Button */}
          <Button
            variant="outlined"
            sx={{
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 2,
              px: { xs: 1.5, md: 2 },
              py: 0.5,
              fontSize: { xs: "0.75rem", md: "0.875rem" },
              textTransform: "none",
              minHeight: "32px",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "rgba(255,255,255,0.5)",
              },
            }}
            startIcon={<LocalOfferIcon sx={{ fontSize: "16px" }} />}
          >
            🔥 {t("Hot Deals")}
          </Button>

          {/* Category Filter Buttons */}
          {categories.slice(0, 6).map((category) => (
            <Button
              key={category._id}
              variant={
                selectedCategory?._id === category._id
                  ? "contained"
                  : "outlined"
              }
              onClick={() => setSelectedCategory(category)}
              sx={{
                backgroundColor:
                  selectedCategory?._id === category._id
                    ? theme.palette.mode === "dark"
                      ? "#34495e"
                      : "#40916c"
                    : "transparent",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 2,
                px: { xs: 1.5, md: 2 },
                py: 0.5,
                fontSize: { xs: "0.75rem", md: "0.875rem" },
                textTransform: "none",
                minHeight: "32px",
                "&:hover": {
                  backgroundColor:
                    selectedCategory?._id === category._id
                      ? theme.palette.mode === "dark"
                        ? "#34495e"
                        : "#40916c"
                      : "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.5)",
                },
              }}
            >
              {t(category.name)}
            </Button>
          ))}

          {/* More Categories Dropdown for remaining categories */}
          {categories.length > 6 && (
            <FormControl size="small">
              <Select
                displayEmpty
                value={selectedCategory?._id || ""}
                onChange={(e) =>
                  setSelectedCategory(
                    categories.find((cat) => cat._id === e.target.value) || null
                  )
                }
                sx={{
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 2,
                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                  minHeight: "32px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                  "& .MuiSelect-icon": {
                    color: "white",
                  },
                }}
                renderValue={(selected) =>
                  selected
                    ? t(
                        categories.find((cat) => cat._id === selected)?.name ||
                          "More Categories"
                      )
                    : t("More Categories")
                }
              >
                {categories.slice(6).map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {t(category.name)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Discount Toggle Button */}
          {/* <Button
            variant={showOnlyDiscount ? "contained" : "outlined"}
            onClick={() => setShowOnlyDiscount(!showOnlyDiscount)}
            sx={{
              backgroundColor: showOnlyDiscount
                ? theme.palette.mode === "dark"
                  ? "#34495e"
                  : "#40916c"
                : "transparent",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 2,
              px: { xs: 1.5, md: 2 },
              py: 0.5,
              fontSize: { xs: "0.75rem", md: "0.875rem" },
              textTransform: "none",
              minHeight: "32px",
              "&:hover": {
                backgroundColor: showOnlyDiscount
                  ? theme.palette.mode === "dark"
                    ? "#34495e"
                    : "#40916c"
                  : "rgba(255,255,255,0.1)",
                borderColor: "rgba(255,255,255,0.5)",
              },
            }}
            startIcon={<LocalOfferIcon sx={{ fontSize: "16px" }} />}
          >
            {showOnlyDiscount ? t("Discount Only") : t("All Products")}
          </Button> */}

          {/* Reset Filters Button */}
          <Button
            variant="outlined"
            onClick={() => {
              setSearch("");
              setSelectedCategory(null);
              setPriceRange([0, 1000000]);
              setShowOnlyDiscount(true); // Reset to discount only
            }}
            sx={{
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 2,
              px: { xs: 1.5, md: 2 },
              py: 0.5,
              fontSize: { xs: "0.75rem", md: "0.875rem" },
              textTransform: "none",
              minHeight: "32px",
              ml: { xs: 0, md: "auto" },
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "rgba(255,255,255,0.5)",
              },
            }}
          >
            {t("Reset Filters")}
          </Button>
        </Box>
      </Box>

      {filteredMarkets.map((market) => {
        // Filter products for this market based on the same logic as in filteredMarkets
        const filteredProducts = (productsByMarket[market._id] || []).filter(
          (product) => {
            const nameMatch = product.name
              ?.toLowerCase()
              .includes(search.toLowerCase());
            const marketNameMatch = market.name
              ?.toLowerCase()
              .includes(search.toLowerCase());
            const categoryMatch =
              !selectedCategory || product.categoryId === selectedCategory._id;
            const priceMatch =
              typeof product.newPrice === "number" &&
              product.newPrice >= priceRange[0] &&
              product.newPrice <= priceRange[1];
            // Auto-detect discount based on price difference
            const hasPriceDiscount =
              product.previousPrice &&
              product.newPrice &&
              product.previousPrice > product.newPrice;
            const discountMatch =
              !showOnlyDiscount ||
              product.isDiscount === true ||
              product.isDiscount === "true" ||
              hasPriceDiscount === true;
            return (
              (nameMatch || marketNameMatch) &&
              categoryMatch &&
              priceMatch &&
              discountMatch
            );
          }
        );
        return (
          <Card
            component={Link}
            to={`/markets/${market._id}`}
            key={market._id}
            style={{ textDecoration: "none" }}
            sx={{
              mb: 4,
              borderRadius: { xs: 2, md: 3 },
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
                  ? "0 8px 32px rgba(0,0,0,0.3)"
                  : "0 8px 32px rgba(0,0,0,0.1)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 16px 64px rgba(0,0,0,0.4)"
                    : "0 16px 64px rgba(0,0,0,0.15)",
              },
            }}
          >
            {/* Market Header with Gradient Overlay */}
            <Box
              sx={{
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #52b788 0%, #40916c 100%)"
                    : "linear-gradient(135deg, #52b788 0%, #40916c 100%)",
                p: { xs: 2, md: 3, lg: 1 },
                color: "white",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>\') repeat',
                  opacity: 0.1,
                },
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                position="relative"
                zIndex={1}
                sx={{
                  flexDirection: "row",
                  gap: { xs: 2, sm: 3 },
                }}
              >
                {market.logo ? (
                  <Box
                    sx={{
                      width: { xs: 60, sm: 80, md: 150 },
                      height: { xs: 60, sm: 80, md: 150 },
                      borderRadius: 2,
                      overflow: "hidden",
                      border: "3px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.1)",
                      backdropFilter: "blur(10px)",
                      flexShrink: 0,
                    }}
                  >
                    <CardMedia
                      component="img"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      image={`${process.env.REACT_APP_BACKEND_URL}${market.logo}`}
                      alt={market.name}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: { xs: 60, sm: 80 },
                      height: { xs: 60, sm: 80 },
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255,255,255,0.1)",
                      backdropFilter: "blur(10px)",
                      border: "3px solid rgba(255,255,255,0.2)",
                      flexShrink: 0,
                    }}
                  >
                    <BusinessIcon
                      sx={{
                        fontSize: { xs: 30, sm: 40 },
                        color: "rgba(255,255,255,0.8)",
                      }}
                    />
                  </Box>
                )}

                <Box flexGrow={1} sx={{ textAlign: "left" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        textDecoration: "none",
                        color: "white",
                        fontWeight: 700,
                        fontSize: { xs: "1.1rem", sm: "1.5rem", md: "2rem" },
                        textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          textShadow: "0 4px 8px rgba(0,0,0,0.4)",
                          transform: "translateX(4px)",
                        },
                      }}
                    >
                      {market.name}
                    </Typography>
                    {market.isVip && (
                      <Box
                        alt={t("sponsor")}
                        sx={{
                          position: "absolute",
                          top: { xs: 2, md: 2 },
                          left: { xs: -2, md: -2 },
                          zIndex: { xs: 2, md: 2 },
                          backgroundColor: "white",
                          borderRadius: "50%",
                          width: { xs: 20, sm: 40 },
                          height: { xs: 20, sm: 40 },
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          "&::before": {
                            content: '"👑"',
                            fontSize: { xs: "16px", sm: "25px" },
                          },
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      width: { xs: "250px", md: "800px" },
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: "rgba(255,255,255,0.9)",
                      mt: 0.5,
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      fontSize: { xs: "0.7rem", sm: "0.875rem", md: "1rem" },
                      textAlign: "left",
                    }}
                  >
                    {market.address}
                  </Typography>
                  <Chip
                    label={`${filteredProducts.length} ${t(
                      "Discounted Products"
                    )}`}
                    sx={{
                      mt: 1,
                      backgroundColor: "rgba(255,255,255,0.2)",
                      color: "white",
                      fontWeight: 600,
                      backdropFilter: "blur(10px)",
                      fontSize: { xs: "0.65rem", sm: "0.8rem" },
                      height: { xs: "22px", sm: "28px" },
                    }}
                  />
                </Box>

                {/* <Button
                  variant="contained"
                  component={Link}
                  to={`/markets/${market._id}`}
                  startIcon={<ShoppingCartIcon />}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "white",
                    backdropFilter: "blur(10px)",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderRadius: 2,
                    px: { xs: 2, md: 3 },
                    py: 1,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: { xs: "0.8rem", sm: "0.875rem", md: "1rem" },
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.3)",
                      transform: "scale(1.05)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  {t("View Profile")}
                </Button> */}
              </Box>
            </Box>

            {/* Products Grid */}
            <Box
              sx={{ p: { xs: 2, md: 3 }, width: { xs: "100%", md: "100%" } }}
            >
              <Box
                sx={{
                  display: "flex",
                  overflowX: "auto",
                  gap: { xs: 2, md: 3 },
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
                {filteredProducts.map((product) => {
                  const discount = calculateDiscount(
                    product.previousPrice,
                    product.newPrice
                  );
                  return (
                    <Card
                      key={product._id}
                      component={Link}
                      to={`/products/${product._id}`}
                      sx={{
                        height: { xs: "300px", sm: "350px" },
                        width: { xs: "140px", sm: "200px", md: "250px" },
                        maxWidth: { xs: "140px", sm: "200px", md: "250px" },
                        minWidth: { xs: "140px", sm: "200px", md: "250px" },
                        textDecoration: "none",
                        borderRadius: 2,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        flexShrink: 0,
                        background:
                          theme.palette.mode === "dark"
                            ? "linear-gradient(135deg, #34495e 0%, #2c3e50 100%)"
                            : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                        border: `1px solid ${
                          theme.palette.mode === "dark" ? "#4a5568" : "#e2e8f0"
                        }`,
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          transform: "translateY(-8px) scale(1.02)",
                          boxShadow:
                            theme.palette.mode === "dark"
                              ? "0 20px 40px rgba(0,0,0,0.4)"
                              : "0 20px 40px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      {/* Product Image */}
                      <Box
                        sx={{
                          position: "relative",
                          overflow: "hidden",
                          height: { xs: "100px", sm: "180px" },
                          flexShrink: 0,
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
                              "&:hover": { transform: "scale(1.1)" },
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
                                  theme.palette.mode === "dark"
                                    ? "#718096"
                                    : "#a0aec0",
                              }}
                            />
                          </Box>
                        )}

                        {/* Discount Badge */}
                        {(discount > 0 || product.isDiscount) && (
                          <Chip
                            label={
                              discount > 0 ? `-${discount}%` : t("Discount")
                            }
                            sx={{
                              position: "absolute",
                              top: 12,
                              right: 12,
                              backgroundColor: "#e53e3e",
                              color: "white",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              boxShadow: "0 4px 12px rgba(229, 62, 62, 0.4)",
                            }}
                          />
                        )}
                      </Box>

                      {/* Product Content */}
                      <CardContent
                        sx={{
                          p: { xs: 1, md: 2 },
                          flex: 1, // Fill remaining space
                          display: "flex",
                          flexDirection: "column",
                          minHeight: { xs: "100px", sm: "120px" }, // Minimum height for consistent content area
                        }}
                      >
                        <Typography
                          variant="h5"
                          align="center"
                          sx={{
                            color:
                              theme.palette.mode === "dark"
                                ? "#ffffff"
                                : "#000000",
                            height: { xs: "35px", sm: "45px" },
                            fontStyle: "bold",
                            fontWeight: 1000,
                            fontSize: {
                              xs: "0.75rem",
                              sm: "1rem",
                              md: "0.8rem",
                            },
                            textAlign: "center",
                            mb: 1,
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {product.name}
                        </Typography>
                        {/* Category Type Badge */}
                        <Chip
                          label={getCategoryTypeName(
                            product.categoryTypeId,
                            product.categoryId?._id || product.categoryId
                          )}
                          sx={{
                            width: "fit-content",
                            marginBottom: 1,
                            backgroundColor: "rgba(82, 183, 136, 0.9)",
                            color: "white",
                            fontSize: { xs: "0.6rem", sm: "0.75rem" },
                            fontWeight: 600,
                            backdropFilter: "blur(10px)",
                            height: { xs: "20px", sm: "24px" },
                          }}
                        />
                        {/* Weight Badge */}
                        {/* {product.weight && (
                          <Chip
                            label={product.weight}
                            sx={{
                              width: "fit-content",
                              marginBottom: 1,
                              backgroundColor: "rgba(108, 117, 125, 0.9)",
                              color: "white",
                              fontSize: "0.7rem",
                              fontWeight: 500,
                              backdropFilter: "blur(10px)",
                            }}
                          />
                        )} */}
                        <Box display="flex" flexDirection="column">
                          <Box
                            display="contents"
                            flexDirection="column"
                            alignItems="center"
                          >
                            {product.previousPrice &&
                              product.previousPrice > product.newPrice && (
                                <Typography
                                  variant="h6"
                                  sx={{
                                    textDecoration: "line-through",
                                    color: "red",
                                    fontSize: { xs: "0.8rem", sm: "1rem" },
                                  }}
                                >
                                  {formatPrice(product.previousPrice)}
                                </Typography>
                              )}
                            <Typography
                              variant="h6"
                              align="center"
                              sx={{
                                color: "#52b788",
                                fontWeight: 700,
                                fontSize: { xs: "1.2rem", sm: "1.5rem" },
                              }}
                            >
                              {formatPrice(product.newPrice)}
                            </Typography>
                          </Box>
                        </Box>
                        <Box
                          display="flex"
                          borderTop="1px solid rgb(159, 196, 245)"
                          flexDirection="column"
                        >
                          <Box
                            display="contents"
                            flexDirection="column"
                            alignItems="center"
                          >
                            <Typography
                              variant="h6"
                              align="center"
                              paddingTop={1}
                              sx={{
                                color:
                                  theme.palette.mode === "dark"
                                    ? "white"
                                    : "red",
                                fontWeight: 500,
                                fontSize: {
                                  xs: ".7rem",
                                  sm: "1rem",
                                  md: "0.7rem",
                                },
                              }}
                            >
                              {t("Expire Date")}:{" "}
                              {new Date(product.expireDate).toLocaleDateString(
                                "ar-SY",
                                {
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                                }
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          </Card>
        );
      })}

      {markets.length === 0 && (
        <Alert
          severity="info"
          sx={{
            borderRadius: 2,
            backgroundColor:
              theme.palette.mode === "dark" ? "#2c3e50" : "#e3f2fd",
            border: `1px solid ${
              theme.palette.mode === "dark" ? "#34495e" : "#bbdefb"
            }`,
          }}
        >
          No markets found. Add some markets through the admin panel.
        </Alert>
      )}
    </Box>
  );
};

export default MainPage;
