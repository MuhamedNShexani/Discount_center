const express = require("express");
const router = express.Router();
const XLSX = require("xlsx");
const {
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
} = require("../controllers/storeController");
const upload = require("../middleware/upload");

// @route   GET /api/stores
// @desc    Get all stores
router.get("/", getStores);

// @route   GET /api/stores/:id
// @desc    Get store by ID
router.get("/:id", getStoreById);

// @route   POST /api/stores
// @desc    Add new store
router.post("/", createStore);

// @route   PUT /api/stores/:id
// @desc    Update store
router.put("/:id", updateStore);

// @route   DELETE /api/stores/:id
// @desc    Delete store
router.delete("/:id", deleteStore);

// @route   POST /api/stores/upload-logo
// @desc    Upload store logo
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

// @route   POST /api/stores/bulk-upload
// @desc    Upload Excel file and create multiple stores
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
        const storeData = {
          name: row[0] || "",
          logo: row[1] || "",
          address: row[2] || "",
          phone: row[3] || "",
          description: row[4] || "",
        };

        // Validate required fields
        if (!storeData.name) {
          errors.push(`Row ${i + 2}: Missing required field (name)`);
          continue;
        }

        // Create the store
        const Store = require("../models/Store");
        const newStore = new Store(storeData);
        await newStore.save();
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
