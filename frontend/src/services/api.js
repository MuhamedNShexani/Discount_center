import axios from "axios";

// const API_BASE_URL = "http://localhost:5000/api";
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Company API calls
export const companyAPI = {
  getAll: () => api.get("/companies"),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post("/companies", data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};

// Product API calls
export const productAPI = {
  getAll: (filters = {}) => api.get("/products", { params: filters }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getByCompany: (companyId) => api.get(`/products/company/${companyId}`),
  getByCategory: (category) => api.get(`/products/category/${category}`),
  getCategories: () => api.get("/products/categories"),
};

export default api;
