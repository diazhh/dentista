/**
 * seed-dentista-tenant.ts
 * Seeds ULTRA COMPLETAS para el tenant dentist@dentista.com
 * Clínica Dental Sonrisa Perfecta — Caracas, Venezuela
 *
 * Uso: npx ts-node -r tsconfig-paths/register prisma/seed-dentista-tenant.ts
 */

import {
  PrismaClient,
  UserRole,
  MedicalSpecialty,
  AppointmentStatus,
  Gender,
  TreatmentPlanStatus,
  TreatmentItemStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  DocumentType,
  ToothCondition,
  ToothSurface,
  WaitlistStatus,
  NotificationType,
  NotificationChannel,
  ConsentStatus,
  DataAccessLevel,
  RecurrenceFrequency,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000);
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000);
const rand = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

function setTime(date: Date, hours: number, minutes = 0): Date {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

let invoiceCounter = 1;
function nextInvoiceNumber(): string {
  return `INV-SP-${String(invoiceCounter++).padStart(5, '0')}`;
}

async function main() {
  console.log('🦷 Seeding Clínica Dental Sonrisa Perfecta (dentist@dentista.com)...\n');

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. OBTENER TENANT Y USUARIO BASE
  // ══════════════════════════════════════════════════════════════════════════════
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { subdomain: 'drsmith' } });
  const dentistUser = await prisma.user.findUniqueOrThrow({ where: { email: 'dentist@dentista.com' } });

  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. LIMPIEZA — Borrar datos previos de este tenant
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('🧹 Limpiando datos previos del tenant...');
  await prisma.notification.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.waitlist.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.recurringAppointment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.payment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.invoiceItem.deleteMany({ where: { invoice: { tenantId: tenant.id } } });
  await prisma.invoice.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.prescription.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.clinicalNote.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.odontogramTooth.deleteMany({ where: { odontogram: { tenantId: tenant.id } } });
  await prisma.odontogram.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.treatmentPlanItem.deleteMany({ where: { treatmentPlan: { tenantId: tenant.id } } });
  await prisma.treatmentPlan.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.appointment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.patientConsent.deleteMany({});
  console.log('  ✅ Limpieza completa');

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. DOCTORES Y STAFF ADICIONALES
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('👨‍⚕️ Creando doctores y staff...');
  const pass = async (p: string) => bcrypt.hash(p, 10);

  const ortodoncista = await prisma.user.upsert({
    where: { email: 'ortodoncista@sonrisaperfecta.com' },
    update: {},
    create: {
      email: 'ortodoncista@sonrisaperfecta.com',
      name: 'Dra. Gabriela Fernández',
      passwordHash: await pass('Dentist123!'),
      phone: '+58-412-9001234',
      role: UserRole.PROVIDER,
      licenseNumber: 'MSAS-45678',
      npiNumber: 'VE-ORT-001',
      specialties: [MedicalSpecialty.ORTHODONTICS],
      bio: 'Ortodoncista con 12 años de experiencia en brackets convencionales, autoligado y alineadores invisibles. Universidad Central de Venezuela.',
    },
  });

  const endodoncista = await prisma.user.upsert({
    where: { email: 'endodoncista@sonrisaperfecta.com' },
    update: {},
    create: {
      email: 'endodoncista@sonrisaperfecta.com',
      name: 'Dr. Ricardo Blanco',
      passwordHash: await pass('Dentist123!'),
      phone: '+58-414-8002345',
      role: UserRole.PROVIDER,
      licenseNumber: 'MSAS-56789',
      npiNumber: 'VE-END-001',
      specialties: [MedicalSpecialty.ENDODONTICS],
      bio: 'Endodoncista especializado en tratamientos de conducto y microcirugía apical. Egresado de la Universidad de Los Andes.',
    },
  });

  const asistente1 = await prisma.user.upsert({
    where: { email: 'asistente1@sonrisaperfecta.com' },
    update: {},
    create: {
      email: 'asistente1@sonrisaperfecta.com',
      name: 'Daniela Rojas',
      passwordHash: await pass('Staff123!'),
      phone: '+58-416-3004567',
      role: UserRole.STAFF_ASSISTANT,
    },
  });

  const recepcionista = await prisma.user.upsert({
    where: { email: 'recepcion@sonrisaperfecta.com' },
    update: {},
    create: {
      email: 'recepcion@sonrisaperfecta.com',
      name: 'Patricia Vargas',
      passwordHash: await pass('Staff123!'),
      phone: '+58-424-5006789',
      role: UserRole.STAFF_RECEPTIONIST,
    },
  });

  // Membresías al tenant
  const staffUsers = [
    { userId: ortodoncista.id, role: UserRole.PROVIDER },
    { userId: endodoncista.id, role: UserRole.PROVIDER },
    { userId: asistente1.id, role: UserRole.STAFF_ASSISTANT },
    { userId: recepcionista.id, role: UserRole.STAFF_RECEPTIONIST },
  ];
  for (const su of staffUsers) {
    await prisma.tenantMembership.upsert({
      where: { userId_tenantId: { userId: su.userId, tenantId: tenant.id } },
      update: {},
      create: { userId: su.userId, tenantId: tenant.id, role: su.role, isActive: true },
    });
  }

  const providers = [dentistUser, ortodoncista, endodoncista];
  console.log('  ✅ 2 doctores + 2 staff creados');

  // ══════════════════════════════════════════════════════════════════════════════
  // 4. CLÍNICA
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('🏥 Creando clínica...');
  const clinic = await prisma.clinic.upsert({
    where: { id: 'clinic-sonrisa-perfecta' },
    update: {},
    create: {
      id: 'clinic-sonrisa-perfecta',
      name: 'Clínica Dental Sonrisa Perfecta',
      address: {
        street: 'Av. Francisco de Miranda, Torre Dental Piso 3',
        city: 'Caracas',
        state: 'Distrito Capital',
        municipality: 'Chacao',
        zipCode: '1060',
        country: 'Venezuela',
      },
      phone: '+58-212-2653421',
      email: 'info@sonrisaperfecta.com.ve',
      latitude: 10.4918,
      longitude: -66.8558,
      adminUserId: dentistUser.id,
      floors: 1,
      description: 'Clínica dental moderna con tecnología de punta. Especializada en odontología general, ortodoncia y endodoncia. Más de 15 años al servicio de la comunidad caraqueña.',
      website: 'https://sonrisaperfecta.com.ve',
      taxId: 'J-12345678-9',
      businessHours: {
        monday: { open: '08:00', close: '17:00' },
        tuesday: { open: '08:00', close: '17:00' },
        wednesday: { open: '08:00', close: '17:00' },
        thursday: { open: '08:00', close: '17:00' },
        friday: { open: '08:00', close: '16:00' },
        saturday: { open: '08:00', close: '12:00' },
        sunday: null,
      },
      specialties: [MedicalSpecialty.GENERAL_DENTISTRY, MedicalSpecialty.ORTHODONTICS, MedicalSpecialty.ENDODONTICS],
      amenities: ['WiFi', 'Estacionamiento', 'Aire acondicionado', 'TV en consultorio', 'Zona infantil'],
      createdBy: dentistUser.id,
      isActive: true,
      isPublic: true,
    },
  });

  // Consultorios
  const room1 = await prisma.consultationRoom.upsert({
    where: { id: 'room-sp-1' },
    update: {},
    create: {
      id: 'room-sp-1',
      clinicId: clinic.id,
      name: 'Consultorio 1 - General',
      floor: 1,
      roomNumber: '301',
      description: 'Consultorio principal para odontología general y procedimientos restaurativos',
      capabilities: ['Radiografía digital', 'Lámpara de fotocurado', 'Unidad dental completa', 'Cavitron'],
      bufferMinutes: 10,
      maxDailyHours: 8,
      isActive: true,
    },
  });

  const room2 = await prisma.consultationRoom.upsert({
    where: { id: 'room-sp-2' },
    update: {},
    create: {
      id: 'room-sp-2',
      clinicId: clinic.id,
      name: 'Consultorio 2 - Ortodoncia',
      floor: 1,
      roomNumber: '302',
      description: 'Consultorio especializado en ortodoncia con escáner intraoral',
      capabilities: ['Escáner intraoral 3D', 'Fotografía dental', 'Unidad dental completa'],
      bufferMinutes: 15,
      maxDailyHours: 8,
      isActive: true,
    },
  });

  const room3 = await prisma.consultationRoom.upsert({
    where: { id: 'room-sp-3' },
    update: {},
    create: {
      id: 'room-sp-3',
      clinicId: clinic.id,
      name: 'Consultorio 3 - Endodoncia',
      floor: 1,
      roomNumber: '303',
      description: 'Consultorio equipado para endodoncia con localizador apical y motor rotatorio',
      capabilities: ['Localizador apical', 'Motor rotatorio', 'Microscopio dental', 'Radiografía periapical'],
      bufferMinutes: 15,
      maxDailyHours: 8,
      isActive: true,
    },
  });

  console.log('  ✅ Clínica + 3 consultorios creados');

  // ══════════════════════════════════════════════════════════════════════════════
  // 5. SERVICIOS MÉDICOS
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('💊 Creando catálogo de servicios...');
  const serviceDefs = [
    { code: 'CONS-001', name: 'Consulta general', category: 'CONSULTA', price: 50, duration: 30 },
    { code: 'CONS-002', name: 'Consulta de emergencia', category: 'CONSULTA', price: 80, duration: 45 },
    { code: 'PREV-001', name: 'Limpieza dental (profilaxis)', category: 'PREVENTIVO', price: 80, duration: 45 },
    { code: 'PREV-002', name: 'Aplicación de flúor', category: 'PREVENTIVO', price: 40, duration: 20 },
    { code: 'PREV-003', name: 'Sellante de fosas y fisuras', category: 'PREVENTIVO', price: 35, duration: 20 },
    { code: 'REST-001', name: 'Empaste resina compuesta (1 sup.)', category: 'RESTAURATIVO', price: 120, duration: 45 },
    { code: 'REST-002', name: 'Empaste resina compuesta (2+ sup.)', category: 'RESTAURATIVO', price: 160, duration: 60 },
    { code: 'REST-003', name: 'Reconstrucción dental', category: 'RESTAURATIVO', price: 200, duration: 60 },
    { code: 'ENDO-001', name: 'Endodoncia anterior (1 conducto)', category: 'ENDODONCIA', price: 250, duration: 90 },
    { code: 'ENDO-002', name: 'Endodoncia premolar (2 conductos)', category: 'ENDODONCIA', price: 350, duration: 120 },
    { code: 'ENDO-003', name: 'Endodoncia molar (3+ conductos)', category: 'ENDODONCIA', price: 450, duration: 150 },
    { code: 'EXTR-001', name: 'Extracción simple', category: 'CIRUGÍA', price: 100, duration: 30 },
    { code: 'EXTR-002', name: 'Extracción quirúrgica', category: 'CIRUGÍA', price: 200, duration: 60 },
    { code: 'EXTR-003', name: 'Extracción tercer molar', category: 'CIRUGÍA', price: 300, duration: 90 },
    { code: 'PROT-001', name: 'Corona porcelana/metal', category: 'PRÓTESIS', price: 500, duration: 90 },
    { code: 'PROT-002', name: 'Corona libre de metal (zirconia)', category: 'PRÓTESIS', price: 650, duration: 90 },
    { code: 'PROT-003', name: 'Puente fijo (3 unidades)', category: 'PRÓTESIS', price: 1400, duration: 120 },
    { code: 'ORTO-001', name: 'Evaluación ortodóncica', category: 'ORTODONCIA', price: 60, duration: 45 },
    { code: 'ORTO-002', name: 'Brackets metálicos (instalación)', category: 'ORTODONCIA', price: 800, duration: 120 },
    { code: 'ORTO-003', name: 'Control ortodóncico mensual', category: 'ORTODONCIA', price: 50, duration: 30 },
    { code: 'ORTO-004', name: 'Alineadores invisibles (juego)', category: 'ORTODONCIA', price: 2500, duration: 60 },
    { code: 'ESTET-001', name: 'Blanqueamiento dental en consultorio', category: 'ESTÉTICA', price: 300, duration: 90 },
    { code: 'ESTET-002', name: 'Carilla de porcelana (por diente)', category: 'ESTÉTICA', price: 400, duration: 60 },
    { code: 'RAD-001', name: 'Radiografía panorámica', category: 'DIAGNÓSTICO', price: 60, duration: 15 },
    { code: 'RAD-002', name: 'Radiografía periapical', category: 'DIAGNÓSTICO', price: 25, duration: 10 },
    { code: 'PERIO-001', name: 'Raspado y alisado radicular', category: 'PERIODONCIA', price: 180, duration: 60 },
    { code: 'PERIO-002', name: 'Cirugía periodontal por cuadrante', category: 'PERIODONCIA', price: 350, duration: 90 },
  ];

  const services: Record<string, any> = {};
  for (const sd of serviceDefs) {
    const svc = await prisma.medicalService.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: sd.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        code: sd.code,
        name: sd.name,
        category: sd.category,
        defaultPrice: sd.price,
        duration: sd.duration,
        isActive: true,
      },
    });
    services[sd.code] = svc;
  }
  console.log(`  ✅ ${serviceDefs.length} servicios creados`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 6. PACIENTES (17)
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('🧑 Creando pacientes...');

  const patientDefs = [
    // Adultos jóvenes/medios
    { firstName: 'Carlos', lastName: 'Mendoza', email: 'carlos.mendoza@gmail.com', docId: 'V-18456723', phone: '+58-412-5678901', dob: '1983-04-12', gender: Gender.MALE, bloodType: 'O+', allergies: [] as string[], medications: [] as string[], chronic: [] as string[], emergName: 'Ana Mendoza', emergPhone: '+58-412-5678902', emergRel: 'Esposa' },
    { firstName: 'María', lastName: 'García', email: 'maria.garcia@hotmail.com', docId: 'V-20134567', phone: '+58-414-3456789', dob: '1990-07-25', gender: Gender.FEMALE, bloodType: 'A+', allergies: ['Penicilina'], medications: [] as string[], chronic: [] as string[], emergName: 'Pedro García', emergPhone: '+58-414-3456790', emergRel: 'Hermano' },
    { firstName: 'José', lastName: 'Pérez', email: 'jose.perez@outlook.com', docId: 'V-22345678', phone: '+58-416-7890123', dob: '1997-11-08', gender: Gender.MALE, bloodType: 'B+', allergies: [] as string[], medications: [] as string[], chronic: [] as string[], emergName: 'Rosa Pérez', emergPhone: '+58-416-7890124', emergRel: 'Madre' },
    { firstName: 'Ana', lastName: 'Rodríguez', email: 'ana.rodriguez@gmail.com', docId: 'V-14567890', phone: '+58-424-2345678', dob: '1974-02-18', gender: Gender.FEMALE, bloodType: 'AB+', allergies: ['Ibuprofeno'], medications: ['Losartán 50mg'], chronic: ['Hipertensión'], emergName: 'Luis Rodríguez', emergPhone: '+58-424-2345679', emergRel: 'Esposo' },
    { firstName: 'Luis', lastName: 'Herrera', email: 'luis.herrera@cantv.net', docId: 'V-8901234', phone: '+58-412-8901234', dob: '1958-06-30', gender: Gender.MALE, bloodType: 'O-', allergies: ['Aspirina', 'Látex'], medications: ['Metformina 850mg', 'Enalapril 10mg'], chronic: ['Diabetes tipo 2', 'Hipertensión'], emergName: 'Carmen Herrera', emergPhone: '+58-412-8901235', emergRel: 'Esposa' },
    { firstName: 'Carmen', lastName: 'López', email: 'carmen.lopez@gmail.com', docId: 'V-16789012', phone: '+58-414-6789012', dob: '1978-09-05', gender: Gender.FEMALE, bloodType: 'A-', allergies: [] as string[], medications: [] as string[], chronic: [] as string[], emergName: 'Roberto López', emergPhone: '+58-414-6789013', emergRel: 'Esposo' },
    { firstName: 'Pedro', lastName: 'Martínez', email: 'pedro.martinez@yahoo.com', docId: 'V-21567890', phone: '+58-416-1567890', dob: '1994-01-22', gender: Gender.MALE, bloodType: 'B-', allergies: [] as string[], medications: [] as string[], chronic: [] as string[], emergName: 'Julia Martínez', emergPhone: '+58-416-1567891', emergRel: 'Madre' },
    // Niños
    { firstName: 'Rosa', lastName: 'Jiménez', email: 'rosa.jimenez.rep@gmail.com', docId: 'V-32456789', phone: '+58-424-4567890', dob: '2016-03-14', gender: Gender.FEMALE, bloodType: 'O+', allergies: [] as string[], medications: [] as string[], chronic: [] as string[], emergName: 'Laura Jiménez', emergPhone: '+58-424-4567891', emergRel: 'Madre' },
    { firstName: 'Isabel', lastName: 'Torres', email: 'isabel.torres.rep@gmail.com', docId: 'V-33567890', phone: '+58-412-3567890', dob: '2014-08-21', gender: Gender.FEMALE, bloodType: 'A+', allergies: [] as string[], medications: [] as string[], chronic: [] as string[], emergName: 'Miguel Torres', emergPhone: '+58-412-3567891', emergRel: 'Padre' },
    { firstName: 'Luisa', lastName: 'Vega', email: 'luisa.vega.rep@gmail.com', docId: 'V-34678901', phone: '+58-414-4678901', dob: '2018-05-10', gender: Gender.FEMALE, bloodType: 'B+', allergies: [] as string[], medications: [] as string[], chronic: [] as string[], emergName: 'Antonio Vega', emergPhone: '+58-414-4678902', emergRel: 'Padre' },
    // Más adultos
    { firstName: 'Jorge', lastName: 'Ramírez', email: 'jorge.ramirez@gmail.com', docId: 'V-15678901', phone: '+58-416-5678901', dob: '1971-12-03', gender: Gender.MALE, bloodType: 'AB-', allergies: ['Clindamicina'], medications: [] as string[], chronic: [] as string[], emergName: 'Elena Ramírez', emergPhone: '+58-416-5678902', emergRel: 'Esposa' },
    { firstName: 'Elena', lastName: 'Castillo', email: 'elena.castillo@gmail.com', docId: 'V-9012345', phone: '+58-424-9012345', dob: '1962-04-17', gender: Gender.FEMALE, bloodType: 'O+', allergies: [] as string[], medications: ['Amlodipino 5mg'], chronic: ['Hipertensión'], emergName: 'Fernando Castillo', emergPhone: '+58-424-9012346', emergRel: 'Hijo' },
    { firstName: 'Rafael', lastName: 'Moreno', email: 'rafael.moreno@yahoo.com', docId: 'V-17890123', phone: '+58-412-7890123', dob: '1981-10-28', gender: Gender.MALE, bloodType: 'A+', allergies: [] as string[], medications: [] as string[], chronic: [] as string[], emergName: 'Claudia Moreno', emergPhone: '+58-412-7890124', emergRel: 'Esposa' },
    { firstName: 'Miguel', lastName: 'Ramos', email: 'miguel.ramos@gmail.com', docId: 'V-19012345', phone: '+58-414-9012345', dob: '1988-08-15', gender: Gender.MALE, bloodType: 'O+', allergies: [] as string[], medications: [] as string[], chronic: [] as string[], emergName: 'Sofía Ramos', emergPhone: '+58-414-9012346', emergRel: 'Esposa' },
    // Adultos mayores
    { firstName: 'Antonio', lastName: 'Flores', email: 'antonio.flores@cantv.net', docId: 'V-7890123', phone: '+58-416-7890123', dob: '1966-07-09', gender: Gender.MALE, bloodType: 'B+', allergies: [] as string[], medications: ['Atorvastatina 20mg'], chronic: ['Dislipidemia'], emergName: 'Gloria Flores', emergPhone: '+58-416-7890124', emergRel: 'Esposa' },
    { firstName: 'Gloria', lastName: 'Medina', email: 'gloria.medina@gmail.com', docId: 'V-23456789', phone: '+58-424-3456789', dob: '1996-11-20', gender: Gender.FEMALE, bloodType: 'A-', allergies: [] as string[], medications: [] as string[], chronic: [] as string[], emergName: 'Eduardo Medina', emergPhone: '+58-424-3456790', emergRel: 'Hermano' },
    { firstName: 'Eduardo', lastName: 'Sánchez', email: 'eduardo.sanchez@cantv.net', docId: 'V-6789012', phone: '+58-412-6789012', dob: '1953-01-04', gender: Gender.MALE, bloodType: 'O-', allergies: ['Penicilina', 'Aspirina'], medications: ['Warfarina 5mg', 'Omeprazol 20mg', 'Amlodipino 10mg'], chronic: ['Cardiopatía', 'ERGE', 'Hipertensión'], emergName: 'Silvia Sánchez', emergPhone: '+58-412-6789013', emergRel: 'Hija' },
  ];

  const patients: any[] = [];
  for (const pd of patientDefs) {
    const userRec = await prisma.user.upsert({
      where: { email: pd.email },
      update: {},
      create: {
        email: pd.email,
        name: `${pd.firstName} ${pd.lastName}`,
        passwordHash: await pass('Patient123!'),
        phone: pd.phone,
        role: UserRole.PATIENT,
      },
    });

    const patRec = await prisma.patient.upsert({
      where: { userId: userRec.id },
      update: {},
      create: {
        userId: userRec.id,
        documentId: pd.docId,
        firstName: pd.firstName,
        lastName: pd.lastName,
        dateOfBirth: new Date(pd.dob),
        gender: pd.gender,
        phone: pd.phone,
        email: pd.email,
        bloodType: pd.bloodType,
        allergies: pd.allergies,
        medications: pd.medications,
        chronicConditions: pd.chronic,
        emergencyContactName: pd.emergName,
        emergencyContactPhone: pd.emergPhone,
        emergencyContactRelation: pd.emergRel,
        address: {
          street: `Calle ${rand(1, 30)}, Qta. ${pd.lastName}`,
          urbanization: ['Los Palos Grandes', 'Altamira', 'La Castellana', 'El Rosal', 'Las Mercedes', 'Chuao', 'Bello Monte', 'Santa Mónica'][rand(0, 7)],
          city: 'Caracas',
          state: 'Distrito Capital',
          country: 'Venezuela',
        },
        medicalHistory: {
          conditions: pd.chronic,
          surgeries: [],
          familyHistory: [],
        },
        portalEnabled: true,
        defaultDataAccess: DataAccessLevel.FULL,
      },
    });

    // Membresía
    await prisma.tenantMembership.upsert({
      where: { userId_tenantId: { userId: userRec.id, tenantId: tenant.id } },
      update: {},
      create: { userId: userRec.id, tenantId: tenant.id, role: UserRole.PATIENT, isActive: true },
    });

    // Relación con dentista general
    await prisma.providerPatientRelation.upsert({
      where: { patientId_providerId: { patientId: patRec.id, providerId: dentistUser.id } },
      update: {},
      create: {
        patientId: patRec.id,
        providerId: dentistUser.id,
        tenantId: tenant.id,
        dataAccessLevel: DataAccessLevel.FULL,
        providerNotes: `Paciente activo de la clínica Sonrisa Perfecta.`,
      },
    });

    patients.push({ ...patRec, user: userRec, def: pd });
  }
  console.log(`  ✅ ${patients.length} pacientes creados`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 7. ODONTOGRAMAS
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('🦷 Creando odontogramas...');

  // Teeth templates by patient type
  function generateTeeth(type: 'child' | 'adult' | 'elder'): { toothNumber: number; condition: ToothCondition; surfaces: ToothSurface[]; notes: string }[] {
    const teeth: any[] = [];
    const allAdult = [11,12,13,14,15,16,17,18, 21,22,23,24,25,26,27,28, 31,32,33,34,35,36,37,38, 41,42,43,44,45,46,47,48];

    if (type === 'child') {
      // Children: permanent incisors + deciduous molars, mostly healthy
      const childTeeth = [11,12,13,14,15,16, 21,22,23,24,25,26, 31,32,33,34,35,36, 41,42,43,44,45,46];
      for (const t of childTeeth) {
        const r = Math.random();
        if (r < 0.1) teeth.push({ toothNumber: t, condition: ToothCondition.CAVITY, surfaces: [ToothSurface.OCCLUSAL], notes: 'Caries incipiente en superficie oclusal' });
        else if (r < 0.15) teeth.push({ toothNumber: t, condition: ToothCondition.FILLED, surfaces: [ToothSurface.OCCLUSAL], notes: 'Resina preventiva en fosa' });
        else teeth.push({ toothNumber: t, condition: ToothCondition.HEALTHY, surfaces: [], notes: '' });
      }
    } else if (type === 'elder') {
      // Elders: many missing, crowned, root canals
      for (const t of allAdult) {
        const r = Math.random();
        if (r < 0.2) teeth.push({ toothNumber: t, condition: ToothCondition.MISSING, surfaces: [], notes: 'Ausente - pérdida por enfermedad periodontal' });
        else if (r < 0.3) teeth.push({ toothNumber: t, condition: ToothCondition.CROWN, surfaces: [], notes: 'Corona metal-porcelana en buen estado' });
        else if (r < 0.38) teeth.push({ toothNumber: t, condition: ToothCondition.ROOT_CANAL, surfaces: [], notes: 'Endodoncia previa, requiere seguimiento' });
        else if (r < 0.45) teeth.push({ toothNumber: t, condition: ToothCondition.FILLED, surfaces: [ToothSurface.MESIAL, ToothSurface.OCCLUSAL], notes: 'Amalgama antigua MO' });
        else if (r < 0.5) teeth.push({ toothNumber: t, condition: ToothCondition.WORN, surfaces: [], notes: 'Desgaste por bruxismo' });
        else if (r < 0.55) teeth.push({ toothNumber: t, condition: ToothCondition.FRACTURED, surfaces: [], notes: 'Fractura coronal parcial' });
        else teeth.push({ toothNumber: t, condition: ToothCondition.HEALTHY, surfaces: [], notes: '' });
      }
    } else {
      // Adults: realistic mix
      for (const t of allAdult) {
        const r = Math.random();
        if (r < 0.08) teeth.push({ toothNumber: t, condition: ToothCondition.CAVITY, surfaces: [ToothSurface.OCCLUSAL, ToothSurface.MESIAL][rand(0, 1)] === ToothSurface.OCCLUSAL ? [ToothSurface.OCCLUSAL] : [ToothSurface.MESIAL], notes: 'Lesión cariosa activa' });
        else if (r < 0.18) teeth.push({ toothNumber: t, condition: ToothCondition.FILLED, surfaces: [ToothSurface.OCCLUSAL], notes: 'Resina compuesta en buen estado' });
        else if (r < 0.22) teeth.push({ toothNumber: t, condition: ToothCondition.CROWN, surfaces: [], notes: 'Corona de porcelana' });
        else if (r < 0.25) teeth.push({ toothNumber: t, condition: ToothCondition.ROOT_CANAL, surfaces: [], notes: 'Tratamiento de conducto previo' });
        else if (t === 18 || t === 28 || t === 38 || t === 48) {
          if (Math.random() < 0.4) teeth.push({ toothNumber: t, condition: ToothCondition.MISSING, surfaces: [], notes: 'Tercer molar extraído' });
          else teeth.push({ toothNumber: t, condition: ToothCondition.HEALTHY, surfaces: [], notes: '' });
        }
        else teeth.push({ toothNumber: t, condition: ToothCondition.HEALTHY, surfaces: [], notes: '' });
      }
    }
    return teeth;
  }

  for (const pat of patients) {
    const age = new Date().getFullYear() - new Date(pat.def.dob).getFullYear();
    const type = age < 15 ? 'child' : age >= 60 ? 'elder' : 'adult';
    const teeth = generateTeeth(type);

    const odonto = await prisma.odontogram.create({
      data: {
        patientId: pat.id,
        providerId: dentistUser.id,
        tenantId: tenant.id,
        date: daysAgo(rand(30, 180)),
        notes: `Odontograma inicial - ${pat.def.firstName} ${pat.def.lastName}. Examen completo realizado.`,
        teeth: {
          create: teeth.map(t => ({
            toothNumber: t.toothNumber,
            condition: t.condition,
            surfaces: t.surfaces,
            notes: t.notes || null,
          })),
        },
      },
    });
  }
  console.log(`  ✅ ${patients.length} odontogramas con dientes creados`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 8. PLANES DE TRATAMIENTO
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('📋 Creando planes de tratamiento...');

  const treatmentTemplates = [
    {
      title: 'Restauraciones múltiples',
      diagnosis: 'Caries dental múltiple',
      status: TreatmentPlanStatus.IN_PROGRESS,
      items: [
        { tooth: '16', procedure: 'Empaste resina compuesta', code: 'REST-001', cost: 120, status: TreatmentItemStatus.COMPLETED },
        { tooth: '26', procedure: 'Empaste resina compuesta', code: 'REST-001', cost: 120, status: TreatmentItemStatus.COMPLETED },
        { tooth: '36', procedure: 'Empaste resina compuesta (2 sup.)', code: 'REST-002', cost: 160, status: TreatmentItemStatus.IN_PROGRESS },
        { tooth: '46', procedure: 'Empaste resina compuesta', code: 'REST-001', cost: 120, status: TreatmentItemStatus.PENDING },
      ],
    },
    {
      title: 'Tratamiento endodóncico + corona',
      diagnosis: 'Pulpitis irreversible en premolar 24',
      status: TreatmentPlanStatus.IN_PROGRESS,
      items: [
        { tooth: '24', procedure: 'Endodoncia premolar', code: 'ENDO-002', cost: 350, status: TreatmentItemStatus.COMPLETED },
        { tooth: '24', procedure: 'Reconstrucción dental', code: 'REST-003', cost: 200, status: TreatmentItemStatus.COMPLETED },
        { tooth: '24', procedure: 'Corona porcelana/metal', code: 'PROT-001', cost: 500, status: TreatmentItemStatus.PENDING },
      ],
    },
    {
      title: 'Tratamiento periodontal',
      diagnosis: 'Enfermedad periodontal moderada',
      status: TreatmentPlanStatus.ACCEPTED,
      items: [
        { tooth: null, procedure: 'Raspado y alisado Q1', code: 'PERIO-001', cost: 180, status: TreatmentItemStatus.PENDING },
        { tooth: null, procedure: 'Raspado y alisado Q2', code: 'PERIO-001', cost: 180, status: TreatmentItemStatus.PENDING },
        { tooth: null, procedure: 'Raspado y alisado Q3', code: 'PERIO-001', cost: 180, status: TreatmentItemStatus.PENDING },
        { tooth: null, procedure: 'Raspado y alisado Q4', code: 'PERIO-001', cost: 180, status: TreatmentItemStatus.PENDING },
      ],
    },
    {
      title: 'Tratamiento ortodóncico completo',
      diagnosis: 'Maloclusión clase II div. 1',
      status: TreatmentPlanStatus.IN_PROGRESS,
      items: [
        { tooth: null, procedure: 'Evaluación ortodóncica', code: 'ORTO-001', cost: 60, status: TreatmentItemStatus.COMPLETED },
        { tooth: null, procedure: 'Brackets metálicos', code: 'ORTO-002', cost: 800, status: TreatmentItemStatus.COMPLETED },
        { tooth: null, procedure: 'Control mensual x12', code: 'ORTO-003', cost: 600, status: TreatmentItemStatus.IN_PROGRESS },
      ],
    },
    {
      title: 'Extracciones + prótesis parcial',
      diagnosis: 'Restos radiculares múltiples sin posibilidad de restauración',
      status: TreatmentPlanStatus.COMPLETED,
      items: [
        { tooth: '14', procedure: 'Extracción simple', code: 'EXTR-001', cost: 100, status: TreatmentItemStatus.COMPLETED },
        { tooth: '25', procedure: 'Extracción simple', code: 'EXTR-001', cost: 100, status: TreatmentItemStatus.COMPLETED },
        { tooth: null, procedure: 'Puente fijo 3 unidades', code: 'PROT-003', cost: 1400, status: TreatmentItemStatus.COMPLETED },
      ],
    },
    {
      title: 'Blanqueamiento + estética',
      diagnosis: 'Discromía dental generalizada',
      status: TreatmentPlanStatus.COMPLETED,
      items: [
        { tooth: null, procedure: 'Limpieza dental', code: 'PREV-001', cost: 80, status: TreatmentItemStatus.COMPLETED },
        { tooth: null, procedure: 'Blanqueamiento dental', code: 'ESTET-001', cost: 300, status: TreatmentItemStatus.COMPLETED },
      ],
    },
    {
      title: 'Endodoncia molar + reconstrucción',
      diagnosis: 'Necrosis pulpar en molar 46',
      status: TreatmentPlanStatus.ACCEPTED,
      items: [
        { tooth: '46', procedure: 'Endodoncia molar', code: 'ENDO-003', cost: 450, status: TreatmentItemStatus.PENDING },
        { tooth: '46', procedure: 'Reconstrucción dental', code: 'REST-003', cost: 200, status: TreatmentItemStatus.PENDING },
        { tooth: '46', procedure: 'Corona zirconia', code: 'PROT-002', cost: 650, status: TreatmentItemStatus.PENDING },
      ],
    },
    {
      title: 'Preventivo integral infantil',
      diagnosis: 'Riesgo cariogénico moderado',
      status: TreatmentPlanStatus.IN_PROGRESS,
      items: [
        { tooth: null, procedure: 'Limpieza dental', code: 'PREV-001', cost: 80, status: TreatmentItemStatus.COMPLETED },
        { tooth: null, procedure: 'Aplicación de flúor', code: 'PREV-002', cost: 40, status: TreatmentItemStatus.COMPLETED },
        { tooth: '16', procedure: 'Sellante de fosas', code: 'PREV-003', cost: 35, status: TreatmentItemStatus.PENDING },
        { tooth: '26', procedure: 'Sellante de fosas', code: 'PREV-003', cost: 35, status: TreatmentItemStatus.PENDING },
        { tooth: '36', procedure: 'Sellante de fosas', code: 'PREV-003', cost: 35, status: TreatmentItemStatus.PENDING },
        { tooth: '46', procedure: 'Sellante de fosas', code: 'PREV-003', cost: 35, status: TreatmentItemStatus.PENDING },
      ],
    },
  ];

  const treatmentPlans: any[] = [];
  for (let i = 0; i < patients.length; i++) {
    const pat = patients[i];
    const numPlans = i < 5 ? 2 : i < 10 ? 1 : rand(1, 2);

    for (let j = 0; j < numPlans; j++) {
      const template = treatmentTemplates[(i + j) % treatmentTemplates.length];
      const totalCost = template.items.reduce((sum, it) => sum + it.cost, 0);
      const provider = template.title.includes('ortodónc') ? ortodoncista : template.title.includes('endodón') ? endodoncista : dentistUser;

      const tp = await prisma.treatmentPlan.create({
        data: {
          patientId: pat.id,
          providerId: provider.id,
          tenantId: tenant.id,
          title: template.title,
          description: `Plan de tratamiento para ${pat.def.firstName} ${pat.def.lastName}`,
          diagnosis: template.diagnosis,
          status: template.status,
          totalCost,
          startDate: daysAgo(rand(30, 150)),
          endDate: template.status === TreatmentPlanStatus.COMPLETED ? daysAgo(rand(1, 29)) : null,
          notes: `Paciente informado sobre opciones de tratamiento y costos. Consentimiento obtenido.`,
          items: {
            create: template.items.map((it, idx) => ({
              tooth: it.tooth,
              procedureCode: it.code,
              procedureName: it.procedure,
              description: `${it.procedure}${it.tooth ? ` - diente ${it.tooth}` : ''}`,
              status: it.status,
              estimatedCost: it.cost,
              actualCost: it.status === TreatmentItemStatus.COMPLETED ? it.cost : null,
              priority: idx + 1,
              estimatedDuration: 45,
            })),
          },
        },
      });
      treatmentPlans.push(tp);
    }
  }
  console.log(`  ✅ ${treatmentPlans.length} planes de tratamiento creados`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 9. CITAS PASADAS (últimos 6 meses)
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('📅 Creando citas pasadas...');

  const procedureTypes = ['Consulta general', 'Limpieza dental', 'Empaste', 'Extracción', 'Endodoncia', 'Control ortodóncico', 'Radiografía', 'Blanqueamiento'];
  const pastNotes = [
    'Paciente asiste a control. Se realiza examen clínico completo. Sin hallazgos patológicos nuevos.',
    'Se realizó profilaxis dental con ultrasonido y pulido con copa de goma. Encías sanas.',
    'Restauración con resina compuesta fotocurada. Oclusión verificada, paciente sin molestias.',
    'Extracción atraumática bajo anestesia local (lidocaína 2% con epinefrina). Hemostasia adecuada.',
    'Tratamiento de conducto completado. Longitud de trabajo confirmada con localizador apical. Obturación con gutapercha.',
    'Ajuste de brackets y cambio de arco. Progreso satisfactorio de alineación.',
    'Radiografía panorámica tomada. Se observa reabsorción ósea leve en sector posterior.',
    'Blanqueamiento con peróxido de hidrógeno al 35%. Se logró aclarar 3 tonos. Paciente satisfecho.',
    'Control post-operatorio. Herida en buena evolución. Se retiran puntos de sutura.',
    'Cementación de corona definitiva. Ajuste oclusal verificado. Paciente conforme con estética.',
  ];

  const pastAppointments: any[] = [];
  const rooms = [room1, room2, room3];

  for (const pat of patients) {
    const numPast = rand(3, 5);
    for (let i = 0; i < numPast; i++) {
      const dayOffset = rand(7, 180);
      const hour = rand(8, 15);
      const providerIdx = rand(0, 2);
      const appt = await prisma.appointment.create({
        data: {
          patientId: pat.id,
          providerId: providers[providerIdx].id,
          tenantId: tenant.id,
          roomId: rooms[providerIdx].id,
          appointmentDate: setTime(daysAgo(dayOffset), hour, rand(0, 1) * 30),
          duration: [30, 45, 60, 90][rand(0, 3)],
          status: AppointmentStatus.COMPLETED,
          procedureType: procedureTypes[rand(0, procedureTypes.length - 1)],
          notes: pastNotes[rand(0, pastNotes.length - 1)],
          reminderSent: true,
          confirmedVia: ['WhatsApp', 'Llamada', 'SMS', 'Email'][rand(0, 3)],
        },
      });
      pastAppointments.push({ ...appt, patientId: pat.id });
    }
  }
  console.log(`  ✅ ${pastAppointments.length} citas pasadas creadas`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 10. CITAS FUTURAS (próximas 4 semanas)
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('📅 Creando citas futuras...');

  const futureAppointments: any[] = [];
  for (let i = 0; i < patients.length - 3; i++) {
    const pat = patients[i];
    const numFuture = rand(1, 3);
    for (let j = 0; j < numFuture; j++) {
      const dayOffset = rand(1, 28);
      const hour = rand(8, 15);
      const providerIdx = rand(0, 2);
      const appt = await prisma.appointment.create({
        data: {
          patientId: pat.id,
          providerId: providers[providerIdx].id,
          tenantId: tenant.id,
          roomId: rooms[providerIdx].id,
          appointmentDate: setTime(daysFromNow(dayOffset), hour, rand(0, 1) * 30),
          duration: [30, 45, 60][rand(0, 2)],
          status: Math.random() < 0.6 ? AppointmentStatus.SCHEDULED : AppointmentStatus.SCHEDULED,
          procedureType: procedureTypes[rand(0, procedureTypes.length - 1)],
          notes: 'Cita programada.',
          reminderSent: false,
        },
      });
      futureAppointments.push(appt);
    }
  }
  console.log(`  ✅ ${futureAppointments.length} citas futuras creadas`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 11. CITAS RECURRENTES (limpiezas cada 6 meses)
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('🔄 Creando citas recurrentes...');

  const recurringPatients = patients.slice(0, 8);
  for (const pat of recurringPatients) {
    await prisma.recurringAppointment.create({
      data: {
        patientId: pat.id,
        providerId: dentistUser.id,
        tenantId: tenant.id,
        roomId: room1.id,
        frequency: RecurrenceFrequency.QUARTERLY,
        interval: 2,
        startDate: daysAgo(180),
        duration: 45,
        procedureType: 'Limpieza dental periódica',
        notes: 'Profilaxis cada 6 meses para mantenimiento de salud oral',
        timeOfDay: `${rand(8, 14)}:${rand(0, 1) === 0 ? '00' : '30'}`,
        daysOfWeek: [rand(1, 5)],
        isActive: true,
      },
    });
  }
  console.log(`  ✅ ${recurringPatients.length} citas recurrentes creadas`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 12. FACTURAS Y PAGOS
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('💰 Creando facturas y pagos...');

  const invoiceItems = [
    { desc: 'Consulta general', price: 50 },
    { desc: 'Limpieza dental (profilaxis)', price: 80 },
    { desc: 'Empaste resina compuesta', price: 120 },
    { desc: 'Extracción simple', price: 100 },
    { desc: 'Endodoncia anterior', price: 250 },
    { desc: 'Endodoncia molar', price: 450 },
    { desc: 'Corona porcelana/metal', price: 500 },
    { desc: 'Control ortodóncico', price: 50 },
    { desc: 'Radiografía panorámica', price: 60 },
    { desc: 'Blanqueamiento dental', price: 300 },
    { desc: 'Raspado y alisado radicular', price: 180 },
  ];

  let invoiceCount = 0;
  const paymentMethods = [PaymentMethod.CASH, PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.BANK_TRANSFER];

  for (const appt of pastAppointments) {
    const itemTemplate = invoiceItems[rand(0, invoiceItems.length - 1)];
    const qty = 1;
    const subtotal = itemTemplate.price * qty;
    const tax = Math.round(subtotal * 0.16);
    const total = subtotal + tax;

    // 70% PAID, 20% SENT (pending), 10% OVERDUE
    const r = Math.random();
    const invoiceStatus = r < 0.7 ? InvoiceStatus.PAID : r < 0.9 ? InvoiceStatus.SENT : InvoiceStatus.OVERDUE;
    const amountPaid = invoiceStatus === InvoiceStatus.PAID ? total : invoiceStatus === InvoiceStatus.SENT ? 0 : Math.round(total * 0.3);
    const balance = total - amountPaid;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: nextInvoiceNumber(),
        patientId: appt.patientId,
        providerId: providers[rand(0, 2)].id,
        tenantId: tenant.id,
        issueDate: new Date(appt.appointmentDate),
        dueDate: new Date(new Date(appt.appointmentDate).getTime() + 30 * 86_400_000),
        status: invoiceStatus,
        subtotal,
        tax,
        discount: 0,
        total,
        amountPaid,
        balance,
        notes: invoiceStatus === InvoiceStatus.OVERDUE ? 'VENCIDA - contactar paciente' : null,
        items: {
          create: [{
            description: itemTemplate.desc,
            quantity: qty,
            unitPrice: itemTemplate.price,
            total: subtotal,
          }],
        },
      },
    });

    // Pagos para facturas pagadas/parciales
    if (amountPaid > 0) {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          patientId: appt.patientId,
          tenantId: tenant.id,
          amount: amountPaid,
          paymentMethod: paymentMethods[rand(0, paymentMethods.length - 1)],
          paymentDate: new Date(appt.appointmentDate),
          status: PaymentStatus.COMPLETED,
          reference: `REF-${String(rand(100000, 999999))}`,
          notes: invoiceStatus === InvoiceStatus.PAID ? 'Pago completo' : 'Abono parcial',
        },
      });
    }

    invoiceCount++;
  }
  console.log(`  ✅ ${invoiceCount} facturas + pagos creados`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 13. NOTAS CLÍNICAS (SOAP)
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('📝 Creando notas clínicas...');

  const clinicalNoteTemplates = [
    {
      subjective: 'Paciente refiere dolor al masticar del lado derecho desde hace 3 días. Dolor pulsátil que aumenta con alimentos fríos.',
      objective: 'Examen clínico: caries profunda en pieza 46, superficie oclusal comprometida. Prueba de vitalidad positiva con respuesta prolongada. Percusión ligeramente positiva.',
      assessment: 'Pulpitis irreversible pieza 46. Se recomienda tratamiento endodóncico.',
      plan: 'Iniciar endodoncia pieza 46 en próxima cita. Prescribir analgésico. Control en 48 horas si el dolor persiste.',
      diagnosis: 'Pulpitis irreversible sintomática',
    },
    {
      subjective: 'Paciente acude a control semestral. Sin molestias. Refiere sangrado ocasional de encías durante el cepillado.',
      objective: 'Examen periodontal: profundidad de sondaje 2-3mm generalizado. Sangrado al sondaje en sector anteroinferior. Índice de placa 25%. Cálculo supragingival leve.',
      assessment: 'Gingivitis leve asociada a placa bacteriana. Buena salud periodontal general.',
      plan: 'Profilaxis dental realizada. Instrucciones de higiene oral reforzadas. Técnica de Bass demostrada. Próximo control en 6 meses.',
      diagnosis: 'Gingivitis asociada a placa bacteriana',
    },
    {
      subjective: 'Primera visita. Paciente desea evaluación general. Última visita al dentista hace más de 2 años. Sin dolor actual.',
      objective: 'Panorámica tomada. Examen clínico completo. Caries clase II en 15 y 25. Tercer molar 48 semi-incluido, asintomático. Resto de dentición en condiciones aceptables. Oclusión clase I.',
      assessment: 'Caries dental en 15 y 25. Tercer molar 48 semi-incluido. Sin patología periodontal evidente.',
      plan: 'Plan: restauraciones en 15 y 25. Evaluar extracción de 48 preventiva. Profilaxis. Seguimiento en 3 meses.',
      diagnosis: 'Caries dental múltiple',
    },
    {
      subjective: 'Control post-endodoncia pieza 24. Paciente refiere molestia leve al morder. Sin dolor espontáneo.',
      objective: 'Radiografía periapical: obturación de conductos adecuada. No se observa radiolucidez periapical. Restauración temporal intacta.',
      assessment: 'Evolución favorable post-endodoncia. Molestia compatible con proceso de reparación normal.',
      plan: 'Continuar con analgésico SOS. Programar reconstrucción y corona en próximas citas. Control radiográfico en 3 meses.',
      diagnosis: 'Post-operatorio endodóncico satisfactorio',
    },
    {
      subjective: 'Paciente pediátrico acompañado por madre. Acude para revisión de rutina. Madre reporta que el niño come muchos dulces.',
      objective: 'Dentición mixta en desarrollo normal. Caries incipiente en fosas de 16 y 26 (primeros molares permanentes). Buena higiene oral para la edad.',
      assessment: 'Riesgo cariogénico moderado. Primeros molares permanentes con surcos profundos susceptibles a caries.',
      plan: 'Aplicación de sellantes en 16, 26, 36, 46. Aplicación de flúor barniz. Orientación nutricional a la madre. Control en 4 meses.',
      diagnosis: 'Riesgo cariogénico moderado - dentición mixta',
    },
  ];

  let clinicalNoteCount = 0;
  for (const pat of patients) {
    const numNotes = rand(3, 5);
    for (let i = 0; i < numNotes; i++) {
      const template = clinicalNoteTemplates[rand(0, clinicalNoteTemplates.length - 1)];
      await prisma.clinicalNote.create({
        data: {
          patientId: pat.id,
          providerId: providers[rand(0, 2)].id,
          tenantId: tenant.id,
          noteType: 'SOAP',
          subjective: template.subjective,
          objective: template.objective,
          assessment: template.assessment,
          plan: template.plan,
          diagnoses: [{ code: 'K02', description: template.diagnosis }],
          vitalSigns: i === 0 ? {
            bloodPressure: `${rand(110, 140)}/${rand(70, 90)}`,
            heartRate: rand(60, 90),
            temperature: (36 + Math.random()).toFixed(1),
          } : null,
          appointmentDate: daysAgo(rand(7, 180)),
        },
      });
      clinicalNoteCount++;
    }
  }
  console.log(`  ✅ ${clinicalNoteCount} notas clínicas creadas`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 14. PRESCRIPCIONES
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('💊 Creando prescripciones...');

  const prescriptionTemplates = [
    {
      medications: [
        { name: 'Amoxicilina', dosage: '500mg', frequency: 'Cada 8 horas', duration: '7 días', notes: 'Tomar con alimentos' },
        { name: 'Ibuprofeno', dosage: '400mg', frequency: 'Cada 6 horas', duration: '3 días', notes: 'No tomar en ayunas' },
      ],
      diagnosis: 'Post-extracción dental',
    },
    {
      medications: [
        { name: 'Clindamicina', dosage: '300mg', frequency: 'Cada 6 horas', duration: '7 días', notes: 'Para pacientes alérgicos a penicilina' },
        { name: 'Ketorolaco', dosage: '10mg', frequency: 'Cada 8 horas', duration: '3 días', notes: 'Analgésico. No exceder 5 días de uso' },
      ],
      diagnosis: 'Infección periapical aguda',
    },
    {
      medications: [
        { name: 'Acetaminofén', dosage: '500mg', frequency: 'Cada 6 horas SOS', duration: '3 días', notes: 'Solo si presenta dolor' },
      ],
      diagnosis: 'Post-procedimiento restaurativo',
    },
    {
      medications: [
        { name: 'Amoxicilina + Ácido Clavulánico', dosage: '875/125mg', frequency: 'Cada 12 horas', duration: '7 días', notes: 'Tomar con alimentos' },
        { name: 'Dexametasona', dosage: '4mg', frequency: 'Cada 12 horas', duration: '3 días', notes: 'Antiinflamatorio esteroidal' },
        { name: 'Ibuprofeno', dosage: '600mg', frequency: 'Cada 8 horas', duration: '5 días', notes: 'Continuar después de suspender dexametasona' },
      ],
      diagnosis: 'Post-cirugía tercer molar',
    },
    {
      medications: [
        { name: 'Clorhexidina', dosage: '0.12%', frequency: 'Enjuague bucal 2 veces al día', duration: '14 días', notes: 'No enjuagar con agua después. Usar 30 min después del cepillado' },
      ],
      diagnosis: 'Tratamiento periodontal - mantenimiento',
    },
  ];

  let prescriptionCount = 0;
  // Prescripciones para pacientes adultos (no niños para clindamicina/ketorolaco)
  for (let i = 0; i < patients.length; i++) {
    const pat = patients[i];
    const age = new Date().getFullYear() - new Date(pat.def.dob).getFullYear();
    if (age < 15) continue;

    const numRx = rand(1, 3);
    for (let j = 0; j < numRx; j++) {
      // Skip clindamicina if patient is allergic
      let template = prescriptionTemplates[rand(0, prescriptionTemplates.length - 1)];
      if (pat.def.allergies.includes('Clindamicina') && template.medications.some(m => m.name === 'Clindamicina')) {
        template = prescriptionTemplates[0]; // fallback to amoxicilina
      }
      if (pat.def.allergies.includes('Penicilina') && template.medications.some(m => m.name.includes('Amoxicilina'))) {
        template = prescriptionTemplates[1]; // use clindamicina instead
      }

      await prisma.prescription.create({
        data: {
          patientId: pat.id,
          providerId: providers[rand(0, 2)].id,
          tenantId: tenant.id,
          medications: template.medications,
          diagnosis: template.diagnosis,
          notes: `Prescripción para ${pat.def.firstName} ${pat.def.lastName}. Verificar alergias antes de dispensar.`,
          issuedAt: daysAgo(rand(7, 150)),
          expiresAt: daysFromNow(rand(7, 60)),
        },
      });
      prescriptionCount++;
    }
  }
  console.log(`  ✅ ${prescriptionCount} prescripciones creadas`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 15. CONSENTIMIENTOS
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('📄 Creando consentimientos...');

  let consentCount = 0;
  for (const pat of patients) {
    // Consentimiento de acceso a datos
    await prisma.patientConsent.create({
      data: {
        patientId: pat.id,
        providerId: dentistUser.id,
        dataAccessLevel: DataAccessLevel.FULL,
        shareAppointments: true,
        shareMedicalHistory: true,
        shareDocuments: true,
        shareLabResults: true,
        shareBilling: true,
        status: ConsentStatus.GRANTED,
        grantedAt: daysAgo(rand(30, 365)),
        requestedBy: dentistUser.id,
        reason: 'Atención dental integral',
      },
    });
    consentCount++;

    // Algunos pacientes tienen consentimiento pendiente con otro doctor
    if (Math.random() < 0.4) {
      const otherProvider = providers[rand(1, 2)];
      await prisma.patientConsent.create({
        data: {
          patientId: pat.id,
          providerId: otherProvider.id,
          dataAccessLevel: DataAccessLevel.CLINICAL_ONLY,
          shareAppointments: true,
          shareMedicalHistory: true,
          shareDocuments: false,
          shareLabResults: false,
          shareBilling: false,
          status: ConsentStatus.PENDING,
          requestedBy: otherProvider.id,
          reason: 'Referencia para tratamiento especializado',
        },
      });
      consentCount++;
    }
  }
  console.log(`  ✅ ${consentCount} consentimientos creados`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 16. LISTA DE ESPERA
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('⏳ Creando lista de espera...');

  const waitlistProcedures = [
    { proc: 'Blanqueamiento dental', dur: 90, priority: 2 },
    { proc: 'Corona porcelana', dur: 90, priority: 3 },
    { proc: 'Extracción tercer molar', dur: 90, priority: 4 },
    { proc: 'Evaluación ortodóncica', dur: 45, priority: 1 },
    { proc: 'Endodoncia molar', dur: 150, priority: 5 },
    { proc: 'Carillas de porcelana', dur: 60, priority: 2 },
    { proc: 'Implante dental', dur: 120, priority: 4 },
    { proc: 'Cirugía periodontal', dur: 90, priority: 3 },
  ];

  for (let i = 0; i < 8; i++) {
    const pat = patients[rand(0, patients.length - 1)];
    const wp = waitlistProcedures[i];
    await prisma.waitlist.create({
      data: {
        patientId: pat.id,
        providerId: providers[rand(0, 2)].id,
        tenantId: tenant.id,
        preferredDates: [daysFromNow(rand(7, 30)), daysFromNow(rand(31, 60))],
        preferredTimes: ['Mañana (8am-12pm)', 'Tarde (2pm-5pm)'][rand(0, 1)] === 'Mañana (8am-12pm)' ? ['08:00-12:00'] : ['14:00-17:00'],
        procedureType: wp.proc,
        duration: wp.dur,
        priority: wp.priority,
        status: [WaitlistStatus.WAITING, WaitlistStatus.CONTACTED][rand(0, 1)],
        notes: `Paciente en espera para ${wp.proc}. Contactar cuando haya disponibilidad.`,
        expiresAt: daysFromNow(90),
      },
    });
  }
  console.log('  ✅ 8 entradas en lista de espera');

  // ══════════════════════════════════════════════════════════════════════════════
  // 17. NOTIFICACIONES
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('🔔 Creando notificaciones...');

  let notifCount = 0;
  // Recordatorios de citas para citas futuras
  for (const appt of futureAppointments.slice(0, 10)) {
    const pat = patients.find(p => p.id === appt.patientId);
    if (!pat) continue;

    await prisma.notification.create({
      data: {
        userId: pat.user.id,
        tenantId: tenant.id,
        type: NotificationType.EMAIL,
        channel: NotificationChannel.APPOINTMENT_REMINDER,
        subject: 'Recordatorio de cita dental',
        message: `Estimado/a ${pat.def.firstName}, le recordamos su cita en Clínica Dental Sonrisa Perfecta para el ${new Date(appt.appointmentDate).toLocaleDateString('es-VE')}.`,
        metadata: { appointmentId: appt.id },
        sent: false,
        scheduledFor: new Date(new Date(appt.appointmentDate).getTime() - 24 * 3_600_000),
      },
    });
    notifCount++;
  }

  // Recordatorios de pago
  for (let i = 0; i < 5; i++) {
    const pat = patients[rand(0, patients.length - 1)];
    await prisma.notification.create({
      data: {
        userId: pat.user.id,
        tenantId: tenant.id,
        type: NotificationType.WHATSAPP,
        channel: NotificationChannel.PAYMENT_REMINDER,
        subject: 'Recordatorio de pago pendiente',
        message: `Estimado/a ${pat.def.firstName}, tiene un saldo pendiente en Clínica Dental Sonrisa Perfecta. Por favor comuníquese con recepción para coordinar su pago.`,
        sent: Math.random() < 0.5,
        sentAt: Math.random() < 0.5 ? daysAgo(rand(1, 7)) : null,
      },
    });
    notifCount++;
  }

  // Confirmaciones de citas pasadas
  for (const appt of pastAppointments.slice(0, 8)) {
    const pat = patients.find(p => p.id === appt.patientId);
    if (!pat) continue;

    await prisma.notification.create({
      data: {
        userId: pat.user.id,
        tenantId: tenant.id,
        type: NotificationType.SMS,
        channel: NotificationChannel.APPOINTMENT_CONFIRMATION,
        subject: 'Confirmación de cita',
        message: `Su cita en Sonrisa Perfecta ha sido confirmada.`,
        sent: true,
        sentAt: daysAgo(rand(1, 30)),
      },
    });
    notifCount++;
  }
  console.log(`  ✅ ${notifCount} notificaciones creadas`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 18. DOCUMENTOS (radiografías, consentimientos firmados)
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('📁 Creando documentos...');

  let docCount = 0;
  for (const pat of patients) {
    // Radiografía panorámica
    await prisma.document.create({
      data: {
        patientId: pat.id,
        providerId: dentistUser.id,
        tenantId: tenant.id,
        type: DocumentType.XRAY,
        title: `Radiografía panorámica - ${pat.def.firstName} ${pat.def.lastName}`,
        description: 'Radiografía panorámica digital para evaluación general',
        filePath: `/uploads/xrays/${pat.id}/panoramica.jpg`,
        fileName: 'panoramica.jpg',
        fileSize: rand(500000, 2000000),
        mimeType: 'image/jpeg',
        uploadedBy: dentistUser.id,
        tags: ['panorámica', 'diagnóstico', 'inicial'],
      },
    });
    docCount++;

    // Consentimiento firmado (para algunos)
    if (Math.random() < 0.6) {
      await prisma.document.create({
        data: {
          patientId: pat.id,
          providerId: dentistUser.id,
          tenantId: tenant.id,
          type: DocumentType.CONSENT_FORM,
          title: `Consentimiento informado - ${pat.def.firstName} ${pat.def.lastName}`,
          description: 'Consentimiento firmado para procedimiento dental',
          filePath: `/uploads/consents/${pat.id}/consentimiento-firmado.pdf`,
          fileName: 'consentimiento-firmado.pdf',
          fileSize: rand(100000, 500000),
          mimeType: 'application/pdf',
          uploadedBy: dentistUser.id,
          tags: ['consentimiento', 'firmado'],
        },
      });
      docCount++;
    }

    // Foto clínica (para algunos)
    if (Math.random() < 0.3) {
      await prisma.document.create({
        data: {
          patientId: pat.id,
          providerId: dentistUser.id,
          tenantId: tenant.id,
          type: DocumentType.PHOTO,
          title: `Foto intraoral - ${pat.def.firstName} ${pat.def.lastName}`,
          description: 'Fotografía intraoral para seguimiento de tratamiento',
          filePath: `/uploads/photos/${pat.id}/intraoral.jpg`,
          fileName: 'intraoral.jpg',
          fileSize: rand(800000, 3000000),
          mimeType: 'image/jpeg',
          uploadedBy: dentistUser.id,
          tags: ['intraoral', 'seguimiento'],
        },
      });
      docCount++;
    }
  }
  console.log(`  ✅ ${docCount} documentos creados`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 19. INVENTARIO
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('📦 Creando inventario...');

  const inventoryDefs = [
    { sku: 'MAT-001', name: 'Resina compuesta A2 (Filtek Z350)', category: 'MATERIAL', unit: 'jeringa', stock: 15, min: 5, cost: 35, sale: 55 },
    { sku: 'MAT-002', name: 'Resina compuesta A3 (Filtek Z350)', category: 'MATERIAL', unit: 'jeringa', stock: 12, min: 5, cost: 35, sale: 55 },
    { sku: 'MAT-003', name: 'Ácido grabador 37% (Scotchbond)', category: 'MATERIAL', unit: 'frasco', stock: 8, min: 3, cost: 12, sale: 20 },
    { sku: 'MAT-004', name: 'Adhesivo Single Bond Universal', category: 'MATERIAL', unit: 'frasco', stock: 6, min: 2, cost: 45, sale: 70 },
    { sku: 'MAT-005', name: 'Cemento de ionómero de vidrio', category: 'MATERIAL', unit: 'kit', stock: 4, min: 2, cost: 55, sale: 85 },
    { sku: 'MAT-006', name: 'Gutapercha puntas #25-40', category: 'MATERIAL', unit: 'caja', stock: 10, min: 3, cost: 15, sale: 25 },
    { sku: 'MAT-007', name: 'Limas endodónticas rotatorias', category: 'INSTRUMENTO', unit: 'blister', stock: 20, min: 5, cost: 25, sale: 40 },
    { sku: 'MAT-008', name: 'Alginato para impresiones', category: 'MATERIAL', unit: 'bolsa', stock: 8, min: 2, cost: 8, sale: 15 },
    { sku: 'DES-001', name: 'Guantes de nitrilo (caja 100)', category: 'DESECHABLE', unit: 'caja', stock: 30, min: 10, cost: 8, sale: 12 },
    { sku: 'DES-002', name: 'Mascarillas quirúrgicas (caja 50)', category: 'DESECHABLE', unit: 'caja', stock: 20, min: 5, cost: 5, sale: 8 },
    { sku: 'DES-003', name: 'Anestesia Lidocaína 2% c/epinefrina', category: 'MEDICAMENTO', unit: 'cárpule', stock: 100, min: 30, cost: 1.5, sale: 3 },
    { sku: 'DES-004', name: 'Agujas dentales cortas 30G', category: 'DESECHABLE', unit: 'caja', stock: 15, min: 5, cost: 10, sale: 18 },
    { sku: 'DES-005', name: 'Eyectores de saliva', category: 'DESECHABLE', unit: 'bolsa', stock: 25, min: 8, cost: 3, sale: 5 },
    { sku: 'EST-001', name: 'Peróxido de hidrógeno 35% blanqueamiento', category: 'MATERIAL', unit: 'kit', stock: 5, min: 2, cost: 40, sale: 65 },
    { sku: 'EST-002', name: 'Pasta profiláctica (bote 340g)', category: 'MATERIAL', unit: 'bote', stock: 10, min: 3, cost: 12, sale: 20 },
  ];

  for (const inv of inventoryDefs) {
    await prisma.inventoryItem.upsert({
      where: { tenantId_sku: { tenantId: tenant.id, sku: inv.sku } },
      update: {},
      create: {
        tenantId: tenant.id,
        sku: inv.sku,
        name: inv.name,
        category: inv.category,
        unit: inv.unit,
        currentStock: inv.stock,
        minimumStock: inv.min,
        costPrice: inv.cost,
        salePrice: inv.sale,
        isActive: true,
      },
    });
  }
  console.log(`  ✅ ${inventoryDefs.length} items de inventario creados`);

  // ══════════════════════════════════════════════════════════════════════════════
  // 20. RESUMEN FINAL
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('✅ SEED COMPLETADO: Clínica Dental Sonrisa Perfecta');
  console.log('═'.repeat(60));
  console.log(`  👨‍⚕️ 3 doctores (general, ortodoncista, endodoncista)`);
  console.log(`  👩‍💼 2 staff (asistente, recepcionista)`);
  console.log(`  🏥 1 clínica con 3 consultorios`);
  console.log(`  💊 ${serviceDefs.length} servicios médicos`);
  console.log(`  🧑 ${patients.length} pacientes`);
  console.log(`  🦷 ${patients.length} odontogramas`);
  console.log(`  📋 ${treatmentPlans.length} planes de tratamiento`);
  console.log(`  📅 ${pastAppointments.length} citas pasadas`);
  console.log(`  📅 ${futureAppointments.length} citas futuras`);
  console.log(`  🔄 ${recurringPatients.length} citas recurrentes`);
  console.log(`  💰 ${invoiceCount} facturas + pagos`);
  console.log(`  📝 ${clinicalNoteCount} notas clínicas`);
  console.log(`  💊 ${prescriptionCount} prescripciones`);
  console.log(`  📄 ${consentCount} consentimientos`);
  console.log(`  ⏳ 8 entradas en lista de espera`);
  console.log(`  🔔 ${notifCount} notificaciones`);
  console.log(`  📁 ${docCount} documentos`);
  console.log(`  📦 ${inventoryDefs.length} items de inventario`);
  console.log('═'.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
