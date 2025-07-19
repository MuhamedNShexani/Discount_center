import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Alert,
  useTheme,
  Container,
  Fade,
  Chip,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { marketAPI } from "../services/api";
import BusinessIcon from "@mui/icons-material/Business";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Loader from "../components/Loader";
import { useTranslation } from "react-i18next";

const MarketList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const response = await marketAPI.getAll();
      setMarkets(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          err.message ||
          "Network error. Please check your connection."
      );
      console.error("Error fetching markets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarketClick = (market) => {
    navigate(`/markets/${market._id}`);
  };

  if (loading) return <Loader message="Loading markets..." />;
  if (error) return <Loader message={error} />;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Enhanced Header */}
      <Box sx={{ mb: 6, textAlign: "center" }}>
        <Box
          sx={{
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #52b788 0%, #40916c 100%)"
                : "linear-gradient(135deg, #52b788 0%, #40916c 100%)",
            borderRadius: 4,
            p: 4,
            color: "white",
            position: "relative",
            overflow: "hidden",
            mb: 4,
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)",
            },
          }}
        >
          <Box position="relative" zIndex={1}>
            <BusinessIcon sx={{ fontSize: 80, mb: 2, opacity: 0.9 }} />
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              color="white"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                textShadow: "0 4px 8px rgba(0,0,0,0.3)",
              }}
            >
              {t("Markets")}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                opacity: 0.9,
                fontWeight: 300,
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                color: "white",
              }}
            >
              {t("Browse all markets and their products")}
            </Typography>
            <Chip
              label={`${markets.length} ${t("Markets")} ${t("Available")}`}
              sx={{
                mt: 3,
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                fontSize: "1rem",
                fontWeight: 600,
                px: 2,
                py: 1,
                backdropFilter: "blur(10px)",
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Markets Grid */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          justifyContent: "flex-start",
        }}
      >
        {markets.map((market, index) => (
          <Fade in={true} timeout={300 + index * 100} key={market._id}>
            <Card
              sx={{
                height: "420px", // Increased height for market cards
                width: "280px", // Fixed width - no exceptions
                maxWidth: "280px", // Force exact width
                minWidth: "280px", // Force exact width
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
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
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                "&:hover": {
                  transform: "translateY(-12px) scale(1.02)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 24px 48px rgba(0,0,0,0.4)"
                      : "0 24px 48px rgba(0,0,0,0.15)",
                  "& .market-arrow": {
                    transform: "translateX(8px)",
                    opacity: 1,
                  },
                  "& .market-image": {
                    transform: "scale(1.1)",
                  },
                },
              }}
              onClick={() => handleMarketClick(market)}
            >
              {/* Market Image/Logo */}
              <Box
                sx={{
                  position: "relative",
                  height: "200px",
                  flexShrink: 0,
                  overflow: "hidden",
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, #52b788 0%, #40916c 100%)"
                      : "linear-gradient(135deg, #52b788 0%, #40916c 100%)",
                }}
              >
                {market.logo ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={`${process.env.REACT_APP_BACKEND_URL}${market.logo}`}
                    alt={market.name}
                    className="market-image"
                    sx={{
                      objectFit: "cover",
                      transition: "transform 0.4s ease",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <StorefrontIcon sx={{ fontSize: 80, opacity: 0.8 }} />
                  </Box>
                )}

                {/* Gradient Overlay */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 100%)",
                  }}
                />

                {/* Arrow Icon */}
                <IconButton
                  className="market-arrow"
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "white",
                    opacity: 0,
                    transition: "all 0.3s ease",
                    backdropFilter: "blur(10px)",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.3)",
                    },
                  }}
                >
                  <ArrowForwardIcon />
                </IconButton>
              </Box>

              {/* Market Content */}
              <CardContent
                sx={{
                  p: 3,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  height: "220px", // Increased height for content area
                  overflow: "hidden",
                }}
              >
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    fontSize: "1.125rem",
                    lineHeight: 1.3,
                    mb: 1,
                    height: "30px", // Fixed height for title
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {market.name}
                </Typography>

                {/* Market Details - Fixed Layout */}
                <Box sx={{ mb: 2, height: "120px", overflow: "hidden" }}>
                  {/* Address - Always show with fixed height */}
                  <Box
                    display="flex"
                    alignItems="flex-start"
                    mb={1}
                    sx={{ height: "45px" }}
                  >
                    <LocationOnIcon
                      sx={{
                        fontSize: 16,
                        mr: 1,
                        mt: 0.25,
                        color:
                          theme.palette.mode === "dark" ? "#52b788" : "#40916c",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.3,
                        fontSize: "0.875rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {market.address || "Address not provided"}
                    </Typography>
                  </Box>

                  {/* Phone - Always show with fixed height */}
                  <Box
                    display="flex"
                    alignItems="center"
                    mb={1}
                    sx={{ height: "30px" }}
                  >
                    <PhoneIcon
                      sx={{
                        fontSize: 16,
                        mr: 1,
                        color:
                          theme.palette.mode === "dark" ? "#52b788" : "#40916c",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {market.phone || "Phone not provided"}
                    </Typography>
                  </Box>

                  {/* Description - Always show with fixed height */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.3,
                      fontSize: "0.875rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      height: "45px",
                    }}
                  >
                    {market.description || "No description available"}
                  </Typography>
                </Box>

                {/* Action Area - Fixed Height */}
                <Box
                  sx={{
                    mt: "auto",
                    height: "60px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      background:
                        theme.palette.mode === "dark"
                          ? "linear-gradient(135deg, rgba(82, 183, 136, 0.1) 0%, rgba(64, 145, 108, 0.1) 100%)"
                          : "linear-gradient(135deg, rgba(82, 183, 136, 0.05) 0%, rgba(64, 145, 108, 0.05) 100%)",
                      borderRadius: 2,
                      py: 1,
                      px: 2,
                      width: "100%",
                      border: `1px solid ${
                        theme.palette.mode === "dark"
                          ? "rgba(82, 183, 136, 0.2)"
                          : "rgba(82, 183, 136, 0.1)"
                      }`,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          theme.palette.mode === "dark" ? "#52b788" : "#40916c",
                        fontWeight: 600,
                        textAlign: "center",
                        fontSize: "0.875rem",
                        lineHeight: 1,
                      }}
                    >
                      {t("View Products")}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        ))}
      </Box>

      {/* Empty State */}
      {markets.length === 0 && (
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
            {t("No markets found")}
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
            {t("No markets found. Add some markets through the admin panel.")}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default MarketList;
