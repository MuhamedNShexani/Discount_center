const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    contactWhatsAppNumber: {
      type: String,
      default: "+9647503683478",
      trim: true,
    },
  },
  { timestamps: true }
);

// Single document - use "app" as the only settings doc id
module.exports = mongoose.model("Settings", settingsSchema);
