const Gift = require("../models/Gift");
const Store = require("../models/Store");
const Brand = require("../models/Brand");

// Get all gifts
const getGifts = async (req, res) => {
  try {
    const gifts = await Gift.find()
      .populate({
        path: "storeId",
        select: "name logo storecity",
        match: { statusAll: { $ne: "off" } },
      })
      .populate({
        path: "brandId",
        select: "name logo",
        match: { statusAll: { $ne: "off" } },
      })
      .sort({ createdAt: -1 });

    const visibleGifts = gifts.filter((gift) => {
      const hasVisibleStore =
        Array.isArray(gift.storeId) && gift.storeId.length > 0;
      const hasVisibleBrand = !!gift.brandId;
      return hasVisibleStore || hasVisibleBrand;
    });

    res.json({
      success: true,
      data: visibleGifts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching gifts",
      error: error.message,
    });
  }
};

// Get gift by ID
const getGiftById = async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id)
      .populate({
        path: "storeId",
        select: "name logo address phone storecity",
        match: { statusAll: { $ne: "off" } },
      })
      .populate({
        path: "brandId",
        select: "name logo address phone",
        match: { statusAll: { $ne: "off" } },
      });

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: "Gift not found",
      });
    }

    const hasVisibleStore = Array.isArray(gift.storeId) && gift.storeId.length > 0;
    const hasVisibleBrand = !!gift.brandId;
    if (!hasVisibleStore && !hasVisibleBrand) {
      return res.status(404).json({
        success: false,
        message: "Gift not found",
      });
    }

    res.json({
      success: true,
      data: gift,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching gift",
      error: error.message,
    });
  }
};

// Get gifts by store
const getGiftsByStore = async (req, res) => {
  try {
    const storeVisible = await Store.exists({
      _id: req.params.storeId,
      statusAll: { $ne: "off" },
    });
    if (!storeVisible) {
      return res.json({ success: true, data: [] });
    }

    const gifts = await Gift.find({ storeId: req.params.storeId })
      .populate({
        path: "storeId",
        select: "name logo storecity",
        match: { statusAll: { $ne: "off" } },
      })
      .populate({
        path: "brandId",
        select: "name logo",
        match: { statusAll: { $ne: "off" } },
      })
      .sort({ createdAt: -1 });

    const visibleGifts = gifts.filter(
      (gift) => Array.isArray(gift.storeId) && gift.storeId.length > 0
    );

    res.json({
      success: true,
      data: visibleGifts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching store gifts",
      error: error.message,
    });
  }
};

// Get gifts by brand
const getGiftsByBrand = async (req, res) => {
  try {
    const brandVisible = await Brand.exists({
      _id: req.params.brandId,
      statusAll: { $ne: "off" },
    });
    if (!brandVisible) {
      return res.json({ success: true, data: [] });
    }

    const gifts = await Gift.find({ brandId: req.params.brandId })
      .populate({
        path: "storeId",
        select: "name logo storecity",
        match: { statusAll: { $ne: "off" } },
      })
      .populate({
        path: "brandId",
        select: "name logo",
        match: { statusAll: { $ne: "off" } },
      })
      .sort({ createdAt: -1 });

    const visibleGifts = gifts.filter((gift) => !!gift.brandId);

    res.json({
      success: true,
      data: visibleGifts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching brand gifts",
      error: error.message,
    });
  }
};

// Create new gift
const createGift = async (req, res) => {
  try {
    const { image, description, storeId, brandId, productId, expireDate } =
      req.body;

    const gift = new Gift({
      image,
      description,
      storeId: storeId ? (Array.isArray(storeId) ? storeId : [storeId]) : [],
      brandId,
      productId,
      expireDate,
    });

    const savedGift = await gift.save();
    const populatedGift = await Gift.findById(savedGift._id)
      .populate("storeId", "name logo storecity")
      .populate("brandId", "name logo");

    res.status(201).json({
      success: true,
      message: "Gift created successfully",
      data: populatedGift,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating gift",
      error: error.message,
    });
  }
};

// Update gift
const updateGift = async (req, res) => {
  try {
    const { image, description, storeId, brandId, productId, expireDate } =
      req.body;

    const gift = await Gift.findByIdAndUpdate(
      req.params.id,
      {
        image,
        description,
        storeId: storeId ? (Array.isArray(storeId) ? storeId : [storeId]) : [],
        brandId,
        productId,
        expireDate,
      },
      { new: true }
    )
      .populate("storeId", "name logo storecity")
      .populate("brandId", "name logo");

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: "Gift not found",
      });
    }

    res.json({
      success: true,
      message: "Gift updated successfully",
      data: gift,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating gift",
      error: error.message,
    });
  }
};

// Delete gift
const deleteGift = async (req, res) => {
  try {
    const gift = await Gift.findByIdAndDelete(req.params.id);

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: "Gift not found",
      });
    }

    res.json({
      success: true,
      message: "Gift deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting gift",
      error: error.message,
    });
  }
};

module.exports = {
  getGifts,
  getGiftById,
  getGiftsByStore,
  getGiftsByBrand,
  createGift,
  updateGift,
  deleteGift,
};
