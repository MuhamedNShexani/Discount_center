const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} = require("../controllers/companyController");

// @route   GET /api/companies
// @desc    Get all companies
router.get("/", getCompanies);

// @route   GET /api/companies/:id
// @desc    Get company by ID
router.get("/:id", getCompanyById);

// @route   POST /api/companies
// @desc    Add new company
router.post("/", createCompany);

// @route   PUT /api/companies/:id
// @desc    Update company
router.put("/:id", updateCompany);

// @route   DELETE /api/companies/:id
// @desc    Delete company
router.delete("/:id", deleteCompany);

// @route   POST /api/companies/upload-logo
// @desc    Upload company logo
router.post("/upload-logo", upload.single("logo"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({
      imageUrl: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading file", error: error.message });
  }
});

module.exports = router;
