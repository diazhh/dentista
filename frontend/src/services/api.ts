import axios from 'axios';
import type { AuthResponse, Tenant, SystemMetrics, RevenueMetrics, TenantActivity } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry auth endpoints
    if (originalRequest.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: {
    email: string;
    password: string;
    name: string;
    role: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getTenants: async (page: number = 1, limit: number = 20) => {
    const response = await api.get(`/admin/tenants?page=${page}&limit=${limit}`);
    return response.data;
  },

  getTenantById: async (id: string): Promise<Tenant> => {
    const response = await api.get(`/admin/tenants/${id}`);
    return response.data;
  },

  updateTenantSubscription: async (
    id: string,
    data: {
      subscriptionTier?: string;
      subscriptionStatus?: string;
      maxPatients?: number;
      storageGB?: number;
    }
  ): Promise<Tenant> => {
    const response = await api.put(`/admin/tenants/${id}/subscription`, data);
    return response.data;
  },

  suspendTenant: async (id: string): Promise<Tenant> => {
    const response = await api.post(`/admin/tenants/${id}/suspend`);
    return response.data;
  },

  reactivateTenant: async (id: string): Promise<Tenant> => {
    const response = await api.post(`/admin/tenants/${id}/reactivate`);
    return response.data;
  },

  getSystemMetrics: async (): Promise<SystemMetrics> => {
    const response = await api.get('/admin/metrics/system');
    return response.data;
  },

  getRevenueMetrics: async (): Promise<RevenueMetrics> => {
    const response = await api.get('/admin/metrics/revenue');
    return response.data;
  },

  getTenantActivity: async (days: number = 30): Promise<TenantActivity[]> => {
    const response = await api.get(`/admin/metrics/activity?days=${days}`);
    return response.data;
  },
};

export default api;
