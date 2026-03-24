const Product = require("../models/Product");
const Store = require("../models/Store");
const Category = require("../models/Category");

const getPublicStoreIds = async () => {
  const stores = await Store.find({ statusAll: { $ne: "off" } }).select("_id").lean();
  return stores.map((s) => s._id);
};

const applyPublicVisibilityToProductQuery = (baseQuery, storeIds) => {
  const query = { ...baseQuery };
  const andConditions = Array.isArray(query.$and) ? [...query.$and] : [];

  andConditions.push({
    $or: [
      { storeId: { $exists: false } },
      { storeId: null },
      ...(storeIds.length ? [{ storeId: { $in: storeIds } }] : []),
    ],
  });

  query.$and = andConditions;
  return query;
};

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

    const storeIds = await getPublicStoreIds();
    const products = await Product.find(
      applyPublicVisibilityToProductQuery(query, storeIds)
    )
      .populate("brandId", "name logo statusAll")
      .populate("storeId", "name logo storecity")
      .populate("categoryId", "name types")
      .populate("storeTypeId", "name icon")
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
    const productRaw = await Product.findById(req.params.id).select("_id storeId");

    if (!productRaw) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const storeVisible = productRaw.storeId
      ? await Store.exists({
          _id: productRaw.storeId,
          statusAll: { $ne: "off" },
        })
      : true;

    if (!storeVisible) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const product = await Product.findById(req.params.id)
      .populate("brandId", "name logo address phone description statusAll")
      .populate("storeId", "name address phone description")
      .populate("categoryId", "name types description")
      .populate("storeTypeId", "name icon");

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
    storeTypeId: providedStoreTypeId,
    storeType: providedStoreTypeName,
    expireDate,
  } = req.body;

  try {
    // Check if store exists
    const store = await Store.findById(storeId);
    if (!store) {
      console.error("[createProduct] Store not found for storeId:", storeId);
      return res.status(404).json({ msg: "Store not found" });
    }

    // Check if brand exists (only if brandId is provided)
    if (brandId) {
      const brand = await Brand.findById(brandId);
      if (!brand) {
        console.error("[createProduct] Brand not found for brandId:", brandId);
        return res.status(404).json({ msg: "Brand not found" });
      }
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

    const StoreType = require("../models/StoreType");
    let storeTypeIdToUse = providedStoreTypeId;
    if (!storeTypeIdToUse && providedStoreTypeName) {
      const st = await StoreType.findOne({ name: providedStoreTypeName });
      if (!st) {
        return res
          .status(400)
          .json({ msg: `Invalid storeType name: ${providedStoreTypeName}` });
      }
      storeTypeIdToUse = st._id;
    }
    if (!storeTypeIdToUse) {
      return res.status(400).json({
        msg: "storeTypeId is required (or provide legacy storeType name)",
      });
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
      storeTypeId: storeTypeIdToUse,
      expireDate,
    });

    const product = await newProduct.save();

    if (storeId) {
      await Store.findByIdAndUpdate(storeId, {
        $set: { lastReleaseDiscountDate: new Date() },
      });
    }

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
    const storeIds = await getPublicStoreIds();
    const products = await Product.find(
      applyPublicVisibilityToProductQuery({ brandId: req.params.brandId }, storeIds)
    )
      .populate("brandId", "name logo statusAll")
      .populate("storeId", "name logo storecity")
      .populate("categoryId", "name types")
      .populate("storeTypeId", "name icon")
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
    const storeVisible = await Store.exists({
      _id: req.params.storeId,
      statusAll: { $ne: "off" },
    });
    if (!storeVisible) {
      return res.json([]);
    }

    const storeIds = await getPublicStoreIds();
    const products = await Product.find(
      applyPublicVisibilityToProductQuery({ storeId: req.params.storeId }, storeIds)
    )
      .populate("brandId", "name logo statusAll")
      .populate("storeId", "name logo storecity")
      .populate("categoryId", "name types")
      .populate("storeTypeId", "name icon")
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
    // The param is a Category ID. Match on categoryId, not the legacy `type` field
    const storeIds = await getPublicStoreIds();
    const products = await Product.find(
      applyPublicVisibilityToProductQuery({ categoryId: req.params.category }, storeIds)
    )
      .populate("brandId", "name logo statusAll")
      .populate("storeId", "name logo storecity")
      .populate("categoryId", "name types")
      .populate("storeTypeId", "name icon")
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

    const product = await Product.findByIdAndUpdate(req.params.id, updateDoc, {
      new: true,
    })
      .populate("brandId", "name logo")
      .populate("storeTypeId", "name icon");

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
