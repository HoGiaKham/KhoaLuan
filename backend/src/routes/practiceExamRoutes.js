const express = require("express");
const router = express.Router();
const PracticeExam = require("../models/PracticeExam");
const Question = require("../models/Question");
const mongoose = require("mongoose");

router.get("/", async (req, res) => {
  try {
    const exams = await PracticeExam.find()
      .populate('subject', 'name')
      .populate('categories', 'name');
    res.json(exams);
  } catch (err) {
    console.error("Error fetching practice exams:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get single exam by ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid exam ID" });
    }
    
    const exam = await PracticeExam.findById(req.params.id)
      .populate('subject', 'name')
      .populate('categories', 'name');
    
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }
    
    res.json(exam);
  } catch (err) {
    console.error("Error fetching exam:", err);
    res.status(500).json({ error: err.message });
  }
});

// MỚI: Get ALL questions available from exam's categories (for question bank)
router.get("/:id/all-questions", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid exam ID" });
    }
    
    const exam = await PracticeExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }
    
    // Get ALL questions from exam's categories (for selection)
    const questions = await Question.find({ 
      categoryId: { $in: exam.categories } 
    }).sort({ createdAt: 1 });
    
    const questionsWithImage = questions.map(q => ({
      ...q.toObject(),
      imageUrl: q.image ? `/uploads/${q.image}` : null
    }));
    
    res.json(questionsWithImage);
  } catch (err) {
    console.error("Error fetching all questions:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get SELECTED questions for this exam only
router.get("/:id/questions", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid exam ID" });
    }
    
    const exam = await PracticeExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }
    
    // Only return questions that are in exam.questions array
    if (!exam.questions || exam.questions.length === 0) {
      return res.json([]);
    }
    
    const questions = await Question.find({ 
      _id: { $in: exam.questions } 
    }).sort({ createdAt: 1 });
    
    const questionsWithImage = questions.map(q => ({
      ...q.toObject(),
      imageUrl: q.image ? `/uploads/${q.image}` : null
    }));
    
    res.json(questionsWithImage);
  } catch (err) {
    console.error("Error fetching exam questions:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add a single question to exam (create new question AND add to exam)
router.post("/:id/questions", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid exam ID" });
    }
    
    const exam = await PracticeExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }
    
    // Create new question - use first category or provided categoryId
    const categoryId = req.body.categoryId || exam.categories[0];
    
    const questionData = {
      title: req.body.title,
      options: req.body.options,
      correctAnswer: req.body.correctAnswer,
      difficulty: req.body.difficulty || "Trung bình",
      categoryId: categoryId
    };
    
    const newQuestion = new Question(questionData);
    await newQuestion.save();
    
    // Add question to exam's questions array
    exam.questions.push(newQuestion._id);
    await exam.save();
    
    const savedQuestion = {
      ...newQuestion.toObject(),
      imageUrl: newQuestion.image ? `/uploads/${newQuestion.image}` : null
    };
    
    res.status(201).json(savedQuestion);
  } catch (err) {
    console.error("Error creating question:", err);
    res.status(400).json({ error: err.message });
  }
});

// Add multiple questions from bank (bulk add)
router.post("/:id/questions/bulk", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid exam ID" });
    }
    
    const exam = await PracticeExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }
    
    const { questionIds } = req.body;
    
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: "questionIds must be a non-empty array" });
    }
    
    // Validate all question IDs
    for (const qId of questionIds) {
      if (!mongoose.Types.ObjectId.isValid(qId)) {
        return res.status(400).json({ error: `Invalid question ID: ${qId}` });
      }
    }
    
    // Check if questions exist and belong to exam's categories
    const questions = await Question.find({
      _id: { $in: questionIds },
      categoryId: { $in: exam.categories }
    });
    
    if (questions.length !== questionIds.length) {
      return res.status(400).json({ 
        error: "Some questions not found or don't belong to exam categories" 
      });
    }
    
    // Add questions to exam (avoid duplicates)
    const existingQuestionIds = exam.questions.map(q => q.toString());
    const newQuestionIds = questionIds.filter(qId => !existingQuestionIds.includes(qId));
    
    exam.questions.push(...newQuestionIds);
    await exam.save();
    
    res.status(200).json({ 
      message: `Added ${newQuestionIds.length} questions to exam`,
      count: newQuestionIds.length 
    });
  } catch (err) {
    console.error("Error adding bulk questions:", err);
    res.status(400).json({ error: err.message });
  }
});

// Remove a question from exam (không xóa question khỏi DB)
router.delete("/:id/questions/:questionId", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid exam ID" });
    }
    
    if (!mongoose.Types.ObjectId.isValid(req.params.questionId)) {
      return res.status(400).json({ error: "Invalid question ID" });
    }
    
    const exam = await PracticeExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }
    
    // Remove question from exam's questions array
    exam.questions = exam.questions.filter(
      qId => qId.toString() !== req.params.questionId
    );
    
    await exam.save();
    
    res.json({ message: "Question removed from exam successfully" });
  } catch (err) {
    console.error("Error removing question from exam:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    console.log("Received data:", req.body);
    
    if (!req.body.title || !req.body.subject || !req.body.categories) {
      return res.status(400).json({ 
        error: "Missing required fields: title, subject, categories" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.body.subject)) {
      return res.status(400).json({ error: "Invalid subject ID" });
    }
    
    if (!Array.isArray(req.body.categories) || req.body.categories.length === 0) {
      return res.status(400).json({ error: "Categories must be a non-empty array" });
    }

    for (const catId of req.body.categories) {
      if (!mongoose.Types.ObjectId.isValid(catId)) {
        return res.status(400).json({ error: `Invalid category ID: ${catId}` });
      }
    }

    const examData = {
      title: req.body.title.trim(),
      subject: new mongoose.Types.ObjectId(req.body.subject),
      categories: req.body.categories.map(id => new mongoose.Types.ObjectId(id)),
      questions: [], // Initialize empty questions array
      duration: parseInt(req.body.duration) || 60,
      attempts: parseInt(req.body.attempts) || 1,
      scorePerQuestion: parseFloat(req.body.scorePerQuestion) || 1,
    };

    if (req.body.openTime && req.body.openTime.trim()) {
      examData.openTime = new Date(req.body.openTime);
    }
    
    if (req.body.closeTime && req.body.closeTime.trim()) {
      examData.closeTime = new Date(req.body.closeTime);
    }

    console.log("Processed exam data:", examData); 

    const newExam = new PracticeExam(examData);
    await newExam.save();
    
    const populatedExam = await PracticeExam.findById(newExam._id)
      .populate('subject', 'name')
      .populate('categories', 'name');
    
    res.status(201).json(populatedExam);
  } catch (err) {
    console.error("Error creating practice exam:", err);
    
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationErrors 
      });
    }
    
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid exam ID" });
    }
    
    const deletedExam = await PracticeExam.findByIdAndDelete(req.params.id);
    if (!deletedExam) {
      return res.status(404).json({ error: "Exam not found" });
    }
    
    res.json({ message: "Exam deleted successfully" });
  } catch (err) {
    console.error("Error deleting practice exam:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;