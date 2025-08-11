import React, { useState, useEffect, useMemo } from "react";
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
} from "@mui/material";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { Link, useNavigate } from "react-router-dom";
import { storeAPI, productAPI, categoryAPI, adAPI } from "../services/api";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BusinessIcon from "@mui/icons-material/Business";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CategoryIcon from "@mui/icons-material/Category";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import VisibilityIcon from "@mui/icons-material/Visibility";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Loader from "../components/Loader";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useUserTracking } from "../hooks/useUserTracking";
import banner1 from "./assests/1.png";
import banner2 from "./assests/2.png";
import banner3 from "./assests/3.png";
import banner4 from "./assests/4.png";
import banner5 from "./assests/5.png";
import banner7 from "./assests/7.png";
import banner6 from "./assests/6.png";
const MainPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productsByStore, setProductsByStore] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState(null);
  const [selectedStoreType, setSelectedStoreType] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [showOnlyDiscount, setShowOnlyDiscount] = useState(true); // Default to showing only discounted products
  const [allCategories, setAllCategories] = useState([]);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  // Notification dialog state
  const [loginNotificationOpen, setLoginNotificationOpen] = useState(false);

  // Filter toggle state for mobile
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Scroll to top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Stores pagination state
  const [displayedStores, setDisplayedStores] = useState([]);
  const [storesPage, setStoresPage] = useState(1);
  const [storesPerPage] = useState(8);
  const [hasMoreStores, setHasMoreStores] = useState(true);

  // User tracking hook
  const { toggleLike, recordView, isProductLiked, isAuthenticated } =
    useUserTracking();

  // State for tracking like counts locally
  const [likeCounts, setLikeCounts] = useState({});
  const [likeStates, setLikeStates] = useState({}); // Track like state per product
  const [likeLoading, setLikeLoading] = useState({}); // Track loading state per product

  // Handle like button click
  const handleLikeClick = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setLoginNotificationOpen(true);
      return;
    }

    if (likeLoading[productId]) {
      return;
    }

    const currentLikeCount = likeCounts[productId] || 0;
    const isCurrentlyLiked = likeStates[productId] || isProductLiked(productId);

    setLikeLoading((prev) => ({ ...prev, [productId]: true }));

    try {
      if (isCurrentlyLiked) {
        setLikeCounts((prev) => ({
          ...prev,
          [productId]: Math.max(0, currentLikeCount - 1),
        }));
        setLikeStates((prev) => ({
          ...prev,
          [productId]: false,
        }));
      } else {
        setLikeCounts((prev) => ({
          ...prev,
          [productId]: currentLikeCount + 1,
        }));
        setLikeStates((prev) => ({
          ...prev,
          [productId]: true,
        }));
      }

      const result = await toggleLike(productId);

      if (!result.success) {
        setLikeCounts((prev) => ({
          ...prev,
          [productId]: currentLikeCount,
        }));
        setLikeStates((prev) => ({
          ...prev,
          [productId]: isCurrentlyLiked,
        }));
        alert(result.message || "Failed to update like");
      }
    } catch (error) {
      setLikeCounts((prev) => ({
        ...prev,
        [productId]: currentLikeCount,
      }));
      setLikeStates((prev) => ({
        ...prev,
        [productId]: isCurrentlyLiked,
      }));
      alert("Failed to update like");
    } finally {
      setLikeLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const fallbackBannerImages = [
    banner1,
    banner2,
    banner3,
    banner4,
    banner5,
    banner6,
    banner7,
  ];

  const [bannerAds, setBannerAds] = useState([]);

  const bannerAdsWithImages = useMemo(
    () =>
      (bannerAds || [])
        .filter((a) => !!a.image)
        .map((a) => ({
          _id: a._id,
          src: a.image.startsWith("http")
            ? a.image
            : `${process.env.REACT_APP_BACKEND_URL}${a.image}`,
          brandId: a.brandId,
          storeId: a.storeId,
          giftId: a.giftId,
        })),
    [bannerAds]
  );

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

  // Handle scroll to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Update like states when user data changes
  useEffect(() => {
    if (isAuthenticated && allProducts.length > 0) {
      const updatedLikeStates = {};
      allProducts.forEach((product) => {
        updatedLikeStates[product._id] = isProductLiked(product._id);
      });
      setLikeStates(updatedLikeStates);
    }
  }, [isAuthenticated, allProducts, isProductLiked]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch stores, categories, and all products in parallel
      const [
        storesResponse,
        categoriesResponse,
        productsResponse,
        adsResponse,
      ] = await Promise.all([
        storeAPI.getAll(),
        categoryAPI.getAll(),
        productAPI.getAll(),
        adAPI.getAll({ page: "home" }),
      ]);

      const storesData = storesResponse.data;
      const categoriesData = categoriesResponse.data;
      const productsData = productsResponse.data;
      const adsData = adsResponse.data || [];

      setStores(storesData);
      setAllCategories(categoriesData);
      setAllProducts(productsData);

      // Group products by store and initialize like counts/states
      const productsMap = {};
      const initialLikeCounts = {};
      const initialLikeStates = {};
      productsData.forEach((product) => {
        if (!productsMap[product.storeId]) {
          productsMap[product.storeId] = [];
        }
        productsMap[product.storeId].push(product);
        initialLikeCounts[product._id] = product.likeCount || 0;
        initialLikeStates[product._id] = false;
      });

      setProductsByStore(productsMap);
      setLikeCounts(initialLikeCounts);
      setLikeStates(initialLikeStates);
      setBannerAds(adsData);
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

  // Memoized list of categories based on the selected store type
  const filteredCategories = useMemo(() => {
    if (selectedStoreType === "all") {
      return allCategories;
    }
    return allCategories.filter(
      (category) => category.storeType === selectedStoreType
    );
  }, [allCategories, selectedStoreType]);

  // Memoized list of category types based on the selected category
  const categoryTypes = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }
    return selectedCategory.types || [];
  }, [selectedCategory]);

  const handleStoreTypeChange = (storeType) => {
    setSelectedStoreType(storeType);
    setSelectedCategory(null);
    setSelectedCategoryType(null);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedCategoryType(null);
  };

  const handleCategoryTypeChange = (categoryType) => {
    setSelectedCategoryType(categoryType);
  };

  const clearAllFilters = () => {
    setSearch("");
    setSelectedCategory(null);
    setSelectedCategoryType(null);
    setSelectedStoreType("all");
    setPriceRange([0, 1000000]);
    setShowOnlyDiscount(true);
    setStoresPage(1);
  };

  // Helper to safely get ID from string or object
  const getID = (id) => {
    if (typeof id === "string") return id;
    if (id && typeof id === "object") {
      return id.$oid || String(id._id) || String(id);
    }
    return id;
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

  // 1. Memoize the filtered products list
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Filter by Store Type
      if (
        selectedStoreType !== "all" &&
        product.storeType !== selectedStoreType
      ) {
        return false;
      }

      // Filter by Category
      if (
        selectedCategory &&
        getID(product.categoryId) !== getID(selectedCategory._id)
      ) {
        return false;
      }

      // Filter by Category Type
      if (
        selectedCategoryType &&
        getID(product.categoryTypeId) !== getID(selectedCategoryType._id)
      ) {
        return false;
      }

      // Filter by Price
      if (
        product.newPrice < priceRange[0] ||
        product.newPrice > priceRange[1]
      ) {
        return false;
      }

      // Filter by Discount
      const hasPriceDiscount =
        product.previousPrice &&
        product.newPrice &&
        product.previousPrice > product.newPrice;

      // For discount filter, only show products that are discounted AND not expired
      if (showOnlyDiscount) {
        const isDiscounted = product.isDiscount || hasPriceDiscount;
        if (!isDiscounted || !isDiscountValid(product)) {
          return false;
        }
      }

      // Filter by Search (product name)
      if (
        search &&
        !product.name?.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [
    allProducts,
    selectedStoreType,
    selectedCategory,
    selectedCategoryType,
    search,
    priceRange,
    showOnlyDiscount,
  ]);

  // 2. Memoize the final list of stores to display
  const finalFilteredStores = useMemo(() => {
    // Get unique store IDs from the already filtered products
    const storeIdsWithFilteredProducts = [
      ...new Set(filteredProducts.map((p) => getID(p.storeId))),
    ];

    // Filter the stores themselves
    return stores.filter((store) => {
      const storeID = getID(store._id);

      // Store must have products that passed the filters
      const hasMatchingProducts =
        storeIdsWithFilteredProducts.includes(storeID);

      // Or the store name itself matches the search
      const storeNameMatch =
        search && store.name?.toLowerCase().includes(search.toLowerCase());

      // And the store must match the type filter
      const storeTypeMatch =
        selectedStoreType === "all" || store.storeType === selectedStoreType;

      return (hasMatchingProducts || storeNameMatch) && storeTypeMatch;
    });
  }, [filteredProducts, stores, search, selectedStoreType]);

  // Effect for pagination
  useEffect(() => {
    setStoresPage(1); // Reset to first page on filter change
    const initialDisplayed = finalFilteredStores.slice(0, storesPerPage);
    setDisplayedStores(initialDisplayed);
    setHasMoreStores(finalFilteredStores.length > storesPerPage);
  }, [finalFilteredStores, storesPerPage]);

  const loadMoreStores = () => {
    const nextPage = storesPage + 1;
    const newStores = finalFilteredStores.slice(0, nextPage * storesPerPage);
    setDisplayedStores(newStores);
    setStoresPage(nextPage);
    setHasMoreStores(newStores.length < finalFilteredStores.length);
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

  if (loading) return <Loader message={t("Loading...")} />;
  if (error) return <Loader message={error} />;

  return (
    <Box sx={{ px: { xs: 0.5, sm: 1.5, md: 3 } }}>
      {/* Sticky Banner and Filters Container - Mobile Only */}
      <Box
        sx={{
          position: { xs: "sticky", md: "static" },
          top: { xs: 20, md: "auto" },
          zIndex: { xs: 1000, md: "auto" },
          backgroundColor: {
            xs: theme.palette.mode === "dark" ? "#121212" : "#ffffff",
            md: "transparent",
          },
          pt: { xs: 1, md: 0 },
          pb: { xs: 0.2, md: 0 },
        }}
      >
        {/* Banner Slider Section */}
        <Box sx={{ mb: 1, mt: 5 }}>
          <Box
            sx={{
              width: "100%",
              height: { xs: "100px", sm: "150px", md: "250px" },
              borderRadius: { xs: 2, md: 3 },
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              mb: 3,
              mt: { xs: 2, md: 10 },
            }}
          >
            <Slider {...bannerSettings}>
              {(bannerAdsWithImages.length > 0
                ? bannerAdsWithImages
                : fallbackBannerImages.map((src) => ({ src }))
              ).map((ad, index) => (
                <div key={ad._id || index}>
                  <img
                    onClick={() =>
                      ad.brandId
                        ? navigate(`/brands/${ad.brandId}`)
                        : ad.storeId
                        ? navigate(`/stores/${ad.storeId}`)
                        : ad.giftId
                        ? navigate(`/gifts/${ad.giftId}`)
                        : null
                    }
                    src={ad.src || ad}
                    alt={`Banner ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      cursor: ad.brandId ? "pointer" : "default",
                    }}
                  />
                </div>
              ))}
            </Slider>
          </Box>
        </Box>
      </Box>
      {/* Enhanced Filters Section */}
      <Box
        sx={{
          backgroundColor:
            theme.palette.mode === "dark" ? "#40916c" : "#34495e",
          borderRadius: { xs: 2, md: 3 },
          p: { xs: 2, md: 3 },
          mb: 0,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          display: "block",
          position: "relative",
        }}
      >
        {/* Top Left Icon Buttons - Mobile Only */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            display: { xs: "flex", md: "none" },
            gap: 1,
            zIndex: 10,
          }}
          mb={1}
        >
          {/* Mobile Filter clean Button */}
          <IconButton
            onClick={clearAllFilters}
            sx={{
              color: "white",
              backgroundColor: "rgba(255,255,255,0.1)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.2)",
              },
              width: 32,
              height: 32,
            }}
          >
            <CategoryIcon sx={{ fontSize: "18px" }} />
          </IconButton>

          {/* Mobile Filter Toggle Button */}
          <IconButton
            onClick={() => setFiltersOpen(!filtersOpen)}
            sx={{
              color: "white",
              backgroundColor: "rgba(255,255,255,0.1)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.2)",
              },
              width: 32,
              height: 32,
            }}
          >
            <SearchIcon sx={{ fontSize: "18px" }} />
          </IconButton>
        </Box>

        {/* Filter Content */}
        <Box>
          {/* Search and Basic Filters */}
          <Box
            sx={{
              mt: 3,
              display: { xs: filtersOpen ? "block" : "none", md: "block" },
            }}
          >
            <Box
              sx={{
                mb: 1,
                display: "flex",
                gap: { xs: 1, md: 2 },
                alignItems: "center",
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <TextField
                variant="outlined"
                placeholder={t("Search for products or stores...")}
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
                      color:
                        theme.palette.mode === "dark" ? "black" : "grey.500",
                    },
                  },
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{
                          color:
                            theme.palette.mode === "dark"
                              ? "#2c3e50"
                              : "grey.500",
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
                    height: { xs: "35px", sm: "50px", md: "50px" },
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
                        color:
                          theme.palette.mode === "dark" ? "black" : "grey.500",
                      },
                    },
                  }}
                />

                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    color: "white",
                  }}
                >
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
                    width: { xs: "45%", sm: 80, md: 120 },
                    height: { xs: "35px", sm: "50px", md: "50px" },
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
                        color:
                          theme.palette.mode === "dark" ? "black" : "grey.500",
                      },
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>
          {/* Store Type Filter */}
          <Box sx={{ mb: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: "white",
                mb: 0.5,
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              {t("Store Type")}
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: { xs: 0.5, sm: 1 },
                flexWrap: "nowrap",
                alignItems: "center",
                overflowX: "auto",
                overflowY: "hidden",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                pb: 0,
                minHeight: "20px",
              }}
            >
              {[
                // { key: "all", label: t("All Stores"), icon: "🏪" },
                { key: "market", label: t("Market"), icon: "🛒" },
                { key: "clothes", label: t("Clothes"), icon: "👕" },
                { key: "electronic", label: t("Electronic"), icon: "📱" },
                { key: "cosmetic", label: t("Cosmetic"), icon: "💄" },
              ].map((type) => (
                <Button
                  key={type.key}
                  variant={
                    selectedStoreType === type.key ? "contained" : "outlined"
                  }
                  onClick={() => handleStoreTypeChange(type.key)}
                  sx={{
                    backgroundColor:
                      selectedStoreType === type.key
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
                        selectedStoreType === type.key
                          ? theme.palette.mode === "dark"
                            ? "#34495e"
                            : "#40916c"
                          : "rgba(255,255,255,0.1)",
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                  }}
                >
                  <span style={{ marginRight: "4px" }}>{type.icon}</span>
                  {type.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Categories Filter */}
          <Box sx={{ mb: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: "white",
                mb: 0.5,
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              {t("Categories")}
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: { xs: 0.5, sm: 1 },
                alignItems: "center",
                justifyContent: { xs: "flex-start", md: "flex-start" },
                overflowX: "auto",
                overflowY: "hidden",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                pb: 1,
                minHeight: "50px",
              }}
            >
              {/* Browse All Categories */}
              <Button
                variant={selectedCategory === null ? "contained" : "outlined"}
                onClick={() => handleCategoryChange(null)}
                sx={{
                  backgroundColor:
                    selectedCategory === null
                      ? theme.palette.mode === "dark"
                        ? "#40916c"
                        : "#34495e"
                      : "transparent",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 2,
                  px: { xs: 1.5, md: 2 },
                  py: 0.5,
                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                  textTransform: "none",
                  minHeight: "32px",
                  flexShrink: 0,
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
                {t("all")}
              </Button>

              {/* Category Filter Buttons */}
              {filteredCategories.map((category) => (
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
                    flexShrink: 0,
                    whiteSpace: "nowrap",
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
            </Box>
          </Box>

          {/* Category Types Filter */}
          {selectedCategory && (
            <Box sx={{ mb: 0 }}>
              {/* <Typography
              variant="subtitle2"
              sx={{
                color: "white",
                mb: 1.5,
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              {t("Category Types")} - {selectedCategory.name}
            </Typography> */}
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 0.5, sm: 1 },
                  alignItems: "center",
                  justifyContent: { xs: "flex-start", md: "flex-start" },
                  overflowX: "auto",
                  overflowY: "hidden",
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                  pb: 0,
                  minHeight: "20px",
                }}
              >
                {/* All Category Types */}
                <Button
                  variant={
                    selectedCategoryType === null ? "contained" : "outlined"
                  }
                  onClick={() => handleCategoryTypeChange(null)}
                  sx={{
                    backgroundColor:
                      selectedCategoryType === null
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
                    flexShrink: 0,
                    "&:hover": {
                      backgroundColor:
                        selectedCategoryType === null
                          ? theme.palette.mode === "dark"
                            ? "#34495e"
                            : "#40916c"
                          : "rgba(255,255,255,0.1)",
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                  }}
                  startIcon={<CategoryIcon sx={{ fontSize: "16px" }} />}
                >
                  {t("All Category Types")}
                </Button>

                {/* Category Type Filter Buttons */}
                {categoryTypes.map((categoryType, index) => (
                  <Button
                    key={index}
                    variant={
                      selectedCategoryType?.name === categoryType.name
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => handleCategoryTypeChange(categoryType)}
                    sx={{
                      backgroundColor:
                        selectedCategoryType?.name === categoryType.name
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
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                      "&:hover": {
                        backgroundColor:
                          selectedCategoryType?.name === categoryType.name
                            ? theme.palette.mode === "dark"
                              ? "#34495e"
                              : "#40916c"
                            : "rgba(255,255,255,0.1)",
                        borderColor: "rgba(255,255,255,0.5)",
                      },
                    }}
                  >
                    {t(categoryType.name)}
                  </Button>
                ))}
              </Box>
            </Box>
          )}

          {/* Clear Filters Button - Desktop Only */}
          <Box
            sx={{
              mt: 2,
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
            }}
          >
            <Button
              variant="outlined"
              onClick={clearAllFilters}
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.5)",
                borderRadius: 2,
                px: 3,
                py: 0.5,
                fontSize: "0.875rem",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderColor: "white",
                },
              }}
            >
              {t("Clear All Filters")}
            </Button>
          </Box>
        </Box>
      </Box>

      {displayedStores.map((store) => {
        // 3. Get the products for this card from the master filtered list
        const productsForCard = filteredProducts
          .filter((p) => getID(p.storeId) === getID(store._id))
          .slice(0, 12);

        const totalDiscountedInStore = productsForCard.filter(
          (p) =>
            p.isDiscount ||
            (p.previousPrice && p.newPrice && p.previousPrice > p.newPrice)
        ).length;

        return (
          <Card
            component={Link}
            to={`/stores/${store._id}`}
            key={store._id}
            style={{ textDecoration: "none" }}
            sx={{
              mb: { xs: 3, sm: 2 },
              mt: { xs: 1.5, sm: 0 },
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
            {/* Store Header with Gradient Overlay */}
            <Box
              sx={{
                background:
                  theme.palette.mode === "dark" ? "#40916c" : "#34495e",
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
                {store.logo ? (
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
                      image={`${process.env.REACT_APP_BACKEND_URL}${store.logo}`}
                      alt={store.name}
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
                      {store.name}
                    </Typography>
                    {store.isVip && (
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
                    {store.address}
                  </Typography>
                  <Chip
                    label={`${totalDiscountedInStore} ${t(
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
              </Box>
            </Box>

            {/* Products Grid */}
            <Box
              sx={{
                p: { xs: 0.7, md: 3 },
                width: { xs: "100%", md: "100%" },
                height: { xs: "250px", md: "100%" },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  overflowX: "auto",
                  gap: { xs: 0.5, md: 3 },
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
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#40916c" : "#34495e",
                    borderRadius: 4,
                    "&:hover": {
                      backgroundColor: "#45a049",
                    },
                  },
                }}
              >
                {productsForCard.map((product) => {
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
                          height: { xs: "120px", sm: "180px" },
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
                              height: { xs: "100px", sm: "150px", md: "200px" },
                              transition: "transform 0.3s ease",
                              "&:hover": { transform: "scale(1.05)" },
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              height: { xs: "100px", sm: "150px", md: "200px" },
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
                        <IconButton
                          onClick={(e) => handleLikeClick(product._id, e)}
                          disabled={likeLoading[product._id]}
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: "0.7rem",
                            bgcolor: "white",
                            color:
                              likeStates[product._id] ||
                              isProductLiked(product._id)
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
                          {likeStates[product._id] ||
                          isProductLiked(product._id) ? (
                            <FavoriteIcon sx={{ fontSize: "1.2rem" }} />
                          ) : (
                            <FavoriteBorderIcon sx={{ fontSize: "1.2rem" }} />
                          )}
                        </IconButton>
                        {/* View Count Badge - Top Right */}
                        {/* {product.viewCount > 0 && (
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
                        )} */}
                      </Box>

                      {/* Product Content */}
                      <CardContent
                        sx={{
                          p: { xs: 0, md: 2 },
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
                            mb: 0,
                            lineHeight: 1,
                            minHeight: "2em",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {product.name}
                        </Typography>

                        {/* Pricing Section */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            mb: 0,
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

                        {/* Bottom Section with Discount Badge and Like Button */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                            mt: { xs: "1px", sm: "auto", md: "auto" },
                          }}
                        >
                          {/* Discount Badge - Bottom Left */}
                          {(discount > 0 || product.isDiscount) && (
                            <Chip
                              label={
                                discount > 0 ? `-${discount}%` : t("Discount")
                              }
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
                            {/* <Typography
                              variant="caption"
                              sx={{
                                color: "#666",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                              }}
                            >
                              {likeCounts[product._id] ||
                                product.likeCount ||
                                0}
                            </Typography> */}
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
                              mt: 0,
                              fontWeight: 400,
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
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          </Card>
        );
      })}

      {/* Load More Stores Button */}
      {hasMoreStores && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
            mb: 2,
          }}
        >
          <Button
            onClick={loadMoreStores}
            variant="outlined"
            size="large"
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: 600,
              textTransform: "none",
              borderWidth: 2,
              "&:hover": {
                borderWidth: 2,
                transform: "translateY(-2px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              },
              transition: "all 0.3s ease",
            }}
          >
            {t("Load More")}
          </Button>
        </Box>
      )}

      {finalFilteredStores.length === 0 && !loading && (
        <Alert
          severity="info"
          sx={{
            borderRadius: 2,
            backgroundColor:
              theme.palette.mode === "dark" ? "#52b788" : "#e3f2fd",
            border: `1px solid ${
              theme.palette.mode === "dark" ? "#40916c" : "#bbdefb"
            }`,
          }}
        >
          {t("No stores match the current filters.")}
        </Alert>
      )}

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

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Fab
          color="primary"
          aria-label="scroll to top"
          onClick={scrollToTop}
          sx={{
            position: "fixed",
            bottom: { xs: 80, sm: 16 }, // Higher on mobile to avoid bottom navigation
            right: { xs: 16, sm: 16 },
            zIndex: 1000,
            backgroundColor:
              theme.palette.mode === "dark" ? "#40916c" : "#34495e",
            color: "white",
            width: { xs: 48, sm: 56 }, // Slightly smaller on mobile
            height: { xs: 48, sm: 56 },
            "&:hover": {
              backgroundColor:
                theme.palette.mode === "dark" ? "#52b788" : "#2c3e50",
              transform: "translateY(-2px)",
            },
            transition: "all 0.3s ease",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <KeyboardArrowUpIcon sx={{ fontSize: { xs: "20px", sm: "24px" } }} />
        </Fab>
      )}
    </Box>
  );
};

export default MainPage;
