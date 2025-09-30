import React from "react";
import "../styles/Sidebar.css";

function Sidebar({ setPage }) {
  return (
    <div className="sidebar">
      <h2>Dashboard giảng viên</h2>
      <div className="menu-container">
        <ul>
          <li onClick={() => setPage("categories")}>Tạo danh mục</li>
          <li onClick={() => setPage("practiceExam")}>Tạo đề luyện tập</li>
          <li>Tạo đề kiểm tra</li>
          <li>Thống kê & báo cáo</li>
          <li>Hồ sơ cá nhân</li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;
