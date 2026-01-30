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
export const publicAPI = {
  getClinics: (params?: { city?: string; specialty?: string; q?: string }) =>
    api.get('/public/clinics', { params }),
  getClinicBySlug: (slug: string) => api.get(`/public/clinics/${slug}`),
  getDentists: () => api.get('/public/dentists'),
};

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

export const whatsappAPI = {
  getStatus: async () => {
    const response = await api.get('/whatsapp/status');
    return response.data;
  },

  sendMessage: async (to: string, message: string) => {
    const response = await api.post('/whatsapp/send', { to, message });
    return response.data;
  }
};

export const patientPortalAPI = {
  getDashboard: async () => {
    const response = await api.get('/portal/dashboard');
    return response.data;
  },
  getAppointments: async () => {
    const response = await api.get('/portal/appointments');
    return response.data;
  },
  getDocuments: async () => {
    const response = await api.get('/portal/documents');
    return response.data;
  }
};

// Clinics API
export const clinicsAPI = {
  getAll: async () => {
    const response = await api.get('/clinics');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/clinics/${id}`);
    return response.data;
  },
  create: async (data: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
  }) => {
    const response = await api.post('/clinics', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{
    name: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
  }>) => {
    const response = await api.patch(`/clinics/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/clinics/${id}`);
    return response.data;
  },
  // Operatories
  getOperatories: async (clinicId?: string) => {
    const url = clinicId ? `/clinics/operatories/all?clinicId=${clinicId}` : '/clinics/operatories/all';
    const response = await api.get(url);
    return response.data;
  },
  createOperatory: async (data: { clinicId: string; name: string; description?: string }) => {
    const response = await api.post('/clinics/operatories', data);
    return response.data;
  },
  updateOperatory: async (id: string, data: Partial<{ name: string; description?: string; isActive?: boolean }>) => {
    const response = await api.patch(`/clinics/operatories/${id}`, data);
    return response.data;
  },
  deleteOperatory: async (id: string) => {
    const response = await api.delete(`/clinics/operatories/${id}`);
    return response.data;
  },
};

// Staff/Tenant Membership API
export const staffAPI = {
  getAll: async () => {
    const response = await api.get('/tenant-membership/staff');
    return response.data;
  },
  invite: async (data: { email: string; name: string; role: string; permissions?: string[] }) => {
    const response = await api.post('/tenant-membership/invite', data);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/tenant-membership/${id}`);
    return response.data;
  },
  update: async (id: string, data: Partial<{ role: string; permissions?: string[]; status?: string }>) => {
    const response = await api.patch(`/tenant-membership/${id}`, data);
    return response.data;
  },
  remove: async (id: string) => {
    const response = await api.delete(`/tenant-membership/${id}`);
    return response.data;
  },
  getMyWorkspaces: async () => {
    const response = await api.get('/tenant-membership/my-workspaces');
    return response.data;
  },
  acceptInvitation: async (id: string) => {
    const response = await api.patch(`/tenant-membership/${id}/accept`);
    return response.data;
  },
  rejectInvitation: async (id: string) => {
    const response = await api.patch(`/tenant-membership/${id}/reject`);
    return response.data;
  },
};

export default api;
