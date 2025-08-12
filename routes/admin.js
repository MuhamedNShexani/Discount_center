const express = require("express");
const router = express.Router();
const { getStats } = require("../controllers/adminController");

// GET /api/admin/stats
router.get("/stats", getStats);

module.exports = router;
