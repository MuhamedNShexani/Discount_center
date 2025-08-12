import React, { useState, useEffect } from "react";
import { adminAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ShoppingCart as ProductsIcon,
  Store as StoresIcon,
  Business as BrandsIcon,
  CardGiftcard as GiftsIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

const AdminPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalStores: 0,
    totalBrands: 0,
    totalGifts: 0,
    totalViews: 0,
    totalLikes: 0,
  });

  // Check if user is admin
  const isAdmin = user?.email === "mshexani45@gmail.com";

  useEffect(() => {
    // Check authentication and admin status
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!isAdmin) {
      navigate("/");
      return;
    }

    setLoading(false);
    // Load admin stats here
    loadAdminStats();
  }, [isAuthenticated, isAdmin, navigate]);

  const loadAdminStats = async () => {
    try {
      const res = await adminAPI.getStats();
      const data = res.data || {};
      setStats({
        totalUsers: data.totalUsers || 0,
        totalProducts: data.totalProducts || 0,
        totalStores: data.totalStores || 0,
        totalBrands: data.totalBrands || 0,
        totalGifts: data.totalGifts || 0,
        totalViews: data.totalViews || 0,
        totalLikes: data.totalLikes || 0,
      });
    } catch (error) {
      console.error("Error loading admin stats:", error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          {t("Access denied. Admin privileges required.")}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          <DashboardIcon sx={{ mr: 2, verticalAlign: "middle" }} />
          {t("Admin Dashboard")}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {t("Welcome back, Admin")} - {user?.firstName} {user?.lastName}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "primary.light", color: "white" }}>
            <CardContent>
              <Typography variant="h4" component="div">
                {stats.totalUsers}
              </Typography>
              <Typography variant="body2">
                <PeopleIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                {t("Total Users")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "secondary.light", color: "white" }}>
            <CardContent>
              <Typography variant="h4" component="div">
                {stats.totalProducts}
              </Typography>
              <Typography variant="body2">
                <ProductsIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                {t("Total Products")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "success.light", color: "white" }}>
            <CardContent>
              <Typography variant="h4" component="div">
                {stats.totalStores}
              </Typography>
              <Typography variant="body2">
                <StoresIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                {t("Total Stores")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "warning.light", color: "white" }}>
            <CardContent>
              <Typography variant="h4" component="div">
                {stats.totalBrands}
              </Typography>
              <Typography variant="body2">
                <BrandsIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                {t("Total Brands")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "info.light", color: "white" }}>
            <CardContent>
              <Typography variant="h4" component="div">
                {stats.totalGifts}
              </Typography>
              <Typography variant="body2">
                <GiftsIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                {t("Total Gifts")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "error.light", color: "white" }}>
            <CardContent>
              <Typography variant="h4" component="div">
                {stats.totalViews}
              </Typography>
              <Typography variant="body2">{t("Total Views")}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "success.dark", color: "white" }}>
            <CardContent>
              <Typography variant="h4" component="div">
                {stats.totalLikes}
              </Typography>
              <Typography variant="body2">{t("Total Likes")}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Admin Tabs */}
      <Paper sx={{ width: "100%" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t("Dashboard")} />
          <Tab label={t("Users")} />
          <Tab label={t("Products")} />
          <Tab label={t("Stores")} />
          <Tab label={t("Brands")} />
          <Tab label={t("Gifts")} />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                {t("System Overview")}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {t("Recent Activity")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t("No recent activity to display")}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {t("System Status")}
                      </Typography>
                      <Chip label={t("Online")} color="success" />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="h5">{t("User Management")}</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    /* Add user logic */
                  }}
                >
                  {t("Add User")}
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("Name")}</TableCell>
                      <TableCell>{t("Email")}</TableCell>
                      <TableCell>{t("Status")}</TableCell>
                      <TableCell>{t("Actions")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>John Doe</TableCell>
                      <TableCell>john@example.com</TableCell>
                      <TableCell>
                        <Chip
                          label={t("Active")}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                {t("Product Management")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("Product management interface will be implemented here")}
              </Typography>
            </Box>
          )}

          {activeTab === 3 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                {t("Store Management")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("Store management interface will be implemented here")}
              </Typography>
            </Box>
          )}

          {activeTab === 4 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                {t("Brand Management")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("Brand management interface will be implemented here")}
              </Typography>
            </Box>
          )}

          {activeTab === 5 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                {t("Gift Management")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("Gift management interface will be implemented here")}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminPage;
