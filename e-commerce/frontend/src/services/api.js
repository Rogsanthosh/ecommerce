import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

// ─── PUBLIC APIs ─────────────────────────────────────────────────────────────
export const productApi = {
  search: (params) => api.get('/products', { params }),
  getByIdentifier: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products/featured'),
  getReviews: (productId, params) => api.get(`/products/${productId}/reviews`, { params }),
  submitReview: (productId, data) => api.post(`/products/${productId}/reviews`, data),
};

export const categoryApi = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
};

// ─── AUTH APIs ───────────────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── ADMIN APIs ──────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get('/admin/stats'),

  // Products
  getProducts: (params) => api.get('/admin/products', { params }),
  getProduct: (id) => api.get(`/admin/products/${id}`),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id, hard = false) => api.delete(`/admin/products/${id}`, { params: { hard } }),

  // Categories
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
};

export default api;
