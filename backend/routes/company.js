const express = require("express");
const router = express.Router();
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

module.exports = router;
