import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CategoryPage from "./components/CategoryPage";
import QuestionPage from "./components/QuestionPage";
import PracticeExamPage from "./components/PracticeExamPage";
import PracticeExamDetailPage from "./components/PracticeExamDetailPage";
import Login from "./components/Login";
import StudentPage from "./components/student/StudentPage.js";
import StudentExamsPage from "./components/student/StudentExamsPage.js";
import PracticePage from "./components/student/PracticePage.js";
import PractiecSummary from "./components/student/PractiecSummary.js";
import PracticeReview from "./components/student/PracticeReview.js";
function App() {  
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedCategoryInfo, setSelectedCategoryInfo] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);

  useEffect(() => {
    localStorage.removeItem("app_user"); // Comment để giữ user khi reload
    const storedUser = localStorage.getItem("app_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userObj) => {
    setUser(userObj);
    localStorage.setItem("app_user", JSON.stringify(userObj));
    if (userObj.role === "teacher") navigate("/dashboard");
    else navigate("/student");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("app_user");
    navigate("/login");
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar user={user} onLogout={handleLogout} />
      <div
        className="main-content"
        style={{ flex: 1, padding: "20px", marginLeft: "240px" }}
      >
        <Routes>
          <Route
            path="/dashboard"
            element={
              user.role === "teacher" ? (
                <Dashboard />
              ) : (
                <Navigate to="/student" />
              )
            }
          />
          <Route
            path="/categories"
            element={
              user.role === "teacher" ? (
                <CategoryPage
                  onSelectCategory={(categoryInfo) => {
                    setSelectedCategoryInfo(categoryInfo);
                    navigate("/questions");
                  }}
                />
              ) : (
                <Navigate to="/student" />
              )
            }
          />
          <Route
            path="/questions"
            element={
              selectedCategoryInfo ? (
                <QuestionPage
                  categoryId={selectedCategoryInfo.categoryId}
                  categoryName={selectedCategoryInfo.categoryName}
                  subjectName={selectedCategoryInfo.subjectName}
                />
              ) : (
                <Navigate to="/categories" />
              )
            }
          />
          <Route path="/practice-exam" element={<PracticeExamPage />} />
         
          <Route
            path="/practice-exam-detail/:examId"
            element={<PracticeExamDetailPage />}
          />
          <Route
            path="/student"
            element={<StudentPage studentUsername={user.username} />}
          />
          <Route
            path="/myExams"
            element={<StudentExamsPage studentUsername={user.username} />}
          />
          <Route path="/exam/:examId" element={<PracticePage />} />
          <Route path="/exam-summary" element={<PractiecSummary />} />
          <Route path="/exam-review/:examId" element={<PracticeReview/>} />
          <Route
            path="*"
            element={
              user.role === "teacher" ? (
                <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/student" />
              )
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;