const User = require("../models/User");
const Product = require("../models/Product");

// @desc    Get or create user by device ID (for anonymous tracking)
// @route   GET /api/users/device/:deviceId
// @access  Public
const getUserByDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Find the first user with this deviceId (should be only one)
    let user = await User.findOne({ deviceId }).populate("likedProducts");

    if (!user) {
      // Create new anonymous user with deviceId
      user = new User({ deviceId });
      await user.save();
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error getting user by device:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Like/unlike a product (requires authentication)
// @route   POST /api/users/like-product
// @access  Private
const toggleProductLike = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.userId; // From auth middleware

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const user = await User.findById(userId);
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

    const isLiked = user.likedProducts.includes(productId);

    let updatedProduct;
    if (isLiked) {
      // Unlike
      user.likedProducts = user.likedProducts.filter(
        (id) => id.toString() !== productId
      );
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $inc: { likeCount: -1 } },
        { new: true }
      );
      // Ensure like count doesn't go below 0
      if (updatedProduct.likeCount < 0) {
        updatedProduct = await Product.findByIdAndUpdate(
          productId,
          { likeCount: 0 },
          { new: true }
        );
      }
    } else {
      // Like
      user.likedProducts.push(productId);
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $inc: { likeCount: 1 } },
        { new: true }
      );
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

    // For authenticated users, use their account
    // For anonymous users, use device ID
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
        message: "Either user authentication or device ID is required",
      });
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
      { new: true }
    );

    // Update user's viewed products
    const existingView = user.viewedProducts.find(
      (view) => view.productId.toString() === productId
    );

    if (existingView) {
      existingView.viewCount += 1;
      existingView.lastViewed = Date.now();
    } else {
      user.viewedProducts.push({
        productId,
        viewCount: 1,
        lastViewed: Date.now(),
      });
    }

    await user.save();

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

// @desc    Add product review (requires authentication)
// @route   POST /api/users/review-product
// @access  Private
const addProductReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.userId; // From auth middleware

    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Product ID and Rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const user = await User.findById(userId);
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

    // Check if user already reviewed this product
    const existingReviewIndex = user.reviews.findIndex(
      (review) => review.productId.toString() === productId
    );

    let isNewReview = false;
    if (existingReviewIndex !== -1) {
      // Update existing review
      user.reviews[existingReviewIndex] = {
        productId,
        rating,
        comment: comment || "",
        createdAt: user.reviews[existingReviewIndex].createdAt,
      };
    } else {
      // Add new review
      user.reviews.push({
        productId,
        rating,
        comment: comment || "",
        createdAt: Date.now(),
      });
      isNewReview = true;
    }

    // Calculate new average rating
    const allReviews = await User.aggregate([
      { $unwind: "$reviews" },
      { $match: { "reviews.productId": product._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$reviews.rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const newAverageRating =
      allReviews.length > 0 ? allReviews[0].avgRating : 0;
    const newReviewCount =
      allReviews.length > 0 ? allReviews[0].reviewCount : 0;

    // Update product using findByIdAndUpdate to avoid validation issues
    const updateData = {
      averageRating: newAverageRating,
      reviewCount: newReviewCount,
    };

    if (isNewReview) {
      updateData.reviewCount = newReviewCount;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    await user.save();

    res.json({
      success: true,
      data: {
        averageRating: updatedProduct.averageRating,
        reviewCount: updatedProduct.reviewCount,
      },
    });
  } catch (error) {
    console.error("Error adding product review:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get user's liked products (requires authentication)
// @route   GET /api/users/liked-products
// @access  Private
const getLikedProducts = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const user = await User.findById(userId).populate({
      path: "likedProducts",
      populate: [
        { path: "brandId", select: "name logo" },
        { path: "marketId", select: "name logo" },
        { path: "categoryId", select: "name" },
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
      data: user.likedProducts,
    });
  } catch (error) {
    console.error("Error getting liked products:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get user's viewed products (requires authentication)
// @route   GET /api/users/viewed-products
// @access  Private
const getViewedProducts = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const user = await User.findById(userId).populate({
      path: "viewedProducts.productId",
      populate: [
        { path: "brandId", select: "name logo" },
        { path: "marketId", select: "name logo" },
        { path: "categoryId", select: "name" },
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
      data: user.viewedProducts,
    });
  } catch (error) {
    console.error("Error getting viewed products:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getUserByDevice,
  toggleProductLike,
  recordProductView,
  addProductReview,
  getLikedProducts,
  getViewedProducts,
};
