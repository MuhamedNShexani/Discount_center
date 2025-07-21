import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Container,
  Chip,
  Avatar,
  Fade,
  Slide,
  Divider,
  useTheme,
} from "@mui/material";
import { marketAPI, productAPI, companyAPI } from "../services/api";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BusinessIcon from "@mui/icons-material/Business";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import StoreIcon from "@mui/icons-material/Store";
import { useTranslation } from "react-i18next";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const DataEntryForm = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [activeListTab, setActiveListTab] = useState(0); // State for list tabs
  const [markets, setMarkets] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Refs for file inputs
  const companyLogoFileRef = useRef(null);
  const productImageFileRef = useRef(null);
  const editProductImageFileRef = useRef(null);
  const marketLogoFileRef = useRef(null);

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    name: "",
    logo: "",
    address: "",
    phone: "",
    description: "",
  });
  // Market form state
  const [marketForm, setMarketForm] = useState({
    name: "",
    logo: "",
    address: "",
    phone: "",
    description: "",
  });

  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
    type: "",
    image: "",
    previousPrice: "",
    newPrice: "",
    marketId: "",
    expireDate: "",
  });

  // File upload state
  const [selectedCompanyLogo, setSelectedCompanyLogo] = useState(null);
  const [selectedProductImage, setSelectedProductImage] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedExcelFile, setSelectedExcelFile] = useState(null);
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [selectedEditImage, setSelectedEditImage] = useState(null);
  const [selectedMarketLogo, setSelectedMarketLogo] = useState(null);

  const [selectedMarketFilter, setSelectedMarketFilter] = useState("");
  const [editDialog, setEditDialog] = useState({
    open: false,
    type: "",
    data: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: "",
    data: null,
  });

  // Edit dialog form state
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchMarkets();
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchProducts(selectedMarketFilter);
  }, [selectedMarketFilter]);

  const fetchMarkets = async () => {
    try {
      const response = await marketAPI.getAll();
      setMarkets(response.data);
    } catch (err) {
      console.error("Error fetching markets:", err);
    }
  };

  const fetchProducts = async (marketId) => {
    try {
      if (marketId) {
        const response = await productAPI.getByMarket(marketId);
        setProducts(response.data);
      } else {
        const response = await productAPI.getAll();
        setProducts(response.data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companyAPI.getAll();
      setCompanies(response.data);
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setMessage({ type: "", text: "" });
  };

  const handleMarketFormChange = (e) => {
    setMarketForm({
      ...marketForm,
      [e.target.name]: e.target.value,
    });
  };

  // Handler for the new list tabs
  const handleListTabChange = (event, newValue) => {
    setActiveListTab(newValue);
  };

  const handleCompanyFormChange = (e) => {
    setCompanyForm({
      ...companyForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleFilterChange = (e) => {
    setSelectedMarketFilter(e.target.value);
  };

  const handleProductFormChange = (e) => {
    setProductForm({
      ...productForm,
      [e.target.name]: e.target.value,
    });
  };

  // Handle file selection for company logo
  const handleCompanyLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedCompanyLogo(file);
    }
  };

  // Handle file selection for product image
  const handleProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedProductImage(file);
    }
  };

  // Handle file selection for edit product image
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedEditImage(file);
    }
  };

  // Upload company logo
  const uploadCompanyLogo = async (file) => {
    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await fetch(`${API_URL}/api/companies/upload-logo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading logo:", error);
      throw error;
    }
  };

  // Upload market logo
  const uploadMarketLogo = async (file) => {
    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await fetch(`${API_URL}/api/markets/upload-logo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      throw error;
    }
  };
  // Upload product image
  const uploadProductImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_URL}/api/products/upload-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Handle Excel file selection
  const handleExcelFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedExcelFile(file);
    }
  };

  // Process Excel file and create products
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!selectedExcelFile) {
      setMessage({
        type: "error",
        text: t("Please select an Excel file."),
      });
      return;
    }

    setBulkUploadLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("excelFile", selectedExcelFile);

      const response = await fetch(`${API_URL}/api/products/bulk-upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Bulk upload failed");
      }

      const data = await response.json();
      setMessage({
        type: "success",
        text: t("Successfully uploaded {{count}} products", {
          count: data.createdCount,
        }),
      });

      if (data.errors && data.errors.length > 0) {
        setMessage({
          type: "warning",
          text: t("Upload complete with {{count}} errors", {
            count: data.errors.length,
          }),
        });
      }

      fetchProducts(selectedMarketFilter); // Refresh products list
      setSelectedExcelFile(null); // Clear file input
    } catch (err) {
      setMessage({
        type: "error",
        text: "Failed to upload products. Please check your Excel file format.",
      });
      console.error("Error uploading products:", err);
    } finally {
      setBulkUploadLoading(false);
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!selectedCompanyLogo) {
      setMessage({ type: "error", text: t("Please select a logo file.") });
      setLoading(false);
      return;
    }

    try {
      setUploadLoading(true);
      const logoUrl = await uploadCompanyLogo(selectedCompanyLogo);
      console.log("Logo uploaded successfully:", logoUrl);
      setUploadLoading(false);

      const companyData = {
        ...companyForm,
        logo: logoUrl,
      };
      console.log("Company data to be saved:", companyData);

      const result = await companyAPI.create(companyData);
      console.log("Company created successfully:", result);
      setMessage({ type: "success", text: t("Company created successfully!") });
      setCompanyForm({
        name: "",
        logo: "",
        address: "",
        phone: "",
        description: "",
      });
      setSelectedCompanyLogo(null);
      if (companyLogoFileRef.current) {
        companyLogoFileRef.current.value = "";
      }
      fetchCompanies(); // Refresh companies list
    } catch (err) {
      console.error("Error creating company:", err);
      console.error("Error response:", err.response?.data);
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.message ||
          t("Failed to create company. Please try again."),
      });
    } finally {
      setLoading(false);
      setUploadLoading(false);
    }
  };
  const handleMarketSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!selectedMarketLogo) {
      setMessage({ type: "error", text: t("Please select a logo file.") });
      setLoading(false);
      return;
    }

    try {
      setUploadLoading(true);
      const logoUrl = await uploadMarketLogo(selectedMarketLogo);
      setUploadLoading(false);

      const marketData = {
        ...marketForm,
        logo: logoUrl,
      };

      await marketAPI.create(marketData);
      setMessage({ type: "success", text: t("Market created successfully!") });
      setMarketForm({
        name: "",
        logo: "",
        address: "",
        phone: "",
        description: "",
      });
      setSelectedMarketLogo(null);
      fetchMarkets(); // Refresh markets list
    } catch (err) {
      setMessage({
        type: "error",
        text: t("Failed to create market. Please try again."),
      });
      console.error("Error creating market:", err);
    } finally {
      setLoading(false);
      setUploadLoading(false);
    }
  };
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!selectedProductImage) {
      setMessage({
        type: "error",
        text: t("Please select an image file."),
      });
      return;
    }

    try {
      setUploadLoading(true);
      const imageUrl = await uploadProductImage(selectedProductImage);
      setUploadLoading(false);

      const productData = {
        ...productForm,
        image: imageUrl,
        previousPrice: parseFloat(productForm.previousPrice) || null,
        newPrice: parseFloat(productForm.newPrice) || null,
        expireDate: productForm.expireDate
          ? new Date(productForm.expireDate).toISOString()
          : null,
        companyId: productForm.companyId,
        marketId: productForm.marketId,
      };

      await productAPI.create(productData);
      setMessage({ type: "success", text: t("Product created successfully!") });
      setProductForm({
        name: "",
        type: "",
        image: "",
        previousPrice: "",
        newPrice: "",
        marketId: "",
        expireDate: "",
      });
      setSelectedProductImage(null);
      if (productImageFileRef.current) {
        productImageFileRef.current.value = "";
      }
      fetchProducts(selectedMarketFilter);
    } catch (err) {
      setMessage({
        type: "error",
        text: t("Failed to create product. Please try again."),
      });
      console.error("Error creating product:", err);
    } finally {
      setLoading(false);
      setUploadLoading(false);
    }
  };

  // Open edit dialog and set form data
  const handleEditOpen = (type, data) => {
    if (type === "company") {
      setEditForm({
        name: data.name,
        logo: data.logo,
        address: data.address,
        phone: data.phone,
        description: data.description || "",
      });
    } else if (type === "market") {
      setEditForm({
        name: data.name,
        logo: data.logo,
        address: data.address,
        phone: data.phone,
        description: data.description || "",
      });
    } else if (type === "product") {
      setEditForm({
        name: data.name,
        type: data.type,
        image: data.image,
        previousPrice: data.previousPrice,
        newPrice: data.newPrice,
        marketId: data.marketId?._id || data.marketId,
        companyId: data.companyId?._id || data.companyId,
        expireDate: data.expireDate
          ? new Date(data.expireDate).toISOString().split("T")[0]
          : "",
      });
    }

    setEditDialog({ open: true, type, data });
  };

  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    try {
      setEditLoading(true);
      setMessage({ type: "", text: "" });

      if (editDialog.type === "company") {
        let logoUrl = editForm.logo;
        if (selectedEditImage) {
          logoUrl = await uploadCompanyLogo(selectedEditImage);
        }
        await companyAPI.update(editDialog.data._id, {
          ...editForm,
          logo: logoUrl,
        });
        setMessage({
          type: "success",
          text: t("Company updated successfully!"),
        });
        fetchCompanies();
      } else if (editDialog.type === "market") {
        let logoUrl = editForm.logo;
        if (selectedEditImage) {
          logoUrl = await uploadMarketLogo(selectedEditImage);
        }

        await marketAPI.update(editDialog.data._id, {
          ...editForm,
          logo: logoUrl,
        });
        setMessage({
          type: "success",
          text: t("Market updated successfully!"),
        });
        fetchMarkets();
      } else if (editDialog.type === "product") {
        let imageUrl = editForm.image;
        if (selectedEditImage) {
          imageUrl = await uploadProductImage(selectedEditImage);
        }

        const productUpdateData = {
          ...editForm,
          image: imageUrl,
          previousPrice: parseFloat(editForm.previousPrice) || null,
          newPrice: parseFloat(editForm.newPrice) || null,
          expireDate: editForm.expireDate
            ? new Date(editForm.expireDate).toISOString()
            : null,
          companyId: editForm.companyId,
          marketId: editForm.marketId,
        };

        await productAPI.update(editDialog.data._id, productUpdateData);
        setMessage({
          type: "success",
          text: t("Product updated successfully!"),
        });
        fetchProducts(selectedMarketFilter);
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: t("Failed to update. Please try again."),
      });
      console.error("Error updating:", err);
    } finally {
      setEditLoading(false);
      setEditDialog({ open: false, type: "", data: null });
      setSelectedEditImage(null);
    }
  };

  const handleDeleteCompanyConfirm = async () => {
    setDeleteLoading(true);
    try {
      if (deleteDialog.type === "company") {
        await companyAPI.delete(deleteDialog.data._id);
        setMessage({
          type: "success",
          text: t("Company deleted successfully!"),
        });
        fetchCompanies();
        fetchProducts(selectedMarketFilter); // Refresh products as some might be deleted
      } else if (deleteDialog.type === "product") {
        await productAPI.delete(deleteDialog.data._id);
        setMessage({
          type: "success",
          text: t("Product deleted successfully!"),
        });
        fetchProducts(selectedMarketFilter);
      }
      setDeleteDialog({ open: false, type: "", data: null });
    } catch (err) {
      console.log("Full error from backend:", err);
      console.log("Error response object:", err.response);
      let errorMsg = t("Failed to delete. Please try again.");
      if (
        err.response?.data?.msg ===
        "Cannot delete company. It has associated products. Please delete the products first."
      ) {
        errorMsg = t(
          "Cannot delete company. It has associated products. Please delete the products first."
        );
      }
      setMessage({
        type: "error",
        text: errorMsg,
      });
      console.error("Error deleting:", err);
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleDeleteMarketConfirm = async () => {
    setDeleteLoading(true);
    try {
      if (deleteDialog.type === "market") {
        await marketAPI.delete(deleteDialog.data._id);
        setMessage({
          type: "success",
          text: t("Market deleted successfully!"),
        });
        fetchMarkets();
        fetchProducts(selectedMarketFilter); // Refresh products as some might be deleted
      } else if (deleteDialog.type === "product") {
        await productAPI.delete(deleteDialog.data._id);
        setMessage({
          type: "success",
          text: t("Product deleted successfully!"),
        });
        fetchProducts(selectedMarketFilter);
      }
      setDeleteDialog({ open: false, type: "", data: null });
    } catch (err) {
      console.log("Full error from backend:", err);
      console.log("Error response object:", err.response);
      let errorMsg = t("Failed to delete. Please try again.");
      if (
        err.response?.data?.msg ===
        "Cannot delete market. It has associated products. Please delete the products first."
      ) {
        errorMsg = t(
          "Cannot delete market. It has associated products. Please delete the products first."
        );
      }
      setMessage({
        type: "error",
        text: errorMsg,
      });
      console.error("Error deleting:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 10 }}>
      {/* Enhanced Admin Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: 4,
          overflow: "hidden",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
              : "linear-gradient(135deg, #52b788 0%, #40916c 100%)",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 12px 40px rgba(0,0,0,0.3)"
              : "0 12px 40px rgba(0,0,0,0.1)",
        }}
      >
        <Box sx={{ p: 4, color: "white", position: "relative" }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mr: 3,
                    background: "linear-gradient(135deg, #ffffff20, #ffffff40)",
                    backdropFilter: "blur(10px)",
                    border: "3px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <DashboardIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Typography
                    variant="h2"
                    component="h1"
                    gutterBottom
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: { xs: "2rem", md: "2.5rem" },
                      textShadow: "0 4px 8px rgba(0,0,0,0.3)",
                      mb: 1,
                    }}
                  >
                    {t("Admin Dashboard")}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "white",
                      opacity: 0.9,
                      fontSize: "1.125rem",
                      textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    {t("Manage markets and products efficiently")}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                display="flex"
                gap={2}
                justifyContent={{ xs: "center", md: "flex-end" }}
              >
                <Chip
                  icon={<StoreIcon />}
                  label={`${t("Markets")}(${markets.length})`}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "white",
                    fontWeight: 600,
                    backdropFilter: "blur(10px)",
                  }}
                />
                <Chip
                  icon={<InventoryIcon />}
                  label={`${t("Products")}(${products.length}) `}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "white",
                    fontWeight: 600,
                    backdropFilter: "blur(10px)",
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Enhanced Main Content Card */}
      <Card
        sx={{
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
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Enhanced Tabs */}
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              borderRadius: 2,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(82, 183, 136, 0.05)",
              border: `1px solid ${
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(82, 183, 136, 0.1)"
              }`,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                p: 1,
                "& .MuiTab-root": {
                  borderRadius: 2,
                  mx: 0.5,
                  transition: "all 0.3s ease",
                  fontWeight: 600,
                  "&.Mui-selected": {
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#52b788" : "#52b788",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(82, 183, 136, 0.3)",
                  },
                },
                "& .MuiTabs-indicator": {
                  display: "none",
                },
              }}
            >
              <Tab
                label={t("Add Market")}
                icon={<StoreIcon />}
                iconPosition="start"
                sx={{ textTransform: "none" }}
              />
              <Tab
                label={t("Add Company")}
                icon={<BusinessIcon />}
                iconPosition="start"
                sx={{ textTransform: "none" }}
              />
              <Tab
                label={t("Add Product")}
                icon={<ShoppingCartIcon />}
                iconPosition="start"
                sx={{ textTransform: "none" }}
              />
              <Tab
                label={t("Bulk Upload")}
                icon={<CloudUploadIcon />}
                iconPosition="start"
                sx={{ textTransform: "none" }}
              />
            </Tabs>
          </Paper>

          {message.text && (
            <Fade in={true}>
              <Alert
                severity={message.type}
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? message.type === "success"
                        ? "#1b5e20"
                        : "#d32f2f"
                      : undefined,
                }}
              >
                {message.text}
              </Alert>
            </Fade>
          )}

          {activeTab === 0 && (
            <Box component="form" onSubmit={handleMarketSubmit}>
              <Grid container spacing={2}>
                {/* Company Form Fields */}
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Market Name")}
                    name="name"
                    value={marketForm.name}
                    onChange={handleMarketFormChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <StoreIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label={t("Address")}
                    name="address"
                    value={marketForm.address}
                    onChange={handleMarketFormChange}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Phone")}
                    name="phone"
                    value={marketForm.phone}
                    onChange={handleMarketFormChange}
                  />
                </Grid>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label={t("Description")}
                    name="description"
                    value={marketForm.description}
                    onChange={handleMarketFormChange}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid xs={12}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="company-logo-file"
                    type="file"
                    onChange={handleCompanyLogoChange}
                  />
                  <label htmlFor="company-logo-file">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<AddIcon />}
                    >
                      {selectedMarketLogo
                        ? selectedMarketLogo.name
                        : t("Upload Logo")}
                    </Button>
                  </label>
                </Grid>
                <Grid xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || uploadLoading}
                    startIcon={
                      loading || uploadLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <AddIcon />
                      )
                    }
                    fullWidth
                  >
                    {loading
                      ? t("Creating...")
                      : uploadLoading
                      ? t("Uploading...")
                      : t("Add Market")}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
          {activeTab === 1 && (
            <Box component="form" onSubmit={handleCompanySubmit}>
              <Grid container spacing={2}>
                {/* Company Form Fields */}
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Company Name")}
                    name="name"
                    value={companyForm.name}
                    onChange={handleCompanyFormChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label={t("Address")}
                    name="address"
                    value={companyForm.address}
                    onChange={handleCompanyFormChange}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Phone")}
                    name="phone"
                    value={companyForm.phone}
                    onChange={handleCompanyFormChange}
                  />
                </Grid>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label={t("Description")}
                    name="description"
                    value={companyForm.description}
                    onChange={handleCompanyFormChange}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid xs={12}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="company-logo-file"
                    type="file"
                    ref={companyLogoFileRef}
                    onChange={handleCompanyLogoChange}
                  />
                  <label htmlFor="company-logo-file">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<AddIcon />}
                    >
                      {selectedCompanyLogo
                        ? selectedCompanyLogo.name
                        : t("Upload Logo")}
                    </Button>
                  </label>
                </Grid>
                <Grid xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || uploadLoading}
                    startIcon={
                      loading || uploadLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <AddIcon />
                      )
                    }
                    fullWidth
                  >
                    {loading
                      ? t("Creating...")
                      : uploadLoading
                      ? t("Uploading...")
                      : t("Add Company")}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
          {activeTab === 2 && (
            <Box component="form" onSubmit={handleProductSubmit}>
              <Grid container spacing={2}>
                {/* Product Form Fields */}
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Product Name")}
                    name="name"
                    value={productForm.name}
                    onChange={handleProductFormChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ShoppingCartIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Product Type")}
                    name="type"
                    value={productForm.type}
                    onChange={handleProductFormChange}
                    required
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Previous Price")}
                    name="previousPrice"
                    type="number"
                    value={productForm.previousPrice}
                    onChange={handleProductFormChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">ID</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("New Price")}
                    name="newPrice"
                    type="number"
                    value={productForm.newPrice}
                    onChange={handleProductFormChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">ID</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel shrink>{t("Market")}</InputLabel>
                    <Select
                      name="marketId"
                      value={productForm.marketId}
                      onChange={handleProductFormChange}
                      label={t("Market")}
                      displayEmpty
                      labelId="add-product-market-label"
                    >
                      <MenuItem value="">
                        <em>{t("Select Market")}</em>
                      </MenuItem>
                      {markets.map((market) => (
                        <MenuItem key={market._id} value={market._id}>
                          {market.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel shrink>{t("Company")}</InputLabel>
                    <Select
                      name="companyId"
                      value={productForm.companyId}
                      onChange={handleProductFormChange}
                      label={t("Company")}
                      displayEmpty
                      sx={{
                        width: "150px",
                      }}
                      labelId="add-product-market-label"
                    >
                      <MenuItem value="">
                        <em>{t("Select Company")}</em>
                      </MenuItem>
                      {companies.map((company) => (
                        <MenuItem key={company._id} value={company._id}>
                          {company.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Expire Date")}
                    name="expireDate"
                    type="date"
                    value={productForm.expireDate}
                    onChange={handleProductFormChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid xs={12}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="product-image-file"
                    type="file"
                    ref={productImageFileRef}
                    onChange={handleProductImageChange}
                  />
                  <label htmlFor="product-image-file">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<AddIcon />}
                    >
                      {selectedProductImage
                        ? selectedProductImage.name
                        : t("Upload Image")}
                    </Button>
                  </label>
                </Grid>
                <Grid xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || uploadLoading}
                    startIcon={
                      loading || uploadLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    fullWidth
                  >
                    {loading
                      ? t("Creating...")
                      : uploadLoading
                      ? t("Uploading...")
                      : t("Add Product")}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 3 && (
            <Box component="form" onSubmit={handleBulkUpload}>
              <Grid container spacing={2}>
                {/* Bulk Upload Fields */}
                <Grid xs={12}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "#714329" }}
                  >
                    {t("Bulk Upload Products")}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#B08463", mb: 2 }}>
                    {t(
                      "Upload an Excel file (.xlsx) with product data. The file should have columns: Name, Type, Previous Price, New Price, Company ID, Expire Date (YYYY-MM-DD)"
                    )}
                  </Typography>
                </Grid>
                <Grid xs={12}>
                  <input
                    accept=".xlsx,.xls"
                    style={{ display: "none" }}
                    id="excel-file"
                    type="file"
                    onChange={handleExcelFileChange}
                  />
                  <label htmlFor="excel-file">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<AddIcon />}
                      sx={{ mb: 2 }}
                    >
                      {selectedExcelFile
                        ? selectedExcelFile.name
                        : t("Select Excel File")}
                    </Button>
                  </label>
                </Grid>
                <Grid xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={bulkUploadLoading || !selectedExcelFile}
                    startIcon={
                      bulkUploadLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <AddIcon />
                      )
                    }
                    fullWidth
                  >
                    {bulkUploadLoading
                      ? t("Uploading...")
                      : t("Upload Products")}
                  </Button>
                </Grid>
                <Grid xs={12}>
                  <Typography variant="body2" sx={{ color: "#B08463", mt: 2 }}>
                    <strong>{t("Excel Format:")}</strong>
                    <br />• {t("Column A: Product Name (required)")}
                    <br />• {t("Column B: Product Type (required)")}
                    <br />• {t("Column C: Previous Price (optional)")}
                    <br />• {t("Column D: New Price (required)")}
                    <br />• {t("Column E: Company ID (required)")}
                    <br />•{" "}
                    {t("Column F: Expire Date (optional, YYYY-MM-DD format)")}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* NEW: Tabbed section for lists */}
      <Card sx={{ mt: 5 }}>
        <CardContent>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              color:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
                  : "linear-gradient(135deg, #52b788 0%, #40916c 100%)",
            }}
          >
            {t("Data Lists")}
          </Typography>
          <Tabs
            value={activeListTab}
            onChange={handleListTabChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{ mb: 2 }}
          >
            <Tab
              label={t("Markets")}
              icon={<StoreIcon />}
              iconPosition="start"
            />
            <Tab
              label={t("Companies")}
              icon={<BusinessIcon />}
              iconPosition="start"
            />
            <Tab
              label={t("Products")}
              icon={<ShoppingCartIcon />}
              iconPosition="start"
            />
          </Tabs>

          {/* Company List Panel */}
          {activeListTab === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      }}
                    >
                      {t("No.")}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      }}
                    >
                      {t("Name")}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      }}
                    >
                      {t("Logo")}
                    </TableCell>
                    {/* <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      }}
                    >
                      {t("Address")}
                    </TableCell> */}
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      }}
                    >
                      {t("Phone")}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      }}
                    >
                      {t("Description")}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      }}
                    >
                      {t("Actions")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {markets.map((market, idx) => (
                    <TableRow key={market._id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell
                        width={200}
                        sx={{ fontSize: "18px", fontWeight: "bold" }}
                      >
                        {market.name}
                      </TableCell>
                      <TableCell>
                        {market.logo && (
                          <img
                            src={
                              market.logo.startsWith("http")
                                ? market.logo
                                : `${API_URL}${market.logo}`
                            }
                            alt={market.name}
                            width={80}
                            height={80}
                            style={{
                              objectFit: "cover",
                              borderRadius: "4px",
                            }}
                          />
                        )}
                      </TableCell>
                      {/* <TableCell>{market.address}</TableCell> */}
                      <TableCell>{market.phone}</TableCell>
                      <TableCell
                        width="100px"
                        height="100px"
                        sx={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {market.description}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleEditOpen("market", market)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              type: "market",
                              data: market,
                            })
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Company List Panel */}
          {activeListTab === 1 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      }}
                    >
                      {t("No.")}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      }}
                    >
                      {t("Name")}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      }}
                    >
                      {t("Logo")}
                    </TableCell>
                    {/* <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      }}
                    >
                      {t("Address")}
                    </TableCell> */}
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      }}
                    >
                      {t("Phone")}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      }}
                    >
                      {t("Description")}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      }}
                    >
                      {t("Actions")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.map((company, idx) => (
                    <TableRow key={company._id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell
                        width={200}
                        sx={{ fontSize: "18px", fontWeight: "bold" }}
                      >
                        {company.name}
                      </TableCell>
                      <TableCell>
                        {company.logo && (
                          <img
                            src={
                              company.logo.startsWith("http")
                                ? company.logo
                                : `${API_URL}${company.logo}`
                            }
                            alt={company.name}
                            width={80}
                            height={80}
                            style={{
                              objectFit: "cover",
                              borderRadius: "4px",
                            }}
                          />
                        )}
                      </TableCell>
                      {/* <TableCell>{market.address}</TableCell> */}
                      <TableCell>{company.phone}</TableCell>
                      <TableCell
                        width="100px"
                        height="100px"
                        sx={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {company.description}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleEditOpen("company", company)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              type: "company",
                              data: company,
                            })
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {/* Product List Panel */}
          {activeListTab === 2 && (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <FormControl sx={{ minWidth: 240 }}>
                  <InputLabel>{t("Filter by Market")}</InputLabel>
                  <Select
                    value={selectedMarketFilter}
                    onChange={handleFilterChange}
                    label={t("Filter by Market")}
                  >
                    <MenuItem value="">
                      <em>{t("All Markets")}</em>
                    </MenuItem>
                    {markets.map((market) => (
                      <MenuItem key={market._id} value={market._id}>
                        {market.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("No.")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Name")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Image")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Type")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Previous Price")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("New Price")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Market")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Expire Date")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Actions")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product, idx) => (
                      <TableRow key={product._id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>
                          {product.image && (
                            <img
                              src={
                                product.image.startsWith("http")
                                  ? product.image
                                  : `${API_URL}${product.image}`
                              }
                              alt={product.name}
                              style={{
                                width: 48,
                                height: 48,
                                objectFit: "cover",
                                borderRadius: 4,
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>{product.type}</TableCell>
                        <TableCell>
                          {product.previousPrice
                            ? `${t("ID")} ${product.previousPrice.toFixed(2)}`
                            : ""}
                        </TableCell>
                        <TableCell>
                          {product.newPrice
                            ? `${t("ID")} ${product.newPrice.toFixed(2)}`
                            : ""}
                        </TableCell>
                        <TableCell>{product.marketId?.name || ""}</TableCell>
                        <TableCell>
                          {product.expireDate
                            ? new Date(product.expireDate).toLocaleDateString()
                            : ""}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => handleEditOpen("product", product)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                type: "product",
                                data: product,
                              })
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, type: "", data: null })}
      >
        <DialogTitle>
          {t(
            editDialog.type === "company"
              ? "Edit Company"
              : editDialog.type === "market"
              ? "Edit Market"
              : "Edit Product"
          )}
        </DialogTitle>
        <DialogContent>
          {editDialog.type === "company" ? (
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                fullWidth
                label={t("Name")}
                name="name"
                value={editForm.name}
                onChange={handleEditFormChange}
              />
              <TextField
                margin="normal"
                fullWidth
                label={t("Logo URL")}
                name="logo"
                value={editForm.logo}
                onChange={handleEditFormChange}
              />
              <TextField
                margin="normal"
                fullWidth
                label={t("Address")}
                name="address"
                value={editForm.address}
                onChange={handleEditFormChange}
              />
              <TextField
                margin="normal"
                fullWidth
                label={t("Phone")}
                name="phone"
                value={editForm.phone}
                onChange={handleEditFormChange}
              />
              <TextField
                margin="normal"
                fullWidth
                label={t("Description")}
                name="description"
                value={editForm.description}
                onChange={handleEditFormChange}
              />
            </Box>
          ) : editDialog.type === "market" ? (
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                fullWidth
                label={t("Name")}
                name="name"
                value={editForm.name}
                onChange={handleEditFormChange}
              />
              <TextField
                margin="normal"
                fullWidth
                label={t("Logo URL")}
                name="logo"
                value={editForm.logo}
                onChange={handleEditFormChange}
              />
              <TextField
                margin="normal"
                fullWidth
                label={t("Address")}
                name="address"
                value={editForm.address}
                onChange={handleEditFormChange}
              />
              <TextField
                margin="normal"
                fullWidth
                label={t("Phone")}
                name="phone"
                value={editForm.phone}
                onChange={handleEditFormChange}
              />
              <TextField
                margin="normal"
                fullWidth
                label={t("Description")}
                name="description"
                value={editForm.description}
                onChange={handleEditFormChange}
              />
            </Box>
          ) : (
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                fullWidth
                label={t("Name")}
                name="name"
                value={editForm.name}
                onChange={handleEditFormChange}
              />
              <TextField
                margin="normal"
                fullWidth
                label={t("Type")}
                name="type"
                value={editForm.type}
                onChange={handleEditFormChange}
              />

              {/* Current Image Display */}
              {editForm.image && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t("Current Image:")}
                  </Typography>
                  <img
                    src={
                      editForm.image.startsWith("http")
                        ? editForm.image
                        : `${API_URL}${editForm.image}`
                    }
                    alt={t("Current product")}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                    }}
                  />
                </Box>
              )}

              {/* Image Upload */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t("Upload New Image:")}
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="edit-product-image-upload"
                  type="file"
                  onChange={handleEditImageChange}
                />
                <label htmlFor="edit-product-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 1 }}
                  >
                    {t("Choose Image")}
                  </Button>
                </label>
                {selectedEditImage && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" display="block">
                      {t("Selected:")} {selectedEditImage.name}
                    </Typography>
                    <img
                      src={URL.createObjectURL(selectedEditImage)}
                      alt={t("Preview")}
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        marginTop: "8px",
                      }}
                    />
                  </Box>
                )}
              </Box>

              <TextField
                margin="normal"
                fullWidth
                label={t("Previous Price")}
                name="previousPrice"
                type="number"
                value={editForm.previousPrice}
                onChange={handleEditFormChange}
              />
              <TextField
                margin="normal"
                fullWidth
                label={t("New Price")}
                name="newPrice"
                type="number"
                value={editForm.newPrice}
                onChange={handleEditFormChange}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>{t("Market")}</InputLabel>
                <Select
                  name="marketId"
                  value={editForm.marketId}
                  onChange={handleEditFormChange}
                  label={t("Market")}
                >
                  {markets.map((market) => (
                    <MenuItem key={market._id} value={market._id}>
                      {market.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t("Company")}</InputLabel>
                <Select
                  name="companyId"
                  value={editForm.companyId}
                  onChange={handleEditFormChange}
                  label={t("Company")}
                >
                  {companies.map((company) => (
                    <MenuItem key={company._id} value={company._id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                margin="normal"
                fullWidth
                label={t("Expire Date")}
                name="expireDate"
                type="date"
                value={editForm.expireDate}
                onChange={handleEditFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditDialog({ open: false, type: "", data: null })}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={editLoading}
          >
            {editLoading ? t("Saving...") : t("Save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, type: "", data: null })}
      >
        <DialogTitle>{t("Confirm Delete")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("Are you sure you want to delete this")} {deleteDialog.type}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteDialog({ open: false, type: "", data: null })
            }
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              deleteDialog.type === "company"
                ? handleDeleteCompanyConfirm
                : handleDeleteMarketConfirm
            }
            disabled={deleteLoading}
          >
            {deleteLoading ? t("Deleting...") : t("Delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DataEntryForm;
