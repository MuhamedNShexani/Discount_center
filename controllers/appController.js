const App = require("../models/App");
const Store = require("../models/Store");
const { normalizeExpiryDate } = require("../utils/normalizeExpiryDate");
const { isExpiryStillValid } = require("../utils/isExpiryStillValid");
const { storeList, storeDetail } = require("../utils/refPopulate");

const publicStoreFilter = { statusAll: { $ne: "off" }, show: true };

const DISCOUNT_TYPES = {
  PERCENT_ALL: "percent_all",
  PERCENT_SELECTED: "percent_selected",
  FIXED_IQD: "fixed_iqd",
};

function normalizeDiscountType(type) {
  const t = String(type || "").trim();
  if (t === DISCOUNT_TYPES.PERCENT_SELECTED || t === DISCOUNT_TYPES.FIXED_IQD) {
    return t;
  }
  return DISCOUNT_TYPES.PERCENT_ALL;
}

function normalizeSpecialDiscounts(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const storeId = row?.storeId?._id || row?.storeId;
      if (!storeId) return null;
      const discountType = normalizeDiscountType(row?.discountType);
      let expireDate = null;
      if (row.expireDate != null && row.expireDate !== "") {
        expireDate = normalizeExpiryDate(row.expireDate);
      }
      if (discountType === DISCOUNT_TYPES.FIXED_IQD) {
        const fixedAmountIqd = Number(row?.fixedAmountIqd);
        if (!Number.isFinite(fixedAmountIqd) || fixedAmountIqd <= 0) return null;
        return {
          storeId,
          discountType,
          fixedAmountIqd,
          percentageDiscount: null,
          expireDate,
        };
      }
      const percentageDiscount = Number(row?.percentageDiscount);
      if (!Number.isFinite(percentageDiscount)) return null;
      if (percentageDiscount < 0 || percentageDiscount > 100) return null;
      return {
        storeId,
        discountType,
        percentageDiscount,
        fixedAmountIqd: null,
        expireDate,
      };
    })
    .filter(Boolean);
}

function isActiveSpecialDiscount(row) {
  if (!row) return false;
  if (!isExpiryStillValid(row.expireDate)) return false;
  const discountType = normalizeDiscountType(row.discountType);
  if (discountType === DISCOUNT_TYPES.FIXED_IQD) {
    return Number(row.fixedAmountIqd) > 0;
  }
  const pct = Number(row.percentageDiscount);
  return Number.isFinite(pct) && pct > 0;
}

function rowToOfferFields(row) {
  const discountType = normalizeDiscountType(row.discountType);
  if (discountType === DISCOUNT_TYPES.FIXED_IQD) {
    return {
      discountType,
      fixedAmountIqd: Number(row.fixedAmountIqd),
      discountPercent: null,
      percentageDiscount: null,
    };
  }
  const pct = Number(row.percentageDiscount);
  return {
    discountType,
    discountPercent: pct,
    percentageDiscount: pct,
    fixedAmountIqd: null,
  };
}

function isActivePublicStoreDiscount(store) {
  if (!store?.hasAllProductsDiscount) return false;
  const pct = Number(store.allProductsDiscountPercent);
  if (!Number.isFinite(pct) || pct <= 0) return false;
  return isExpiryStillValid(store.allProductsDiscountExpireDate);
}

function appendShowcaseApp(entry, appLite, row) {
  const fields = rowToOfferFields(row);
  const offer = {
    ...appLite,
    source: "app",
    ...fields,
    expireDate: row.expireDate || null,
  };

  if (!entry.offers) {
    entry.offers = [];
    if (entry.source === "public" && entry.discountPercent != null) {
      entry.offers.push({
        source: "public",
        discountPercent: Number(entry.discountPercent),
        expireDate: entry.expireDate || null,
      });
    } else if (entry.app && entry.discountPercent != null) {
      entry.offers.push({
        ...entry.app,
        source: "app",
        discountPercent: Number(entry.discountPercent),
        expireDate: entry.expireDate || null,
      });
    }
  }

  const appId = String(appLite._id);
  const existingIdx = entry.offers.findIndex(
    (o) => o.source === "app" && String(o._id) === appId,
  );
  if (existingIdx >= 0) {
    entry.offers[existingIdx] = offer;
  } else {
    entry.offers.push(offer);
  }

  if (!entry.apps) {
    entry.apps = entry.app ? [entry.app] : [];
  }
  if (!entry.apps.some((a) => String(a._id) === appId)) {
    entry.apps.push(appLite);
  }
}

function syncShowcaseEntrySummary(entry) {
  const offers = entry.offers || [];
  const appOffers = offers.filter((o) => o.source === "app");
  entry.appCount = appOffers.length;
  if (appOffers.length > 0) {
    const topApp = [...appOffers].sort(
      (a, b) => Number(b.discountPercent) - Number(a.discountPercent),
    )[0];
    entry.app = {
      _id: topApp._id,
      name: topApp.name,
      nameEn: topApp.nameEn,
      nameAr: topApp.nameAr,
      nameKu: topApp.nameKu,
      logo: topApp.logo,
    };
  }
  const percents = offers
    .map((o) => Number(o.discountPercent))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (percents.length > 0) {
    entry.discountPercent = Math.max(...percents);
  }
  const topOffer = [...offers].sort((a, b) => {
    const aPct = Number(a.discountPercent) || 0;
    const bPct = Number(b.discountPercent) || 0;
    const aIqd = Number(a.fixedAmountIqd) || 0;
    const bIqd = Number(b.fixedAmountIqd) || 0;
    if (bPct !== aPct) return bPct - aPct;
    return bIqd - aIqd;
  })[0];
  if (topOffer?.expireDate) {
    entry.expireDate = topOffer.expireDate;
  }
}

function buildShowcaseEntries(stores, apps) {
  const byStoreId = new Map();

  for (const store of stores) {
    const sid = String(store._id);
    if (isActivePublicStoreDiscount(store)) {
      byStoreId.set(sid, {
        store,
        discountPercent: Number(store.allProductsDiscountPercent),
        source: "public",
        appCount: 0,
        expireDate: store.allProductsDiscountExpireDate || null,
        offers: [
          {
            source: "public",
            discountPercent: Number(store.allProductsDiscountPercent),
            expireDate: store.allProductsDiscountExpireDate || null,
          },
        ],
      });
    }
  }

  for (const app of apps) {
    const appLite = {
      _id: app._id,
      name: app.name,
      nameEn: app.nameEn,
      nameAr: app.nameAr,
      nameKu: app.nameKu,
      logo: app.logo,
    };
    for (const row of app.specialDiscounts || []) {
      if (!isActiveSpecialDiscount(row)) continue;
      const storeDoc = row.storeId;
      if (!storeDoc || storeDoc.statusAll === "off" || storeDoc.show === false) {
        continue;
      }
      const sid = String(storeDoc._id || row.storeId);
      const fields = rowToOfferFields(row);
      const existing = byStoreId.get(sid);
      if (!existing) {
        byStoreId.set(sid, {
          store: storeDoc,
          discountPercent: fields.discountPercent,
          source: "app",
          appCount: 1,
          app: appLite,
          apps: [appLite],
          expireDate: row.expireDate || null,
          offers: [
            {
              ...appLite,
              source: "app",
              ...fields,
              expireDate: row.expireDate || null,
            },
          ],
        });
        continue;
      }
      appendShowcaseApp(existing, appLite, row);
      existing.appCount = (existing.appCount || 0) + 1;
      if (
        fields.discountPercent != null &&
        (existing.discountPercent == null ||
          fields.discountPercent > existing.discountPercent)
      ) {
        existing.discountPercent = fields.discountPercent;
        if (existing.source !== "public") {
          existing.app = appLite;
          existing.expireDate = row.expireDate || null;
        }
      } else if (
        fields.fixedAmountIqd != null &&
        existing.discountPercent == null
      ) {
        if (existing.source !== "public") {
          existing.app = appLite;
          existing.expireDate = row.expireDate || null;
        }
      }
      if (existing.source === "public") {
        existing.appCount = (existing.appCount || 0) + 1;
      } else {
        existing.source = existing.appCount > 1 ? "app" : existing.source;
      }
      syncShowcaseEntrySummary(existing);
    }
  }

  const entries = Array.from(byStoreId.values());
  entries.forEach((entry) => {
    if (!entry.offers?.length) {
      syncShowcaseEntrySummary(entry);
    }
  });

  return entries.sort(
    (a, b) => b.discountPercent - a.discountPercent,
  );
}

const getApps = async (req, res) => {
  try {
    const apps = await App.find()
      .populate({
        path: "specialDiscounts.storeId",
        select: storeList,
        match: publicStoreFilter,
      })
      .sort({ createdAt: -1, _id: -1 });
    res.json({ success: true, data: apps });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching apps",
      error: error.message,
    });
  }
};

const getAppsByStore = async (req, res) => {
  try {
    const store = await Store.findOne({
      _id: req.params.storeId,
      statusAll: { $ne: "off" },
    }).lean();
    if (!store) {
      return res.json({ success: true, data: [] });
    }

    const apps = await App.find({
      "specialDiscounts.storeId": req.params.storeId,
    })
      .populate({
        path: "specialDiscounts.storeId",
        select: storeList,
        match: { statusAll: { $ne: "off" } },
      })
      .sort({ name: 1 });

    const rows = [];
    for (const app of apps) {
      const match = (app.specialDiscounts || []).find(
        (row) =>
          String(row.storeId?._id || row.storeId) ===
            String(req.params.storeId) && isActiveSpecialDiscount(row),
      );
      if (!match) continue;
      rows.push({
        app: {
          _id: app._id,
          name: app.name,
          nameEn: app.nameEn,
          nameAr: app.nameAr,
          nameKu: app.nameKu,
          logo: app.logo,
        },
        discountType: normalizeDiscountType(match.discountType),
        percentageDiscount: match.percentageDiscount,
        fixedAmountIqd: match.fixedAmountIqd,
        expireDate: match.expireDate || null,
      });
    }

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching store apps",
      error: error.message,
    });
  }
};

const getShowcaseStores = async (req, res) => {
  try {
    const stores = await Store.find(publicStoreFilter)
      .populate("storeTypeId", "name icon")
      .lean();
    const apps = await App.find()
      .populate({
        path: "specialDiscounts.storeId",
        select: `${storeList} show statusAll hasAllProductsDiscount allProductsDiscountPercent allProductsDiscountExpireDate`,
        match: publicStoreFilter,
      })
      .lean();
    const data = buildShowcaseEntries(stores, apps);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching showcase stores",
      error: error.message,
    });
  }
};

const getAppById = async (req, res) => {
  try {
    const app = await App.findById(req.params.id).populate({
      path: "specialDiscounts.storeId",
      select: storeDetail,
      match: { statusAll: { $ne: "off" } },
    });
    if (!app) {
      return res.status(404).json({ success: false, message: "App not found" });
    }
    res.json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching app",
      error: error.message,
    });
  }
};

const createApp = async (req, res) => {
  try {
    const { name, nameEn, nameAr, nameKu, logo, specialDiscounts } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "App name is required",
      });
    }
    const app = await App.create({
      name: String(name).trim(),
      nameEn,
      nameAr,
      nameKu,
      logo: logo || "",
      specialDiscounts: normalizeSpecialDiscounts(specialDiscounts),
    });
    const populated = await App.findById(app._id).populate({
      path: "specialDiscounts.storeId",
      select: storeList,
      match: { statusAll: { $ne: "off" } },
    });
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating app",
      error: error.message,
    });
  }
};

const updateApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: "App not found" });
    }
    const { name, nameEn, nameAr, nameKu, logo, specialDiscounts } = req.body;
    if (name !== undefined) app.name = String(name).trim();
    if (nameEn !== undefined) app.nameEn = nameEn;
    if (nameAr !== undefined) app.nameAr = nameAr;
    if (nameKu !== undefined) app.nameKu = nameKu;
    if (logo !== undefined) app.logo = logo || "";
    if (specialDiscounts !== undefined) {
      app.specialDiscounts = normalizeSpecialDiscounts(specialDiscounts);
    }
    await app.save();
    const populated = await App.findById(app._id).populate({
      path: "specialDiscounts.storeId",
      select: storeList,
      match: { statusAll: { $ne: "off" } },
    });
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating app",
      error: error.message,
    });
  }
};

const deleteApp = async (req, res) => {
  try {
    const app = await App.findByIdAndDelete(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: "App not found" });
    }
    res.json({ success: true, message: "App deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting app",
      error: error.message,
    });
  }
};

module.exports = {
  getApps,
  getAppsByStore,
  getShowcaseStores,
  getAppById,
  createApp,
  updateApp,
  deleteApp,
};
