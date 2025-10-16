import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/PracticeExamDetailPage.css";

const BASE_URL = "http://localhost:5000/api";

function PracticeExamDetailPage({ setPage }) {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showShuffleConfirm, setShowShuffleConfirm] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState({ x: 0, y: 0 });
  const addMenuRef = useRef(null);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [difficulty, setDifficulty] = useState("Trung bình");
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRandomAddModal, setShowRandomAddModal] = useState(false);
  const [randomCount, setRandomCount] = useState(1);
  const [selectedRandomCategory, setSelectedRandomCategory] = useState("all");

  const handleRandomAdd = async () => {
    setShowAddMenu(false);
    await fetchBankQuestions();
    setShowRandomAddModal(true);
  };

  const handleConfirmRandomAdd = async () => {
    if (bankQuestions.length === 0) {
      alert("Ngân hàng câu hỏi trống hoặc tất cả câu hỏi đã có trong đề.");
      return;
    }

    let filteredQuestions = bankQuestions;

    if (selectedRandomCategory !== "all") {
      filteredQuestions = filteredQuestions.filter(
        q =>
          q.categoryId === selectedRandomCategory ||
          q.categoryId?._id === selectedRandomCategory
      );
    }

    if (filteredQuestions.length === 0) {
      alert("Không có câu hỏi nào trong chương đã chọn.");
      return;
    }

    const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, randomCount);

    try {
      const res = await fetch(`${BASE_URL}/practice-exams/${examId}/questions/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: selected.map(q => q._id) }),
      });

      if (!res.ok) throw new Error("Không thể thêm câu hỏi ngẫu nhiên");

      await fetchQuestions();
      setShowRandomAddModal(false);
      alert(`✅ Đã thêm ngẫu nhiên ${selected.length} câu hỏi vào đề luyện tập`);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi thêm câu hỏi ngẫu nhiên");
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${BASE_URL}/practice-exams/${examId}/questions`);
      if (!res.ok) throw new Error("Không thể load questions");
      const data = await res.json();
      setQuestions(data || []);
    } catch (err) {
      console.error("Lỗi khi load questions:", err);
      setQuestions([]);
    }
  };

  useEffect(() => {
    if (!examId) {
      console.error("examId không hợp lệ");
      navigate("/practice-exam");
      return;
    }

    const fetchExam = async () => {
      try {
        const res = await fetch(`${BASE_URL}/practice-exams/${examId}`);
        if (!res.ok) throw new Error("Không thể load exam");
        const data = await res.json();
        setExamData(data);
      } catch (err) {
        console.error("Lỗi khi load exam:", err);
        setExamData(null);
        navigate("/practice-exam");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
    fetchQuestions();
  }, [examId, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddMenu]);

  const fetchBankQuestions = async () => {
    if (!examData || !examData.categories || examData.categories.length === 0) return;

    try {
      const res = await fetch(`${BASE_URL}/practice-exams/${examId}/all-questions`);
      if (!res.ok) throw new Error("Không thể load ngân hàng câu hỏi");
      const data = await res.json();
      const currentQuestionIds = questions.map(q => q._id);
      const availableQuestions = data.filter(q => !currentQuestionIds.includes(q._id));
      setBankQuestions(availableQuestions);
    } catch (err) {
      console.error("Lỗi khi load ngân hàng câu hỏi:", err);
      alert("Lỗi: Không thể tải ngân hàng câu hỏi");
    }
  };



  const handleAddMenuClick = (e) => {
    e.stopPropagation();
    setShowAddMenu(true);
    let x = e.clientX;
    let y = e.clientY;
    const menuWidth = 200;
    const menuHeight = 100;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight;
    setAddMenuPosition({ x, y });
  };

  const handleManualAdd = () => {
    setShowAddMenu(false);
    setIsAddQuestionModalOpen(true);
  };

  const handleBankAdd = async () => {
    setShowAddMenu(false);
    await fetchBankQuestions();
    setShowQuestionBankModal(true);
  };

  const removeVietnameseTones = (str) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleSelectBankQuestion = (questionId) => {
    setSelectedBankQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleAddFromBank = async () => {
    if (selectedBankQuestions.length === 0) {
      alert("Vui lòng chọn ít nhất một câu hỏi");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/practice-exams/${examId}/questions/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: selectedBankQuestions }),
      });

      if (!res.ok) throw new Error("Không thể thêm câu hỏi");

      await fetchQuestions();
      setShowQuestionBankModal(false);
      setSelectedBankQuestions([]);
      alert(`Thành công! Đã thêm ${selectedBankQuestions.length} câu hỏi`);
    } catch (error) {
      alert("Lỗi: Không thể thêm câu hỏi từ ngân hàng");
      console.error(error);
    }
  };

  const handleAddQuestion = async () => {
    if (!title.trim() || options.some((opt) => !opt.trim())) {
      alert("Vui lòng nhập đầy đủ câu hỏi và các đáp án");
      return;
    }

    const newQuestion = {
      title,
      options,
      correctAnswer,
      difficulty,
      categoryId: examData.categories[0]._id || examData.categories[0],
    };

    try {
      const res = await fetch(`${BASE_URL}/practice-exams/${examId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      });

      if (!res.ok) throw new Error("Không thể thêm câu hỏi");

      await fetchQuestions();
      alert("Thành công! Đã thêm câu hỏi");

      setTitle("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer(0);
      setDifficulty("Trung bình");
      setIsAddQuestionModalOpen(false);
    } catch (error) {
      alert("Lỗi: Không thể thêm câu hỏi");
      console.error(error);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này khỏi đề thi?");

    if (confirmed) {
      try {
        const res = await fetch(`${BASE_URL}/practice-exams/${examId}/questions/${questionId}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Không thể xóa câu hỏi");

        await fetchQuestions();
        alert("Đã xóa! Câu hỏi đã được xóa khỏi đề thi");
      } catch (error) {
        alert("Lỗi: Không thể xóa câu hỏi");
        console.error(error);
      }
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  if (loading) {
    return (
      <div className="practice-exam-detail-page">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="practice-exam-detail-page">
        <div className="error">Không tìm thấy đề thi</div>
      </div>
    );
  }

  return (
    <div className="practice-exam-detail-page">
      <div className="header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/practice-exam")}>
            ← Quay lại
          </button>
          <h3 className="exam-title">{examData.title}</h3>
        </div>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Tìm kiếm câu hỏi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button className="add-question-btn" onClick={handleAddMenuClick}>
            + Thêm câu hỏi
          </button>
        </div>
      </div>

      {showAddMenu && (
        <div
          ref={addMenuRef}
          className="context-menu"
          style={{
            top: addMenuPosition.y,
            left: addMenuPosition.x,
            pointerEvents: "auto",
            position: "fixed",
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            minWidth: "180px",
          }}
        >
          <div
            className="context-menu-item"
            onClick={handleManualAdd}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            Thêm thủ công
          </div>
          <div
            className="context-menu-item"
            onClick={handleBankAdd}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            Chọn từ ngân hàng câu hỏi
          </div>
          <div
            className="context-menu-item"
            onClick={handleRandomAdd}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            Thêm ngẫu nhiên từ ngân hàng câu hỏi
          </div>
        </div>
      )}

      <div className="exam-info">
        <div className="info-item">
          <span className="info-label">Thời lượng:</span>
          <span className="info-value">{examData.duration} phút</span>
        </div>
        <div className="info-item">
          <span className="info-label">Số câu hỏi:</span>
          <span className="info-value">{questions.length} câu</span>
        </div>
                <div className="info-item">
          <span className="info-label">Môn học:</span>
          <span className="info-value">{examData.subject?.name}</span>
        </div>
      </div>

      <div className="questions-section">
        <h4>Danh sách câu hỏi</h4>
        {questions.length === 0 ? (
          <p className="no-questions">Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!</p>
        ) : (
          <div className="questions-list">
            {questions
              .filter(q => {
                if (!searchTerm.trim()) return true;
                const normalizedTitle = removeVietnameseTones(q.title);
                const normalizedSearch = removeVietnameseTones(searchTerm);
                return normalizedTitle.includes(normalizedSearch);
              })
              .map((question, index) => (
                <div key={question._id} className="question-item">
                  <div className="question-header">
                    <span className="question-number">Câu {index + 1}</span>
                    <button className="delete-btn" onClick={() => handleDeleteQuestion(question._id)}>
                      Xóa
                    </button>
                  </div>
                  <div className="question-text">{question.title}</div>
                  {question.imageUrl && (
                    <div
                      style={{
                        marginTop: "12px",
                        marginBottom: "12px",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={`http://localhost:5000${question.imageUrl}`}
                        alt="question"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "300px",
                          borderRadius: "8px",
                          border: "1px solid #ddd",
                          objectFit: "contain",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          window.open(`http://localhost:5000${question.imageUrl}`, "_blank");
                        }}
                      />
                    </div>
                  )}
                  <div className="options-list">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`option ${optIndex === question.correctAnswer ? "correct" : ""}`}
                      >
                        <span className="option-label">{String.fromCharCode(65 + optIndex)}.</span>
                        <span className="option-text">{option}</span>
                      </div>
                    ))}
                  </div>
                  <div className="difficulty">
                    <strong>Độ khó:</strong> {question.difficulty}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>



      {isAddQuestionModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Thêm câu hỏi mới</h4>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddQuestionModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Câu hỏi</label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập nội dung câu hỏi..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Các đáp án</label>
              {options.map((option, index) => (
                <div key={index} className="option-input">
                  <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                  />
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer === index}
                    onChange={() => setCorrectAnswer(index)}
                  />
                  <label>Đúng</label>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label>Độ khó</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="Dễ">Dễ</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Khó">Khó</option>
                <option value="Rất khó">Rất khó</option>
              </select>
            </div>

            <div className="modal-actions">
              <button onClick={handleAddQuestion} className="confirm-btn">
                Thêm câu hỏi
              </button>
              <button onClick={() => setIsAddQuestionModalOpen(false)} className="cancel-btn">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuestionBankModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "900px", maxHeight: "85vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h4>Chọn câu hỏi từ ngân hàng</h4>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowQuestionBankModal(false);
                  setSelectedBankQuestions([]);
                  setExpandedCategories([]);
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "15px", padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Đã chọn: {selectedBankQuestions.length} câu hỏi</strong>
                  <input
                  type="text"
                  placeholder="Tìm trong ngân hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    marginLeft: "20px",
                    padding: "8px 12px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    flex: "1",
                    marginRight: "10px",
                  }}
                />
              {bankQuestions.length > 0 && (
                <button
                  onClick={() => {
                    if (expandedCategories.length === examData.categories.length) {
                      setExpandedCategories([]);
                    } else {
                      setExpandedCategories(examData.categories.map(cat => cat._id || cat));
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    fontSize: "13px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {expandedCategories.length === examData.categories.length ? "Thu gọn tất cả" : "Mở rộng tất cả"}
                </button>
              )}
            </div>

            {bankQuestions.length === 0 ? (
              <p style={{ textAlign: "center", color: "#666", padding: "40px 20px" }}>
                Không có câu hỏi nào trong ngân hàng hoặc tất cả đã được thêm vào đề thi.
              </p>
            ) : (
              <div className="bank-questions-by-category">
                {examData.categories.map((category) => {
                  const categoryId = category._id || category;
                  const categoryName = category.name || "Chương";
                  const categoryQuestions = bankQuestions.filter(q =>
                    (q.categoryId === categoryId || q.categoryId?._id === categoryId) &&
                    removeVietnameseTones(q.title || "").includes(removeVietnameseTones(searchTerm))
                  );

                  if (categoryQuestions.length === 0) return null;

                  const isExpanded = expandedCategories.includes(categoryId);
                  const selectedInCategory = categoryQuestions.filter(q =>
                    selectedBankQuestions.includes(q._id)
                  ).length;

                  return (
                    <div key={categoryId} style={{ marginBottom: "20px", border: "1px solid #e0e0e0", borderRadius: "8px", overflow: "hidden" }}>
                      <div
                        onClick={() => toggleCategoryExpand(categoryId)}
                        style={{
                          padding: "15px 20px",
                          backgroundColor: "#f5f5f5",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          userSelect: "none",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ececec")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                            {isExpanded ? "▼" : "▶"}
                          </span>
                          <span style={{ fontSize: "16px", fontWeight: "600" }}>
                            {categoryName}
                          </span>
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#666",
                              backgroundColor: "#fff",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {categoryQuestions.length} câu
                          </span>
                        </div>
                        {selectedInCategory > 0 && (
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#2196F3",
                              fontWeight: "600",
                              backgroundColor: "#E3F2FD",
                              padding: "4px 10px",
                              borderRadius: "12px",
                            }}
                          >
                            Đã chọn: {selectedInCategory}
                          </span>
                        )}
                      </div>

                      {isExpanded && (
                        <div style={{ padding: "15px" }}>
                          {categoryQuestions.map((question, index) => (
                            <div
                              key={question._id}
                              style={{
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                padding: "15px",
                                marginBottom: "12px",
                                backgroundColor: selectedBankQuestions.includes(question._id) ? "#e3f2fd" : "white",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                              onClick={() => toggleSelectBankQuestion(question._id)}
                            >
                              <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                                <input
                                  type="checkbox"
                                  checked={selectedBankQuestions.includes(question._id)}
                                  onChange={() => toggleSelectBankQuestion(question._id)}
                                  style={{ marginTop: "5px", width: "18px", height: "18px", cursor: "pointer" }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "15px" }}>
                                    Câu {index + 1}: {question.title}
                                  </div>
                                  {question.imageUrl && (
                                    <div style={{ marginBottom: "12px", marginLeft: "10px" }}>
                                      <img
                                        src={`http://localhost:5000${question.imageUrl}`}
                                        alt="question image"
                                        style={{
                                          maxWidth: "100%",
                                          maxHeight: "250px",
                                          borderRadius: "6px",
                                          border: "1px solid #ddd",
                                          objectFit: "contain",
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div style={{ fontSize: "14px", color: "#666", marginLeft: "10px" }}>
                                    {question.options.map((opt, idx) => (
                                      <div
                                        key={idx}
                                        style={{
                                          marginBottom: "6px",
                                          padding: "6px 10px",
                                          borderRadius: "4px",
                                          backgroundColor: idx === question.correctAnswer ? "#e8f5e9" : "#fafafa",
                                          color: idx === question.correctAnswer ? "#2e7d32" : "#666",
                                          fontWeight: idx === question.correctAnswer ? "600" : "normal",
                                          border: idx === question.correctAnswer ? "1px solid #81c784" : "1px solid #eee",
                                        }}
                                      >
                                        {String.fromCharCode(65 + idx)}. {opt}
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ marginTop: "10px", fontSize: "12px", color: "#999", display: "flex", gap: "15px" }}>
                                    <span>
                                      <strong>Độ khó:</strong> {question.difficulty || "Trung bình"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: "20px", position: "sticky", bottom: 0, backgroundColor: "white", padding: "15px 0", borderTop: "1px solid #eee" }}>
              <button
                onClick={handleAddFromBank}
                className="confirm-btn"
                disabled={selectedBankQuestions.length === 0}
                style={{
                  opacity: selectedBankQuestions.length === 0 ? 0.5 : 1,
                  cursor: selectedBankQuestions.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                Thêm {selectedBankQuestions.length > 0 ? `${selectedBankQuestions.length} câu hỏi` : "câu hỏi"}
              </button>
              <button
                onClick={() => {
                  setShowQuestionBankModal(false);
                  setSelectedBankQuestions([]);
                  setExpandedCategories([]);
                }}
                className="cancel-btn"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {showRandomAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h4>Thêm ngẫu nhiên câu hỏi</h4>
              <button
                className="modal-close-btn"
                onClick={() => setShowRandomAddModal(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Chọn chương:</label>
              <select
                value={selectedRandomCategory}
                onChange={(e) => setSelectedRandomCategory(e.target.value)}
              >
                <option value="all">Tất cả các chương</option>
                {examData.categories.map((cat) => (
                  <option key={cat._id || cat} value={cat._id || cat}>
                    {cat.name || "Chương"}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Số lượng câu hỏi ngẫu nhiên:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={randomCount}
                onChange={(e) => setRandomCount(parseInt(e.target.value))}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleConfirmRandomAdd} className="confirm-btn">
                Xác nhận
              </button>
              <button onClick={() => setShowRandomAddModal(false)} className="cancel-btn">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PracticeExamDetailPage;