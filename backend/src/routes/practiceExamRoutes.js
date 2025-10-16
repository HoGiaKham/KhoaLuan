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

router.get("/:id/all-questions", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid exam ID" });
    }
    
    const exam = await PracticeExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }
    
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

// FIXED: Giữ đúng thứ tự trong exam.questions array
router.get("/:id/questions", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid exam ID" });
    }
    
    const exam = await PracticeExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }
    
    if (!exam.questions || exam.questions.length === 0) {
      return res.json([]);
    }
    
    // Lấy tất cả questions KHÔNG sort
    const questions = await Question.find({ 
      _id: { $in: exam.questions } 
    });
    
    // Tạo map để tra cứu nhanh
    const questionMap = {};
    questions.forEach(q => {
      questionMap[q._id.toString()] = q;
    });
    
    // Sắp xếp theo đúng thứ tự trong exam.questions
    const orderedQuestions = exam.questions
      .map(id => questionMap[id.toString()])
      .filter(Boolean);
    
    const questionsWithImage = orderedQuestions.map(q => ({
      ...q.toObject(),
      imageUrl: q.image ? `/uploads/${q.image}` : null
    }));
    
    res.json(questionsWithImage);
  } catch (err) {
    console.error("Error fetching exam questions:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/questions", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid exam ID" });
    }
    
    const exam = await PracticeExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }
    
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
    
    for (const qId of questionIds) {
      if (!mongoose.Types.ObjectId.isValid(qId)) {
        return res.status(400).json({ error: `Invalid question ID: ${qId}` });
      }
    }
    
    const questions = await Question.find({
      _id: { $in: questionIds },
      categoryId: { $in: exam.categories }
    });
    
    if (questions.length !== questionIds.length) {
      return res.status(400).json({ 
        error: "Some questions not found or don't belong to exam categories" 
      });
    }
    
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

router.post("/:id/shuffle", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid exam ID" });
    }
    
    const exam = await PracticeExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    if (!exam.questions || exam.questions.length === 0) {
      return res.status(400).json({ error: "Exam has no questions to shuffle" });
    }

    // Xáo trộn thứ tự câu hỏi
    const shuffledQuestionIds = [...exam.questions];
    for (let i = shuffledQuestionIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQuestionIds[i], shuffledQuestionIds[j]] = [shuffledQuestionIds[j], shuffledQuestionIds[i]];
    }
    
    exam.questions = shuffledQuestionIds;
    await exam.save();

    // Xáo trộn đáp án của từng câu hỏi
    const questions = await Question.find({ 
      _id: { $in: exam.questions } 
    });

    for (const question of questions) {
      const oldOptions = [...question.options];
      const oldCorrectAnswer = question.correctAnswer;
      
      const indices = oldOptions.map((_, idx) => idx);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      question.options = indices.map(idx => oldOptions[idx]);
      question.correctAnswer = indices.indexOf(oldCorrectAnswer);
      
      await question.save();
    }

    res.json({ 
      message: "Shuffled questions and answers successfully",
      count: questions.length 
    });
  } catch (err) {
    console.error("Error shuffling exam:", err);
    res.status(500).json({ error: err.message });
  }
});

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
      questions: [],
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

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid exam ID" });
    }

    const exam = await PracticeExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

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

    const updateData = {
      title: req.body.title.trim(),
      subject: new mongoose.Types.ObjectId(req.body.subject),
      categories: req.body.categories.map(id => new mongoose.Types.ObjectId(id)),
      duration: parseInt(req.body.duration) || 60,
      attempts: parseInt(req.body.attempts) || 1,
      scorePerQuestion: parseFloat(req.body.scorePerQuestion) || 1,
    };

    if (req.body.openTime && req.body.openTime.trim()) {
      updateData.openTime = new Date(req.body.openTime);
    } else {
      updateData.openTime = null;
    }
    
    if (req.body.closeTime && req.body.closeTime.trim()) {
      updateData.closeTime = new Date(req.body.closeTime);
    } else {
      updateData.closeTime = null;
    }

    const updatedExam = await PracticeExam.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('subject', 'name')
    .populate('categories', 'name');

    res.json(updatedExam);
  } catch (err) {
    console.error("Error updating practice exam:", err);
    
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

module.exports = router;