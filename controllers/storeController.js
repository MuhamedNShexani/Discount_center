const Store = require("../models/Store");
const Product = require("../models/Product");

// @desc    Get all stores
// @route   GET /api/stores
const getStores = async (req, res) => {
  try {
    const stores = await Store.find().sort({ isVip: -1, name: 1 });
    res.json(stores);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get store by ID
// @route   GET /api/stores/:id
const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ msg: "Store not found" });
    res.json(store);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Create store
// @route   POST /api/stores
const createStore = async (req, res) => {
  try {
    const store = new Store(req.body);
    await store.save();
    res.json(store);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update store
// @route   PUT /api/stores/:id
const updateStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!store) return res.status(404).json({ msg: "Store not found" });
    res.json(store);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Delete store
// @route   DELETE /api/stores/:id
const deleteStore = async (req, res) => {
  try {
    const storeId = req.params.id;

    // Check if there are any products associated with this store
    const productCount = await Product.countDocuments({ storeId: storeId });

    if (productCount > 0) {
      return res.status(400).json({
        msg: "Cannot delete store. It has associated products. Please delete the products first.",
      });
    }

    const store = await Store.findByIdAndDelete(storeId);
    if (!store) return res.status(404).json({ msg: "Store not found" });

    res.json({ msg: "Store deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
};
