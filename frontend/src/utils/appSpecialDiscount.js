/** Partner-app special discount kinds (Data Entry → store profile / showcase). */
export const APP_DISCOUNT_TYPES = {
  PERCENT_ALL: "percent_all",
  PERCENT_SELECTED: "percent_selected",
  FIXED_IQD: "fixed_iqd",
};

export const APP_DISCOUNT_TYPE_OPTIONS = [
  {
    value: APP_DISCOUNT_TYPES.PERCENT_ALL,
    labelKey: "Percentage off all items",
  },
  {
    value: APP_DISCOUNT_TYPES.PERCENT_SELECTED,
    labelKey: "Percentage off selected items",
  },
  {
    value: APP_DISCOUNT_TYPES.FIXED_IQD,
    labelKey: "Iraqi Dinar (IQD) off",
  },
];

export function normalizeAppDiscountType(type) {
  const t = String(type || "").trim();
  if (
    t === APP_DISCOUNT_TYPES.PERCENT_SELECTED ||
    t === APP_DISCOUNT_TYPES.FIXED_IQD
  ) {
    return t;
  }
  return APP_DISCOUNT_TYPES.PERCENT_ALL;
}

export function isPercentAppDiscountType(type) {
  const t = normalizeAppDiscountType(type);
  return (
    t === APP_DISCOUNT_TYPES.PERCENT_ALL ||
    t === APP_DISCOUNT_TYPES.PERCENT_SELECTED
  );
}

export function formatIqdAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "";
  return new Intl.NumberFormat("en-IQ", { maximumFractionDigits: 0 }).format(
    n,
  );
}

/** User-facing chip / banner label for a special discount row or showcase offer. */
export function getSpecialDiscountLabel(row, t, formatPrice) {
  const type = normalizeAppDiscountType(row?.discountType);
  if (type === APP_DISCOUNT_TYPES.FIXED_IQD) {
    const amount = Number(row?.fixedAmountIqd);
    const formatted =
      typeof formatPrice === "function"
        ? formatPrice(amount)
        : formatIqdAmount(amount);
    return t("{{amount}} IQD off", {
      amount: formatted,
      defaultValue: `${formatted} IQD off`,
    });
  }
  const percent = Number(row?.discountPercent ?? row?.percentageDiscount);
  if (type === APP_DISCOUNT_TYPES.PERCENT_SELECTED) {
    return t("{{percent}}% off selected items", {
      percent,
      defaultValue: `${percent}% off selected items`,
    });
  }
  return t("{{percent}}% off all items", {
    percent,
    defaultValue: `${percent}% off all items`,
  });
}

export function isSpecialDiscountRowActive(row, isExpiryValid) {
  if (!row) return false;
  const expiryOk =
    typeof isExpiryValid === "function"
      ? isExpiryValid(row.expireDate)
      : true;
  if (!expiryOk) return false;
  const type = normalizeAppDiscountType(row.discountType);
  if (type === APP_DISCOUNT_TYPES.FIXED_IQD) {
    return Number(row.fixedAmountIqd) > 0;
  }
  const pct = Number(row.percentageDiscount ?? row.discountPercent);
  return Number.isFinite(pct) && pct > 0;
}

/** Normalize Data Entry rows before API save. */
export function normalizeDiscountRowsForApi(rows) {
  return (rows || [])
    .map((row) => {
      const storeId = row.storeId?._id || row.storeId || "";
      const discountType = normalizeAppDiscountType(row.discountType);
      const base = {
        storeId,
        discountType,
        expireDate: row.expireDate || null,
      };
      if (discountType === APP_DISCOUNT_TYPES.FIXED_IQD) {
        const fixedAmountIqd =
          row.fixedAmountIqd === "" || row.fixedAmountIqd == null
            ? NaN
            : Number(row.fixedAmountIqd);
        return { ...base, fixedAmountIqd, percentageDiscount: null };
      }
      const percentageDiscount =
        row.percentageDiscount === "" || row.percentageDiscount == null
          ? NaN
          : Number(row.percentageDiscount);
      return { ...base, percentageDiscount, fixedAmountIqd: null };
    })
    .filter((row) => {
      if (!row.storeId) return false;
      if (row.discountType === APP_DISCOUNT_TYPES.FIXED_IQD) {
        return (
          Number.isFinite(row.fixedAmountIqd) && row.fixedAmountIqd > 0
        );
      }
      return (
        Number.isFinite(row.percentageDiscount) &&
        row.percentageDiscount >= 0 &&
        row.percentageDiscount <= 100 &&
        row.percentageDiscount > 0
      );
    });
}

export function discountRowSummary(row, t) {
  return getSpecialDiscountLabel(row, t);
}
