const Job = require("../models/Job");

const isAdminUser = (user) => {
  if (!user) return false;
  const adminEmails = ["mshexani45@gmail.com", "admin@gmail.com"];
  return adminEmails.includes(user.email);
};

// @desc    Get jobs (public)
// @route   GET /api/jobs?storeTypeId=...&q=...
// @access  Public
const getJobs = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const storeTypeId = String(req.query.storeTypeId || "").trim();

    const now = new Date();
    const filter = {
      active: { $ne: false },
      $or: [{ expireDate: null }, { expireDate: { $gte: now } }],
    };
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$and = [
        {
          $or: [
            { title: { $regex: escaped, $options: "i" } },
            { description: { $regex: escaped, $options: "i" } },
          ],
        },
      ];
    }

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: "storeId",
        select: "name logo storeTypeId",
        populate: { path: "storeTypeId", select: "name icon" },
      })
      .populate({ path: "brandId", select: "name logo brandTypeId" })
      .lean();

    // storeType filter is applied only to store-owned jobs (brand jobs bypass)
    const filtered =
      storeTypeId && storeTypeId !== "all"
        ? jobs.filter((j) => {
            if (!j.storeId) return true;
            const st = j.storeId.storeTypeId;
            const stId = st && (st._id || st);
            return String(stId) === String(storeTypeId);
          })
        : jobs;

    res.json(filtered);
  } catch (err) {
    console.error("Get jobs error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Create job (admin)
// @route   POST /api/jobs
// @access  Private/Admin
const createJob = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    const job = await Job.create({
      title: req.body?.title,
      description: req.body?.description,
      gender: req.body?.gender,
      image: req.body?.image || "",
      storeId: req.body?.storeId || null,
      brandId: req.body?.brandId || null,
      expireDate: req.body?.expireDate || null,
      active: req.body?.active !== undefined ? Boolean(req.body.active) : true,
    });
    const populated = await Job.findById(job._id)
      .populate({
        path: "storeId",
        select: "name logo storeTypeId",
        populate: { path: "storeTypeId", select: "name icon" },
      })
      .populate({ path: "brandId", select: "name logo brandTypeId" })
      .lean();
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message || "Invalid job" });
  }
};

// @desc    Update job (admin)
// @route   PUT /api/jobs/:id
// @access  Private/Admin
const updateJob = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const fields = ["title", "description", "gender", "image", "storeId", "brandId", "expireDate", "active"];
    for (const f of fields) {
      if (req.body?.[f] !== undefined) job[f] = req.body[f];
    }
    await job.save();
    const populated = await Job.findById(job._id)
      .populate({
        path: "storeId",
        select: "name logo storeTypeId",
        populate: { path: "storeTypeId", select: "name icon" },
      })
      .populate({ path: "brandId", select: "name logo brandTypeId" })
      .lean();
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message || "Invalid job" });
  }
};

// @desc    Delete job (admin)
// @route   DELETE /api/jobs/:id
// @access  Private/Admin
const deleteJob = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getJobs, createJob, updateJob, deleteJob };

