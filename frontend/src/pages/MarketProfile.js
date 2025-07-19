import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
} from "@mui/material";
import {
  ArrowBack,
  Phone,
  LocationOn,
  Business,
  Store,
} from "@mui/icons-material";
import { marketAPI, productAPI } from "../services/api";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useTranslation } from "react-i18next";
import Loader from "../components/Loader";

const MarketProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  const [market, setMarket] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (id) {
      fetchMarketData();
    }
  }, [id]);

  const fetchMarketData = async () => {
    try {
      setLoading(true);

      // Fetch market details
      const marketResponse = await marketAPI.getById(id);
      setMarket(marketResponse.data);

      // Fetch products for this market
      const productsResponse = await productAPI.getByCompany(id);
      setProducts(productsResponse.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          err.message ||
          "Network error. Please check your connection."
      );
      console.error("Error fetching market data:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (previousPrice, newPrice) => {
    if (!previousPrice || !newPrice || previousPrice <= newPrice) return 0;
    return Math.round(((previousPrice - newPrice) / previousPrice) * 100);
  };

  const getRemainingDays = (expireDate) => {
    if (!expireDate) return null;
    const today = new Date();
    const expire = new Date(expireDate);
    const timeDiff = expire.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff > 0 ? daysDiff : 0;
  };

  if (loading) return <Loader message="Loading market details..." />;
  if (error) return <Loader message={error} />;
  if (!market) return <Alert severity="error">Market not found</Alert>;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Enhanced Back Button */}
      <Button
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

      {/* Enhanced Market Header */}
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
            p: 4,
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
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={3}>
                {market.logo ? (
                  <Avatar
                    src={`${process.env.REACT_APP_BACKEND_URL}${market.logo}`}
                    alt={market.name}
                    sx={{
                      width: { xs: 120, md: 150 },
                      height: { xs: 120, md: 150 },
                      border: "4px solid rgba(255,255,255,0.2)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                      mx: { xs: "auto", md: 0 },
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: { xs: 120, md: 150 },
                      height: { xs: 120, md: 150 },
                      bgcolor: "rgba(255,255,255,0.2)",
                      border: "4px solid rgba(255,255,255,0.2)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                      mx: { xs: "auto", md: 0 },
                    }}
                  >
                    <Business sx={{ fontSize: { xs: 60, md: 80 } }} />
                  </Avatar>
                )}
              </Grid>

              <Grid item xs={12} md={9}>
                <Typography
                  variant="h2"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "2rem", md: "3rem" },
                    textShadow: "0 4px 8px rgba(0,0,0,0.3)",
                    textAlign: { xs: "center", md: "left" },
                    mb: 2,
                    color: "white",
                  }}
                >
                  {market.name}
                </Typography>

                <Box sx={{ mb: 3 }}>
                  {market.address && (
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
                        {market.address}
                      </Typography>
                    </Box>
                  )}

                  {market.phone && (
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
                        {market.phone}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {market.description && (
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
                    {market.description}
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
                    label={t("Premium Market")}
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

      {/* Enhanced Products Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ mb: 4, textAlign: "center" }}>
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
            {t("Discover amazing products from this market")}
          </Typography>
          <Divider sx={{ maxWidth: 200, mx: "auto" }} />
        </Box>

        {products.length === 0 ? (
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
                color: theme.palette.mode === "dark" ? "#4a5568" : "#cbd5e0",
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
              {t("No products available")}
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
              {t(
                "This market hasn't added any products yet. Check back later!"
              )}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              justifyContent: "flex-start",
            }}
          >
            {products.map((product, index) => {
              const discount = calculateDiscount(
                product.previousPrice,
                product.newPrice
              );
              const remainingDays = getRemainingDays(product.expireDate);

              return (
                <Fade in={true} timeout={300 + index * 50} key={product._id}>
                  <Card
                    component={Link}
                    to={`/product/${product._id}`}
                    sx={{
                      height: "350px", // Fixed height - no exceptions
                      width: "280px", // Fixed width - no exceptions
                      maxWidth: "280px", // Force exact width
                      minWidth: "280px", // Force exact width
                      textDecoration: "none",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: 3,
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
                          className="product-image"
                          sx={{
                            objectFit: "contain",
                            width: "100%",
                            height: "100%",
                            transition: "transform 0.4s ease",
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
                        flex: 1, // Fill remaining space
                        display: "flex",
                        flexDirection: "column",
                        minHeight: "140px", // Minimum height for consistent content area
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

                      {/* Price Section */}
                      <Box sx={{ mt: "auto" }}>
                        {/* Expiry Info */}
                        {remainingDays !== null && (
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={0.5}
                            mb={1}
                          >
                            <LocalOfferIcon
                              sx={{ fontSize: 16, color: "#52b788" }}
                            />
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
                                ${product.previousPrice}
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
                            ${product.newPrice}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Fade>
              );
            })}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default MarketProfile;
