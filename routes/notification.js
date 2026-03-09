const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");
const { optionalAuth } = require("../middleware/auth");

// Public - VAPID public key for push subscription
router.get("/vapid-public", (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(503).json({
      success: false,
      message: "Push notifications not configured",
    });
  }
  res.json({ success: true, vapidPublicKey: key });
});

router.get("/", optionalAuth, getNotifications);
router.put("/read-all", optionalAuth, markAllAsRead);
router.put("/:id/read", optionalAuth, markAsRead);

module.exports = router;
