const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const XLSX = require("xlsx");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCompany,
  getProductsByMarket,
  getProductsByCategory,
  getCategories,
} = require("../controllers/productController");

// @route   GET /api/products
// @desc    Get all products (with optional filters)

router.get("/", getProducts);

// @route   GET /api/products/categories
// @desc    Get all categories
router.get("/categories", getCategories);

// @route   GET /api/products/company/:companyId
// @desc    Get products by company
router.get("/company/:companyId", getProductsByCompany);

// @route   GET /api/products/market/:marketId
// @desc    Get products by market
router.get("/market/:marketId", getProductsByMarket);

// @route   GET /api/products/category/:category
// @desc    Get products by category
router.get("/category/:category", getProductsByCategory);

// @route   GET /api/products/:id
// @desc    Get product by ID
router.get("/:id", getProductById);

// @route   POST /api/products
// @desc    Add new product
router.post("/", createProduct);

// @route   PUT /api/products/:id
// @desc    Update product
router.put("/:id", updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product
router.delete("/:id", deleteProduct);

// @route   POST /api/products/upload-image
// @desc    Upload product image
router.post("/upload-image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({
      imageUrl: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading file", error: error.message });
  }
});

// @route   POST /api/products/bulk-upload
// @desc    Upload Excel file and create multiple products
router.post("/bulk-upload", upload.single("excelFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No Excel file uploaded" });
    }

    // Read the Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Remove header row if it exists
    const rows = data.slice(1);

    let createdCount = 0;
    const errors = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Skip empty rows
      if (!row || row.length === 0 || !row[0]) continue;

      try {
        const productData = {
          barcode: row[0] || "",
          name: row[1] || "",
          type: row[2] || "",
          previousPrice: row[3] ? parseFloat(row[3]) : null,
          newPrice: row[4] ? parseFloat(row[4]) : null,
          isDiscount: row[5] === "true" || row[5] === "1" || row[5] === true,
          companyId: row[6] || "",
          marketId: row[7] || "",
          description: row[8] || "",
          expireDate: row[9] ? new Date(row[9]).toISOString() : null,
          weight: row[10] || "",
        };

        // Validate required fields
        if (
          !productData.name ||
          !productData.type ||
          productData.isDiscount === undefined ||
          !productData.marketId
        ) {
          errors.push(
            `Row ${
              i + 2
            }: Missing required fields (name, type, isDiscount, marketId)`
          );
          continue;
        }

        // Create the product
        const Product = require("../models/Product");
        const newProduct = new Product(productData);
        await newProduct.save();
        createdCount++;
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    // Clean up the uploaded file
    const fs = require("fs");
    fs.unlinkSync(req.file.path);

    res.json({
      message: "Bulk upload completed",
      createdCount,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      message: "Error processing Excel file",
      error: error.message,
    });
  }
});

module.exports = router;
