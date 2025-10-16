import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { fetchSubjects, fetchCategories } from "../api";
import "../styles/PracticeExamPage.css";
import { useNavigate } from "react-router-dom";

function PracticeExamPage() {
  const [exams, setExams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
const navigate = useNavigate();

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
    } else {
      setCategories([]);
      setSelectedCategories([]);
    }
  }, [selectedSubject]);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = () => {
    fetch("http://localhost:5000/api/practice-exams")
      .then((res) => res.json())
      .then((data) => setExams(data))
      .catch((err) => console.error("Lỗi khi load exams:", err));
  };

  const resetForm = () => {
    setExamName("");
    setSelectedSubject("");
    setSelectedCategories([]);
    setDuration(60);
    setOpenTime("");
    setCloseTime("");
    setAttempts(1);
    setScorePerQuestion(1);
    setIsEditMode(false);
    setEditingExamId(null);
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const openTime = exam.openTime ? new Date(exam.openTime) : null;
    const closeTime = exam.closeTime ? new Date(exam.closeTime) : null;

    if (!openTime) {
      return { status: "Chưa đặt lịch", className: "status-pending" };
    }

    if (now < openTime) {
      return { status: "Chưa mở", className: "status-upcoming" };
    }

    if (closeTime && now > closeTime) {
      console.log("Lỗi!Thời gian mở đề phải lớn hơn thời gian hiện tại");
      return { status: "Đã đóng", className: "status-closed" };
    }

    return { status: "Đang mở", className: "status-open" };
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Chưa đặt";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleSaveExam = async () => {
    if (!examName || !selectedSubject || selectedCategories.length === 0) {
      Swal.fire("Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin", "warning");
      return;
    }

    const examData = {
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
      const url = isEditMode
        ? `http://localhost:5000/api/practice-exams/${editingExamId}`
        : "http://localhost:5000/api/practice-exams";
      
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examData),
      });

      if (!res.ok) throw new Error("Không thể lưu vào DB");

      const savedExam = await res.json();

      if (isEditMode) {
        setExams(exams.map(e => e._id === editingExamId ? savedExam : e));
        Swal.fire("Thành công", "Đã cập nhật đề luyện tập!", "success");
      } else {
        setExams([...exams, savedExam]);
        Swal.fire("Thành công", "Đã tạo đề luyện tập!", "success");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      Swal.fire("Lỗi", `Không thể ${isEditMode ? 'cập nhật' : 'tạo'} đề luyện tập`, "error");
      console.error(error);
    }
  };

  const handleEditExam = async (e, exam) => {
    e.stopPropagation();
    
    try {
      const res = await fetch(`http://localhost:5000/api/practice-exams/${exam._id}`);
      if (!res.ok) throw new Error("Không thể load exam");
      
      const examData = await res.json();
      
      setIsEditMode(true);
      setEditingExamId(exam._id);
      setExamName(examData.title);
      
      setSelectedSubject(examData.subject._id || examData.subject);
      setSelectedCategories(examData.categories.map(c => c._id || c));
      setDuration(examData.duration);
      setAttempts(examData.attempts);
      setScorePerQuestion(examData.scorePerQuestion);
      
      if (examData.openTime) {
        const openDate = new Date(examData.openTime);
        setOpenTime(openDate.toISOString().slice(0, 16));
      } else {
        setOpenTime("");
      }
      
      if (examData.closeTime) {
        const closeDate = new Date(examData.closeTime);
        setCloseTime(closeDate.toISOString().slice(0, 16));
      } else {
        setCloseTime("");
      }
      
      setIsModalOpen(true);
    } catch (error) {
      Swal.fire("Lỗi", "Không thể tải thông tin đề thi", "error");
      console.error(error);
    }
  };

  const handleDeleteExam = async (e, exam) => {
    e.stopPropagation();
    
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      html: `Bạn có chắc chắn muốn xóa đề thi<br/><strong>"${exam.title}"</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:5000/api/practice-exams/${exam._id}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Không thể xóa đề thi");

        setExams(exams.filter((e) => e._id !== exam._id));
        Swal.fire("Đã xóa!", "Đề thi đã được xóa khỏi hệ thống.", "success");
      } catch (error) {
        Swal.fire("Lỗi", "Không thể xóa đề thi", "error");
        console.error(error);
      }
    }
  };

  return (
    <div className="practice-exam-page">
      <div className="header">
        <h3 className="title">Danh sách đề luyện tập</h3>
        <button className="action-btn" onClick={() => setIsModalOpen(true)}>
          + Tạo đề luyện tập
        </button>
      </div>

      <ul>
        {exams.length === 0 ? (
          <p>Chưa có đề luyện tập nào.</p>
        ) : (
          exams.map((exam) => (
            <li
              key={exam._id}
              className="exam-item"
              onClick={() => navigate(`/practice-exam-detail/${exam._id}`)}

            >
              <div className="exam-item-header">
                <div className="exam-info-left">
                  <span className="exam-title">{exam.title} - {" "}
                    <span style={{color:"#528fd1ff", fontWeight: "500", fontStyle:"italic"}}> môn học: {exam.subject?.name}</span>
                    </span>
                  <div className="exam-metadata">
                    <span className={`exam-status ${getExamStatus(exam).className}`}>
                      {getExamStatus(exam).status}
                    </span>
                    <span className="exam-time">
                      Mở: {formatDateTime(exam.openTime)}
                    </span>
                    <span className="exam-time">
                      Đóng: {formatDateTime(exam.closeTime)}
                    </span>
                  </div>
                </div>
                <div className="exam-actions">
                  <button
                    className="exam-btn edit-btn"
                    onClick={(e) => handleEditExam(e, exam)}
                  >
                    Sửa
                  </button>
                  <button
                    className="exam-btn delete-btn"
                    onClick={(e) => handleDeleteExam(e, exam)}
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
              <h4>{isEditMode ? "Chỉnh sửa đề luyện tập" : "Tạo đề luyện tập"}</h4>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            {!isEditMode && (
              <>
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
                  {categories.length === 0 ? (
                    <p style={{ fontSize: "14px", color: "#666" }}>Vui lòng chọn môn học trước</p>
                  ) : (
                    categories.map((c) => (
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
                    ))
                  )}
                </div>
              </>
            )}

            <div className="form-group">
              <label>Tên đề luyện tập</label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Nhập tên đề..."
              />
            </div>

            {!isEditMode && (
              <div className="form-group">
                <label>Thời lượng (phút)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label>Thời gian mở đề</label>
              <input
                type="datetime-local"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
              />
            </div>

            {!isEditMode && (
              <>
                <div className="form-group">
                  <label>Thời gian kết thúc</label>
                  <input
                    type="datetime-local"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                  />
                </div>

                {/* <div className="form-group">
                  <label>Số lần làm tối đa</label>
                  <input
                    type="number"
                    value={attempts}
                    onChange={(e) => setAttempts(e.target.value)}
                  />
                </div> */}
              </>
            )}

            <button onClick={handleSaveExam} style={{ marginTop: "10px" }}>
              {isEditMode ? "Cập nhật" : "Xác nhận"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PracticeExamPage;