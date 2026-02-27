import {
  PrismaClient,
  UserRole,
  MedicalSpecialty,
  SubscriptionTier,
  SubscriptionStatus,
  Gender,
  AppointmentStatus,
  ConsentStatus,
  DataAccessLevel,
  TreatmentPlanStatus,
  TreatmentItemStatus,
  ToothCondition,
  ToothSurface,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================================
// Helper: days relative to now
// ============================================================
function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
function weeksAgo(weeks: number): Date {
  return daysFromNow(-weeks * 7);
}

async function main() {
  console.log('🌱 Starting comprehensive multi-discipline seed...\n');

  // ============================================================
  // CLEANUP: Delete non-upsertable data to allow re-running
  // ============================================================
  console.log('🧹 Cleaning up previous seed data...');
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.waitlist.deleteMany({});
  await prisma.recurringAppointment.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.sharedDocument.deleteMany({});
  await prisma.medicalExam.deleteMany({});
  await prisma.gynecologicalExam.deleteMany({});
  await prisma.bodyMeasurement.deleteMany({});
  await prisma.nutritionPlan.deleteMany({});
  await prisma.vaccinationRecord.deleteMany({});
  await prisma.growthRecord.deleteMany({});
  await prisma.cardiacAssessment.deleteMany({});
  await prisma.lensPrescription.deleteMany({});
  await prisma.eyeExam.deleteMany({});
  await prisma.skinLesion.deleteMany({});
  await prisma.functionalAssessment.deleteMany({});
  await prisma.exercisePlan.deleteMany({});
  await prisma.psychologicalAssessment.deleteMany({});
  await prisma.therapySession.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.clinicalNote.deleteMany({});
  await prisma.odontogramTooth.deleteMany({});
  await prisma.odontogram.deleteMany({});
  await prisma.treatmentPlanItem.deleteMany({});
  await prisma.treatmentPlan.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.patientConsent.deleteMany({});
  console.log('  ✅ Cleanup complete');

  // ============================================================
  // SECTION 1: PASSWORD HASHING
  // ============================================================
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const dentistPassword = await bcrypt.hash('Dentist123!', 10);
  const dentist2Password = await bcrypt.hash('Dentist456!', 10);
  const dentist3Password = await bcrypt.hash('Dentist789!', 10);
  const staffPassword = await bcrypt.hash('Staff123!', 10);
  const staff2Password = await bcrypt.hash('Staff456!', 10);
  const assistantPassword = await bcrypt.hash('Assistant123!', 10);
  const patientPassword = await bcrypt.hash('Patient123!', 10);
  const patient2Password = await bcrypt.hash('Patient456!', 10);
  const providerPassword = await bcrypt.hash('Provider123!', 10);
  const clinicAdminPassword = await bcrypt.hash('ClinicAdmin123!', 10);

  // ============================================================
  // SECTION 2: USERS — Existing
  // ============================================================
  console.log('👤 Creating users...');

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@dentista.com' },
    update: {},
    create: {
      email: 'admin@dentista.com',
      name: 'Super Admin',
      passwordHash: adminPassword,
      phone: '+1234567890',
      role: UserRole.SUPER_ADMIN,
    },
  });

  const dentistUser = await prisma.user.upsert({
    where: { email: 'dentist@dentista.com' },
    update: {},
    create: {
      email: 'dentist@dentista.com',
      name: 'Dr. John Smith',
      passwordHash: dentistPassword,
      phone: '+1234567891',
      role: UserRole.PROVIDER,
      licenseNumber: 'DDS-12345',
      npiNumber: '1234567890',
      specialties: [MedicalSpecialty.GENERAL_DENTISTRY],
      bio: 'Odontólogo general con más de 15 años de experiencia en restauraciones y estética dental.',
    },
  });

  const dentist2User = await prisma.user.upsert({
    where: { email: 'dentist2@dentista.com' },
    update: {},
    create: {
      email: 'dentist2@dentista.com',
      name: 'Dr. Maria Garcia',
      passwordHash: dentist2Password,
      phone: '+1234567894',
      role: UserRole.PROVIDER,
      licenseNumber: 'DDS-67890',
      npiNumber: '0987654321',
      specialties: [MedicalSpecialty.ORTHODONTICS],
      bio: 'Ortodoncista especializada en tratamientos de alineación con tecnología Invisalign.',
    },
  });

  const dentist3User = await prisma.user.upsert({
    where: { email: 'dentist3@dentista.com' },
    update: {},
    create: {
      email: 'dentist3@dentista.com',
      name: 'Dr. Robert Chen',
      passwordHash: dentist3Password,
      phone: '+1234567897',
      role: UserRole.PROVIDER,
      licenseNumber: 'DDS-11111',
      npiNumber: '1111111111',
      specialties: [MedicalSpecialty.GENERAL_DENTISTRY],
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@dentista.com' },
    update: {},
    create: {
      email: 'staff@dentista.com',
      name: 'Sarah Johnson',
      passwordHash: staffPassword,
      phone: '+1234567895',
      role: UserRole.STAFF_RECEPTIONIST,
    },
  });

  const staff2User = await prisma.user.upsert({
    where: { email: 'staff2@dentista.com' },
    update: {},
    create: {
      email: 'staff2@dentista.com',
      name: 'Michael Brown',
      passwordHash: staff2Password,
      phone: '+1234567898',
      role: UserRole.STAFF_RECEPTIONIST,
    },
  });

  const assistantUser = await prisma.user.upsert({
    where: { email: 'assistant@dentista.com' },
    update: {},
    create: {
      email: 'assistant@dentista.com',
      name: 'Lisa Martinez',
      passwordHash: assistantPassword,
      phone: '+1234567899',
      role: UserRole.STAFF_ASSISTANT,
    },
  });

  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@dentista.com' },
    update: {},
    create: {
      email: 'patient@dentista.com',
      name: 'Jane Doe',
      passwordHash: patientPassword,
      phone: '+1234567892',
      role: UserRole.PATIENT,
    },
  });

  const patient2User = await prisma.user.upsert({
    where: { email: 'patient2@dentista.com' },
    update: {},
    create: {
      email: 'patient2@dentista.com',
      name: 'John Smith',
      passwordHash: patient2Password,
      phone: '+1234567896',
      role: UserRole.PATIENT,
    },
  });

  console.log('  ✅ 9 existing users created');

  // ============================================================
  // SECTION 3: USERS — New Multi-Discipline Providers
  // ============================================================

  const medGeneralUser = await prisma.user.upsert({
    where: { email: 'medgeneral@medicloud.com' },
    update: {},
    create: {
      email: 'medgeneral@medicloud.com',
      name: 'Dra. Ana Mejía',
      passwordHash: providerPassword,
      phone: '+18091001001',
      role: UserRole.PROVIDER,
      licenseNumber: 'MED-10001',
      npiNumber: '2000000001',
      specialties: [MedicalSpecialty.GENERAL_MEDICINE],
      bio: 'Médico general con enfoque en medicina preventiva y atención primaria integral.',
    },
  });

  const psicologoUser = await prisma.user.upsert({
    where: { email: 'psicologo@medicloud.com' },
    update: {},
    create: {
      email: 'psicologo@medicloud.com',
      name: 'Dr. Carlos Pérez',
      passwordHash: providerPassword,
      phone: '+18091001002',
      role: UserRole.PROVIDER,
      licenseNumber: 'PSI-20001',
      npiNumber: '2000000002',
      specialties: [MedicalSpecialty.PSYCHOLOGY],
      bio: 'Psicólogo clínico especializado en terapia cognitivo-conductual y manejo de ansiedad.',
    },
  });

  const fisioUser = await prisma.user.upsert({
    where: { email: 'fisio@medicloud.com' },
    update: {},
    create: {
      email: 'fisio@medicloud.com',
      name: 'Dra. Laura Torres',
      passwordHash: providerPassword,
      phone: '+18091001003',
      role: UserRole.PROVIDER,
      licenseNumber: 'FIS-30001',
      npiNumber: '2000000003',
      specialties: [MedicalSpecialty.PHYSIOTHERAPY],
      bio: 'Fisioterapeuta con especialidad en rehabilitación deportiva y lesiones musculoesqueléticas.',
    },
  });

  const dermaUser = await prisma.user.upsert({
    where: { email: 'dermatologo@medicloud.com' },
    update: {},
    create: {
      email: 'dermatologo@medicloud.com',
      name: 'Dr. Marcos Ruiz',
      passwordHash: providerPassword,
      phone: '+18091001004',
      role: UserRole.PROVIDER,
      licenseNumber: 'DER-40001',
      npiNumber: '2000000004',
      specialties: [MedicalSpecialty.DERMATOLOGY],
      bio: 'Dermatólogo con experiencia en dermatitis, lesiones cutáneas y dermatoscopia.',
    },
  });

  const oftalmoUser = await prisma.user.upsert({
    where: { email: 'oftalmologo@medicloud.com' },
    update: {},
    create: {
      email: 'oftalmologo@medicloud.com',
      name: 'Dra. Sofía Vega',
      passwordHash: providerPassword,
      phone: '+18091001005',
      role: UserRole.PROVIDER,
      licenseNumber: 'OFT-50001',
      npiNumber: '2000000005',
      specialties: [MedicalSpecialty.OPHTHALMOLOGY],
      bio: 'Oftalmóloga especializada en glaucoma, cataratas y cirugía refractiva.',
    },
  });

  const cardioUser = await prisma.user.upsert({
    where: { email: 'cardiologo@medicloud.com' },
    update: {},
    create: {
      email: 'cardiologo@medicloud.com',
      name: 'Dr. Andrés Gómez',
      passwordHash: providerPassword,
      phone: '+18091001006',
      role: UserRole.PROVIDER,
      licenseNumber: 'CAR-60001',
      npiNumber: '2000000006',
      specialties: [MedicalSpecialty.CARDIOLOGY],
      bio: 'Cardiólogo intervencionista con experiencia en hipertensión y riesgo cardiovascular.',
    },
  });

  const pediatraUser = await prisma.user.upsert({
    where: { email: 'pediatra@medicloud.com' },
    update: {},
    create: {
      email: 'pediatra@medicloud.com',
      name: 'Dra. Isabel Moreno',
      passwordHash: providerPassword,
      phone: '+18091001007',
      role: UserRole.PROVIDER,
      licenseNumber: 'PED-70001',
      npiNumber: '2000000007',
      specialties: [MedicalSpecialty.PEDIATRICS],
      bio: 'Pediatra con enfoque en crecimiento infantil, vacunación y atención integral del niño.',
    },
  });

  const nutriUser = await prisma.user.upsert({
    where: { email: 'nutricionista@medicloud.com' },
    update: {},
    create: {
      email: 'nutricionista@medicloud.com',
      name: 'Lic. Diana Castro',
      passwordHash: providerPassword,
      phone: '+18091001008',
      role: UserRole.PROVIDER,
      licenseNumber: 'NUT-80001',
      npiNumber: '2000000008',
      specialties: [MedicalSpecialty.NUTRITION],
      bio: 'Nutricionista clínica especializada en planes alimentarios para diabetes, obesidad y rendimiento deportivo.',
    },
  });

  const ginecoUser = await prisma.user.upsert({
    where: { email: 'ginecologa@medicloud.com' },
    update: {},
    create: {
      email: 'ginecologa@medicloud.com',
      name: 'Dra. Valentina Ríos',
      passwordHash: providerPassword,
      phone: '+18091001009',
      role: UserRole.PROVIDER,
      licenseNumber: 'GIN-90001',
      npiNumber: '2000000009',
      specialties: [MedicalSpecialty.GYNECOLOGY],
      bio: 'Ginecóloga obstetra con experiencia en control prenatal y medicina reproductiva.',
    },
  });

  // Clinic Admin User
  const clinicAdminUser = await prisma.user.upsert({
    where: { email: 'clinicadmin@medicloud.com' },
    update: {},
    create: {
      email: 'clinicadmin@medicloud.com',
      name: 'Ricardo Vargas',
      passwordHash: clinicAdminPassword,
      phone: '+18091001010',
      role: UserRole.CLINIC_ADMIN,
    },
  });

  console.log('  ✅ 10 new users created (9 providers + 1 clinic admin)');

  // ============================================================
  // SECTION 4: TENANTS — Existing + New
  // ============================================================
  console.log('🏢 Creating tenants...');

  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'drsmith' },
    update: {},
    create: {
      ownerId: dentistUser.id,
      name: 'Dr. Smith Dental Practice',
      subdomain: 'drsmith',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      trialEndsAt: daysFromNow(30),
      maxPatients: 500,
      storageGB: 10,
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { subdomain: 'drgarcia' },
    update: {},
    create: {
      ownerId: dentist2User.id,
      name: 'Dr. Garcia Orthodontics',
      subdomain: 'drgarcia',
      subscriptionTier: SubscriptionTier.STARTER,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      trialEndsAt: daysFromNow(14),
      maxPatients: 100,
      storageGB: 5,
    },
  });

  const tenant3 = await prisma.tenant.upsert({
    where: { subdomain: 'smilecare' },
    update: {},
    create: {
      ownerId: superAdmin.id,
      name: 'Smile Care Dental Center',
      subdomain: 'smilecare',
      subscriptionTier: SubscriptionTier.ENTERPRISE,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      trialEndsAt: null,
      maxPatients: -1,
      storageGB: 100,
    },
  });

  const tenant4 = await prisma.tenant.upsert({
    where: { subdomain: 'brightsmile' },
    update: {},
    create: {
      ownerId: superAdmin.id,
      name: 'Bright Smile Clinic',
      subdomain: 'brightsmile',
      subscriptionTier: SubscriptionTier.STARTER,
      subscriptionStatus: SubscriptionStatus.CANCELLED,
      trialEndsAt: daysFromNow(-5),
      maxPatients: 100,
      storageGB: 5,
    },
  });

  const tenant5 = await prisma.tenant.upsert({
    where: { subdomain: 'dentalplus' },
    update: {},
    create: {
      ownerId: superAdmin.id,
      name: 'Dental Plus Associates',
      subdomain: 'dentalplus',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      trialEndsAt: daysFromNow(7),
      maxPatients: 500,
      storageGB: 20,
    },
  });

  // --- New multi-discipline tenants ---
  const tenantMedicentro = await prisma.tenant.upsert({
    where: { subdomain: 'medicentro' },
    update: {},
    create: {
      ownerId: medGeneralUser.id,
      name: 'MediCentro Integral',
      subdomain: 'medicentro',
      subscriptionTier: SubscriptionTier.ENTERPRISE,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      trialEndsAt: null,
      maxPatients: -1,
      storageGB: 100,
    },
  });

  const tenantRehab = await prisma.tenant.upsert({
    where: { subdomain: 'rehabplus' },
    update: {},
    create: {
      ownerId: fisioUser.id,
      name: 'RehabPlus Fisioterapia',
      subdomain: 'rehabplus',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      trialEndsAt: null,
      maxPatients: 500,
      storageGB: 20,
    },
  });

  const tenantVision = await prisma.tenant.upsert({
    where: { subdomain: 'visiontotal' },
    update: {},
    create: {
      ownerId: oftalmoUser.id,
      name: 'VisiónTotal Oftalmología',
      subdomain: 'visiontotal',
      subscriptionTier: SubscriptionTier.STARTER,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      trialEndsAt: daysFromNow(14),
      maxPatients: 100,
      storageGB: 5,
    },
  });

  const tenantPedicare = await prisma.tenant.upsert({
    where: { subdomain: 'pedicare' },
    update: {},
    create: {
      ownerId: pediatraUser.id,
      name: 'PediCare Pediatría',
      subdomain: 'pedicare',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      trialEndsAt: null,
      maxPatients: 500,
      storageGB: 20,
    },
  });

  console.log('  ✅ 9 tenants created (5 existing + 4 new)');

  // ============================================================
  // SECTION 5: TENANT MEMBERSHIPS
  // ============================================================
  console.log('🔗 Creating tenant memberships...');

  const membershipData = [
    { userId: dentistUser.id, tenantId: tenant.id, role: UserRole.PROVIDER },
    { userId: staffUser.id, tenantId: tenant.id, role: UserRole.STAFF_RECEPTIONIST },
    { userId: dentist2User.id, tenantId: tenant2.id, role: UserRole.PROVIDER },
    { userId: dentist3User.id, tenantId: tenant3.id, role: UserRole.PROVIDER },
    { userId: staff2User.id, tenantId: tenant3.id, role: UserRole.STAFF_RECEPTIONIST },
    { userId: assistantUser.id, tenantId: tenant3.id, role: UserRole.STAFF_ASSISTANT },
    // New multi-discipline memberships
    { userId: medGeneralUser.id, tenantId: tenantMedicentro.id, role: UserRole.PROVIDER },
    { userId: psicologoUser.id, tenantId: tenantMedicentro.id, role: UserRole.PROVIDER },
    { userId: dermaUser.id, tenantId: tenantMedicentro.id, role: UserRole.PROVIDER },
    { userId: cardioUser.id, tenantId: tenantMedicentro.id, role: UserRole.PROVIDER },
    { userId: nutriUser.id, tenantId: tenantMedicentro.id, role: UserRole.PROVIDER },
    { userId: ginecoUser.id, tenantId: tenantMedicentro.id, role: UserRole.PROVIDER },
    { userId: fisioUser.id, tenantId: tenantRehab.id, role: UserRole.PROVIDER },
    { userId: oftalmoUser.id, tenantId: tenantVision.id, role: UserRole.PROVIDER },
    { userId: pediatraUser.id, tenantId: tenantPedicare.id, role: UserRole.PROVIDER },
  ];

  for (const m of membershipData) {
    await prisma.tenantMembership.upsert({
      where: { userId_tenantId: { userId: m.userId, tenantId: m.tenantId } },
      update: {},
      create: { ...m, isActive: true },
    });
  }
  console.log('  ✅ 15 tenant memberships created');

  // ============================================================
  // SECTION 6: PATIENTS — Existing + 6 New
  // ============================================================
  console.log('🧑‍⚕️ Creating patients...');

  const patient = await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      documentId: '001-1234567-8',
      phone: '+1-555-0123',
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-05-15'),
      gender: Gender.FEMALE,
      allergies: ['Penicillin'],
      medications: ['Aspirin'],
      medicalHistory: { conditions: ['Hypertension'], surgeries: [] },
      bloodType: 'A+',
      portalEnabled: true,
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { userId: patient2User.id },
    update: {},
    create: {
      userId: patient2User.id,
      documentId: '002-9876543-2',
      phone: '+1-555-0124',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: new Date('1985-08-20'),
      gender: Gender.MALE,
      allergies: [],
      medications: [],
      medicalHistory: { conditions: [], surgeries: ['Appendectomy 2010'] },
      bloodType: 'O+',
      portalEnabled: true,
    },
  });

  // --- New patient users ---
  const mariaSantosUser = await prisma.user.upsert({
    where: { email: 'maria.santos@mail.com' },
    update: {},
    create: {
      email: 'maria.santos@mail.com',
      name: 'María Santos',
      passwordHash: patientPassword,
      phone: '+18091002001',
      role: UserRole.PATIENT,
    },
  });
  const patMaria = await prisma.patient.upsert({
    where: { documentType_documentId: { documentType: 'CEDULA', documentId: '003-1111111-1' } },
    update: {},
    create: {
      userId: mariaSantosUser.id,
      documentId: '003-1111111-1',
      phone: '+18091002001',
      firstName: 'María',
      lastName: 'Santos',
      dateOfBirth: new Date('1997-09-12'),
      gender: Gender.FEMALE,
      bloodType: 'O+',
      allergies: [],
      medications: ['Ácido fólico 5mg', 'Hierro 325mg'],
      chronicConditions: [],
      medicalHistory: { conditions: [], surgeries: [] },
      emergencyContactName: 'José Santos',
      emergencyContactPhone: '+18091002099',
      emergencyContactRelation: 'Esposo',
      portalEnabled: true,
    },
  });

  const pedroRamirezUser = await prisma.user.upsert({
    where: { email: 'pedro.ramirez@mail.com' },
    update: {},
    create: {
      email: 'pedro.ramirez@mail.com',
      name: 'Pedro Ramírez',
      passwordHash: patientPassword,
      phone: '+18091002002',
      role: UserRole.PATIENT,
    },
  });
  const patPedro = await prisma.patient.upsert({
    where: { documentType_documentId: { documentType: 'CEDULA', documentId: '004-2222222-2' } },
    update: {},
    create: {
      userId: pedroRamirezUser.id,
      documentId: '004-2222222-2',
      phone: '+18091002002',
      firstName: 'Pedro',
      lastName: 'Ramírez',
      dateOfBirth: new Date('1970-03-25'),
      gender: Gender.MALE,
      bloodType: 'B+',
      allergies: ['Sulfonamidas'],
      medications: ['Losartán 50mg', 'Metformina 850mg', 'Atorvastatina 20mg'],
      chronicConditions: ['Hipertensión arterial', 'Diabetes mellitus tipo 2', 'Dislipidemia'],
      medicalHistory: { conditions: ['HTA diagnosticada 2010', 'DM2 diagnosticada 2015'], surgeries: ['Colecistectomía 2018'] },
      emergencyContactName: 'Rosa Ramírez',
      emergencyContactPhone: '+18091002098',
      emergencyContactRelation: 'Esposa',
      portalEnabled: true,
    },
  });

  const luciaFernandezUser = await prisma.user.upsert({
    where: { email: 'lucia.fernandez@mail.com' },
    update: {},
    create: {
      email: 'lucia.fernandez@mail.com',
      name: 'Lucía Fernández',
      passwordHash: patientPassword,
      phone: '+18091002003',
      role: UserRole.PATIENT,
    },
  });
  const patLucia = await prisma.patient.upsert({
    where: { documentType_documentId: { documentType: 'CEDULA', documentId: '005-3333333-3' } },
    update: {},
    create: {
      userId: luciaFernandezUser.id,
      documentId: '005-3333333-3',
      phone: '+18091002003',
      firstName: 'Lucía',
      lastName: 'Fernández',
      dateOfBirth: new Date('2017-11-08'),
      gender: Gender.FEMALE,
      bloodType: 'A-',
      allergies: ['Ácaros del polvo'],
      medications: ['Salbutamol inhalador PRN'],
      chronicConditions: ['Asma bronquial leve'],
      medicalHistory: { conditions: ['Asma desde los 3 años'], surgeries: [] },
      emergencyContactName: 'Carolina Fernández',
      emergencyContactPhone: '+18091002097',
      emergencyContactRelation: 'Madre',
      portalEnabled: true,
    },
  });

  const robertoDiazUser = await prisma.user.upsert({
    where: { email: 'roberto.diaz@mail.com' },
    update: {},
    create: {
      email: 'roberto.diaz@mail.com',
      name: 'Roberto Díaz',
      passwordHash: patientPassword,
      phone: '+18091002004',
      role: UserRole.PATIENT,
    },
  });
  const patRoberto = await prisma.patient.upsert({
    where: { documentType_documentId: { documentType: 'CEDULA', documentId: '006-4444444-4' } },
    update: {},
    create: {
      userId: robertoDiazUser.id,
      documentId: '006-4444444-4',
      phone: '+18091002004',
      firstName: 'Roberto',
      lastName: 'Díaz',
      dateOfBirth: new Date('1983-06-14'),
      gender: Gender.MALE,
      bloodType: 'AB+',
      allergies: [],
      medications: ['Ibuprofeno 400mg PRN'],
      chronicConditions: [],
      medicalHistory: { conditions: [], surgeries: ['Artroscopía rodilla derecha 2020'] },
      emergencyContactName: 'Elena Díaz',
      emergencyContactPhone: '+18091002096',
      emergencyContactRelation: 'Esposa',
      portalEnabled: true,
    },
  });

  const carmenLopezUser = await prisma.user.upsert({
    where: { email: 'carmen.lopez@mail.com' },
    update: {},
    create: {
      email: 'carmen.lopez@mail.com',
      name: 'Carmen López',
      passwordHash: patientPassword,
      phone: '+18091002005',
      role: UserRole.PATIENT,
    },
  });
  const patCarmen = await prisma.patient.upsert({
    where: { documentType_documentId: { documentType: 'CEDULA', documentId: '007-5555555-5' } },
    update: {},
    create: {
      userId: carmenLopezUser.id,
      documentId: '007-5555555-5',
      phone: '+18091002005',
      firstName: 'Carmen',
      lastName: 'López',
      dateOfBirth: new Date('1960-01-30'),
      gender: Gender.FEMALE,
      bloodType: 'O-',
      allergies: ['Contraste yodado'],
      medications: ['Timolol colirio 0.5%', 'Amlodipino 5mg'],
      chronicConditions: ['Glaucoma de ángulo abierto', 'Hipertensión arterial', 'Cataratas incipientes'],
      medicalHistory: { conditions: ['Glaucoma diagnosticado 2019', 'HTA diagnosticada 2005'], surgeries: [] },
      emergencyContactName: 'Luis López',
      emergencyContactPhone: '+18091002095',
      emergencyContactRelation: 'Hijo',
      portalEnabled: true,
    },
  });

  const andresMartinezUser = await prisma.user.upsert({
    where: { email: 'andres.martinez@mail.com' },
    update: {},
    create: {
      email: 'andres.martinez@mail.com',
      name: 'Andrés Martínez',
      passwordHash: patientPassword,
      phone: '+18091002006',
      role: UserRole.PATIENT,
    },
  });
  const patAndres = await prisma.patient.upsert({
    where: { documentType_documentId: { documentType: 'CEDULA', documentId: '008-6666666-6' } },
    update: {},
    create: {
      userId: andresMartinezUser.id,
      documentId: '008-6666666-6',
      phone: '+18091002006',
      firstName: 'Andrés',
      lastName: 'Martínez',
      dateOfBirth: new Date('1990-07-22'),
      gender: Gender.MALE,
      bloodType: 'A+',
      allergies: ['Mariscos'],
      medications: [],
      chronicConditions: ['Dermatitis atópica', 'Trastorno de ansiedad generalizada'],
      medicalHistory: { conditions: ['Dermatitis desde la infancia', 'Ansiedad diagnosticada 2023'], surgeries: [] },
      emergencyContactName: 'Patricia Martínez',
      emergencyContactPhone: '+18091002094',
      emergencyContactRelation: 'Madre',
      portalEnabled: true,
    },
  });

  console.log('  ✅ 8 patients created (2 existing + 6 new)');

  // ============================================================
  // SECTION 7: CLINICS + CONSULTATION ROOMS + ASSIGNMENTS
  // ============================================================
  console.log('🏥 Creating clinics and rooms...');

  const clinic1 = await prisma.clinic.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Downtown Dental Clinic',
      address: { street: '123 Main Street', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' },
      phone: '+1234567893',
      email: 'info@downtowndental.com',
      createdBy: superAdmin.id,
    },
  });

  const room1 = await prisma.consultationRoom.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      clinicId: clinic1.id,
      name: 'Room 1',
      description: 'Main treatment room with digital X-ray',
      equipment: { chair: 'Adec 500', xray: 'Digital Panoramic', light: 'LED Operatory Light' },
    },
  });

  await prisma.roomAssignment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000020' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000020',
      roomId: room1.id,
      providerId: dentistUser.id,
      tenantId: tenant.id,
      schedule: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '15:00' },
      },
      startDate: new Date(),
    },
  });

  // --- New multi-discipline clinic ---
  const clinic2 = await prisma.clinic.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Centro Médico Integrado',
      address: { street: 'Av. 27 de Febrero #45', city: 'Santo Domingo', state: 'DN', zipCode: '10100', country: 'DO' },
      phone: '+18095551234',
      email: 'info@centromedicointegrado.com',
      adminUserId: clinicAdminUser.id,
      createdBy: clinicAdminUser.id,
      floors: 2,
      description: 'Centro médico multidisciplinario con consultorios equipados para diversas especialidades.',
      specialties: [
        MedicalSpecialty.GENERAL_MEDICINE,
        MedicalSpecialty.CARDIOLOGY,
        MedicalSpecialty.DERMATOLOGY,
        MedicalSpecialty.OPHTHALMOLOGY,
        MedicalSpecialty.PHYSIOTHERAPY,
        MedicalSpecialty.NUTRITION,
        MedicalSpecialty.PSYCHOLOGY,
        MedicalSpecialty.GYNECOLOGY,
      ],
      amenities: ['wifi', 'parking', 'wheelchair_access', 'pharmacy', 'lab', 'waiting_room'],
      rentalEnabled: true,
      rentalRateHourly: 50.0,
      rentalRateDaily: 350.0,
      businessHours: {
        monday: { open: '07:00', close: '20:00' },
        tuesday: { open: '07:00', close: '20:00' },
        wednesday: { open: '07:00', close: '20:00' },
        thursday: { open: '07:00', close: '20:00' },
        friday: { open: '07:00', close: '18:00' },
        saturday: { open: '08:00', close: '13:00' },
        sunday: null,
      },
    },
  });

  const roomGeneral = await prisma.consultationRoom.create({
    data: {
      clinicId: clinic2.id,
      name: 'Consultorio General',
      floor: 1,
      roomNumber: '101',
      description: 'Consultorio de medicina general y cardiología',
      capabilities: ['general_exam', 'ecg', 'blood_pressure', 'spirometry'],
      equipment: { examTable: 'Ritter 204', ecg: 'Edan SE-1200', tensiometro: 'Omron HEM-7120' },
      isShared: true,
      hourlyRate: 50.0,
    },
  });

  const roomFisio = await prisma.consultationRoom.create({
    data: {
      clinicId: clinic2.id,
      name: 'Sala de Fisioterapia',
      floor: 1,
      roomNumber: '102',
      description: 'Sala equipada para rehabilitación física',
      capabilities: ['physiotherapy', 'exercise', 'electrotherapy', 'ultrasound'],
      equipment: { camilla: 'Chattanooga Galaxy', ultrasonido: 'Intelect Mobile 2', TENS: 'Chattanooga Continuum' },
      isShared: true,
      hourlyRate: 45.0,
    },
  });

  const roomOftalmo = await prisma.consultationRoom.create({
    data: {
      clinicId: clinic2.id,
      name: 'Consultorio Oftalmología',
      floor: 2,
      roomNumber: '201',
      description: 'Consultorio equipado para exámenes oftalmológicos completos',
      capabilities: ['eye_exam', 'tonometry', 'fundoscopy', 'perimetry'],
      equipment: { sillaSlit: 'Topcon SL-D4', tonometro: 'Goldmann', autorefractor: 'Topcon KR-800' },
      isShared: false,
      hourlyRate: 60.0,
    },
  });

  // Room assignments for new clinic
  await prisma.roomAssignment.create({
    data: {
      roomId: roomGeneral.id,
      providerId: medGeneralUser.id,
      tenantId: tenantMedicentro.id,
      schedule: {
        monday: { start: '08:00', end: '12:00' },
        wednesday: { start: '08:00', end: '12:00' },
        friday: { start: '08:00', end: '12:00' },
      },
      startDate: new Date(),
      assignmentType: 'RECURRING',
    },
  });

  await prisma.roomAssignment.create({
    data: {
      roomId: roomGeneral.id,
      providerId: cardioUser.id,
      tenantId: tenantMedicentro.id,
      schedule: {
        tuesday: { start: '08:00', end: '14:00' },
        thursday: { start: '08:00', end: '14:00' },
      },
      startDate: new Date(),
      assignmentType: 'RECURRING',
    },
  });

  await prisma.roomAssignment.create({
    data: {
      roomId: roomFisio.id,
      providerId: fisioUser.id,
      tenantId: tenantRehab.id,
      schedule: {
        monday: { start: '07:00', end: '15:00' },
        tuesday: { start: '07:00', end: '15:00' },
        wednesday: { start: '07:00', end: '15:00' },
        thursday: { start: '07:00', end: '15:00' },
        friday: { start: '07:00', end: '13:00' },
      },
      startDate: new Date(),
      assignmentType: 'RENTAL',
      rentalRate: 45.0,
      rentalPeriod: 'MONTHLY',
    },
  });

  console.log('  ✅ 2 clinics, 4 rooms, 4 room assignments created');

  // ============================================================
  // SECTION 8: CLINIC STAFF
  // ============================================================
  console.log('👥 Creating clinic staff...');

  // Staff users for new clinic
  const recepcionistaUser = await prisma.user.upsert({
    where: { email: 'recepcion@medicloud.com' },
    update: {},
    create: {
      email: 'recepcion@medicloud.com',
      name: 'Ana Belén Rodríguez',
      passwordHash: staffPassword,
      phone: '+18091003001',
      role: UserRole.STAFF_RECEPTIONIST,
    },
  });

  const mantenimientoUser = await prisma.user.upsert({
    where: { email: 'mantenimiento@medicloud.com' },
    update: {},
    create: {
      email: 'mantenimiento@medicloud.com',
      name: 'Jorge Medina',
      passwordHash: staffPassword,
      phone: '+18091003002',
      role: UserRole.STAFF_ASSISTANT,
    },
  });

  await prisma.clinicStaff.upsert({
    where: { clinicId_userId: { clinicId: clinic2.id, userId: clinicAdminUser.id } },
    update: {},
    create: { clinicId: clinic2.id, userId: clinicAdminUser.id, role: 'ADMIN' },
  });

  await prisma.clinicStaff.upsert({
    where: { clinicId_userId: { clinicId: clinic2.id, userId: recepcionistaUser.id } },
    update: {},
    create: { clinicId: clinic2.id, userId: recepcionistaUser.id, role: 'RECEPTIONIST' },
  });

  await prisma.clinicStaff.upsert({
    where: { clinicId_userId: { clinicId: clinic2.id, userId: mantenimientoUser.id } },
    update: {},
    create: { clinicId: clinic2.id, userId: mantenimientoUser.id, role: 'MAINTENANCE' },
  });

  console.log('  ✅ 3 clinic staff created');

  // ============================================================
  // SECTION 9: PROVIDER-PATIENT RELATIONS
  // ============================================================
  console.log('🤝 Creating provider-patient relations...');

  const relations = [
    // Existing dental
    { patientId: patient.id, providerId: dentistUser.id, tenantId: tenant.id, notes: 'Regular patient since 2024' },
    { patientId: patient2.id, providerId: dentistUser.id, tenantId: tenant.id, notes: 'New patient' },
    // MediCentro — María Santos (embarazada)
    { patientId: patMaria.id, providerId: medGeneralUser.id, tenantId: tenantMedicentro.id, notes: 'Control prenatal' },
    { patientId: patMaria.id, providerId: ginecoUser.id, tenantId: tenantMedicentro.id, notes: 'Embarazo 32 semanas' },
    { patientId: patMaria.id, providerId: nutriUser.id, tenantId: tenantMedicentro.id, notes: 'Nutrición prenatal' },
    // MediCentro — Pedro Ramírez (cardio + DM2)
    { patientId: patPedro.id, providerId: cardioUser.id, tenantId: tenantMedicentro.id, notes: 'HTA + DM2' },
    { patientId: patPedro.id, providerId: medGeneralUser.id, tenantId: tenantMedicentro.id, notes: 'Control general' },
    { patientId: patPedro.id, providerId: nutriUser.id, tenantId: tenantMedicentro.id, notes: 'Dieta cardiosaludable' },
    // RehabPlus — Roberto Díaz (lesión rodilla)
    { patientId: patRoberto.id, providerId: fisioUser.id, tenantId: tenantRehab.id, notes: 'Rehab rodilla derecha' },
    // VisiónTotal — Carmen López (glaucoma)
    { patientId: patCarmen.id, providerId: oftalmoUser.id, tenantId: tenantVision.id, notes: 'Glaucoma + cataratas' },
    { patientId: patCarmen.id, providerId: cardioUser.id, tenantId: tenantMedicentro.id, notes: 'Control HTA' },
    // PediCare — Lucía Fernández
    { patientId: patLucia.id, providerId: pediatraUser.id, tenantId: tenantPedicare.id, notes: 'Control pediátrico' },
    // MediCentro — Andrés Martínez (derma + psicología + nutrición)
    { patientId: patAndres.id, providerId: dermaUser.id, tenantId: tenantMedicentro.id, notes: 'Dermatitis atópica' },
    { patientId: patAndres.id, providerId: psicologoUser.id, tenantId: tenantMedicentro.id, notes: 'TAG' },
    { patientId: patAndres.id, providerId: nutriUser.id, tenantId: tenantMedicentro.id, notes: 'Reducción de peso' },
  ];

  for (const r of relations) {
    await prisma.providerPatientRelation.upsert({
      where: { patientId_providerId: { patientId: r.patientId, providerId: r.providerId } },
      update: {},
      create: {
        patientId: r.patientId,
        providerId: r.providerId,
        tenantId: r.tenantId,
        isActive: true,
        providerNotes: r.notes,
      },
    });
  }
  console.log('  ✅ 15 provider-patient relations created');

  // ============================================================
  // SECTION 10: CONSENTS
  // ============================================================
  console.log('📋 Creating consents...');

  const consents = [
    // Jane Doe ↔ Dr. Smith (dental)
    { patientId: patient.id, providerId: dentistUser.id, level: DataAccessLevel.FULL, status: ConsentStatus.GRANTED, allShares: true },
    // María Santos
    { patientId: patMaria.id, providerId: medGeneralUser.id, level: DataAccessLevel.FULL, status: ConsentStatus.GRANTED, allShares: true },
    { patientId: patMaria.id, providerId: ginecoUser.id, level: DataAccessLevel.CLINICAL_ONLY, status: ConsentStatus.GRANTED, allShares: false },
    { patientId: patMaria.id, providerId: nutriUser.id, level: DataAccessLevel.SCHEDULING_ONLY, status: ConsentStatus.PENDING, allShares: false },
    // Pedro Ramírez
    { patientId: patPedro.id, providerId: cardioUser.id, level: DataAccessLevel.FULL, status: ConsentStatus.GRANTED, allShares: true },
    { patientId: patPedro.id, providerId: medGeneralUser.id, level: DataAccessLevel.CLINICAL_ONLY, status: ConsentStatus.GRANTED, allShares: false },
    { patientId: patPedro.id, providerId: nutriUser.id, level: DataAccessLevel.CLINICAL_ONLY, status: ConsentStatus.GRANTED, allShares: false },
    // Lucía Fernández
    { patientId: patLucia.id, providerId: pediatraUser.id, level: DataAccessLevel.FULL, status: ConsentStatus.GRANTED, allShares: true },
    { patientId: patLucia.id, providerId: nutriUser.id, level: DataAccessLevel.MINIMAL, status: ConsentStatus.PENDING, allShares: false },
    // Roberto Díaz
    { patientId: patRoberto.id, providerId: fisioUser.id, level: DataAccessLevel.FULL, status: ConsentStatus.GRANTED, allShares: true },
    // Carmen López
    { patientId: patCarmen.id, providerId: oftalmoUser.id, level: DataAccessLevel.FULL, status: ConsentStatus.GRANTED, allShares: true },
    { patientId: patCarmen.id, providerId: cardioUser.id, level: DataAccessLevel.CLINICAL_ONLY, status: ConsentStatus.GRANTED, allShares: false },
    // Andrés Martínez
    { patientId: patAndres.id, providerId: dermaUser.id, level: DataAccessLevel.FULL, status: ConsentStatus.GRANTED, allShares: true },
    { patientId: patAndres.id, providerId: psicologoUser.id, level: DataAccessLevel.CLINICAL_ONLY, status: ConsentStatus.GRANTED, allShares: false },
    { patientId: patAndres.id, providerId: nutriUser.id, level: DataAccessLevel.CLINICAL_ONLY, status: ConsentStatus.GRANTED, allShares: false },
  ];

  for (const c of consents) {
    await prisma.patientConsent.create({
      data: {
        patientId: c.patientId,
        providerId: c.providerId,
        dataAccessLevel: c.level,
        status: c.status,
        shareAppointments: true,
        shareMedicalHistory: c.allShares,
        shareDocuments: c.allShares,
        shareLabResults: c.allShares,
        shareBilling: c.allShares,
        grantedAt: c.status === ConsentStatus.GRANTED ? new Date() : null,
        requestedBy: c.providerId,
        reason: 'Atención médica integral',
      },
    });
  }
  console.log('  ✅ 15 consents created');

  // ============================================================
  // SECTION 11: APPOINTMENTS
  // ============================================================
  console.log('📅 Creating appointments...');

  const appointments = [
    // Dental
    { patientId: patient.id, providerId: dentistUser.id, tenantId: tenant.id, date: daysFromNow(-30), dur: 45, status: AppointmentStatus.COMPLETED, proc: 'Limpieza dental profiláctica' },
    { patientId: patient.id, providerId: dentistUser.id, tenantId: tenant.id, date: daysFromNow(7), dur: 30, status: AppointmentStatus.SCHEDULED, proc: 'Control semestral' },
    { patientId: patient2.id, providerId: dentistUser.id, tenantId: tenant.id, date: daysFromNow(-15), dur: 60, status: AppointmentStatus.COMPLETED, proc: 'Restauración molar' },
    // Medicina General
    { patientId: patMaria.id, providerId: medGeneralUser.id, tenantId: tenantMedicentro.id, date: daysFromNow(-14), dur: 30, status: AppointmentStatus.COMPLETED, proc: 'Consulta prenatal semana 30' },
    { patientId: patPedro.id, providerId: medGeneralUser.id, tenantId: tenantMedicentro.id, date: daysFromNow(-21), dur: 30, status: AppointmentStatus.COMPLETED, proc: 'Control HTA y DM2' },
    // Ginecología
    { patientId: patMaria.id, providerId: ginecoUser.id, tenantId: tenantMedicentro.id, date: daysFromNow(3), dur: 45, status: AppointmentStatus.SCHEDULED, proc: 'Ecografía semana 33' },
    // Cardiología
    { patientId: patPedro.id, providerId: cardioUser.id, tenantId: tenantMedicentro.id, date: daysFromNow(-7), dur: 45, status: AppointmentStatus.COMPLETED, proc: 'Evaluación cardiovascular' },
    // Nutrición
    { patientId: patPedro.id, providerId: nutriUser.id, tenantId: tenantMedicentro.id, date: daysFromNow(1), dur: 40, status: AppointmentStatus.SCHEDULED, proc: 'Plan nutricional diabético' },
    { patientId: patAndres.id, providerId: nutriUser.id, tenantId: tenantMedicentro.id, date: daysFromNow(-15), dur: 40, status: AppointmentStatus.COMPLETED, proc: 'Evaluación nutricional inicial' },
    // Pediatría
    { patientId: patLucia.id, providerId: pediatraUser.id, tenantId: tenantPedicare.id, date: daysFromNow(-10), dur: 30, status: AppointmentStatus.COMPLETED, proc: 'Control pediátrico anual' },
    { patientId: patLucia.id, providerId: pediatraUser.id, tenantId: tenantPedicare.id, date: daysFromNow(14), dur: 20, status: AppointmentStatus.SCHEDULED, proc: 'Vacunación refuerzo' },
    // Fisioterapia
    { patientId: patRoberto.id, providerId: fisioUser.id, tenantId: tenantRehab.id, date: daysFromNow(-5), dur: 50, status: AppointmentStatus.COMPLETED, proc: 'Evaluación funcional rodilla' },
    { patientId: patRoberto.id, providerId: fisioUser.id, tenantId: tenantRehab.id, date: daysFromNow(0), dur: 50, status: AppointmentStatus.SCHEDULED, proc: 'Sesión fisioterapia #2' },
    // Oftalmología
    { patientId: patCarmen.id, providerId: oftalmoUser.id, tenantId: tenantVision.id, date: daysFromNow(-3), dur: 45, status: AppointmentStatus.COMPLETED, proc: 'Examen oftalmológico completo' },
    // Dermatología
    { patientId: patAndres.id, providerId: dermaUser.id, tenantId: tenantMedicentro.id, date: daysFromNow(-12), dur: 30, status: AppointmentStatus.COMPLETED, proc: 'Evaluación dermatológica' },
    // Psicología
    { patientId: patAndres.id, providerId: psicologoUser.id, tenantId: tenantMedicentro.id, date: daysFromNow(-8), dur: 50, status: AppointmentStatus.COMPLETED, proc: 'Sesión terapia TCC' },
  ];

  for (const a of appointments) {
    await prisma.appointment.create({
      data: {
        patientId: a.patientId,
        providerId: a.providerId,
        tenantId: a.tenantId,
        appointmentDate: a.date,
        duration: a.dur,
        status: a.status,
        procedureType: a.proc,
      },
    });
  }
  console.log('  ✅ 16 appointments created');

  // ============================================================
  // SECTION 12: MODULE DATA — Dental
  // ============================================================
  console.log('🦷 Creating dental module data...');

  const odontogram = await prisma.odontogram.create({
    data: {
      patientId: patient.id,
      providerId: dentistUser.id,
      tenantId: tenant.id,
      date: daysFromNow(-30),
      notes: 'Odontograma inicial — paciente presenta caries en molares y corona antigua deteriorada.',
      teeth: {
        create: [
          { toothNumber: 16, condition: ToothCondition.CAVITY, surfaces: [ToothSurface.OCCLUSAL, ToothSurface.MESIAL], notes: 'Caries mesio-oclusal', color: '#FF4444' },
          { toothNumber: 26, condition: ToothCondition.CROWN, surfaces: [], notes: 'Corona porcelana 2018 — desgaste', color: '#4488FF' },
          { toothNumber: 36, condition: ToothCondition.FILLED, surfaces: [ToothSurface.OCCLUSAL], notes: 'Resina compuesta 2022', color: '#44BB44' },
          { toothNumber: 18, condition: ToothCondition.MISSING, surfaces: [], notes: 'Extraído en 2020', color: '#999999' },
          { toothNumber: 47, condition: ToothCondition.ROOT_CANAL, surfaces: [], notes: 'Endodoncia 2021, requiere corona', color: '#FF8800' },
        ],
      },
    },
  });

  const treatmentPlan = await prisma.treatmentPlan.create({
    data: {
      patientId: patient.id,
      providerId: dentistUser.id,
      tenantId: tenant.id,
      title: 'Plan restaurativo integral',
      description: 'Plan de tratamiento para restaurar piezas afectadas y mejorar función masticatoria.',
      diagnosis: 'Caries múltiple, corona deteriorada, necesidad de corona en #47',
      status: TreatmentPlanStatus.IN_PROGRESS,
      totalCost: 850.00,
      startDate: daysFromNow(-25),
      items: {
        create: [
          { procedureCode: 'D1110', procedureName: 'Profilaxis dental', description: 'Limpieza profesional', status: TreatmentItemStatus.COMPLETED, estimatedCost: 100.00, actualCost: 100.00, priority: 1, estimatedDuration: 45 },
          { procedureCode: 'D2392', procedureName: 'Resina compuesta #16', description: 'Restauración mesio-oclusal molar superior derecho', status: TreatmentItemStatus.PENDING, estimatedCost: 250.00, priority: 2, estimatedDuration: 60 },
          { procedureCode: 'D2740', procedureName: 'Corona porcelana #47', description: 'Corona definitiva post-endodoncia', status: TreatmentItemStatus.PENDING, estimatedCost: 500.00, priority: 3, estimatedDuration: 90 },
        ],
      },
    },
  });

  console.log('  ✅ 1 odontogram (5 teeth) + 1 treatment plan (3 items)');

  // ============================================================
  // SECTION 13: MODULE DATA — General Medicine
  // ============================================================
  console.log('🏥 Creating general medicine module data...');

  // Clinical Note — María Santos (prenatal)
  await prisma.clinicalNote.create({
    data: {
      patientId: patMaria.id,
      providerId: medGeneralUser.id,
      tenantId: tenantMedicentro.id,
      noteType: 'SOAP',
      subjective: 'Paciente embarazada de 30 semanas. Refiere edema leve en extremidades inferiores al final del día. Sin cefalea, sin alteraciones visuales. Movimientos fetales activos.',
      objective: 'PA: 118/72 mmHg. FC: 78 lpm. Peso: 67 kg (+1.5 kg en 2 semanas). Altura uterina: 30 cm. FCF: 142 lpm. Edema ++ en tobillos bilateral.',
      assessment: 'Embarazo de 30 semanas con evolución normal. Edema fisiológico del embarazo.',
      plan: 'Continuar suplementación con hierro y ácido fólico. Elevar MMII en reposo. Control en 2 semanas. Laboratorios: hemograma, glucosa, orina completa.',
      vitalSigns: { bloodPressure: '118/72', heartRate: 78, temperature: 36.5, weight: 67, respiratoryRate: 16, oxygenSaturation: 98 },
      diagnoses: [{ code: 'Z34.0', description: 'Supervisión de embarazo normal, primer trimestre' }, { code: 'O12.0', description: 'Edema gestacional' }],
    },
  });

  // Clinical Note — Pedro Ramírez (HTA + DM2)
  const clinicalNotePedro = await prisma.clinicalNote.create({
    data: {
      patientId: patPedro.id,
      providerId: medGeneralUser.id,
      tenantId: tenantMedicentro.id,
      noteType: 'SOAP',
      subjective: 'Paciente acude a control trimestral. Refiere cumplimiento parcial de medicación (olvida dosis nocturna de Metformina 2-3 veces por semana). Niega síntomas de hipoglicemia. Poliuria ocasional.',
      objective: 'PA: 142/88 mmHg (meta <130/80). FC: 76 lpm. Peso: 85 kg (sin cambios). IMC: 29.4. Examen cardiovascular: RCR, sin soplos. Pulsos periféricos presentes. Pie diabético: sin lesiones, sensibilidad conservada.',
      assessment: 'HTA no controlada. DM2 con adherencia subóptima. Dislipidemia en tratamiento.',
      plan: 'Aumentar Losartán a 100mg/día. Reforzar importancia de adherencia a Metformina. Referir a nutrición para plan alimentario. Solicitar HbA1c, perfil lipídico, creatinina, microalbuminuria. Control en 1 mes.',
      vitalSigns: { bloodPressure: '142/88', heartRate: 76, temperature: 36.6, weight: 85, respiratoryRate: 17, oxygenSaturation: 97 },
      diagnoses: [
        { code: 'I10', description: 'Hipertensión arterial esencial' },
        { code: 'E11.9', description: 'Diabetes mellitus tipo 2 sin complicaciones' },
        { code: 'E78.5', description: 'Dislipidemia no especificada' },
      ],
    },
  });

  // Prescriptions
  await prisma.prescription.create({
    data: {
      patientId: patMaria.id,
      providerId: medGeneralUser.id,
      tenantId: tenantMedicentro.id,
      medications: [
        { name: 'Ácido fólico', dose: '5mg', frequency: '1 vez al día', duration: 'Hasta el parto', instructions: 'Tomar en ayunas' },
        { name: 'Sulfato ferroso', dose: '325mg', frequency: '1 vez al día', duration: 'Hasta el parto', instructions: 'Tomar con jugo de naranja, no con leche' },
      ],
      diagnosis: 'Embarazo 30 semanas — suplementación prenatal',
      notes: 'Continuar hasta indicación contraria. Control de hemoglobina en próxima cita.',
    },
  });

  await prisma.prescription.create({
    data: {
      patientId: patPedro.id,
      providerId: medGeneralUser.id,
      tenantId: tenantMedicentro.id,
      clinicalNoteId: clinicalNotePedro.id,
      medications: [
        { name: 'Losartán', dose: '100mg', frequency: '1 vez al día', duration: 'Continuo', instructions: 'En la mañana' },
        { name: 'Metformina', dose: '850mg', frequency: '2 veces al día', duration: 'Continuo', instructions: 'Con desayuno y cena' },
        { name: 'Atorvastatina', dose: '20mg', frequency: '1 vez al día', duration: 'Continuo', instructions: 'En la noche' },
      ],
      diagnosis: 'HTA no controlada, DM2, Dislipidemia',
      notes: 'Se aumentó Losartán de 50mg a 100mg. Mantener resto de medicación sin cambios.',
    },
  });

  console.log('  ✅ 2 clinical notes + 2 prescriptions');

  // ============================================================
  // SECTION 14: MODULE DATA — Psychology
  // ============================================================
  console.log('🧠 Creating psychology module data...');

  await prisma.therapySession.create({
    data: {
      patientId: patAndres.id,
      providerId: psicologoUser.id,
      tenantId: tenantMedicentro.id,
      sessionNumber: 1,
      sessionType: 'INDIVIDUAL',
      duration: 50,
      notes: 'Primera sesión. Paciente refiere ansiedad generalizada que interfiere con su trabajo y relaciones sociales. Síntomas presentes desde hace ~2 años, exacerbados por estrés laboral. Presenta preocupación excesiva, dificultad para concentrarse, tensión muscular y dificultad para dormir.',
      techniques: ['Rapport', 'Entrevista clínica', 'Psicoeducación sobre ansiedad'],
      homework: 'Registro diario de pensamientos ansiosos: situación, pensamiento, emoción (0-10), respuesta conductual.',
      progress: 'Sesión inicial de evaluación. Paciente motivado para el tratamiento.',
      moodRating: 4,
      riskLevel: 'LOW',
    },
  });

  await prisma.therapySession.create({
    data: {
      patientId: patAndres.id,
      providerId: psicologoUser.id,
      tenantId: tenantMedicentro.id,
      sessionNumber: 2,
      sessionType: 'INDIVIDUAL',
      duration: 50,
      notes: 'Revisión del registro de pensamientos. Identificamos 3 patrones principales: catastrofización, sobregeneralización y lectura de mente. Trabajamos reestructuración cognitiva con el pensamiento "Siempre me va a salir mal".',
      techniques: ['Reestructuración cognitiva', 'Registro de pensamientos', 'Respiración diafragmática'],
      homework: 'Practicar respiración diafragmática 2x/día (5 minutos). Continuar registro de pensamientos añadiendo pensamiento alternativo.',
      progress: 'Paciente identifica patrones de pensamiento. Reporta leve mejoría en calidad del sueño.',
      moodRating: 5,
      riskLevel: 'NONE',
    },
  });

  await prisma.therapySession.create({
    data: {
      patientId: patAndres.id,
      providerId: psicologoUser.id,
      tenantId: tenantMedicentro.id,
      sessionNumber: 3,
      sessionType: 'INDIVIDUAL',
      duration: 50,
      notes: 'Paciente realizó las tareas asignadas. Practicó respiración diafragmática con regularidad, reporta que le ayuda "a bajar la intensidad". Trabajamos exposición gradual a situación temida: presentaciones en trabajo.',
      techniques: ['Exposición gradual', 'Jerarquía de miedos', 'Mindfulness'],
      homework: 'Construir jerarquía de 10 situaciones ansiógenas (de menor a mayor). Práctica de mindfulness 10 min/día con app guiada.',
      progress: 'Mejoría progresiva. Paciente ha reducido comportamientos de evitación. Humor más estable.',
      moodRating: 6,
      riskLevel: 'NONE',
    },
  });

  // Psychological Assessments
  await prisma.psychologicalAssessment.create({
    data: {
      patientId: patAndres.id,
      providerId: psicologoUser.id,
      tenantId: tenantMedicentro.id,
      assessmentType: 'PHQ-9',
      responses: { q1: 2, q2: 2, q3: 1, q4: 2, q5: 1, q6: 1, q7: 1, q8: 1, q9: 1 },
      score: 12,
      interpretation: 'Depresión moderada. El paciente presenta síntomas depresivos que afectan parcialmente su funcionamiento diario. Se recomienda continuar psicoterapia y monitorear evolución.',
      severity: 'Moderate',
    },
  });

  await prisma.psychologicalAssessment.create({
    data: {
      patientId: patAndres.id,
      providerId: psicologoUser.id,
      tenantId: tenantMedicentro.id,
      assessmentType: 'GAD-7',
      responses: { q1: 2, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1, q7: 1 },
      score: 8,
      interpretation: 'Ansiedad leve-moderada. Síntomas de preocupación frecuente y dificultad para relajarse. Compatible con trastorno de ansiedad generalizada en mejoría con tratamiento.',
      severity: 'Mild-Moderate',
    },
  });

  console.log('  ✅ 3 therapy sessions + 2 psychological assessments');

  // ============================================================
  // SECTION 15: MODULE DATA — Physiotherapy
  // ============================================================
  console.log('🏋️ Creating physiotherapy module data...');

  await prisma.exercisePlan.create({
    data: {
      patientId: patRoberto.id,
      providerId: fisioUser.id,
      tenantId: tenantRehab.id,
      title: 'Rehabilitación rodilla derecha — Fase 1',
      description: 'Plan de ejercicios post-artroscopía para recuperación de ROM, fuerza y estabilidad de rodilla derecha.',
      exercises: [
        { name: 'Extensión de cuádriceps isométrica', sets: 3, reps: 15, duration: null, instructions: 'Sentado, contraer cuádriceps manteniendo rodilla extendida, sostener 5 seg.', videoUrl: null },
        { name: 'Flexión de rodilla asistida', sets: 3, reps: 12, duration: null, instructions: 'Decúbito supino, flexionar rodilla deslizando talón hacia glúteo. Rango sin dolor.', videoUrl: null },
        { name: 'Elevación de pierna recta (SLR)', sets: 3, reps: 10, duration: null, instructions: 'Decúbito supino, elevar pierna 30° manteniendo rodilla extendida, sostener 3 seg.', videoUrl: null },
        { name: 'Equilibrio en una pierna', sets: 2, reps: null, duration: '30 seg', instructions: 'De pie, apoyar solo la pierna afectada. Usar soporte si es necesario.', videoUrl: null },
      ],
      frequency: '3x/semana',
      startDate: daysFromNow(-5),
      endDate: daysFromNow(25),
      status: 'ACTIVE',
      progress: { week1: { compliance: '100%', painLevel: 5, notes: 'Inicio del plan, dolor moderado esperado' } },
      notes: 'Paciente motivado, deportista recreacional. Meta: retorno a actividad deportiva en 6-8 semanas.',
    },
  });

  await prisma.functionalAssessment.create({
    data: {
      patientId: patRoberto.id,
      providerId: fisioUser.id,
      tenantId: tenantRehab.id,
      assessmentType: 'INITIAL',
      rangeOfMotion: [
        { joint: 'Rodilla derecha', movement: 'Flexión', degrees: 110, side: 'Derecho', normal: 135 },
        { joint: 'Rodilla derecha', movement: 'Extensión', degrees: 0, side: 'Derecho', normal: 0 },
        { joint: 'Rodilla izquierda', movement: 'Flexión', degrees: 135, side: 'Izquierdo', normal: 135 },
      ],
      painScale: 6,
      functionalScore: 55,
      mobility: { gait: 'Antálgica, con leve cojera', stairs: 'Sube con dolor, baja con dificultad', squat: 'Parcial hasta 60° de flexión' },
      strength: { quadriceps: '3+/5', hamstrings: '4/5', gluteus: '4/5' },
      balance: { singleLeg: 'Inestable a los 5 seg', tandem: 'Posible con compensación' },
      goals: [
        { goal: 'Alcanzar flexión de rodilla de 130°', targetDate: daysFromNow(21).toISOString(), achieved: false },
        { goal: 'Caminar sin cojera', targetDate: daysFromNow(14).toISOString(), achieved: false },
        { goal: 'Retornar a actividad deportiva recreacional', targetDate: daysFromNow(42).toISOString(), achieved: false },
      ],
      notes: 'Evaluación inicial post-artroscopía rodilla derecha (recidiva lesión meniscal). Buen potencial de recuperación dado nivel de actividad previo.',
    },
  });

  console.log('  ✅ 1 exercise plan + 1 functional assessment');

  // ============================================================
  // SECTION 16: MODULE DATA — Dermatology
  // ============================================================
  console.log('🔬 Creating dermatology module data...');

  await prisma.skinLesion.create({
    data: {
      patientId: patAndres.id,
      providerId: dermaUser.id,
      tenantId: tenantMedicentro.id,
      bodyLocation: 'Codo izquierdo',
      locationDetails: 'Superficie extensora, área de 3x2 cm',
      lesionType: 'PLAQUE',
      size: { length: 3.0, width: 2.0, depth: null },
      color: 'Eritematoso con escamas blanco-plateadas',
      shape: 'Ovalada',
      borders: 'Bien definidos',
      texture: 'Escamosa, rugosa',
      symptoms: ['Prurito intermitente', 'Descamación', 'Xerosis perilesional'],
      diagnosis: 'Dermatitis atópica — placa eczematosa crónica',
      differentialDiagnosis: ['Psoriasis en placa', 'Dermatitis de contacto'],
      biopsyRequired: false,
      status: 'MONITORING',
      followUpDate: daysFromNow(30),
      notes: 'Lesión crónica con brotes estacionales. Emolientes + corticoide tópico de baja potencia. Evitar irritantes.',
    },
  });

  await prisma.skinLesion.create({
    data: {
      patientId: patAndres.id,
      providerId: dermaUser.id,
      tenantId: tenantMedicentro.id,
      bodyLocation: 'Mejilla derecha',
      locationDetails: 'Área malar, lesión plana de 0.5 cm',
      lesionType: 'MACULE',
      size: { length: 0.5, width: 0.5, depth: null },
      color: 'Marrón claro uniforme',
      shape: 'Redondeada',
      borders: 'Regulares',
      texture: 'Lisa',
      symptoms: [],
      diagnosis: 'Lentigo solar',
      differentialDiagnosis: ['Melanoma in situ', 'Queratosis seborreica plana'],
      biopsyRequired: false,
      status: 'ACTIVE',
      followUpDate: daysFromNow(90),
      notes: 'Lesión benigna. Fotoprotección SPF 50+. Vigilancia con dermatoscopia digital en 3 meses.',
    },
  });

  console.log('  ✅ 2 skin lesions');

  // ============================================================
  // SECTION 17: MODULE DATA — Ophthalmology
  // ============================================================
  console.log('👁️ Creating ophthalmology module data...');

  const eyeExam = await prisma.eyeExam.create({
    data: {
      patientId: patCarmen.id,
      providerId: oftalmoUser.id,
      tenantId: tenantVision.id,
      examType: 'COMPREHENSIVE',
      visualAcuityRight: '20/40',
      visualAcuityLeft: '20/50',
      intraocularPressureRight: 22.0,
      intraocularPressureLeft: 24.0,
      pupilResponse: 'PERRL (Pupilas iguales, redondas, reactivas a la luz)',
      anteriorSegment: { cornea: 'Transparente bilateral', conjuntiva: 'Sin hiperemia', iris: 'Normal, sin sinequias', cristalino: 'Opacidad subcapsular posterior leve bilateral' },
      posteriorSegment: { nervioOptico: 'Excavación 0.5 OD, 0.6 OI', macula: 'Sin alteraciones', vasos: 'Relación A/V normal', retina: 'Sin desgarros ni desprendimiento' },
      fundoscopy: { od: 'Copa/disco 0.5, bordes definidos, coloración normal', oi: 'Copa/disco 0.6, adelgazamiento del anillo neurorretiniano inferior' },
      colorVision: 'Normal (Ishihara 14/14)',
      peripheralVision: 'Sospecha de defecto arciforme superior OI — requiere campimetría formal',
      diagnosis: 'Sospecha de glaucoma primario de ángulo abierto (mayor en OI). Cataratas incipientes subcapsulares posteriores bilaterales.',
      notes: 'Solicitar campimetría computarizada y OCT de nervio óptico. Iniciar tratamiento con Timolol 0.5% bilateral. Control en 1 mes con PIO.',
    },
  });

  await prisma.lensPrescription.create({
    data: {
      patientId: patCarmen.id,
      providerId: oftalmoUser.id,
      tenantId: tenantVision.id,
      eyeExamId: eyeExam.id,
      rightSphere: -2.25,
      rightCylinder: -0.75,
      rightAxis: 180,
      rightAdd: 2.00,
      rightPd: 31.5,
      leftSphere: -2.50,
      leftCylinder: -1.00,
      leftAxis: 175,
      leftAdd: 2.00,
      leftPd: 31.0,
      prescriptionType: 'GLASSES',
      material: 'Policarbonato',
      coatings: ['Antireflejo', 'Protección UV', 'Blue light filter'],
      expiresAt: daysFromNow(365),
      notes: 'Lentes progresivos. Adaptar montura liviana por uso prolongado. Advertir sobre período de adaptación a progresivos.',
    },
  });

  console.log('  ✅ 1 eye exam + 1 lens prescription');

  // ============================================================
  // SECTION 18: MODULE DATA — Cardiology
  // ============================================================
  console.log('❤️ Creating cardiology module data...');

  await prisma.cardiacAssessment.create({
    data: {
      patientId: patPedro.id,
      providerId: cardioUser.id,
      tenantId: tenantMedicentro.id,
      assessmentType: 'INITIAL',
      bloodPressureSystolic: 142,
      bloodPressureDiastolic: 88,
      heartRate: 78,
      rhythm: 'REGULAR',
      ecgFindings: 'Ritmo sinusal. Frecuencia 78 lpm. Eje normal. Criterios de voltaje sugestivos de hipertrofia ventricular izquierda leve (Sokolow-Lyon 37mm). Sin alteraciones del segmento ST. Intervalos PR y QT normales.',
      echoFindings: {
        lvef: '58%',
        wallMotion: 'Normal',
        valves: 'Válvulas normofuncionantes, insuficiencia mitral trivial',
        diastolicFunction: 'Patrón de relajación alterada (Grado I)',
        lvMass: 'Ligeramente aumentada',
        conclusions: 'HVI leve. Disfunción diastólica grado I. FEVI preservada.',
      },
      lipidPanel: { totalCholesterol: 240, ldl: 160, hdl: 42, triglycerides: 200, nonHdl: 198 },
      riskFactors: ['Hipertensión arterial', 'Diabetes mellitus tipo 2', 'Dislipidemia', 'Sedentarismo', 'Antecedente familiar: padre infarto a los 58 años'],
      riskScore: 15.5,
      medications: [
        { name: 'Losartán', dose: '100mg/día', indication: 'HTA' },
        { name: 'Atorvastatina', dose: '20mg/día', indication: 'Dislipidemia' },
        { name: 'Aspirina', dose: '100mg/día', indication: 'Prevención primaria' },
      ],
      diagnosis: 'Cardiopatía hipertensiva con HVI leve. Riesgo cardiovascular moderado-alto (SCORE 15.5%).',
      plan: 'Optimizar control de PA (meta <130/80). Intensificar estatina a Atorvastatina 40mg. Iniciar Aspirina 100mg/día. Programa de ejercicio aeróbico supervisado 150 min/semana. Referir a nutrición. Control en 3 meses con nuevo perfil lipídico y HbA1c.',
      notes: 'Paciente necesita abordaje multidisciplinario: cardiología, endocrinología, nutrición. Buena actitud hacia cambios de estilo de vida.',
    },
  });

  await prisma.cardiacAssessment.create({
    data: {
      patientId: patPedro.id,
      providerId: cardioUser.id,
      tenantId: tenantMedicentro.id,
      assessmentType: 'FOLLOW_UP',
      bloodPressureSystolic: 134,
      bloodPressureDiastolic: 82,
      heartRate: 74,
      rhythm: 'REGULAR',
      ecgFindings: 'Ritmo sinusal normal. Frecuencia 74 lpm. Eje normal. HVI leve persistente por criterios de voltaje. Sin cambios isquémicos agudos.',
      echoFindings: {
        lvef: '60%',
        wallMotion: 'Normal',
        valves: 'Sin cambios respecto a estudio previo',
        diastolicFunction: 'Patrón de relajación alterada (Grado I) estable',
        conclusions: 'Función sistólica preservada. HVI leve estable. Sin deterioro funcional.',
      },
      lipidPanel: { totalCholesterol: 210, ldl: 130, hdl: 45, triglycerides: 175, nonHdl: 165 },
      riskFactors: ['Hipertensión arterial', 'Diabetes mellitus tipo 2', 'Dislipidemia', 'Sedentarismo'],
      riskScore: 12.8,
      medications: [
        { name: 'Losartán', dose: '100mg/día', indication: 'HTA' },
        { name: 'Atorvastatina', dose: '40mg/día', indication: 'Dislipidemia' },
        { name: 'Aspirina', dose: '100mg/día', indication: 'Prevención primaria' },
      ],
      diagnosis: 'Cardiopatía hipertensiva con HVI leve estable. PA en mejoría con ajuste terapéutico. Perfil lipídico mejorando.',
      plan: 'Mantener tratamiento actual. Continuar programa de ejercicio. Control en 3 meses con perfil lipídico y HbA1c. Evaluar necesidad de agregar betabloqueante si PA no alcanza meta.',
      notes: 'Paciente ha mejorado adherencia al tratamiento. Inició caminatas 30 min/día. Coordinación con nutrición está dando resultados.',
    },
  });

  console.log('  ✅ 2 cardiac assessments');

  // ============================================================
  // SECTION 19: MODULE DATA — Pediatrics
  // ============================================================
  console.log('👶 Creating pediatrics module data...');

  // Growth Records (ages 6, 7, 8)
  await prisma.growthRecord.create({
    data: {
      patientId: patLucia.id,
      providerId: pediatraUser.id,
      tenantId: tenantPedicare.id,
      measurementDate: new Date('2024-01-15'),
      ageMonths: 74,
      weight: 19.5,
      height: 115.0,
      headCircumference: 51.0,
      bmi: 14.7,
      weightPercentile: 50,
      heightPercentile: 55,
      headPercentile: 50,
      bmiPercentile: 45,
      notes: 'Crecimiento adecuado. Desarrollo psicomotor normal para la edad.',
    },
  });

  await prisma.growthRecord.create({
    data: {
      patientId: patLucia.id,
      providerId: pediatraUser.id,
      tenantId: tenantPedicare.id,
      measurementDate: new Date('2025-01-20'),
      ageMonths: 86,
      weight: 22.0,
      height: 122.0,
      headCircumference: 51.5,
      bmi: 14.8,
      weightPercentile: 50,
      heightPercentile: 52,
      headPercentile: 48,
      bmiPercentile: 42,
      notes: 'Ganancia de peso y talla adecuada. Asma controlada con salbutamol PRN.',
    },
  });

  await prisma.growthRecord.create({
    data: {
      patientId: patLucia.id,
      providerId: pediatraUser.id,
      tenantId: tenantPedicare.id,
      measurementDate: daysFromNow(-10),
      ageMonths: 98,
      weight: 25.0,
      height: 128.0,
      headCircumference: 52.0,
      bmi: 15.3,
      weightPercentile: 55,
      heightPercentile: 58,
      headPercentile: 50,
      bmiPercentile: 48,
      notes: 'Excelente crecimiento. Talla y peso en percentil 50-75. Control anual completado.',
    },
  });

  // Vaccination Records
  await prisma.vaccinationRecord.create({
    data: {
      patientId: patLucia.id,
      providerId: pediatraUser.id,
      tenantId: tenantPedicare.id,
      vaccineName: 'Influenza',
      vaccineType: 'Inactivada tetravalente',
      doseNumber: 1,
      administeredDate: new Date('2025-10-15'),
      nextDoseDate: new Date('2026-10-15'),
      batchNumber: 'FLU-2025-A442',
      site: 'Deltoides izquierdo',
      route: 'IM',
      manufacturer: 'Sanofi Pasteur',
      notes: 'Vacunación anual contra influenza. Sin reacciones adversas.',
    },
  });

  await prisma.vaccinationRecord.create({
    data: {
      patientId: patLucia.id,
      providerId: pediatraUser.id,
      tenantId: tenantPedicare.id,
      vaccineName: 'Varicela',
      vaccineType: 'Virus vivo atenuado',
      doseNumber: 2,
      administeredDate: new Date('2025-06-20'),
      batchNumber: 'VAR-2025-B123',
      site: 'Deltoides derecho',
      route: 'SC',
      manufacturer: 'Merck',
      notes: 'Segunda dosis varicela (refuerzo). Completó esquema.',
    },
  });

  await prisma.vaccinationRecord.create({
    data: {
      patientId: patLucia.id,
      providerId: pediatraUser.id,
      tenantId: tenantPedicare.id,
      vaccineName: 'Hepatitis A',
      vaccineType: 'Inactivada',
      doseNumber: 2,
      administeredDate: new Date('2025-03-10'),
      batchNumber: 'HEPA-2025-C789',
      site: 'Deltoides izquierdo',
      route: 'IM',
      manufacturer: 'GSK',
      notes: 'Refuerzo Hepatitis A. Esquema completo.',
    },
  });

  await prisma.vaccinationRecord.create({
    data: {
      patientId: patLucia.id,
      providerId: pediatraUser.id,
      tenantId: tenantPedicare.id,
      vaccineName: 'DPT (Difteria, Pertussis, Tétanos)',
      vaccineType: 'Toxoide + inactivada',
      doseNumber: 5,
      administeredDate: daysFromNow(-10),
      nextDoseDate: daysFromNow(365 * 5),
      batchNumber: 'DPT-2026-D456',
      site: 'Deltoides derecho',
      route: 'IM',
      manufacturer: 'Sanofi Pasteur',
      notes: 'Refuerzo escolar DPT. Próximo refuerzo a los 13-14 años (Tdap).',
    },
  });

  console.log('  ✅ 3 growth records + 4 vaccination records');

  // ============================================================
  // SECTION 20: MODULE DATA — Nutrition
  // ============================================================
  console.log('🥗 Creating nutrition module data...');

  await prisma.nutritionPlan.create({
    data: {
      patientId: patAndres.id,
      providerId: nutriUser.id,
      tenantId: tenantMedicentro.id,
      title: 'Plan de reducción de peso — Andrés Martínez',
      objective: 'Reducir peso corporal en 8-10 kg en 4 meses mediante déficit calórico moderado y mejora de hábitos alimentarios.',
      dailyCalories: 1800,
      macros: { protein: { percentage: 30, grams: 135 }, carbs: { percentage: 40, grams: 180 }, fat: { percentage: 30, grams: 60 } },
      meals: [
        { name: 'Desayuno', time: '07:30', example: 'Avena con frutas + huevo revuelto + té verde' },
        { name: 'Merienda AM', time: '10:30', example: 'Yogur griego + nueces (30g)' },
        { name: 'Almuerzo', time: '13:00', example: 'Pollo a la plancha + arroz integral (3/4 taza) + ensalada variada + 1 fruta' },
        { name: 'Cena', time: '19:00', example: 'Pescado al horno + vegetales salteados + 1 rebanada pan integral' },
      ],
      restrictions: ['Azúcar refinada', 'Frituras', 'Bebidas azucaradas', 'Alcohol > 2 copas/semana'],
      supplements: ['Omega-3 1000mg/día', 'Vitamina D 2000 UI/día'],
      startDate: daysFromNow(-15),
      endDate: daysFromNow(105),
      status: 'ACTIVE',
      notes: 'Paciente con IMC 30.0 (Obesidad grado I). Motivado. Evitar mariscos (alergia). Considerar impacto del estrés/ansiedad en hábitos alimentarios.',
    },
  });

  await prisma.nutritionPlan.create({
    data: {
      patientId: patPedro.id,
      providerId: nutriUser.id,
      tenantId: tenantMedicentro.id,
      title: 'Plan diabético cardiosaludable — Pedro Ramírez',
      objective: 'Control glucémico mediante alimentación con bajo índice glucémico, reducción de sodio y grasas saturadas para protección cardiovascular.',
      dailyCalories: 1600,
      macros: { protein: { percentage: 25, grams: 100 }, carbs: { percentage: 45, grams: 180 }, fat: { percentage: 30, grams: 53 } },
      meals: [
        { name: 'Desayuno', time: '07:00', example: 'Pan integral + queso blanco + 1 huevo + café sin azúcar' },
        { name: 'Merienda AM', time: '10:00', example: 'Manzana + almendras (20g)' },
        { name: 'Almuerzo', time: '12:30', example: 'Pechuga de pollo + habichuelas guisadas + ensalada + 1/2 taza arroz' },
        { name: 'Merienda PM', time: '15:30', example: 'Galletas integrales (4) + mantequilla de maní natural' },
        { name: 'Cena', time: '18:30', example: 'Sopa de vegetales + pescado al vapor + vegetales al vapor' },
      ],
      restrictions: ['Sodio alto (< 2000mg/día)', 'Azúcar añadida', 'Grasas trans', 'Carbohidratos refinados', 'Carnes procesadas'],
      supplements: ['Omega-3 2000mg/día', 'Cromo picolinato 200mcg/día'],
      startDate: daysFromNow(-7),
      status: 'ACTIVE',
      notes: 'Paciente con DM2 + HTA + dislipidemia. Ajustar plan según HbA1c y perfil lipídico. Coordinar con cardiología y medicina general.',
    },
  });

  // Body Measurements
  await prisma.bodyMeasurement.create({
    data: {
      patientId: patAndres.id,
      providerId: nutriUser.id,
      tenantId: tenantMedicentro.id,
      measurementDate: daysFromNow(-15),
      weight: 92.0,
      height: 175.0,
      bmi: 30.0,
      bodyFatPercentage: 28.0,
      muscleMass: 33.5,
      waistCircumference: 98.0,
      hipCircumference: 104.0,
      chestCircumference: 102.0,
      armCircumference: 33.0,
      thighCircumference: 58.0,
      notes: 'Medición basal. Obesidad grado I. Distribución de grasa central (cintura/cadera: 0.94). Meta: cintura < 90 cm.',
    },
  });

  await prisma.bodyMeasurement.create({
    data: {
      patientId: patAndres.id,
      providerId: nutriUser.id,
      tenantId: tenantMedicentro.id,
      measurementDate: daysFromNow(-1),
      weight: 89.5,
      height: 175.0,
      bmi: 29.2,
      bodyFatPercentage: 26.5,
      muscleMass: 34.0,
      waistCircumference: 95.0,
      hipCircumference: 102.0,
      chestCircumference: 101.0,
      armCircumference: 32.5,
      thighCircumference: 57.0,
      notes: 'Control a las 2 semanas. Pérdida de 2.5 kg. Reducción de 3 cm en cintura. Aumento leve de masa muscular. Buena adherencia al plan.',
    },
  });

  await prisma.bodyMeasurement.create({
    data: {
      patientId: patPedro.id,
      providerId: nutriUser.id,
      tenantId: tenantMedicentro.id,
      measurementDate: daysFromNow(-7),
      weight: 85.0,
      height: 170.0,
      bmi: 29.4,
      bodyFatPercentage: 32.0,
      muscleMass: 28.5,
      waistCircumference: 102.0,
      hipCircumference: 100.0,
      chestCircumference: 98.0,
      armCircumference: 31.0,
      thighCircumference: 54.0,
      notes: 'Sobrepeso con grasa visceral elevada (cintura/cadera: 1.02). Riesgo cardiovascular por distribución central.',
    },
  });

  console.log('  ✅ 2 nutrition plans + 3 body measurements');

  // ============================================================
  // SECTION 21: MODULE DATA — Gynecology
  // ============================================================
  console.log('🩺 Creating gynecology module data...');

  await prisma.gynecologicalExam.create({
    data: {
      patientId: patMaria.id,
      providerId: ginecoUser.id,
      tenantId: tenantMedicentro.id,
      examType: 'PRENATAL',
      lastMenstrualPeriod: daysFromNow(-32 * 7), // 32 weeks ago
      menstrualCycleLength: 28,
      menstrualRegularity: 'Regular',
      contraceptiveMethod: 'Ninguno',
      pregnancyHistory: { gravida: 2, para: 1, abortions: 0, livingChildren: 1, previousDeliveries: [{ year: 2022, type: 'Vaginal', weight: 3200, complications: 'Ninguna' }] },
      currentPregnancy: {
        gestationalWeeks: 32,
        edd: daysFromNow(8 * 7).toISOString(),
        weight: 68,
        bloodPressure: '120/75',
        fetalHeartRate: 145,
        fetalPosition: 'Cefálica',
        uterineHeight: 31,
        edema: 'Leve en tobillos',
        fetalMovements: 'Activos, >10/hora',
      },
      examFindings: {
        cervix: 'Cerrado, formado, posterior',
        uterus: 'Acorde a edad gestacional',
        adnexa: 'No palpables',
        vaginalDischarge: 'Fisiológico',
      },
      papSmearResult: 'Normal (realizado hace 8 meses, previo al embarazo)',
      ultrasoundFindings: {
        biometría: 'Concordante con 32 semanas',
        pesoFetal: '1850g (percentil 50)',
        placenta: 'Fúndica, grado II',
        liquidoAmniotico: 'Normal (ILA 14 cm)',
        cordón: '3 vasos',
        presentación: 'Cefálica',
      },
      labResults: {
        hemoglobin: 11.2,
        hematocrit: 34,
        bloodType: 'O+ (Rh positivo)',
        glucose: 82,
        urinalysis: 'Normal, sin proteinuria',
      },
      diagnosis: 'Embarazo de 32 semanas con evolución normal. Feto en presentación cefálica con crecimiento adecuado.',
      plan: 'Continuar control prenatal cada 2 semanas. Próxima ecografía a las 36 semanas. Monitoreo fetal a partir de semana 34. Preparación para el parto.',
      nextAppointmentDate: daysFromNow(14),
      notes: 'Embarazo de bajo riesgo. Paciente cumpliendo con controles. Planifica parto vaginal. Grupo sanguíneo compatible (sin necesidad de anti-D).',
    },
  });

  await prisma.gynecologicalExam.create({
    data: {
      patientId: patMaria.id,
      providerId: ginecoUser.id,
      tenantId: tenantMedicentro.id,
      examType: 'PRENATAL',
      lastMenstrualPeriod: daysFromNow(-34 * 7), // 34 weeks ago
      menstrualCycleLength: 28,
      menstrualRegularity: 'Regular',
      contraceptiveMethod: 'Ninguno',
      pregnancyHistory: { gravida: 2, para: 1, abortions: 0, livingChildren: 1, previousDeliveries: [{ year: 2022, type: 'Vaginal', weight: 3200, complications: 'Ninguna' }] },
      currentPregnancy: {
        gestationalWeeks: 34,
        edd: daysFromNow(6 * 7).toISOString(),
        weight: 69.5,
        bloodPressure: '122/78',
        fetalHeartRate: 140,
        fetalPosition: 'Cefálica encajada',
        uterineHeight: 33,
        edema: 'Leve en tobillos, sin cambio',
        fetalMovements: 'Activos, >10/hora',
      },
      examFindings: {
        cervix: 'Cerrado, reblandecido, centrado',
        uterus: 'Acorde a edad gestacional',
        adnexa: 'No palpables',
        vaginalDischarge: 'Fisiológico, sin mal olor',
      },
      ultrasoundFindings: {
        biometría: 'Concordante con 34 semanas',
        pesoFetal: '2200g (percentil 55)',
        placenta: 'Fúndica posterior, grado II-III',
        liquidoAmniotico: 'Normal (ILA 12 cm)',
        cordón: '3 vasos, sin circulares',
        presentación: 'Cefálica encajada',
      },
      labResults: {
        hemoglobin: 11.5,
        hematocrit: 35,
        glucose: 78,
        urinalysis: 'Normal, sin proteinuria ni glucosuria',
        streptococcusB: 'Pendiente',
      },
      diagnosis: 'Embarazo de 34 semanas con evolución favorable. Feto en presentación cefálica encajada con crecimiento adecuado.',
      plan: 'Solicitar cultivo Streptococcus grupo B. Monitoreo fetal semanal a partir de ahora. Ecografía de crecimiento a las 36 semanas. Preparación para parto vaginal.',
      nextAppointmentDate: daysFromNow(7),
      notes: 'Embarazo progresa sin complicaciones. Se discutió plan de parto. Paciente desea parto vaginal sin analgesia epidural si es posible.',
    },
  });

  console.log('  ✅ 2 gynecological exams');

  // ============================================================
  // SECTION 22: MEDICAL EXAMS
  // ============================================================
  console.log('📎 Creating medical exams...');

  const examECG = await prisma.medicalExam.create({
    data: {
      patientId: patPedro.id,
      title: 'Electrocardiograma',
      examType: 'ECG',
      description: 'ECG de 12 derivaciones en reposo realizado en evaluación cardiovascular.',
      examDate: daysFromNow(-7),
      filePath: '/uploads/exams/pedro-ecg-2026.pdf',
      fileName: 'pedro-ecg-2026.pdf',
      fileSize: 245000,
      mimeType: 'application/pdf',
      tags: ['cardiología', 'ECG', 'hipertrofia'],
    },
  });

  await prisma.medicalExam.create({
    data: {
      patientId: patPedro.id,
      title: 'Hemoglobina Glicada (HbA1c)',
      examType: 'LABORATORY',
      description: 'HbA1c: 7.8% (meta <7%). Indica control glucémico subóptimo en últimos 3 meses.',
      examDate: daysFromNow(-21),
      filePath: '/uploads/exams/pedro-hba1c-2026.pdf',
      fileName: 'pedro-hba1c-2026.pdf',
      fileSize: 120000,
      mimeType: 'application/pdf',
      tags: ['laboratorio', 'diabetes', 'HbA1c'],
    },
  });

  const examCampo = await prisma.medicalExam.create({
    data: {
      patientId: patCarmen.id,
      title: 'Campimetría Visual Computarizada',
      examType: 'IMAGING',
      description: 'Campimetría Humphrey 24-2. OD: Normal. OI: Defecto arciforme superior leve, compatible con daño glaucomatoso inicial.',
      examDate: daysFromNow(-3),
      filePath: '/uploads/exams/carmen-campimetria-2026.pdf',
      fileName: 'carmen-campimetria-2026.pdf',
      fileSize: 580000,
      mimeType: 'application/pdf',
      tags: ['oftalmología', 'campimetría', 'glaucoma'],
    },
  });

  // Shared Documents (linking exams to providers)
  await prisma.sharedDocument.create({
    data: {
      patientId: patPedro.id,
      documentId: examECG.id,
      providerId: cardioUser.id,
      isActive: true,
    },
  });

  await prisma.sharedDocument.create({
    data: {
      patientId: patCarmen.id,
      documentId: examCampo.id,
      providerId: oftalmoUser.id,
      isActive: true,
    },
  });

  console.log('  ✅ 3 medical exams + 2 shared documents');

  // ============================================================
  // SECTION 22B: INVOICES + PAYMENTS
  // ============================================================
  console.log('💰 Creating invoices and payments...');

  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      patientId: patient.id,
      providerId: dentistUser.id,
      tenantId: tenant.id,
      treatmentPlanId: treatmentPlan.id,
      issueDate: weeksAgo(3),
      dueDate: weeksAgo(1),
      status: 'PAID',
      subtotal: 35000,
      tax: 6300,
      discount: 2000,
      total: 39300,
      amountPaid: 39300,
      balance: 0,
      notes: 'Restauración molar y limpieza profunda.',
      terms: 'Pago completo al recibir la factura.',
      items: {
        create: [
          { description: 'Restauración resina compuesta (molar)', quantity: 1, unitPrice: 15000, total: 15000 },
          { description: 'Limpieza dental profunda', quantity: 1, unitPrice: 8000, total: 8000 },
          { description: 'Radiografía periapical', quantity: 2, unitPrice: 2000, total: 4000 },
          { description: 'Corona provisional', quantity: 1, unitPrice: 8000, total: 8000 },
        ],
      },
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0002',
      patientId: patPedro.id,
      providerId: cardioUser.id,
      tenantId: tenantMedicentro.id,
      issueDate: weeksAgo(1),
      dueDate: daysFromNow(14),
      status: 'DRAFT',
      subtotal: 12000,
      tax: 2160,
      discount: 0,
      total: 14160,
      amountPaid: 5000,
      balance: 9160,
      notes: 'Evaluación cardiovascular completa.',
      items: {
        create: [
          { description: 'Consulta cardiología', quantity: 1, unitPrice: 4000, total: 4000 },
          { description: 'Electrocardiograma', quantity: 1, unitPrice: 3000, total: 3000 },
          { description: 'Ecocardiograma', quantity: 1, unitPrice: 5000, total: 5000 },
        ],
      },
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0003',
      patientId: patAndres.id,
      providerId: psicologoUser.id,
      tenantId: tenantMedicentro.id,
      issueDate: daysFromNow(-5),
      dueDate: daysFromNow(25),
      status: 'DRAFT',
      subtotal: 9000,
      tax: 1620,
      discount: 0,
      total: 10620,
      amountPaid: 0,
      balance: 10620,
      notes: '3 sesiones de terapia TCC.',
      items: {
        create: [
          { description: 'Sesión terapia cognitivo-conductual', quantity: 3, unitPrice: 3000, total: 9000 },
        ],
      },
    },
  });

  const invoice4 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0004',
      patientId: patRoberto.id,
      providerId: fisioUser.id,
      tenantId: tenantRehab.id,
      issueDate: weeksAgo(6),
      dueDate: weeksAgo(2),
      status: 'OVERDUE',
      subtotal: 7500,
      tax: 1350,
      discount: 0,
      total: 8850,
      amountPaid: 0,
      balance: 8850,
      notes: 'Evaluación funcional y sesiones de fisioterapia.',
      terms: 'Pago a 30 días. Recargo por mora del 2% mensual.',
      items: {
        create: [
          { description: 'Evaluación funcional inicial', quantity: 1, unitPrice: 3500, total: 3500 },
          { description: 'Sesión fisioterapia rehabilitación', quantity: 2, unitPrice: 2000, total: 4000 },
        ],
      },
    },
  });

  // Payments
  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      patientId: patient.id,
      tenantId: tenant.id,
      amount: 20000,
      paymentMethod: 'CREDIT_CARD',
      paymentDate: weeksAgo(3),
      status: 'COMPLETED',
      reference: 'TXN-CC-20260115-001',
      notes: 'Pago parcial con tarjeta de crédito.',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      patientId: patient.id,
      tenantId: tenant.id,
      amount: 19300,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: weeksAgo(2),
      status: 'COMPLETED',
      reference: 'TXN-BT-20260122-001',
      notes: 'Pago balance restante por transferencia.',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice2.id,
      patientId: patPedro.id,
      tenantId: tenantMedicentro.id,
      amount: 5000,
      paymentMethod: 'CASH',
      paymentDate: weeksAgo(1),
      status: 'COMPLETED',
      reference: 'TXN-CASH-20260129-001',
      notes: 'Abono en efectivo.',
    },
  });

  console.log('  ✅ 4 invoices + 3 payments');

  // ============================================================
  // SECTION 22C: RECURRING APPOINTMENTS
  // ============================================================
  console.log('🔄 Creating recurring appointments...');

  await prisma.recurringAppointment.create({
    data: {
      patientId: patAndres.id,
      providerId: psicologoUser.id,
      tenantId: tenantMedicentro.id,
      frequency: 'WEEKLY',
      interval: 1,
      startDate: weeksAgo(4),
      endDate: daysFromNow(60),
      duration: 50,
      procedureType: 'Sesión terapia TCC semanal',
      timeOfDay: '10:00',
      daysOfWeek: [3], // Wednesday
      isActive: true,
    },
  });

  await prisma.recurringAppointment.create({
    data: {
      patientId: patPedro.id,
      providerId: cardioUser.id,
      tenantId: tenantMedicentro.id,
      frequency: 'MONTHLY',
      interval: 1,
      startDate: weeksAgo(8),
      endDate: daysFromNow(120),
      duration: 30,
      procedureType: 'Control cardiovascular mensual',
      timeOfDay: '09:00',
      daysOfWeek: [1], // Monday
      isActive: true,
    },
  });

  await prisma.recurringAppointment.create({
    data: {
      patientId: patRoberto.id,
      providerId: fisioUser.id,
      tenantId: tenantRehab.id,
      frequency: 'BIWEEKLY',
      interval: 1,
      startDate: weeksAgo(6),
      endDate: daysFromNow(30),
      duration: 45,
      procedureType: 'Rehabilitación rodilla — serie de ejercicios',
      timeOfDay: '14:00',
      daysOfWeek: [1, 4], // Mon, Thu
      isActive: true,
    },
  });

  console.log('  ✅ 3 recurring appointments');

  // ============================================================
  // SECTION 22D: WAITLIST
  // ============================================================
  console.log('📋 Creating waitlist entries...');

  await prisma.waitlist.create({
    data: {
      patientId: patMaria.id,
      providerId: ginecoUser.id,
      tenantId: tenantMedicentro.id,
      preferredDates: [daysFromNow(3), daysFromNow(5), daysFromNow(7)],
      preferredTimes: ['09:00', '10:00', '11:00'],
      procedureType: 'Control prenatal urgente',
      duration: 40,
      priority: 1,
      status: 'WAITING',
      notes: 'Embarazo 32 semanas, requiere seguimiento cercano.',
    },
  });

  await prisma.waitlist.create({
    data: {
      patientId: patient2.id,
      providerId: dentistUser.id,
      tenantId: tenant.id,
      preferredDates: [daysFromNow(1), daysFromNow(2)],
      preferredTimes: ['15:00', '16:00'],
      procedureType: 'Limpieza dental',
      duration: 30,
      priority: 2,
      status: 'CONTACTED',
      notes: 'Paciente contactado, esperando confirmación.',
      contactedAt: daysFromNow(0),
    },
  });

  await prisma.waitlist.create({
    data: {
      patientId: patCarmen.id,
      providerId: oftalmoUser.id,
      tenantId: tenantVision.id,
      preferredDates: [daysFromNow(7), daysFromNow(14)],
      preferredTimes: ['08:00', '09:00'],
      procedureType: 'Seguimiento presión intraocular',
      duration: 30,
      priority: 1,
      status: 'WAITING',
      notes: 'PIO elevada en última consulta, necesita seguimiento pronto.',
    },
  });

  await prisma.waitlist.create({
    data: {
      patientId: patAndres.id,
      providerId: dermaUser.id,
      tenantId: tenantMedicentro.id,
      preferredDates: [daysFromNow(5), daysFromNow(10), daysFromNow(12)],
      preferredTimes: ['10:00', '11:00', '14:00'],
      procedureType: 'Control dermatológico seguimiento',
      duration: 30,
      priority: 3,
      status: 'WAITING',
      notes: 'Seguimiento de lesión cutánea en codo. Sin urgencia.',
      expiresAt: daysFromNow(30),
    },
  });

  console.log('  ✅ 4 waitlist entries');

  // ============================================================
  // SECTION 22E: NOTIFICATIONS
  // ============================================================
  console.log('🔔 Creating notifications...');

  const notifData = [
    { userId: patientUser.id, tenantId: tenant.id, type: 'EMAIL' as const, channel: 'APPOINTMENT_REMINDER' as const, subject: 'Recordatorio de cita', message: 'Tiene una cita programada para mañana a las 9:00 AM con Dr. Dentist.' },
    { userId: patientUser.id, tenantId: tenant.id, type: 'PUSH' as const, channel: 'PAYMENT_REMINDER' as const, subject: 'Factura pendiente', message: 'Tiene un balance pendiente de RD$9,160 en su factura INV-2026-0002.' },
    { userId: patient2User.id, tenantId: tenant.id, type: 'SMS' as const, channel: 'WAITLIST_UPDATE' as const, subject: null, message: 'Se ha liberado un horario para su limpieza dental. Responda SI para confirmar.' },
    { userId: dentistUser.id, tenantId: tenant.id, type: 'EMAIL' as const, channel: 'APPOINTMENT_CANCELLATION' as const, subject: 'Cita cancelada', message: 'El paciente John Smith ha cancelado su cita del 15 de febrero.' },
  ];

  for (const n of notifData) {
    await prisma.notification.create({
      data: {
        userId: n.userId,
        tenantId: n.tenantId,
        type: n.type,
        channel: n.channel,
        subject: n.subject,
        message: n.message,
        sent: false,
      },
    });
  }

  console.log('  ✅ 4 notifications');

  // ============================================================
  // SECTION 22F: AUDIT LOGS
  // ============================================================
  console.log('📜 Creating audit logs...');

  const auditEntries = [
    { userId: dentistUser.id, tenantId: tenant.id, action: 'CREATE' as const, entity: 'Appointment', entityId: null, changes: { procedureType: 'Limpieza dental', patientName: 'Jane Doe' } },
    { userId: dentistUser.id, tenantId: tenant.id, action: 'UPDATE' as const, entity: 'TreatmentPlan', entityId: treatmentPlan.id, changes: { status: { from: 'DRAFT', to: 'PROPOSED' } } },
    { userId: patientUser.id, tenantId: tenant.id, action: 'CREATE' as const, entity: 'PatientConsent', entityId: null, changes: { providerId: dentistUser.id, dataAccessLevel: 'FULL' } },
    { userId: cardioUser.id, tenantId: tenantMedicentro.id, action: 'CREATE' as const, entity: 'CardiacAssessment', entityId: null, changes: { patientName: 'Pedro Ramírez', assessmentType: 'INITIAL' } },
    { userId: clinicAdminUser.id, tenantId: null, action: 'UPDATE' as const, entity: 'Clinic', entityId: null, changes: { rentalEnabled: { from: false, to: true } } },
    { userId: psicologoUser.id, tenantId: tenantMedicentro.id, action: 'CREATE' as const, entity: 'TherapySession', entityId: null, changes: { patientName: 'Andrés Martínez', sessionNumber: 3 } },
  ];

  for (const a of auditEntries) {
    await prisma.auditLog.create({
      data: {
        userId: a.userId,
        tenantId: a.tenantId,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        changes: a.changes,
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
        userAgent: 'Mozilla/5.0 (MediCloud Seed)',
        createdAt: daysFromNow(-Math.floor(Math.random() * 30)),
      },
    });
  }

  console.log('  ✅ 6 audit logs');

  // ============================================================
  // SECTION 23: CHATBOT CONFIGS
  // ============================================================
  console.log('🤖 Creating chatbot configs...');

  await prisma.chatbotConfig.upsert({
    where: { tenantId: tenantMedicentro.id },
    update: {},
    create: {
      tenantId: tenantMedicentro.id,
      isEnabled: true,
      welcomeMessage: '¡Hola! Bienvenido a MediCentro Integral. Soy el asistente virtual. ¿En qué puedo ayudarte? Puedo agendar citas, responder preguntas frecuentes o conectarte con nuestro personal.',
      fallbackMessage: 'No pude entender tu consulta. ¿Te gustaría hablar con una persona del equipo? Escribe "humano" para ser transferido.',
      practiceName: 'MediCentro Integral',
      practiceAddress: 'Av. 27 de Febrero #45, Santo Domingo, DN 10100',
      practicePhone: '+18095551234',
      practiceWebsite: 'https://medicentro.do',
      operatingHours: {
        monday: '07:00 - 20:00',
        tuesday: '07:00 - 20:00',
        wednesday: '07:00 - 20:00',
        thursday: '07:00 - 20:00',
        friday: '07:00 - 18:00',
        saturday: '08:00 - 13:00',
        sunday: 'Cerrado',
      },
      enabledChannels: ['whatsapp', 'webchat'],
      webChatTheme: 'green',
      faqs: [
        { question: '¿Qué especialidades tienen disponibles?', answer: 'Contamos con medicina general, cardiología, dermatología, oftalmología, fisioterapia, nutrición, psicología y ginecología.' },
        { question: '¿Cuál es el horario de atención?', answer: 'Lunes a jueves de 7am a 8pm, viernes de 7am a 6pm, y sábados de 8am a 1pm.' },
        { question: '¿Aceptan seguros médicos?', answer: 'Aceptamos los principales seguros: ARS Humano, Senasa, Mapfre Salud, Universal, y Palic.' },
      ],
      escalationEmail: 'recepcion@medicentro.do',
      escalationPhone: '+18095551234',
    },
  });

  await prisma.chatbotConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      isEnabled: true,
      welcomeMessage: 'Welcome to Dr. Smith Dental Practice! How can I help you today?',
      practiceName: 'Dr. Smith Dental Practice',
      enabledChannels: ['whatsapp'],
    },
  });

  console.log('  ✅ 2 chatbot configs');

  // ============================================================
  // SECTION 24: SUBSCRIPTION PLANS + EMAIL TEMPLATES (Existing)
  // ============================================================
  console.log('📦 Creating subscription plans...');

  await prisma.subscriptionPlan.upsert({
    where: { code: 'STARTER' },
    update: {},
    create: {
      name: 'Starter', code: 'STARTER',
      description: 'Plan básico para clínicas pequeñas que están comenzando',
      monthlyPrice: 29.99, yearlyPrice: 299.99, currency: 'USD',
      maxPatients: 100, maxUsers: 3, storageGB: 5,
      features: ['odontograms', 'treatment_plans', 'invoicing'],
      isActive: true, isPublic: true, sortOrder: 1,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { code: 'PROFESSIONAL' },
    update: {},
    create: {
      name: 'Professional', code: 'PROFESSIONAL',
      description: 'Plan profesional para clínicas en crecimiento con funcionalidades avanzadas',
      monthlyPrice: 79.99, yearlyPrice: 799.99, currency: 'USD',
      maxPatients: 500, maxUsers: 10, storageGB: 20,
      features: ['odontograms', 'treatment_plans', 'invoicing', 'whatsapp', 'advanced_reports', 'multi_clinic'],
      isActive: true, isPublic: true, sortOrder: 2,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { code: 'ENTERPRISE' },
    update: {},
    create: {
      name: 'Enterprise', code: 'ENTERPRISE',
      description: 'Plan empresarial para grandes clínicas con soporte prioritario y personalización',
      monthlyPrice: 199.99, yearlyPrice: 1999.99, currency: 'USD',
      maxPatients: -1, maxUsers: -1, storageGB: 100,
      features: ['odontograms', 'treatment_plans', 'invoicing', 'whatsapp', 'advanced_reports', 'api_access', 'priority_support', 'multi_clinic', 'custom_branding'],
      isActive: true, isPublic: true, sortOrder: 3,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { code: 'TEST_PLAN' },
    update: {},
    create: {
      name: 'Test Plan (Inactive)', code: 'TEST_PLAN',
      description: 'Plan de prueba desactivado para testing',
      monthlyPrice: 9.99, yearlyPrice: 99.99, currency: 'USD',
      maxPatients: 50, maxUsers: 2, storageGB: 2,
      features: ['odontograms'],
      isActive: false, isPublic: false, sortOrder: 99,
    },
  });

  console.log('  ✅ 4 subscription plans');

  // ============================================================
  // SECTION 25: EMAIL TEMPLATES (compact)
  // ============================================================
  console.log('📧 Creating email templates...');

  await prisma.emailTemplate.upsert({
    where: { type: 'WELCOME' }, update: {},
    create: { type: 'WELCOME', name: 'Bienvenida', description: 'Email de bienvenida', subject: 'Bienvenido a MediCloud - {{tenantName}}', htmlBody: '<h1>Bienvenido a MediCloud</h1><p>Hola {{ownerName}}</p>', textBody: 'Bienvenido, {{ownerName}}', variables: ['tenantName', 'ownerName', 'trialEndDate'], isActive: true },
  });
  await prisma.emailTemplate.upsert({
    where: { type: 'TRIAL_EXPIRING' }, update: {},
    create: { type: 'TRIAL_EXPIRING', name: 'Trial Expirando', description: 'Notificación trial', subject: 'Tu período de prueba expira pronto', htmlBody: '<h1>Trial expirando</h1>', textBody: 'Trial expira en {{daysRemaining}} días', variables: ['tenantName', 'ownerName', 'daysRemaining', 'trialEndDate', 'upgradeUrl'], isActive: true },
  });
  await prisma.emailTemplate.upsert({
    where: { type: 'PASSWORD_RESET' }, update: {},
    create: { type: 'PASSWORD_RESET', name: 'Restablecer Contraseña', description: 'Reset password', subject: 'Restablece tu contraseña', htmlBody: '<h1>Restablecer</h1><a href="{{resetUrl}}">Click aquí</a>', textBody: 'Restablece en: {{resetUrl}}', variables: ['userName', 'resetUrl', 'expirationTime'], isActive: true },
  });
  await prisma.emailTemplate.upsert({
    where: { type: 'PAYMENT_SUCCESS' }, update: {},
    create: { type: 'PAYMENT_SUCCESS', name: 'Pago Exitoso', description: 'Confirmación de pago', subject: 'Pago recibido - {{tenantName}}', htmlBody: '<h1>Pago Recibido</h1>', textBody: 'Pago: {{amount}} {{currency}}', variables: ['tenantName', 'ownerName', 'amount', 'currency', 'planName', 'paymentDate', 'nextPaymentDate', 'invoiceUrl'], isActive: true },
  });

  console.log('  ✅ 4 email templates');

  // ============================================================
  // SECTION 26: SMTP CONFIG
  // ============================================================
  await prisma.emailConfiguration.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      smtpHost: 'smtp.mailtrap.io', smtpPort: 587, smtpUser: 'your-mailtrap-user', smtpPassword: 'your-mailtrap-password',
      smtpSecure: false, fromEmail: 'noreply@medicloud.com', fromName: 'MediCloud', replyToEmail: 'soporte@medicloud.com',
      isActive: true, isVerified: false,
    },
  });
  console.log('  ✅ SMTP config');

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n🎉 Seed completed successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMEN DE DATOS CREADOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Users:              21 (9 existing + 9 providers + 1 clinic admin + 2 staff)');
  console.log('  Tenants:            9  (5 existing + 4 multi-discipline)');
  console.log('  Patients:           8  (2 existing + 6 new with health profiles)');
  console.log('  Clinics:            2  (1 dental + 1 multi-discipline)');
  console.log('  Consultation Rooms: 4');
  console.log('  Room Assignments:   4');
  console.log('  Clinic Staff:       3  (admin, receptionist, maintenance)');
  console.log('  Memberships:        15');
  console.log('  Relations:          15');
  console.log('  Consents:           15');
  console.log('  Appointments:       16');
  console.log('  ─── Module Data ───');
  console.log('  Odontograms:        1  (5 teeth)');
  console.log('  Treatment Plans:    1  (3 items)');
  console.log('  Clinical Notes:     2');
  console.log('  Prescriptions:      2');
  console.log('  Therapy Sessions:   3');
  console.log('  Psych Assessments:  2  (PHQ-9 + GAD-7)');
  console.log('  Exercise Plans:     1');
  console.log('  Func Assessments:   1');
  console.log('  Skin Lesions:       2');
  console.log('  Eye Exams:          1');
  console.log('  Lens Prescriptions: 1');
  console.log('  Cardiac Assessments:2  (initial + follow-up)');
  console.log('  Growth Records:     3');
  console.log('  Vaccination Records:4');
  console.log('  Nutrition Plans:    2');
  console.log('  Body Measurements:  3  (2 Andrés + 1 Pedro)');
  console.log('  Gynecological Exams:2  (32 + 34 weeks)');
  console.log('  ─── Billing & Scheduling ───');
  console.log('  Invoices:           4  (paid, pending, draft, overdue)');
  console.log('  Payments:           3  (credit card, bank transfer, cash)');
  console.log('  Recurring Appts:    3  (weekly, monthly, biweekly)');
  console.log('  Waitlist Entries:   4');
  console.log('  Notifications:      4');
  console.log('  Audit Logs:         6');
  console.log('  ─── Other ───');
  console.log('  Medical Exams:      3');
  console.log('  Shared Documents:   2');
  console.log('  Chatbot Configs:    2');
  console.log('  Subscription Plans: 4');
  console.log('  Email Templates:    4');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n📝 CREDENCIALES DE ACCESO:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ADMINISTRACIÓN:');
  console.log('  admin@dentista.com         / Admin123!        (SUPER_ADMIN)');
  console.log('  clinicadmin@medicloud.com   / ClinicAdmin123!  (CLINIC_ADMIN)');
  console.log('');
  console.log('PROVIDERS DENTAL:');
  console.log('  dentist@dentista.com       / Dentist123!      (Odontología General)');
  console.log('  dentist2@dentista.com      / Dentist456!      (Ortodoncia)');
  console.log('  dentist3@dentista.com      / Dentist789!      (Odontología General)');
  console.log('');
  console.log('PROVIDERS MULTI-DISCIPLINA:');
  console.log('  medgeneral@medicloud.com   / Provider123!     (Medicina General)');
  console.log('  psicologo@medicloud.com    / Provider123!     (Psicología)');
  console.log('  fisio@medicloud.com        / Provider123!     (Fisioterapia)');
  console.log('  dermatologo@medicloud.com  / Provider123!     (Dermatología)');
  console.log('  oftalmologo@medicloud.com  / Provider123!     (Oftalmología)');
  console.log('  cardiologo@medicloud.com   / Provider123!     (Cardiología)');
  console.log('  pediatra@medicloud.com     / Provider123!     (Pediatría)');
  console.log('  nutricionista@medicloud.com/ Provider123!     (Nutrición)');
  console.log('  ginecologa@medicloud.com   / Provider123!     (Ginecología)');
  console.log('');
  console.log('STAFF:');
  console.log('  staff@dentista.com         / Staff123!        (Recepcionista)');
  console.log('  staff2@dentista.com        / Staff456!        (Recepcionista)');
  console.log('  assistant@dentista.com     / Assistant123!    (Asistente)');
  console.log('  recepcion@medicloud.com    / Staff123!        (Recepcionista Clínica)');
  console.log('  mantenimiento@medicloud.com/ Staff123!        (Mantenimiento)');
  console.log('');
  console.log('PACIENTES:');
  console.log('  patient@dentista.com       / Patient123!      (Jane Doe — dental)');
  console.log('  patient2@dentista.com      / Patient456!      (John Smith — dental)');
  console.log('  maria.santos@mail.com      / Patient123!      (Embarazada 32 sem)');
  console.log('  pedro.ramirez@mail.com     / Patient123!      (HTA+DM2+Cardio)');
  console.log('  lucia.fernandez@mail.com   / Patient123!      (Pediátrica 8 años)');
  console.log('  roberto.diaz@mail.com      / Patient123!      (Rehab rodilla)');
  console.log('  carmen.lopez@mail.com      / Patient123!      (Glaucoma+Cataratas)');
  console.log('  andres.martinez@mail.com   / Patient123!      (Derma+Psico+Nutri)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
