const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  getProductsByBrand,
  getProductsByStore,
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

// @route   GET /api/products/brand/:brandId
// @desc    Get products by store
router.get("/brand/:brandId", getProductsByBrand);

// @desc    Get products by store
router.get("/store/:storeId", getProductsByStore);

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
