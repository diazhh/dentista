export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  maxPatients: number;
  storageGB: number;
  createdAt: string;
  owner: User;
  _count: {
    appointments: number;
    memberships: number;
  };
}

export interface SystemMetrics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalAppointments: number;
  appointmentsThisMonth: number;
  tenantsByTier: Array<{ subscriptionTier: string; _count: number }>;
  tenantsByStatus: Array<{ subscriptionStatus: string; _count: number }>;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  newTenantsThisMonth: number;
  revenueByTier: Array<{
    tier: string;
    count: number;
    revenue: number;
  }>;
}

export interface TenantActivity {
  tenantId: string;
  tenantName: string;
  subscriptionTier: string;
  appointmentCount: number;
}
