/** Product/offer still valid (strict instant: after now). */
function isExpiryStillValid(expireDate) {
  if (expireDate == null || expireDate === "") return true;
  const exp = new Date(expireDate);
  if (Number.isNaN(exp.getTime())) return true;
  return exp.getTime() > Date.now();
}

module.exports = { isExpiryStillValid };
