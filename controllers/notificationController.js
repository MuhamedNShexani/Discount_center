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

    const userState = await UserNotificationState.findOne({ userId }).lean();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const notificationsQuery = {
      $and: [
        {
          $or: [
            { expireDate: { $gt: now } },
            {
              expireDate: { $exists: false },
              createdAt: { $gt: sevenDaysAgo },
            },
          ],
        },
      ],
    };
    if (userState?.clearedBefore) {
      notificationsQuery.$and.push({
        createdAt: { $gt: new Date(userState.clearedBefore) },
      });
    }

    const [notifications, readReceipts] = await Promise.all([
      BroadcastNotification.find(notificationsQuery)
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
      link: n.link || null,
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

  const clearedBefore = userState?.clearedBefore
    ? new Date(userState.clearedBefore)
    : new Date(0);
  const minDate = new Date(
    Math.max(
      markAllReadBefore.getTime(),
      clearedBefore.getTime()
    )
  );
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const expiryFilter = {
    $or: [
      { expireDate: { $gt: now } },
      { expireDate: { $exists: false }, createdAt: { $gt: sevenDaysAgo } },
    ],
  };
  const candidates = await BroadcastNotification.find({
    createdAt: { $gt: minDate },
    ...expiryFilter,
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

// @desc    Clear all notifications for current user (hide from view)
// @route   PUT /api/notifications/clear
// @access  Private (optionalAuth)
const clearNotifications = async (req, res) => {
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
      { $set: { clearedBefore: now } },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: { markAllReadBefore: now },
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Clear notifications error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
};
