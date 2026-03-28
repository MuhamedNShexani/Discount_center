const express = require("express");
const router = express.Router();
const { getPublicTranslations } = require("../controllers/translationController");

router.get("/", getPublicTranslations);

module.exports = router;
