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

// Phase 1.2 - Independent Patient Entity Types

export type DataAccessLevel = 'FULL' | 'CLINICAL_ONLY' | 'SCHEDULING_ONLY' | 'DOCUMENTS_SHARED' | 'MINIMAL';

export type ConsentStatus = 'PENDING' | 'GRANTED' | 'DENIED' | 'REVOKED' | 'EXPIRED';

export type ProviderPatientRelationType = 'REGISTERED_BY_PROVIDER' | 'LINKED_BY_PATIENT' | 'MUTUAL' | 'PROVIDER_ONLY';

export interface PatientConsent {
  id: string;
  patientId: string;
  providerId: string;
  dataAccessLevel: DataAccessLevel;
  shareAppointments: boolean;
  shareMedicalHistory: boolean;
  shareDocuments: boolean;
  shareLabResults: boolean;
  shareBilling: boolean;
  status: ConsentStatus;
  grantedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
  requestedBy: string;
  reason: string | null;
  createdAt: string;
}

export interface ProviderRelation {
  id: string;
  providerId: string;
  providerName: string;
  providerEmail: string;
  providerSpecialties: string[];
  practiceName: string;
  relationType: ProviderPatientRelationType;
  dataAccessLevel: DataAccessLevel;
  startedAt: string;
}

export interface MedicalExam {
  id: string;
  patientId: string;
  title: string;
  examType: string;
  description: string | null;
  examDate: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  aiSummary: string | null;
  aiProcessed: boolean;
  tags: string[];
  createdAt: string;
}

export interface SharedDocument {
  id: string;
  patientId: string;
  documentId: string;
  providerId: string;
  sharedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  isActive: boolean;
}
