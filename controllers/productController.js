const Product = require("../models/Product");
const Store = require("../models/Store");
const Brand = require("../models/Brand");
const Category = require("../models/Category");

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { brand, category, store } = req.query;
    let query = {};

    if (brand) {
      query.brandId = brand;
    }
    if (store) {
      query.storeId = store;
    }

    if (category) {
      query.categoryId = category;
    }

    const products = await Product.find(query)
      .populate("brandId", "name logo")
      .populate("storeId", "name logo")
      .populate("categoryId", "name types")
      .sort({ name: 1 });

    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("brandId", "name logo address phone description")
      .populate("storeId", "name address phone description")
      .populate("categoryId", "name types description");

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin)
const createProduct = async (req, res) => {
  // Log the incoming request body for debugging
  console.log("[createProduct] Request body:", req.body);
  const {
    name,
    type,
    categoryTypeId,
    image,
    previousPrice,
    newPrice,
    isDiscount,
    weight,
    brandId,
    categoryId,
    description,
    barcode,
    storeId,
    expireDate,
  } = req.body;

  try {
    // Check if store exists
    const store = await Store.findById(storeId);
    if (!store) {
      console.error("[createProduct] Store not found for storeId:", storeId);
      return res.status(404).json({ msg: "Store not found" });
    }

    // Check if brand exists
    const brand = await Brand.findById(brandId);
    if (!brand) {
      console.error("[createProduct] Brand not found for brandId:", brandId);
      return res.status(404).json({ msg: "Brand not found" });
    }

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      console.error(
        "[createProduct] Category not found for categoryId:",
        categoryId
      );
      return res.status(404).json({ msg: "Category not found" });
    }

    // Check if category type exists
    if (categoryTypeId) {
      const categoryType = category.types.find(
        (type) => type._id.toString() === categoryTypeId
      );
      if (!categoryType) {
        console.error(
          "[createProduct] Category type not found for categoryTypeId:",
          categoryTypeId
        );
        return res.status(404).json({ msg: "Category type not found" });
      }
    }

    const newProduct = new Product({
      name,
      type,
      categoryId,
      categoryTypeId,
      description,
      barcode,
      image,
      previousPrice,
      newPrice,
      isDiscount,
      weight,
      brandId,
      storeId,
      expireDate,
    });

    const product = await newProduct.save();
    console.log("[createProduct] Product created successfully:", product);
    res.json(product);
  } catch (err) {
    console.error("[createProduct] Error:", err);
    res.status(500).send("Server Error");
  }
};

// @desc    Get products by brand
// @route   GET /api/products/brand/:brandId
// @access  Public
const getProductsByBrand = async (req, res) => {
  try {
    const products = await Product.find({ brandId: req.params.brandId })
      .populate("brandId", "name logo")
      .populate("storeId", "name logo")
      .populate("categoryId", "name types")
      .sort({ name: 1 });

    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get products by store
// @route   GET /api/products/store/:storeId
// @access  Public
const getProductsByStore = async (req, res) => {
  try {
    const products = await Product.find({ storeId: req.params.storeId })
      .populate("brandId", "name logo")
      .populate("storeId", "name logo")
      .populate("categoryId", "name types")
      .sort({ name: 1 });

    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ type: req.params.category })
      .populate("brandId", "name logo")
      .populate("storeId", "name logo")
      .sort({ name: 1 });

    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get all categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("type");
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("brandId", "name logo");

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.json({ msg: "Product removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByBrand,
  getProductsByStore,
  getProductsByCategory,
  getCategories,
};
