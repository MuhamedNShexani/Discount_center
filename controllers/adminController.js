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

module.exports = { getStats };
