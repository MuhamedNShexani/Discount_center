const { S3Client } = require("@aws-sdk/client-s3");

const requiredEnvVars = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY",
  "R2_SECRET_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    // Do not crash at startup; fail at request time with a clear message.
    console.warn(`[R2] Missing environment variable: ${envVar}`);
  }
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || "",
    secretAccessKey: process.env.R2_SECRET_KEY || "",
  },
});

module.exports = {
  r2Client,
  r2BucketName: process.env.R2_BUCKET_NAME || "",
  r2PublicUrl: (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, ""),
};
