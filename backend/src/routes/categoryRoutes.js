const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const Question = require("../models/Question");

// GET /api/categories/:subjectId -> get all categories for subject
router.get("/:subjectId", async (req, res) => {
  try {
    const categories = await Category.find({ subjectId: req.params.subjectId }).sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/categories/:subjectId -> add new category to subject
router.post("/:subjectId", async (req, res) => {
  try {
    const category = new Category({
      name: req.body.name,
      description: req.body.description, // Lưu mô tả
      subjectId: req.params.subjectId
    });
    const saved = await category.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/categories/:id -> update category name and description
router.put("/:id", async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name, description: req.body.description },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Category not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/categories/:id -> delete category
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