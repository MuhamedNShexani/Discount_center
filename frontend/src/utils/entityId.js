/** Normalize Mongo/API ids (string, ObjectId, `{ _id }`, `{ $oid }`). */
export function getEntityId(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "object") {
    if (value.$oid != null) return String(value.$oid);
    if (value._id != null) return getEntityId(value._id);
  }
  const asString = String(value);
  return asString === "[object Object]" ? null : asString;
}

export function resolveStoreTypeId(entity) {
  return getEntityId(entity?.storeTypeId);
}
