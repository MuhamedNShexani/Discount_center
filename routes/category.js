const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTypes,
} = require("../controllers/categoryController");

// @route   GET /api/categories
// @desc    Get all categories
router.get("/", getCategories);

// @route   GET /api/categories/:id
// @desc    Get category by ID
router.get("/:id", getCategoryById);

// @route   GET /api/categories/:id/types
// @desc    Get category types
router.get("/:id/types", getCategoryTypes);

// @route   POST /api/categories
// @desc    Create new category
router.post("/", createCategory);

// @route   PUT /api/categories/:id
// @desc    Update category
router.put("/:id", updateCategory);

// @route   DELETE /api/categories/:id
// @desc    Delete category
router.delete("/:id", deleteCategory);

module.exports = router;
