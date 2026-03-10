const mongoose = require("mongoose");

const userNotificationStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    markAllReadBefore: {
      type: Date,
      required: true,
    },
    clearedBefore: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "UserNotificationState",
  userNotificationStateSchema
);
