import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { fetchSubjects, fetchCategories } from "../api";
import "../styles/PracticeExamPage.css";

function PracticeExamPage({ setPage, setSelectedExamId }) {
  const [exams, setExams] = useState([]); // danh sách đề luyện tập
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [categories, setCategories] = useState([]);
const [selectedCategories, setSelectedCategories] = useState([]);

  const [examName, setExamName] = useState("");
  const [duration, setDuration] = useState(60);
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [attempts, setAttempts] = useState(1);
  const [scorePerQuestion, setScorePerQuestion] = useState(1);

  useEffect(() => {
    fetchSubjects().then(setSubjects);
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchCategories(selectedSubject).then(setCategories);
    }
  }, [selectedSubject]);

  useEffect(() => {
    fetch("http://localhost:5000/api/practice-exams")
      .then((res) => res.json())
      .then((data) => setExams(data))
      .catch((err) => console.error("Lỗi khi load exams:", err));
  }, []);

  const handleSaveExam = async () => {
    if (!examName || !selectedSubject || selectedCategories.length === 0) {
        Swal.fire("Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin", "warning");
        return;
    }
    const newExam = {
    title: examName,
    subject: selectedSubject,
    categories: selectedCategories,
    duration,
    openTime,
    closeTime,
    attempts,
    scorePerQuestion,
    };


    try {
      const res = await fetch("http://localhost:5000/api/practice-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExam),
      });

      if (!res.ok) throw new Error("Không thể lưu vào DB");

      const savedExam = await res.json();
      setExams([...exams, savedExam]);
      Swal.fire("Thành công", "Đã tạo đề luyện tập!", "success");
      setIsModalOpen(false);

      setExamName("");
      setSelectedSubject("");
      setSelectedCategories([]);
      setDuration(60);
      setOpenTime("");
      setCloseTime("");
      setAttempts(1);
      setScorePerQuestion(1);
    } catch (error) {
      Swal.fire("Lỗi", "Không thể tạo đề luyện tập", "error");
      console.error(error);
    }
  };

  return (
    <div className="practice-exam-page">
      {/* Header */}
      <div className="header">
        <h3 className="title">Danh sách đề luyện tập</h3>
        <button className="action-btn" onClick={() => setIsModalOpen(true)}>
          + Tạo đề luyện tập
        </button>
      </div>

      {/* Danh sách đề */}
      <ul>
    {exams.length === 0 ? (
        <p>Chưa có đề luyện tập nào.</p>
    ) : (
        exams.map((exam) => (
        <li
            key={exam._id}
            className="exam-item"
            onClick={() => {
            setSelectedExamId(exam._id);
            setPage("practiceExamDetail");
            }}
            style={{ cursor: "pointer" }}
        >
            <div className="exam-item-header">
            <span className="exam-title">{exam.title}</span>
            <div className="exam-actions">
                <button
                className="exam-btn"
                onClick={(e) => {
                    e.stopPropagation(); 
                }}
                >
                Sửa
                </button>
                <button
                className="exam-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    setExams(exams.filter((e2) => e2._id !== exam._id));
                }}
                >
                Xóa
                </button>
            </div>
            </div>
        </li>
        ))
    )}
    </ul>


      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Tạo đề luyện tập</h4>
              <button
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>

            {/* Form tạo đề */}
            <div className="form-group">
              <label>Môn học</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">-- Chọn môn học --</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
            <label>Chủ đề</label>
            {categories.map((c) => (
                <div key={c._id}>
                <input
                    type="checkbox"
                    value={c._id}
                    checked={selectedCategories.includes(c._id)}
                    onChange={(e) => {
                    if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, c._id]);
                    } else {
                        setSelectedCategories(selectedCategories.filter(id => id !== c._id));
                    }
                    }}
                />
                <span>{c.name}</span>
                </div>
            ))}
            </div>



            <div className="form-group">
              <label>Tên đề luyện tập</label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Nhập tên đề..."
              />
            </div>

            <div className="form-group">
              <label>Thời lượng (phút)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Thời gian mở đề</label>
              <input
                type="datetime-local"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Thời gian kết thúc</label>
              <input
                type="datetime-local"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Số lần làm tối đa</label>
              <input
                type="number"
                value={attempts}
                onChange={(e) => setAttempts(e.target.value)}
              />
            </div>

            {/* <div className="form-group">
              <label>Điểm mỗi câu</label>
              <input
                type="number"
                value={scorePerQuestion}
                onChange={(e) => setScorePerQuestion(e.target.value)}
              />
            </div> */}

            <button onClick={handleSaveExam} style={{ marginTop: "10px" }}>
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PracticeExamPage;
