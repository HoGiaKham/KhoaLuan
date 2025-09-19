const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const multer = require("multer");
const XLSX = require("xlsx");
const fs = require("fs");

// Cấu hình multer để upload file tạm thời
const upload = multer({ dest: "uploads/" }); // Tạo thư mục uploads nếu chưa có

// GET /api/questions/:categoryId -> questions for category
router.get("/:categoryId", async (req, res) => {
  try {
    const questions = await Question.find({ categoryId: req.params.categoryId }).sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/questions/:categoryId -> add question to category
router.post("/:categoryId", async (req, res) => {
  try {
    const question = new Question({
      title: req.body.title,
      options: req.body.options,
      correctAnswer: req.body.correctAnswer,
      categoryId: req.params.categoryId
    });
    const saved = await question.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/questions/:id
router.put("/:id", async (req, res) => {
  try {
    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        options: req.body.options,
        correctAnswer: req.body.correctAnswer
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Question not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/questions/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Question not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/questions/:categoryId/import -> import from Excel
router.post("/:categoryId/import", upload.single("excelFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file Excel." });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const importedCount = 0;
    const errors = [];

    // Bỏ qua dòng header (dòng 0)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || !row[0]) continue; // Bỏ qua dòng trống

      const title = row[0]?.toString().trim();
      const optionA = row[1]?.toString().trim() || "";
      const optionB = row[2]?.toString().trim() || "";
      const optionC = row[3]?.toString().trim() || "";
      const optionD = row[4]?.toString().trim() || "";
      const correctIndex = parseInt(row[5]);

      if (!title) {
        errors.push(`Dòng ${i + 1}: Thiếu tiêu đề câu hỏi.`);
        continue;
      }

      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        errors.push(`Dòng ${i + 1}: Đáp án đúng không hợp lệ (phải là 0-3).`);
        continue;
      }

      const options = [optionA, optionB, optionC, optionD].filter(opt => opt);

      const question = new Question({
        title,
        options,
        correctAnswer: correctIndex,
        categoryId: req.params.categoryId
      });

      await question.save();
      importedCount++;
    }

    // Xóa file tạm thời
    fs.unlinkSync(req.file.path);

    res.json({
      message: `Import thành công ${importedCount} câu hỏi.`,
      errors: errors.length > 0 ? errors : null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;