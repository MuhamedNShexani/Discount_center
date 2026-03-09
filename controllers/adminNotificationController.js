const BroadcastNotification = require("../models/BroadcastNotification");
const User = require("../models/User");
const { sendPushToAll } = require("../services/pushService");

const ADMIN_EMAILS = ["mshexani45@gmail.com", "admin@gmail.com"];

const isAdmin = (user) => user && user.email && ADMIN_EMAILS.includes(user.email);

// @desc    Send notification to all users (admin only)
// @route   POST /api/admin/notifications/send
// @access  Private (protect + admin check)
const sendNotification = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { title, body, type = "general" } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const userCount = await User.countDocuments();

    if (userCount === 0) {
      return res.json({
        success: true,
        message: "No users to notify",
        count: 0,
        pushSent: 0,
      });
    }

    await BroadcastNotification.create({
      title: title.trim(),
      body: (body || "").trim(),
      type: ["info", "promo", "alert", "general"].includes(type)
        ? type
        : "general",
    });

    // Send web push to system notification center
    let pushResult = { sent: 0, failed: 0 };
    try {
      pushResult = await sendPushToAll(
        title.trim(),
        (body || "").trim(),
        { type }
      );
    } catch (pushErr) {
      console.error("Web push send error:", pushErr);
    }

    res.json({
      success: true,
      message: `Notification sent to ${userCount} users (${pushResult.sent} push)`,
      count: userCount,
      pushSent: pushResult.sent,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { sendNotification };
