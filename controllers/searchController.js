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

    const storeQuery = { name: regex, show: { $ne: false } };
    if (city) storeQuery.storecity = city;

    // When city is set, we need all store IDs in that city for product search (not only stores matching the query)
    const storeIdsInCityPromise = city
      ? Store.find({ storecity: city }).select("_id").lean()
      : Promise.resolve([]);

    const [stores, storeIdsInCityDocs, productsRaw, brandsAll] = await Promise.all([
      Store.find(storeQuery)
        .populate("storeTypeId", "name icon")
        .limit(limit)
        .lean(),
      storeIdsInCityPromise,
      city
        ? null
        : Product.find({ name: regex })
            .populate("brandId", "name logo")
            .populate("storeId", "name logo")
            .limit(limit)
            .lean(),
      Brand.find({ name: regex })
        .populate("brandTypeId", "name")
        .limit(limit)
        .lean(),
    ]);

    const storeIdsInCity = (storeIdsInCityDocs || []).map((s) => s._id);

    let products;
    let brands;

    if (city) {
      const productDocs = await Product.find({
        name: regex,
        storeId: { $in: storeIdsInCity },
      })
        .populate("brandId", "name logo")
        .populate("storeId", "name logo")
        .limit(limit)
        .lean();
      products = productDocs;
      const brandIdsFromProducts = [
        ...new Set(
          productDocs
            .map((p) => {
              const id = p.brandId && (p.brandId._id || p.brandId);
              return id != null ? String(id) : null;
            })
            .filter(Boolean)
        ),
      ];
      brands = brandsAll.filter((b) =>
        brandIdsFromProducts.includes(b._id.toString())
      );
    } else {
      products = productsRaw || [];
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
