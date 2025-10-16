import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/PracticeReview.css";

const ExamReview = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

    const [history, setHistory] = useState([]);
    const [selectedAttempt, setSelectedAttempt] = useState(null);
    
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/practice-exams/${examId}/questions`
        );
        setQuestions(res.data || []);
      } catch (err) {
        console.error("Lỗi khi tải câu hỏi:", err);
      } finally {
        setLoading(false);
      }
    };
    const storedHistory = JSON.parse(localStorage.getItem(`exam-${examId}-history`)) || [];
    setHistory(storedHistory);
    if(storedHistory.length > 0) {
      setSelectedAttempt(storedHistory[storedHistory.length - 1]);
    }
    fetchQuestions();
  }, [examId]);

  if (loading) return <p className="loading-text">Đang tải kết quả...</p>;
  if (!selectedAttempt) 
    return <p className="no-result">Chưa có kết quả</p>
  const { score, total, answers, date } = selectedAttempt;
  const onClickBack = () => {
    navigate(-1);
  }
  
  return (
    <div className="review-container">
      <div className="header">  
        <div onClick={onClickBack} style={{cursor:"pointer", color:"blue"}}>
          ← Quay lại
        </div>
        <h2>Kết quả làm bài</h2>
      </div>

      {history.length > 1 && (
        <div className="history-selector">
          <label>Chọn lần làm:</label>
          <select
            value={history.indexOf(selectedAttempt)}
            onChange={(e) => setSelectedAttempt(history[e.target.value])}
          >
            {history.map((attempt, index) => (
              <option key={index} value={index}>
                Lần {index + 1}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="score-box">
        <div className="score-row">
          
          <p>
            <strong>Số câu làm đúng:</strong> {score}/{total}
          </p>



          <p>
            <strong>Ngày làm:</strong> {date}
          </p>
        </div>
      </div>




      <div className="questions-list">
        {questions.map((q, i) => {
          const userAnswer = answers[q._id];
          const isCorrect = userAnswer === q.correctAnswer;
          const isAnswered = userAnswer !== undefined;

          return (
            <div key={q._id} className="question-box">
              <h3 className="question-title">
                Câu {i + 1}: {q.title}
              </h3>

              <div className="options">
                {q.options.map((option, optIndex) => {
                  let optionClass = "option";
                  if (optIndex === q.correctAnswer) optionClass += " correct";
                  if (optIndex === userAnswer && !isCorrect)
                    optionClass += " incorrect";
                  if (optIndex === userAnswer && isCorrect)
                    optionClass += " correct";
                  return (
                    <div key={optIndex} className={optionClass}>
                      {String.fromCharCode(65 + optIndex)}. {option}
                    </div>
                  );
                })}
              </div>

              <div
                className={`status-text ${
                  !isAnswered
                    ? "not-answered"
                    : isCorrect
                    ? "correct"
                    : "incorrect"
                }`}
              >
                {!isAnswered
                  ? `Chưa trả lời - Đáp án đúng : ${String.fromCharCode(65 + q.correctAnswer)}`
                  : isCorrect
                  ? "✔ Đúng"
                  : `✖ Sai — Đáp án đúng: ${String.fromCharCode(
                      65 + q.correctAnswer
                    )}`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="review-buttons">
        <button onClick={() => navigate("/myExams")}>Quay lại danh sách đề</button>
      </div>
    </div>
  );
};

export default ExamReview;
