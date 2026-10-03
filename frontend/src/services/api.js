import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor attaches token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('loomora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor handles auth errors cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 401 unauthorized
      if (error.response.status === 401 && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('loomora_token');
        localStorage.removeItem('loomora_user');
        window.location.href = '/login';
      }
      const message = error.response.data?.detail || error.response.data?.message || 'An unexpected server error occurred';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      return Promise.reject(new Error('Network error: Unable to reach LOOMORA ERP backend server. Please check connection.'));
    } else {
      return Promise.reject(error);
    }
  }
);

export default api;
