const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/userController");
const { pushSubscribe } = require("../controllers/pushController");
const fcmRoutes = require("./fcm");
// optionalAuth is applied globally in server.js (Bearer → req.user + audit fields)

// Public routes (for anonymous users)
router.get("/device/:deviceId", getUserByDevice);
router.post("/view-product", recordProductView);
router.post("/push-subscribe", pushSubscribe);
router.use(fcmRoutes);

// Like/product routes - work with auth OR deviceId (anonymous)
router.post("/like-product", toggleProductLike);
router.post("/like-video", toggleVideoLike);
router.post("/follow-store", toggleFollowStore);
router.post("/follow-brand", toggleFollowBrand);
router.post("/follow-company", toggleFollowCompany);
router.get("/liked-products", getLikedProducts);
router.get("/followed-stores", getFollowedStores);
router.get("/followed-brands", getFollowedBrands);
router.get("/followed-companies", getFollowedCompanies);
router.get("/following", getFollowing);
router.put("/device-profile", updateDeviceProfile);

module.exports = router;
