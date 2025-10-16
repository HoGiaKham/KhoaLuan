import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const fetchSubjects = async () => {
  const response = await axios.get(`${API_URL}/subjects`);
  return response.data;
};

export const fetchCategories = async (subjectId) => {
  const response = await axios.get(`${API_URL}/categories/${subjectId}`);
  return response.data;
};

export const addCategory = async (subjectId, name, description = "") => {
  const response = await axios.post(`${API_URL}/categories/${subjectId}`, { name, description });
  return response.data;
};

export const updateCategory = async (categoryId, name, description = "") => {
  const response = await axios.put(`${API_URL}/categories/${categoryId}`, { name, description });
  return response.data;
};

export const deleteCategory = async (categoryId) => {
  const response = await axios.delete(`${API_URL}/categories/${categoryId}`);
  return response.data;
};

export const fetchQuestions = async (categoryId) => {
  const response = await axios.get(`${API_URL}/questions/${categoryId}`);
  return response.data;
};

export const addQuestion = async (categoryId, formData) => {
  // FormData đã được tạo sẵn từ QuestionPage
  const response = await axios.post(`${API_URL}/questions/${categoryId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateQuestion = async (questionId, formData) => {
  // FormData đã được tạo sẵn từ QuestionPage
  const response = await axios.put(`${API_URL}/questions/${questionId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteQuestion = async (questionId) => {
  const response = await axios.delete(`${API_URL}/questions/${questionId}`);
  return response.data;
};

export const importQuestions = async (categoryId, formData) => {
  const response = await axios.post(`${API_URL}/questions/${categoryId}/import`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};