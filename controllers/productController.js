const Product = require("../models/Product");
const Market = require("../models/Market");

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { company, category } = req.query;
    let query = {};

    if (company) {
      query.companyId = company;
    }

    if (category) {
      query.type = category;
    }
    console.log("hello");

    const products = await Product.find(query)
      .populate("companyId", "name logo")
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
    const product = await Product.findById(req.params.id).populate(
      "companyId",
      "name logo address phone description"
    );

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
  const { name, type, image, previousPrice, newPrice, companyId, expireDate } =
    req.body;

  try {
    // Check if market exists
    const market = await Market.findById(companyId);
    if (!market) {
      console.error(
        "[createProduct] Market not found for companyId:",
        companyId
      );
      return res.status(404).json({ msg: "Market not found" });
    }

    const newProduct = new Product({
      name,
      type,
      image,
      previousPrice,
      newPrice,
      companyId,
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

// @desc    Get products by company
// @route   GET /api/products/company/:companyId
// @access  Public
const getProductsByCompany = async (req, res) => {
  try {
    const products = await Product.find({ companyId: req.params.companyId })
      .populate("companyId", "name logo")
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
      .populate("companyId", "name logo")
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
    }).populate("companyId", "name logo");

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
  getProductsByCompany,
  getProductsByCategory,
  getCategories,
};
