const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const multer = require("multer");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// ================= MULTER CONFIG =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|xlsx|xls/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb("Chỉ cho phép file ảnh (.jpg, .png, .gif) hoặc Excel (.xlsx, .xls)!");
  }
};

const upload = multer({ storage, fileFilter });

// =================================================

// GET tất cả question theo categoryId
router.get("/:categoryId", async (req, res) => {
  try {
    let questions = await Question.find({ categoryId: req.params.categoryId }).sort({ createdAt: 1 });

    questions = questions.map(q => ({
      ...q.toObject(),
      imageUrl: q.image ? `/uploads/${q.image}` : null
    }));
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - thêm question
router.post("/:categoryId", upload.single("image"), async (req, res) => {
  try {
    let options = req.body.options;
    if (typeof options === "string") {
      try {
        options = JSON.parse(options);
      } catch {
        options = [options]; // fallback
      }
    }

    const question = new Question({
      title: req.body.title,
      options,
      correctAnswer: req.body.correctAnswer,
      categoryId: req.params.categoryId,
      image: req.file ? req.file.filename : null,
      difficulty: req.body.difficulty || "Trung bình"
    });

    const saved = await question.save();
    res.status(201).json({
      ...saved.toObject(),
      imageUrl: saved.image ? `/uploads/${saved.image}` : null
    });
  } catch (err) {
    console.error("Error adding question:", err);
    res.status(400).json({ message: err.message });
  }
});

// PUT - cập nhật question
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    let options = req.body.options;
    if (typeof options === "string") {
      try {
        options = JSON.parse(options);
      } catch {
        options = [options];
      }
    }

    const updateData = {
      title: req.body.title,
      options,
      correctAnswer: req.body.correctAnswer,
      difficulty: req.body.difficulty
    };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updated = await Question.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: "Question not found" });

    res.json({
      ...updated.toObject(),
      imageUrl: updated.image ? `/uploads/${updated.image}` : null
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE question
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Question not found" });

    // Xóa file ảnh nếu có
    if (deleted.image) {
      const imgPath = path.join(__dirname, "../uploads/", deleted.image);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Import từ Excel
router.post("/:categoryId/import", upload.single("excelFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file Excel." });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let importedCount = 0;
    const errors = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || !row[0]) continue;

      const title = row[0]?.toString().trim();
      const optionA = row[1]?.toString().trim() || "";
      const optionB = row[2]?.toString().trim() || "";
      const optionC = row[3]?.toString().trim() || "";
      const optionD = row[4]?.toString().trim() || "";
      const correctIndex = parseInt(row[5]);
      const difficulty = row[6]?.toString().trim() || "Trung bình";

      if (!title) {
        errors.push(`Dòng ${i + 1}: Thiếu tiêu đề câu hỏi.`);
        continue;
      }

      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        errors.push(`Dòng ${i + 1}: Đáp án đúng không hợp lệ (0-3).`);
        continue;
      }

      const validDifficulties = ["Dễ", "Trung bình", "Khó", "Rất khó"];
      const finalDifficulty = validDifficulties.includes(difficulty) ? difficulty : "Trung bình";

      const options = [optionA, optionB, optionC, optionD].filter(opt => opt);

      const question = new Question({
        title,
        options,
        correctAnswer: correctIndex,
        categoryId: req.params.categoryId,
        difficulty: finalDifficulty
      });

      await question.save();
      importedCount++;
    }

    fs.unlinkSync(req.file.path);

    res.json({
      message: `Import thành công ${importedCount} câu hỏi.`,
      imported: importedCount,
      errors: errors.length > 0 ? errors : null
    });
  } catch (err) {
    console.error("Import error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
