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

// Market API calls
export const marketAPI = {
  getAll: () => api.get("/markets"),
  getById: (id) => api.get(`/markets/${id}`),
  create: (data) => api.post("/markets", data),
  update: (id, data) => api.put(`/markets/${id}`, data),
  delete: (id) => api.delete(`/markets/${id}`),
};

// Brand API calls

export const brandAPI = {
  getAll: () => api.get("/brands"),
  getById: (id) => api.get(`/brands/${id}`),
  create: (data) => api.post("/brands", data),
  update: (id, data) => api.put(`/brands/${id}`, data),
  delete: (id) => api.delete(`/brands/${id}`),
};

// Category API calls
export const categoryAPI = {
  getAll: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  getTypes: (id) => api.get(`/categories/${id}/types`),
};

// Product API calls
export const productAPI = {
  getAll: (filters = {}) => api.get("/products", { params: filters }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getByBrand: (brandId) => api.get(`/products/brand/${brandId}`),
  getByMarket: (marketId) => api.get(`/products/market/${marketId}`),
  getByCategory: (category) => api.get(`/products/category/${category}`),
  getCategories: () => api.get("/products/categories"),
  bulkUpload: (data) => api.post("/products/bulk-upload", data),
};

// Gift API calls
export const giftAPI = {
  getAll: () => api.get("/gifts"),
  getById: (id) => api.get(`/gifts/${id}`),
  create: (data) => api.post("/gifts", data),
  update: (id, data) => api.put(`/gifts/${id}`, data),
  delete: (id) => api.delete(`/gifts/${id}`),
  getByMarket: (marketId) => api.get(`/gifts/market/${marketId}`),
  getByBrand: (brandId) => api.get(`/gifts/brand/${brandId}`),
};

export default api;
