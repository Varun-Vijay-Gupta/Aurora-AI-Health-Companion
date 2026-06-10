import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aurora_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('aurora_token');
      localStorage.removeItem('aurora_user');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ==================== AUTH ====================

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  google: (credential) => api.post('/auth/google', { credential }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ==================== DASHBOARD ====================

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

// ==================== WATER ====================

export const waterApi = {
  log: (data) => api.post('/water', data),
  getToday: () => api.get('/water/today'),
  getWeekly: () => api.get('/water/weekly'),
  delete: (id) => api.delete(`/water/${id}`),
};

// ==================== SLEEP ====================

export const sleepApi = {
  log: (data) => api.post('/sleep', data),
  getToday: () => api.get('/sleep/today'),
  getWeekly: () => api.get('/sleep/weekly'),
  getMonthly: () => api.get('/sleep/monthly'),
};

// ==================== HABITS ====================

export const habitsApi = {
  getAll: () => api.get('/habits'),
  create: (data) => api.post('/habits', data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`),
  toggle: (id) => api.post(`/habits/${id}/toggle`),
};

// ==================== NUTRITION ====================

export const nutritionApi = {
  log: (data) => api.post('/nutrition', data),
  getToday: () => api.get('/nutrition/today'),
  getWeekly: () => api.get('/nutrition/weekly'),
  delete: (id) => api.delete(`/nutrition/${id}`),
};

// ==================== AI ====================

export const aiApi = {
  chat: (message) => api.post('/ai/chat', { message }),
  getHistory: () => api.get('/ai/history'),
  getMemories: () => api.get('/ai/memories'),
  getWeeklySummary: () => api.get('/ai/weekly-summary'),
  getInsight: () => api.get('/ai/insight'),
};

// ==================== ONBOARDING ====================

export const onboardingApi = {
  getStatus: () => api.get('/onboarding/status'),
  complete: (data) => api.post('/onboarding/complete', data),
  healthSetup: (data) => api.post('/onboarding/health-setup', data),
};

// ==================== HEALTH MEMORY ====================

export const healthMemoryApi = {
  getAll: (params) => api.get('/health-memory', { params }),
  getInsights: () => api.get('/health-memory/insights'),
  refresh: () => api.post('/health-memory/refresh'),
};

// ==================== ANALYTICS ====================

export const analyticsApi = {
  get: () => api.get('/analytics'),
  getAchievements: () => api.get('/analytics/achievements'),
  getNotifications: () => api.get('/analytics/notifications'),
  markRead: (id) => api.put(`/analytics/notifications/${id}/read`),
  markAllRead: () => api.put('/analytics/notifications/read-all'),
  downloadReport: () =>
    api.get('/analytics/report/pdf', {
      responseType: 'blob',
    }),
};