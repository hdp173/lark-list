import axios from 'axios';

// Auto-detect environment
const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor: Inject Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized error is received, token has expired
    if (error.response?.status === 401) {
      // Clear local storage token and user info
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      // Redirect to login page (App.tsx will automatically show login page when token is cleared)
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
};

export const taskApi = {
  // Get task list (supports tree structure)
  getAll: (params?: any) => api.get('/tasks', { params }),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  getHistory: (id: string) => api.get(`/tasks/${id}/history`),
  addComment: (id: string, content: string) => api.post(`/tasks/${id}/comments`, { content }),
  addFollower: (taskId: string, userId: string) => api.post(`/tasks/${taskId}/followers/${userId}`),
  removeFollower: (taskId: string, userId: string) =>
    api.delete(`/tasks/${taskId}/followers/${userId}`),
  addAssignee: (taskId: string, userId: string, addToFollowers?: boolean) =>
    api.post(`/tasks/${taskId}/assignees/${userId}`, { addToFollowers }),
  removeAssignee: (taskId: string, userId: string) =>
    api.delete(`/tasks/${taskId}/assignees/${userId}`),
  addTeam: (taskId: string, teamId: string) => api.post(`/tasks/${taskId}/teams/${teamId}`),
  removeTeam: (taskId: string, teamId: string) => api.delete(`/tasks/${taskId}/teams/${teamId}`),
};

export const userApi = {
  getAll: () => api.get('/users'),
};

export const teamApi = {
  getAll: () => api.get('/teams'),
  getById: (id: string) => api.get(`/teams/${id}`),
  create: (data: any) => api.post('/teams', data),
  delete: (id: string) => api.delete(`/teams/${id}`),
  addMember: (teamId: string, userId: string) => api.post(`/teams/${teamId}/members/${userId}`),
  removeMember: (teamId: string, userId: string) => api.delete(`/teams/${teamId}/members/${userId}`),
};

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};
