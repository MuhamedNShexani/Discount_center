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
  FormControlLabel,
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
  TablePagination,
} from "@mui/material";
import {
  marketAPI,
  productAPI,
  brandAPI,
  categoryAPI,
  giftAPI,
} from "../services/api";
import * as XLSX from "xlsx";

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
import DownloadIcon from "@mui/icons-material/Download";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import { useTranslation } from "react-i18next";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const DataEntryForm = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [activeListTab, setActiveListTab] = useState(0); // State for list tabs
  const [markets, setMarkets] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Pagination states
  const [marketsPage, setMarketsPage] = useState(0);
  const [brandsPage, setBrandsPage] = useState(0);
  const [productsPage, setProductsPage] = useState(0);
  const [giftsPage, setGiftsPage] = useState(0);
  const [rowsPerPage] = useState(10);

  // Refs for file inputs
  const brandLogoFileRef = useRef(null);
  const productImageFileRef = useRef(null);
  const editProductImageFileRef = useRef(null);
  const marketLogoFileRef = useRef(null);
  const giftImageFileRef = useRef(null);
  const editGiftImageFileRef = useRef(null);

  // Brand form state
  const [brandForm, setBrandForm] = useState({
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
    image: "",
    previousPrice: "",
    newPrice: "",
    isDiscount: false,
    description: "",
    barcode: "",
    weight: "",
    brandId: "",
    categoryId: "",
    categoryTypeId: "",
    marketId: "",
    expireDate: "",
  });

  // Gift form state
  const [giftForm, setGiftForm] = useState({
    image: "",
    description: "",
    marketId: [],
    brandId: "",
    productId: "",
    expireDate: "",
  });

  // File upload state
  const [selectedBrandLogo, setSelectedBrandLogo] = useState(null);
  const [selectedProductImage, setSelectedProductImage] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedExcelFile, setSelectedExcelFile] = useState(null);
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [selectedEditImage, setSelectedEditImage] = useState(null);
  const [selectedMarketLogo, setSelectedMarketLogo] = useState(null);
  const [selectedGiftImage, setSelectedGiftImage] = useState(null);
  const [selectedEditGiftImage, setSelectedEditGiftImage] = useState(null);

  // Brand and Market bulk upload state
  const [selectedBrandExcelFile, setSelectedBrandExcelFile] = useState(null);
  const [selectedMarketExcelFile, setSelectedMarketExcelFile] = useState(null);
  const [brandBulkUploadLoading, setBrandBulkUploadLoading] = useState(false);
  const [marketBulkUploadLoading, setMarketBulkUploadLoading] = useState(false);

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
    fetchBrands();
    fetchCategories();
    fetchGifts();
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

  const fetchBrands = async () => {
    try {
      const response = await brandAPI.getAll();
      setBrands(response.data);
    } catch (err) {
      console.error("Error fetching brands:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchGifts = async () => {
    try {
      const response = await giftAPI.getAll();
      console.log("Gifts API response:", response);
      console.log("Gifts data:", response.data);
      setGifts(response.data.data || []);
    } catch (err) {
      console.error("Error fetching gifts:", err);
      setGifts([]);
    }
  };

  const fetchCategoryTypes = async (categoryId) => {
    try {
      if (!categoryId) {
        setCategoryTypes([]);
        return;
      }
      const response = await categoryAPI.getTypes(categoryId);
      setCategoryTypes(response.data);
    } catch (err) {
      console.error("Error fetching category types:", err);
      setCategoryTypes([]);
    }
  };

  // Helper function to get category type name from categoryTypeId
  const getCategoryTypeName = (categoryTypeId, categoryId) => {
    // If categoryTypeId is available, try to find the type name
    if (categoryTypeId && categoryId) {
      const category = categories.find((cat) => cat._id === categoryId);

      if (category && category.types) {
        // First try to find by ID (converting ObjectId to string)
        let type = category.types.find(
          (t) => t._id.toString() === categoryTypeId
        );

        // If not found by ID, try to find by name directly
        if (!type) {
          type = category.types.find((t) => t.name === categoryTypeId);
        }

        if (type) {
          return type.name;
        }
      }
    }

    // Return N/A if no valid category type found
    return "N/A";
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

  // Pagination handlers
  const handleMarketsPageChange = (event, newPage) => {
    setMarketsPage(newPage);
  };

  const handleBrandsPageChange = (event, newPage) => {
    setBrandsPage(newPage);
  };

  const handleProductsPageChange = (event, newPage) => {
    setProductsPage(newPage);
  };

  const handleGiftsPageChange = (event, newPage) => {
    setGiftsPage(newPage);
  };

  const handleBrandFormChange = (e) => {
    setBrandForm({
      ...brandForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleFilterChange = (e) => {
    setSelectedMarketFilter(e.target.value);
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: value,
    });

    // If category is selected, fetch its types
    if (name === "categoryId") {
      fetchCategoryTypes(value);
      // Reset category type when category changes
      setProductForm((prev) => ({
        ...prev,
        categoryTypeId: "",
      }));
    }
  };

  const handleGiftFormChange = (e) => {
    const { name, value } = e.target;
    setGiftForm({
      ...giftForm,
      [name]: value,
    });
  };

  // Handle gift form change for multi-select fields
  const handleGiftFormMultiChange = (e) => {
    const { name, value } = e.target;
    setGiftForm({
      ...giftForm,
      [name]: value,
    });
  };

  // Handle file selection for brand logo
  const handleBrandLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedBrandLogo(file);
    }
  };

  // Handle file selection for market logo
  const handleMarketLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedMarketLogo(file);
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

  // Handle file selection for gift image
  const handleGiftImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedGiftImage(file);
    }
  };

  // Handle file selection for edit gift image
  const handleEditGiftImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedEditGiftImage(file);
    }
  };

  // Upload brand logo
  const uploadBrandLogo = async (file) => {
    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await fetch(`${API_URL}/api/brands/upload-logo`, {
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

  // Upload gift image
  const uploadGiftImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_URL}/api/gifts/upload-image`, {
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
      console.error("Error uploading gift image:", error);
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

  // Handle Brand Excel file selection
  const handleBrandExcelFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedBrandExcelFile(file);
    }
  };

  // Handle Market Excel file selection
  const handleMarketExcelFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedMarketExcelFile(file);
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

  // Process Excel file and create brands
  const handleBrandBulkUpload = async (e) => {
    e.preventDefault();
    if (!selectedBrandExcelFile) {
      setMessage({
        type: "error",
        text: t("Please select an Excel file."),
      });
      return;
    }

    setBrandBulkUploadLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("excelFile", selectedBrandExcelFile);

      const response = await fetch(`${API_URL}/api/brands/bulk-upload`, {
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
        text: t("Successfully uploaded {{count}} brands", {
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

      fetchBrands(); // Refresh brands list
      setSelectedBrandExcelFile(null); // Clear file input
    } catch (err) {
      setMessage({
        type: "error",
        text: "Failed to upload brands. Please check your Excel file format.",
      });
      console.error("Error uploading brands:", err);
    } finally {
      setBrandBulkUploadLoading(false);
    }
  };

  // Process Excel file and create markets
  const handleMarketBulkUpload = async (e) => {
    e.preventDefault();
    if (!selectedMarketExcelFile) {
      setMessage({
        type: "error",
        text: t("Please select an Excel file."),
      });
      return;
    }

    setMarketBulkUploadLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("excelFile", selectedMarketExcelFile);

      const response = await fetch(`${API_URL}/api/markets/bulk-upload`, {
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
        text: t("Successfully uploaded {{count}} markets", {
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

      fetchMarkets(); // Refresh markets list
      setSelectedMarketExcelFile(null); // Clear file input
    } catch (err) {
      setMessage({
        type: "error",
        text: "Failed to upload markets. Please check your Excel file format.",
      });
      console.error("Error uploading markets:", err);
    } finally {
      setMarketBulkUploadLoading(false);
    }
  };

  // Export brands to Excel
  const exportBrandsToExcel = () => {
    try {
      // Prepare data for export
      const exportData = brands.map((brand, index) => ({
        "No.": index + 1,
        ID: brand._id || "",
        Name: brand.name || "",
        Logo: brand.logo || "",
        Address: brand.address || "",
        Phone: brand.phone || "",
        Description: brand.description || "",
        "Created Date": brand.createdAt
          ? new Date(brand.createdAt).toLocaleDateString()
          : "",
        "Updated Date": brand.updatedAt
          ? new Date(brand.updatedAt).toLocaleDateString()
          : "",
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 5 }, // No.
        { wch: 25 }, // ID
        { wch: 25 }, // Name
        { wch: 30 }, // Logo
        { wch: 30 }, // Address
        { wch: 15 }, // Phone
        { wch: 40 }, // Description
        { wch: 15 }, // Created Date
        { wch: 15 }, // Updated Date
      ];
      worksheet["!cols"] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Brands");

      // Generate filename with current date
      const date = new Date().toISOString().split("T")[0];
      const filename = `brands_export_${date}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      setMessage({
        type: "success",
        text: t("Brands exported successfully to {{filename}}", {
          filename,
        }),
      });
    } catch (error) {
      console.error("Error exporting brands:", error);
      setMessage({
        type: "error",
        text: t("Failed to export brands. Please try again."),
      });
    }
  };

  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!selectedBrandLogo) {
      setMessage({ type: "error", text: t("Please select a logo file.") });
      setLoading(false);
      return;
    }

    try {
      setUploadLoading(true);
      const logoUrl = await uploadBrandLogo(selectedBrandLogo);
      console.log("Logo uploaded successfully:", logoUrl);
      setUploadLoading(false);

      const brandData = {
        ...brandForm,
        logo: logoUrl,
      };
      console.log("Brand data to be saved:", brandData);

      const result = await brandAPI.create(brandData);
      console.log("Brand created successfully:", result);
      setMessage({ type: "success", text: t("Brand created successfully!") });
      setBrandForm({
        name: "",
        logo: "",
        address: "",
        phone: "",
        description: "",
      });
      setSelectedBrandLogo(null);
      if (brandLogoFileRef.current) {
        brandLogoFileRef.current.value = "";
      }
      fetchBrands(); // Refresh brands list
    } catch (err) {
      console.error("Error creating brand:", err);
      console.error("Error response:", err.response?.data);
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.message ||
          t("Failed to create brand. Please try again."),
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
        isDiscount: productForm.isDiscount,
        weight: productForm.weight,
        expireDate: productForm.expireDate
          ? new Date(productForm.expireDate).toISOString()
          : null,
        brandId: productForm.brandId,
        categoryId: productForm.categoryId,
        categoryTypeId: productForm.categoryTypeId,
        marketId: productForm.marketId,
      };

      await productAPI.create(productData);
      setMessage({ type: "success", text: t("Product created successfully!") });
      setProductForm({
        name: "",
        image: "",
        previousPrice: "",
        newPrice: "",
        isDiscount: false,
        description: "",
        barcode: "",
        weight: "",
        marketId: "",
        brandId: "",
        categoryId: "",
        categoryTypeId: "",
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

  const handleGiftSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!selectedGiftImage) {
      setMessage({
        type: "error",
        text: t("Please select an image file."),
      });
      setLoading(false);
      return;
    }

    if (!giftForm.description.trim()) {
      setMessage({
        type: "error",
        text: t("Please enter a description."),
      });
      setLoading(false);
      return;
    }

    if (!giftForm.marketId || giftForm.marketId.length === 0) {
      setMessage({
        type: "error",
        text: t("Please select at least one market."),
      });
      setLoading(false);
      return;
    }

    try {
      setUploadLoading(true);
      const imageUrl = await uploadGiftImage(selectedGiftImage);
      setUploadLoading(false);

      const giftData = {
        ...giftForm,
        image: imageUrl,
        marketId: giftForm.marketId,
        brandId: giftForm.brandId || null,
        productId: giftForm.productId || null,
        expireDate: giftForm.expireDate
          ? new Date(giftForm.expireDate).toISOString()
          : null,
      };

      console.log("Gift data being sent:", giftData);
      const response = await giftAPI.create(giftData);
      console.log("Gift creation response:", response);
      setMessage({ type: "success", text: t("Gift created successfully!") });
      setGiftForm({
        image: "",
        description: "",
        marketId: [],
        brandId: "",
        productId: "",
        expireDate: "",
      });
      setSelectedGiftImage(null);
      if (giftImageFileRef.current) {
        giftImageFileRef.current.value = "";
      }
      fetchGifts();
    } catch (err) {
      setMessage({
        type: "error",
        text: t("Failed to create gift. Please try again."),
      });
      console.error("Error creating gift:", err);
    } finally {
      setLoading(false);
      setUploadLoading(false);
    }
  };

  // Open edit dialog and set form data
  const handleEditOpen = (type, data) => {
    if (type === "brand") {
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
        image: data.image,
        previousPrice: data.previousPrice,
        newPrice: data.newPrice,
        isDiscount: data.isDiscount || false,
        description: data.description || "",
        barcode: data.barcode || "",
        weight: data.weight || "",
        marketId: data.marketId?._id || data.marketId,
        brandId: data.brandId?._id || data.brandId,
        categoryId: data.categoryId?._id || data.categoryId,
        categoryTypeId: data.categoryTypeId,
        expireDate: data.expireDate
          ? new Date(data.expireDate).toISOString().split("T")[0]
          : "",
      });
    } else if (type === "gift") {
      setEditForm({
        image: data.image,
        description: data.description || "",
        marketId: data.marketId?.map((m) => m._id) || data.marketId || [],
        brandId: data.brandId?._id || data.brandId || "",
        productId: data.productId || "",
        expireDate: data.expireDate
          ? new Date(data.expireDate).toISOString().split("T")[0]
          : "",
      });
    }

    setEditDialog({ open: true, type, data });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });

    // If category is selected, fetch its types
    if (name === "categoryId") {
      fetchCategoryTypes(value);
      // Reset category type when category changes
      setEditForm((prev) => ({
        ...prev,
        categoryTypeId: "",
      }));
    }
  };

  const handleEditSave = async () => {
    try {
      setEditLoading(true);
      setMessage({ type: "", text: "" });

      if (editDialog.type === "brand") {
        let logoUrl = editForm.logo;
        if (selectedEditImage) {
          logoUrl = await uploadBrandLogo(selectedEditImage);
        }
        await brandAPI.update(editDialog.data._id, {
          ...editForm,
          logo: logoUrl,
        });
        setMessage({
          type: "success",
          text: t("Brand updated successfully!"),
        });
        fetchBrands();
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
          isDiscount: editForm.isDiscount,
          description: editForm.description,
          barcode: editForm.barcode,
          weight: editForm.weight,
          expireDate: editForm.expireDate
            ? new Date(editForm.expireDate).toISOString()
            : null,
          brandId: editForm.brandId,
          categoryId: editForm.categoryId,
          categoryTypeId: editForm.categoryTypeId,
          marketId: editForm.marketId,
        };

        await productAPI.update(editDialog.data._id, productUpdateData);
        setMessage({
          type: "success",
          text: t("Product updated successfully!"),
        });
        fetchProducts(selectedMarketFilter);
      } else if (editDialog.type === "gift") {
        let imageUrl = editForm.image;
        if (selectedEditGiftImage) {
          imageUrl = await uploadGiftImage(selectedEditGiftImage);
        }

        const giftUpdateData = {
          ...editForm,
          image: imageUrl,
          marketId: editForm.marketId,
          brandId: editForm.brandId || null,
          productId: editForm.productId || null,
          expireDate: editForm.expireDate
            ? new Date(editForm.expireDate).toISOString()
            : null,
        };

        await giftAPI.update(editDialog.data._id, giftUpdateData);
        setMessage({
          type: "success",
          text: t("Gift updated successfully!"),
        });
        fetchGifts();
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

  const handleDeleteBrandConfirm = async () => {
    setDeleteLoading(true);
    try {
      if (deleteDialog.type === "brand") {
        await brandAPI.delete(deleteDialog.data._id);
        setMessage({
          type: "success",
          text: t("Brand deleted successfully!"),
        });
        fetchBrands();
        fetchProducts(selectedMarketFilter); // Refresh products as some might be deleted
      } else if (deleteDialog.type === "product") {
        await productAPI.delete(deleteDialog.data._id);
        setMessage({
          type: "success",
          text: t("Product deleted successfully!"),
        });
        fetchProducts(selectedMarketFilter);
      } else if (deleteDialog.type === "gift") {
        await giftAPI.delete(deleteDialog.data._id);
        setMessage({
          type: "success",
          text: t("Gift deleted successfully!"),
        });
        fetchGifts();
      }
      setDeleteDialog({ open: false, type: "", data: null });
    } catch (err) {
      console.log("Full error from backend:", err);
      console.log("Error response object:", err.response);
      let errorMsg = t("Failed to delete. Please try again.");
      if (
        err.response?.data?.msg ===
        "Cannot delete brand. It has associated products. Please delete the products first."
      ) {
        errorMsg = t(
          "Cannot delete brand. It has associated products. Please delete the products first."
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
      } else if (deleteDialog.type === "gift") {
        await giftAPI.delete(deleteDialog.data._id);
        setMessage({
          type: "success",
          text: t("Gift deleted successfully!"),
        });
        fetchGifts();
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
    <Box sx={{ py: 10, px: { xs: 0.5, sm: 1.5, md: 3 } }}>
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
                label={t("Add Brand")}
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
                label={t("Add Gift")}
                icon={<CardGiftcardIcon />}
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
                {/* Brand Form Fields */}
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
                    id="market-logo-file"
                    type="file"
                    onChange={handleMarketLogoChange}
                  />
                  <label htmlFor="market-logo-file">
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

          {/* Market Bulk Upload Section */}
          {activeTab === 0 && (
            <Box
              sx={{ mt: 4, p: 3, backgroundColor: "#f8f9fa", borderRadius: 2 }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: "#2c3e50" }}>
                {t("Bulk Upload Markets")}
              </Typography>
              <Typography variant="body2" sx={{ color: "#B08463", mb: 2 }}>
                {t(
                  "Upload an Excel file (.xlsx) with market data. The file should have columns: Name, Logo, Address, Phone, Description"
                )}
              </Typography>
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <input
                    accept=".xlsx,.xls"
                    style={{ display: "none" }}
                    id="market-excel-file"
                    type="file"
                    onChange={handleMarketExcelFileChange}
                  />
                  <label htmlFor="market-excel-file">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<AddIcon />}
                      sx={{ mb: 2 }}
                    >
                      {selectedMarketExcelFile
                        ? selectedMarketExcelFile.name
                        : t("Select Excel File")}
                    </Button>
                  </label>
                </Grid>
                <Grid xs={12}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      // Create sample data for template
                      const sampleData = [
                        ["Name", "Logo", "Address", "Phone", "Description"],
                        [
                          "Sample Market",
                          "logo_url_here",
                          "Sample Address",
                          "+1234567890",
                          "Sample description",
                        ],
                      ];

                      // Convert to CSV format
                      const csvContent = sampleData
                        .map((row) => row.join(","))
                        .join("\n");

                      // Create and download file
                      const blob = new Blob([csvContent], { type: "text/csv" });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "market_template.csv";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    }}
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 2 }}
                  >
                    {t("Download Template")}
                  </Button>
                </Grid>
                <Grid xs={12}>
                  <Button
                    onClick={handleMarketBulkUpload}
                    variant="contained"
                    disabled={
                      marketBulkUploadLoading || !selectedMarketExcelFile
                    }
                    startIcon={
                      marketBulkUploadLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <AddIcon />
                      )
                    }
                    fullWidth
                  >
                    {marketBulkUploadLoading
                      ? t("Uploading...")
                      : t("Upload Markets")}
                  </Button>
                </Grid>
                <Grid xs={12}>
                  <Typography variant="body2" sx={{ color: "#B08463", mt: 2 }}>
                    <strong>{t("Excel Format:")}</strong>
                    <br />• {t("Column A: Name (required)")}
                    <br />• {t("Column B: Logo (optional)")}
                    <br />• {t("Column C: Address (optional)")}
                    <br />• {t("Column D: Phone (optional)")}
                    <br />• {t("Column E: Description (optional)")}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          {activeTab === 1 && (
            <Box component="form" onSubmit={handleBrandSubmit}>
              <Grid container spacing={2}>
                {/* Brand Form Fields */}
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Brand Name")}
                    name="name"
                    value={brandForm.name}
                    onChange={handleBrandFormChange}
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
                    value={brandForm.address}
                    onChange={handleBrandFormChange}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Phone")}
                    name="phone"
                    value={brandForm.phone}
                    onChange={handleBrandFormChange}
                  />
                </Grid>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label={t("Description")}
                    name="description"
                    value={brandForm.description}
                    onChange={handleBrandFormChange}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid xs={12}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="brand-logo-file"
                    type="file"
                    ref={brandLogoFileRef}
                    onChange={handleBrandLogoChange}
                  />
                  <label htmlFor="brand-logo-file">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<AddIcon />}
                    >
                      {selectedBrandLogo
                        ? selectedBrandLogo.name
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
                      : t("Add Brand")}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Brand Bulk Upload Section */}
          {activeTab === 1 && (
            <Box
              sx={{ mt: 4, p: 3, backgroundColor: "#f8f9fa", borderRadius: 2 }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: "#2c3e50" }}>
                {t("Bulk Upload Brands")}
              </Typography>
              <Typography variant="body2" sx={{ color: "#B08463", mb: 2 }}>
                {t(
                  "Upload an Excel file (.xlsx) with brand data. The file should have columns: Name, Logo, Address, Phone, Description"
                )}
              </Typography>
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <input
                    accept=".xlsx,.xls"
                    style={{ display: "none" }}
                    id="brand-excel-file"
                    type="file"
                    onChange={handleBrandExcelFileChange}
                  />
                  <label htmlFor="brand-excel-file">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<AddIcon />}
                      sx={{ mb: 2 }}
                    >
                      {selectedBrandExcelFile
                        ? selectedBrandExcelFile.name
                        : t("Select Excel File")}
                    </Button>
                  </label>
                </Grid>
                <Grid xs={12}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      // Create sample data for template
                      const sampleData = [
                        ["Name", "Logo", "Address", "Phone", "Description"],
                        [
                          "Sample Brand",
                          "logo_url_here",
                          "Sample Address",
                          "+1234567890",
                          "Sample description",
                        ],
                      ];

                      // Convert to CSV format
                      const csvContent = sampleData
                        .map((row) => row.join(","))
                        .join("\n");

                      // Create and download file
                      const blob = new Blob([csvContent], { type: "text/csv" });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "brand_template.csv";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    }}
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 2 }}
                  >
                    {t("Download Template")}
                  </Button>
                </Grid>
                <Grid xs={12}>
                  <Button
                    onClick={handleBrandBulkUpload}
                    variant="contained"
                    disabled={brandBulkUploadLoading || !selectedBrandExcelFile}
                    startIcon={
                      brandBulkUploadLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <AddIcon />
                      )
                    }
                    fullWidth
                  >
                    {brandBulkUploadLoading
                      ? t("Uploading...")
                      : t("Upload Brands")}
                  </Button>
                </Grid>
                <Grid xs={12}>
                  <Typography variant="body2" sx={{ color: "#B08463", mt: 2 }}>
                    <strong>{t("Excel Format:")}</strong>
                    <br />• {t("Column A: Name (required)")}
                    <br />• {t("Column B: Logo (optional)")}
                    <br />• {t("Column C: Address (optional)")}
                    <br />• {t("Column D: Phone (optional)")}
                    <br />• {t("Column E: Description (optional)")}
                  </Typography>
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
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label={t("Description")}
                    name="description"
                    value={productForm.description}
                    onChange={handleProductFormChange}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label={t("Barcode")}
                    name="barcode"
                    value={productForm.barcode}
                    onChange={handleProductFormChange}
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
                  <TextField
                    fullWidth
                    label={t("Weight")}
                    name="weight"
                    value={productForm.weight}
                    onChange={handleProductFormChange}
                    placeholder="e.g., 500g, 1kg, 2.5kg"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <InventoryIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth>
                    <FormControlLabel
                      control={
                        <input
                          type="checkbox"
                          name="isDiscount"
                          checked={productForm.isDiscount}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              isDiscount: e.target.checked,
                            })
                          }
                        />
                      }
                      label={t("Is Discount Product")}
                    />
                  </FormControl>
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
                    <InputLabel shrink>{t("Brand")}</InputLabel>
                    <Select
                      name="brandId"
                      value={productForm.brandId}
                      onChange={handleProductFormChange}
                      label={t("Brand")}
                      displayEmpty
                      sx={{
                        width: "150px",
                      }}
                      labelId="add-product-market-label"
                    >
                      <MenuItem value="">
                        <em>{t("Select Brand")}</em>
                      </MenuItem>
                      {brands.map((brand) => (
                        <MenuItem key={brand._id} value={brand._id}>
                          {brand.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel shrink>{t("Category")}</InputLabel>
                    <Select
                      name="categoryId"
                      value={productForm.categoryId}
                      onChange={handleProductFormChange}
                      label={t("Category")}
                      displayEmpty
                      labelId="add-product-category-label"
                    >
                      <MenuItem value="">
                        <em>{t("Select Category")}</em>
                      </MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category._id} value={category._id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel shrink>{t("Category Type")}</InputLabel>
                    <Select
                      name="categoryTypeId"
                      value={productForm.categoryTypeId}
                      onChange={handleProductFormChange}
                      label={t("Category Type")}
                      displayEmpty
                      disabled={!productForm.categoryId}
                      labelId="add-product-category-type-label"
                    >
                      <MenuItem value="">
                        <em>{t("Select Category Type")}</em>
                      </MenuItem>
                      {categoryTypes.map((type) => (
                        <MenuItem key={type._id} value={type._id}>
                          {type.name}
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
            <Box component="form" onSubmit={handleGiftSubmit}>
              <Grid container spacing={2}>
                {/* Gift Form Fields */}
                <Grid xs={12}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "#714329" }}
                  >
                    {t("Add New Gift")}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#B08463", mb: 2 }}>
                    {t(
                      "Create a new gift with image, description, and associations"
                    )}
                  </Typography>
                </Grid>
                <Grid xs={12}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="gift-image"
                    type="file"
                    onChange={handleGiftImageChange}
                    ref={giftImageFileRef}
                  />
                  <label htmlFor="gift-image">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<AddIcon />}
                      sx={{ mb: 2 }}
                    >
                      {selectedGiftImage
                        ? selectedGiftImage.name
                        : t("Select Gift Image")}
                    </Button>
                  </label>
                </Grid>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label={t("Description")}
                    name="description"
                    value={giftForm.description}
                    onChange={handleGiftFormChange}
                    required
                    multiline
                    rows={3}
                    InputProps={{
                      style: {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(255,255,255,0.8)",
                      },
                    }}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t("Markets")}</InputLabel>
                    <Select
                      multiple
                      name="marketId"
                      value={giftForm.marketId}
                      onChange={handleGiftFormMultiChange}
                      label={t("Markets")}
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {selected.map((value) => {
                            const market = markets.find((m) => m._id === value);
                            return (
                              <Chip
                                key={value}
                                label={market ? market.name : value}
                                size="small"
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
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
                    <InputLabel>{t("Brand")}</InputLabel>
                    <Select
                      name="brandId"
                      value={giftForm.brandId}
                      onChange={handleGiftFormChange}
                      label={t("Brand")}
                    >
                      <MenuItem value="">
                        <em>{t("None")}</em>
                      </MenuItem>
                      {brands.map((brand) => (
                        <MenuItem key={brand._id} value={brand._id}>
                          {brand.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Product ID (Barcode)")}
                    name="productId"
                    value={giftForm.productId}
                    onChange={handleGiftFormChange}
                    InputProps={{
                      style: {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(255,255,255,0.8)",
                      },
                    }}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Expire Date")}
                    name="expireDate"
                    type="date"
                    value={giftForm.expireDate}
                    onChange={handleGiftFormChange}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      style: {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(255,255,255,0.8)",
                      },
                    }}
                  />
                </Grid>
                <Grid xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading || uploadLoading}
                    startIcon={
                      loading || uploadLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    sx={{
                      mt: 2,
                      background:
                        theme.palette.mode === "dark"
                          ? "linear-gradient(135deg, #52b788 0%, #40916c 100%)"
                          : "linear-gradient(135deg, #52b788 0%, #40916c 100%)",
                      color: "white",
                      "&:hover": {
                        background:
                          theme.palette.mode === "dark"
                            ? "linear-gradient(135deg, #40916c 0%, #2d6a4f 100%)"
                            : "linear-gradient(135deg, #40916c 0%, #2d6a4f 100%)",
                      },
                    }}
                  >
                    {loading || uploadLoading
                      ? t("Creating...")
                      : t("Create Gift")}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 4 && (
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
                      "Upload an Excel file (.xlsx) with product data. The file should have columns: Barcode, Name, Type, Previous Price, New Price, Is Discount, Brand ID, Market ID, Description, Expire Date, Weight"
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
                    variant="outlined"
                    onClick={() => {
                      // Create sample data for template
                      const sampleData = [
                        [
                          "Barcode",
                          "Name",
                          "Type",
                          "Previous Price",
                          "New Price",
                          "Is Discount",
                          "Brand ID",
                          "Market ID",
                          "Description",
                          "Expire Date",
                          "Weight",
                        ],
                        [
                          "123456789",
                          "Sample Product",
                          "Electronics",
                          "100",
                          "80",
                          "true",
                          "brand_id_here",
                          "market_id_here",
                          "Sample description",
                          "2024-12-31",
                          "500g",
                        ],
                      ];

                      // Convert to CSV format
                      const csvContent = sampleData
                        .map((row) => row.join(","))
                        .join("\n");

                      // Create and download file
                      const blob = new Blob([csvContent], { type: "text/csv" });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "product_template.csv";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    }}
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 2 }}
                  >
                    {t("Download Template")}
                  </Button>
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
                    <br />• {t("Column A: Barcode (optional)")}
                    <br />• {t("Column B: Name (required)")}
                    <br />• {t("Column C: Category ID (required)")}
                    <br />• {t("Column D: Category Type ID (required)")}
                    <br />• {t("Column E: Previous Price (optional)")}
                    <br />• {t("Column F: New Price (optional)")}
                    <br />• {t("Column G: Is Discount (required)")}
                    <br />• {t("Column H: Brand ID (optional)")}
                    <br />• {t("Column I: Market ID (required)")}
                    <br />• {t("Column J: Description (optional)")}
                    <br />•{" "}
                    {t("Column K: Expire Date (optional, YYYY-MM-DD format)")}
                    <br />• {t("Column L: Weight (optional)")}
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
              label={t("Brands")}
              icon={<BusinessIcon />}
              iconPosition="start"
            />
            <Tab
              label={t("Products")}
              icon={<ShoppingCartIcon />}
              iconPosition="start"
            />
            <Tab
              label={t("Gifts")}
              icon={<CardGiftcardIcon />}
              iconPosition="start"
            />
          </Tabs>

          {/* Market List Panel */}
          {activeListTab === 0 && (
            <Box>
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
                    {markets
                      .slice(
                        marketsPage * rowsPerPage,
                        marketsPage * rowsPerPage + rowsPerPage
                      )
                      .map((market, idx) => (
                        <TableRow key={market._id}>
                          <TableCell>
                            {marketsPage * rowsPerPage + idx + 1}
                          </TableCell>
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
              <TablePagination
                component="div"
                count={markets.length}
                page={marketsPage}
                onPageChange={handleMarketsPageChange}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10]}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                }
              />
            </Box>
          )}

          {/* Brand List Panel */}
          {activeListTab === 1 && (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ color: "#2c3e50" }}>
                  {t("Total Brands")}: {brands.length}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={exportBrandsToExcel}
                  sx={{
                    backgroundColor: "#52b788",
                    "&:hover": {
                      backgroundColor: "#40916c",
                    },
                  }}
                >
                  {t("Export to Excel")}
                </Button>
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
                    {brands
                      .slice(
                        brandsPage * rowsPerPage,
                        brandsPage * rowsPerPage + rowsPerPage
                      )
                      .map((brand, idx) => (
                        <TableRow key={brand._id}>
                          <TableCell>
                            {brandsPage * rowsPerPage + idx + 1}
                          </TableCell>
                          <TableCell
                            width={200}
                            sx={{ fontSize: "18px", fontWeight: "bold" }}
                          >
                            {brand.name}
                          </TableCell>
                          <TableCell>
                            {brand.logo && (
                              <img
                                src={
                                  brand.logo.startsWith("http")
                                    ? brand.logo
                                    : `${API_URL}${brand.logo}`
                                }
                                alt={brand.name}
                                width={80}
                                height={80}
                                style={{
                                  objectFit: "cover",
                                  borderRadius: "4px",
                                }}
                              />
                            )}
                          </TableCell>
                          {/* <TableCell>{brand.address}</TableCell> */}
                          <TableCell>{brand.phone}</TableCell>
                          <TableCell
                            width="100px"
                            height="100px"
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {brand.description}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              color="primary"
                              onClick={() => handleEditOpen("brand", brand)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  type: "brand",
                                  data: brand,
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
              <TablePagination
                component="div"
                count={brands.length}
                page={brandsPage}
                onPageChange={handleBrandsPageChange}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10]}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                }
              />
            </Box>
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
                  <InputLabel>{t("Search by Market")}</InputLabel>
                  <Select
                    value={selectedMarketFilter}
                    onChange={handleFilterChange}
                    label={t("Search by Market")}
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
                        {t("Category")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Category Type")}
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
                        {t("Weight")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Discount")}
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
                    {products
                      .slice(
                        productsPage * rowsPerPage,
                        productsPage * rowsPerPage + rowsPerPage
                      )
                      .map((product, idx) => (
                        <TableRow key={product._id}>
                          <TableCell>
                            {productsPage * rowsPerPage + idx + 1}
                          </TableCell>
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

                          <TableCell>
                            {product.categoryId &&
                            typeof product.categoryId === "object"
                              ? product.categoryId.name
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {getCategoryTypeName(
                              product.categoryTypeId,
                              product.categoryId?._id || product.categoryId
                            )}
                          </TableCell>
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
                          <TableCell>{product.weight || ""}</TableCell>
                          <TableCell>
                            {product.isDiscount ? (
                              <Chip
                                label={t("Yes")}
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                label={t("No")}
                                color="default"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell>{product.marketId?.name || ""}</TableCell>
                          <TableCell>
                            {product.expireDate
                              ? new Date(
                                  product.expireDate
                                ).toLocaleDateString()
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
              <TablePagination
                component="div"
                count={products.length}
                page={productsPage}
                onPageChange={handleProductsPageChange}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10]}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                }
              />
            </Box>
          )}

          {/* Gift List Panel */}
          {activeListTab === 3 && (
            <Box>
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
                        {t("Image")}
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
                        {t("Markets")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Brand")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Product ID")}
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
                    {(gifts || [])
                      .slice(
                        giftsPage * rowsPerPage,
                        giftsPage * rowsPerPage + rowsPerPage
                      )
                      .map((gift, index) => (
                        <TableRow key={gift._id}>
                          <TableCell>
                            {giftsPage * rowsPerPage + index + 1}
                          </TableCell>
                          <TableCell>
                            <img
                              src={gift.image}
                              alt={gift.description}
                              style={{
                                width: "60px",
                                height: "60px",
                                objectFit: "cover",
                                borderRadius: "8px",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: "200px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {gift.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}
                            >
                              {gift.marketId?.map((market) => (
                                <Chip
                                  key={market._id || market}
                                  label={market.name || market}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {gift.brandId ? (
                              <Chip
                                label={gift.brandId.name || gift.brandId}
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {t("None")}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {gift.productId ? (
                              <Typography variant="body2">
                                {gift.productId}
                              </Typography>
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {t("None")}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {gift.expireDate ? (
                              <Typography variant="body2">
                                {new Date(gift.expireDate).toLocaleDateString()}
                              </Typography>
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {t("No expiry")}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => handleEditOpen("gift", gift)}
                              size="small"
                              sx={{ color: "primary.main" }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  type: "gift",
                                  data: gift,
                                })
                              }
                              size="small"
                              sx={{ color: "error.main" }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={gifts.length}
                page={giftsPage}
                onPageChange={handleGiftsPageChange}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10]}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                }
              />
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
            editDialog.type === "brand"
              ? "Edit Brand"
              : editDialog.type === "market"
              ? "Edit Market"
              : editDialog.type === "gift"
              ? "Edit Gift"
              : "Edit Product"
          )}
        </DialogTitle>
        <DialogContent>
          {editDialog.type === "brand" ? (
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                fullWidth
                label={t("Name")}
                name="name"
                value={editForm.name}
                onChange={handleEditFormChange}
              />
              {/* Image Upload */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t("Upload New Logo:")}
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="edit-brand-logo-upload"
                  type="file"
                  onChange={handleEditImageChange}
                />
                <label htmlFor="edit-brand-logo-upload">
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
              {/* Image Upload */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t("Upload New Logo:")}
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
          ) : editDialog.type === "gift" ? (
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                fullWidth
                label={t("Description")}
                name="description"
                value={editForm.description}
                onChange={handleEditFormChange}
                multiline
                rows={3}
              />

              {/* Image Upload */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t("Upload New Image:")}
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="edit-gift-image-upload"
                  type="file"
                  onChange={handleEditGiftImageChange}
                />
                <label htmlFor="edit-gift-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 1 }}
                  >
                    {t("Choose Image")}
                  </Button>
                </label>
                {selectedEditGiftImage && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" display="block">
                      {t("Selected:")} {selectedEditGiftImage.name}
                    </Typography>
                    <img
                      src={URL.createObjectURL(selectedEditGiftImage)}
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

              <FormControl fullWidth margin="normal">
                <InputLabel>{t("Markets")}</InputLabel>
                <Select
                  multiple
                  name="marketId"
                  value={editForm.marketId}
                  onChange={handleEditFormChange}
                  label={t("Markets")}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        const market = markets.find((m) => m._id === value);
                        return (
                          <Chip
                            key={value}
                            label={market ? market.name : value}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {markets.map((market) => (
                    <MenuItem key={market._id} value={market._id}>
                      {market.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>{t("Brand")}</InputLabel>
                <Select
                  name="brandId"
                  value={editForm.brandId}
                  onChange={handleEditFormChange}
                  label={t("Brand")}
                >
                  <MenuItem value="">
                    <em>{t("None")}</em>
                  </MenuItem>
                  {brands.map((brand) => (
                    <MenuItem key={brand._id} value={brand._id}>
                      {brand.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                margin="normal"
                fullWidth
                label={t("Product ID (Barcode)")}
                name="productId"
                value={editForm.productId}
                onChange={handleEditFormChange}
              />

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
              <TextField
                margin="normal"
                fullWidth
                label={t("Weight")}
                name="weight"
                value={editForm.weight}
                onChange={handleEditFormChange}
                placeholder="e.g., 500g, 1kg, 2.5kg"
              />
              <FormControl fullWidth margin="normal">
                <FormControlLabel
                  control={
                    <input
                      type="checkbox"
                      name="isDiscount"
                      checked={editForm.isDiscount}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          isDiscount: e.target.checked,
                        })
                      }
                    />
                  }
                  label={t("Is Discount Product")}
                />
              </FormControl>
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
                <InputLabel>{t("Brand")}</InputLabel>
                <Select
                  name="brandId"
                  value={editForm.brandId}
                  onChange={handleEditFormChange}
                  label={t("Brand")}
                >
                  {brands.map((brand) => (
                    <MenuItem key={brand._id} value={brand._id}>
                      {brand.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t("Category")}</InputLabel>
                <Select
                  name="categoryId"
                  value={editForm.categoryId}
                  onChange={handleEditFormChange}
                  label={t("Category")}
                >
                  {categories.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t("Category Type")}</InputLabel>
                <Select
                  name="categoryTypeId"
                  value={editForm.categoryTypeId}
                  onChange={handleEditFormChange}
                  label={t("Category Type")}
                  disabled={!editForm.categoryId}
                >
                  {categoryTypes.map((type) => (
                    <MenuItem key={type._id} value={type._id}>
                      {type.name}
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
              deleteDialog.type === "brand"
                ? handleDeleteBrandConfirm()
                : deleteDialog.type === "gift"
                ? handleDeleteBrandConfirm()
                : handleDeleteMarketConfirm()
            }
            disabled={deleteLoading}
          >
            {deleteLoading ? t("Deleting...") : t("Delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataEntryForm;
