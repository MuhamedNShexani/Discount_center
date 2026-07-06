const { normalizeExpiryDate } = require("./normalizeExpiryDate");

function normalizeStoreAllProductsDiscountFields(body = {}) {
  const hasAllProductsDiscount = Boolean(body.hasAllProductsDiscount);
  const percentRaw = body.allProductsDiscountPercent;
  const percent =
    percentRaw === null || percentRaw === undefined || percentRaw === ""
      ? null
      : Number(percentRaw);

  if (!hasAllProductsDiscount) {
    return {
      hasAllProductsDiscount: false,
      allProductsDiscountPercent: null,
      allProductsDiscountExpireDate: null,
    };
  }

  if (
    !Number.isFinite(percent) ||
    percent < 0 ||
    percent > 100
  ) {
    const err = new Error("allProductsDiscountPercent must be between 0 and 100");
    err.statusCode = 400;
    throw err;
  }

  let expireDate = null;
  if (
    body.allProductsDiscountExpireDate !== undefined &&
    body.allProductsDiscountExpireDate !== null &&
    body.allProductsDiscountExpireDate !== ""
  ) {
    expireDate = normalizeExpiryDate(body.allProductsDiscountExpireDate);
  }

  return {
    hasAllProductsDiscount: true,
    allProductsDiscountPercent: percent,
    allProductsDiscountExpireDate: expireDate,
  };
}

module.exports = { normalizeStoreAllProductsDiscountFields };
