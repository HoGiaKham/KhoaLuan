import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/PracticePage.css";
import { useLocation } from "react-router-dom";

function ExamPage() {
  const { examId } = useParams();
  const location = useLocation();
  const initialAnswers = location.state?.answers || {};
  const initialTimeLeft = location.state?.timeLeft || 0;
  const navigate = useNavigate();
  const [examInfo, setExamInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(initialAnswers);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const QUESTIONS_PER_PAGE = 3;

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        const examRes = await axios.get(`http://localhost:5000/api/practice-exams/${examId}`);
        setExamInfo(examRes.data);
        setTimeLeft((examRes.data.duration || 60) * 60);

        const questionsRes = await axios.get(`http://localhost:5000/api/practice-exams/${examId}/questions`);
        setQuestions(questionsRes.data || []);
      } catch (err) {
        console.error("Lỗi khi tải đề thi:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExamDetails();
  }, [examId]);

  const toggleFlag = (questionId) => {
    setFlaggedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  useEffect(() => {
    if (!examInfo) return;
    let endTime = localStorage.getItem(`exam-${examId}-endTime`);
    if (!endTime) {
      endTime = Date.now() + (examInfo.duration || 60) * 60 * 1000;
      localStorage.setItem(`exam-${examId}-endTime`, endTime);
    } else {
      endTime = parseInt(endTime);
    }

    const updateTime = () => {
      const now = Date.now();
      const diff = Math.ceil((endTime - now) / 1000);
      if (diff <= 0) {
        setTimeLeft(0);
        handleConfirmSubmit();
      } else {
        setTimeLeft(diff);
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [examInfo]);

  const handleAnswerChange = (questionId, answerIndex) => {
    const newAnswers = { ...answers, [questionId]: answerIndex };
    setAnswers(newAnswers);
    localStorage.setItem(`exam-${examId}-answers`, JSON.stringify(newAnswers));
  };

  useEffect(() => {
    const savedAnswers = JSON.parse(localStorage.getItem(`exam-${examId}-answers`));
    if (savedAnswers) setAnswers(savedAnswers);
  }, [examId]);

  const handleQuestionClick = (index) => {
    const targetPage = Math.floor(index / QUESTIONS_PER_PAGE);
    setCurrentPage(targetPage);
    document.getElementById(`question-${index}`)?.scrollIntoView({ behavior: "smooth" });
  };

const handleSubmit = () => {
  navigate("/exam-summary", {
    state: { questions, answers, examId },
  });
};

  const handleGoBack = () => {
    setShowSummaryModal(false);
  };

  const handleConfirmSubmit = () => {
    setShowSummaryModal(false);
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = () => {
    const score = questions.reduce((acc, q) => {
      if (answers[q._id] === q.correctAnswer) acc += 1;
      return acc;
    }, 0);

    const attempt = {
      examId,
      score,
      total: questions.length,
      answers,
      date: new Date().toLocaleString(),
    };

    const history = JSON.parse(localStorage.getItem(`exam-${examId}-history`)) || [];
    history.push(attempt);
    localStorage.setItem(`exam-${examId}-history`, JSON.stringify(history));

    localStorage.removeItem(`exam-${examId}-answers`);
    localStorage.removeItem(`exam-${examId}-endTime`);

    navigate(`/exam-review/${examId}`);
  };

  const handleNextPage = () => {
    if ((currentPage + 1) * QUESTIONS_PER_PAGE < questions.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const currentQuestions = questions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE
  );

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading) return <p>Đang tải đề thi...</p>;
  if (!examInfo) return <p>Không tìm thấy đề thi!</p>;

  return (
    <div className="exam-container">
      <div className="sidebar">
        <h3>Danh sách câu hỏi</h3>
        <div className="question-list">
          {questions.map((q, i) => (
            <div
              key={q._id}
              className={`question-number ${
                answers[q._id] !== undefined ? "answered" : ""
              } ${flaggedQuestions.includes(q._id) ? "flagged" : ""}`}
              onClick={() => handleQuestionClick(i)}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <div onClick={() => navigate(-1)} style={{ cursor: "pointer", color: "blue" }}>
            ← Quay lại
          </div>
          <h2>{examInfo.title}</h2>
          <div className="timer">⏰ {formatTime(timeLeft)}</div>
        </div>

        {currentQuestions.map((question, index) => (
          <div
            key={question._id}
            className="question-item"
            id={`question-${currentPage * QUESTIONS_PER_PAGE + index}`}
          >
            <div className="question-item-header">
              <h3>
                {currentPage * QUESTIONS_PER_PAGE + index + 1}. {question.title}
              </h3>
              <button
                className={`flag-btn ${flaggedQuestions.includes(question._id) ? "flagged" : ""}`}
                onClick={() => toggleFlag(question._id)}
              >
                🚩{flaggedQuestions.includes(question._id) ? "" : ""}
              </button>
            </div>

            {question.options.map((option, optIndex) => (
              <div key={optIndex} className="option">
                <input
                  type="radio"
                  name={`question-${question._id}`}
                  checked={answers[question._id] === optIndex}
                  onChange={() => handleAnswerChange(question._id, optIndex)}
                />
                <label>{String.fromCharCode(65 + optIndex)}. {option}</label>
              </div>
            ))}
          </div>
        ))}

        <div className="bottom-buttons">
          <button
            onClick={handleNextPage}
            disabled={(currentPage + 1) * QUESTIONS_PER_PAGE >= questions.length}
          >
            Trang kế →
          </button>
          <button className="submit-btn" onClick={handleSubmit}>
            Nộp bài
          </button>
        </div>
      </div>

      {showSummaryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Danh sách câu trả lời đã lưu:</h3>
            {questions.map((q, i) => (
              <p key={q._id}>
                Câu {i + 1} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {answers[q._id] !== undefined ? "đã trả lời" : "chưa trả lời"}
              </p>
            ))}
            <div className="modal-buttons">
              <button onClick={handleGoBack}>Quay lại trang trước</button>
              <button onClick={handleConfirmSubmit}>Nộp bài</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Bạn xác nhận nộp bài?</h3>
            <div className="modal-buttons">
              <button onClick={() => setShowConfirmModal(false)}>Hủy</button>
              <button onClick={handleFinalSubmit}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamPage;