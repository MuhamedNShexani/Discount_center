const BroadcastNotification = require("../models/BroadcastNotification");
const User = require("../models/User");
const { sendPushToAll } = require("../services/pushService");
const { sendFcmToAll } = require("../services/firebaseService");

const ADMIN_EMAILS = ["mshexani45@gmail.com", "admin@gmail.com"];

const isAdmin = (user) => user && user.email && ADMIN_EMAILS.includes(user.email);

const canSendBroadcastNotification = (user) =>
  isAdmin(user) || user?.role === "support";

// @desc    Send notification to all users (admin or support role)
// @route   POST /api/admin/notifications/send
// @access  Private (protect + admin/support check)
const sendNotification = async (req, res) => {
  try {
    if (!canSendBroadcastNotification(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { title, body, type = "general", link, titleEn, titleAr, titleKu, bodyEn, bodyAr, bodyKu } =
      req.body;

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
        fcmSent: 0,
      });
    }

    const linkVal = (link || "").trim();
    const now = new Date();
    const expireDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const createPayload = {
      title: title.trim(),
      body: (body || "").trim(),
      titleEn: (titleEn || "").trim(),
      titleAr: (titleAr || "").trim(),
      titleKu: (titleKu || "").trim(),
      bodyEn: (bodyEn || "").trim(),
      bodyAr: (bodyAr || "").trim(),
      bodyKu: (bodyKu || "").trim(),
      type: ["info", "promo", "alert", "general"].includes(type)
        ? type
        : "general",
      expireDate,
    };
    if (linkVal) createPayload.link = linkVal;

    await BroadcastNotification.create(createPayload);

    const notificationType = createPayload.type;
    const pushTitle = title.trim();
    const pushBody = (body || "").trim();
    const pushLink = linkVal || "";

    // Send web push to system notification center (unchanged)
    let pushResult = { sent: 0, failed: 0 };
    try {
      pushResult = await sendPushToAll(pushTitle, pushBody, {
        type: notificationType,
      });
    } catch (pushErr) {
      console.error("Web push send error:", pushErr);
    }

    // Send Firebase Cloud Messaging to registered mobile apps (additional channel)
    let fcmResult = { sent: 0, failed: 0, removed: 0 };
    try {
      fcmResult = await sendFcmToAll(pushTitle, pushBody, {
        type: notificationType,
        link: pushLink,
      });
    } catch (fcmErr) {
      console.error("FCM send error:", fcmErr);
    }

    res.json({
      success: true,
      message: `Notification sent to ${userCount} users (${pushResult.sent} web push, ${fcmResult.sent} FCM)`,
      count: userCount,
      pushSent: pushResult.sent,
      fcmSent: fcmResult.sent,
      fcmFailed: fcmResult.failed,
      fcmTokensRemoved: fcmResult.removed || 0,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { sendNotification };
