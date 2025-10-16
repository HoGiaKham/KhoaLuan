import React, { useEffect, useState } from "react";
import axios from "axios";

function StudentPage({ studentUsername, setPage }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/classes");
        const allClasses = res.data;
        const myClasses = allClasses.filter((cls) =>
          cls.students?.some((s) => s.username === studentUsername)
        );
        setClasses(myClasses);
      } catch (err) {
        console.error("Lỗi khi load lớp:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [studentUsername]);

  if (loading) return <p>Đang tải dữ liệu...</p>;

  if (selectedClass) {
    return (
      <ClassDetail
        classInfo={selectedClass}
        onBack={() => setSelectedClass(null)}
      />
    );
  }

  return (
    <div>
      <h2>Lớp của tôi</h2>
      {classes.length === 0 ? (
        <p>Bạn chưa được phân vào lớp nào.</p>
      ) : (
        <ul style={styles.list}>
          {classes.map((cls) => (
            <li
              key={cls._id}
              style={styles.item}
              onClick={() => setSelectedClass(cls)}
            >
              <strong>{cls.name}</strong>
              <br />
              <small>Giảng viên: {cls.teacher?.name || "N/A"}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClassDetail({ classInfo, onBack }) {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/practice-exams?classId=${classInfo._id}`
        );
        setExams(res.data);
      } catch (err) {
        console.error("Lỗi load đề:", err);
      }
    };
    fetchExams();
  }, [classInfo]);

  return (
    <div>
      <button onClick={onBack} style={styles.backBtn}>
        ← Quay lại danh sách lớp
      </button>
      <h3>Đề trong lớp {classInfo.name}</h3>
      {exams.length === 0 ? (
        <p>Chưa có đề nào trong lớp này.</p>
      ) : (
        <ul style={styles.list}>
          {exams.map((exam) => (
            <li key={exam._id} style={styles.item}>
              <strong>{exam.title}</strong>
              <div>Môn: {exam.subjectName}</div>
              <div>
                <button style={styles.btn}>Làm bài</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles = {
  list: {
    listStyle: "none",
    padding: 0,
  },
  item: {
    border: "1px solid #ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    cursor: "pointer",
    transition: "0.2s",
  },
  btn: {
    marginTop: 6,
    padding: "6px 12px",
    background: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  backBtn: {
    marginBottom: 10,
    background: "transparent",
    border: "none",
    color: "#1976d2",
    cursor: "pointer",
  },
};

export default StudentPage;