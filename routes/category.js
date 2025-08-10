const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTypes,
  getCategoriesByStoreType,
} = require("../controllers/categoryController");

// @route   GET /api/categories
// @desc    Get all categories
router.get("/", getCategories);

// @route   GET /api/categories/store-type/:storeType
// @desc    Get categories by store type
router.get("/store-type/:storeType", getCategoriesByStoreType);

// @route   GET /api/categories/:id
// @desc    Get category by ID
router.get("/:id", getCategoryById);

// @route   GET /api/categories/:id/types
// @desc    Get category types
router.get("/:id/types", getCategoryTypes);

// Upload image for a category
// POST /api/categories/:id/image
router.post("/:id/image", upload.single("image"), async (req, res) => {
  try {
    const Category = require("../models/Category");
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ msg: "Category not found" });

    if (!req.file) {
      return res.status(400).json({
        msg: "No file uploaded",
        hint: "Ensure the request is multipart/form-data with a field named 'image'",
      });
    }

    category.image = `/uploads/${req.file.filename}`;
    await category.save();

    const updated = await Category.findById(req.params.id);
    return res.json({ success: true, category: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server Error" });
  }
});

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
