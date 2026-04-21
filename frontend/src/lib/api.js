import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login/', { username, password }),
  refresh: (refresh) => api.post('/auth/refresh/', { refresh }),
  me: () => api.get('/auth/me/'),
};

export const blocksAPI = {
  list: () => api.get('/blocks/'),
  get: (id) => api.get(`/blocks/${id}/`),
  create: (data) => api.post('/blocks/', data),
  update: (id, data) => api.patch(`/blocks/${id}/`, data),
  delete: (id) => api.delete(`/blocks/${id}/`),
  getCrops: (id) => api.get(`/blocks/${id}/crops/`),
  getWorkLogs: (id, params) => api.get(`/blocks/${id}/work_logs/`, { params }),
  getActivityHistory: (id, params) => api.get(`/blocks/${id}/activity_history/`, { params }),
};

export const cropsAPI = {
  list: () => api.get('/crops/'),
  get: (id) => api.get(`/crops/${id}/`),
  create: (data) => api.post('/crops/', data),
  update: (id, data) => api.patch(`/crops/${id}/`, data),
  delete: (id) => api.delete(`/crops/${id}/`),
  getBlocks: (id) => api.get(`/crops/${id}/blocks/`),
  getActivityHistory: (id, params) => api.get(`/crops/${id}/activity_history/`, { params }),
};

export const seasonsAPI = {
  list: (params) => api.get('/seasons/', { params }),
  get: (id) => api.get(`/seasons/${id}/`),
  create: (data) => api.post('/seasons/', data),
  update: (id, data) => api.patch(`/seasons/${id}/`, data),
  delete: (id) => api.delete(`/seasons/${id}/`),
};

export const workersAPI = {
  list: () => api.get('/workers/'),
  get: (id) => api.get(`/workers/${id}/`),
  create: (data) => api.post('/workers/', data),
  update: (id, data) => api.patch(`/workers/${id}/`, data),
  delete: (id) => api.delete(`/workers/${id}/`),
  getWorkHistory: (id) => api.get(`/workers/${id}/work_history/`),
};

export const workLogsAPI = {
  list: (params) => api.get('/work-logs/', { params }),
  get: (id) => api.get(`/work-logs/${id}/`),
  create: (data) => api.post('/work-logs/', data),
  update: (id, data) => api.patch(`/work-logs/${id}/`, data),
  delete: (id) => api.delete(`/work-logs/${id}/`),
  today: () => api.get('/work-logs/today/'),
  assignWorkers: (id, workers) => api.post(`/work-logs/${id}/assign_workers/`, { workers }),
};

export const workTypesAPI = {
  list: (params) => api.get('/work-types/', { params }),
};

export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard/'),
  trend: (params) => api.get('/analytics/trend/', { params }),
  blockSummary: (params) => api.get('/analytics/block-summary/', { params }),
  cropSummary: (params) => api.get('/analytics/crop-summary/', { params }),
  costSummary: (params) => api.get('/analytics/cost-summary/', { params }),
  costBreakdown: (params) => api.get('/analytics/cost-breakdown/', { params }),
};

export const weatherAPI = {
  list: () => api.get('/weather/'),
  get: (id) => api.get(`/weather/${id}/`),
  create: (data) => api.post('/weather/', data),
  update: (id, data) => api.patch(`/weather/${id}/`, data),
  delete: (id) => api.delete(`/weather/${id}/`),
  monthly: (year, month) => api.get('/weather/monthly/', { params: { year, month } }),
  yearly: (year) => api.get('/weather/yearly/', { params: { year } }),
};

export const inventoryAPI = {
  list: (params) => api.get('/inventory/', { params }),
  get: (id) => api.get(`/inventory/${id}/`),
  create: (data) => api.post('/inventory/', data),
  update: (id, data) => api.patch(`/inventory/${id}/`, data),
  delete: (id) => api.delete(`/inventory/${id}/`),
};

export const attendanceAPI = {
  list: (params) => api.get('/attendance/', { params }),
  mark: (data) => api.post('/attendance/mark_attendance/', data),
};

export const inventoryTransactionsAPI = {
  list: (params) => api.get('/inventory-transactions/', { params }),
  create: (data) => api.post('/inventory-transactions/', data),
};

export const exportAPI = {
  excel: (params) => api.get('/export/', { params, responseType: 'blob' }),
};

export const syncAPI = {
  sync: (entries) => api.post('/sync/', { entries }),
};

export default api;
