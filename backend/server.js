// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");

// load env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // body parser

// connect database
connectDB();

// routes
app.use("/api/subjects", require("./src/routes/subjectRoutes"));
app.use("/api/categories", require("./src/routes/categoryRoutes"));
app.use("/api/questions", require("./src/routes/questionRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
