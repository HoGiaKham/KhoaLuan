const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const path = require("path");


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json()); 

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

app.use("/api/subjects", require("./src/routes/subjectRoutes"));
app.use("/api/categories", require("./src/routes/categoryRoutes"));
app.use("/api/questions", require("./src/routes/questionRoutes"));
app.use("/api/practice-exams", require("./src/routes/practiceExamRoutes"));
app.use("/api", require("./src/routes/authRoutes"));
app.use("/api/classes", require("./src/routes/classRoutes"));

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);
  res.status(500).json({ message: "Server error", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
