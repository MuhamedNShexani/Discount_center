const express = require("express");
const multer = require("multer");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const Video = require("../models/Video");
const { r2Client, r2BucketName, r2PublicUrl } = require("../config/r2");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("video/")) {
      return cb(new Error("Only video files are allowed"));
    }
    cb(null, true);
  },
});

const buildSafeFilename = (originalname = "video") => {
  const cleaned = originalname
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "video";
};

const ensureR2Config = () => {
  const missing = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY",
    "R2_SECRET_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
  ].filter((key) => !process.env[key]);

  if (missing.length > 0 || !r2BucketName || !r2PublicUrl) {
    const error = new Error(
      `R2 is not configured. Missing env vars: ${missing.join(", ")}`,
    );
    error.statusCode = 503;
    throw error;
  }
};

router.post("/upload", upload.single("video"), async (req, res) => {
  try {
    ensureR2Config();

    if (!req.file) {
      return res.status(400).json({ message: "No video file uploaded" });
    }

    const fileName = buildSafeFilename(req.file.originalname);
    const key = `videos/${Date.now()}-${fileName}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }),
    );

    return res.status(201).json({
      videoUrl: `${r2PublicUrl}/${key}`,
      key,
    });
  } catch (error) {
    console.error("Video upload error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to upload video",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      title,
      videoUrl,
      key,
      storeId,
      brandId,
      expireDate,
      like,
      views,
      shares,
    } =
      req.body;

    if (!title || !videoUrl) {
      return res
        .status(400)
        .json({ message: "title and videoUrl are required fields" });
    }

    const hasStore = Boolean(storeId);
    const hasBrand = Boolean(brandId);
    if (hasStore === hasBrand) {
      return res.status(400).json({
        message: "Please select exactly one owner: store OR brand.",
      });
    }

    const video = await Video.create({
      title,
      videoUrl,
      key,
      storeId: storeId || null,
      brandId: brandId || null,
      expireDate: expireDate ? new Date(expireDate) : null,
      like: Number.isFinite(Number(like)) ? Number(like) : 0,
      views: Number.isFinite(Number(views)) ? Number(views) : 0,
      shares: Number.isFinite(Number(shares)) ? Number(shares) : 0,
    });

    return res.status(201).json(video);
  } catch (error) {
    console.error("Create video metadata error:", error);
    return res.status(500).json({
      message: error.message || "Failed to save video metadata",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .populate("storeId", "name logo")
      .populate("brandId", "name logo");

    return res.json(videos);
  } catch (error) {
    console.error("Fetch videos error:", error);
    return res.status(500).json({ message: "Failed to fetch videos" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Best-effort object delete from R2 when we have a key and config.
    if (video.key && r2BucketName) {
      try {
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: r2BucketName,
            Key: video.key,
          }),
        );
      } catch (r2Error) {
        console.error("R2 delete warning:", r2Error.message);
      }
    }

    await video.deleteOne();
    return res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Delete video error:", error);
    return res.status(500).json({ message: "Failed to delete video" });
  }
});

const incrementCounter = (field) => async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { [field]: 1 } },
      { new: true },
    );

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    return res.json({
      _id: video._id,
      like: video.like,
      views: video.views,
      shares: video.shares,
    });
  } catch (error) {
    console.error(`Increment ${field} error:`, error);
    return res.status(500).json({ message: "Failed to update counter" });
  }
};

router.post("/:id/like", incrementCounter("like"));
router.post("/:id/view", incrementCounter("views"));
router.post("/:id/share", incrementCounter("shares"));

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Video size must be 20MB or less" });
  }
  if (error) {
    return res.status(400).json({ message: error.message || "Upload failed" });
  }
  return next();
});

module.exports = router;
