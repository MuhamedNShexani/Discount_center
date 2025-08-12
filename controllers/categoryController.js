const Category = require("../models/Category");
const path = require("path");
const fs = require("fs");

// @desc    Get all categories
// @route   GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate("storeTypeId", "name icon")
      .sort({ createdAt: 1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "storeTypeId",
      "name icon"
    );
    if (!category) return res.status(404).json({ msg: "Category not found" });
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Create category
// @route   POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { storeTypeId, storeType: storeTypeName, ...rest } = req.body;
    let toCreate = { ...rest };
    if (!storeTypeId && storeTypeName) {
      const StoreType = require("../models/StoreType");
      const st = await StoreType.findOne({ name: storeTypeName });
      if (!st) return res.status(400).json({ msg: "Invalid storeType name" });
      toCreate.storeTypeId = st._id;
    } else {
      toCreate.storeTypeId = storeTypeId;
    }
    const category = new Category(toCreate);
    await category.save();
    const populated = await Category.findById(category._id).populate(
      "storeTypeId",
      "name icon"
    );
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { storeTypeId, storeType: storeTypeName, ...rest } = req.body;
    const updateDoc = { ...rest };
    if (!storeTypeId && storeTypeName) {
      const StoreType = require("../models/StoreType");
      const st = await StoreType.findOne({ name: storeTypeName });
      if (!st) return res.status(400).json({ msg: "Invalid storeType name" });
      updateDoc.storeTypeId = st._id;
    } else if (storeTypeId) {
      updateDoc.storeTypeId = storeTypeId;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateDoc,
      {
        new: true,
      }
    ).populate("storeTypeId", "name icon");
    if (!category) return res.status(404).json({ msg: "Category not found" });
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Check if there are any products associated with this category
    const Product = require("../models/Product");
    const productCount = await Product.countDocuments({
      categoryId: categoryId,
    });

    if (productCount > 0) {
      return res.status(400).json({
        msg: "Cannot delete category. It has associated products. Please delete the products first.",
      });
    }

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) return res.status(404).json({ msg: "Category not found" });

    res.json({ msg: "Category deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get category types
// @route   GET /api/categories/:id/types
const getCategoryTypes = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ msg: "Category not found" });

    res.json(category.types);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get categories by store type
// @route   GET /api/categories/store-type/:storeType
const getCategoriesByStoreType = async (req, res) => {
  try {
    const { storeType } = req.params;
    const StoreType = require("../models/StoreType");
    const st = await StoreType.findOne({ name: storeType });
    if (!st) return res.json([]);
    const categories = await Category.find({
      storeTypeId: st._id,
      isActive: true,
    })
      .populate("storeTypeId", "name icon")
      .sort({ createdAt: 1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTypes,
  getCategoriesByStoreType,
};
