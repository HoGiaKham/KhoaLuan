const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const path = require("path");

// load env
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // body parser

// serve static folder uploads (cho FE lấy ảnh)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// connect database
connectDB();

// routes
app.use("/api/subjects", require("./src/routes/subjectRoutes"));
app.use("/api/categories", require("./src/routes/categoryRoutes"));
app.use("/api/questions", require("./src/routes/questionRoutes"));
app.use("/api/practice-exams", require("./src/routes/practiceExamRoutes"));

// ✅ test route để check server sống
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error handler (optional, giúp debug tốt hơn)
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);
  res.status(500).json({ message: "Server error", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
