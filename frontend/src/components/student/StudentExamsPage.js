import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/StudentExamsPage.css";

function StudentExamsPage({ studentUsername }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/practice-exams");
        setExams(res.data);
      } catch (err) {
        console.error("Lỗi khi tải danh sách đề:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const getExamStatus = (exam) => {
    const now = new Date();
    const openTime = exam.openTime ? new Date(exam.openTime) : null;
    const closeTime = exam.closeTime ? new Date(exam.closeTime) : null;

    if (!openTime) return { text: "Chưa đặt lịch", color: "#999" };
    if (now < openTime) return { text: "Chưa mở", color: "#f39c12" };
    if (closeTime && now > closeTime) {

      return { text: "Đã đóng", color: "#c0392b" };
    }
    return { text: "Đang mở", color: "#27ae60" };
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Chưa đặt";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartExam = (exam) => {
    const status = getExamStatus(exam);
    if (status.text === "Đang mở") {
      navigate(`/exam/${exam._id}`);
    } else {
      alert("Đề này chưa mở hoặc đã đóng!");
    }
  };

  const handleViewReview = (examId) => {
    navigate(`/exam-review/${examId}`);
  };

  const getAttemptCount = (examId) => {
    const history = JSON.parse(localStorage.getItem(`exam-${examId}-history`)) || [];
    return history.length;
    // if (history.length === 0) return "Chưa làm";
    // const last = history[history.length - 1];
    // return `Lần gần nhất: ${last.score}/${last.total} điểm (${last.date})`;
  };

  const hasHistory = (examId) => {
    const history = JSON.parse(localStorage.getItem(`exam-${examId}-history`)) || [];
    return history.length > 0;
  };

  return (
    <div className="student-exams-page">
      <h2>Bài luyện tập của tôi</h2>

      {loading ? (
        <p className="loading-text">Đang tải danh sách đề...</p>
      ) : exams.length === 0 ? (
        <p>Chưa có đề luyện tập nào.</p>
      ) : (
        <ul className="exam-list">
          {exams.filter((exam) => {
            const now = new Date();
            let closeTime;
            if(exam.closeTime){
              closeTime = new Date(exam.closeTime);
            }else{
              return null;
            }

            return !closeTime || now <= closeTime;
          })
                                
          .map((exam) => {
            const status = getExamStatus(exam);
            const isOpen = status.text === "Đang mở";
            return (
              <li key={exam._id} className="exam-item">
                <div className="exam-info">
                  <strong>{exam.title}</strong>
                  <div className="subject">
                    Môn học: {exam.subject?.name || "N/A"}
                  </div>
                  <div className="exam-meta">
                    <span
                      className={`status status-${status.text
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {status.text}
                    </span>
                    | Mở: {formatDateTime(exam.openTime)} | Đóng:{" "}
                    {formatDateTime(exam.closeTime)}
                    {/* <span>{getLastAttempt(exam._id)}</span> */}
                    <span>Đã làm {getAttemptCount(exam._id)} lần</span>
                  </div>
                </div>
                <button disabled={!isOpen} onClick={() => handleStartExam(exam)}>
                  Làm bài
                </button>
                {hasHistory(exam._id) && (
                  <button onClick={() => handleViewReview(exam._id)} style={{ marginLeft: '10px' }}>
                    Xem kết quả các bài làm
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default StudentExamsPage;