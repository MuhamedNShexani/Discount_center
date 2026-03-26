/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const fontsDir = path.join(projectRoot, "public", "fonts");
const outCss = path.join(fontsDir, "fonts.css");
const outJson = path.join(fontsDir, "fonts.json");

const FONT_EXTS = new Set([".ttf", ".otf", ".woff", ".woff2"]);

function getFormat(ext) {
  if (ext === ".woff2") return "woff2";
  if (ext === ".woff") return "woff";
  if (ext === ".otf") return "opentype";
  return "truetype";
}

function safeFamilyFromFilename(filename) {
  // Use basename as family key (must match admin dropdown).
  // Keep spaces/underscores as-is for display; wrap in quotes in CSS.
  return path.basename(filename, path.extname(filename));
}

function main() {
  if (!fs.existsSync(fontsDir)) {
    console.warn("[generateFonts] fontsDir not found:", fontsDir);
    process.exit(0);
  }

  const files = fs
    .readdirSync(fontsDir)
    .filter((f) => FONT_EXTS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en"));

  const families = Array.from(new Set(files.map(safeFamilyFromFilename)));

  const cssLines = [];
  cssLines.push("/* Auto-generated. Do not edit manually. */");
  cssLines.push("");

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const format = getFormat(ext);
    const family = safeFamilyFromFilename(file);
    const url = `/fonts/${encodeURI(file)}`;
    cssLines.push("@font-face {");
    cssLines.push(`  font-family: "${family}";`);
    cssLines.push(`  src: url("${url}") format("${format}");`);
    cssLines.push("  font-weight: 400;");
    cssLines.push("  font-style: normal;");
    cssLines.push("  font-display: swap;");
    cssLines.push("}");
    cssLines.push("");
  }

  fs.writeFileSync(outCss, cssLines.join("\n"), "utf8");
  fs.writeFileSync(outJson, JSON.stringify({ families }, null, 2), "utf8");

  console.log(`[generateFonts] Wrote ${path.relative(projectRoot, outCss)} (${files.length} files)`);
  console.log(`[generateFonts] Wrote ${path.relative(projectRoot, outJson)} (${families.length} families)`);
}

main();

