import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Chip,
} from "@mui/material";
import { ArrowBack, Phone, LocationOn, Business } from "@mui/icons-material";
import { companyAPI, productAPI } from "../services/api";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import StorefrontIcon from "@mui/icons-material/Storefront";

import DescriptionIcon from "@mui/icons-material/Description";
import { useTranslation } from "react-i18next";

const CompanyProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchCompanyData();
  }, [id]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);

      // Fetch company details
      const companyResponse = await companyAPI.getById(id);
      setCompany(companyResponse.data);

      // Fetch company products
      const productsResponse = await productAPI.getByCompany(id);
      setProducts(productsResponse.data);
    } catch (err) {
      setError("Failed to load company profile. Please try again.");
      console.error("Error fetching company data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (typeof price !== "number") return `${t("ID")} 0`;
    return `${t("ID")} ${price.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const calculateDiscount = (previousPrice, newPrice) => {
    if (!previousPrice || !newPrice) return 0;
    return Math.round(((previousPrice - newPrice) / previousPrice) * 100);
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

  if (!company) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Company not found.
      </Alert>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        {t("Back")}
      </Button>

      {/* Company Header */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={4} alignItems="center">
          {/* Company Logo */}
          <Grid xs={12} md={3}>
            {company.logo ? (
              <CardMedia
                component="img"
                image={company.logo}
                alt={company.name}
                sx={{
                  height: 200,
                  width: "100%",
                  objectFit: "cover",
                  borderRadius: 2,
                }}
              />
            ) : (
              <Box
                sx={{
                  height: 200,
                  bgcolor: "grey.100",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                }}
              >
                <Business sx={{ fontSize: 60, color: "grey.400" }} />
              </Box>
            )}
          </Grid>

          {/* Company Information */}
          <Grid xs={12} md={9}>
            <Typography variant="h3" component="h1" gutterBottom>
              {company.name}
            </Typography>

            {company.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {company.description}
              </Typography>
            )}

            <Grid spacing={2}>
              {company.address && (
                <Grid xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOn color="primary" />
                    <Typography variant="body1">{company.address}</Typography>
                  </Box>
                </Grid>
              )}

              {company.phone && (
                <Grid xs={12} sm={6}>
                  <br />
                  <Box display="flex" alignItems="center" gap={1}>
                    <Phone color="primary" />
                    <Typography variant="body1">{company.phone}</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Section */}
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <ShoppingCartIcon
            sx={{ fontSize: 32, mr: 2, color: "primary.main" }}
          />
          <Typography variant="h4" gutterBottom>
            {t("Products")} ({products.length})
          </Typography>
        </Box>

        {products.length > 0 ? (
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid display="flex" key={product._id}>
                <Card
                  component="a"
                  href={`/products/${product._id}`}
                  sx={{
                    width: "250px",
                    height: "100%",
                    textDecoration: "none",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "scale(1.02)" },
                  }}
                >
                  {product.image && (
                    <CardMedia
                      component="img"
                      height="200"
                      sx={{ objectFit: "contain" }}
                      image={product.image}
                      alt={product.name}
                    />
                  )}
                  {!product.image && (
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      sx={{ height: 200, width: "100%", bgcolor: "grey.100" }}
                    >
                      <StorefrontIcon
                        sx={{ fontSize: 60, color: "grey.400" }}
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
                      {product.name ? product.name : "\u00A0"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                      sx={{ minHeight: 20 }}
                    >
                      {product.type ? product.type : "\u00A0"}
                    </Typography>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box>
                        {product.previousPrice &&
                        product.previousPrice > product.newPrice ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              textDecoration: "line-through",
                              minHeight: 20,
                            }}
                          >
                            {formatPrice(product.previousPrice)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ minHeight: 20 }}>
                            {"\u00A0"}
                          </Typography>
                        )}
                        <Typography variant="h6" color="green">
                          {typeof product.newPrice === "number"
                            ? formatPrice(product.newPrice)
                            : "\u00A0"}
                        </Typography>
                      </Box>
                      {product.previousPrice &&
                      product.previousPrice > product.newPrice ? (
                        <Chip
                          icon={<LocalOfferIcon />}
                          label={`-${calculateDiscount(
                            product.previousPrice,
                            product.newPrice
                          )}%`}
                          color="error"
                          size="small"
                        />
                      ) : (
                        <Box sx={{ width: 40 }} />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">No products found for this company.</Alert>
        )}
      </Box>
    </Box>
  );
};

export default CompanyProfile;
