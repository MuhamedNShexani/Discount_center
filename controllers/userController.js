const User = require("../models/User");
const ProductViewEvent = require("../models/ProductViewEvent");
const ProductLikeEvent = require("../models/ProductLikeEvent");
const Product = require("../models/Product");
const Store = require("../models/Store");
const Brand = require("../models/Brand");
const Company = require("../models/Company");
const Video = require("../models/Video");
const { categoryList, storeList, brandList } = require("../utils/refPopulate");

const FOLLOW_ENTITY_CONFIG = {
  store: {
    Model: Store,
    userField: "followedStores",
    idBodyKey: "storeId",
    missingEntityMessage: "Store not found",
    missingIdMessage: "Store ID is required",
    followNeedMessage: "Either login or provide device ID to follow stores",
    listNeedMessage:
      "Either login or provide device ID to view followed stores",
    populate: { path: "storeTypeId", select: "name icon" },
  },
  brand: {
    Model: Brand,
    userField: "followedBrands",
    idBodyKey: "brandId",
    missingEntityMessage: "Brand not found",
    missingIdMessage: "Brand ID is required",
    followNeedMessage: "Either login or provide device ID to follow brands",
    listNeedMessage:
      "Either login or provide device ID to view followed brands",
    populate: { path: "brandTypeId", select: "name icon" },
  },
  company: {
    Model: Company,
    userField: "followedCompanies",
    idBodyKey: "companyId",
    missingEntityMessage: "Company not found",
    missingIdMessage: "Company ID is required",
    followNeedMessage: "Either login or provide device ID to follow companies",
    listNeedMessage:
      "Either login or provide device ID to view followed companies",
    populate: { path: "brandTypeId", select: "name icon" },
  },
};

async function resolveTrackingUser(req, { deviceId, needMessage }) {
  const userId = req.userId;
  let user;
  if (userId) {
    user = await User.findById(userId);
  } else if (deviceId) {
    user = await User.findOne({ deviceId });
    if (!user) {
      user = new User({ deviceId });
      await user.save();
    }
  } else {
    return {
      error: {
        status: 400,
        body: { success: false, message: needMessage },
      },
    };
  }

  if (!user) {
    return {
      error: {
        status: 404,
        body: { success: false, message: "User not found" },
      },
    };
  }

  return { user };
}

async function toggleFollowEntity(req, res, entityType) {
  const config = FOLLOW_ENTITY_CONFIG[entityType];
  try {
    const entityId = req.body[config.idBodyKey];
    const { deviceId } = req.body;

    if (!entityId) {
      return res.status(400).json({
        success: false,
        message: config.missingIdMessage,
      });
    }

    const resolved = await resolveTrackingUser(req, {
      deviceId,
      needMessage: config.followNeedMessage,
    });
    if (resolved.error) {
      return res.status(resolved.error.status).json(resolved.error.body);
    }
    const { user } = resolved;

    const entity = await config.Model.findById(entityId);
    if (!entity) {
      return res.status(404).json({
        success: false,
        message: config.missingEntityMessage,
      });
    }

    const list = user[config.userField] || [];
    const isFollowed = list.some((id) => id.toString() === String(entityId));

    if (isFollowed) {
      user[config.userField] = list.filter(
        (id) => id.toString() !== String(entityId),
      );
      await config.Model.findByIdAndUpdate(entityId, {
        $inc: { followerCount: -1 },
      });
    } else {
      if (!user[config.userField]) user[config.userField] = [];
      user[config.userField].push(entityId);
      await config.Model.findByIdAndUpdate(entityId, {
        $inc: { followerCount: 1 },
      });
    }
    await user.save();

    const updatedEntity = await config.Model.findById(entityId)
      .select("followerCount")
      .lean();
    const followerCount = Math.max(0, updatedEntity?.followerCount || 0);
    if (updatedEntity && (updatedEntity.followerCount || 0) < 0) {
      await config.Model.findByIdAndUpdate(entityId, { followerCount: 0 });
    }

    return res.json({
      success: true,
      data: {
        isFollowed: !isFollowed,
        followerCount,
      },
    });
  } catch (error) {
    console.error(`Error toggling ${entityType} follow:`, error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

async function getFollowedEntitiesOfType(req, entityType) {
  const config = FOLLOW_ENTITY_CONFIG[entityType];
  const userId = req.userId;
  const deviceId = req.query.deviceId;

  let user;
  if (userId) {
    user = await User.findById(userId);
  } else if (deviceId) {
    user = await User.findOne({ deviceId });
  } else {
    const err = new Error(config.listNeedMessage);
    err.status = 400;
    throw err;
  }

  if (!user || !(user[config.userField] || []).length) {
    return [];
  }

  let query = config.Model.find({
    _id: { $in: user[config.userField] },
    show: { $ne: false },
  });
  if (config.populate) {
    query = query.populate(config.populate.path, config.populate.select);
  }
  return query.lean();
}

// @desc    Get or create user by device ID (for anonymous tracking)
// @route   GET /api/users/device/:deviceId
// @access  Public
const getUserByDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Find user by deviceId (don't populate - we need raw IDs for like state checks)
    let user = await User.findOne({ deviceId });

    if (!user) {
      user = new User({ deviceId });
      await user.save();
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error getting user by device:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Like/unlike a product (works with auth token OR deviceId for anonymous)
// @route   POST /api/users/like-product
// @access  Public (optionalAuth - supports both logged-in and anonymous users)
const toggleProductLike = async (req, res) => {
  try {
    const { productId, deviceId } = req.body;
    const userId = req.userId;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (deviceId) {
      user = await User.findOne({ deviceId });
      if (!user) {
        user = new User({ deviceId });
        await user.save();
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Either login or provide device ID to like products",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Compare as strings (productId from body is string; likedProducts may be ObjectIds)
    const isLiked = user.likedProducts.some(
      (id) => id.toString() === productId || id === productId,
    );

    let updatedProduct;
    if (isLiked) {
      // Unlike
      user.likedProducts = user.likedProducts.filter(
        (id) => id.toString() !== productId,
      );
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $inc: { likeCount: -1 } },
        { new: true },
      );
      // Ensure like count doesn't go below 0
      if (updatedProduct.likeCount < 0) {
        updatedProduct = await Product.findByIdAndUpdate(
          productId,
          { likeCount: 0 },
          { new: true },
        );
      }
    } else {
      // Like
      user.likedProducts.push(productId);
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $inc: { likeCount: 1 } },
        { new: true },
      );
      try {
        await ProductLikeEvent.create({
          productId,
          userId: userId || null,
        });
      } catch (e) {
        console.error("ProductLikeEvent create:", e?.message || e);
      }
    }

    await user.save();

    res.json({
      success: true,
      data: {
        isLiked: !isLiked,
        likeCount: updatedProduct.likeCount,
      },
    });
  } catch (error) {
    console.error("Error toggling product like:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Like/unlike a video reel (works with auth token OR deviceId for anonymous)
// @route   POST /api/users/like-video
// @access  Public (optionalAuth)
const toggleVideoLike = async (req, res) => {
  try {
    const { videoId, deviceId } = req.body;
    const userId = req.userId;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "Video ID is required",
      });
    }

    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (deviceId) {
      user = await User.findOne({ deviceId });
      if (!user) {
        user = new User({ deviceId });
        await user.save();
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Either login or provide device ID to like videos",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const likedVideos = user.likedVideos || [];
    const isLiked = likedVideos.some(
      (id) => id.toString() === videoId || id === videoId,
    );

    let updatedVideo;
    if (isLiked) {
      user.likedVideos = likedVideos.filter((id) => id.toString() !== videoId);
      updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { like: -1 } },
        { new: true },
      );
      if (updatedVideo.like < 0) {
        updatedVideo = await Video.findByIdAndUpdate(
          videoId,
          { like: 0 },
          { new: true },
        );
      }
    } else {
      user.likedVideos.push(videoId);
      updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { like: 1 } },
        { new: true },
      );
    }

    await user.save();

    return res.json({
      success: true,
      data: {
        isLiked: !isLiked,
        likeCount: updatedVideo.like,
      },
    });
  } catch (error) {
    console.error("Error toggling video like:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Record product view (works for both authenticated and anonymous users)
// @route   POST /api/users/view-product
// @access  Public
const recordProductView = async (req, res) => {
  try {
    const { deviceId, productId } = req.body;
    const userId = req.userId; // From optional auth middleware

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Either user authentication or device ID is required",
      });
    }
    if (!userId && deviceId) {
      let anon = await User.findOne({ deviceId });
      if (!anon) {
        anon = new User({ deviceId });
        await anon.save();
      }
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Update product view count using findByIdAndUpdate to avoid validation issues
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $inc: { viewCount: 1 } },
      { new: true },
    );

    try {
      await ProductViewEvent.create({
        productId,
        userId: userId || null,
        sessionId: req.body?.sessionId
          ? String(req.body.sessionId).slice(0, 128)
          : null,
      });
    } catch (e) {
      console.warn("ProductViewEvent:", e.message);
    }

    res.json({
      success: true,
      data: {
        viewCount: updatedProduct.viewCount,
      },
    });
  } catch (error) {
    console.error("Error recording product view:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get user's liked products (works with auth token OR deviceId for anonymous)
// @route   GET /api/users/liked-products
// @access  Public (optionalAuth - supports both logged-in and anonymous users)
const getLikedProducts = async (req, res) => {
  try {
    const userId = req.userId;
    const deviceId = req.query.deviceId;

    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (deviceId) {
      user = await User.findOne({ deviceId });
    } else {
      return res.status(400).json({
        success: false,
        message: "Either login or provide device ID to view liked products",
      });
    }

    if (!user) {
      return res.json({ success: true, data: [] });
    }

    const populatedUser = await User.findById(user._id).populate({
      path: "likedProducts",
      populate: [
        { path: "brandId", select: brandList },
        { path: "storeId", select: storeList },
        { path: "categoryId", select: categoryList },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: populatedUser.likedProducts,
    });
  } catch (error) {
    console.error("Error getting liked products:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Follow/unfollow a store (works with auth token OR deviceId for anonymous)
// @route   POST /api/users/follow-store
// @access  Public (optionalAuth)
const toggleFollowStore = (req, res) => toggleFollowEntity(req, res, "store");

// @desc    Follow/unfollow a brand
// @route   POST /api/users/follow-brand
// @access  Public (optionalAuth)
const toggleFollowBrand = (req, res) => toggleFollowEntity(req, res, "brand");

// @desc    Follow/unfollow a company
// @route   POST /api/users/follow-company
// @access  Public (optionalAuth)
const toggleFollowCompany = (req, res) =>
  toggleFollowEntity(req, res, "company");

// @desc    Get user's followed stores
// @route   GET /api/users/followed-stores
// @access  Public (optionalAuth)
const getFollowedStores = async (req, res) => {
  try {
    const stores = await getFollowedEntitiesOfType(req, "store");
    return res.json({ success: true, data: stores });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error getting followed stores:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get user's followed brands
// @route   GET /api/users/followed-brands
// @access  Public (optionalAuth)
const getFollowedBrands = async (req, res) => {
  try {
    const brands = await getFollowedEntitiesOfType(req, "brand");
    return res.json({ success: true, data: brands });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error getting followed brands:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get user's followed companies
// @route   GET /api/users/followed-companies
// @access  Public (optionalAuth)
const getFollowedCompanies = async (req, res) => {
  try {
    const companies = await getFollowedEntitiesOfType(req, "company");
    return res.json({ success: true, data: companies });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error getting followed companies:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all followed entities for current user
// @route   GET /api/users/following
// @access  Public (optionalAuth)
const getFollowing = async (req, res) => {
  try {
    const userId = req.userId;
    const deviceId = req.query.deviceId;
    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Either login or provide device ID to view following",
      });
    }

    const [stores, brands, companies] = await Promise.all([
      getFollowedEntitiesOfType(req, "store"),
      getFollowedEntitiesOfType(req, "brand"),
      getFollowedEntitiesOfType(req, "company"),
    ]);

    return res.json({
      success: true,
      data: { stores, brands, companies },
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error getting following:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Update anonymous (device) user display name
// @route   PUT /api/users/device-profile
// @access  Public (optionalAuth - uses deviceId)
const updateDeviceProfile = async (req, res) => {
  try {
    const { deviceId, name } = req.body;

    if (!deviceId || !name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Device ID and name are required",
      });
    }

    let user = await User.findOne({ deviceId });
    if (!user) {
      user = new User({ deviceId });
    }

    user.displayName = name.trim();
    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        deviceId: user.deviceId,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("Error updating device profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getUserByDevice,
  toggleProductLike,
  toggleVideoLike,
  toggleFollowStore,
  toggleFollowBrand,
  toggleFollowCompany,
  recordProductView,
  getLikedProducts,
  getFollowedStores,
  getFollowedBrands,
  getFollowedCompanies,
  getFollowing,
  updateDeviceProfile,
};
