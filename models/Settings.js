const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    contactWhatsAppNumber: {
      type: String,
      default: "+9647503683478",
      trim: true,
    },
    contactInfo: {
      whatsapp: { type: String, default: "", trim: true },
      facebook: { type: String, default: "", trim: true },
      instagram: { type: String, default: "", trim: true },
      snapchat: { type: String, default: "", trim: true },
      gmail: { type: String, default: "", trim: true },
      tiktok: { type: String, default: "", trim: true },
      viber: { type: String, default: "", trim: true },
      telegram: { type: String, default: "", trim: true },
    },
  },
  { timestamps: true }
);

// Single document - use "app" as the only settings doc id
module.exports = mongoose.model("Settings", settingsSchema);
