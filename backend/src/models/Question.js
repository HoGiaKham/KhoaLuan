const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    image: { type: String },
    difficulty: { 
      type: String, 
      enum: ["Dễ", "Trung bình", "Khó", "Rất khó"],
      default: "Trung bình"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Question", questionSchema);
