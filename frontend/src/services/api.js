import axios from "axios";

// Proxy mode: use same-origin /api (avoids CORS, works on mobile). Set REACT_APP_USE_PROXY=true in Vercel.
const USE_PROXY = process.env.REACT_APP_USE_PROXY === "true";
const API_BASE_URL = USE_PROXY
  ? "/api"
  : process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 45000,
});

// Add auth token to requests when available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Retry failed requests (helps with flaky mobile networks)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isNetworkError =
      !error.response &&
      (error.message === "Network Error" ||
        error.code === "ERR_NETWORK" ||
        error.code === "ECONNABORTED");
    const retryCount = originalRequest._retryCount || 0;
    if (isNetworkError && retryCount < 2) {
      originalRequest._retryCount = retryCount + 1;
      await new Promise((r) => setTimeout(r, 2000 * (retryCount + 1)));
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);

// Store API calls
export const storeAPI = {
  getAll: () => api.get("/stores"),
  getVisible: () => api.get("/stores/visible"),
  getAllIncludingHidden: () => api.get("/stores/all"),
  getById: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post("/stores", data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  delete: (id) => api.delete(`/stores/${id}`),
  toggleVisibility: (id) => api.put(`/stores/${id}/toggle-visibility`),
};

// StoreType API calls
export const storeTypeAPI = {
  getAll: () => api.get("/store-types"),
};

// BrandType API calls
export const brandTypeAPI = {
  getAll: () => api.get("/brand-types"),
  create: (data) => api.post("/brand-types", data),
  update: (id, data) => api.put(`/brand-types/${id}`, data),
  delete: (id) => api.delete(`/brand-types/${id}`),
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

// Ad API calls
export const adAPI = {
  getAll: (params = {}) => api.get("/ads", { params }),
  getById: (id) => api.get(`/ads/${id}`),
  create: (data) => api.post("/ads", data),
  update: (id, data) => api.put(`/ads/${id}`, data),
  delete: (id) => api.delete(`/ads/${id}`),
};

// User API calls (work with auth token OR deviceId for anonymous users)
export const userAPI = {
  getByDevice: (deviceId) => api.get(`/users/device/${deviceId}`),
  toggleLike: (deviceId, productId, headers = {}) =>
    api.post(
      "/users/like-product",
      { productId, ...(deviceId && { deviceId }) },
      { headers },
    ),
  recordView: (deviceId, productId, headers = {}) =>
    api.post("/users/view-product", { deviceId, productId }, { headers }),
  addReview: (deviceId, productId, rating, comment, headers = {}) =>
    api.post(
      "/users/review-product",
      { productId, rating, comment },
      { headers },
    ),
  getLikedProducts: (deviceId, headers = {}) =>
    api.get("/users/liked-products", {
      params: deviceId ? { deviceId } : {},
      headers,
    }),
  getViewedProducts: (deviceId, headers = {}) =>
    api.get("/users/viewed-products", {
      params: deviceId ? { deviceId } : {},
      headers,
    }),
  pushSubscribe: (subscription, deviceId) =>
    api.post("/users/push-subscribe", {
      subscription,
      ...(deviceId && { deviceId }),
    }),
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
      { headers },
    ),
  logout: (headers) => api.post("/auth/logout", {}, { headers }),
};

// Settings API calls
export const settingsAPI = {
  get: () => api.get("/settings"),
  update: (data, headers) => api.put("/settings", data, { headers }),
};

// Notification API calls
export const notificationAPI = {
  getAll: (deviceId) =>
    api.get("/notifications", {
      params: deviceId ? { deviceId } : {},
    }),
  markAsRead: (id, deviceId) =>
    api.put(`/notifications/${id}/read`, deviceId ? { deviceId } : {}),
  markAllAsRead: (deviceId) =>
    api.put("/notifications/read-all", deviceId ? { deviceId } : {}),
  getVapidPublic: () => api.get("/notifications/vapid-public"),
};

// Admin API calls
export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  getMostLikedProducts: () => api.get("/admin/products/most-liked"),
  getMostViewedProducts: () => api.get("/admin/products/most-viewed"),
  getStoreReport: (params = {}) => api.get("/admin/reports/stores", { params }),
  getBrandReport: (params = {}) => api.get("/admin/reports/brands", { params }),
  sendNotification: (data) => api.post("/admin/notifications/send", data),
};

export default api;
