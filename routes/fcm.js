const express = require("express");
const { registerFcmToken } = require("../controllers/fcmController");

const router = express.Router();

// POST /api/users/fcm-token (mounted under /api/users)
router.post("/fcm-token", registerFcmToken);

module.exports = router;
