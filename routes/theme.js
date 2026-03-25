const express = require("express");
const router = express.Router();
const { getTheme, updateTheme } = require("../controllers/themeController");
const { protect } = require("../middleware/auth");

router.get("/", getTheme);
router.put("/", protect, updateTheme);

module.exports = router;

