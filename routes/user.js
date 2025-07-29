const express = require("express");
const router = express.Router();
const {
  getUserByDevice,
  toggleProductLike,
  recordProductView,
  addProductReview,
  getLikedProducts,
  getViewedProducts,
} = require("../controllers/userController");
const { protect, optionalAuth } = require("../middleware/auth");

// Public routes (for anonymous users)
router.get("/device/:deviceId", getUserByDevice);
router.post("/view-product", optionalAuth, recordProductView);

// Protected routes (require authentication)
router.post("/like-product", protect, toggleProductLike);
router.post("/review-product", protect, addProductReview);
router.get("/liked-products", protect, getLikedProducts);
router.get("/viewed-products", protect, getViewedProducts);

module.exports = router;
