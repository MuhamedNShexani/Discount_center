const fs = require("fs");
const path = require("path");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { r2Client, r2BucketName, r2PublicUrl } = require("../config/r2");
const { getUploadDateFolder } = require("./uploadDateFolder");
const { appendExpiryToFilename } = require("./appendExpiryToFilename");

const hasR2Config = () =>
  Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY &&
      process.env.R2_SECRET_KEY &&
      r2BucketName &&
      r2PublicUrl,
  );

const safeName = (name = "image") => {
  const cleaned = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "image";
};

const tryRemoveFile = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignore cleanup errors
  }
};

/**
 * @param {object} file - multer file
 * @param {string} folder - R2 prefix (e.g. "products")
 * @param {{ expireDate?: string }} [options] - if expireDate is set, filename gets `-exp-YYYY-MM-DD` before extension (products)
 */
const uploadImage = async (file, folder = "images", options = {}) => {
  if (!file) {
    const err = new Error("No file uploaded");
    err.statusCode = 400;
    throw err;
  }

  // Fallback: keep local uploads behavior when R2 is not configured.
  if (!hasR2Config()) {
    return {
      url: `/uploads/${file.filename}`,
      key: null,
      storage: "local",
    };
  }

  const ext = path.extname(file.originalname || file.filename || "") || ".jpg";
  const base = safeName(path.basename(file.originalname || file.filename || "image", ext));
  const dateFolder = getUploadDateFolder();
  const expireRaw = options?.expireDate;
  const nameWithExt =
    expireRaw != null && String(expireRaw).trim() !== ""
      ? appendExpiryToFilename(`${base}${ext}`, expireRaw)
      : `${base}${ext}`;
  const key = `${folder}/${dateFolder}/${Date.now()}-${nameWithExt}`;
  const body = file.buffer || fs.readFileSync(file.path);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: r2BucketName,
      Key: key,
      Body: body,
      ContentType: file.mimetype || "application/octet-stream",
    }),
  );

  // When uploaded to R2, remove local temporary file if any.
  tryRemoveFile(file.path);

  return {
    url: `${r2PublicUrl}/${key}`,
    key,
    storage: "r2",
  };
};

module.exports = { uploadImage };

