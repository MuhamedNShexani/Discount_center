const mongoose = require("mongoose");
const auditPlugin = require("./plugins/auditPlugin");

const PLATFORMS = ["android", "ios"];

const fcmTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      trim: true,
      maxlength: 200,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: PLATFORMS,
      lowercase: true,
      trim: true,
    },
    appVersion: {
      type: String,
      trim: true,
      maxlength: 64,
    },
    language: {
      type: String,
      trim: true,
      maxlength: 16,
    },
  },
  { timestamps: true },
);

fcmTokenSchema.plugin(auditPlugin);

// One active token per device per user (when deviceId is set).
fcmTokenSchema.index(
  { userId: 1, deviceId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deviceId: { $exists: true, $type: "string", $ne: "" },
    },
  },
);

module.exports = mongoose.model("FcmToken", fcmTokenSchema);
module.exports.PLATFORMS = PLATFORMS;
