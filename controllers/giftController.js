const Gift = require("../models/Gift");

// Get all gifts
const getGifts = async (req, res) => {
  try {
    const gifts = await Gift.find()
      .populate("storeId", "name logo storecity")
      .populate("brandId", "name logo")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: gifts,
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
      .populate("storeId", "name logo address phone storecity")
      .populate("brandId", "name logo address phone");

    if (!gift) {
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
    const gifts = await Gift.find({ storeId: req.params.storeId })
      .populate("storeId", "name logo storecity")
      .populate("brandId", "name logo")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: gifts,
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
    const gifts = await Gift.find({ brandId: req.params.brandId })
      .populate("storeId", "name logo storecity")
      .populate("brandId", "name logo")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: gifts,
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
