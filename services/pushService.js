const webpush = require("web-push");
const PushSubscriptionModel = require("../models/PushSubscription");

let vapidKeysSet = false;

const setVapidKeys = () => {
  if (vapidKeysSet) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) {
    webpush.setVapidDetails(
      "mailto:support@example.com",
      publicKey,
      privateKey
    );
    vapidKeysSet = true;
  }
};

/**
 * Send a push notification to all subscribed users
 * @param {string} title - Notification title
 * @param {string} body - Notification body (optional)
 * @param {object} data - Extra data payload (optional)
 * @returns {{ sent: number, failed: number }}
 */
const sendPushToAll = async (title, body = "", data = {}) => {
  setVapidKeys();
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn("VAPID keys not configured. Skip web push.");
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await PushSubscriptionModel.find({}).lean();
  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const payload = JSON.stringify({
    title,
    body: body || "",
    ...data,
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        },
        payload,
        {
          TTL: 60 * 60 * 24, // 24 hours
        }
      );
      sent++;
    } catch (err) {
      failed++;
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expired or invalid - remove it
        await PushSubscriptionModel.deleteOne({ _id: sub._id }).catch(() => {});
      }
      console.warn("Push send failed for subscription:", sub._id, err.message);
    }
  }

  return { sent, failed };
};

module.exports = { sendPushToAll, setVapidKeys };
