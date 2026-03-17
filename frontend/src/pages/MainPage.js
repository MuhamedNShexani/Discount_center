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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Grid,
  Paper,
  Divider,
  Rating,
  Tabs,
  Tab,
} from "@mui/material";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { Link, useNavigate } from "react-router-dom";
import {
  storeAPI,
  productAPI,
  categoryAPI,
  adAPI,
  storeTypeAPI,
  brandAPI,
} from "../services/api";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BusinessIcon from "@mui/icons-material/Business";
import CategoryIcon from "@mui/icons-material/Category";
import SearchIcon from "@mui/icons-material/Search";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import DescriptionIcon from "@mui/icons-material/Description";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StarIcon from "@mui/icons-material/Star";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonAddDisabledIcon from "@mui/icons-material/PersonAddDisabled";
import Loader from "../components/Loader";
import BrandShowcase from "../components/BrandShowcase"; // Import BrandShowcase
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useUserTracking } from "../hooks/useUserTracking";
import { useCityFilter } from "../context/CityFilterContext";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

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
  const [storeTypes, setStoreTypes] = useState([]);
  const [selectedStoreTypeId, setSelectedStoreTypeId] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [showOnlyDiscount, setShowOnlyDiscount] = useState(true); // Default to showing only discounted products
  const [allCategories, setAllCategories] = useState([]);
  const [brands, setBrands] = useState([]); // Added brands state

  // Notification dialog state
  const [loginNotificationOpen, setLoginNotificationOpen] = useState(false);
  const [loginNotificationReason, setLoginNotificationReason] =
    useState("like");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  // Filter toggle state for mobile
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Scroll to top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Stores pagination state
  const [displayedStores, setDisplayedStores] = useState([]);
  const [storesPage, setStoresPage] = useState(1);
  const [storesPerPage] = useState(8);
  const [hasMoreStores, setHasMoreStores] = useState(true);

  // User tracking hook (user = device user for guests)
  const {
    toggleLike,
    toggleFollowStore,
    isProductLiked,
    isStoreFollowed,
    getFollowedStores,
    isAuthenticated,
    user,
    recordView,
  } = useUserTracking();

  // City filter hook
  const { selectedCity } = useCityFilter();

  // State for tracking like counts locally
  const [likeCounts, setLikeCounts] = useState({});
  const [likeStates, setLikeStates] = useState({}); // Track like state per product
  const [likeLoading, setLikeLoading] = useState({}); // Track loading state per product
  const [followLoading, setFollowLoading] = useState({}); // Track follow state per store
  const [mainPageTab, setMainPageTab] = useState(0); // 0 = For You, 1 = Following
  const [followedStores, setFollowedStores] = useState([]);
  const [productsByFollowedStore, setProductsByFollowedStore] = useState({});
  const [followLoadingTab, setFollowLoadingTab] = useState(false);

  // Handle like button click (works for both logged-in and guest/device users)
  const handleLikeClick = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleFollowClick = async (storeId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (followLoading[storeId]) return;
    setFollowLoading((prev) => ({ ...prev, [storeId]: true }));
    try {
      const result = await toggleFollowStore(storeId);
      if (!result.success) {
        alert(result.message || "Failed to update follow");
      } else if (mainPageTab === 1 && result.data && !result.data.isFollowed) {
        setFollowedStores((prev) => prev.filter((s) => s._id !== storeId));
        setProductsByFollowedStore((prev) => {
          const next = { ...prev };
          delete next[storeId];
          return next;
        });
      }
    } finally {
      setFollowLoading((prev) => ({ ...prev, [storeId]: false }));
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
    if (isAuthenticated) {
      recordView(product._id);
    }
  };

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
    [bannerAds],
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

  // Pull-to-refresh on mobile: pull down from top to reload page data
  usePullToRefresh(fetchData);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Update like states when user data changes (works for both logged-in and guest users)
  useEffect(() => {
    if ((isAuthenticated || user) && allProducts.length > 0) {
      const updatedLikeStates = {};
      allProducts.forEach((product) => {
        updatedLikeStates[product._id] = isProductLiked(product._id);
      });
      setLikeStates(updatedLikeStates);
    }
  }, [isAuthenticated, user, allProducts, isProductLiked]);

  // Fetch followed stores when user switches to Following tab
  useEffect(() => {
    if (mainPageTab !== 1) return;
    const fetchFollowed = async () => {
      try {
        setFollowLoadingTab(true);
        const result = await getFollowedStores();
        if (result.success && result.data && Array.isArray(result.data)) {
          const sorted = [...result.data].sort((a, b) => {
            if (a.isVip && !b.isVip) return -1;
            if (!a.isVip && b.isVip) return 1;
            return 0;
          });
          setFollowedStores(sorted);
          const byStore = {};
          await Promise.all(
            result.data.map(async (s) => {
              try {
                const res = await productAPI.getByStore(s._id);
                const prods = res.data?.data ?? res.data ?? [];
                byStore[s._id] = Array.isArray(prods) ? prods : [];
              } catch {
                byStore[s._id] = [];
              }
            }),
          );
          setProductsByFollowedStore(byStore);
        } else {
          setFollowedStores([]);
          setProductsByFollowedStore({});
        }
      } catch (err) {
        console.error("Error fetching followed stores:", err);
        setFollowedStores([]);
        setProductsByFollowedStore({});
      } finally {
        setFollowLoadingTab(false);
      }
    };
    fetchFollowed();
  }, [mainPageTab, getFollowedStores, user]);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch stores, categories, and all products in parallel
      const [
        storesResponse,
        categoriesResponse,
        productsResponse,
        adsResponse,
        storeTypesResponse,
        brandsResponse, // Add brandsResponse
      ] = await Promise.all([
        storeAPI.getAll(),
        categoryAPI.getAll(),
        productAPI.getAll(),
        adAPI.getAll({ page: "home" }),
        storeTypeAPI.getAll(),
        brandAPI.getAll(), // Add brandAPI call
      ]);

      const storesData = storesResponse.data;
      const categoriesData = categoriesResponse.data;
      const productsData = productsResponse.data;
      const adsData = adsResponse.data || [];
      const brandsData = brandsResponse.data || []; // Get brandsData

      // Shuffle stores logic
      const vipStores = storesData
        .filter((store) => store.isVip)
        .sort((a, b) => a.name.localeCompare(b.name));
      const nonVipStores = storesData.filter((store) => !store.isVip);

      // Fisher-Yates shuffle algorithm
      for (let i = nonVipStores.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nonVipStores[i], nonVipStores[j]] = [nonVipStores[j], nonVipStores[i]];
      }

      const shuffledStores = [...vipStores, ...nonVipStores];

      setStores(shuffledStores);
      setAllCategories(categoriesData);
      setAllProducts(productsData);
      setStoreTypes(storeTypesResponse?.data || []);
      setBrands(brandsData); // Set brands state

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
          : "Network error. Please check your connection.",
      );
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Memoized list of categories based on the selected store type
  const filteredCategories = useMemo(() => {
    if (selectedStoreTypeId === "all") {
      return allCategories;
    }
    return allCategories.filter(
      (category) => getID(category.storeTypeId) === selectedStoreTypeId,
    );
  }, [allCategories, selectedStoreTypeId]);

  // Memoized list of category types based on the selected category
  const categoryTypes = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }
    return selectedCategory.types || [];
  }, [selectedCategory]);

  const handleStoreTypeChange = (storeTypeId) => {
    setSelectedStoreTypeId(storeTypeId);
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
    setSelectedStoreTypeId("all");
    setPriceRange([0, 1000000]);
    setShowOnlyDiscount(true);
    setStoresPage(1);
  };

  // Helper to safely get ID from string or object (use function declaration so it's hoisted)
  function getID(id) {
    if (typeof id === "string") return id;
    if (id && typeof id === "object") {
      return id.$oid || String(id._id) || String(id);
    }
    return id;
  }

  const getRemainingDays = (expireDate) => {
    if (!expireDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expire = new Date(expireDate);
    expire.setHours(0, 0, 0, 0);
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

  const getCategoryTypeName = (categoryTypeId, categoryId) => {
    if (!categoryTypeId || !categoryId) return "N/A";
    const catId =
      typeof categoryId === "object"
        ? categoryId?._id || categoryId
        : categoryId;
    const category = allCategories.find(
      (c) => c._id === catId || c._id?.toString() === String(catId),
    );
    if (!category?.types) return "N/A";
    const type = category.types.find(
      (t) =>
        t._id?.toString() === String(categoryTypeId) ||
        t.name === categoryTypeId,
    );
    return type?.name || "N/A";
  };

  // 1. Memoize the filtered products list
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Filter by Store Type
      if (
        selectedStoreTypeId !== "all" &&
        getID(product.storeTypeId) !== selectedStoreTypeId
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
    selectedStoreTypeId,
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
        selectedStoreTypeId === "all" ||
        getID(store.storeTypeId) === selectedStoreTypeId;

      // And the store must match the city filter
      const cityMatch = store.storecity === selectedCity;

      return (
        (hasMatchingProducts || storeNameMatch) && storeTypeMatch && cityMatch
      );
    });
  }, [filteredProducts, stores, search, selectedStoreTypeId, selectedCity]);

  // Filtered followed stores and their products for Following tab
  const filteredFollowedStoresWithProducts = useMemo(() => {
    return followedStores
      .filter((store) => {
        // Store type filter
        if (
          selectedStoreTypeId !== "all" &&
          getID(store.storeTypeId) !== selectedStoreTypeId
        ) {
          return false;
        }
        // City filter
        if (store.storecity !== selectedCity) {
          return false;
        }
        // Store name search match (if search, store can show if name matches)
        const storeNameMatch =
          search && store.name?.toLowerCase().includes(search.toLowerCase());

        // Get products for this store
        const rawProducts = productsByFollowedStore[store._id] || [];
        const filteredProds = rawProducts.filter((product) => {
          if (
            selectedStoreTypeId !== "all" &&
            getID(product.storeTypeId ?? store.storeTypeId) !==
              selectedStoreTypeId
          ) {
            return false;
          }
          if (
            selectedCategory &&
            getID(product.categoryId) !== getID(selectedCategory._id)
          ) {
            return false;
          }
          if (
            selectedCategoryType &&
            getID(product.categoryTypeId) !== getID(selectedCategoryType._id)
          ) {
            return false;
          }
          const price = product.newPrice ?? product.price ?? 0;
          if (price < priceRange[0] || price > priceRange[1]) {
            return false;
          }
          const hasPriceDiscount =
            product.previousPrice &&
            product.newPrice &&
            product.previousPrice > product.newPrice;
          if (showOnlyDiscount) {
            const isDiscounted = product.isDiscount || hasPriceDiscount;
            if (!isDiscounted || !isDiscountValid(product)) {
              return false;
            }
          }
          if (
            search &&
            !product.name?.toLowerCase().includes(search.toLowerCase()) &&
            !storeNameMatch
          ) {
            return false;
          }
          // Exclude expired
          if (product.expireDate && new Date(product.expireDate) < new Date()) {
            return false;
          }
          return true;
        });

        return storeNameMatch || filteredProds.length > 0;
      })
      .map((store) => {
        const rawProducts = productsByFollowedStore[store._id] || [];
        const filteredProds = rawProducts.filter((product) => {
          if (
            selectedStoreTypeId !== "all" &&
            getID(product.storeTypeId ?? store.storeTypeId) !==
              selectedStoreTypeId
          ) {
            return false;
          }
          if (
            selectedCategory &&
            getID(product.categoryId) !== getID(selectedCategory._id)
          ) {
            return false;
          }
          if (
            selectedCategoryType &&
            getID(product.categoryTypeId) !== getID(selectedCategoryType._id)
          ) {
            return false;
          }
          const price = product.newPrice ?? product.price ?? 0;
          if (price < priceRange[0] || price > priceRange[1]) {
            return false;
          }
          const hasPriceDiscount =
            product.previousPrice &&
            product.newPrice &&
            product.previousPrice > product.newPrice;
          if (showOnlyDiscount) {
            const isDiscounted = product.isDiscount || hasPriceDiscount;
            if (!isDiscounted || !isDiscountValid(product)) {
              return false;
            }
          }
          const storeNameMatch =
            search && store.name?.toLowerCase().includes(search.toLowerCase());
          if (
            search &&
            !product.name?.toLowerCase().includes(search.toLowerCase()) &&
            !storeNameMatch
          ) {
            return false;
          }
          if (product.expireDate && new Date(product.expireDate) < new Date()) {
            return false;
          }
          return true;
        });
        return { store, products: filteredProds };
      });
  }, [
    followedStores,
    productsByFollowedStore,
    selectedStoreTypeId,
    selectedCategory,
    selectedCategoryType,
    search,
    priceRange,
    showOnlyDiscount,
    selectedCity,
  ]);

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
    <Box
      sx={{
        px: { xs: 0.5, sm: 1.5, md: 3 },
        pt: { xs: "100px", sm: "113px", md: "113px" },
      }}
    >
      {/* For You / Following Tabs - Fixed (no scrolling), after banner */}
      <Box
        sx={{
          position: "fixed",
          top: 65,
          left: 0,
          right: 0,
          zIndex: 1090,
          width: "fit-content",
          backgroundColor: "#ffffff",
          borderRadius: { xs: 2, md: 3 },
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          margin: "0 auto",
        }}
      >
        <Tabs
          value={mainPageTab}
          TabIndicatorProps={{
            children: <span className="MuiTabs-indicatorSpan" />,
          }}
          onChange={(_, v) => {
            setMainPageTab(v);

            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          sx={{
            minHeight: 48,
            "& .MuiTabs-indicator": {
              display: "flex",
              justifyContent: "center",
              backgroundColor: "transparent",
            },
            "& .MuiTabs-indicatorSpan": {
              width: "70%",
              backgroundColor: "var(--brand-accent-orange)",
              borderRadius: "999px",
              height: "3px",
            },
            "& .MuiTab-root": {
              fontWeight: 800,
              textTransform: "none",
              color: "black",
              minHeight: 48,
              minWidth: "auto",
              px: 2,
            },
          }}
        >
          <Tab
            sx={{
              color: "black",
              fontWeight: 800,
              fontSize: "1.2rem",
              fontWeight: "bold",
            }}
            label={t("For You")}
          />
          <Tab
            sx={{
              color: "black",
              fontWeight: 800,
              fontSize: "1.2rem",
              fontWeight: "bold",
            }}
            label={t("Following")}
          />
        </Tabs>
      </Box>
      {/* Advertisement Banner - Fixed (no scrolling) */}
      <Box
        sx={{
          position: "relative",
          backgroundColor:
            theme.palette.mode === "dark" ? "#121212" : "#ffffff",
          px: { xs: 0.5, sm: 1.5, md: 3 },
          py: 0,
          mb: 2,
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "lg",
            margin: "0 auto",
            height: { xs: "100px", sm: "150px", md: "250px" },
            borderRadius: { xs: 2, md: 3 },
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <Slider {...bannerSettings}>
            {(bannerAdsWithImages.length > 0 ? bannerAdsWithImages : []).map(
              (ad, index) => (
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
              ),
            )}
          </Slider>
        </Box>
      </Box>
      {/* Enhanced Filters Section */}
      <Box
        sx={{
          backgroundColor:
            theme.palette.mode === "dark" ? "#4A90E2" : "#FF7A1A",
          borderRadius: { xs: 2, md: 3 },
          p: { xs: 2, md: 3 },

          mb: 3,
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
            <ClearAllIcon sx={{ fontSize: "18px" }} />
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
                              ? "#1E6FD9"
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
                flexWrap: "wrap",
                alignItems: "center",
                pb: 0,
                minHeight: "20px",
                width: "100%",
                overflow: "hidden",
              }}
            >
              {[{ _id: "all", name: t("All") }, ...storeTypes].map((type) => (
                <Button
                  key={type._id}
                  variant={
                    selectedStoreTypeId === type._id ? "contained" : "outlined"
                  }
                  onClick={() => handleStoreTypeChange(type._id)}
                  sx={{
                    backgroundColor:
                      selectedStoreTypeId === type._id
                        ? theme.palette.mode === "dark"
                          ? "#1E6FD9"
                          : "#4A90E2"
                        : "transparent",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 2,
                    px: { xs: 1.5, md: 2 },
                    py: 0.5,
                    fontSize: { xs: "0.75rem", md: "0.875rem" },
                    textTransform: "none",
                    minHeight: "32px",
                    maxWidth: "min(105px, 100%)",
                    whiteSpace: "normal",
                    textAlign: "center",
                    lineHeight: 1.4,
                    display: "inline-flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "center",
                    "&:hover": {
                      backgroundColor:
                        selectedStoreTypeId === type._id
                          ? theme.palette.mode === "dark"
                            ? "#1E6FD9"
                            : "#4A90E2"
                          : "rgba(255,255,255,0.1)",
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                  }}
                >
                  <span style={{ marginRight: "4px", flexShrink: 0 }}>
                    {type.icon || "🏪"}
                  </span>
                  <span
                    style={{
                      flex: "1 1 0",
                      minWidth: 0,
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                    }}
                  >
                    {t(type.name)}
                  </span>
                </Button>
              ))}
            </Box>
          </Box>

          {/* Categories Filter */}
          {selectedStoreTypeId !== "all" && (
            <Box sx={{ mt: 2, mb: 0 }}>
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
                          ? "#4A90E2"
                          : "#1E6FD9"
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
                            ? "#1E6FD9"
                            : "#4A90E2"
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
                            ? "#1E6FD9"
                            : "#4A90E2"
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
                              ? "#1E6FD9"
                              : "#4A90E2"
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
          )}

          {/* CCCategory Types Filter
          {selectedCategory && (
            <Box sx={{ mb: 0 }}>
             
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
                CCAll Category Types
                <Button
                  variant={
                    selectedCategoryType === null ? "contained" : "outlined"
                  }
                  onClick={() => handleCategoryTypeChange(null)}
                  sx={{
                    backgroundColor:
                      selectedCategoryType === null
                        ? theme.palette.mode === "dark"
                          ? "#1E6FD9"
                          : "#4A90E2"
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
                            ? "#1E6FD9"
                            : "#4A90E2"
                          : "rgba(255,255,255,0.1)",
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                  }}
                  startIcon={<CategoryIcon sx={{ fontSize: "16px" }} />}
                >
                  {t("All Category Types")}
                </Button>

                CCCategory Type Filter Buttons
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
                            ? "#1E6FD9"
                            : "#4A90E2"
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
                              ? "#1E6FD9"
                              : "#4A90E2"
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
          )} */}

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

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: 2, sm: 2, md: 3 },
        }}
      >
        {mainPageTab === 0 ? (
          <>
            {displayedStores.map((store, index) => {
              // 3. Get the products for this card from the master filtered list
              const productsForCard = filteredProducts
                .filter((p) => getID(p.storeId) === getID(store._id))
                .slice(0, 12);

              // Split into 2 rows when more than 2 products
              const productRows =
                productsForCard.length > 2
                  ? [
                      productsForCard.slice(
                        0,
                        Math.ceil(productsForCard.length / 2),
                      ),
                      productsForCard.slice(
                        Math.ceil(productsForCard.length / 2),
                      ),
                    ]
                  : [productsForCard];

              const totalDiscountedInStore = productsForCard.filter(
                (p) =>
                  p.isDiscount ||
                  (p.previousPrice &&
                    p.newPrice &&
                    p.previousPrice > p.newPrice),
              ).length;

              // Logic to insert BrandShowcase
              const brandShowcase =
                (index + 1) % 5 === 0 ? (
                  <BrandShowcase
                    brands={brands.slice(
                      ((index + 1) / 5 - 1) * 5,
                      ((index + 1) / 5) * 5,
                    )}
                  />
                ) : null;

              return (
                <React.Fragment key={store._id}>
                  <Card
                    sx={{
                      mb: { xs: 0, sm: 2 },
                      mt: { xs: 0, sm: 0 },
                      borderRadius: { xs: 2, md: 3 },
                      overflow: "hidden",
                      background:
                        theme.palette.mode === "dark"
                          ? "linear-gradient(135deg, #1E6FD9 0%, #4A90E2 100%)"
                          : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                      border: `1px solid ${
                        theme.palette.mode === "dark" ? "#1E6FD9" : "#e9ecef"
                      }`,
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 8px 32px rgba(0,0,0,0.3)"
                          : "0 8px 32px rgba(0,0,0,0.1)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        // transform: "translateY(-4px)",
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
                          theme.palette.mode === "dark" ? "#4A90E2" : "#1E6FD9",
                        p: { xs: 1, sm: 2, md: 3, lg: 1 }, // Reduced padding on xs
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
                        <Link
                          to={`/stores/${store._id}`}
                          style={{ textDecoration: "none", flexShrink: 0 }}
                        >
                          {store.logo ? (
                            <Box
                              sx={{
                                width: { xs: 50, sm: 80, md: 150 },
                                height: { xs: 50, sm: 80, md: 150 },
                                borderRadius: 2,
                                overflow: "hidden",
                                border: "3px solid rgba(255,255,255,0.2)",
                                background: "rgba(255,255,255,0.1)",
                                backdropFilter: "blur(10px)",
                                cursor: "pointer",
                                transition: "opacity 0.2s",
                                "&:hover": { opacity: 0.9 },
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
                                cursor: "pointer",
                                transition: "opacity 0.2s",
                                "&:hover": { opacity: 0.9 },
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
                        </Link>

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
                                fontSize: {
                                  xs: "1.1rem",
                                  sm: "1.5rem",
                                  md: "2rem",
                                },
                                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  textShadow: "0 4px 8px rgba(0,0,0,0.4)",
                                  // transform: "translateX(4px)",
                                },
                              }}
                            >
                              {store.name}
                            </Typography>
                            <IconButton
                              onClick={(e) => handleFollowClick(store._id, e)}
                              disabled={followLoading[store._id]}
                              size="small"
                              sx={{
                                color: "white",
                                bgcolor: isStoreFollowed(store._id)
                                  ? "rgba(76, 175, 80, 0.9)"
                                  : "rgba(255,255,255,0.2)",
                                "&:hover": {
                                  bgcolor: isStoreFollowed(store._id)
                                    ? "rgba(76, 175, 80, 1)"
                                    : "rgba(255,255,255,0.35)",
                                },
                              }}
                              title={
                                isStoreFollowed(store._id)
                                  ? t("Unfollow")
                                  : t("Follow")
                              }
                            >
                              {isStoreFollowed(store._id) ? (
                                <PersonAddDisabledIcon
                                  sx={{ fontSize: { xs: 18, sm: 20 } }}
                                />
                              ) : (
                                <PersonAddIcon
                                  sx={{ fontSize: { xs: 18, sm: 20 } }}
                                />
                              )}
                            </IconButton>
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
                              fontSize: {
                                xs: "0.7rem",
                                sm: "0.875rem",
                                md: "1rem",
                              },
                              textAlign: "left",
                            }}
                          >
                            {store.address}
                          </Typography>
                          <Chip
                            label={`${totalDiscountedInStore} ${t(
                              "Discounted Products",
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

                    {/* Products Grid - 2 rows when more than 2 products, scroll together */}
                    <Box
                      sx={{
                        p: { xs: 0.5, sm: 0.7, md: 3 }, // Reduced padding on xs and sm
                        width: { xs: "100%", md: "100%" },
                        height:
                          productRows.length > 1
                            ? { xs: "600px", sm: "680px", md: "auto" } // Increased to fully show 2 rows
                            : { xs: "auto", sm: "300px", md: "auto" },
                      }}
                    >
                      <Box
                        sx={{
                          ...(productRows.length > 1 && {
                            overflowX: "auto",
                            overflowY: "hidden",
                            "&::-webkit-scrollbar": {
                              height: 8,
                            },
                            "&::-webkit-scrollbar-track": {
                              backgroundColor:
                                theme.palette.mode === "dark"
                                  ? "#4a5568"
                                  : "#f1f1f1",
                              borderRadius: 4,
                            },
                            "&::-webkit-scrollbar-thumb": {
                              backgroundColor:
                                theme.palette.mode === "dark"
                                  ? "#4A90E2"
                                  : "#1E6FD9",
                              borderRadius: 4,
                              "&:hover": {
                                backgroundColor: "#45a049",
                              },
                            },
                          }),
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection:
                              productRows.length > 1 ? "column" : "row",
                            gap:
                              productRows.length > 1
                                ? { xs: 0.5, md: 1 } // Small gap between rows
                                : { xs: 0.5, md: 3 },
                            pb: 2,
                            ...(productRows.length > 1 && {
                              minWidth: "max-content",
                            }),
                            ...(productRows.length === 1 && {
                              overflowX: "auto",
                              "&::-webkit-scrollbar": {
                                height: 8,
                              },
                              "&::-webkit-scrollbar-track": {
                                backgroundColor:
                                  theme.palette.mode === "dark"
                                    ? "#4a5568"
                                    : "#f1f1f1",
                                borderRadius: 4,
                              },
                              "&::-webkit-scrollbar-thumb": {
                                backgroundColor:
                                  theme.palette.mode === "dark"
                                    ? "#4A90E2"
                                    : "#1E6FD9",
                                borderRadius: 4,
                                "&:hover": {
                                  backgroundColor: "#45a049",
                                },
                              },
                            }),
                          }}
                        >
                          {productRows.map((rowProducts, rowIndex) => (
                            <Box
                              key={rowIndex}
                              sx={{
                                display: "flex",
                                gap: { xs: 0.5, md: 3 },
                                pb: productRows.length === 1 ? 2 : 0,
                                mb:
                                  productRows.length > 1 &&
                                  rowIndex < productRows.length - 1
                                    ? 0.5
                                    : 0,
                                flexShrink: 0,
                                minHeight:
                                  productRows.length > 1
                                    ? { xs: "230px", sm: "330px" }
                                    : "auto",
                                alignItems: "stretch",
                              }}
                            >
                              {rowProducts.map((product) => {
                                const discount = calculateDiscount(
                                  product.previousPrice,
                                  product.newPrice,
                                );
                                const hasPreviousPrice =
                                  product.previousPrice &&
                                  product.newPrice &&
                                  product.previousPrice > product.newPrice;
                                return (
                                  <Card
                                    key={product._id}
                                    sx={{
                                      cursor: "pointer",
                                      height: { xs: "auto", sm: "330px" }, // taller for 2-row visibility
                                      minHeight: { xs: "230px", sm: "330px" },
                                      width: {
                                        xs: "140px",
                                        sm: "200px",
                                        md: "280px",
                                      }, // Reduced width on xs
                                      maxWidth: {
                                        xs: "140px",
                                        sm: "200px",
                                        md: "280px",
                                      }, // Reduced width on xs
                                      minWidth: {
                                        xs: "140px",
                                        sm: "200px",
                                        md: "280px",
                                      }, // Reduced width on xs
                                      borderRadius: 2,
                                      overflow: "hidden",
                                      display: "flex",
                                      flexDirection: "column",
                                      flexShrink: 0,
                                      background: "white",
                                      border: "1px solid #e2e8f0",
                                      transition:
                                        "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                      "&:hover": {
                                        // transform: "translateY(-4px)",
                                        boxShadow:
                                          "0 12px 24px rgba(0,0,0,0.15)",
                                      },
                                    }}
                                  >
                                    {/* Product Image */}
                                    <Box
                                      sx={{
                                        position: "relative",
                                        overflow: "hidden",
                                        height: { xs: "150px", sm: "200px" }, // Reduced height on xs
                                        flexShrink: 0,
                                        backgroundColor: "#f8f9fa",
                                      }}
                                      onClick={() =>
                                        handleProductClick(product)
                                      }
                                    >
                                      {product.image ? (
                                        <CardMedia
                                          component="img"
                                          height="220"
                                          image={`${process.env.REACT_APP_BACKEND_URL}${product.image}`}
                                          alt={product.name}
                                          sx={{
                                            objectFit: "contain",
                                            width: "100%",
                                            height: {
                                              xs: "150px", // Reduced height
                                              sm: "200px", // Reduced height
                                              md: "250px",
                                            },
                                            transition: "transform 0.3s ease",
                                            // "&:hover": {
                                            //   transform: "scale(1.05)",
                                            // },
                                          }}
                                        />
                                      ) : (
                                        <Box
                                          sx={{
                                            height: {
                                              xs: "150px",
                                              sm: "200px",
                                              md: "250px",
                                            },
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
                                        onClick={(e) =>
                                          handleLikeClick(product._id, e)
                                        }
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
                                          <FavoriteIcon
                                            sx={{ fontSize: "1.2rem" }}
                                          />
                                        ) : (
                                          <FavoriteBorderIcon
                                            sx={{ fontSize: "1.2rem" }}
                                          />
                                        )}
                                      </IconButton>
                                      {(() => {
                                        const remainingDays = getRemainingDays(
                                          product.expireDate,
                                        );
                                        if (
                                          remainingDays === null ||
                                          remainingDays > 30
                                        )
                                          return null;
                                        return (
                                          <Chip
                                            label={
                                              remainingDays < 0
                                                ? t("Expired")
                                                : remainingDays === 0
                                                  ? t("Expires today")
                                                  : `${remainingDays} ${t("days left")}`
                                            }
                                            size="small"
                                            sx={{
                                              position: "absolute",
                                              bottom: 8,
                                              left: 8,
                                              backgroundColor:
                                                remainingDays <= 3 ||
                                                remainingDays < 0
                                                  ? "#e53e3e"
                                                  : "#f59e0b",
                                              color: "white",
                                              fontWeight: 600,
                                            }}
                                          />
                                        );
                                      })()}
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
                                        flex: { xs: "0 0 auto", sm: 1 },
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
                                          fontSize: {
                                            xs: "0.9rem",
                                            sm: "1rem",
                                          },
                                          textAlign: "center",
                                          mt: 0.5,
                                          mb: 0.5,
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

                                      {/* Pricing Section */}
                                      <Box
                                        sx={{
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          mb: 0,
                                          minHeight: { xs: "70px", sm: "78px" },
                                        }}
                                      >
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            textDecoration: hasPreviousPrice
                                              ? "line-through"
                                              : "none",
                                            color: "red",
                                            fontSize: {
                                              xs: "0.8rem",
                                              sm: "0.9rem",
                                            },
                                            fontWeight: 500,
                                            minHeight: "1.4em",
                                            visibility: hasPreviousPrice
                                              ? "visible"
                                              : "hidden",
                                          }}
                                        >
                                          {hasPreviousPrice
                                            ? formatPrice(product.previousPrice)
                                            : "\u00A0"}
                                        </Typography>
                                        <Typography
                                          variant="h6"
                                          sx={{
                                            color: "white",

                                            backgroundColor:
                                              "var(--brand-accent-orange)",
                                            border:
                                              "1px solid var(--brand-accent-orange)",
                                            borderRadius: "8px",
                                            padding: "4px 8px",
                                            boxShadow:
                                              "0 2px 4px rgba(0, 0, 0, 0.1)",
                                            fontWeight: 800,
                                            fontSize: {
                                              xs: "1.2rem",
                                              sm: "1.3rem",
                                            },
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
                                          mt: 0.5,
                                        }}
                                      >
                                        {/* Discount Badge - Bottom Left */}
                                        {/* {(discount > 0 || product.isDiscount) && (
                                      <Chip
                                        label={
                                          discount > 0
                                            ? `-${discount}%`
                                            : t("Discount")
                                        }
                                        sx={{
                                          backgroundColor: "#e53e3e",
                                          color: "white",
                                          fontWeight: 700,
                                          fontSize: "0.75rem",
                                          height: "24px",
                                        }}
                                      />
                                    )} */}
                                      </Box>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                  {brandShowcase}
                </React.Fragment>
              );
            })}
          </>
        ) : followLoadingTab ? (
          <Box display="flex" justifyContent="center" py={8}>
            <Loader />
          </Box>
        ) : followedStores.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
            <PersonAddDisabledIcon
              sx={{ fontSize: 80, color: "grey.400", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t("No followed stores yet")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("Follow stores from the main page to see them here")}
            </Typography>
          </Box>
        ) : filteredFollowedStoresWithProducts.length === 0 ? (
          <>
            <br />

            <Alert
              severity="info"
              sx={{
                borderRadius: 2,
                backgroundColor:
                  theme.palette.mode === "dark" ? "#FFA94D" : "#e3f2fd",
                border: `1px solid ${theme.palette.mode === "dark" ? "#FF7A1A" : "#bbdefb"}`,
              }}
            >
              {t("No stores match the current filters.")}
            </Alert>
          </>
        ) : (
          filteredFollowedStoresWithProducts.map(
            ({ store, products: storeProducts }) => {
              const discountedCount = storeProducts.filter(
                (p) =>
                  p.isDiscount ||
                  (p.previousPrice &&
                    p.newPrice &&
                    p.previousPrice > p.newPrice),
              ).length;
              const productsForCard = storeProducts.slice(0, 12);
              const productRows =
                productsForCard.length > 2
                  ? [
                      productsForCard.slice(
                        0,
                        Math.ceil(productsForCard.length / 2),
                      ),
                      productsForCard.slice(
                        Math.ceil(productsForCard.length / 2),
                      ),
                    ]
                  : [productsForCard];

              return (
                <Card
                  key={store._id}
                  sx={{
                    mb: { xs: 0, sm: 2 },
                    borderRadius: { xs: 2, md: 3 },
                    overflow: "hidden",
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, #1E6FD9 0%, #4A90E2 100%)"
                        : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                    border: `1px solid ${theme.palette.mode === "dark" ? "#1E6FD9" : "#e9ecef"}`,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 8px 32px rgba(0,0,0,0.3)"
                        : "0 8px 32px rgba(0,0,0,0.1)",
                  }}
                >
                  <Box
                    sx={{
                      background:
                        theme.palette.mode === "dark" ? "#4A90E2" : "#1E6FD9",
                      p: { xs: 1, sm: 2, md: 3 },
                      color: "white",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={2}
                      sx={{
                        flexDirection: "row",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <Link
                        to={`/stores/${store._id}`}
                        style={{ textDecoration: "none", flexShrink: 0 }}
                      >
                        {store.logo ? (
                          <Box
                            sx={{
                              width: { xs: 50, sm: 80, md: 150 },
                              height: { xs: 50, sm: 80, md: 150 },
                              borderRadius: 2,
                              overflow: "hidden",
                              border: "3px solid rgba(255,255,255,0.2)",
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
                              border: "3px solid rgba(255,255,255,0.2)",
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
                      </Link>
                      {store.isVip && (
                        <Box
                          alt={t("sponsor")}
                          sx={{
                            position: "absolute",
                            top: { xs: 0, md: -2 },
                            left: { xs: -2, md: -2 },
                            zIndex: 2,
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
                      <Box flexGrow={1} sx={{ textAlign: "left" }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                            position: "relative",
                          }}
                        >
                          <Typography
                            variant="h4"
                            sx={{
                              color: "white",
                              fontWeight: 700,
                              fontSize: {
                                xs: "1.1rem",
                                sm: "1.5rem",
                                md: "2rem",
                              },
                              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                            }}
                          >
                            {store.name}
                          </Typography>
                          <IconButton
                            onClick={(e) => handleFollowClick(store._id, e)}
                            disabled={followLoading[store._id]}
                            size="small"
                            sx={{
                              color: "white",
                              bgcolor: "rgba(76, 175, 80, 0.9)",
                              "&:hover": { bgcolor: "rgba(76, 175, 80, 1)" },
                            }}
                            title={t("Unfollow")}
                          >
                            <PersonAddDisabledIcon
                              sx={{ fontSize: { xs: 18, sm: 20 } }}
                            />
                          </IconButton>
                        </Box>
                        {store.address && (
                          <Typography
                            variant="body1"
                            sx={{
                              color: "rgba(255,255,255,0.9)",
                              mt: 0.5,
                              fontSize: {
                                xs: "0.7rem",
                                sm: "0.875rem",
                                md: "1rem",
                              },
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {store.address}
                          </Typography>
                        )}
                        <Chip
                          label={`${discountedCount} ${t("Discounted Products")}`}
                          sx={{
                            mt: 1,
                            backgroundColor: "rgba(255,255,255,0.2)",
                            color: "white",
                            fontWeight: 600,
                            fontSize: { xs: "0.65rem", sm: "0.8rem" },
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      p: { xs: 0.5, sm: 0.7, md: 3 },
                      ...(productRows.length > 1 && {
                        overflowX: "auto",
                        overflowY: "hidden",
                        "&::-webkit-scrollbar": { height: 8 },
                        "&::-webkit-scrollbar-track": {
                          backgroundColor:
                            theme.palette.mode === "dark"
                              ? "#4a5568"
                              : "#f1f1f1",
                          borderRadius: 4,
                        },
                        "&::-webkit-scrollbar-thumb": {
                          backgroundColor:
                            theme.palette.mode === "dark"
                              ? "#4A90E2"
                              : "#1E6FD9",
                          borderRadius: 4,
                        },
                      }),
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection:
                          productRows.length > 1 ? "column" : "row",
                        gap:
                          productRows.length > 1
                            ? { xs: 0.5, md: 1 }
                            : { xs: 1, sm: 2 },
                        pb: 2,
                        ...(productRows.length > 1 && {
                          minWidth: "max-content",
                        }),
                        ...(productRows.length === 1 && {
                          overflowX: "auto",
                          "&::-webkit-scrollbar": { height: 8 },
                        }),
                      }}
                    >
                      {productRows.map((row, rowIdx) => (
                        <Box
                          key={rowIdx}
                          sx={{
                            display: "flex",
                            gap: { xs: 0.5, md: 3 },
                            pb: productRows.length === 1 ? 2 : 0,
                            mb:
                              productRows.length > 1 &&
                              rowIdx < productRows.length - 1
                                ? 0.5
                                : 0,
                            flexShrink: 0,
                            minHeight:
                              productRows.length > 1
                                ? { xs: "230px", sm: "330px" }
                                : "auto",
                            alignItems: "stretch",
                          }}
                        >
                          {row.map((product) => (
                            <Card
                              key={product._id}
                              sx={{
                                minWidth: { xs: 140, sm: 200, md: 280 },
                                maxWidth: { xs: 140, sm: 200, md: 280 },
                                height:
                                  productRows.length > 1
                                    ? { xs: "auto", sm: "330px" }
                                    : "auto",
                                minHeight:
                                  productRows.length > 1
                                    ? { xs: "230px", sm: "330px" }
                                    : "auto",
                                textDecoration: "none",
                                color: "inherit",
                                transition: "transform 0.2s",
                                cursor: "pointer",
                              }}
                              onClick={() => handleProductClick(product)}
                            >
                              <Box sx={{ position: "relative" }}>
                                {product.image ? (
                                  <CardMedia
                                    component="img"
                                    image={`${process.env.REACT_APP_BACKEND_URL}${product.image}`}
                                    alt={product.name}
                                    sx={{
                                      height: { xs: 100, sm: 140, md: 160 },
                                      objectFit: "contain",
                                      bgcolor: theme.palette.grey[100],
                                    }}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      height: { xs: 100, sm: 140, md: 160 },
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      bgcolor: theme.palette.grey[100],
                                    }}
                                  >
                                    <ShoppingCartIcon
                                      sx={{ fontSize: 40, color: "grey.400" }}
                                    />
                                  </Box>
                                )}
                                <IconButton
                                  size="small"
                                  onClick={(e) =>
                                    handleLikeClick(product._id, e)
                                  }
                                  disabled={likeLoading[product._id]}
                                  sx={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    bgcolor:
                                      theme.palette.mode === "dark"
                                        ? "rgba(0,0,0,0.9)"
                                        : "rgba(255,255,255,0.9)",
                                  }}
                                >
                                  {(likeStates[product._id] ??
                                  isProductLiked(product._id)) ? (
                                    <FavoriteIcon
                                      sx={{
                                        color: "#e53e3e",
                                        fontSize: "1.2rem",
                                      }}
                                    />
                                  ) : (
                                    <FavoriteBorderIcon
                                      sx={{
                                        fontSize: "1.2rem",
                                        color:
                                          theme.palette.mode === "dark"
                                            ? "white"
                                            : "black",
                                      }}
                                    />
                                  )}
                                </IconButton>
                                {product.expireDate &&
                                  (() => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const expire = new Date(product.expireDate);
                                    expire.setHours(0, 0, 0, 0);
                                    const diffDays = Math.ceil(
                                      (expire - today) / (1000 * 60 * 60 * 24),
                                    );
                                    if (diffDays <= 30 && diffDays >= 0) {
                                      return (
                                        <Chip
                                          label={
                                            diffDays === 0
                                              ? t("Expires today")
                                              : `${diffDays} ${t("days left")}`
                                          }
                                          size="small"
                                          sx={{
                                            position: "absolute",
                                            bottom: 4,
                                            left: 4,
                                            bgcolor:
                                              diffDays <= 3
                                                ? "#e53e3e"
                                                : "#f59e0b",
                                            color: "white",
                                            fontWeight: 600,
                                          }}
                                        />
                                      );
                                    }
                                    return null;
                                  })()}
                              </Box>
                              <CardContent
                                sx={{
                                  p: 1,
                                  flexGrow: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    lineHeight: 1.3,
                                    minHeight: "2.6em",
                                  }}
                                >
                                  {product.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    textDecoration:
                                      product.previousPrice &&
                                      product.newPrice &&
                                      product.previousPrice > product.newPrice
                                        ? "line-through"
                                        : "none",
                                    color: "red",
                                    fontSize: "0.8rem",
                                    minHeight: "1.4em",
                                    visibility:
                                      product.previousPrice &&
                                      product.newPrice &&
                                      product.previousPrice > product.newPrice
                                        ? "visible"
                                        : "hidden",
                                  }}
                                >
                                  {product.previousPrice &&
                                  product.newPrice &&
                                  product.previousPrice > product.newPrice
                                    ? `${product.previousPrice?.toLocaleString()} ${t("ID")}`
                                    : "\u00A0"}
                                </Typography>
                                {product.newPrice && (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: "var(--brand-light-orange)",
                                      fontWeight: 700,
                                      fontSize: "1rem",
                                      minHeight: "1.6em",
                                    }}
                                  >
                                    {product.newPrice?.toLocaleString()}{" "}
                                    {t("ID")}
                                  </Typography>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Card>
              );
            },
          )
        )}
      </Box>

      {/* Load More Stores Button - For You tab only */}
      {mainPageTab === 0 && hasMoreStores && (
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
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              },
              transition: "all 0.3s ease",
            }}
          >
            {t("Load More")}
          </Button>
        </Box>
      )}

      {mainPageTab === 0 && finalFilteredStores.length === 0 && !loading && (
        <>
          <br />
          <br />

          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              backgroundColor:
                theme.palette.mode === "dark" ? "#FFA94D" : "#e3f2fd",
              border: `1px solid ${
                theme.palette.mode === "dark" ? "#FF7A1A" : "#bbdefb"
              }`,
            }}
          >
            {t("No stores match the current filters.")}
          </Alert>
        </>
      )}

      {/* Product Detail Dialog - styled like ProductDetail page */}
      <Dialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: "hidden",
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedProduct && (
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                {/* Product Image */}
                <Grid xs={12} md={6} alignContent="center">
                  {selectedProduct.image ? (
                    <CardMedia
                      component="img"
                      image={`${process.env.REACT_APP_BACKEND_URL}${selectedProduct.image}`}
                      alt={selectedProduct.name}
                      sx={{
                        height: { xs: 200, sm: 280, md: 320 },
                        objectFit: "contain",
                        borderRadius: 2,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: { xs: 200, sm: 280, md: 320 },
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
                          color:
                            theme.palette.mode === "dark"
                              ? "white"
                              : "grey.400",
                        }}
                      />
                    </Box>
                  )}
                </Grid>

                {/* Product Details */}
                <Grid xs={12} md={6}>
                  <Box>
                    <Box display="flex" alignItems="center" mb={2}>
                      <ShoppingCartIcon
                        sx={{
                          fontSize: { xs: 24, sm: 28 },
                          mr: { xs: 1, md: 2 },
                          color:
                            theme.palette.mode === "dark"
                              ? "white"
                              : "primary.main",
                        }}
                      />
                      <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                          color:
                            theme.palette.mode === "dark" ? "white" : "black",
                          fontSize: { xs: "1rem", sm: "1.5rem", md: "1.75rem" },
                          lineHeight: 1.3,
                        }}
                      >
                        {selectedProduct.name}
                      </Typography>
                    </Box>

                    {/* Category Type Chip */}
                    {/* <Chip
                      label={getCategoryTypeName(
                        selectedProduct.categoryTypeId,
                        selectedProduct.categoryId?._id ||
                          selectedProduct.categoryId,
                      )}
                      color="primary"
                      sx={{
                        mb: 2,
                        fontSize: { xs: "0.7rem", sm: "0.875rem" },
                        height: { xs: "28px", sm: "32px" },
                      }}
                      icon={
                        <CategoryIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                      }
                    /> */}

                    {/* Category */}
                    {selectedProduct.categoryId && (
                      <Box
                        component={Link}
                        to="/categories"
                        state={{
                          category:
                            selectedProduct.categoryId?.name ||
                            "All Categories",
                          categoryType: getCategoryTypeName(
                            selectedProduct.categoryTypeId,
                            selectedProduct.categoryId?._id ||
                              selectedProduct.categoryId,
                          ),
                        }}
                        display="flex"
                        alignItems="center"
                        mb={1.5}
                        sx={{
                          textDecoration: "none",
                          color:
                            theme.palette.mode === "dark"
                              ? "white"
                              : "primary.main",
                          cursor: "pointer",
                          "&:hover": { opacity: 0.8 },
                        }}
                        onClick={() => setProductDialogOpen(false)}
                      >
                        <CategoryIcon
                          sx={{
                            fontSize: { xs: 16, sm: 18 },
                            mr: 0.5,
                            color:
                              theme.palette.mode === "dark"
                                ? "white"
                                : "text.secondary",
                          }}
                        />
                        <Typography
                          variant="body1"
                          color={
                            theme.palette.mode === "dark" ? "white" : "black"
                          }
                          sx={{
                            fontWeight: "bold",
                            fontSize: { xs: "0.875rem", sm: "1rem" },
                          }}
                        >
                          {t("Category")}:{" "}
                          {selectedProduct.categoryId.name || "N/A"}
                        </Typography>
                      </Box>
                    )}

                    {/* Brand */}
                    {/* {selectedProduct.brandId && (
                      <Box
                        display="flex"
                        alignItems="center"
                        mb={1.5}
                        onClick={() => {
                          setProductDialogOpen(false);
                          navigate(`/brands/${selectedProduct.brandId._id}`);
                        }}
                        sx={{ cursor: "pointer" }}
                      >
                        <BusinessIcon
                          sx={{
                            fontSize: { xs: 16, sm: 18 },
                            mr: 0.5,
                            color: "text.secondary",
                          }}
                        />
                        <Typography
                          variant="body1"
                          color="black"
                          sx={{
                            fontWeight: "bold",
                            fontSize: { xs: "0.875rem", sm: "1rem" },
                          }}
                        >
                          {t("Brand")}: {selectedProduct.brandId.name}
                        </Typography>
                      </Box>
                    )} */}

                    {/* Store */}
                    {selectedProduct.storeId && (
                      <Box
                        display="flex"
                        alignItems="center"
                        mb={1.5}
                        onClick={() => {
                          setProductDialogOpen(false);
                          navigate(`/stores/${selectedProduct.storeId._id}`);
                        }}
                        sx={{ cursor: "pointer" }}
                      >
                        <StorefrontIcon
                          sx={{
                            fontSize: { xs: 16, sm: 18 },
                            mr: 0.5,
                            color:
                              theme.palette.mode === "dark"
                                ? "white"
                                : "text.secondary",
                          }}
                        />
                        <Typography
                          variant="body1"
                          color={
                            theme.palette.mode === "dark" ? "white" : "black"
                          }
                          sx={{
                            fontWeight: "bold",
                            fontSize: { xs: "0.875rem", sm: "1rem" },
                          }}
                        >
                          {t("Store")}: {selectedProduct.storeId.name}
                        </Typography>
                      </Box>
                    )}

                    {/* Expire Date */}
                    {selectedProduct.expireDate && (
                      <Box display="flex" alignItems="center" mb={2}>
                        <AccessTimeIcon
                          sx={{
                            fontSize: { xs: 16, sm: 18 },
                            mr: 0.5,
                            color:
                              theme.palette.mode === "dark"
                                ? "white"
                                : "text.secondary",
                          }}
                        />
                        <Typography
                          variant="body1"
                          color={
                            theme.palette.mode === "dark" ? "white" : "black"
                          }
                          sx={{
                            fontWeight: "bold",
                            fontSize: { xs: "0.875rem", sm: "1rem" },
                          }}
                        >
                          {t("Expire Date")}:{" "}
                          {new Date(
                            selectedProduct.expireDate,
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Price Section */}
                    <Box sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontSize: { xs: "1.25rem", sm: "1.5rem" },
                            color:
                              theme.palette.mode === "dark"
                                ? "white"
                                : theme.palette.text.primary,
                          }}
                        >
                          {t("Price")}:{" "}
                          <span
                            style={{
                              color:
                                theme.palette.mode === "dark"
                                  ? "white"
                                  : "var(--brand-light-orange)",
                              fontWeight: 700,
                            }}
                          >
                            {formatPrice(selectedProduct.newPrice)}
                          </span>
                        </Typography>
                      </Box>
                      {selectedProduct.previousPrice &&
                        selectedProduct.previousPrice >
                          selectedProduct.newPrice && (
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={1}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                textDecoration: "line-through",
                                color:
                                  theme.palette.mode === "dark"
                                    ? "white"
                                    : "red",
                                fontSize: { xs: "0.8rem", sm: "0.9rem" },
                                fontWeight: 500,
                              }}
                            >
                              {formatPrice(selectedProduct.previousPrice)}
                            </Typography>
                            <Chip
                              icon={<LocalOfferIcon sx={{ fontSize: 16 }} />}
                              label={`-${calculateDiscount(
                                selectedProduct.previousPrice,
                                selectedProduct.newPrice,
                              )}% OFF`}
                              color="error"
                              size="small"
                              sx={{
                                fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                height: 28,
                              }}
                            />
                          </Box>
                        )}
                    </Box>

                    {/* Like Button + Stats */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: { xs: 1, sm: 2 },
                        flexWrap: "wrap",
                        mb: 2,
                      }}
                    >
                      <IconButton
                        onClick={(e) => handleLikeClick(selectedProduct._id, e)}
                        disabled={likeLoading[selectedProduct._id]}
                        sx={{
                          backgroundColor: likeStates[selectedProduct._id]
                            ? "rgba(229, 62, 62, 0.1)"
                            : "rgba(0, 0, 0, 0.04)",
                          color: likeStates[selectedProduct._id]
                            ? "#e53e3e"
                            : "#666",
                          "&:hover": {
                            backgroundColor: likeStates[selectedProduct._id]
                              ? "rgba(229, 62, 62, 0.2)"
                              : "rgba(0, 0, 0, 0.08)",
                            transform: "scale(1.05)",
                          },
                          width: 44,
                          height: 44,
                        }}
                      >
                        {likeStates[selectedProduct._id] ? (
                          <FavoriteIcon sx={{ fontSize: "1.25rem" }} />
                        ) : (
                          <FavoriteBorderIcon sx={{ fontSize: "1.25rem" }} />
                        )}
                      </IconButton>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        sx={{
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                          borderRadius: 1,
                          px: 1.5,
                          py: 0.5,
                        }}
                      >
                        <VisibilityIcon
                          sx={{ color: "text.secondary", fontSize: "1rem" }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.875rem" }}
                        >
                          {selectedProduct.viewCount || 0}
                        </Typography>
                      </Box>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        sx={{
                          backgroundColor: "rgba(229, 62, 62, 0.1)",
                          borderRadius: 1,
                          px: 1.5,
                          py: 0.5,
                        }}
                      >
                        <FavoriteIcon
                          sx={{ color: "#e53e3e", fontSize: "1rem" }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.875rem" }}
                        >
                          {likeCounts[selectedProduct._id] ??
                            selectedProduct.likeCount ??
                            0}
                        </Typography>
                      </Box>
                      {selectedProduct.averageRating > 0 && (
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={0.5}
                          sx={{
                            backgroundColor: "rgba(255, 193, 7, 0.1)",
                            borderRadius: 1,
                            px: 1.5,
                            py: 0.5,
                          }}
                        >
                          <StarIcon
                            sx={{ color: "#ffc107", fontSize: "1rem" }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: "0.875rem" }}
                          >
                            {selectedProduct.averageRating.toFixed(1)}
                          </Typography>
                        </Box>
                      )}
                      {/* Review feature removed */}
                    </Box>

                    {/* Product Details (barcode, weight, description) */}
                    {/* <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                        {t("Product Details")}
                      </Typography>
                      {selectedProduct.barcode && (
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>{t("Barcode")}:</strong> {selectedProduct.barcode}
                        </Typography>
                      )}
                      {selectedProduct.weight && (
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>{t("Weight")}:</strong> {selectedProduct.weight}
                        </Typography>
                      )}
                      {selectedProduct.description && (
                        <Box display="flex" alignItems="flex-start" sx={{ mt: 1 }}>
                          <DescriptionIcon
                            sx={{ fontSize: 16, mr: 0.5, mt: 0.25, color: "text.secondary" }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {selectedProduct.description}
                          </Typography>
                        </Box>
                      )}
                    </Box> */}

                    {/* View Full Details Button */}
                    {/* <Button
                      variant="contained"
                      fullWidth
                      onClick={() => {
                        setProductDialogOpen(false);
                        navigate(`/products/${selectedProduct._id}`);
                      }}
                      sx={{
                        backgroundColor: "var(--brand-accent-orange)",
                        "&:hover": { backgroundColor: "var(--brand-light-orange)" },
                        borderRadius: 2,
                        py: 1.5,
                      }}
                    >
                      {t("View details")}
                    </Button> */}

                    {/* Close Button - at end of popup */}
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => setProductDialogOpen(false)}
                      sx={{
                        mt: 2,
                        py: 1.5,
                        borderRadius: 2,
                      }}
                    >
                      {t("Close")}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
        </DialogContent>
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
            {loginNotificationReason === "review"
              ? t("You must login to leave reviews. Do you want to login?")
              : t("You must login to like products. Do you want to login?")}
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
              navigate("/login", {
                state: {
                  from: {
                    pathname: window.location.pathname,
                  },
                },
              });
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
              theme.palette.mode === "dark" ? "#4A90E2" : "#1E6FD9",
            color: "white",
            width: { xs: 48, sm: 56 }, // Slightly smaller on mobile
            height: { xs: 48, sm: 56 },
            "&:hover": {
              backgroundColor:
                theme.palette.mode === "dark" ? "#FFA94D" : "#1E6FD9",
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
