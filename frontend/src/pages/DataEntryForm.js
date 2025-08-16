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
  Checkbox,
} from "@mui/material";
import {
  storeAPI,
  productAPI,
  brandAPI,
  categoryAPI,
  giftAPI,
  adAPI,
  storeTypeAPI,
  brandTypeAPI,
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
import CategoryIcon from "@mui/icons-material/Category";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useTranslation } from "react-i18next";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const DataEntryForm = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [activeListTab, setActiveListTab] = useState(0); // State for list tabs
  const [stores, setStores] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Pagination states
  const [storesPage, setStoresPage] = useState(0);
  const [brandsPage, setBrandsPage] = useState(0);
  const [productsPage, setProductsPage] = useState(0);
  const [giftsPage, setGiftsPage] = useState(0);
  const [adsPage, setAdsPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [storeTypes, setStoreTypes] = useState([]);
  const [brandTypes, setBrandTypes] = useState([]);

  // Refs for file inputs
  const brandLogoFileRef = useRef(null);
  const productImageFileRef = useRef(null);
  const editProductImageFileRef = useRef(null);
  const storeLogoFileRef = useRef(null);
  const giftImageFileRef = useRef(null);
  const editGiftImageFileRef = useRef(null);
  const adImageFileRef = useRef(null);
  const editAdImageFileRef = useRef(null);

  // Brand form state
  const [brandForm, setBrandForm] = useState({
    name: "",
    logo: "",
    address: "",
    phone: "",
    description: "",
    isVip: false,
    brandTypeId: "",
  });
  // Store form state
  const [storeForm, setStoreForm] = useState({
    name: "",
    logo: "",
    address: "",
    phone: "",
    description: "",
    isVip: false,
    storeTypeId: "",
    branches: [],
    show: true,
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
    storeId: "",
    storeTypeId: "",
    expireDate: "",
  });

  // Ad form state
  const [adForm, setAdForm] = useState({
    image: "",
    brandId: "",
    storeId: "",
    giftId: "",
    startDate: "",
    endDate: "",
    linkUrl: "",
    active: true,
    priority: 0,
    pages: ["all"],
  });

  const [selectedAdImage, setSelectedAdImage] = useState(null);

  // Gift form state
  const [giftForm, setGiftForm] = useState({
    image: "",
    description: "",
    storeId: [],
    brandId: "",
    productId: "",
    expireDate: "",
  });

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    storeType: "market",
    types: [""], // Array of category types
  });

  // File upload state
  const [selectedBrandLogo, setSelectedBrandLogo] = useState(null);
  const [selectedProductImage, setSelectedProductImage] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedExcelFile, setSelectedExcelFile] = useState(null);
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [selectedEditImage, setSelectedEditImage] = useState(null);
  const [selectedStoreLogo, setSelectedStoreLogo] = useState(null);
  const [selectedGiftImage, setSelectedGiftImage] = useState(null);
  const [selectedEditGiftImage, setSelectedEditGiftImage] = useState(null);

  // Brand and Store bulk upload state
  const [selectedBrandExcelFile, setSelectedBrandExcelFile] = useState(null);
  const [selectedStoreExcelFile, setSelectedStoreExcelFile] = useState(null);
  const [brandBulkUploadLoading, setBrandBulkUploadLoading] = useState(false);
  const [storeBulkUploadLoading, setStoreBulkUploadLoading] = useState(false);
  const [deleteExpiredLoading, setDeleteExpiredLoading] = useState(false);

  const [selectedStoreFilter, setSelectedStoreFilter] = useState("");
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
  const [addDialog, setAddDialog] = useState({ open: false, type: "" });
  const [bulkDialog, setBulkDialog] = useState({ open: false, type: "" });
  const showTopAdd = false;

  // Load store types for dynamic selects
  useEffect(() => {
    (async () => {
      try {
        const res = await storeTypeAPI.getAll();
        setStoreTypes(res.data || []);
      } catch (e) {
        // ignore
      }
      try {
        const res = await brandTypeAPI.getAll();
        setBrandTypes(res.data || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Edit dialog form state
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchStores();
    fetchBrands();
    fetchCategories();
    fetchGifts();
    fetchAds();
  }, []);

  useEffect(() => {
    fetchProducts(selectedStoreFilter);
  }, [selectedStoreFilter]);

  const fetchStores = async () => {
    try {
      const response = await storeAPI.getAllIncludingHidden();
      setStores(response.data);
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  };

  const fetchProducts = async (storeId) => {
    try {
      if (storeId) {
        const response = await productAPI.getByStore(storeId);
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
      setGifts(response.data.data || []);
    } catch (err) {
      console.error("Error fetching gifts:", err);
      setGifts([]);
    }
  };

  const fetchAds = async () => {
    try {
      const response = await adAPI.getAll();
      setAds(response.data);
    } catch (err) {
      console.error("Error fetching ads:", err);
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

  const handleStoreFormChange = (e) => {
    setStoreForm({
      ...storeForm,
      [e.target.name]: e.target.value,
    });
  };

  // Handler for the new list tabs
  const handleListTabChange = (event, newValue) => {
    setActiveListTab(newValue);
  };

  // Pagination handlers
  const handleStoresPageChange = (event, newPage) => {
    setStoresPage(newPage);
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
    setSelectedStoreFilter(e.target.value);
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
    setGiftForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file selection for brand logo
  const handleBrandLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedBrandLogo(file);
    }
  };

  // Handle file selection for store logo
  const handleStoreLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedStoreLogo(file);
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

  // Upload store logo
  const uploadStoreLogo = async (file) => {
    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await fetch(`${API_URL}/api/stores/upload-logo`, {
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

  // Handle Store Excel file selection
  const handleStoreExcelFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedStoreExcelFile(file);
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

      fetchProducts(selectedStoreFilter); // Refresh products list
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

  const handleAdSubmit = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      let imageUrl = adForm.image;
      if (selectedAdImage) {
        setUploadLoading(true);
        const formData = new FormData();
        formData.append("image", selectedAdImage);
        const resp = await fetch(`${API_URL}/api/ads/upload-image`, {
          method: "POST",
          body: formData,
        });
        if (!resp.ok) throw new Error("Failed to upload ad image");
        const data = await resp.json();
        imageUrl = data.url;
        setUploadLoading(false);
      }

      const payload = {
        image: imageUrl,
        brandId: adForm.brandId || undefined,
        storeId: adForm.storeId || undefined,
        giftId: adForm.giftId || undefined,
        startDate: adForm.startDate
          ? new Date(adForm.startDate).toISOString()
          : undefined,
        endDate: adForm.endDate
          ? new Date(adForm.endDate).toISOString()
          : undefined,
        linkUrl: adForm.linkUrl || "",
        active: !!adForm.active,
        priority: Number(adForm.priority) || 0,
        pages: (adForm.pages && adForm.pages.length
          ? adForm.pages
          : ["all"]
        ).map((p) => String(p).toLowerCase()),
      };

      await adAPI.create(payload);
      setMessage({ type: "success", text: t("Ad created successfully!") });
      setAdForm({
        image: "",
        brandId: "",
        storeId: "",
        giftId: "",
        startDate: "",
        endDate: "",
        linkUrl: "",
        active: true,
        priority: 0,
        pages: ["all"],
      });
      setSelectedAdImage(null);
      fetchAds();
    } catch (err) {
      setMessage({
        type: "error",
        text: t("Failed to create ad. Please try again."),
      });
      console.error("Error creating ad:", err);
    } finally {
      setLoading(false);
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

  // Process Excel file and create stores
  const handleStoreBulkUpload = async (e) => {
    e.preventDefault();
    if (!selectedStoreExcelFile) {
      setMessage({
        type: "error",
        text: t("Please select an Excel file."),
      });
      return;
    }

    setStoreBulkUploadLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("excelFile", selectedStoreExcelFile);

      const response = await fetch(`${API_URL}/api/stores/bulk-upload`, {
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
        text: t("Successfully uploaded {{count}} stores", {
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

      fetchStores(); // Refresh stores list
      setSelectedStoreExcelFile(null); // Clear file input
    } catch (err) {
      setMessage({
        type: "error",
        text: "Failed to upload stores. Please check your Excel file format.",
      });
      console.error("Error uploading stores:", err);
    } finally {
      setStoreBulkUploadLoading(false);
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
      setUploadLoading(false);

      const brandData = {
        ...brandForm,
        logo: logoUrl,
      };

      const result = await brandAPI.create(brandData);
      setMessage({ type: "success", text: t("Brand created successfully!") });
      setBrandForm({
        name: "",
        logo: "",
        address: "",
        phone: "",
        brandTypeId: "",
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
  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      let logoUrl = "";

      if (selectedStoreLogo) {
        setUploadLoading(true);
        logoUrl = await uploadStoreLogo(selectedStoreLogo);
        setUploadLoading(false);
      }

      const storeData = {
        ...storeForm,
        logo: logoUrl,
      };

      await storeAPI.create(storeData);
      setMessage({ type: "success", text: t("Store created successfully!") });
      setStoreForm({
        name: "",
        logo: "",
        address: "",
        phone: "",
        description: "",
        isVip: false,
        storeTypeId: "",
        branches: [],
        show: true,
      });
      setSelectedStoreLogo(null);
      fetchStores(); // Refresh stores list
    } catch (err) {
      setMessage({
        type: "error",
        text: t("Failed to create store. Please try again."),
      });
      console.error("Error creating store:", err);
    } finally {
      setLoading(false);
      setUploadLoading(false);
    }
  };
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      let imageUrl = "";
      if (selectedProductImage) {
        setUploadLoading(true);
        imageUrl = await uploadProductImage(selectedProductImage);
        setUploadLoading(false);
      }

      const productData = {
        ...productForm,
        ...(imageUrl ? { image: imageUrl } : {}),
        previousPrice: parseFloat(productForm.previousPrice) || null,
        newPrice: parseFloat(productForm.newPrice) || null,
        isDiscount: productForm.isDiscount,
        barcode: productForm.barcode || null,
        weight: productForm.weight || null,
        expireDate: productForm.expireDate
          ? new Date(productForm.expireDate).toISOString()
          : null,
        brandId: productForm.brandId || null,
        categoryId: productForm.categoryId,
        categoryTypeId: productForm.categoryTypeId,
        storeId: productForm.storeId,
        storeTypeId: productForm.storeTypeId,
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
        storeId: "",
        brandId: "",
        categoryId: "",
        categoryTypeId: "",
        storeTypeId: "",
        expireDate: "",
      });
      setSelectedProductImage(null);
      if (productImageFileRef.current) {
        productImageFileRef.current.value = "";
      }
      fetchProducts(selectedStoreFilter);
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

    if (!giftForm.storeId || giftForm.storeId.length === 0) {
      setMessage({
        type: "error",
        text: t("Please select at least one store."),
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
        storeId: giftForm.storeId,
        brandId: giftForm.brandId || null,
        productId: giftForm.productId || null,
        expireDate: giftForm.expireDate
          ? new Date(giftForm.expireDate).toISOString()
          : null,
      };

      const response = await giftAPI.create(giftData);
      setMessage({ type: "success", text: t("Gift created successfully!") });
      setGiftForm({
        image: "",
        description: "",
        storeId: [],
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

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!categoryForm.name.trim()) {
      setMessage({
        type: "error",
        text: t("Please enter a category name."),
      });
      setLoading(false);
      return;
    }

    if (
      !categoryForm.types ||
      categoryForm.types.length === 0 ||
      categoryForm.types.every((type) => !type.trim())
    ) {
      setMessage({
        type: "error",
        text: t("Please enter at least one category type."),
      });
      setLoading(false);
      return;
    }

    try {
      // Filter out empty types and convert to proper format
      const validTypes = categoryForm.types
        .filter((type) => type.trim() !== "")
        .map((type) => ({
          name: type.trim(),
          description: "", // Optional description field
        }));

      const categoryData = {
        name: categoryForm.name.trim(),
        storeTypeId: categoryForm.storeTypeId || "",
        types: validTypes,
      };

      const response = await categoryAPI.create(categoryData);
      setMessage({
        type: "success",
        text: t("Category created successfully!"),
      });
      setCategoryForm({
        name: "",
        storeTypeId: "",
        types: [""],
      });
      fetchCategories();
    } catch (err) {
      setMessage({
        type: "error",
        text: t("Failed to create category. Please try again."),
      });
      console.error("Error creating category:", err);
    } finally {
      setLoading(false);
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
        isVip: !!data.isVip,
        brandTypeId:
          (data.brandTypeId && data.brandTypeId._id) || data.brandTypeId || "",
        description: data.description || "",
      });
    } else if (type === "store") {
      setEditForm({
        name: data.name,
        logo: data.logo,
        address: data.address,
        phone: data.phone,
        isVip: !!data.isVip,
        storeTypeId:
          (data.storeTypeId && data.storeTypeId._id) || data.storeTypeId || "",
        description: data.description || "",
        branches: data.branches || [],
        show: data.show !== undefined ? data.show : true,
      });
    } else if (type === "category") {
      setEditForm({
        name: data.name || "",
        storeTypeId:
          (data.storeTypeId && data.storeTypeId._id) || data.storeTypeId || "",
        types: Array.isArray(data.types)
          ? data.types.map((t) => (typeof t === "string" ? t : t.name || ""))
          : [""],
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
        storeId: data.storeId?._id || data.storeId,
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
        storeId: data.storeId?.map((m) => m._id) || data.storeId || [],
        brandId: data.brandId?._id || data.brandId || "",
        productId: data.productId || "",
        expireDate: data.expireDate
          ? new Date(data.expireDate).toISOString().split("T")[0]
          : "",
      });
    } else if (type === "ad") {
      setEditForm({
        image: data.image || "",
        brandId: data.brandId?._id || data.brandId || "",
        storeId: data.storeId?._id || data.storeId || "",
        giftId: data.giftId?._id || data.giftId || "",
        startDate: data.startDate
          ? new Date(data.startDate).toISOString().split("T")[0]
          : "",
        endDate: data.endDate
          ? new Date(data.endDate).toISOString().split("T")[0]
          : "",
        linkUrl: data.linkUrl || "",
        active: !!data.active,
        priority: data.priority ?? 0,
        pages:
          Array.isArray(data.pages) && data.pages.length
            ? data.pages
            : [data.page || "all"],
      });
    }

    setEditDialog({ open: true, type, data });
  };

  // Edit Category Types handlers
  const handleEditCategoryTypeChange = (index, value) => {
    setEditForm((prev) => {
      const updated = [...(prev.types || [""])];
      updated[index] = value;
      return { ...prev, types: updated };
    });
  };

  const addEditCategoryType = () => {
    setEditForm((prev) => ({ ...prev, types: [...(prev.types || []), ""] }));
  };

  const removeEditCategoryType = (index) => {
    setEditForm((prev) => {
      const updated = [...(prev.types || [])];
      if (updated.length <= 1) return prev;
      updated.splice(index, 1);
      return { ...prev, types: updated };
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    const nextValue =
      name === "pages" && typeof value === "string" ? value.split(",") : value;
    setEditForm({ ...editForm, [name]: nextValue });

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
      } else if (editDialog.type === "store") {
        let logoUrl = editForm.logo;
        if (selectedEditImage) {
          logoUrl = await uploadStoreLogo(selectedEditImage);
        }

        await storeAPI.update(editDialog.data._id, {
          ...editForm,
          logo: logoUrl,
        });
        setMessage({
          type: "success",
          text: t("Store updated successfully!"),
        });
        fetchStores();
      } else if (editDialog.type === "category") {
        const validTypes = (editForm.types || [])
          .filter((t) => (t || "").trim() !== "")
          .map((t) => ({ name: t.trim(), description: "" }));
        await categoryAPI.update(editDialog.data._id, {
          name: (editForm.name || "").trim(),
          storeTypeId: editForm.storeTypeId || "",
          types: validTypes,
        });
        setMessage({
          type: "success",
          text: t("Category updated successfully!"),
        });
        fetchCategories();
      } else if (editDialog.type === "storeType") {
        // Save store type edit via API
        await fetch(`${API_URL}/api/store-types/${editForm._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: (editForm.name || "").trim(),
            icon: editForm.icon || "",
          }),
        });
        const res = await storeTypeAPI.getAll();
        setStoreTypes(res.data || []);
        setMessage({
          type: "success",
          text: t("Store Type updated successfully!"),
        });
      } else if (editDialog.type === "brandType") {
        await brandTypeAPI.update(editDialog.data._id, {
          name: (editForm.name || "").trim(),
          icon: editForm.icon || "",
        });
        const res = await brandTypeAPI.getAll();
        setBrandTypes(res.data || []);
        setMessage({
          type: "success",
          text: t("Brand Type updated successfully!"),
        });
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
          storeId: editForm.storeId,
          storeTypeId: editForm.storeTypeId,
        };

        await productAPI.update(editDialog.data._id, productUpdateData);
        setMessage({
          type: "success",
          text: t("Product updated successfully!"),
        });
        fetchProducts(selectedStoreFilter);
      } else if (editDialog.type === "gift") {
        let imageUrl = editForm.image;
        if (selectedEditGiftImage) {
          imageUrl = await uploadGiftImage(selectedEditGiftImage);
        }

        const giftUpdateData = {
          ...editForm,
          image: imageUrl,
          storeId: editForm.storeId,
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
      } else if (editDialog.type === "ad") {
        let imageUrl = editForm.image;
        if (editAdImageFileRef?.current?.files?.[0]) {
          // reuse generic upload to /api/ads/upload-image via fetch for consistency
          setUploadLoading(true);
          const file = editAdImageFileRef.current.files[0];
          const formData = new FormData();
          formData.append("image", file);
          const resp = await fetch(`${API_URL}/api/ads/upload-image`, {
            method: "POST",
            body: formData,
          });
          if (!resp.ok) throw new Error("Failed to upload ad image");
          const data = await resp.json();
          imageUrl = data.url;
          setUploadLoading(false);
        }

        const adUpdate = {
          image: imageUrl,
          brandId: editForm.brandId || undefined,
          storeId: editForm.storeId || undefined,
          giftId: editForm.giftId || undefined,
          startDate: editForm.startDate
            ? new Date(editForm.startDate).toISOString()
            : undefined,
          endDate: editForm.endDate
            ? new Date(editForm.endDate).toISOString()
            : undefined,
          linkUrl: editForm.linkUrl || "",
          active: !!editForm.active,
          priority: Number(editForm.priority) || 0,
          pages: (Array.isArray(editForm.pages) && editForm.pages.length
            ? editForm.pages
            : [editForm.page || "all"]
          ).map((p) => String(p).toLowerCase()),
        };

        await adAPI.update(editDialog.data._id, adUpdate);
        setMessage({ type: "success", text: t("Ad updated successfully!") });
        fetchAds();
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
        fetchProducts(selectedStoreFilter); // Refresh products as some might be deleted
      } else if (deleteDialog.type === "product") {
        await productAPI.delete(deleteDialog.data._id);
        setMessage({
          type: "success",
          text: t("Product deleted successfully!"),
        });
        fetchProducts(selectedStoreFilter);
      } else if (deleteDialog.type === "gift") {
        await giftAPI.delete(deleteDialog.data._id);
        setMessage({
          type: "success",
          text: t("Gift deleted successfully!"),
        });
        fetchGifts();
      } else if (deleteDialog.type === "ad") {
        await adAPI.delete(deleteDialog.data._id);
        setMessage({ type: "success", text: t("Ad deleted successfully!") });
        fetchAds();
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
  const handleDeleteCategoryConfirm = async () => {
    setDeleteLoading(true);
    try {
      await categoryAPI.delete(deleteDialog.data._id);
      setMessage({
        type: "success",
        text: t("Category deleted successfully!"),
      });
      fetchCategories();
    } catch (e) {
      setMessage({ type: "error", text: t("Failed to delete category.") });
    } finally {
      setDeleteLoading(false);
      setDeleteDialog({ open: false, type: "", data: null });
    }
  };
  const handleDeleteStoreTypeConfirm = async () => {
    setDeleteLoading(true);
    try {
      await fetch(`${API_URL}/api/store-types/${deleteDialog.data._id}`, {
        method: "DELETE",
      });
      const res = await storeTypeAPI.getAll();
      setStoreTypes(res.data || []);
      setMessage({
        type: "success",
        text: t("Store Type deleted successfully!"),
      });
    } catch (e) {
      setMessage({ type: "error", text: t("Failed to delete store type.") });
    } finally {
      setDeleteLoading(false);
      setDeleteDialog({ open: false, type: "", data: null });
    }
  };
  const handleDeleteStoreConfirm = async () => {
    setDeleteLoading(true);
    try {
      if (deleteDialog.type === "store") {
        await storeAPI.delete(deleteDialog.data._id);
        setMessage({
          type: "success",
          text: t("Store deleted successfully!"),
        });
        fetchStores();
        fetchProducts(selectedStoreFilter); // Refresh products as some might be deleted
      } else if (deleteDialog.type === "product") {
        await productAPI.delete(deleteDialog.data._id);
        setMessage({
          type: "success",
          text: t("Product deleted successfully!"),
        });
        fetchProducts(selectedStoreFilter);
      } else if (deleteDialog.type === "gift") {
        await giftAPI.delete(deleteDialog.data._id);
        setMessage({
          type: "success",
          text: t("Gift deleted successfully!"),
        });
        fetchGifts();
      } else if (deleteDialog.type === "ad") {
        await adAPI.delete(deleteDialog.data._id);
        setMessage({ type: "success", text: t("Ad deleted successfully!") });
        fetchAds();
      }
      setDeleteDialog({ open: false, type: "", data: null });
    } catch (err) {
      console.log("Full error from backend:", err);
      console.log("Error response object:", err.response);
      let errorMsg = t("Failed to delete. Please try again.");
      if (
        err.response?.data?.msg ===
        "Cannot delete store. It has associated products. Please delete the products first."
      ) {
        errorMsg = t(
          "Cannot delete store. It has associated products. Please delete the products first."
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

  const handleCategoryFormChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryTypeChange = (index, value) => {
    setCategoryForm((prev) => {
      const newTypes = [...prev.types];
      newTypes[index] = value;
      return {
        ...prev,
        types: newTypes,
      };
    });
  };

  const addCategoryType = () => {
    setCategoryForm((prev) => ({
      ...prev,
      types: [...prev.types, ""],
    }));
  };

  const removeCategoryType = (index) => {
    setCategoryForm((prev) => ({
      ...prev,
      types: prev.types.filter((_, i) => i !== index),
    }));
  };

  const handleDeleteExpiredDiscountProducts = async () => {
    try {
      // Find expired discount products first
      const expiredDiscountProducts = products.filter((product) => {
        if (!product.isDiscount || !product.expireDate) return false;

        const currentDate = new Date();
        const expireDate = new Date(product.expireDate);
        return currentDate > expireDate;
      });

      if (expiredDiscountProducts.length === 0) {
        setMessage({
          type: "info",
          text: t("No expired discount products found."),
        });
        return;
      }

      // Show confirmation dialog with count
      const confirmed = window.confirm(
        t(
          "Are you sure you want to delete {{count}} expired discount products? This action cannot be undone.",
          { count: expiredDiscountProducts.length }
        )
      );

      if (!confirmed) return;

      setDeleteExpiredLoading(true);

      // Delete expired discount products
      let deletedCount = 0;
      for (const product of expiredDiscountProducts) {
        try {
          await productAPI.delete(product._id);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete product ${product._id}:`, error);
        }
      }

      // Refresh products list
      await fetchProducts(selectedStoreFilter);

      setMessage({
        type: "success",
        text: t("Successfully deleted {{count}} expired discount products.", {
          count: deletedCount,
        }),
      });
    } catch (error) {
      console.error("Error deleting expired discount products:", error);
      setMessage({
        type: "error",
        text: t(
          "Failed to delete expired discount products. Please try again."
        ),
      });
    } finally {
      setDeleteExpiredLoading(false);
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
              ? "linear-gradient(135deg, #52b788 0%, #40916c 100%)"
              : "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
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
                    {t("Manage stores and products efficiently")}
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
                  label={`${t("Stores")}(${stores.length})`}
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

      {/* Enhanced Tabs */}

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
              label={t("Stores")}
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
              label={t("Categories")}
              icon={<CategoryIcon />}
              iconPosition="start"
            />
            <Tab
              label={t("Gifts")}
              icon={<CardGiftcardIcon />}
              iconPosition="start"
            />
            <Tab
              label={t("Ads")}
              icon={<DashboardIcon />}
              iconPosition="start"
            />
            <Tab
              label={t("Store Types")}
              icon={<CategoryIcon />}
              iconPosition="start"
            />
            <Tab
              label={t("Brand Types")}
              icon={<CategoryIcon />}
              iconPosition="start"
            />
          </Tabs>

          {/* Store List Panel */}
          {activeListTab === 0 && (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddDialog({ open: true, type: "store" })}
                  >
                    {t("New Store")}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => setBulkDialog({ open: true, type: "store" })}
                  >
                    {t("Bulk Upload")}
                  </Button>
                </Box>
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
                        {t("Type")}
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
                      {/* <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Branches")}
                      </TableCell> */}
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        VIP
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Status")}
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
                    {stores
                      .slice(
                        storesPage * rowsPerPage,
                        storesPage * rowsPerPage + rowsPerPage
                      )
                      .map((store, idx) => (
                        <TableRow key={store._id}>
                          <TableCell>
                            {storesPage * rowsPerPage + idx + 1}
                          </TableCell>
                          <TableCell
                            width={200}
                            sx={{ fontSize: "18px", fontWeight: "bold" }}
                          >
                            {store.name}
                          </TableCell>
                          <TableCell>
                            {store.logo && (
                              <img
                                src={
                                  store.logo.startsWith("http")
                                    ? store.logo
                                    : `${API_URL}${store.logo}`
                                }
                                alt={store.name}
                                width={80}
                                height={80}
                                style={{
                                  objectFit: "cover",
                                  borderRadius: "4px",
                                }}
                              />
                            )}
                          </TableCell>
                          {/* <TableCell>{store.address}</TableCell> */}
                          <TableCell>{store.phone}</TableCell>
                          <TableCell>
                            {store.storeTypeId?.icon || store.storeType?.icon
                              ? `${
                                  store.storeTypeId?.icon ||
                                  store.storeType?.icon
                                } `
                              : ""}
                            {t(
                              store.storeTypeId?.name ||
                                store.storeType?.name ||
                                ""
                            )}
                          </TableCell>
                          <TableCell
                            width="100px"
                            height="100px"
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {store.description}
                          </TableCell>
                          {/* <TableCell>
                            {store.branches.map((branch) => (
                              <Box key={branch.name} sx={{ mb: 1 }}>
                                {branch.name}
                              </Box>
                            ))}
                          </TableCell> */}
                          <TableCell>
                            {store.isVip && (
                              <Box
                                sx={{
                                  backgroundColor: "#FFD700",
                                  borderRadius: "50%",
                                  width: 32,
                                  height: 32,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                  border: "2px solid #FFF",
                                  "&::before": {
                                    content: '"👑"',
                                    fontSize: "16px",
                                  },
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {store.show ? t("Visible") : t("Hidden")}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              color="primary"
                              onClick={() => handleEditOpen("store", store)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color={store.show ? "success" : "warning"}
                              onClick={async () => {
                                try {
                                  await storeAPI.toggleVisibility(store._id);
                                  // Refresh stores list
                                  fetchStores();
                                } catch (error) {
                                  console.error(
                                    "Error toggling store visibility:",
                                    error
                                  );
                                }
                              }}
                              title={
                                store.show ? t("Hide Store") : t("Show Store")
                              }
                            >
                              {store.show ? (
                                <VisibilityIcon />
                              ) : (
                                <VisibilityOffIcon />
                              )}
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  type: "store",
                                  data: store,
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
                count={stores.length}
                page={storesPage}
                onPageChange={handleStoresPageChange}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10]}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                }
              />
            </Box>
          )}

          {/* Store Types List Panel */}
          {activeListTab === 6 && (
            <Box>
              <Grid container spacing={2} alignItems="center">
                <Grid xs={12} sm={6}>
                  <Typography variant="h6">{t("Store Types")}</Typography>
                </Grid>
                <Grid
                  xs={12}
                  sm={6}
                  sx={{ textAlign: { xs: "left", sm: "right" } }}
                >
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() =>
                      setAddDialog({ open: true, type: "storeType" })
                    }
                  >
                    {t("Add Store Type")}
                  </Button>
                </Grid>
              </Grid>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("No.")}</TableCell>
                      <TableCell>{t("Name")}</TableCell>
                      <TableCell>{t("Icon")}</TableCell>
                      <TableCell>{t("Actions")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(storeTypes || []).map((st, idx) => (
                      <TableRow key={st._id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{st.name}</TableCell>
                        <TableCell style={{ fontSize: 18 }}>
                          {st.icon || "🏪"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1 }}
                            onClick={() => {
                              setEditDialog({
                                open: true,
                                type: "storeType",
                                data: st,
                              });
                              setEditForm({
                                _id: st._id,
                                name: st.name,
                                icon: st.icon || "",
                              });
                            }}
                          >
                            <EditIcon />
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                type: "storeType",
                                data: st,
                              })
                            }
                          >
                            <DeleteIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Brand Types List Panel */}
          {activeListTab === 7 && (
            <Box>
              <Grid container spacing={2} alignItems="center">
                <Grid xs={12} sm={6}>
                  <Typography variant="h6">{t("Brand Types")}</Typography>
                </Grid>
                <Grid
                  xs={12}
                  sm={6}
                  sx={{ textAlign: { xs: "left", sm: "right" } }}
                >
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() =>
                      setAddDialog({ open: true, type: "brandType" })
                    }
                  >
                    {t("Add Brand Type")}
                  </Button>
                </Grid>
              </Grid>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("No.")}</TableCell>
                      <TableCell>{t("Name")}</TableCell>
                      <TableCell>{t("Icon")}</TableCell>
                      <TableCell>{t("Actions")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(brandTypes || []).map((bt, idx) => (
                      <TableRow key={bt._id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{bt.name}</TableCell>
                        <TableCell style={{ fontSize: 18 }}>
                          {bt.icon || "🏷️"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1 }}
                            onClick={() => {
                              setEditDialog({
                                open: true,
                                type: "brandType",
                                data: bt,
                              });
                              setEditForm({
                                _id: bt._id,
                                name: bt.name,
                                icon: bt.icon || "",
                              });
                            }}
                          >
                            <EditIcon />
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                type: "brandType",
                                data: bt,
                              })
                            }
                          >
                            <DeleteIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Brand List Panel */}
          {activeListTab === 1 && (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddDialog({ open: true, type: "brand" })}
                  >
                    {t("New Brand")}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => setBulkDialog({ open: true, type: "brand" })}
                  >
                    {t("Bulk Upload")}
                  </Button>
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
                        {t("Type")}
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
                        VIP
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
                          <TableCell>
                            {brand.brandTypeId?.name || brand.type || ""}
                          </TableCell>
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
                            {brand.isVip && (
                              <Box
                                sx={{
                                  backgroundColor: "#FFD700",
                                  borderRadius: "50%",
                                  width: 32,
                                  height: 32,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                  border: "2px solid #FFF",
                                  "&::before": {
                                    content: '"👑"',
                                    fontSize: "16px",
                                  },
                                }}
                              />
                            )}
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
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    justifyContent: "flex-start",
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() =>
                      setAddDialog({ open: true, type: "product" })
                    }
                  >
                    {t("New Product")}
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{
                      justifyContent: "flex-start",
                    }}
                    startIcon={<CloudUploadIcon />}
                    onClick={() =>
                      setBulkDialog({ open: true, type: "product" })
                    }
                  >
                    {t("Bulk Upload")}
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    disabled={deleteExpiredLoading}
                    sx={{
                      justifyContent: "flex-start",
                    }}
                    startIcon={
                      deleteExpiredLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <DeleteIcon />
                      )
                    }
                    onClick={handleDeleteExpiredDiscountProducts}
                  >
                    {deleteExpiredLoading
                      ? t("Deleting...")
                      : t("Delete Expired Discount Products")}
                  </Button>
                </Box>
                <FormControl sx={{ minWidth: 240, justifyContent: "flex-end" }}>
                  <InputLabel>{t("Search by Store")}</InputLabel>
                  <Select
                    value={selectedStoreFilter}
                    onChange={handleFilterChange}
                    label={t("Search by Store")}
                  >
                    <MenuItem value="">
                      <em>{t("All Stores")}</em>
                    </MenuItem>
                    {stores.map((store) => (
                      <MenuItem key={store._id} value={store._id}>
                        {store.name}
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
                        {t("Barcode")}
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
                        {t("Store")}
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
                          <TableCell>{product.barcode || ""}</TableCell>
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
                          <TableCell>{product.storeId?.name || ""}</TableCell>
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

          {/* Categories List Panel (with image upload) */}
          {activeListTab === 3 && (
            <Box>
              <Box
                sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}
              >
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddDialog({ open: true, type: "category" })}
                >
                  {t("New Category")}
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
                        {t("Store Type")}
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
                        {t("Change Image")}
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
                    {categories.map((cat, idx) => (
                      <TableRow key={cat._id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{cat.name}</TableCell>
                        <TableCell>
                          {cat.storeTypeId?.icon || cat.storeType?.icon
                            ? `${cat.storeTypeId?.icon || cat.storeType?.icon} `
                            : ""}
                          {t(
                            cat.storeTypeId?.name || cat.storeType?.name || ""
                          )}
                        </TableCell>
                        <TableCell>
                          {cat.image ? (
                            <img
                              src={`${API_URL}${cat.image}`}
                              alt={cat.name}
                              width={60}
                              height={60}
                              style={{ objectFit: "cover", borderRadius: 4 }}
                            />
                          ) : (
                            <Chip label={t("No Image")} size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <input
                            id={`cat-image-${cat._id}`}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const formData = new FormData();
                                formData.append("image", file);
                                const res = await fetch(
                                  `${API_URL}/api/categories/${cat._id}/image`,
                                  { method: "POST", body: formData }
                                );
                                if (!res.ok) {
                                  const text = await res.text();
                                  throw new Error(
                                    text || `Upload failed (${res.status})`
                                  );
                                }
                                const json = await res.json();
                                setMessage({
                                  type: "success",
                                  text: t("Image uploaded"),
                                });
                                // refresh categories list
                                fetchCategories();
                              } catch (err) {
                                setMessage({
                                  type: "error",
                                  text: err.message || t("Upload failed"),
                                });
                              } finally {
                                e.target.value = "";
                              }
                            }}
                          />
                          <label htmlFor={`cat-image-${cat._id}`}>
                            <Button
                              variant="outlined"
                              size="small"
                              component="span"
                              startIcon={<CloudUploadIcon />}
                              disabled={editLoading}
                            >
                              {t("Upload Image")}
                            </Button>
                          </label>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => handleEditOpen("category", cat)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                type: "category",
                                data: cat,
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

          {/* Gift List Panel */}
          {activeListTab === 4 && (
            <Box>
              <Box
                sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}
              >
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddDialog({ open: true, type: "gift" })}
                >
                  {t("New Gift")}
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
                        {t("Stores")}
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
                              {gift.storeId?.map((store) => (
                                <Chip
                                  key={store._id || store}
                                  label={store.name || store}
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

          {/* Ads List Panel */}
          {activeListTab === 5 && (
            <Box>
              <Box
                sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}
              >
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddDialog({ open: true, type: "ad" })}
                >
                  {t("New Ad")}
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
                        {t("Image")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Page")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Link URL")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Active")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Priority")}
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
                        {t("Store")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Gift")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("Start")}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        {t("End")}
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
                    {ads
                      .slice(
                        adsPage * rowsPerPage,
                        adsPage * rowsPerPage + rowsPerPage
                      )
                      .map((ad, idx) => (
                        <TableRow key={ad._id}>
                          <TableCell>
                            {adsPage * rowsPerPage + idx + 1}
                          </TableCell>
                          <TableCell>
                            {ad.image && (
                              <img
                                src={
                                  ad.image.startsWith("http")
                                    ? ad.image
                                    : `${API_URL}${ad.image}`
                                }
                                alt="ad"
                                width={80}
                                height={80}
                                style={{ objectFit: "cover", borderRadius: 4 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {Array.isArray(ad.pages) && ad.pages.length
                              ? ad.pages
                                  .map((p) =>
                                    t(p.charAt(0).toUpperCase() + p.slice(1))
                                  )
                                  .join(", ")
                              : t("All")}
                          </TableCell>
                          <TableCell>
                            <Typography
                              sx={{
                                maxWidth: 240,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {ad.linkUrl || ""}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {ad.active ? t("Yes") : t("No")}
                          </TableCell>
                          <TableCell>{ad.priority ?? 0}</TableCell>
                          <TableCell>
                            {ad.brandId &&
                              (brands.find((b) => b._id === ad.brandId)?.name ||
                                ad.brandId)}
                          </TableCell>
                          <TableCell>
                            {ad.storeId &&
                              (stores.find((s) => s._id === ad.storeId)?.name ||
                                ad.storeId)}
                          </TableCell>
                          <TableCell>
                            {ad.giftId &&
                              (gifts.find((g) => g._id === ad.giftId)
                                ?.description ||
                                ad.giftId)}
                          </TableCell>
                          <TableCell>
                            {ad.startDate
                              ? new Date(ad.startDate).toLocaleDateString()
                              : ""}
                          </TableCell>
                          <TableCell>
                            {ad.endDate
                              ? new Date(ad.endDate).toLocaleDateString()
                              : ""}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              color="primary"
                              onClick={() => handleEditOpen("ad", ad)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  type: "ad",
                                  data: ad,
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
                count={ads.length}
                page={adsPage}
                onPageChange={(e, p) => setAdsPage(p)}
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

      {/* Add Dialog */}
      <Dialog
        open={addDialog.open}
        onClose={() => setAddDialog({ open: false, type: "" })}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {addDialog.type === "brand"
            ? t("Add Brand")
            : addDialog.type === "store"
            ? t("Add Store")
            : addDialog.type === "gift"
            ? t("Add Gift")
            : addDialog.type === "category"
            ? t("Add Category")
            : addDialog.type === "ad"
            ? t("Add Ad")
            : addDialog.type === "storeType"
            ? t("Add Store Type")
            : addDialog.type === "brandType"
            ? t("Add Brand Type")
            : t("Add Product")}
        </DialogTitle>
        <DialogContent dividers>
          {message.text && (
            <Fade in={true}>
              <Alert severity={message.type} sx={{ mb: 3 }}>
                {message.text}
              </Alert>
            </Fade>
          )}

          {addDialog.type === "store" && (
            <Box component="form" onSubmit={handleStoreSubmit} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Store Name")}
                    name="name"
                    value={storeForm.name}
                    onChange={handleStoreFormChange}
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
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel shrink>{t("Store Type")}</InputLabel>
                    <Select
                      name="storeTypeId"
                      value={storeForm.storeTypeId}
                      onChange={handleStoreFormChange}
                      label={t("Store Type")}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>{t("Select Store Type")}</em>
                      </MenuItem>
                      {storeTypes.map((st) => (
                        <MenuItem key={st._id} value={st._id}>
                          {st.icon || "🏪"} {t(st.name)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label={t("Address")}
                    name="address"
                    value={storeForm.address}
                    onChange={handleStoreFormChange}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Phone")}
                    name="phone"
                    value={storeForm.phone}
                    onChange={handleStoreFormChange}
                  />
                </Grid>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label={t("Description")}
                    name="description"
                    value={storeForm.description}
                    onChange={handleStoreFormChange}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid xs={12}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="dialog-store-logo-file"
                    type="file"
                    onChange={handleStoreLogoChange}
                  />
                  <label htmlFor="dialog-store-logo-file">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<AddIcon />}
                    >
                      {selectedStoreLogo
                        ? selectedStoreLogo.name
                        : t("Upload Logo")}
                    </Button>
                  </label>
                </Grid>
                <Grid xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isVip"
                        checked={storeForm.isVip}
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            isVip: e.target.checked,
                          })
                        }
                      />
                    }
                    label={t("VIP Store")}
                  />
                </Grid>
                <Grid xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="show"
                        checked={storeForm.show}
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            show: e.target.checked,
                          })
                        }
                      />
                    }
                    label={t("Show in Store List")}
                  />
                </Grid>
                <Grid xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t("Branches")}
                  </Typography>
                  {storeForm.branches.map((branch, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 2,
                        p: 2,
                        border: "1px solid #ddd",
                        borderRadius: 1,
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label={t("Branch Name")}
                            value={branch.name || ""}
                            onChange={(e) => {
                              const newBranches = [...storeForm.branches];
                              newBranches[index] = {
                                ...branch,
                                name: e.target.value,
                              };
                              setStoreForm({
                                ...storeForm,
                                branches: newBranches,
                              });
                            }}
                          />
                        </Grid>
                        <Grid xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label={t("Branch Address")}
                            value={branch.address || ""}
                            onChange={(e) => {
                              const newBranches = [...storeForm.branches];
                              newBranches[index] = {
                                ...branch,
                                address: e.target.value,
                              };
                              setStoreForm({
                                ...storeForm,
                                branches: newBranches,
                              });
                            }}
                          />
                        </Grid>
                        <Grid xs={12}>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => {
                              const newBranches = storeForm.branches.filter(
                                (_, i) => i !== index
                              );
                              setStoreForm({
                                ...storeForm,
                                branches: newBranches,
                              });
                            }}
                          >
                            {t("Remove Branch")}
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setStoreForm({
                        ...storeForm,
                        branches: [
                          ...storeForm.branches,
                          { name: "", address: "" },
                        ],
                      });
                    }}
                    sx={{ mt: 1 }}
                  >
                    {t("Add Branch")}
                  </Button>
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
                      : t("Add Store")}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {addDialog.type === "storeType" && (
            <Box
              component="form"
              sx={{ mt: 1 }}
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const name = form.get("name");
                const icon = form.get("icon");
                try {
                  await fetch(`${API_URL}/api/store-types`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, icon }),
                  });
                  const res = await storeTypeAPI.getAll();
                  setStoreTypes(res.data || []);
                  setAddDialog({ open: false, type: "" });
                } catch (e) {}
              }}
            >
              <TextField
                margin="normal"
                name="name"
                label={t("Name")}
                fullWidth
                required
              />
              <TextField
                margin="normal"
                name="icon"
                label={t("Icon")}
                placeholder="e.g. 🛒"
                fullWidth
              />
              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                >
                  {t("Save")}
                </Button>
              </Box>
            </Box>
          )}

          {addDialog.type === "brandType" && (
            <Box
              component="form"
              sx={{ mt: 1 }}
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const name = form.get("name");
                const icon = form.get("icon");
                try {
                  await brandTypeAPI.create({ name, icon });
                  const res = await brandTypeAPI.getAll();
                  setBrandTypes(res.data || []);
                  setAddDialog({ open: false, type: "" });
                } catch (e) {}
              }}
            >
              <TextField
                margin="normal"
                name="name"
                label={t("Name")}
                fullWidth
                required
              />
              <TextField
                margin="normal"
                name="icon"
                label={t("Icon")}
                placeholder="e.g. 🏷️"
                fullWidth
              />
              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                >
                  {t("Save")}
                </Button>
              </Box>
            </Box>
          )}

          {addDialog.type === "brand" && (
            <Box component="form" onSubmit={handleBrandSubmit} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
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
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>{t("Brand Type")}</InputLabel>
                    <Select
                      name="brandTypeId"
                      value={brandForm.brandTypeId}
                      onChange={handleBrandFormChange}
                      label={t("Brand Type")}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>{t("Select Brand Type")}</em>
                      </MenuItem>
                      {brandTypes.map((bt) => (
                        <MenuItem key={bt._id} value={bt._id}>
                          {bt.icon || "🏷️"} {t(bt.name)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                    id="dialog-brand-logo-file"
                    type="file"
                    ref={brandLogoFileRef}
                    onChange={handleBrandLogoChange}
                  />
                  <label htmlFor="dialog-brand-logo-file">
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
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isVip"
                        checked={brandForm.isVip}
                        onChange={(e) =>
                          setBrandForm({
                            ...brandForm,
                            isVip: e.target.checked,
                          })
                        }
                      />
                    }
                    label={t("VIP Brand")}
                  />
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

          {addDialog.type === "product" && (
            <Box component="form" onSubmit={handleProductSubmit} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
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
                        <Checkbox
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
                    <InputLabel shrink>{t("Store")}</InputLabel>
                    <Select
                      name="storeId"
                      value={productForm.storeId}
                      onChange={handleProductFormChange}
                      label={t("Store")}
                      displayEmpty
                      labelId="dialog-add-product-store-label"
                    >
                      <MenuItem value="">
                        <em>{t("Select Store")}</em>
                      </MenuItem>
                      {stores.map((store) => (
                        <MenuItem key={store._id} value={store._id}>
                          {store.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel shrink>{t("Store Type")}</InputLabel>
                    <Select
                      name="storeTypeId"
                      value={productForm.storeTypeId}
                      onChange={handleProductFormChange}
                      label={t("Store Type")}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>{t("Select Store Type")}</em>
                      </MenuItem>
                      {storeTypes.map((st) => (
                        <MenuItem key={st._id} value={st._id}>
                          {st.icon || "🏪"} {t(st.name)}
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
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid xs={12}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="dialog-product-image-file"
                    type="file"
                    ref={productImageFileRef}
                    onChange={handleProductImageChange}
                  />
                  <label htmlFor="dialog-product-image-file">
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

          {addDialog.type === "gift" && (
            <Box component="form" onSubmit={handleGiftSubmit} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="dialog-gift-image"
                    type="file"
                    onChange={handleGiftImageChange}
                    ref={giftImageFileRef}
                  />
                  <label htmlFor="dialog-gift-image">
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
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t("Stores")}</InputLabel>
                    <Select
                      multiple
                      name="storeId"
                      value={giftForm.storeId}
                      onChange={handleGiftFormMultiChange}
                      label={t("Stores")}
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {selected.map((value) => {
                            const store = stores.find((m) => m._id === value);
                            return (
                              <Chip
                                key={value}
                                label={store ? store.name : value}
                                size="small"
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {stores.map((store) => (
                        <MenuItem key={store._id} value={store._id}>
                          {store.name}
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
                  >
                    {loading || uploadLoading
                      ? t("Creating...")
                      : t("Create Gift")}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {addDialog.type === "category" && (
            <Box
              component="form"
              onSubmit={handleCategorySubmit}
              sx={{ mt: 1 }}
            >
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Category Name")}
                    name="name"
                    value={categoryForm.name}
                    onChange={handleCategoryFormChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CategoryIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t("Store Type")}</InputLabel>
                    <Select
                      name="storeTypeId"
                      value={categoryForm.storeTypeId || ""}
                      onChange={handleCategoryFormChange}
                      label={t("Store Type")}
                    >
                      <MenuItem value="">
                        <em>{t("Select Store Type")}</em>
                      </MenuItem>
                      {storeTypes.map((st) => (
                        <MenuItem key={st._id} value={st._id}>
                          {st.icon || "🏪"} {t(st.name)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {t("Category Types")}
                  </Typography>
                  {categoryForm.types.map((type, index) => (
                    <Box key={index} sx={{ display: "flex", gap: 1, mb: 1 }}>
                      <TextField
                        fullWidth
                        label={`${t("Category Type")} ${index + 1}`}
                        value={type}
                        onChange={(e) =>
                          handleCategoryTypeChange(index, e.target.value)
                        }
                        placeholder={t("Enter category type name")}
                      />
                      <IconButton
                        onClick={() => removeCategoryType(index)}
                        disabled={categoryForm.types.length === 1}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    variant="outlined"
                    onClick={addCategoryType}
                    startIcon={<AddIcon />}
                    sx={{ mt: 1 }}
                  >
                    {t("Add Category Type")}
                  </Button>
                </Grid>
                <Grid xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={
                      loading ? <CircularProgress size={20} /> : <SaveIcon />
                    }
                    fullWidth
                  >
                    {loading ? t("Creating...") : t("Create Category")}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {addDialog.type === "ad" && (
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                handleAdSubmit();
              }}
              sx={{ mt: 1 }}
            >
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="dialog-ad-image-file"
                    type="file"
                    ref={adImageFileRef}
                    onChange={(e) =>
                      setSelectedAdImage(e.target.files?.[0] || null)
                    }
                  />
                  <label htmlFor="dialog-ad-image-file">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<AddIcon />}
                    >
                      {selectedAdImage
                        ? selectedAdImage.name
                        : t("Upload Image")}
                    </Button>
                  </label>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t("Pages")}</InputLabel>
                    <Select
                      multiple
                      name="pages"
                      value={adForm.pages}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAdForm({
                          ...adForm,
                          pages: Array.isArray(val)
                            ? val
                            : String(val).split(","),
                        });
                      }}
                      label={t("Pages")}
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {selected.map((value) => (
                            <Chip
                              key={value}
                              label={t(
                                value.charAt(0).toUpperCase() + value.slice(1)
                              )}
                              size="small"
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {["all", "home", "brands", "stores", "gifts"].map((p) => (
                        <MenuItem key={p} value={p}>
                          {t(p.charAt(0).toUpperCase() + p.slice(1))}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Link URL")}
                    value={adForm.linkUrl}
                    onChange={(e) =>
                      setAdForm({ ...adForm, linkUrl: e.target.value })
                    }
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel shrink>{t("Brand")}</InputLabel>
                    <Select
                      name="brandId"
                      value={adForm.brandId}
                      onChange={(e) =>
                        setAdForm({ ...adForm, brandId: e.target.value })
                      }
                      label={t("Brand")}
                      displayEmpty
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
                  <FormControl fullWidth>
                    <InputLabel shrink>{t("Store")}</InputLabel>
                    <Select
                      name="storeId"
                      value={adForm.storeId}
                      onChange={(e) =>
                        setAdForm({ ...adForm, storeId: e.target.value })
                      }
                      label={t("Store")}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>{t("None")}</em>
                      </MenuItem>
                      {stores.map((s) => (
                        <MenuItem key={s._id} value={s._id}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel shrink>{t("Gift")}</InputLabel>
                    <Select
                      name="giftId"
                      value={adForm.giftId}
                      onChange={(e) =>
                        setAdForm({ ...adForm, giftId: e.target.value })
                      }
                      label={t("Gift")}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>{t("None")}</em>
                      </MenuItem>
                      {gifts.map((g) => (
                        <MenuItem key={g._id} value={g._id}>
                          {g.description?.slice(0, 40) || g._id}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label={t("Start Date")}
                    InputLabelProps={{ shrink: true }}
                    value={adForm.startDate}
                    onChange={(e) =>
                      setAdForm({ ...adForm, startDate: e.target.value })
                    }
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label={t("End Date")}
                    InputLabelProps={{ shrink: true }}
                    value={adForm.endDate}
                    onChange={(e) =>
                      setAdForm({ ...adForm, endDate: e.target.value })
                    }
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t("Priority")}
                    value={adForm.priority}
                    onChange={(e) =>
                      setAdForm({ ...adForm, priority: Number(e.target.value) })
                    }
                  />
                </Grid>
                <Grid xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={adForm.active}
                        onChange={(e) =>
                          setAdForm({ ...adForm, active: e.target.checked })
                        }
                      />
                    }
                    label={t("Active")}
                  />
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
                    {loading || uploadLoading ? t("Creating...") : t("Add Ad")}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog({ open: false, type: "" })}>
            {t("Close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog
        open={bulkDialog.open}
        onClose={() => setBulkDialog({ open: false, type: "" })}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {bulkDialog.type === "brand"
            ? t("Bulk Upload")
            : bulkDialog.type === "store"
            ? t("Bulk Upload")
            : t("Bulk Upload")}
        </DialogTitle>
        <DialogContent dividers>
          {bulkDialog.type === "store" && (
            <Box sx={{ p: 1 }}>
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <input
                    accept=".xlsx,.xls"
                    style={{ display: "none" }}
                    id="bulk-store-excel-file"
                    type="file"
                    onChange={handleStoreExcelFileChange}
                  />
                  <label htmlFor="bulk-store-excel-file">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<AddIcon />}
                      sx={{ mb: 2 }}
                    >
                      {selectedStoreExcelFile
                        ? selectedStoreExcelFile.name
                        : t("Select Excel File")}
                    </Button>
                  </label>
                </Grid>
                <Grid xs={12}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const sampleData = [
                        ["Name", "Logo", "Address", "Phone", "Description"],
                        [
                          "Sample Store",
                          "logo_url_here",
                          "Sample Address",
                          "+1234567890",
                          "Sample description",
                        ],
                      ];
                      const csvContent = sampleData
                        .map((row) => row.join(","))
                        .join("\n");
                      const blob = new Blob([csvContent], { type: "text/csv" });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "store_template.csv";
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
                    onClick={handleStoreBulkUpload}
                    variant="contained"
                    disabled={storeBulkUploadLoading || !selectedStoreExcelFile}
                    startIcon={
                      storeBulkUploadLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <AddIcon />
                      )
                    }
                    fullWidth
                  >
                    {storeBulkUploadLoading
                      ? t("Uploading...")
                      : t("Upload Stores")}
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
                    <br />•{" "}
                    {t(
                      "Column F: Show in Store List (true/false, default: true)"
                    )}
                    <br />•{" "}
                    {t(
                      "Column G: Branches (JSON format: [{'name':'Branch1','address':'Address1'}])"
                    )}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {bulkDialog.type === "brand" && (
            <Box sx={{ p: 1 }}>
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <input
                    accept=".xlsx,.xls"
                    style={{ display: "none" }}
                    id="bulk-brand-excel-file"
                    type="file"
                    onChange={handleBrandExcelFileChange}
                  />
                  <label htmlFor="bulk-brand-excel-file">
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
                      const csvContent = sampleData
                        .map((row) => row.join(","))
                        .join("\n");
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

          {bulkDialog.type === "product" && (
            <Box sx={{ p: 1 }}>
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <input
                    accept=".xlsx,.xls"
                    style={{ display: "none" }}
                    id="bulk-product-excel-file"
                    type="file"
                    onChange={handleExcelFileChange}
                  />
                  <label htmlFor="bulk-product-excel-file">
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
                      const sampleData = [
                        [
                          "Barcode",
                          "Name",
                          "Type",
                          "Previous Price",
                          "New Price",
                          "Is Discount",
                          "Brand ID",
                          "Store ID",
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
                          "store_id_here",
                          "Sample description",
                          "2024-12-31",
                          "500g",
                        ],
                      ];
                      const csvContent = sampleData
                        .map((row) => row.join(","))
                        .join("\n");
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
                    onClick={(e) => {
                      e.preventDefault();
                      // reuse the existing bulk upload submit handler
                      const fakeEvent = { preventDefault: () => {} };
                      handleBulkUpload(fakeEvent);
                    }}
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
                    <br />• {t("Column I: Store ID (required)")}
                    <br />• {t("Column J: Description (optional)")}
                    <br />•{" "}
                    {t("Column K: Expire Date (optional, YYYY-MM-DD format)")}
                    <br />• {t("Column L: Weight (optional)")}
                    <br />• {t("Column M: Barcode (optional)")}
                    <br />• {t("Column N: Discount (optional)")}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialog({ open: false, type: "" })}>
            {t("Close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, type: "", data: null })}
      >
        <DialogTitle>
          {t(
            editDialog.type === "brand"
              ? "Edit Brand"
              : editDialog.type === "store"
              ? "Edit Store"
              : editDialog.type === "gift"
              ? "Edit Gift"
              : editDialog.type === "storeType"
              ? "Edit Store Type"
              : editDialog.type === "brandType"
              ? "Edit Brand Type"
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
              <FormControl fullWidth required sx={{ mt: 2 }}>
                <InputLabel shrink>{t("Brand Type")}</InputLabel>
                <Select
                  name="brandTypeId"
                  value={editForm.brandTypeId || ""}
                  onChange={handleEditFormChange}
                  label={t("Brand Type")}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>{t("Select Brand Type")}</em>
                  </MenuItem>
                  {brandTypes.map((bt) => (
                    <MenuItem key={bt._id} value={bt._id}>
                      {bt.icon || "🏷️"} {t(bt.name)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
              {/* legacy type selector removed in favor of brandTypeId */}
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
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isVip"
                      checked={editForm.isVip || false}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          isVip: e.target.checked,
                        })
                      }
                    />
                  }
                  label={t("VIP Brand")}
                />
              </Box>
            </Box>
          ) : editDialog.type === "store" ? (
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
              <Grid xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel shrink>{t("Store Type")}</InputLabel>
                  <Select
                    name="storeTypeId"
                    value={editForm.storeTypeId || ""}
                    onChange={handleEditFormChange}
                    label={t("Store Type")}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>{t("Select Store Type")}</em>
                    </MenuItem>
                    {storeTypes.map((st) => (
                      <MenuItem key={st._id} value={st._id}>
                        {st.icon || "🏪"} {t(st.name)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
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
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isVip"
                      checked={editForm.isVip || false}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          isVip: e.target.checked,
                        })
                      }
                    />
                  }
                  label={t("VIP Store")}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="show"
                      checked={
                        editForm.show !== undefined ? editForm.show : true
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          show: e.target.checked,
                        })
                      }
                    />
                  }
                  label={t("Show in Store List")}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {t("Branches")}
                </Typography>
                {(editForm.branches || []).map((branch, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      p: 2,
                      border: "1px solid #ddd",
                      borderRadius: 1,
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t("Branch Name")}
                          value={branch.name || ""}
                          onChange={(e) => {
                            const newBranches = [...(editForm.branches || [])];
                            newBranches[index] = {
                              ...branch,
                              name: e.target.value,
                            };
                            setEditForm({ ...editForm, branches: newBranches });
                          }}
                        />
                      </Grid>
                      <Grid xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t("Branch Address")}
                          value={branch.address || ""}
                          onChange={(e) => {
                            const newBranches = [...(editForm.branches || [])];
                            newBranches[index] = {
                              ...branch,
                              address: e.target.value,
                            };
                            setEditForm({ ...editForm, branches: newBranches });
                          }}
                        />
                      </Grid>
                      <Grid xs={12}>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => {
                            const newBranches = (
                              editForm.branches || []
                            ).filter((_, i) => i !== index);
                            setEditForm({ ...editForm, branches: newBranches });
                          }}
                        >
                          {t("Remove Branch")}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditForm({
                      ...editForm,
                      branches: [
                        ...(editForm.branches || []),
                        { name: "", address: "" },
                      ],
                    });
                  }}
                  sx={{ mt: 1 }}
                >
                  {t("Add Branch")}
                </Button>
              </Box>
            </Box>
          ) : editDialog.type === "category" ? (
            <Box component="form" sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    label={t("Category Name")}
                    name="name"
                    value={editForm.name || ""}
                    onChange={handleEditFormChange}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>{t("Store Type")}</InputLabel>
                    <Select
                      name="storeTypeId"
                      value={editForm.storeType || "market"}
                      onChange={handleEditFormChange}
                      label={t("Store Type")}
                    >
                      <MenuItem value="market">{t("Market")}</MenuItem>
                      <MenuItem value="clothes">{t("Clothes")}</MenuItem>
                      <MenuItem value="electronic">{t("Electronics")}</MenuItem>
                      <MenuItem value="cosmetic">{t("Cosmetics")}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid xs={12}>
                  <Typography variant="subtitle1" sx={{ mt: 1 }}>
                    {t("Category Types")}
                  </Typography>
                  {(editForm.types || [""]).map((type, index) => (
                    <Box key={index} sx={{ display: "flex", gap: 1, mb: 1 }}>
                      <TextField
                        fullWidth
                        label={`${t("Category Type")} ${index + 1}`}
                        value={type}
                        onChange={(e) =>
                          handleEditCategoryTypeChange(index, e.target.value)
                        }
                      />
                      <IconButton
                        onClick={() => removeEditCategoryType(index)}
                        disabled={(editForm.types || []).length <= 1}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    variant="outlined"
                    onClick={addEditCategoryType}
                    startIcon={<AddIcon />}
                  >
                    {t("Add Category Type")}
                  </Button>
                </Grid>
              </Grid>
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
                <InputLabel>{t("Stores")}</InputLabel>
                <Select
                  multiple
                  name="storeId"
                  value={editForm.storeId}
                  onChange={handleEditFormChange}
                  label={t("Stores")}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        const store = stores.find((m) => m._id === value);
                        return (
                          <Chip
                            key={value}
                            label={store ? store.name : value}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {stores.map((store) => (
                    <MenuItem key={store._id} value={store._id}>
                      {store.name}
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
          ) : editDialog.type === "ad" ? (
            <Box component="form" sx={{ mt: 1 }}>
              {/* Current Image */}
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
                    alt={t("Current ad")}
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                    }}
                  />
                </Box>
              )}

              {/* Upload New Image */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t("Upload New Image:")}
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="edit-ad-image-upload"
                  type="file"
                  ref={editAdImageFileRef}
                />
                <label htmlFor="edit-ad-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 1 }}
                  >
                    {t("Choose Image")}
                  </Button>
                </label>
              </Box>

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t("Pages")}</InputLabel>
                    <Select
                      multiple
                      name="pages"
                      value={editForm.pages || []}
                      onChange={handleEditFormChange}
                      label={t("Pages")}
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {selected.map((value) => (
                            <Chip
                              key={value}
                              label={t(
                                value.charAt(0).toUpperCase() + value.slice(1)
                              )}
                              size="small"
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {["all", "home", "brands", "stores", "gifts"].map((p) => (
                        <MenuItem key={p} value={p}>
                          {t(p.charAt(0).toUpperCase() + p.slice(1))}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t("Link URL")}
                    name="linkUrl"
                    value={editForm.linkUrl || ""}
                    onChange={handleEditFormChange}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel shrink>{t("Brand")}</InputLabel>
                    <Select
                      name="brandId"
                      value={editForm.brandId || ""}
                      onChange={handleEditFormChange}
                      label={t("Brand")}
                      displayEmpty
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
                  <FormControl fullWidth>
                    <InputLabel shrink>{t("Store")}</InputLabel>
                    <Select
                      name="storeId"
                      value={editForm.storeId || ""}
                      onChange={handleEditFormChange}
                      label={t("Store")}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>{t("None")}</em>
                      </MenuItem>
                      {stores.map((s) => (
                        <MenuItem key={s._id} value={s._id}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel shrink>{t("Gift")}</InputLabel>
                    <Select
                      name="giftId"
                      value={editForm.giftId || ""}
                      onChange={handleEditFormChange}
                      label={t("Gift")}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>{t("None")}</em>
                      </MenuItem>
                      {gifts.map((g) => (
                        <MenuItem key={g._id} value={g._id}>
                          {g.description?.slice(0, 40) || g._id}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label={t("Start Date")}
                    InputLabelProps={{ shrink: true }}
                    name="startDate"
                    value={editForm.startDate || ""}
                    onChange={handleEditFormChange}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label={t("End Date")}
                    InputLabelProps={{ shrink: true }}
                    name="endDate"
                    value={editForm.endDate || ""}
                    onChange={handleEditFormChange}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t("Priority")}
                    name="priority"
                    value={editForm.priority ?? 0}
                    onChange={handleEditFormChange}
                  />
                </Grid>
                <Grid xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!editForm.active}
                        onChange={(e) =>
                          setEditForm({ ...editForm, active: e.target.checked })
                        }
                      />
                    }
                    label={t("Active")}
                  />
                </Grid>
              </Grid>
            </Box>
          ) : editDialog.type === "storeType" ? (
            <Box
              component="form"
              sx={{ mt: 1 }}
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await fetch(`${API_URL}/api/store-types/${editForm._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: editForm.name,
                      icon: editForm.icon || "",
                    }),
                  });
                  const res = await storeTypeAPI.getAll();
                  setStoreTypes(res.data || []);
                  setEditDialog({ open: false, type: "", data: null });
                } catch (e) {}
              }}
            >
              <TextField
                margin="normal"
                fullWidth
                label={t("Name")}
                name="name"
                value={editForm.name || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
              <TextField
                margin="normal"
                fullWidth
                label={t("Icon")}
                name="icon"
                value={editForm.icon || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, icon: e.target.value })
                }
              />
            </Box>
          ) : editDialog.type === "brandType" ? (
            <Box
              component="form"
              sx={{ mt: 1 }}
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await brandTypeAPI.update(editForm._id, {
                    name: (editForm.name || "").trim(),
                    icon: editForm.icon || "",
                  });
                  const res = await brandTypeAPI.getAll();
                  setBrandTypes(res.data || []);
                  setEditDialog({ open: false, type: "", data: null });
                } catch (e) {}
              }}
            >
              <TextField
                margin="normal"
                fullWidth
                label={t("Name")}
                name="name"
                value={editForm.name || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
              <TextField
                margin="normal"
                fullWidth
                label={t("Icon")}
                name="icon"
                value={editForm.icon || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, icon: e.target.value })
                }
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
                <TextField
                  margin="normal"
                  fullWidth
                  label={t("Barcode")}
                  name="barcode"
                  value={editForm.barcode}
                  onChange={handleEditFormChange}
                  placeholder="Enter product barcode"
                />
                <FormControl fullWidth margin="normal">
                  <FormControlLabel
                    control={
                      <Checkbox
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
              </Box>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t("Store")}</InputLabel>
                <Select
                  name="storeId"
                  value={editForm.storeId}
                  onChange={handleEditFormChange}
                  label={t("Store")}
                >
                  {stores.map((store) => (
                    <MenuItem key={store._id} value={store._id}>
                      {store.name}
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
                : deleteDialog.type === "category"
                ? handleDeleteCategoryConfirm()
                : deleteDialog.type === "storeType"
                ? handleDeleteStoreTypeConfirm()
                : deleteDialog.type === "brandType"
                ? (async () => {
                    setDeleteLoading(true);
                    try {
                      await brandTypeAPI.delete(deleteDialog.data._id);
                      const res = await brandTypeAPI.getAll();
                      setBrandTypes(res.data || []);
                      setMessage({
                        type: "success",
                        text: t("Brand Type deleted successfully!"),
                      });
                    } catch (e) {
                      setMessage({
                        type: "error",
                        text: t("Failed to delete brand type."),
                      });
                    } finally {
                      setDeleteLoading(false);
                      setDeleteDialog({ open: false, type: "", data: null });
                    }
                  })()
                : (async () => {
                    setDeleteLoading(true);
                    try {
                      await categoryAPI.delete(deleteDialog.data._id);
                      setMessage({
                        type: "success",
                        text: t("Category deleted successfully!"),
                      });
                      fetchCategories();
                    } catch (e) {
                      setMessage({
                        type: "error",
                        text: t("Failed to delete category."),
                      });
                    } finally {
                      setDeleteLoading(false);
                      setDeleteDialog({ open: false, type: "", data: null });
                    }
                  })()
                ? handleDeleteStoreConfirm()
                : null
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
