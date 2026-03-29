const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { protect, optionalAuth } = require("../middleware/auth");
const { getJobs, createJob, updateJob, deleteJob } = require("../controllers/jobController");
const { uploadImage } = require("../utils/imageUpload");

// Public list (optional auth: admins see expired + inactive for data entry)
router.get("/", optionalAuth, getJobs);

// Admin CRUD
router.post("/", protect, createJob);
router.put("/:id", protect, updateJob);
router.delete("/:id", protect, deleteJob);

// Image upload (admin)
router.post("/upload-image", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const { url: fileUrl } = await uploadImage(req.file, "jobs");
    res.json({ message: "File uploaded successfully", url: fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Error uploading file" });
  }
});

module.exports = router;

