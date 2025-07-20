const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  getProductsByCompany,
  getProductsByMarket,
  getProductsByCategory,
  getCategories,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

// @route   GET /api/products
// @desc    Get all products (with optional filters)
router.get("/", getProducts);

// @route   GET /api/products/categories
// @desc    Get all product categories
router.get("/categories", getCategories);

// @route   GET /api/products/company/:companyId
// @desc    Get products by market
router.get("/company/:companyId", getProductsByCompany);

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

module.exports = router;
