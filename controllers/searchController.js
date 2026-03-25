const Product = require("../models/Product");
const Store = require("../models/Store");
const Brand = require("../models/Brand");

// @desc    Search products, stores, and brands by name (optional: filter by city)
// @route   GET /api/search?q=query&city=Erbil
// @access  Public
const search = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const city = (req.query.city || "").trim() || null;
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: { products: [], stores: [], brands: [] },
      });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const limit = 20;

    const storeQuery = {
      name: regex,
      show: { $ne: false },
      statusAll: { $ne: "off" },
    };
    if (city) storeQuery.storecity = city;

    // When city is set, we need all store IDs in that city for product search (not only stores matching the query)
    const storeIdsInCityPromise = city
      ? Store.find({
          storecity: city,
          show: { $ne: false },
          statusAll: { $ne: "off" },
        })
          .select("_id")
          .lean()
      : Promise.resolve([]);

    const [
      stores,
      storeIdsInCityDocs,
      visibleStoreIdsDocs,
      productsRaw,
      brandsAll,
    ] =
      await Promise.all([
      Store.find(storeQuery)
        .populate("storeTypeId", "name icon")
        .limit(limit)
        .lean(),
      storeIdsInCityPromise,
      Store.find({
        show: { $ne: false },
        statusAll: { $ne: "off" },
      })
        .select("_id")
        .lean(),
      city
        ? null
        : Product.find({ name: regex })
            .populate("brandId", "name logo statusAll")
            .populate("storeId", "name logo")
            .limit(limit)
            .lean(),
      Brand.find({ name: regex, statusAll: { $ne: "off" } })
        .populate("brandTypeId", "name")
        .limit(limit)
        .lean(),
      ]);

    const storeIdsInCity = (storeIdsInCityDocs || []).map((s) => s._id);
    const visibleStoreIds = (visibleStoreIdsDocs || []).map((s) => String(s._id));

    let products;
    let brands;

    if (city) {
      const productDocs = await Product.find({
        name: regex,
        storeId: { $in: storeIdsInCity },
      })
        .populate("brandId", "name logo statusAll")
        .populate("storeId", "name logo")
        .limit(limit)
        .lean();
      products = productDocs;
      // In city mode, still allow direct brand name search results.
      // Previously we limited brands to only those present in matching products,
      // which caused "2 letters works, more letters shows nothing" for brands.
      brands = brandsAll;
    } else {
      products = (productsRaw || []).filter((p) => {
        const storeId = p.storeId && (p.storeId._id || p.storeId);
        const storeOk = !storeId || visibleStoreIds.includes(String(storeId));
        return storeOk;
      });
      brands = brandsAll;
    }

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
