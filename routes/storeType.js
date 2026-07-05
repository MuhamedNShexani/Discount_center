const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { uploadImage } = require("../utils/imageUpload");
const StoreType = require("../models/StoreType");
const {
  getStoreTypes,
  createStoreType,
  updateStoreType,
  deleteStoreType,
} = require("../controllers/storeTypeController");

// @route   GET /api/store-types
// @desc    Get all store types
router.get("/", getStoreTypes);
router.post("/", createStoreType);
router.put("/:id", updateStoreType);
router.delete("/:id", deleteStoreType);

// POST /api/store-types/:id/picture
router.post("/:id/picture", upload.single("image"), async (req, res) => {
  try {
    const storeType = await StoreType.findById(req.params.id);
    if (!storeType) return res.status(404).json({ msg: "Not found" });

    if (!req.file) {
      return res.status(400).json({
        msg: "No file uploaded",
        hint: "Ensure the request is multipart/form-data with a field named 'image'",
      });
    }

    const { url: pictureUrl } = await uploadImage(req.file, "store-types");
    storeType.picture = pictureUrl;
    await storeType.save();

    const updated = await StoreType.findById(req.params.id);
    return res.json({ success: true, url: pictureUrl, storeType: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;
