import axios from 'axios';

// Resolve API base URL for both dev (Vite proxy) and static preview/production
function resolveApiBase() {
  const envApi = import.meta?.env?.VITE_API_URL;
  if (envApi) return `${envApi.replace(/\/$/, '')}/api`;
  // In dev, Vite proxy serves /api
  if (import.meta?.env?.DEV) return '/api';
  // In preview/static (no proxy), default to local backend
  return 'http://127.0.0.1:5051/api';
}

const API_URL = resolveApiBase();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  console.log('🔑 API Request:', config.method?.toUpperCase(), config.url);
  console.log('🔑 Token present:', !!token);
  console.log('🔑 Base URL:', config.baseURL);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error logging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.config?.url);
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export const billsAPI = {
  getAll: (params) => api.get('/bills', { params }),
  getById: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),
  getStats: () => api.get('/bills/stats/dashboard')
};

export const customersAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`)
};

export const itemsAPI = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`)
};

export const settingsAPI = {
  get: (config = {}) => api.get('/settings', config),
  update: (data, config = {}) => api.put('/settings', data, config)
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials)
};

// Hotel management APIs
export const roomsAPI = {
  getAll: () => api.get('/rooms'),
  getById: (id) => api.get(`/rooms/${id}`),
  getAvailable: (checkInDate, checkOutDate) => api.get('/rooms/available', { 
    params: { checkInDate, checkOutDate } 
  }),
  getHistory: (id, limit = 50) => api.get(`/rooms/${id}/history`, { params: { limit } }),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  setStatus: (id, status) => api.post(`/rooms/${id}/status`, { status }),
  delete: (id) => api.delete(`/rooms/${id}`)
};

export const bookingsAPI = {
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  checkIn: (id) => api.post(`/bookings/${id}/check-in`),
  checkOut: (id) => api.post(`/bookings/${id}/check-out`),
  addFolioLine: (id, line) => api.post(`/bookings/${id}/folio/lines`, line),
  addPayment: (id, payment) => api.post(`/bookings/${id}/payments`, payment),
  delete: (id) => api.delete(`/bookings/${id}`)
};

export const housekeepingAPI = {
  getAll: (params) => api.get('/housekeeping', { params }),
  getStats: () => api.get('/housekeeping/stats'),
  getPending: () => api.get('/housekeeping/pending'),
  getInProgress: () => api.get('/housekeeping/in-progress'),
  create: (data) => api.post('/housekeeping', data),
  start: (id) => api.post(`/housekeeping/${id}/start`),
  complete: (id, data) => api.post(`/housekeeping/${id}/complete`, data),
  verify: (id) => api.post(`/housekeeping/${id}/verify`),
  assign: (id, data) => api.post(`/housekeeping/${id}/assign`, data),
  syncDirtyRooms: () => api.post('/housekeeping/sync-dirty-rooms'),
  update: (id, data) => api.put(`/housekeeping/${id}`, data),
  delete: (id) => api.delete(`/housekeeping/${id}`)
};

// Unified stats API
export const statsAPI = {
  getDashboard: () => api.get('/stats/dashboard')
};

// Room Types
export const roomTypesAPI = {
  getAll: () => api.get('/room-types'),
  create: (data) => api.post('/room-types', data),
  update: (id, data) => api.put(`/room-types/${id}`, data),
  delete: (id) => api.delete(`/room-types/${id}`)
};

// Rate Plans (per-day overrides by room type name)
export const ratePlansAPI = {
  list: () => api.get('/rate-plans'),
  getByRoomType: (roomTypeName) => api.get(`/rate-plans/${encodeURIComponent(roomTypeName)}`),
  setOverrides: (roomTypeName, overrides) => api.put(`/rate-plans/${encodeURIComponent(roomTypeName)}`, { overrides }),
  clearOverride: (roomTypeName, date) => api.delete(`/rate-plans/${encodeURIComponent(roomTypeName)}/${date}`)
};

export default api;
