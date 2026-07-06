const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { uploadImage } = require("../utils/imageUpload");
const {
  getApps,
  getAppsByStore,
  getShowcaseStores,
  getAppById,
  createApp,
  updateApp,
  deleteApp,
} = require("../controllers/appController");

router.get("/showcase-stores", getShowcaseStores);
router.get("/store/:storeId", getAppsByStore);
router.get("/", getApps);
router.post("/", createApp);

router.post("/upload-logo", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const { url: imageUrl, urls } = await uploadImage(req.file, "apps");
    res.json({
      imageUrl,
      ...(urls ? { urls } : {}),
      filename: req.file.filename || "",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading file", error: error.message });
  }
});

router.get("/:id", getAppById);
router.put("/:id", updateApp);
router.delete("/:id", deleteApp);

module.exports = router;
