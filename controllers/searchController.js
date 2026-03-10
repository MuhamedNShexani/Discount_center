const Product = require("../models/Product");
const Store = require("../models/Store");
const Brand = require("../models/Brand");

// @desc    Search products, stores, and brands by name
// @route   GET /api/search?q=query
// @access  Public
const search = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: { products: [], stores: [], brands: [] },
      });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const limit = 20;

    const [products, stores, brands] = await Promise.all([
      Product.find({ name: regex })
        .populate("brandId", "name logo")
        .populate("storeId", "name logo")
        .limit(limit)
        .lean(),
      Store.find({ name: regex, show: { $ne: false } })
        .populate("storeTypeId", "name icon")
        .limit(limit)
        .lean(),
      Brand.find({ name: regex })
        .populate("brandTypeId", "name")
        .limit(limit)
        .lean(),
    ]);

    res.json({
      success: true,
      data: { products, stores, brands },
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { search };
