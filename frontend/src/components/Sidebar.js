import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="sidebar">
      <h2>
        {user?.role === "teacher" ? "Dashboard giảng viên" : "Dashboard sinh viên"}
      </h2>

      <div className="menu-container">
        <ul>
          {user?.role === "teacher" && (
            <>
              <li onClick={() => navigate("/categories")}>Tạo danh mục</li>
              <li onClick={() => navigate("/practice-exam")}>Tạo đề luyện tập</li>
              <li onClick={() => navigate("/practice-test")}>Tạo đề kiểm tra</li>
              <li onClick={() => navigate("/statistics")}>Thống kê & báo cáo</li>
              <li onClick={() => navigate("/profile")}>Hồ sơ cá nhân</li>
            </>
          )}

          {user?.role === "student" && (
            <>
              <li onClick={() => navigate("/student")}>Trang học viên</li>
              <li onClick={() => navigate("/myClasses")}>Môn học của tôi</li>
              <li onClick={() => navigate("/myExams")}>Bài luyện tập</li>
            </>
          )}
        </ul>
      </div>

      <button
        onClick={() => {
          onLogout();
          navigate("/login");
        }}
        className="logout-btn"
        style={{
          marginTop: "auto",
          background: "#c0392b",
          color: "white",
          border: "none",
          padding: "8px 12px",
          cursor: "pointer",
          borderRadius: "6px",
        }}
      >
        Đăng xuất
      </button>
    </div>
  );
}

export default Sidebar;
