import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import {
  fetchSubjects,
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../api";
import { FiSettings } from "react-icons/fi"; // Thay SVG bằng react-icons
import "../styles/CategoryPage.css";

function CategoryPage({ onSelectCategory }) {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);

  useEffect(() => {
    fetchSubjects().then(setSubjects);
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchCategories(selectedSubject).then((data) => {
        setCategories([...data].sort((a, b) => a.name.localeCompare(b.name))); // Sắp xếp theo bảng chữ cái
      });
    }
  }, [selectedSubject]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setShowContextMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim() || !selectedSubject) return;
    try {
      await addCategory(selectedSubject, newCategory, newDescription);
      setNewCategory("");
      setNewDescription("");
      setShowAddForm(false);
      fetchCategories(selectedSubject).then((data) => {
        setCategories([...data].sort((a, b) => a.name.localeCompare(b.name)));
      });
      Swal.fire("Thành công!", "Đã thêm danh mục mới.", "success");
    } catch (err) {
      Swal.fire("Lỗi!", "Không thể thêm danh mục: " + err.message, "error");
    }
  };

  const handleEditCategory = async (categoryId) => {
    if (!editCategoryName.trim()) return;
    try {
      await updateCategory(categoryId, editCategoryName, editCategoryDescription);
      setEditingCategory(null);
      setEditCategoryName("");
      setEditCategoryDescription("");
      fetchCategories(selectedSubject).then((data) => {
        setCategories([...data].sort((a, b) => a.name.localeCompare(b.name)));
      });
      Swal.fire("Thành công!", "Đã cập nhật danh mục.", "success");
    } catch (err) {
      Swal.fire("Lỗi!", "Không thể cập nhật danh mục: " + err.message, "error");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const result = await Swal.fire({
      title: "Bạn có chắc?",
      text: "Bạn có muốn xóa danh mục này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
      try {
        await deleteCategory(categoryId);
        fetchCategories(selectedSubject).then((data) => {
          setCategories([...data].sort((a, b) => a.name.localeCompare(b.name)));
        });
        Swal.fire("Đã xóa!", "Danh mục đã được xóa.", "success");
      } catch (error) {
        Swal.fire("Lỗi!", error.response?.data?.message || "Không thể xóa danh mục.", "error");
      }
    }
    setShowContextMenu(false);
  };

  const handleGearClick = (e, categoryId) => {
    e.stopPropagation();
    setSelectedCategoryId(categoryId);
    let x = e.clientX;
    let y = e.clientY;
    const menuWidth = 150;
    const menuHeight = 80;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight;
    setContextMenuPosition({ x, y });
    setShowContextMenu(true);
  };

  return (
    <div className="category-page">
      <div className="filters">
        <h3>Quản lý ngân hàng câu hỏi</h3>
        <div className="filter-group">
          <label>Môn học</label>
          <select
            onChange={(e) => setSelectedSubject(e.target.value)}
            value={selectedSubject || ""}
          >
            <option value="">-- Chọn môn học --</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="subject-list">
        {selectedSubject ? (
          <>
            <div className="header">
              <h4>Danh sách danh mục ({categories.length})</h4>
              <button className="add-btn" onClick={() => setShowAddForm(true)}>
                Thêm danh mục
              </button>
            </div>

            {showAddForm && (
              <div className="add-category-form">
                <h4>Thêm danh mục mới</h4>
                <input
                  type="text"
                  placeholder="Nhập tên danh mục..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <textarea
                  placeholder="Nhập mô tả danh mục (tùy chọn)..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
                <button onClick={handleAddCategory}>Lưu</button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCategory("");
                    setNewDescription("");
                  }}
                  style={{ marginLeft: "10px", background: "#6c757d" }}
                >
                  Hủy
                </button>
              </div>
            )}

            <ul>
              {categories.map((c) => (
                <li key={c._id}>
                  {editingCategory === c._id ? (
                    <div className="edit-category-form">
                      <input
                        type="text"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        placeholder="Nhập tên mới..."
                      />
                      <textarea
                        value={editCategoryDescription}
                        onChange={(e) => setEditCategoryDescription(e.target.value)}
                        placeholder="Nhập mô tả mới..."
                        rows={3}
                      />
                      <button
                        onClick={() => handleEditCategory(c._id)}
                        style={{ marginLeft: "10px" }}
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        style={{ marginLeft: "5px", background: "#6c757d" }}
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="category-item">
                    <span
                      onClick={() => {
                        const subject = subjects.find(s => s._id === selectedSubject);
                        onSelectCategory({
                          categoryId: c._id,
                          categoryName: c.name,
                          subjectName: subject?.name || 'Không xác định'
                        });
                      }}
                      style={{ cursor: "pointer", flex: 1 }}
                    >
                      {c.name}
                      {c.description && (
                        <p style={{ fontSize: "12px", color: "#666", margin: "5px 0 0 0" }}>
                          {c.description}
                        </p>
                      )}
                    </span>
                      <div className="actions">
                        <button
                          className="gear-btn"
                          onClick={(e) => handleGearClick(e, c._id)}
                          title="Tùy chọn"
                        >
                          <FiSettings size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {showContextMenu && (
              <div
                ref={contextMenuRef}
                className="context-menu"
                style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
              >
                <div
                  className="context-menu-item"
                  onClick={() => {
                    const category = categories.find((c) => c._id === selectedCategoryId);
                    setEditingCategory(category._id);
                    setEditCategoryName(category.name);
                    setEditCategoryDescription(category.description || "");
                    setShowContextMenu(false);
                  }}
                >
                  Sửa
                </div>
                <div
                  className="context-menu-item delete"
                  onClick={() => handleDeleteCategory(selectedCategoryId)}
                >
                  Xóa
                </div>
              </div>
            )}
          </>
        ) : (
          <p>Vui lòng chọn môn học để xem danh mục.</p>
        )}
      </div>
    </div>
  );
}

export default CategoryPage;