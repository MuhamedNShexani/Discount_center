const Store = require("../models/Store");
const Product = require("../models/Product");

// @desc    Get all stores (including hidden ones)
// @route   GET /api/stores
const getStores = async (req, res) => {
  try {
    const stores = await Store.find()
      .populate("storeTypeId", "name icon")
      .sort({ isVip: -1, name: 1 });
    res.json(stores);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get visible stores only (for store list page)
// @route   GET /api/stores/visible
const getVisibleStores = async (req, res) => {
  try {
    const stores = await Store.find({ show: true })
      .populate("storeTypeId", "name icon")
      .sort({ isVip: -1, name: 1 });
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
    const store = await Store.findById(req.params.id).populate(
      "storeTypeId",
      "name icon"
    );
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
    const { storeTypeId, storeType: storeTypeName, ...rest } = req.body;
    const StoreType = require("../models/StoreType");
    let resolvedStoreTypeId = storeTypeId;
    if (!resolvedStoreTypeId && storeTypeName) {
      const st = await StoreType.findOne({ name: storeTypeName });
      if (!st) return res.status(400).json({ msg: "Invalid storeType name" });
      resolvedStoreTypeId = st._id;
    }

    // Set default values for new fields
    const storeData = {
      ...rest,
      storeTypeId: resolvedStoreTypeId,
      branches: rest.branches || [],
      show: rest.show !== undefined ? rest.show : true,
    };

    const store = new Store(storeData);
    await store.save();
    const populated = await Store.findById(store._id).populate(
      "storeTypeId",
      "name icon"
    );
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update store
// @route   PUT /api/stores/:id
const updateStore = async (req, res) => {
  try {
    const { storeTypeId, storeType: storeTypeName, ...rest } = req.body;
    const StoreType = require("../models/StoreType");
    const updateDoc = { ...rest };
    if (!storeTypeId && storeTypeName) {
      const st = await StoreType.findOne({ name: storeTypeName });
      if (!st) return res.status(400).json({ msg: "Invalid storeType name" });
      updateDoc.storeTypeId = st._id;
    } else if (storeTypeId) {
      updateDoc.storeTypeId = storeTypeId;
    }

    // Ensure branches and show fields are properly handled
    if (rest.branches !== undefined) {
      updateDoc.branches = rest.branches;
    }
    if (rest.show !== undefined) {
      updateDoc.show = rest.show;
    }

    const store = await Store.findByIdAndUpdate(req.params.id, updateDoc, {
      new: true,
    }).populate("storeTypeId", "name icon");
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
  getVisibleStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
};
