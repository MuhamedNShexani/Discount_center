const Settings = require("../models/Settings");

const DEFAULT_CONTACT = "+9647503683478";
const EMPTY_CONTACT_INFO = {
  whatsapp: "",
  facebook: "",
  instagram: "",
  snapchat: "",
  gmail: "",
  tiktok: "",
  viber: "",
  telegram: "",
};

// @desc    Get app settings (public)
// @route   GET /api/settings
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        contactWhatsAppNumber: DEFAULT_CONTACT,
        contactInfo: { ...EMPTY_CONTACT_INFO, whatsapp: DEFAULT_CONTACT },
      });
    }
    res.json({
      contactWhatsAppNumber:
        settings.contactWhatsAppNumber || DEFAULT_CONTACT,
      contactInfo: {
        ...EMPTY_CONTACT_INFO,
        ...(settings.contactInfo || {}),
      },
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
    const { contactWhatsAppNumber, contactInfo } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        contactWhatsAppNumber: contactWhatsAppNumber || DEFAULT_CONTACT,
        contactInfo: {
          ...EMPTY_CONTACT_INFO,
          ...(contactInfo || {}),
        },
      });
    } else {
      if (contactWhatsAppNumber !== undefined) {
        settings.contactWhatsAppNumber =
          String(contactWhatsAppNumber).trim() || DEFAULT_CONTACT;
      }
      if (contactInfo !== undefined && typeof contactInfo === "object") {
        settings.contactInfo = {
          ...EMPTY_CONTACT_INFO,
          ...(settings.contactInfo || {}),
          ...Object.fromEntries(
            Object.entries(contactInfo).map(([k, v]) => [
              k,
              typeof v === "string" ? v.trim() : "",
            ]),
          ),
        };
      }
      await settings.save();
    }
    res.json({
      contactWhatsAppNumber:
        settings.contactWhatsAppNumber || DEFAULT_CONTACT,
      contactInfo: {
        ...EMPTY_CONTACT_INFO,
        ...(settings.contactInfo || {}),
      },
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
