const express = require("express");
const router = express.Router();
const {
  getStats,
  getMostLikedProducts,
  getMostViewedProducts,
  getStoreReport,
  getBrandReport,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  deleteExpiredProducts,
} = require("../controllers/adminController");
const { sendNotification } = require("../controllers/adminNotificationController");
const { protect } = require("../middleware/auth");

// GET /api/admin/stats
router.get("/stats", getStats);

// POST /api/admin/notifications/send - admin only
router.post("/notifications/send", protect, sendNotification);

// GET /api/admin/products/most-liked
router.get("/products/most-liked", getMostLikedProducts);

// GET /api/admin/products/most-viewed
router.get("/products/most-viewed", getMostViewedProducts);

// GET /api/admin/reports/stores?storeId=optional
router.get("/reports/stores", getStoreReport);

// GET /api/admin/reports/brands?brandId=optional
router.get("/reports/brands", getBrandReport);

// User management - admin-only, requires auth
router.get("/users", protect, getUsers);
router.post("/users", protect, createUser);
router.put("/users/:id", protect, updateUser);
router.delete("/users/:id", protect, deleteUser);

// Delete expired products - admin-only, requires auth
router.delete("/products/expired", protect, deleteExpiredProducts);

module.exports = router;
