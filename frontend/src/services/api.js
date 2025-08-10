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

// Store API calls
export const storeAPI = {
  getAll: () => api.get("/stores"),
  getById: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post("/stores", data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  delete: (id) => api.delete(`/stores/${id}`),
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
  getByStoreType: (storeType) => api.get(`/categories/store-type/${storeType}`),
  uploadCategoryImage: async (categoryId, file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${API_BASE_URL}/categories/${categoryId}/image`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Upload failed with status ${res.status}`);
    }
    return res.json();
  },
};

// Product API calls
export const productAPI = {
  getAll: (filters = {}) => api.get("/products", { params: filters }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getByBrand: (brandId) => api.get(`/products/brand/${brandId}`),
  getByStore: (storeId) => api.get(`/products/store/${storeId}`),
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
  getByStore: (storeId) => api.get(`/gifts/store/${storeId}`),
  getByBrand: (brandId) => api.get(`/gifts/brand/${brandId}`),
};

// User API calls
export const userAPI = {
  getByDevice: (deviceId) => api.get(`/users/device/${deviceId}`),
  toggleLike: (deviceId, productId, headers = {}) =>
    api.post("/users/like-product", { productId }, { headers }),
  recordView: (deviceId, productId, headers = {}) =>
    api.post("/users/view-product", { deviceId, productId }, { headers }),
  addReview: (deviceId, productId, rating, comment, headers = {}) =>
    api.post(
      "/users/review-product",
      { productId, rating, comment },
      { headers }
    ),
  getLikedProducts: (deviceId, headers = {}) =>
    api.get("/users/liked-products", { headers }),
  getViewedProducts: (deviceId, headers = {}) =>
    api.get("/users/viewed-products", { headers }),
};

// Auth API calls
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (email, password) => api.post("/auth/login", { email, password }),
  getProfile: (headers) => api.get("/auth/profile", { headers }),
  updateProfile: (profileData, headers) =>
    api.put("/auth/profile", profileData, { headers }),
  changePassword: (currentPassword, newPassword, headers) =>
    api.put(
      "/auth/change-password",
      { currentPassword, newPassword },
      { headers }
    ),
  logout: (headers) => api.post("/auth/logout", {}, { headers }),
};

export default api;
