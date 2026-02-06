import axios from 'axios';
import type { AuthResponse, Tenant, SystemMetrics, RevenueMetrics, TenantActivity } from '../types';
import { storage } from '../utils/storage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and tenant context
api.interceptors.request.use(
  (config) => {
    const token = storage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Send X-Tenant-Id header for multi-tenant staff support
    const selectedTenantId = storage.getItem('selectedTenantId');
    if (selectedTenantId) {
      config.headers['X-Tenant-Id'] = selectedTenantId;
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
        const refreshToken = storage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        storage.setItem('accessToken', accessToken);
        storage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        storage.removeItem('accessToken');
        storage.removeItem('refreshToken');
        storage.removeItem('user');

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

// Public API
export const publicAPI = {
  getClinics: (params?: { city?: string; specialty?: string; q?: string }) =>
    api.get('/public/clinics', { params }),
  getClinicBySlug: (slug: string) => api.get(`/public/clinics/${slug}`),
  getProviders: (params?: { specialty?: string }) =>
    api.get('/public/providers', { params }),
  getSpecialties: () =>
    api.get<{ value: string; label: string }[]>('/public/specialties'),
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

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  validateResetToken: async (token: string): Promise<{ valid: boolean; email?: string }> => {
    const response = await api.get(`/auth/reset-password/validate?token=${token}`);
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  switchTenant: async (tenantId: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/switch-tenant', { tenantId });
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
    address: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
    phone: string;
    email: string;
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
  // Consultation Rooms
  getRooms: async (clinicId?: string) => {
    const url = clinicId ? `/clinics/rooms/all?clinicId=${clinicId}` : '/clinics/rooms/all';
    const response = await api.get(url);
    return response.data;
  },
  createRoom: async (data: { clinicId: string; name: string; description?: string }) => {
    const response = await api.post('/clinics/rooms', data);
    return response.data;
  },
  updateRoom: async (id: string, data: Partial<{ name: string; description?: string; isActive?: boolean }>) => {
    const response = await api.patch(`/clinics/rooms/${id}`, data);
    return response.data;
  },
  deleteRoom: async (id: string) => {
    const response = await api.delete(`/clinics/rooms/${id}`);
    return response.data;
  },
};

// Staff Management API (Phase 1.6)
export interface StaffPermissions {
  patients?: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  appointments?: { view: boolean; create: boolean; edit: boolean; cancel: boolean };
  billing?: { view: boolean; create: boolean };
  clinical?: { viewNotes: boolean; viewDocuments: boolean };
}

export const staffAPI = {
  // New staff-management endpoints
  getAll: async () => {
    const response = await api.get('/staff');
    return response.data;
  },
  invite: async (data: { email: string; name: string; role: string; permissions?: StaffPermissions }) => {
    const response = await api.post('/staff/invite', data);
    return response.data;
  },
  updateRole: async (membershipId: string, role: string) => {
    const response = await api.put(`/staff/${membershipId}/role`, { role });
    return response.data;
  },
  updatePermissions: async (membershipId: string, permissions: StaffPermissions) => {
    const response = await api.put(`/staff/${membershipId}/permissions`, permissions);
    return response.data;
  },
  remove: async (membershipId: string) => {
    const response = await api.delete(`/staff/${membershipId}`);
    return response.data;
  },
  getMyTenants: async () => {
    const response = await api.get('/staff/my-tenants');
    return response.data;
  },

  // Legacy tenant-membership endpoints (still needed for accept/reject invitations)
  getMyWorkspaces: async () => {
    const response = await api.get('/staff/my-tenants');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/tenant-membership/${id}`);
    return response.data;
  },
  update: async (id: string, data: Partial<{ role: string; permissions?: StaffPermissions; status?: string }>) => {
    const response = await api.patch(`/tenant-membership/${id}`, data);
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

// Calendar Sync API
export const calendarSyncAPI = {
  getConnections: async () => {
    const response = await api.get('/calendar-sync');
    return response.data;
  },
  getGoogleAuthUrl: async () => {
    const response = await api.get('/calendar-sync/google/auth-url');
    return response.data;
  },
  connectGoogle: async (code: string) => {
    const response = await api.post('/calendar-sync/google/callback', { code });
    return response.data;
  },
  disconnect: async (connectionId: string) => {
    const response = await api.delete(`/calendar-sync/${connectionId}`);
    return response.data;
  },
  syncNow: async (connectionId: string) => {
    const response = await api.post(`/calendar-sync/${connectionId}/sync`);
    return response.data;
  },
  updateSettings: async (connectionId: string, data: { syncEnabled?: boolean; syncDirection?: string }) => {
    const response = await api.patch(`/calendar-sync/${connectionId}`, data);
    return response.data;
  },
  getSyncLogs: async (connectionId: string) => {
    const response = await api.get(`/calendar-sync/${connectionId}/logs`);
    return response.data;
  },
};

// Chatbot Config API
export const chatbotConfigAPI = {
  getConfig: async () => {
    const response = await api.get('/chatbot-config');
    return response.data;
  },
  updateConfig: async (data: {
    isEnabled?: boolean;
    welcomeMessage?: string;
    fallbackMessage?: string;
    practiceName?: string;
    practiceAddress?: string;
    practicePhone?: string;
    practiceWebsite?: string;
    operatingHours?: Record<string, { open: string; close: string } | null>;
    pricingInfo?: Array<{ service: string; price: number; description?: string }>;
    aiModel?: string;
    aiTemperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    allowScheduling?: boolean;
    allowCancellation?: boolean;
    allowRescheduling?: boolean;
    requireIdentification?: boolean;
    humanHandoffKeywords?: string[];
    maxMessagesPerHour?: number;
    enabledChannels?: string[];
    webChatTheme?: string;
    webChatPosition?: string;
    faqs?: Array<{ question: string; answer: string }>;
    escalationEmail?: string;
    escalationPhone?: string;
    maxUnanswered?: number;
    specialInstructions?: string;
    cancellationPolicy?: string;
    paymentMethods?: string[];
  }) => {
    const response = await api.put('/chatbot-config', data);
    return response.data;
  },
  testChatbot: async (message: string) => {
    const response = await api.post('/chatbot-config/test', { message });
    return response.data;
  },
};

// Web Chat API (for chat widget)
export const webChatAPI = {
  sendMessage: async (tenantId: string, message: string, sessionId?: string) => {
    const response = await api.post('/chat/message', { tenantId, message, sessionId });
    return response.data;
  },
  endSession: async (sessionId: string) => {
    const response = await api.post('/chat/end-session', { sessionId });
    return response.data;
  },
  getMetrics: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/chatbot-config/metrics', { params });
    return response.data;
  },
  getActiveSessions: async () => {
    const response = await api.get('/chatbot-config/sessions');
    return response.data;
  },
};

// Reports API
export const reportsAPI = {
  getDashboard: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },
  getFinancial: async (params?: { startDate?: string; endDate?: string; providerId?: string }) => {
    const response = await api.get('/reports/financial', { params });
    return response.data;
  },
  getAppointments: async (params?: { startDate?: string; endDate?: string; providerId?: string }) => {
    const response = await api.get('/reports/appointments', { params });
    return response.data;
  },
  getPatients: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/patients', { params });
    return response.data;
  },
  getTreatmentPlans: async (params?: { startDate?: string; endDate?: string; providerId?: string }) => {
    const response = await api.get('/reports/treatment-plans', { params });
    return response.data;
  },
  // Export functions
  exportFinancialExcel: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/financial/export/excel', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
  exportFinancialPdf: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/financial/export/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
  exportAppointmentsExcel: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/appointments/export/excel', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
  exportAppointmentsPdf: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/appointments/export/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
  exportPatientsExcel: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/patients/export/excel', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
  exportPatientsPdf: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/patients/export/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
};

// Audit Logs API
export const auditLogsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },
  exportCsv: async (params?: {
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/admin/audit-logs/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
};



// Patient Registration & Portal API (Phase 1.2)
export const patientRegistrationAPI = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    documentId: string;
    documentType?: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
  }) => {
    const response = await api.post('/portal/register', data);
    return response.data;
  },
  claimProfile: async (data: { documentId: string; documentType?: string }) => {
    const response = await api.post('/portal/claim-profile', data);
    return response.data;
  },
  getMyProviders: async () => {
    const response = await api.get('/portal/my-providers');
    return response.data;
  },
  getMyConsents: async () => {
    const response = await api.get('/portal/my-consents');
    return response.data;
  },
  updatePrivacy: async (data: { defaultDataAccess: string }) => {
    const response = await api.patch('/portal/privacy', data);
    return response.data;
  },
  revokeConsent: async (consentId: string) => {
    const response = await api.post("/portal/consents/" + consentId + "/revoke");
    return response.data;
  },
};

// Medical Exams API (Phase 1.2)
export const medicalExamsAPI = {
  upload: async (formData: FormData) => {
    const response = await api.post('/medical-exams', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/medical-exams');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get('/medical-exams/' + id);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete('/medical-exams/' + id);
    return response.data;
  },
};

export default api;
