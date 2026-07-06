const Settings = require("../models/Settings");

/** Keep in sync with settingsController defaults so first Settings doc (theme) is not missing contact fields. */
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

const ALLOWED_THEMES = [
  "default",
  "blackWhite",
  "ramadan",
  "rain",
  "neon1",
  "neon2",
  "flash-sale",
  "luxury",
  "eco-green",
  "ice",
  "festival",
  "tech",
  "minimal",
  "sunset",
  "middle-east",
  "marketplace",
];

// Fonts are defined in frontend/public/fonts and registered in /fonts/fonts.css.
// Allow any reasonable font-family key chosen by admin UI.
const isSafeFontKey = (value) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= 80;

const DEFAULT_NAV_CONFIG = {
  template: "template1",
  bottomNavLabelMode: "activeOnly",
  topSlots: {
    topleft1: "",
    topleft2: "",
    center: "label",
    topright1: "",
    topright2: "",
    topright3: "",
  },
  bottomSlots: {
    bottomleft1: "home",
    bottomleft2: "search",
    center: "reels",
    bottomright1: "stores",
    bottomright2: "profile",
  },
};

const ALLOWED_NAV_TEMPLATES = [
  "template1",
  "template2",
  "template3",
  "custom",
  "custom2",
  "custom3",
];
const ALLOWED_NAV_ACTIONS = [
  "", // empty slot
  "none",
  "label",
  "logo",
  "home",
  "search",
  "refresh",
  "categories",
  "reels",
  "favourites",
  "stores",
  "gifts",
  "shopping",
  "draftCart",
  "profile",
  "brands",
  "companies",
  "jobs",
  "city",
  "language",
  "notifications",
];

const sanitizeSlot = (value) => {
  const v = String(value || "").trim();
  return ALLOWED_NAV_ACTIONS.includes(v) ? v : "";
};

const DEFAULT_PROFILE_SHORTCUTS = [
  "brands",
  "companies",
  "findjob",
  "categories",
  "stores",
  "gifts",
  "search",
  "reels",
];

const DEFAULT_TRENDING_SEARCHES = [
  "Restaurants",
  "Fashion",
  "Electronics",
  "Nearby stores",
  "Gifts",
  "Shopping",
];

const MAX_TRENDING_SEARCHES = 12;

const ALLOWED_PROFILE_SHORTCUT_IDS = new Set([
  "home",
  "search",
  "categories",
  "reels",
  "favourites",
  "stores",
  "gifts",
  "shopping",
  "brands",
  "companies",
  "findjob",
]);

const sanitizeProfileShortcuts = (input) => {
  if (!Array.isArray(input)) return [...DEFAULT_PROFILE_SHORTCUTS];
  const seen = new Set();
  const out = [];
  for (const raw of input) {
    const id = String(raw || "").trim();
    if (!ALLOWED_PROFILE_SHORTCUT_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= 12) break;
  }
  return out.length > 0 ? out : [...DEFAULT_PROFILE_SHORTCUTS];
};

const sanitizeTrendingSearches = (input) => {
  if (!Array.isArray(input)) return [...DEFAULT_TRENDING_SEARCHES];
  const seen = new Set();
  const out = [];
  for (const raw of input) {
    const term = String(raw || "").trim();
    if (!term || term.length > 80) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(term);
    if (out.length >= MAX_TRENDING_SEARCHES) break;
  }
  return out.length > 0 ? out : [...DEFAULT_TRENDING_SEARCHES];
};

const sanitizeNavConfig = (input) => {
  if (!input || typeof input !== "object") return null;
  const template = String(input.template || "").trim();
  const safeTemplate = ALLOWED_NAV_TEMPLATES.includes(template)
    ? template
    : DEFAULT_NAV_CONFIG.template;

  const top = input.topSlots && typeof input.topSlots === "object" ? input.topSlots : {};
  const bottom =
    input.bottomSlots && typeof input.bottomSlots === "object"
      ? input.bottomSlots
      : {};

  return {
    template: safeTemplate,
    bottomNavLabelMode:
      input.bottomNavLabelMode === "always" ? "always" : "activeOnly",
    topSlots: {
      topleft1: sanitizeSlot(top.topleft1),
      topleft2: sanitizeSlot(top.topleft2),
      center: sanitizeSlot(top.center) || "label",
      topright1: sanitizeSlot(top.topright1),
      topright2: sanitizeSlot(top.topright2),
      topright3: sanitizeSlot(top.topright3),
    },
    bottomSlots: {
      bottomleft1: sanitizeSlot(bottom.bottomleft1) || "home",
      bottomleft2: sanitizeSlot(bottom.bottomleft2) || "categories",
      center: sanitizeSlot(bottom.center) || "reels",
      bottomright1: sanitizeSlot(bottom.bottomright1) || "favourites",
      bottomright2: sanitizeSlot(bottom.bottomright2) || "profile",
    },
  };
};

const isAdminUser = (user) => {
  if (!user) return false;
  const adminEmails = ["mshexani45@gmail.com", "admin@gmail.com"];
  return adminEmails.includes(user.email);
};

// @desc    Get active theme (public)
// @route   GET /api/theme
const getTheme = async (req, res) => {
  try {
    let settings = await Settings.findOne().lean();
    if (!settings) {
      settings = await Settings.create({
        activeTheme: "default",
        activeFontKey: "default",
        navConfig: DEFAULT_NAV_CONFIG,
        profileShortcuts: [...DEFAULT_PROFILE_SHORTCUTS],
        trendingSearches: [...DEFAULT_TRENDING_SEARCHES],
        contactWhatsAppNumber: DEFAULT_CONTACT,
        contactInfo: { ...EMPTY_CONTACT_INFO, whatsapp: DEFAULT_CONTACT },
      });
      settings = settings.toObject();
    }
    const activeTheme = settings.activeTheme || "default";
    const activeFontKey = settings.activeFontKey || "default";
    const navConfig =
      sanitizeNavConfig(settings.navConfig) || DEFAULT_NAV_CONFIG;
    const profileShortcuts = sanitizeProfileShortcuts(
      settings.profileShortcuts,
    );
    const trendingSearches = sanitizeTrendingSearches(
      settings.trendingSearches,
    );
    res.json({ activeTheme, activeFontKey, navConfig, profileShortcuts, trendingSearches });
  } catch (err) {
    console.error("Get theme error:", err.message);
    res.json({
      activeTheme: "default",
      activeFontKey: "default",
      navConfig: DEFAULT_NAV_CONFIG,
      profileShortcuts: [...DEFAULT_PROFILE_SHORTCUTS],
      trendingSearches: [...DEFAULT_TRENDING_SEARCHES],
    });
  }
};

// @desc    Update active theme (admin only)
// @route   PUT /api/theme
const updateTheme = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Admin privileges required",
      });
    }

    const theme = String(req.body?.activeTheme || "").trim();
    if (!ALLOWED_THEMES.includes(theme)) {
      return res.status(400).json({
        success: false,
        message: `Invalid theme. Allowed: ${ALLOWED_THEMES.join(", ")}`,
      });
    }

    const fontKeyRaw = req.body?.activeFontKey;
    const fontKey =
      fontKeyRaw === undefined ? undefined : String(fontKeyRaw || "").trim();
    if (fontKey !== undefined && !isSafeFontKey(fontKey)) {
      return res.status(400).json({
        success: false,
        message: "Invalid font",
      });
    }

    const navConfigRaw = req.body?.navConfig;
    const navConfig =
      navConfigRaw === undefined ? undefined : sanitizeNavConfig(navConfigRaw);
    if (navConfigRaw !== undefined && !navConfig) {
      return res.status(400).json({ success: false, message: "Invalid navConfig" });
    }

    const profileShortcutsRaw = req.body?.profileShortcuts;
    const profileShortcuts =
      profileShortcutsRaw === undefined
        ? undefined
        : sanitizeProfileShortcuts(profileShortcutsRaw);

    const trendingSearchesRaw = req.body?.trendingSearches;
    const trendingSearches =
      trendingSearchesRaw === undefined
        ? undefined
        : sanitizeTrendingSearches(trendingSearchesRaw);

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        activeTheme: theme,
        activeFontKey: fontKey || "default",
        navConfig: navConfig || DEFAULT_NAV_CONFIG,
        profileShortcuts:
          profileShortcuts !== undefined
            ? profileShortcuts
            : [...DEFAULT_PROFILE_SHORTCUTS],
        trendingSearches:
          trendingSearches !== undefined
            ? trendingSearches
            : [...DEFAULT_TRENDING_SEARCHES],
        contactWhatsAppNumber: DEFAULT_CONTACT,
        contactInfo: { ...EMPTY_CONTACT_INFO, whatsapp: DEFAULT_CONTACT },
      });
    } else {
      settings.activeTheme = theme;
      if (fontKey !== undefined) {
        settings.activeFontKey = fontKey || "default";
      }
      if (navConfig !== undefined) {
        settings.navConfig = navConfig;
      }
      if (profileShortcuts !== undefined) {
        settings.profileShortcuts = profileShortcuts;
      }
      if (trendingSearches !== undefined) {
        settings.trendingSearches = trendingSearches;
      }
      await settings.save();
    }

    res.json({
      success: true,
      activeTheme: settings.activeTheme,
      activeFontKey: settings.activeFontKey || "default",
      navConfig: settings.navConfig || DEFAULT_NAV_CONFIG,
      profileShortcuts: sanitizeProfileShortcuts(settings.profileShortcuts),
      trendingSearches: sanitizeTrendingSearches(settings.trendingSearches),
    });
  } catch (err) {
    console.error("Update theme error:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  getTheme,
  updateTheme,
  ALLOWED_THEMES,
};

