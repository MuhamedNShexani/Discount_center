const express = require("express");
const router = express.Router();
const { translate } = require("../controllers/aiTranslateController");

router.post("/translate", translate);

module.exports = router;
