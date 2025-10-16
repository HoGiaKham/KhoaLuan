const mongoose = require("mongoose");

const practiceExamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  categories: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Category" }
  ],
  questions: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Question" }
  ],
  duration: Number,
  openTime: Date,
  closeTime: Date,
  attempts: Number,
  scorePerQuestion: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PracticeExam", practiceExamSchema);