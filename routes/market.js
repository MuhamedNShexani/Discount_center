const express = require("express");
const router = express.Router();
const XLSX = require("xlsx");
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

// @route   POST /api/markets/bulk-upload
// @desc    Upload Excel file and create multiple markets
router.post("/bulk-upload", upload.single("excelFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No Excel file uploaded" });
    }

    // Read the Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Remove header row if it exists
    const rows = data.slice(1);

    let createdCount = 0;
    const errors = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Skip empty rows
      if (!row || row.length === 0 || !row[0]) continue;

      try {
        const marketData = {
          name: row[0] || "",
          logo: row[1] || "",
          address: row[2] || "",
          phone: row[3] || "",
          description: row[4] || "",
        };

        // Validate required fields
        if (!marketData.name) {
          errors.push(`Row ${i + 2}: Missing required field (name)`);
          continue;
        }

        // Create the market
        const Market = require("../models/Market");
        const newMarket = new Market(marketData);
        await newMarket.save();
        createdCount++;
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    // Clean up the uploaded file
    const fs = require("fs");
    fs.unlinkSync(req.file.path);

    res.json({
      message: "Bulk upload completed",
      createdCount,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      message: "Error processing Excel file",
      error: error.message,
    });
  }
});

module.exports = router;
