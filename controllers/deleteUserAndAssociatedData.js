/**
 * Permanently delete a user and all associated data.
 * Used when account is past the 30-day deactivation grace period.
 */
const User = require("../models/User");
const NotificationRead = require("../models/NotificationRead");
const PushSubscription = require("../models/PushSubscription");
const UserNotificationState = require("../models/UserNotificationState");
const Product = require("../models/Product");

async function deleteUserAndAssociatedData(userId) {
  const id = typeof userId === "string" ? userId : userId?.toString();
  if (!id) return;

  await Promise.all([
    NotificationRead.deleteMany({ userId: id }),
    PushSubscription.deleteMany({ userId: id }),
    UserNotificationState.deleteOne({ userId: id }),
  ]);

  const user = await User.findById(id).select("likedProducts").lean();
  if (user?.likedProducts?.length) {
    await Product.updateMany(
      { _id: { $in: user.likedProducts }, likeCount: { $gt: 0 } },
      { $inc: { likeCount: -1 } }
    );
  }

  await User.deleteOne({ _id: id });
}

module.exports = { deleteUserAndAssociatedData };
