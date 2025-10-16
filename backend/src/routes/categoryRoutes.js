const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const Question = require("../models/Question");
const upload = require("../config/multer");

// --- Route upload ảnh ---
router.post("/upload", upload.single("image"), (req, res) => {
  try {
    res.json({
      message: "Upload thành công",
      imageUrl: `/uploads/${req.file.filename}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== QUAN TRỌNG: Route cụ thể phải đặt TRƯỚC route chung =====
// GET all questions by categoryId
router.get("/:categoryId/questions", async (req, res) => {
  try {
    const questions = await Question.find({ categoryId: req.params.categoryId })
      .sort({ createdAt: 1 });
    
    const questionsWithImage = questions.map(q => ({
      ...q.toObject(),
      imageUrl: q.image ? `/uploads/${q.image}` : null
    }));
    
    res.json(questionsWithImage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET categories by subjectId (route chung phải đặt SAU)
router.get("/:subjectId", async (req, res) => {
  try {
    const categories = await Category.find({ subjectId: req.params.subjectId }).sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new category
router.post("/:subjectId", async (req, res) => {
  try {
    const category = new Category({
      name: req.body.name,
      description: req.body.description,
      subjectId: req.params.subjectId,
      image: req.body.image
    });
    const saved = await category.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update category
router.put("/:id", async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name, description: req.body.description, image: req.body.image },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Category not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE category
router.delete("/:id", async (req, res) => {
  try {
    const questions = await Question.find({ categoryId: req.params.id });
    if (questions.length > 0) {
      return res.status(400).json({ message: "Không thể xóa danh mục vì vẫn còn câu hỏi liên quan." });
    }
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;