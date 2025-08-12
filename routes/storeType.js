const express = require("express");
const router = express.Router();
const {
  getStoreTypes,
  createStoreType,
  updateStoreType,
  deleteStoreType,
} = require("../controllers/storeTypeController");

// @route   GET /api/store-types
// @desc    Get all store types
router.get("/", getStoreTypes);
router.post("/", createStoreType);
router.put("/:id", updateStoreType);
router.delete("/:id", deleteStoreType);

module.exports = router;
