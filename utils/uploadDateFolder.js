/**
 * Returns a DD-MM-YYYY segment for R2 keys so objects group by upload calendar day
 * (e.g. products/28-03-2026/1730000000000-photo.jpg).
 */
function getUploadDateFolder(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

module.exports = { getUploadDateFolder };
