import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { fetchQuestions, addQuestion, updateQuestion, deleteQuestion, importQuestions } from "../api";
import { FiSettings } from "react-icons/fi";
import "../styles/QuestionPage.css";
import { useNavigate } from "react-router-dom";

function QuestionPage({ categoryId, categoryName, subjectName}) {
  const [questions, setQuestions] = useState([]);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(null);
  const [difficulty, setDifficulty] = useState("Trung bình");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState({ x: 0, y: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const addMenuRef = useRef(null);
  const contextMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const [image, setImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState([]);
  const [expandedLevels, setExpandedLevels] = useState([]);
  const navigate = useNavigate();

const difficultyLevels = ["Dễ", "Trung bình", "Khó", "Rất khó"];

  useEffect(() => {
    fetchQuestions(categoryId).then(setQuestions).catch(err => console.error("Fetch questions error:", err));
  }, [categoryId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setShowContextMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddMenu, showContextMenu]);

  const toggleExpand = (id) => {
    setExpandedQuestionId(prev =>
      prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]
    );
  };
  
  const toggleLevelExpand = (level) => {
  setExpandedLevels(prev =>
    prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleAddQuestion = async () => {
    if (!title || correct === null) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("options", JSON.stringify(options));
    formData.append("correctAnswer", correct);
    formData.append("difficulty", difficulty);
    if (image) {
      formData.append("image", image);
    }

    try {
      await addQuestion(categoryId, formData);
      resetForm();
      fetchQuestions(categoryId).then(setQuestions);
      Swal.fire("Thành công!", "Đã thêm câu hỏi mới.", "success");
    } catch (err) {
      Swal.fire("Lỗi!", "Không thể thêm câu hỏi: " + err.message, "error");
    }
  };

  const handleUpdateQuestion = async (questionId) => {
    if (!title || correct === null) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("options", JSON.stringify(options));
    formData.append("correctAnswer", correct);
    formData.append("difficulty", difficulty);
    if (image) {
      formData.append("image", image);
    }

    try {
      await updateQuestion(questionId, formData);
      resetForm();
      fetchQuestions(categoryId).then(setQuestions);
      Swal.fire("Thành công!", "Đã cập nhật câu hỏi.", "success");
    } catch (err) {
      Swal.fire("Lỗi!", "Không thể cập nhật câu hỏi: " + err.message, "error");
    }
  };

  const resetForm = () => {
    setEditingQuestionId(null);
    setTitle("");
    setOptions(["", "", "", ""]);
    setCorrect(null);
    setDifficulty("Trung bình");
    setImage(null);
    setShowAddForm(false);
  };

  const handleDeleteQuestion = async (questionId) => {
    const result = await Swal.fire({
      title: "Bạn có chắc?",
      text: "Bạn có muốn xóa câu hỏi này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
      try {
        await deleteQuestion(questionId);
        fetchQuestions(categoryId).then(setQuestions);
        Swal.fire("Đã xóa!", "Câu hỏi đã được xóa.", "success");
      } catch (error) {
        Swal.fire("Lỗi!", error.response?.data?.message || "Không thể xóa câu hỏi.", "error");
      }
    }
    setShowContextMenu(false);
  };

  const handleImportQuestions = async () => {
    if (!importFile) {
      Swal.fire("Lỗi!", "Vui lòng chọn file Excel.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const response = await importQuestions(categoryId, formData);
      if (response.imported > 0) {
        Swal.fire("Thành công!", response.message, "success");
      } else {
        Swal.fire("Thông báo", response.message, "info");
      }
      setShowImportForm(false);
      setImportFile(null);
      fileInputRef.current.value = "";
      fetchQuestions(categoryId).then(setQuestions);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Không thể import.";
      if (err.response?.data?.errorDetails) {
        Swal.fire("Lỗi chi tiết!", errorMsg + "\nChi tiết: " + err.response.data.errorDetails.join('\n'), "error");
      } else {
        Swal.fire("Lỗi!", errorMsg, "error");
      }
      fetchQuestions(categoryId).then(setQuestions);
    }
  };

  const handleImportClick = () => {
    setShowAddMenu(false);
    setShowImportForm(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setImportFile(file);
      Swal.fire({
        title: "Xác nhận import",
        text: `Đã chọn file: ${file.name}. Định dạng: Title (A), Option A-D (B-E), Correct (F: 0-3), Difficulty (G: Dễ/Trung bình/Khó/Rất khó).`,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Import",
        cancelButtonText: "Chọn lại",
      }).then((result) => {
        if (result.isConfirmed) {
          handleImportQuestions();
        } else {
          setImportFile(null);
          fileInputRef.current.value = "";
        }
      });
    } else {
      Swal.fire("Lỗi!", "Chỉ hỗ trợ file .xlsx hoặc .xls.", "error");
      e.target.value = "";
    }
  };

  const handleAddMenuClick = (e) => {
    e.stopPropagation();
    setShowAddMenu(true);
    let x = e.clientX;
    let y = e.clientY;
    const menuWidth = 150;
    const menuHeight = 80;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight;
    setAddMenuPosition({ x, y });
  };

  const handleGearClick = (e, questionId) => {
    e.stopPropagation();
    setSelectedQuestionId(questionId);
    let x = e.clientX;
    let y = e.clientY;
    const menuWidth = 150;
    const menuHeight = 80;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight;
    setContextMenuPosition({ x, y });
    setShowContextMenu(true);
  };

  const startEditingQuestion = (question) => {
    setEditingQuestionId(question._id);
    setTitle(question.title);
    setOptions(question.options);
    setCorrect(question.correctAnswer);
    setDifficulty(question.difficulty || "Trung bình");
    setImage(null);
    setShowContextMenu(false);
    setShowAddForm(true);
  };

  const groupedQuestions = difficultyLevels.reduce((acc, level) => {
    acc[level] = questions.filter(q => (q.difficulty || "Trung bình") === level);
    return acc;
  }, {});


useEffect(() => {
  if (!categoryId) return;
  const savedState = localStorage.getItem(`questionPageState_${categoryId}`);
  if (savedState) {
    try {
      const { expandedLevels: savedLevels, expandedQuestionId: savedQuestions } = JSON.parse(savedState);
      if (savedLevels !== undefined) setExpandedLevels(savedLevels);
      if (savedQuestions !== undefined) setExpandedQuestionId(savedQuestions);
    } catch (err) {
      console.error("eror", err);
    }
  } else {
    setExpandedLevels([]);
    setExpandedQuestionId([]);
  }
}, [categoryId,questions]);

useEffect(() => {
  if (!categoryId) return;
  localStorage.setItem(
    `questionPageState_${categoryId}`,
    JSON.stringify({
      expandedLevels,
      expandedQuestionId,
    })
  );
}, [expandedLevels, expandedQuestionId, categoryId]);


  return (
    <div className="question-page">
<div style={{ marginBottom: "20px" }}>
  <button 
      onClick={() => navigate("/categories")}
      style={{
        marginBottom: "15px",
        padding: "8px 12px",
        backgroundColor: "#6c757d",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
      }}
    >
      quay lại
    </button>
  
  <div className="header">
    <div>
      <h3 style={{ margin: "0 0 5px 0", fontSize: "20px", color: "#2c3e50" }}>
        {subjectName} - {categoryName}
      </h3>
      <p style={{ margin: 0, fontSize: "14px", color: "#7f8c8d" }}>
        Danh sách câu hỏi ({questions.length})
      </p>
    </div>
    
    <button className="add-question-btn" onClick={handleAddMenuClick} title="Thêm câu hỏi">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Thêm câu hỏi
    </button>
  </div>
</div>

      {showAddMenu && (
        <div
          ref={addMenuRef}
          className="context-menu"
          style={{ top: addMenuPosition.y, left: addMenuPosition.x, pointerEvents: "auto" }}
        >
          <div
            className="context-menu-item"
            onClick={() => {
              setShowAddForm(true);
              setEditingQuestionId(null);
              setTitle("");
              setOptions(["", "", "", ""]);
              setCorrect(null);
              setDifficulty("Trung bình");
              setShowAddMenu(false);
            }}
          >
            Thêm thủ công
          </div>
          <div className="context-menu-item" onClick={handleImportClick}>
            Import từ file
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {showImportForm && (
        <div className="import-form">
          <h4>Import câu hỏi từ Excel</h4>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          <button onClick={handleImportQuestions} disabled={!importFile}>
            Import
          </button>
          <button onClick={() => setShowImportForm(false)} style={{ marginLeft: "10px", background: "#6c757d" }}>
            Hủy
          </button>
        </div>
      )}

      {/* Hiển thị câu hỏi theo độ khó */}
      {difficultyLevels.map(level => {
        const levelQuestions = groupedQuestions[level];
        if (levelQuestions.length === 0) return null;

        return (
          <div key={level} style={{ marginBottom: "30px" }}>
          <h4 
            style={{ 
              borderBottom: "2px solid #ccc",
              paddingBottom: "8px",
              marginBottom: "15px",
              display: "flex",
              alignItems: "center",
              cursor: "pointer"
            }}
            onClick={() => toggleLevelExpand(level)}
          >
            <span style={{ marginRight: "8px" }}>
              {expandedLevels.includes(level) ? "▼" : "▶"}
            </span>
            {level} ({levelQuestions.length} câu)
          </h4>
              {expandedLevels.includes(level) && (

            <ul>
              {levelQuestions.map((q, index) => (
                <li key={q._id} className="question-item">
                  <div className="question-content">
                    <div 
                      className="question-header"
                      style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <div onClick={() => toggleExpand(q._id)} style={{ flex: 1 }}>
                        <strong>Câu {index + 1}: {q.title}</strong>
                          <span style={{ 
                            marginLeft: "10px",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            border: "1px solid #ccc",
                            backgroundColor: "#f9f9f9"
                          }}>
                            {q.difficulty || "Trung bình"}
                          </span>

                      </div>

                      <div className="question-actions">
                        <span
                          className={`arrow ${expandedQuestionId.includes(q._id) ? "open" : ""}`} 
                          onClick={() => toggleExpand(q._id)}
                          style={{ cursor: "pointer", marginRight: "8px" }}
                        >
                          {expandedQuestionId.includes(q._id) ? "▼" : "▶"}
                        </span>
                        <button
                          className="gear-btn"
                          onClick={(e) => handleGearClick(e, q._id)}
                          title="Tùy chọn"
                        >
                          <FiSettings size={18} />
                        </button>
                      </div>
                    </div>

                    {expandedQuestionId.includes(q._id) && q.imageUrl && (
                      <div style={{ marginBottom: "10px" }}>
                        <img 
                          src={`http://localhost:5000${q.imageUrl}`} 
                          alt="question" 
                          style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px", cursor: "pointer" }}
                          onClick={() => {
                            setSelectedImage(`http://localhost:5000${q.imageUrl}`);
                            setShowImageModal(true);
                          }}
                        />
                      </div>
                    )}
                    {expandedQuestionId.includes(q._id) && (
                      <ol type="A" className="answer-list">
                        {q.options.map((opt, idx) => (
                          <li
                            key={idx}
                            style={{
                              fontWeight: idx === q.correctAnswer ? "bold" : "normal",
                              color: idx === q.correctAnswer ? "green" : "black",
                            }}
                          >
                            {opt}
                          </li>
                        ))}
                      </ol>
                    )}

                  </div>
                </li>
              ))}
            </ul>
          )}
          </div>
        );
      })}

      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{ top: contextMenuPosition.y, left: contextMenuPosition.x, pointerEvents: "auto" }}
        >
          <div
            className="context-menu-item"
            onClick={() => {
              const question = questions.find(q => q._id === selectedQuestionId);
              startEditingQuestion(question);
            }}
          >
            Sửa
          </div>
          <div
            className="context-menu-item delete"
            onClick={() => handleDeleteQuestion(selectedQuestionId)}
          >
            Xóa
          </div>
        </div>
      )}

      {showImageModal && (
        <div 
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setShowImageModal(false)}
        >
          <img 
            src={selectedImage} 
            alt="full" 
            style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "8px" }} 
          />
        </div>
      )}

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>{editingQuestionId ? "Sửa câu hỏi" : "Thêm câu hỏi"}</h4>
              <button
                className="modal-close-btn"
                onClick={resetForm}
              >
                ×
              </button>
            </div>

            <textarea
              placeholder="Nhập nội dung câu hỏi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div style={{ marginTop: "10px" }}>
              <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>
                Độ khó:
              </label>
              <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "14px"
                }}
              >
                {difficultyLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: "10px" }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
              />
              {image && (
                <div style={{ marginTop: "10px" }}>
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt="preview" 
                    style={{ maxWidth: "100%", borderRadius: "6px" }}
                  />
                </div>
              )}
            </div>

            {options.map((opt, idx) => (
              <div key={idx} className="option">
                <input
                  type="text"
                  placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[idx] = e.target.value;
                    setOptions(newOptions);
                  }}
                />
                <input
                  type="radio"
                  name="correct"
                  checked={correct === idx}
                  onChange={() => setCorrect(idx)}
                />{" "}
                Đúng
              </div>
            ))}

            <div style={{ marginTop: "15px" }}>
              {editingQuestionId ? (
                <button onClick={() => handleUpdateQuestion(editingQuestionId)}>Cập nhật</button>
              ) : (
                <button onClick={handleAddQuestion}>Lưu câu hỏi</button>
              )}
              <button
                onClick={resetForm}
                style={{ marginLeft: "10px", background: "#6c757d" }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default QuestionPage;