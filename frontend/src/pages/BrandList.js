import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  useTheme,
  Container,
  Fade,
  Chip,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { brandAPI } from "../services/api";
import BusinessIcon from "@mui/icons-material/Business";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Loader from "../components/Loader";
import { useTranslation } from "react-i18next";

const BrandList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  const [Brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await brandAPI.getAll();

      setBrands(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          err.message ||
          "Network error. Please check your connection."
      );
      console.error("Error fetching Brands:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandClick = (brand) => {
    navigate(`/brands/${brand._id}`);
  };

  if (loading) return <Loader message="Loading Brands..." />;
  if (error) return <Loader message={error} />;

  return (
    <Box sx={{ py: 10, px: { xs: 0.5, sm: 1.5, md: 3 } }}>
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
            <BusinessIcon
              sx={{ fontSize: { xs: 60, sm: 70, md: 80 }, mb: 2, opacity: 0.9 }}
            />
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              color="white"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3.5rem" },
                textShadow: "0 4px 8px rgba(0,0,0,0.3)",
              }}
            >
              {t("Brands")}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                opacity: 0.9,
                fontWeight: 300,
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                color: "white",
                fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
              }}
            >
              {t("Browse all Brands and their products")}
            </Typography>
            <Chip
              label={`(${Brands.length})${t("Brands Available")}`}
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

      {/* Brands Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(auto-fill, minmax(280px, 1fr))",
            md: "repeat(auto-fill, minmax(280px, 1fr))",
          },
          gap: { xs: 2, sm: 3, md: 4 },
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {Brands.map((brand, index) => (
          <Fade in={true} timeout={300 + index * 100} key={brand._id}>
            <Card
              sx={{
                height: { xs: "200px", sm: "400px", md: "420px" },
                width: { xs: "100%", sm: "280px", md: "280px" },
                maxWidth: { xs: "100%", sm: "280px", md: "280px" },
                minWidth: { xs: "auto", sm: "280px", md: "280px" },
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                borderRadius: { xs: 2, sm: 3, md: 3 },
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
                  "& .brand-arrow": {
                    transform: "translateX(8px)",
                    opacity: 1,
                  },
                  "& .brand-image": {
                    transform: "scale(1.1)",
                  },
                },
              }}
              onClick={() => handleBrandClick(brand)}
            >
              {/* Brand Image/Logo */}
              <Box
                sx={{
                  position: "relative",
                  height: { xs: "140px", sm: "200px", md: "200px" },
                  flexShrink: 0,
                  overflow: "hidden",
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, #52b788 0%, #40916c 100%)"
                      : "linear-gradient(135deg, #52b788 0%, #40916c 100%)",
                }}
              >
                {brand.logo ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={`${process.env.REACT_APP_BACKEND_URL}${brand.logo}`}
                    alt={brand.name}
                    className="brand-image"
                    sx={{
                      objectFit: "contain",
                      transition: "transform 0.4s ease",
                      width: "100%",
                      height: "100%",
                      p: { xs: 1, sm: 0, md: 0 },
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

                {/* Arrow Icon - Hidden on mobile */}
                <IconButton
                  className="brand-arrow"
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "white",
                    opacity: 0,
                    transition: "all 0.3s ease",
                    backdropFilter: "blur(10px)",
                    display: { xs: "none", sm: "flex" },
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.3)",
                    },
                  }}
                >
                  <ArrowForwardIcon />
                </IconButton>
              </Box>

              {/* Brand Content */}
              <CardContent
                align="center"
                sx={{
                  p: { xs: 1, sm: 3, md: 3 },
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  height: { xs: "60px", sm: "200px", md: "200px" },
                  overflow: "hidden",
                }}
              >
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    fontSize: { xs: "0.8rem", sm: "1.3rem", md: "1.3rem" },
                    lineHeight: 1.2,
                    mb: { xs: 0, sm: 1, md: 1 },
                    height: { xs: "auto", sm: "100px", md: "100px" },
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: { xs: 2, sm: 1, md: 1 },
                    WebkitBoxOrient: "vertical",
                    textAlign: "center",
                  }}
                >
                  {brand.name}
                </Typography>

                {/* Brand Details - Hidden on mobile */}
                <Box
                  sx={{
                    mb: 2,
                    overflow: "hidden",
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  {/* Address - Always show with fixed height */}
                  <Box
                    display="flex"
                    alignItems="flex-start"
                    mb={1}
                    sx={{ height: "30px" }}
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
                      {brand.address || t("address not provided")}
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
                      {brand.phone || t("phone not provided")}
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
                    {brand.description || t("description not provided")}
                  </Typography>
                </Box>

                {/* Action Area - Hidden on mobile */}
                <Box
                  sx={{
                    mt: "auto",
                    height: "60px",
                    display: { xs: "none", sm: "flex" },
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
      {Brands.length === 0 && (
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
            {t("No Brands found")}
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
            {t("No Brands found. Add some Brands through the admin panel.")}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BrandList;
