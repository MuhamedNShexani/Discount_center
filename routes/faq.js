const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getFaqs,
  getFaqsAdmin,
  createFaq,
  updateFaq,
  deleteFaq,
  seedDefaultFaqs,
} = require("../controllers/faqController");

router.get("/", getFaqs);
router.get("/admin", protect, getFaqsAdmin);
router.post("/seed-defaults", protect, seedDefaultFaqs);
router.post("/", protect, createFaq);
router.put("/:id", protect, updateFaq);
router.delete("/:id", protect, deleteFaq);

module.exports = router;
