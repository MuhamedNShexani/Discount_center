const BroadcastNotification = require("../models/BroadcastNotification");
const NotificationRead = require("../models/NotificationRead");
const UserNotificationState = require("../models/UserNotificationState");
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

    const [userState, notifications, readReceipts] = await Promise.all([
      UserNotificationState.findOne({ userId }).lean(),
      BroadcastNotification.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      NotificationRead.find({ userId })
        .select("notificationId")
        .lean(),
    ]);

    const markAllReadBefore = userState?.markAllReadBefore
      ? new Date(userState.markAllReadBefore)
      : new Date(0);
    const readSet = new Set(
      readReceipts.map((r) => r.notificationId?.toString()).filter(Boolean)
    );

    const data = notifications.map((n) => ({
      _id: n._id,
      title: n.title,
      body: n.body,
      type: n.type,
      read:
        n.createdAt <= markAllReadBefore || readSet.has(n._id.toString()),
      createdAt: n.createdAt,
    }));

    const unreadCount = await countUnread(userId);

    res.json({
      success: true,
      data,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

async function countUnread(userId) {
  const [userState, readNotificationIds] = await Promise.all([
    UserNotificationState.findOne({ userId }).lean(),
    NotificationRead.find({ userId }).select("notificationId").lean(),
  ]);

  const markAllReadBefore = userState?.markAllReadBefore
    ? new Date(userState.markAllReadBefore)
    : new Date(0);
  const readSet = new Set(
    readNotificationIds.map((r) => r.notificationId?.toString()).filter(Boolean)
  );

  const candidates = await BroadcastNotification.find({
    createdAt: { $gt: markAllReadBefore },
  })
    .select("_id")
    .lean();

  const unreadCount = candidates.filter(
    (n) => !readSet.has(n._id.toString())
  ).length;

  return unreadCount;
}

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

    const notificationId = req.params.id;

    const notification = await BroadcastNotification.findById(
      notificationId
    ).lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await NotificationRead.findOneAndUpdate(
      { userId, notificationId },
      { userId, notificationId, readAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: {
        _id: notification._id,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        read: true,
        createdAt: notification.createdAt,
      },
    });
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

    const now = new Date();

    await UserNotificationState.findOneAndUpdate(
      { userId },
      { $max: { markAllReadBefore: now } },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

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
