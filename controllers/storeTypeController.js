const StoreType = require("../models/StoreType");

// @desc    Get all store types (ensure "market" is always first)
const getStoreTypes = async (req, res) => {
  try {
    const types = await StoreType.find();
    const sorted = types.sort((a, b) => {
      const aName = (a.name || "").toLowerCase();
      const bName = (b.name || "").toLowerCase();
      const aIsMarket = aName === "market";
      const bIsMarket = bName === "market";
      if (aIsMarket && !bIsMarket) return -1;
      if (bIsMarket && !aIsMarket) return 1;
      return aName.localeCompare(bName);
    });
    res.json(sorted);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Create store type
const createStoreType = async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name) return res.status(400).json({ msg: "Name is required" });
    const exists = await StoreType.findOne({ name });
    if (exists)
      return res.status(409).json({ msg: "Store type already exists" });
    const st = await StoreType.create({ name, icon });
    res.status(201).json(st);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update store type
const updateStoreType = async (req, res) => {
  try {
    const { name, icon } = req.body;
    const st = await StoreType.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined ? { name } : {}),
        ...(icon !== undefined ? { icon } : {}),
      },
      { new: true }
    );
    if (!st) return res.status(404).json({ msg: "Not found" });
    res.json(st);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Delete store type
const deleteStoreType = async (req, res) => {
  try {
    const st = await StoreType.findByIdAndDelete(req.params.id);
    if (!st) return res.status(404).json({ msg: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getStoreTypes,
  createStoreType,
  updateStoreType,
  deleteStoreType,
};
