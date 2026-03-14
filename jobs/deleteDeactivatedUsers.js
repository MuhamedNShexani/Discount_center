/**
 * Delete users who are deactivated and past their 30-day grace period.
 * Run periodically (e.g. every 24 hours) from server.js.
 */
const User = require("../models/User");
const { deleteUserAndAssociatedData } = require("../controllers/deleteUserAndAssociatedData");

async function run() {
  const now = new Date();
  const users = await User.find({
    isActive: false,
    scheduledDeletionAt: { $exists: true, $lte: now },
    username: { $exists: true, $ne: null },
  })
    .select("_id")
    .lean();

  for (const u of users) {
    try {
      await deleteUserAndAssociatedData(u._id);
      console.log("[deleteDeactivatedUsers] Deleted user:", u._id);
    } catch (err) {
      console.error("[deleteDeactivatedUsers] Error deleting user", u._id, err.message);
    }
  }
}

module.exports = { run: run };
