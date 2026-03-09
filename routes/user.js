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
const { pushSubscribe } = require("../controllers/pushController");
const { protect, optionalAuth } = require("../middleware/auth");

// Public routes (for anonymous users)
router.get("/device/:deviceId", getUserByDevice);
router.post("/view-product", optionalAuth, recordProductView);
router.post("/push-subscribe", optionalAuth, pushSubscribe);

// Like/product routes - work with auth OR deviceId (anonymous)
router.post("/like-product", optionalAuth, toggleProductLike);
router.post("/review-product", protect, addProductReview);
router.get("/liked-products", optionalAuth, getLikedProducts);
router.get("/viewed-products", optionalAuth, getViewedProducts);

module.exports = router;
