const express = require("express");
const router = express.Router();
const Class = require("../models/Class");
const User = require("../models/User");
const PracticeExam = require("../models/PracticeExam");

// 📌 Tạo lớp mới
router.post("/", async (req, res) => {
  try {
    const { name, teacherId } = req.body;
    const newClass = await Class.create({ name, teacher: teacherId });
    res.json(newClass);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo lớp", error: error.message });
  }
});

// 📌 Lấy danh sách tất cả lớp
router.get("/", async (req, res) => {
  try {
    const classes = await Class.find().populate("teacher", "name username");
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách lớp" });
  }
});

// 📌 Thêm sinh viên vào lớp
router.post("/:classId/add-student", async (req, res) => {
  try {
    const { studentId } = req.body;
    const classItem = await Class.findById(req.params.classId);
    if (!classItem) return res.status(404).json({ message: "Không tìm thấy lớp" });

    if (!classItem.students.includes(studentId)) {
      classItem.students.push(studentId);
      await classItem.save();
    }

    res.json({ message: "Đã thêm sinh viên vào lớp", classItem });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm sinh viên", error: error.message });
  }
});

// 📌 Gán đề luyện tập cho lớp
router.post("/:classId/add-exam", async (req, res) => {
  try {
    const { examId } = req.body;
    const classItem = await Class.findById(req.params.classId);
    if (!classItem) return res.status(404).json({ message: "Không tìm thấy lớp" });

    if (!classItem.exams.includes(examId)) {
      classItem.exams.push(examId);
      await classItem.save();
    }

    res.json({ message: "Đã gán đề cho lớp", classItem });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi gán đề", error: error.message });
  }
});

// 📌 Lấy danh sách đề cho sinh viên (dựa theo lớp của họ)
router.get("/student/:studentId/exams", async (req, res) => {
  try {
    const classes = await Class.find({ students: req.params.studentId })
      .populate("exams", "title subject")
      .populate("teacher", "name");
    const exams = classes.flatMap(c => c.exams);
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách đề cho sinh viên" });
  }
});

module.exports = router;
