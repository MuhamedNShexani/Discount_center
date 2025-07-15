import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { companyAPI } from "../services/api";
import BusinessIcon from "@mui/icons-material/Business";
import PhoneIcon from "@mui/icons-material/Phone";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StorefrontIcon from "@mui/icons-material/Storefront";
import Loader from "../components/Loader";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";

const CompanyList = () => {
  const theme = useTheme();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getAll();
      setCompanies(response.data);
    } catch (err) {
      setError(
        err.response
          ? "Server error. Please try again later."
          : "Network error. Please check your connection."
      );
      console.error("Error fetching companies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = (company) => {
    navigate(`/companies/${company._id}`);
  };

  if (loading) return <Loader message="Loading companies..." />;
  if (error) return <Loader message={error} />;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <BusinessIcon
          sx={{
            fontSize: 40,
            mr: 2,
            color: theme.palette.mode === "dark" ? "contained" : "#714329",
          }}
        />
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {t("Companies")}
          </Typography>
          <Typography
            variant="subtitle1"
            color={theme.palette.mode === "dark" ? "contained" : "#714329"}
            gutterBottom
          >
            {t("Browse all companies and their products")}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={8}>
        {companies.map((company) => (
          <Grid xs={12} sm={6} md={4} key={company._id}>
            <Card
              sx={{
                height: 370,
                width: 320,
                mx: "auto",
                transition: "transform 0.2s",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                "&:hover": { transform: "scale(1.02)" },
              }}
              onClick={() => handleCompanyClick(company)}
            >
              {company.logo ? (
                <CardMedia
                  component="img"
                  height="170"
                  image={`${process.env.REACT_APP_BACKEND_URL}${company.logo}`}
                  alt={company.name}
                  sx={{
                    width: "100%",
                    height: 160,
                    objectFit: "fill",
                    borderRadius: "8px 8px 0 0",
                    m: 0,
                    p: 0,
                    "&:hover": { transform: "scale(1.02)" },
                  }}
                />
              ) : (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height={160}
                  width="100%"
                  bgcolor="grey.100"
                  sx={{ borderRadius: "8px 8px 0 0", m: 0, p: 0 }}
                >
                  <StorefrontIcon sx={{ fontSize: 80, color: "grey.400" }} />
                </Box>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h5"
                  component="div"
                  gutterBottom
                  sx={{ minHeight: 28 }}
                >
                  {company.name || "\u00A0"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minHeight: 20,
                  }}
                >
                  {company.address || "\u00A0"}
                </Typography>
                <Box
                  display="flex"
                  alignItems="center"
                  mb={1}
                  sx={{ minHeight: 24 }}
                >
                  {company.phone ? (
                    <>
                      <PhoneIcon
                        sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {company.phone}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" sx={{ minHeight: 20 }}>
                      {"\u00A0"}
                    </Typography>
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  sx={{
                    minHeight: 20,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {company.description || "\u00A0"}
                </Typography>
                <Box mt={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<VisibilityIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompanyClick(company);
                    }}
                  >
                    {t("View Profile")}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {companies.length === 0 && (
        <Alert severity="info">
          No companies found. Add some companies through the admin panel.
        </Alert>
      )}
    </Box>
  );
};

export default CompanyList;
