const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true }
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);