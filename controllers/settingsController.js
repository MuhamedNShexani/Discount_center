const Settings = require("../models/Settings");

const DEFAULT_CONTACT = "+9647503683478";

// @desc    Get app settings (public)
// @route   GET /api/settings
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        contactWhatsAppNumber: DEFAULT_CONTACT,
      });
    }
    res.json({
      contactWhatsAppNumber:
        settings.contactWhatsAppNumber || DEFAULT_CONTACT,
    });
  } catch (err) {
    console.error("Get settings error:", err.message);
    res.status(500).json({
      contactWhatsAppNumber: DEFAULT_CONTACT,
    });
  }
};

// @desc    Update app settings (protected)
// @route   PUT /api/settings
const updateSettings = async (req, res) => {
  try {
    const { contactWhatsAppNumber } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        contactWhatsAppNumber: contactWhatsAppNumber || DEFAULT_CONTACT,
      });
    } else if (contactWhatsAppNumber !== undefined) {
      settings.contactWhatsAppNumber =
        String(contactWhatsAppNumber).trim() || DEFAULT_CONTACT;
      await settings.save();
    }
    res.json({
      contactWhatsAppNumber:
        settings.contactWhatsAppNumber || DEFAULT_CONTACT,
    });
  } catch (err) {
    console.error("Update settings error:", err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
