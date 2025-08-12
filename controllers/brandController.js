const Brand = require("../models/Brand");
const Product = require("../models/Product");
const BrandType = require("../models/BrandType");

async function ensureBrandTypeIdFromLegacy(data) {
  if (!data) return data;
  const next = { ...data };
  if (!next.brandTypeId && typeof next.type === "string" && next.type.trim()) {
    const name = next.type.trim();
    let bt = await BrandType.findOne({ name });
    if (!bt) {
      // Try to pick a simple icon by heuristics
      let icon = "🏷️";
      const lower = name.toLowerCase();
      if (lower.includes("food") || lower.includes("grocery")) icon = "🍞";
      else if (lower.includes("clothes") || lower.includes("fashion"))
        icon = "👗";
      else if (lower.includes("tech") || lower.includes("elect")) icon = "🔌";
      bt = await BrandType.create({ name, icon });
    }
    next.brandTypeId = bt._id;
  }
  delete next.type;
  return next;
}

// @desc    Get all brands
// @route   GET /api/brands
const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find()
      .populate("brandTypeId")
      .sort({ isVip: -1, name: 1 });
    const serialized = brands.map((b) => {
      const obj = b.toObject();
      return {
        ...obj,
        type:
          obj.brandTypeId && obj.brandTypeId.name
            ? obj.brandTypeId.name
            : undefined,
      };
    });
    res.json(serialized);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get brand by ID
// @route   GET /api/brands/:id
const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id).populate("brandTypeId");
    if (!brand) return res.status(404).json({ msg: "Brand not found" });
    const obj = brand.toObject();
    const response = {
      ...obj,
      type:
        obj.brandTypeId && obj.brandTypeId.name
          ? obj.brandTypeId.name
          : undefined,
    };
    res.json(response);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Create brand
// @route   POST /api/brands
const createBrand = async (req, res) => {
  try {
    const body = await ensureBrandTypeIdFromLegacy(req.body);
    const brand = new Brand(body);
    await brand.save();
    const populated = await Brand.findById(brand._id).populate("brandTypeId");
    const obj = populated.toObject();
    res.json({
      ...obj,
      type:
        obj.brandTypeId && obj.brandTypeId.name
          ? obj.brandTypeId.name
          : undefined,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
const updateBrand = async (req, res) => {
  try {
    const body = await ensureBrandTypeIdFromLegacy(req.body);
    const brand = await Brand.findByIdAndUpdate(req.params.id, body, {
      new: true,
    }).populate("brandTypeId");
    if (!brand) return res.status(404).json({ msg: "Brand not found" });
    const obj = brand.toObject();
    res.json({
      ...obj,
      type:
        obj.brandTypeId && obj.brandTypeId.name
          ? obj.brandTypeId.name
          : undefined,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Delete brand
// @route   DELETE /api/brands/:id
const deleteBrand = async (req, res) => {
  try {
    const brandId = req.params.id;

    // Check if there are any products associated with this brand
    const productCount = await Product.countDocuments({ brandId: brandId });

    if (productCount > 0) {
      return res.status(400).json({
        msg: "Cannot delete brand. It has associated products. Please delete the products first.",
      });
    }

    const brand = await Brand.findByIdAndDelete(brandId);
    if (!brand) return res.status(404).json({ msg: "Brand not found" });

    res.json({ msg: "Brand deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};
