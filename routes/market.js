const express = require("express");
const router = express.Router();
const {
  getMarkets,
  getMarketById,
  createMarket,
  updateMarket,
  deleteMarket,
} = require("../controllers/marketController");
const upload = require("../middleware/upload");

// @route   GET /api/markets
// @desc    Get all markets
router.get("/", getMarkets);

// @route   GET /api/markets/:id
// @desc    Get market by ID
router.get("/:id", getMarketById);

// @route   POST /api/markets
// @desc    Add new market
router.post("/", createMarket);

// @route   PUT /api/markets/:id
// @desc    Update market
router.put("/:id", updateMarket);

// @route   DELETE /api/markets/:id
// @desc    Delete market
router.delete("/:id", deleteMarket);

// @route   POST /api/markets/upload-logo
// @desc    Upload market logo
router.post("/upload-logo", upload.single("logo"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      message: "File uploaded successfully",
      url: fileUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Error uploading file" });
  }
});

module.exports = router;
