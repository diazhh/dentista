/**
 * Auth test helpers – provides mock user objects and JWT token generators
 * for use in both unit and e2e tests.
 */

export const mockUsers = {
  superAdmin: {
    id: 'sa-001',
    email: 'admin@medicloud.com',
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    passwordHash: '$2b$10$hashedpassword',
    ownedTenants: [],
    tenantMemberships: [],
  },
  provider: {
    id: 'prov-001',
    email: 'dentist@dentista.com',
    name: 'Dr. Smith',
    role: 'PROVIDER',
    passwordHash: '$2b$10$hashedpassword',
    ownedTenants: [{ id: 'tenant-001', name: 'DrSmith Clinic', subdomain: 'drsmith' }],
    tenantMemberships: [],
  },
  patient: {
    id: 'pat-user-001',
    email: 'patient@dentista.com',
    name: 'Jane Doe',
    role: 'PATIENT',
    passwordHash: '$2b$10$hashedpassword',
    ownedTenants: [],
    tenantMemberships: [
      { tenantId: 'tenant-001', role: 'PATIENT', isActive: true },
    ],
  },
  clinicAdmin: {
    id: 'ca-001',
    email: 'clinicadmin@medicloud.com',
    name: 'Ricardo Vargas',
    role: 'CLINIC_ADMIN',
    passwordHash: '$2b$10$hashedpassword',
    ownedTenants: [],
    tenantMemberships: [
      { tenantId: 'tenant-001', role: 'CLINIC_ADMIN', isActive: true },
    ],
  },
};

export const mockTenants = {
  drsmith: {
    id: 'tenant-001',
    name: 'DrSmith Clinic',
    subdomain: 'drsmith',
    ownerId: 'prov-001',
    subscriptionTier: 'PROFESSIONAL',
    subscriptionStatus: 'ACTIVE',
  },
  medicentro: {
    id: 'tenant-002',
    name: 'MediCentro',
    subdomain: 'medicentro',
    ownerId: 'prov-002',
    subscriptionTier: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
  },
};

export const mockPatients = {
  janeDoe: {
    id: 'patient-001',
    userId: 'pat-user-001',
    firstName: 'Jane',
    lastName: 'Doe',
    documentId: '001-1234567-8',
    phone: '+18095551234',
    dateOfBirth: new Date('1990-03-15'),
    gender: 'FEMALE',
    allergies: ['Penicillin'],
    medications: [],
    medicalHistory: [],
  },
  johnSmith: {
    id: 'patient-002',
    userId: 'pat-user-002',
    firstName: 'John',
    lastName: 'Smith',
    documentId: '002-7654321-0',
    phone: '+18095555678',
    dateOfBirth: new Date('1985-07-22'),
    gender: 'MALE',
    allergies: [],
    medications: ['Metformin'],
    medicalHistory: ['Diabetes Type 2'],
  },
};
