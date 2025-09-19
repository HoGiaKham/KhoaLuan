const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");

// GET /api/subjects  -> list all subjects
router.get("/", async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
