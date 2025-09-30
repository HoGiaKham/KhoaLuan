import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CategoryPage from "./components/CategoryPage";
import QuestionPage from "./components/QuestionPage";
import PracticeExamPage from "./components/PracticeExamPage";
import PracticeExamDetailPage from "./components/PracticeExamDetailPage";
function App() {
  const [page, setPage] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar setPage={setPage} />

      <div style={{ flex: 1, padding: "20px" }}>
        {page === "home" && <Dashboard />}
        {page === "categories" && (
          <CategoryPage
            onSelectCategory={(categoryId) => {
              setSelectedCategory(categoryId);
              setPage("questions");
            }}
          />
        )}
        {page === "questions" && selectedCategory && (
          <QuestionPage categoryId={selectedCategory} setPage={setPage} />
        )}
        {page === "practiceExam" && (
          <PracticeExamPage
            setPage={setPage}
            setSelectedExamId={setSelectedExamId}
          />
        )}
        {page === "practiceExamDetail" && selectedExamId && (
        <PracticeExamDetailPage
          examId={selectedExamId}
          setPage={setPage}
        />
        )}

      </div>
    </div>
  );
}

export default App;