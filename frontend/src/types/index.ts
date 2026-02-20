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

// Phase 4 - Patient Portal Advanced types

export interface HealthProfile {
  bloodType: string | null;
  allergies: string[];
  medications: string[];
  chronicConditions: string[];
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  dateOfBirth: string;
  gender: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  documentType: string;
  documentId: string;
  defaultDataAccess: DataAccessLevel;
}

export interface Notification {
  id: string;
  type: 'CONSENT_REQUEST' | 'APPOINTMENT_REMINDER' | 'EXAM_SHARED';
  title: string;
  message: string;
  data: Record<string, any>;
  createdAt: string;
  read: boolean;
}

export interface ExamShare {
  id: string;
  examId: string;
  examTitle: string;
  examType: string;
  providerId: string;
  providerName: string;
  sharedAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

export interface EnhancedDashboard {
  patient: { firstName: string; lastName: string };
  upcomingAppointments: Array<{
    id: string;
    date: string;
    procedure: string;
    provider: string;
    location: string;
  }>;
  recentInvoices: Array<{
    id: string;
    number: string;
    amount: number;
    status: string;
    date: string;
  }>;
  recentExams: Array<{
    id: string;
    title: string;
    examType: string;
    examDate: string;
  }>;
  stats: {
    providersCount: number;
    examsCount: number;
    pendingConsentsCount: number;
  };
}

// ==========================================
// Phase 5 - Clinic Admin Types
// ==========================================

export type ClinicStaffRole = 'RECEPTIONIST' | 'ADMIN' | 'MAINTENANCE';
export type RentalPeriod = 'HOURLY' | 'DAILY' | 'MONTHLY';
export type AssignmentType = 'RECURRING' | 'ONE_TIME' | 'RENTAL' | 'RENTAL_REQUEST';

export interface ClinicAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface ClinicDashboardData {
  clinicName: string;
  occupancy: {
    totalRooms: number;
    assignedRooms: number;
    availableRooms: number;
    occupancyPercentage: number;
  };
  revenue: {
    estimatedMonthlyRevenue: number;
    activeRentals: number;
  };
  staff: {
    totalStaff: number;
  };
  activeAssignments: number;
  pendingRequests: number;
}

export interface ClinicDetail {
  id: string;
  name: string;
  address: ClinicAddress | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  website: string | null;
  taxId: string | null;
  businessHours: Record<string, { open: string; close: string } | null> | null;
  specialties: string[];
  amenities: string[];
  rentalEnabled: boolean;
  rentalRateHourly: number | null;
  rentalRateDaily: number | null;
  rentalRateMonthly: number | null;
  isPublic: boolean;
  isActive: boolean;
  floors: number;
  adminUserId: string | null;
  createdAt: string;
  rooms: ClinicConsultationRoom[];
  clinicStaff: ClinicStaffMember[];
  admin: { id: string; name: string; email: string } | null;
}

export interface ClinicConsultationRoom {
  id: string;
  clinicId: string;
  name: string;
  floor: number;
  roomNumber: string | null;
  description: string | null;
  capabilities: string[];
  equipment: Record<string, any> | null;
  bufferMinutes: number;
  maxDailyHours: number;
  isShared: boolean;
  hourlyRate: number | null;
  isActive: boolean;
  createdAt: string;
  roomAssignments?: RoomAssignmentSummary[];
}

export interface RoomAssignmentSummary {
  id: string;
  providerId: string;
  schedule: Record<string, { start: string; end: string }[]>;
  startDate: string;
  endDate: string | null;
  assignmentType: AssignmentType;
  rentalRate: number | null;
  rentalPeriod: RentalPeriod | null;
  isActive: boolean;
}

export interface ClinicStaffMember {
  id: string;
  clinicId: string;
  userId: string;
  role: ClinicStaffRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicRentalRequest {
  id: string;
  roomId: string;
  providerId: string;
  tenantId: string;
  schedule: Record<string, { start: string; end: string }[]>;
  startDate: string;
  endDate: string | null;
  assignmentType: string;
  rentalRate: number | null;
  rentalPeriod: string | null;
  isActive: boolean;
  createdAt: string;
  room: {
    id: string;
    name: string;
    roomNumber: string | null;
  };
}

export interface RoomScheduleData {
  room: ClinicConsultationRoom;
  date: string;
  assignments: Array<{
    id: string;
    providerId: string;
    schedule: Record<string, { start: string; end: string }[]>;
    assignmentType: string;
    rentalRate: number | null;
  }>;
  appointments: Array<{
    id: string;
    providerId: string;
    appointmentDate: string;
    duration: number;
    procedureType: string;
    status: string;
    patient: { firstName: string; lastName: string };
  }>;
}

export interface ClinicOccupancyReport {
  period: { startDate: string; endDate: string };
  summary: {
    totalRooms: number;
    averageUtilization: number;
    totalAppointments: number;
  };
  rooms: Array<{
    roomId: string;
    roomName: string;
    roomNumber: string | null;
    totalAppointments: number;
    totalHoursBooked: number;
    totalAvailableHours: number;
    utilizationPercentage: number;
    activeAssignments: number;
  }>;
}

export interface ClinicRevenueReport {
  period: { startDate: string; endDate: string };
  summary: {
    totalRevenue: number;
    activeRentals: number;
  };
  rooms: Array<{
    roomId: string;
    roomName: string;
    roomNumber: string | null;
    totalRevenue: number;
    rentalCount: number;
  }>;
}
