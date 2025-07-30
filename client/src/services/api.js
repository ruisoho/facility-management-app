import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Dashboard API
export const fetchDashboardData = async () => {
  try {
    const [maintenance, consumption, tasks] = await Promise.all([
      api.get('/maintenance/stats'),
      api.get('/consumption/stats'),
      api.get('/tasks/stats')
    ]);

    return {
      stats: {
        totalMaintenance: maintenance.data.total || 0,
        overdueMaintenance: maintenance.data.overdue || 0,
        totalTasks: tasks.data.total || 0,
        overdueTasks: tasks.data.overdue || 0,
        monthlyElectricity: consumption.data.monthlyElectricity || 0,
        monthlyGas: consumption.data.monthlyGas || 0,
        totalCost: consumption.data.totalCost || 0,
        completedThisMonth: tasks.data.completedThisMonth || 0
      },
      charts: {
        consumptionTrend: consumption.data.trend || [],
        maintenanceStatus: maintenance.data.statusDistribution || [],
        tasksPriority: tasks.data.priorityDistribution || []
      },
      recentActivity: [], // Will be populated from actual API
      upcomingTasks: tasks.data.upcoming || []
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      stats: {
        totalMaintenance: 0,
        overdueMaintenance: 0,
        totalTasks: 0,
        overdueTasks: 0,
        monthlyElectricity: 0,
        monthlyGas: 0,
        totalCost: 0,
        completedThisMonth: 0
      },
      charts: {
        consumptionTrend: [],
        maintenanceStatus: [],
        tasksPriority: []
      },
      recentActivity: [],
      upcomingTasks: []
    };
  }
};

// Maintenance API
export const maintenanceAPI = {
  getAll: (params = {}) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
  markComplete: (id) => api.patch(`/maintenance/${id}/complete`),
  getStats: () => api.get('/maintenance/stats'),
  getUpcoming: () => api.get('/maintenance/upcoming')
};

// Consumption API
export const consumptionAPI = {
  getAll: (params = {}) => api.get('/consumption', { params }),
  getById: (id) => api.get(`/consumption/${id}`),
  create: (data) => api.post('/consumption', data),
  update: (id, data) => api.put(`/consumption/${id}`, data),
  delete: (id) => api.delete(`/consumption/${id}`),
  verify: (id) => api.patch(`/consumption/${id}/verify`),
  getAnalytics: (params = {}) => api.get('/consumption/analytics', { params }),
  getStats: () => api.get('/consumption/stats')
};

// Tasks API
export const tasksAPI = {
  getAll: (params = {}) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  bulkUpdate: (data) => api.patch('/tasks/bulk', data),
  markComplete: (id, completionData) => api.patch(`/tasks/${id}/complete`, completionData),
  getStats: () => api.get('/tasks/stats'),
  getUpcoming: () => api.get('/tasks/upcoming'),
  getOverdue: () => api.get('/tasks/overdue')
};

// Upload API
export const uploadAPI = {
  uploadMaintenanceFiles: (maintenanceId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post(`/upload/maintenance/${maintenanceId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadTaskFiles: (taskId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post(`/upload/task/${taskId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  downloadFile: (fileId) => api.get(`/upload/download/${fileId}`, { responseType: 'blob' }),
  viewFile: (fileId) => api.get(`/upload/view/${fileId}`),
  deleteFile: (fileId) => api.delete(`/upload/${fileId}`),
  getFileInfo: (fileId) => api.get(`/upload/info/${fileId}`)
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
    return { success: false, message, status: error.response.status };
  } else if (error.request) {
    // Request was made but no response received
    return { success: false, message: 'Network error - please check your connection', status: 0 };
  } else {
    // Something else happened
    return { success: false, message: error.message || 'An unexpected error occurred', status: 0 };
  }
};

export const formatApiResponse = (response) => {
  return {
    success: true,
    data: response.data,
    status: response.status
  };
};

// Export the axios instance for direct use if needed
export default api;