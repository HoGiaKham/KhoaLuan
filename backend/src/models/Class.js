const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  exams: [{ type: mongoose.Schema.Types.ObjectId, ref: "PracticeExam" }], 
});

module.exports = mongoose.model("Class", classSchema);
