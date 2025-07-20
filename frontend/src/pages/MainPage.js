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
import { marketAPI, productAPI } from "../services/api";
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
  const [type, setType] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [allTypes, setAllTypes] = useState([]);

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
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Collect all product types for filter dropdown
  useEffect(() => {
    const types = new Set();
    Object.values(productsByMarket).forEach((products) => {
      products?.forEach((p) => {
        if (p.type) types.add(p.type);
      });
    });
    setAllTypes(Array.from(types));
  }, [productsByMarket]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch markets
      const marketsResponse = await marketAPI.getAll();
      const marketsData = marketsResponse.data;
      setMarkets(marketsData);

      // Fetch products for each market (limit to 10 per market)
      const productsMap = {};
      for (const market of marketsData) {
        const productsResponse = await productAPI.getByMarket(market._id);
        productsMap[market._id] = productsResponse.data.slice(0, 12); // Limit to 12 products
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

  // Filtering logic
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
        const typeMatch = !type || product.type === type;
        const priceMatch =
          typeof product.newPrice === "number" &&
          product.newPrice >= priceRange[0] &&
          product.newPrice <= priceRange[1];
        return (nameMatch || marketNameMatch) && typeMatch && priceMatch;
      }
    );
    return filteredProducts.length > 0;
  });

  if (loading) return <Loader message="Loading ..." />;
  if (error) return <Loader message={error} />;

  return (
    <Box>
      {/* Banner Slider Section */}
      <Box sx={{ mb: 4, mt: 10 }}>
        <Box
          sx={{
            width: "100%",
            height: "300px",
            borderRadius: 3,
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
                    height: "400px",
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
            fontSize: "3rem",
            color: theme.palette.mode === "dark" ? "contained" : "#40916c",
            mb: 1,
          }}
        />

        <Typography
          variant="subtitle1"
          sx={{
            fontSize: "3rem",
            color: theme.palette.mode === "dark" ? "contained" : "#40916c",
            mb: 3,
            textAlign: "center",
          }}
          gutterBottom
        >
          {t("Discover products from various markets")}
        </Typography>
      </Box>

      {/* Filters Section */}
      <Box
        sx={{
          backgroundColor:
            theme.palette.mode === "dark" ? "#2c3e50" : "#52b788",
          borderRadius: 3,
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
            placeholder={t("Search for items...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              flex: 1,
              width: { xs: "100%", sm: "auto" },
              maxWidth: 400,
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
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "grey.500" }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Price Range Filters */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
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
                width: { xs: 80, md: 120 },
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
            />

            <Typography sx={{ color: "white", fontSize: "0.875rem" }}>
              -
            </Typography>

            <TextField
              type="number"
              placeholder={t("Max Price")}
              value={priceRange[1] === 1000000 ? "" : priceRange[1]}
              onChange={(e) => {
                const val = Number(e.target.value) || 1000000;
                setPriceRange([priceRange[0], val]);
              }}
              sx={{
                width: { xs: 80, md: 120 },
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
            />
          </Box>
        </Box>

        {/* Category Buttons */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: { xs: "center", md: "flex-start" },
          }}
        >
          {/* Browse All Categories */}
          <Button
            variant={type === "" ? "contained" : "outlined"}
            onClick={() => setType("")}
            sx={{
              backgroundColor:
                type === ""
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
                  theme.palette.mode === "dark" ? "#34495e" : "#40916c",
                borderColor: "rgba(255,255,255,0.5)",
              },
            }}
            startIcon={<CategoryIcon sx={{ fontSize: "16px" }} />}
          >
            {t("Browse All Categories")}
          </Button>

          {/* Latest Button */}
          <Button
            variant="outlined"
            onClick={() => setType("LatesDiscount")}
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
          >
            {t("Latest")}
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
          {allTypes.slice(0, 6).map((categoryType) => (
            <Button
              key={categoryType}
              variant={type === categoryType ? "contained" : "outlined"}
              onClick={() => setType(categoryType)}
              sx={{
                backgroundColor:
                  type === categoryType
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
                    type === categoryType
                      ? theme.palette.mode === "dark"
                        ? "#34495e"
                        : "#40916c"
                      : "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.5)",
                },
              }}
            >
              {t(categoryType)}
            </Button>
          ))}

          {/* More Categories Dropdown for remaining categories */}
          {allTypes.length > 6 && (
            <FormControl size="small">
              <Select
                displayEmpty
                value={allTypes.slice(6).includes(type) ? type : ""}
                onChange={(e) => setType(e.target.value)}
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
                  selected ? t(selected) : t("More Categories")
                }
              >
                {allTypes.slice(6).map((categoryType) => (
                  <MenuItem key={categoryType} value={categoryType}>
                    {t(categoryType)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Reset Filters Button */}
          <Button
            variant="outlined"
            onClick={() => {
              setSearch("");
              setType("");
              setPriceRange([0, 1000000]);
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
            const typeMatch = !type || product.type === type;
            const priceMatch =
              typeof product.newPrice === "number" &&
              product.newPrice >= priceRange[0] &&
              product.newPrice <= priceRange[1];
            return (nameMatch || marketNameMatch) && typeMatch && priceMatch;
          }
        );
        return (
          <Card
            key={market._id}
            sx={{
              mb: 4,
              borderRadius: 3,
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
                p: 3,
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
              >
                {market.logo ? (
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      overflow: "hidden",
                      border: "3px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.1)",
                      backdropFilter: "blur(10px)",
                      mr: 3,
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
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255,255,255,0.1)",
                      backdropFilter: "blur(10px)",
                      border: "3px solid rgba(255,255,255,0.2)",
                      mr: 3,
                    }}
                  >
                    <BusinessIcon
                      sx={{ fontSize: 40, color: "rgba(255,255,255,0.8)" }}
                    />
                  </Box>
                )}

                <Box flexGrow={1}>
                  <Typography
                    variant="h4"
                    component={Link}
                    to={`/markets/${market._id}`}
                    sx={{
                      textDecoration: "none",
                      color: "white",
                      fontWeight: 700,
                      fontSize: { xs: "1.5rem", md: "2rem" },
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
                  <Typography
                    variant="body1"
                    sx={{
                      width: "800px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: "rgba(255,255,255,0.9)",
                      mt: 0.5,
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
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
                    }}
                  />
                </Box>

                <Button
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
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    textTransform: "none",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.3)",
                      transform: "scale(1.05)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  {t("View Profile")}
                </Button>
              </Box>
            </Box>

            {/* Products Grid */}
            <Box sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  justifyContent: "flex-start",
                }}
              >
                {filteredProducts.slice(0, 8).map((product) => {
                  const discount = calculateDiscount(
                    product.previousPrice,
                    product.newPrice
                  );
                  return (
                    <Card
                      component={Link}
                      to={`/products/${product._id}`}
                      sx={{
                        height: "350px", // Fixed height - no exceptions
                        width: "250px", // Fixed width - no exceptions
                        maxWidth: "250px", // Force exact width
                        minWidth: "250px", // Force exact width
                        textDecoration: "none",
                        borderRadius: 2,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
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
                          height: "180px",
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
                        {discount > 0 && (
                          <Chip
                            label={`-${discount}%`}
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
                          p: 2,
                          flex: 1, // Fill remaining space
                          display: "flex",
                          flexDirection: "column",
                          minHeight: "120px", // Minimum height for consistent content area
                        }}
                      >
                        <Typography
                          variant="h6"
                          align="center"
                          sx={{
                            fontWeight: 600,
                            fontSize: "1rem",
                            color: theme.palette.text.primary,
                            mb: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {product.name}
                        </Typography>
                        {/* Product Type Badge */}
                        <Chip
                          label={t(product.type)}
                          sx={{
                            width: "fit-content",
                            marginBottom: 1,
                            backgroundColor: "rgba(82, 183, 136, 0.9)",
                            color: "white",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            backdropFilter: "blur(10px)",
                          }}
                        />
                        <Box sx={{ mt: "auto" }}>
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
                  );
                })}

                {/* More Products Card */}
                {filteredProducts.length > 8 && (
                  <Card
                    component={Link}
                    to={`/markets/${market._id}`}
                    sx={{
                      height: "350px", // Fixed height - no exceptions
                      width: "280px", // Fixed width - no exceptions
                      maxWidth: "280px", // Force exact width
                      minWidth: "280px", // Force exact width
                      textDecoration: "none",
                      borderRadius: 2,
                      border: `2px dashed ${
                        theme.palette.mode === "dark" ? "#4a5568" : "#cbd5e0"
                      }`,
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(52, 73, 94, 0.3)"
                          : "rgba(247, 250, 252, 0.8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        borderColor: "#52b788",
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(82, 183, 136, 0.1)"
                            : "rgba(82, 183, 136, 0.05)",
                        transform: "scale(1.02)",
                      },
                    }}
                  >
                    <Box textAlign="center">
                      <ShoppingCartIcon
                        sx={{
                          fontSize: 48,
                          color: "#52b788",
                          mb: 2,
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#52b788",
                          fontWeight: 600,
                          mb: 1,
                        }}
                      >
                        +{filteredProducts.length - 8} {t("More Products")}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                        }}
                      >
                        {t("View all products")}
                      </Typography>
                    </Box>
                  </Card>
                )}
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
