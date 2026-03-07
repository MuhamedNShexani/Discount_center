const User = require("../models/User");
const Product = require("../models/Product");
const Store = require("../models/Store");
const Brand = require("../models/Brand");
const Gift = require("../models/Gift");

// @desc    Get high-level admin stats
// @route   GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalStores,
      totalBrands,
      totalGifts,
      productAgg,
    ] = await Promise.all([
      User.countDocuments({}),
      Product.countDocuments({}),
      Store.countDocuments({}),
      Brand.countDocuments({}),
      Gift.countDocuments({}),
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: { $ifNull: ["$viewCount", 0] } },
            totalLikes: { $sum: { $ifNull: ["$likeCount", 0] } },
          },
        },
      ]),
    ]);

    const totals = productAgg && productAgg.length > 0 ? productAgg[0] : {};

    res.json({
      totalUsers,
      totalProducts,
      totalStores,
      totalBrands,
      totalGifts,
      totalViews: totals.totalViews || 0,
      totalLikes: totals.totalLikes || 0,
    });
  } catch (err) {
    console.error("Admin stats error:", err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get most liked products
// @route   GET /api/admin/products/most-liked
const getMostLikedProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("storeId", "name")
      .populate("brandId", "name")
      .sort({ likeCount: -1 })
      .limit(500)
      .lean();
    res.json(products);
  } catch (err) {
    console.error("Admin most liked error:", err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get most viewed products
// @route   GET /api/admin/products/most-viewed
const getMostViewedProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("storeId", "name")
      .populate("brandId", "name")
      .sort({ viewCount: -1 })
      .limit(500)
      .lean();
    res.json(products);
  } catch (err) {
    console.error("Admin most viewed error:", err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get store report (products by store with stats)
// @route   GET /api/admin/reports/stores?storeName=optional&fromDate=optional&toDate=optional
const getStoreReport = async (req, res) => {
  try {
    const { storeName, fromDate, toDate } = req.query;
    let query = {};

    if (storeName && storeName.trim()) {
      const stores = await Store.find({
        name: { $regex: storeName.trim(), $options: "i" },
      }).select("_id");
      const storeIds = stores.map((s) => s._id);
      if (storeIds.length > 0) {
        query.storeId = { $in: storeIds };
      } else {
        query.storeId = { $in: [] };
      }
    }

    if (fromDate || toDate) {
      query.expireDate = {};
      if (fromDate) query.expireDate.$gte = new Date(fromDate);
      if (toDate) query.expireDate.$lte = new Date(toDate + "T23:59:59.999Z");
    }

    const products = await Product.find(query)
      .populate("storeId", "name")
      .populate("brandId", "name")
      .sort({ "storeId.name": 1, likeCount: -1 })
      .lean();
    res.json(products);
  } catch (err) {
    console.error("Admin store report error:", err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get brand report (products by brand with stats)
// @route   GET /api/admin/reports/brands?brandName=optional&fromDate=optional&toDate=optional
const getBrandReport = async (req, res) => {
  try {
    const { brandName, fromDate, toDate } = req.query;
    let query = {};

    if (brandName && brandName.trim()) {
      const brands = await Brand.find({
        name: { $regex: brandName.trim(), $options: "i" },
      }).select("_id");
      const brandIds = brands.map((b) => b._id);
      if (brandIds.length > 0) {
        query.brandId = { $in: brandIds };
      } else {
        query.brandId = { $in: [] };
      }
    }

    if (fromDate || toDate) {
      query.expireDate = {};
      if (fromDate) query.expireDate.$gte = new Date(fromDate);
      if (toDate) query.expireDate.$lte = new Date(toDate + "T23:59:59.999Z");
    }

    const products = await Product.find(query)
      .populate("storeId", "name")
      .populate("brandId", "name")
      .sort({ "brandId.name": 1, likeCount: -1 })
      .lean();
    res.json(products);
  } catch (err) {
    console.error("Admin brand report error:", err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getStats,
  getMostLikedProducts,
  getMostViewedProducts,
  getStoreReport,
  getBrandReport,
};
