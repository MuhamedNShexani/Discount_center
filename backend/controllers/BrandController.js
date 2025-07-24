const Brand = require("../models/Brand");
const Product = require("../models/Product");

// @desc    Get all brands
// @route   GET /api/brands
const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.json(brands);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get brand by ID
// @route   GET /api/brands/:id
const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ msg: "Brand not found" });
    res.json(brand);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Create brand
// @route   POST /api/brands
const createBrand = async (req, res) => {
  try {
    const brand = new Brand(req.body);
    await brand.save();
    res.json(brand);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!brand) return res.status(404).json({ msg: "Brand not found" });
    res.json(brand);
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
