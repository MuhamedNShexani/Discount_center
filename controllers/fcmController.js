const User = require("../models/User");
const FcmToken = require("../models/FcmToken");

const PLATFORMS = FcmToken.PLATFORMS || ["android", "ios"];

function tokenPreview(token) {
  if (!token || typeof token !== "string") return "(empty)";
  const t = token.trim();
  if (t.length <= 12) return `${t.slice(0, 4)}…`;
  return `${t.slice(0, 8)}…${t.slice(-4)} (${t.length} chars)`;
}

function safeBodyForLog(body) {
  if (!body || typeof body !== "object") return body;
  return {
    ...body,
    token: body.token ? tokenPreview(String(body.token)) : undefined,
  };
}

async function resolveUserId(req) {
  if (req.userId) return req.userId;

  const deviceId =
    typeof req.body?.deviceId === "string" ? req.body.deviceId.trim() : "";
  if (!deviceId) return null;

  let user = await User.findOne({ deviceId });
  if (!user) {
    user = new User({ deviceId });
    await user.save();
    console.log("[FCM] Created guest user for deviceId:", deviceId);
  }
  return user._id;
}

// @desc    Register or refresh an FCM device token (Flutter mobile app)
// @route   POST /api/users/fcm-token
// @access  Optional auth (Bearer JWT or deviceId for guests)
const registerFcmToken = async (req, res) => {
  console.log("[FCM] Incoming POST /api/users/fcm-token");
  console.log("[FCM] Request body:", safeBodyForLog(req.body));
  console.log("[FCM] Authenticated user:", req.userId ? String(req.userId) : "(none)");
  console.log("[FCM] DeviceId:", req.body?.deviceId || "(none)");

  try {
    const token =
      typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const platform =
      typeof req.body?.platform === "string"
        ? req.body.platform.trim().toLowerCase()
        : "";
    const deviceId =
      typeof req.body?.deviceId === "string" ? req.body.deviceId.trim() : "";
    const appVersion =
      typeof req.body?.appVersion === "string"
        ? req.body.appVersion.trim().slice(0, 64)
        : "";
    const language =
      typeof req.body?.language === "string"
        ? req.body.language.trim().slice(0, 16)
        : "";

    console.log("[FCM] Token:", tokenPreview(token));

    if (!token) {
      console.warn("[FCM] Validation failed: token is required");
      return res.status(400).json({
        success: false,
        message: "token is required",
      });
    }

    if (token.length < 20 || token.length > 4096) {
      console.warn("[FCM] Validation failed: token length is invalid");
      return res.status(400).json({
        success: false,
        message: "token length is invalid",
      });
    }

    if (platform && !PLATFORMS.includes(platform)) {
      console.warn("[FCM] Validation failed: invalid platform:", platform);
      return res.status(400).json({
        success: false,
        message: `platform must be one of: ${PLATFORMS.join(", ")}`,
      });
    }

    const userId = await resolveUserId(req);
    if (!userId) {
      console.warn("[FCM] Auth failed: no JWT user and no deviceId");
      return res.status(401).json({
        success: false,
        message: "Login or provide deviceId to register FCM token",
      });
    }

    console.log("[FCM] Resolved userId:", String(userId));

    const update = {
      userId,
      token,
      ...(platform ? { platform } : {}),
      ...(appVersion ? { appVersion } : {}),
      ...(language ? { language } : {}),
      ...(deviceId ? { deviceId } : {}),
    };

    // Remove stale tokens for this user+device BEFORE upsert to avoid
    // partial unique index { userId, deviceId } rejecting token refresh.
    if (deviceId) {
      const removed = await FcmToken.deleteMany({
        userId,
        deviceId,
        token: { $ne: token },
      });
      if (removed.deletedCount > 0) {
        console.log(
          `[FCM] Removed ${removed.deletedCount} stale token(s) for user+device`,
        );
      }
    }

    const record = await FcmToken.findOneAndUpdate(
      { token },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );

    console.log("[FCM] Mongo save result:", {
      id: String(record._id),
      userId: String(record.userId),
      deviceId: record.deviceId || null,
      platform: record.platform || null,
      collection: record.collection?.name || "fcmtokens",
    });

    res.json({
      success: true,
      message: "FCM token saved",
      data: {
        id: record._id,
        userId: record.userId,
        deviceId: record.deviceId || null,
        platform: record.platform || null,
        appVersion: record.appVersion || null,
        language: record.language || null,
        updatedAt: record.updatedAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      console.warn("[FCM] Duplicate key on save, attempting recovery:", error.message);
      try {
        const token = String(req.body?.token || "").trim();
        const deviceId =
          typeof req.body?.deviceId === "string" ? req.body.deviceId.trim() : "";
        const userId = await resolveUserId(req);

        if (userId && deviceId) {
          await FcmToken.deleteMany({
            userId,
            deviceId,
            token: { $ne: token },
          });
        }

        const existing = token
          ? await FcmToken.findOne({ token }).lean()
          : null;
        if (existing) {
          console.log("[FCM] Mongo save recovered existing token document");
          return res.json({
            success: true,
            message: "FCM token saved",
            data: {
              id: existing._id,
              userId: existing.userId,
              deviceId: existing.deviceId || null,
              platform: existing.platform || null,
              appVersion: existing.appVersion || null,
              language: existing.language || null,
              updatedAt: existing.updatedAt,
            },
          });
        }
      } catch (retryErr) {
        console.error("[FCM] Duplicate-key recovery failed:", retryErr.message);
      }
    }

    console.error("[FCM] Register FCM token error:", error.message);
    if (error.stack) {
      console.error("[FCM] Stack trace:", error.stack);
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { registerFcmToken };
