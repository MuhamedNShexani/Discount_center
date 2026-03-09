const Notification = require("../models/Notification");
const User = require("../models/User");

// @desc    Get notifications for current user (auth or deviceId)
// @route   GET /api/notifications
// @access  Private (optionalAuth - token or deviceId in query)
const getNotifications = async (req, res) => {
  try {
    let userId = req.userId;

    if (!userId && req.query.deviceId) {
      const user = await User.findOne({ deviceId: req.query.deviceId });
      if (user) userId = user._id;
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login or provide deviceId to view notifications",
      });
    }

    const limit = parseInt(req.query.limit) || 50;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private (optionalAuth)
const markAsRead = async (req, res) => {
  try {
    let userId = req.userId;

    if (!userId && req.body?.deviceId) {
      const user = await User.findOne({ deviceId: req.body.deviceId });
      if (user) userId = user._id;
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login or provide deviceId",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private (optionalAuth)
const markAllAsRead = async (req, res) => {
  try {
    let userId = req.userId;

    if (!userId && req.body?.deviceId) {
      const user = await User.findOne({ deviceId: req.body.deviceId });
      if (user) userId = user._id;
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login or provide deviceId",
      });
    }

    await Notification.updateMany({ userId }, { read: true });
    res.json({ success: true });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
