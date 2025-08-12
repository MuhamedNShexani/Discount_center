const express = require("express");
const router = express.Router();

const {
  getBrandTypes,
  createBrandType,
  updateBrandType,
  deleteBrandType,
} = require("../controllers/brandTypeController");

// @route   GET /api/brand-types
router.get("/", getBrandTypes);

// @route   POST /api/brand-types
router.post("/", createBrandType);

// @route   PUT /api/brand-types/:id
router.put("/:id", updateBrandType);

// @route   DELETE /api/brand-types/:id
router.delete("/:id", deleteBrandType);

module.exports = router;
