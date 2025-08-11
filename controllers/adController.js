const Ad = require("../models/Ad");

// @desc    Get all ads
// @route   GET /api/ads
const getAds = async (req, res) => {
  try {
    // Optional filter by page via query param: ?page=home|brands|stores|gifts|all
    const { page } = req.query;
    const filter = {};
    if (page) {
      const normalized = String(page).toLowerCase();
      if (["all", "home", "brands", "stores", "gifts"].includes(normalized)) {
        // Match ads that are for this page or include "all" in pages
        filter.$or = [
          { pages: { $in: [normalized] } },
          { pages: { $in: ["all"] } },
        ];
      }
    }

    // Prioritize active ads with higher priority, then most recent
    const ads = await Ad.find(filter).sort({
      active: -1,
      priority: -1,
      createdAt: -1,
    });
    res.json(ads);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get ad by ID
// @route   GET /api/ads/:id
const getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ msg: "Ad not found" });
    res.json(ad);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Create ad
// @route   POST /api/ads
const createAd = async (req, res) => {
  try {
    const payload = { ...req.body };
    // Normalize single 'page' to 'pages' array; normalize all to lowercase
    if (payload.page) {
      payload.pages = [String(payload.page).toLowerCase()];
      delete payload.page;
    }
    if (Array.isArray(payload.pages)) {
      payload.pages = payload.pages
        .filter((p) => !!p)
        .map((p) => String(p).toLowerCase());
    }
    const ad = new Ad(payload);
    await ad.save();
    res.json(ad);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update ad
// @route   PUT /api/ads/:id
const updateAd = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.page) {
      payload.pages = [String(payload.page).toLowerCase()];
      delete payload.page;
    }
    if (Array.isArray(payload.pages)) {
      payload.pages = payload.pages
        .filter((p) => !!p)
        .map((p) => String(p).toLowerCase());
    }
    const ad = await Ad.findByIdAndUpdate(req.params.id, payload, {
      new: true,
    });
    if (!ad) return res.status(404).json({ msg: "Ad not found" });
    res.json(ad);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Delete ad
// @route   DELETE /api/ads/:id
const deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);
    if (!ad) return res.status(404).json({ msg: "Ad not found" });
    res.json({ msg: "Ad deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getAds,
  getAdById,
  createAd,
  updateAd,
  deleteAd,
};
