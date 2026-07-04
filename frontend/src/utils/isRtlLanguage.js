/** Kurdish + Arabic — must match App.js body/html `dir` and MUI RTL cache. */
const RTL_LANGUAGE_CODES = new Set(["ar", "ku"]);

export function isRtlLanguage(language) {
  const code = String(language || "")
    .split("-")[0]
    .toLowerCase();
  return RTL_LANGUAGE_CODES.has(code);
}
