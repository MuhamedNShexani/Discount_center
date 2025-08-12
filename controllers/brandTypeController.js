const BrandType = require("../models/BrandType");
const Brand = require("../models/Brand");

// @desc    Get all brand types
const getBrandTypes = async (req, res) => {
  try {
    const types = await BrandType.find().sort({ name: 1 });
    res.json(types);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Create brand type
const createBrandType = async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name) return res.status(400).json({ msg: "Name is required" });
    const exists = await BrandType.findOne({ name });
    if (exists)
      return res.status(409).json({ msg: "Brand type already exists" });
    const doc = await BrandType.create({ name, icon });
    res.status(201).json(doc);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update brand type
const updateBrandType = async (req, res) => {
  try {
    const { name, icon } = req.body;
    const doc = await BrandType.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined ? { name } : {}),
        ...(icon !== undefined ? { icon } : {}),
      },
      { new: true }
    );
    if (!doc) return res.status(404).json({ msg: "Not found" });
    res.json(doc);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Delete brand type (only if not used)
const deleteBrandType = async (req, res) => {
  try {
    const id = req.params.id;
    const inUse = await Brand.exists({ brandTypeId: id });
    if (inUse) {
      return res
        .status(400)
        .json({
          msg: "Cannot delete: brand type is in use by at least one brand",
        });
    }
    const doc = await BrandType.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ msg: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getBrandTypes,
  createBrandType,
  updateBrandType,
  deleteBrandType,
};
