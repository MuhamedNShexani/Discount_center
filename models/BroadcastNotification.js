const mongoose = require("mongoose");

const broadcastNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ["info", "promo", "alert", "general"],
      default: "general",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

broadcastNotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
  "BroadcastNotification",
  broadcastNotificationSchema
);
