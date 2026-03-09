const User = require("../models/User");
const PushSubscription = require("../models/PushSubscription");

// @desc    Subscribe to push notifications (save subscription for current user)
// @route   POST /api/users/push-subscribe
// @access  Private (optionalAuth - token or deviceId)
const pushSubscribe = async (req, res) => {
  try {
    let userId = req.userId;

    if (!userId && req.body?.deviceId) {
      const user = await User.findOne({ deviceId: req.body.deviceId });
      if (user) userId = user._id;
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login or provide deviceId to enable push notifications",
      });
    }

    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription object",
      });
    }

    const { endpoint, keys } = subscription;
    if (!keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        message: "Subscription keys (p256dh, auth) are required",
      });
    }

    const userAgent = req.headers["user-agent"] || "";

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        userId,
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        userAgent,
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Push subscription saved" });
  } catch (error) {
    console.error("Push subscribe error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { pushSubscribe };
