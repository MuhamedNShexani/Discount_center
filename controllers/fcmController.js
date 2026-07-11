const User = require("../models/User");
const FcmToken = require("../models/FcmToken");

const PLATFORMS = FcmToken.PLATFORMS || ["android", "ios"];

async function resolveUserId(req) {
  if (req.userId) return req.userId;

  const deviceId =
    typeof req.body?.deviceId === "string" ? req.body.deviceId.trim() : "";
  if (!deviceId) return null;

  let user = await User.findOne({ deviceId });
  if (!user) {
    user = new User({ deviceId });
    await user.save();
  }
  return user._id;
}

// @desc    Register or refresh an FCM device token (Flutter mobile app)
// @route   POST /api/users/fcm-token
// @access  Optional auth (Bearer JWT or deviceId for guests)
const registerFcmToken = async (req, res) => {
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

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "token is required",
      });
    }

    if (token.length < 20 || token.length > 4096) {
      return res.status(400).json({
        success: false,
        message: "token length is invalid",
      });
    }

    if (platform && !PLATFORMS.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: `platform must be one of: ${PLATFORMS.join(", ")}`,
      });
    }

    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login or provide deviceId to register FCM token",
      });
    }

    const update = {
      userId,
      token,
      ...(platform ? { platform } : {}),
      ...(appVersion ? { appVersion } : {}),
      ...(language ? { language } : {}),
      ...(deviceId ? { deviceId } : {}),
    };

    // Token is globally unique — upsert by token (same device refreshing token).
    const record = await FcmToken.findOneAndUpdate(
      { token },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // One active token per device: remove older tokens for this user+device.
    if (deviceId) {
      await FcmToken.deleteMany({
        userId,
        deviceId,
        token: { $ne: token },
      });
    }

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
      // Rare race on unique index — retry read.
      try {
        const existing = await FcmToken.findOne({
          token: String(req.body?.token || "").trim(),
        }).lean();
        if (existing) {
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
      } catch {
        // fall through
      }
    }
    console.error("Register FCM token error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { registerFcmToken };
