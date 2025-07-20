const Company = require("../models/Company");
const Product = require("../models/Product");

// @desc    Get all companies
// @route   GET /api/companies
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.json(companies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get company by ID
// @route   GET /api/companies/:id
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ msg: "Company not found" });
    res.json(company);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Create company
// @route   POST /api/companies
const createCompany = async (req, res) => {
  try {
    const company = new Company(req.body);
    await company.save();
    res.json(company);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update company
// @route   PUT /api/companies/:id
const updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!company) return res.status(404).json({ msg: "Company not found" });
    res.json(company);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Delete company
// @route   DELETE /api/companies/:id
const deleteCompany = async (req, res) => {
  try {
    const companyId = req.params.id;

    // Check if there are any products associated with this company
    const productCount = await Product.countDocuments({ companyId: companyId });

    if (productCount > 0) {
      return res.status(400).json({
        msg: "Cannot delete company. It has associated products. Please delete the products first.",
      });
    }

    const company = await Company.findByIdAndDelete(companyId);
    if (!company) return res.status(404).json({ msg: "Company not found" });

    res.json({ msg: "Company deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
};
