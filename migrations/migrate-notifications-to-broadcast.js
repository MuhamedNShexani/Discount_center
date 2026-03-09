/*
  Migration: Notification Storage Optimization
  - Converts per-user Notification documents to BroadcastNotification + NotificationRead
  - For each unique (title, body, type, createdAt), creates one BroadcastNotification
  - For each Notification with read=true, creates NotificationRead
  - For users who have read ALL their notifications, creates UserNotificationState (markAllReadBefore)
  - Run with: node migrations/migrate-notifications-to-broadcast.js
  - After verification, optionally drop the old "notifications" collection
*/

require("dotenv").config();
const mongoose = require("mongoose");

const Notification = require("../models/Notification");
const BroadcastNotification = require("../models/BroadcastNotification");
const NotificationRead = require("../models/NotificationRead");
const UserNotificationState = require("../models/UserNotificationState");

async function connect() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/marketplace";
  console.log("Connecting to:", uri);
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

async function migrate() {
  const oldNotifications = await Notification.find({}).lean();
  if (oldNotifications.length === 0) {
    console.log("No notifications to migrate.");
    return;
  }

  console.log(`Found ${oldNotifications.length} old notification documents.`);

  const sep = "\x1E";
  const keyToItems = new Map();
  for (const n of oldNotifications) {
    const createdAt = n.createdAt instanceof Date ? n.createdAt.getTime() : 0;
    const key = [n.title || "", n.body || "", n.type || "general", createdAt].join(sep);
    if (!keyToItems.has(key)) {
      keyToItems.set(key, []);
    }
    keyToItems.get(key).push({
      userId: n.userId,
      read: n.read === true,
      createdAt: n.createdAt,
    });
  }

  console.log(`Deduplicating to ${keyToItems.size} unique broadcasts.`);

  const broadcastIdByKey = new Map();
  for (const [key, items] of keyToItems) {
    const first = items[0];
    const parts = key.split(sep);
    const [title, body, type] = parts;
    const broadcast = await BroadcastNotification.create({
      title: title || "Notification",
      body: body || "",
      type: type || "general",
      createdAt: first.createdAt,
    });
    broadcastIdByKey.set(key, broadcast._id);
  }

  let readReceiptsCreated = 0;
  const userMaxReadAt = new Map();
  const userNotificationCount = new Map();

  for (const [key, items] of keyToItems) {
    const broadcastId = broadcastIdByKey.get(key);
    for (const item of items) {
      const userIdStr = item.userId?.toString();
      if (!userIdStr) continue;

      userNotificationCount.set(
        userIdStr,
        (userNotificationCount.get(userIdStr) || 0) + 1
      );

      if (item.read) {
        try {
          await NotificationRead.findOneAndUpdate(
            { userId: item.userId, notificationId: broadcastId },
            { userId: item.userId, notificationId: broadcastId, readAt: new Date() },
            { upsert: true }
          );
          readReceiptsCreated++;
        } catch (e) {
          if (e.code !== 11000) console.warn("NotificationRead upsert:", e.message);
        }
      }

      if (item.read && item.createdAt) {
        const prev = userMaxReadAt.get(userIdStr);
        const t = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
        if (!prev || t > prev) {
          userMaxReadAt.set(userIdStr, t);
        }
      }
    }
  }

  const userReadCount = new Map();
  for (const [key, items] of keyToItems) {
    const broadcastId = broadcastIdByKey.get(key);
    for (const item of items) {
      if (!item.read) continue;
      const userIdStr = item.userId?.toString();
      if (!userIdStr) continue;
      userReadCount.set(userIdStr, (userReadCount.get(userIdStr) || 0) + 1);
    }
  }

  let statesCreated = 0;
  for (const [userIdStr, total] of userNotificationCount) {
    const readCount = userReadCount.get(userIdStr) || 0;
    if (readCount === total && total > 0) {
      const markAllReadBefore = userMaxReadAt.get(userIdStr);
      if (markAllReadBefore) {
        try {
          await UserNotificationState.findOneAndUpdate(
            { userId: new mongoose.Types.ObjectId(userIdStr) },
            { $max: { markAllReadBefore } },
            { upsert: true, setDefaultsOnInsert: true }
          );
          statesCreated++;
        } catch (e) {
          console.warn("UserNotificationState upsert:", e.message);
        }
      }
    }
  }

  console.log(`Created ${keyToItems.size} BroadcastNotifications.`);
  console.log(`Created ${readReceiptsCreated} NotificationRead receipts.`);
  console.log(`Created ${statesCreated} UserNotificationState (mark-all-read).`);
  console.log("\nMigration complete. Old 'notifications' collection is unchanged.");
  console.log("After verification, you can drop it manually: db.notifications.drop()");
}

async function main() {
  try {
    await connect();
    await migrate();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

main();
