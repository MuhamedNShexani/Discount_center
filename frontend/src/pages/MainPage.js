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
  Alert,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  Select,
  Paper,
} from "@mui/material";
import { Link } from "react-router-dom";
import { companyAPI, productAPI } from "../services/api";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BusinessIcon from "@mui/icons-material/Business";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import Loader from "../components/Loader";
import { useTranslation } from "react-i18next";
import SearchIcon from "@mui/icons-material/Search";
import { useTheme } from "@mui/material/styles";

const MainPage = () => {
  const theme = useTheme();
  const [companies, setCompanies] = useState([]);
  const [productsByCompany, setProductsByCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [allTypes, setAllTypes] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Collect all product types for filter dropdown
  useEffect(() => {
    const types = new Set();
    Object.values(productsByCompany).forEach((products) => {
      products?.forEach((p) => {
        if (p.type) types.add(p.type);
      });
    });
    setAllTypes(Array.from(types));
  }, [productsByCompany]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch companies
      const companiesResponse = await companyAPI.getAll();
      const companiesData = companiesResponse.data;
      setCompanies(companiesData);

      // Fetch products for each company (limit to 10 per company)
      const productsMap = {};
      for (const company of companiesData) {
        const productsResponse = await productAPI.getByCompany(company._id);
        productsMap[company._id] = productsResponse.data.slice(0, 12); // Limit to 12 products
      }
      setProductsByCompany(productsMap);
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
  const filteredCompanies = companies.filter((company) => {
    // If company name matches search or any of its products match search/filters
    const companyNameMatch = company.name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const filteredProducts = (productsByCompany[company._id] || []).filter(
      (product) => {
        const nameMatch = product.name
          ?.toLowerCase()
          .includes(search.toLowerCase());
        const typeMatch = !type || product.type === type;
        const priceMatch =
          typeof product.newPrice === "number" &&
          product.newPrice >= priceRange[0] &&
          product.newPrice <= priceRange[1];
        return (nameMatch || companyNameMatch) && typeMatch && priceMatch;
      }
    );
    return filteredProducts.length > 0;
  });

  if (loading) return <Loader message="Loading companies..." />;
  if (error) return <Loader message={error} />;

  return (
    <Box>
      {/* Combined Title, Subtitle, and Filters */}
      <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
        <StorefrontIcon
          sx={{
            fontSize: 40,
            color: theme.palette.mode === "dark" ? "contained" : "#714329",
            mb: 1,
          }}
        />
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            color: theme.palette.mode === "dark" ? "contained" : "#714329",
          }}
        >
          {t("Market Products")}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            color: theme.palette.mode === "dark" ? "contained" : "#714329",
            mb: 2,
          }}
          gutterBottom
        >
          {t("Discover products from various companies")}
          <br />
          {t("Number of products that are available in the system")} :{" "}
          {Object.values(productsByCompany).flat().length || 0} {"     ,    "}
          {t("Number of companies that are available in the system")} :{" "}
          {companies.length}
        </Typography>
        {/* Redesigned Filters */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 3,
            mt: 1,
            mb: 0,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "center",
            alignItems: "center",
            minWidth: 320,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}
        >
          <TextField
            variant="outlined"
            placeholder={t("Search by product or company name")}
            label={t("Search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: 340,
              background: theme.palette.background.paper,
              input: { color: theme.palette.text.primary },
            }}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 140 }} size="small">
            <Select
              displayEmpty
              value={type}
              onChange={(e) => setType(e.target.value)}
              sx={{
                background: theme.palette.background.paper,
                color: theme.palette.text.primary,
              }}
              renderValue={(selected) =>
                selected ? t(selected) : t("All Types")
              }
            >
              <MenuItem value="">{t("All Types")}</MenuItem>
              {allTypes.map((tType) => (
                <MenuItem key={tType} value={tType}>
                  {t(tType)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="number"
            label={t("Min Price")}
            value={priceRange[0]}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPriceRange([val, priceRange[1]]);
            }}
            sx={{
              width: 110,
              background: theme.palette.background.paper,
              input: { color: theme.palette.text.primary },
            }}
            size="small"
            inputProps={{ min: 0 }}
          />
          <Typography sx={{ mx: 1 }}>{t("to")}</Typography>
          <TextField
            type="number"
            label={t("Max Price")}
            value={priceRange[1]}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPriceRange([priceRange[0], val]);
            }}
            sx={{
              width: 110,
              background: theme.palette.background.paper,
              input: { color: theme.palette.text.primary },
            }}
            size="small"
            inputProps={{ min: 0 }}
          />
          <Button
            variant={theme.palette.mode === "dark" ? "contained" : "contained"}
            color={theme.palette.mode === "dark" ? "primary" : "secondary"}
            onClick={() => {
              setSearch("");
              setType("");
              setPriceRange([0, 1000000]);
            }}
            sx={{
              height: 40,
              color: theme.palette.mode === "dark" ? "#fff" : "#fff",
              backgroundColor:
                theme.palette.mode === "dark"
                  ? theme.palette.primary.main
                  : undefined,
              "&:hover": {
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? theme.palette.primary.dark
                    : theme.palette.secondary.dark,
                color: "#fff",
              },
            }}
          >
            {t("Reset Filters")}
          </Button>
        </Paper>
      </Box>

      {filteredCompanies.map((company) => {
        // Filter products for this company based on the same logic as in filteredCompanies
        const filteredProducts = (productsByCompany[company._id] || []).filter(
          (product) => {
            const nameMatch = product.name
              ?.toLowerCase()
              .includes(search.toLowerCase());
            const companyNameMatch = company.name
              ?.toLowerCase()
              .includes(search.toLowerCase());
            const typeMatch = !type || product.type === type;
            const priceMatch =
              typeof product.newPrice === "number" &&
              product.newPrice >= priceRange[0] &&
              product.newPrice <= priceRange[1];
            return (nameMatch || companyNameMatch) && typeMatch && priceMatch;
          }
        );
        return (
          <Card
            key={company._id}
            sx={{
              mb: 4,
              p: 2,
              backgroundColor: (theme) => theme.palette.background.paper,
              border: "1px solid #D0B9A7",
            }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              {company.logo && (
                <CardMedia
                  component="img"
                  sx={{ width: 60, height: 60, mr: 2, borderRadius: 1 }}
                  image={`${process.env.REACT_APP_BACKEND_URL}${company.logo}`}
                  alt={company.name}
                />
              )}
              {!company.logo && (
                <BusinessIcon sx={{ fontSize: 60, mr: 2, color: "#714329" }} />
              )}
              <Box flexGrow={1}>
                <Typography
                  variant="h5"
                  component={Link}
                  to={`/companies/${company._id}`}
                  sx={{
                    textDecoration: "none",
                    color: (theme) => theme.palette.text.primary,
                    "&:hover": { color: (theme) => theme.palette.primary.main },
                  }}
                >
                  {company.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "#B08463" }}>
                  {company.address}
                </Typography>
              </Box>
              <Button
                variant="contained"
                component={Link}
                to={`/companies/${company._id}`}
                startIcon={<ShoppingCartIcon />}
                sx={{
                  ml: 2,
                  backgroundColor: (theme) => theme.palette.primary.main,
                  color: (theme) =>
                    theme.palette.getContrastText(theme.palette.primary.main),
                  "&:hover": {
                    backgroundColor: (theme) => theme.palette.primary.dark,
                    color: (theme) =>
                      theme.palette.getContrastText(theme.palette.primary.dark),
                  },
                }}
              >
                {t("More Products")}
              </Button>
            </Box>

            <Grid container spacing={2}>
              {filteredProducts.map((product) => (
                <Grid display={"flex"} key={product._id}>
                  <Card
                    component={Link}
                    to={`/products/${product._id}`}
                    sx={{
                      width: "250px",
                      height: "100%",
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 4px 12px rgba(113, 67, 41, 0.1)",
                      "&:hover": {
                        transform: "translateY(-8px) scale(1.05)",
                        boxShadow: "0 12px 24px rgba(113, 67, 41, 0.2)",
                      },
                    }}
                  >
                    {product.previousPrice &&
                      product.previousPrice > product.newPrice && (
                        <Chip
                          icon={<LocalOfferIcon />}
                          label={`-${calculateDiscount(
                            product.previousPrice,
                            product.newPrice
                          )}%`}
                          color="error"
                          size="small"
                          sx={{
                            position: "relative",
                            top: 0,
                            right: -180,
                          }}
                        />
                      )}
                    {product.image && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={`${process.env.REACT_APP_BACKEND_URL}${product.image}`}
                        alt={product.name}
                        sx={{
                          borderRadius: "16px 16px 0 0",
                          transition: "all 0.3s ease",
                          objectFit: "contain",
                          "&:hover": {
                            transform: "scale(1.1)",
                            filter: "brightness(1.1)",
                          },
                        }}
                      />
                    )}
                    {!product.image && (
                      <Box
                        sx={{
                          height: 140,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: (theme) =>
                            theme.palette.background.default,
                          borderRadius: "16px 16px 0 0",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            backgroundColor: "#D0B9A7",
                            transform: "scale(1.05)",
                          },
                        }}
                      >
                        <ShoppingCartIcon
                          sx={{
                            fontSize: 60,
                            color: "#B08463",
                            transition: "all 0.3s ease",
                          }}
                        />
                      </Box>
                    )}
                    <CardContent sx={{ borderRadius: "0 0 16px 16px" }}>
                      <Typography
                        variant="h6"
                        component="div"
                        gutterBottom
                        color="black"
                        backgroundColor="orange"
                        width="100%"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        textAlign="center"
                        fontWeight="bold"
                        sx={{ minHeight: 28, fontSize: "20px" }}
                      >
                        {product.name || "\u00A0"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "#B08463", minHeight: 20 }}
                        gutterBottom
                      >
                        {product.type || "\u00A0"}
                      </Typography>
                      <Box alignItems="center" justifyContent="space-between">
                        <Box>
                          {product.previousPrice &&
                          product.previousPrice > product.newPrice ? (
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              alignItems="center"
                              sx={{
                                color: "#B08463",
                                fontSize: "20px",
                                textDecoration: "line-through",
                                minHeight: 20,
                                textAlign: "left",
                              }}
                            >
                              {formatPrice(product.previousPrice)}
                            </Typography>
                          ) : (
                            <Typography
                              alignItems="center"
                              variant="body2"
                              sx={{ minHeight: 20, textAlign: "center" }}
                            >
                              {"\u00A0"}
                            </Typography>
                          )}
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            alignItems="center"
                            sx={{
                              fontSize: "25px",
                              textAlign: "center",
                              color: (theme) =>
                                theme.palette.mode === "dark"
                                  ? theme.palette.info.light
                                  : theme.palette.success.main,
                            }}
                          >
                            {formatPrice(product.newPrice)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Card>
        );
      })}

      {companies.length === 0 && (
        <Alert severity="info">
          No companies found. Add some companies through the admin panel.
        </Alert>
      )}
    </Box>
  );
};

export default MainPage;
