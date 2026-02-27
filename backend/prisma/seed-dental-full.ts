/**
 * seed-dental-full.ts
 * Seed completo para el tenant Dr. Smith Dental Practice (dentist@dentista.com)
 * Cubre TODAS las interfaces del sistema con datos realistas.
 *
 * Uso: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-dental-full.ts
 */

import { PrismaClient, UserRole, MedicalSpecialty, AppointmentStatus, Gender, TreatmentPlanStatus, TreatmentItemStatus, InvoiceStatus, PaymentMethod, PaymentStatus, DocumentType, ToothCondition, ToothSurface, WaitlistStatus, NotificationType, NotificationChannel, AuditAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── helpers ──────────────────────────────────────────────────────────────────
const daysAgo   = (d: number) => new Date(Date.now() - d * 86_400_000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000);
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000);
const rand = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

async function main() {
  console.log('🦷 Seeding Dr. Smith Dental Practice — full data...\n');

  // ── 1. Obtener tenant y usuario base ────────────────────────────────────────
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { subdomain: 'drsmith' } });
  const dentistUser = await prisma.user.findUniqueOrThrow({ where: { email: 'dentist@dentista.com' } });
  const staffUser   = await prisma.user.findUniqueOrThrow({ where: { email: 'staff@dentista.com' } });

  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ── 2. Crear usuarios extra para este tenant ─────────────────────────────────
  const pass = async (p: string) => bcrypt.hash(p, 10);

  const dentist4 = await prisma.user.upsert({
    where: { email: 'dentist4@dentista.com' },
    update: {},
    create: {
      email: 'dentist4@dentista.com',
      name: 'Dra. Carmen Rojas',
      passwordHash: await pass('Dentist123!'),
      phone: '+1234567899',
      role: UserRole.PROVIDER,
      licenseNumber: 'DDS-99001',
      npiNumber: '1122334455',
      specialties: [MedicalSpecialty.PERIODONTICS],
      bio: 'Periodoncista con experiencia en implantes y cirugía periodontal avanzada.',
    },
  });

  const receptionista2 = await prisma.user.upsert({
    where: { email: 'recep2@dentista.com' },
    update: {},
    create: {
      email: 'recep2@dentista.com',
      name: 'Laura Mendez',
      passwordHash: await pass('Staff123!'),
      phone: '+1234500002',
      role: UserRole.STAFF_RECEPTIONIST,
    },
  });

  const asistente2 = await prisma.user.upsert({
    where: { email: 'asistente2@dentista.com' },
    update: {},
    create: {
      email: 'asistente2@dentista.com',
      name: 'Carlos Vega',
      passwordHash: await pass('Staff123!'),
      phone: '+1234500003',
      role: UserRole.STAFF_ASSISTANT,
    },
  });

  // Membresías
  for (const { userId, role } of [
    { userId: dentist4.id,       role: UserRole.PROVIDER },
    { userId: receptionista2.id, role: UserRole.STAFF_RECEPTIONIST },
    { userId: asistente2.id,     role: UserRole.STAFF_ASSISTANT },
  ]) {
    await prisma.tenantMembership.upsert({
      where: { userId_tenantId: { userId, tenantId: tenant.id } },
      update: {},
      create: { userId, tenantId: tenant.id, role },
    });
  }
  console.log('✅ 3 usuarios adicionales + membresías');

  // ── 3. Pacientes ─────────────────────────────────────────────────────────────
  const patientDefs = [
    { email: 'ana.gomez@mail.com',      name: 'Ana Gómez',         pass: 'Patient123!', phone: '+58041112233', dob: new Date('1985-03-15'), gender: Gender.FEMALE, bloodType: 'A+',  allergies: ['Penicilina'], emergencyName: 'Luis Gómez',  emergencyPhone: '+58041119900' },
    { email: 'miguel.torres@mail.com',  name: 'Miguel Torres',     pass: 'Patient123!', phone: '+58041223344', dob: new Date('1992-07-22'), gender: Gender.MALE,   bloodType: 'O+',  allergies: [], emergencyName: 'Rosa Torres', emergencyPhone: '+58041229900' },
    { email: 'sofia.vargas@mail.com',   name: 'Sofía Vargas',      pass: 'Patient123!', phone: '+58041334455', dob: new Date('2001-11-08'), gender: Gender.FEMALE, bloodType: 'B-',  allergies: ['Ibuprofeno'], emergencyName: 'Pedro Vargas', emergencyPhone: '+58041339900' },
    { email: 'jose.morales@mail.com',   name: 'José Morales',      pass: 'Patient123!', phone: '+58041445566', dob: new Date('1975-01-30'), gender: Gender.MALE,   bloodType: 'AB+', allergies: ['Látex'], emergencyName: 'Elena Morales', emergencyPhone: '+58041449900' },
    { email: 'valentina.cruz@mail.com', name: 'Valentina Cruz',    pass: 'Patient123!', phone: '+58041556677', dob: new Date('1998-05-12'), gender: Gender.FEMALE, bloodType: 'O-',  allergies: [], emergencyName: 'Marco Cruz',  emergencyPhone: '+58041559900' },
    { email: 'carlos.herrera@mail.com', name: 'Carlos Herrera',    pass: 'Patient123!', phone: '+58041667788', dob: new Date('1965-09-04'), gender: Gender.MALE,   bloodType: 'A-',  allergies: ['Sulfonamidas'], emergencyName: 'Marta Herrera', emergencyPhone: '+58041669900' },
    { email: 'maria.leon@mail.com',     name: 'María León',        pass: 'Patient123!', phone: '+58041778899', dob: new Date('1990-12-20'), gender: Gender.FEMALE, bloodType: 'B+',  allergies: [], emergencyName: 'David León',  emergencyPhone: '+58041779900' },
    { email: 'julio.reyes@mail.com',    name: 'Julio Reyes',       pass: 'Patient123!', phone: '+58041889900', dob: new Date('1982-06-17'), gender: Gender.MALE,   bloodType: 'O+',  allergies: ['Codeína'], emergencyName: 'Ana Reyes',   emergencyPhone: '+58041889901' },
    { email: 'natalia.pino@mail.com',   name: 'Natalia Pino',      pass: 'Patient123!', phone: '+58041990011', dob: new Date('2005-02-28'), gender: Gender.FEMALE, bloodType: 'A+',  allergies: [], emergencyName: 'Claudia Pino', emergencyPhone: '+58041990012' },
    { email: 'roberto.silva@mail.com',  name: 'Roberto Silva',     pass: 'Patient123!', phone: '+58042001122', dob: new Date('1958-08-10'), gender: Gender.MALE,   bloodType: 'AB-', allergies: ['Aspirina','Latex'], emergencyName: 'Luisa Silva',  emergencyPhone: '+58042001123' },
    { email: 'patricia.ruiz@mail.com',  name: 'Patricia Ruiz',     pass: 'Patient123!', phone: '+58042112233', dob: new Date('1977-04-05'), gender: Gender.FEMALE, bloodType: 'O+',  allergies: [], emergencyName: 'Héctor Ruiz',  emergencyPhone: '+58042112234' },
    { email: 'andres.castillo@mail.com','name': 'Andrés Castillo', pass: 'Patient123!', phone: '+58042223344', dob: new Date('2010-10-15'), gender: Gender.MALE,   bloodType: 'B+',  allergies: [], emergencyName: 'Isabel Castillo', emergencyPhone: '+58042223345' },
  ] as const;

  const patients: Record<string, any> = {};
  for (const pd of patientDefs) {
    const userUpsert = await prisma.user.upsert({
      where: { email: pd.email },
      update: {},
      create: {
        email: pd.email,
        name: pd.name,
        passwordHash: await pass(pd.pass),
        phone: pd.phone,
        role: UserRole.PATIENT,
      },
    });
    const pat = await prisma.patient.upsert({
      where: { userId: userUpsert.id },
      update: {},
      create: {
        userId: userUpsert.id,
        tenantId: tenant.id,
        dateOfBirth: pd.dob,
        gender: pd.gender,
        bloodType: pd.bloodType,
        allergies: pd.allergies as string[],
        emergencyContactName: pd.emergencyName,
        emergencyContactPhone: pd.emergencyPhone,
        notes: `Paciente registrado en consulta dental. Historial activo.`,
      },
    });
    patients[pd.email] = pat;

    await prisma.tenantMembership.upsert({
      where: { userId_tenantId: { userId: userUpsert.id, tenantId: tenant.id } },
      update: {},
      create: { userId: userUpsert.id, tenantId: tenant.id, role: UserRole.PATIENT },
    });
    await prisma.providerPatientRelation.upsert({
      where: { providerId_patientId_tenantId: { providerId: dentistUser.id, patientId: pat.id, tenantId: tenant.id } },
      update: {},
      create: { providerId: dentistUser.id, patientId: pat.id, tenantId: tenant.id, notes: 'Paciente regular' },
    });
  }
  console.log(`✅ ${patientDefs.length} pacientes nuevos`);

  // Obtener también los 2 pacientes originales
  const patJane = await prisma.patient.findFirst({ where: { tenantId: tenant.id, user: { email: 'patient@dentista.com' } } });
  const patJohn = await prisma.patient.findFirst({ where: { tenantId: tenant.id, user: { email: 'patient2@dentista.com' } } });
  const allPatients = [
    ...Object.values(patients),
    ...(patJane ? [patJane] : []),
    ...(patJohn ? [patJohn] : []),
  ] as any[];

  // ── 4. Servicios médicos ─────────────────────────────────────────────────────
  const serviceDefs = [
    { code: 'D0120', name: 'Examen periódico',         category: 'EXAMINATION', price: 450,  duration: 30 },
    { code: 'D0150', name: 'Examen completo nuevo',    category: 'EXAMINATION', price: 850,  duration: 60 },
    { code: 'D0210', name: 'Radiografías panorámicas', category: 'RADIOLOGY',   price: 750,  duration: 20 },
    { code: 'D0330', name: 'Ortopantomografía',        category: 'RADIOLOGY',   price: 1200, duration: 20 },
    { code: 'D1110', name: 'Limpieza dental adulto',   category: 'PREVENTIVE',  price: 600,  duration: 45 },
    { code: 'D1208', name: 'Aplicación de flúor',      category: 'PREVENTIVE',  price: 300,  duration: 15 },
    { code: 'D2140', name: 'Amalgama 1 superficie',    category: 'RESTORATIVE', price: 900,  duration: 45 },
    { code: 'D2330', name: 'Resina compuesta ant.',    category: 'RESTORATIVE', price: 1100, duration: 60 },
    { code: 'D2390', name: 'Corona provisional',       category: 'RESTORATIVE', price: 1500, duration: 90 },
    { code: 'D2710', name: 'Corona porcelana/metal',   category: 'PROSTHETICS', price: 5500, duration: 120 },
    { code: 'D3110', name: 'Endodoncia incisivo',      category: 'ENDODONTICS', price: 3000, duration: 90 },
    { code: 'D3330', name: 'Endodoncia molar',         category: 'ENDODONTICS', price: 5000, duration: 120 },
    { code: 'D4341', name: 'Raspado y alisado radicular', category: 'PERIODONTICS', price: 2200, duration: 90 },
    { code: 'D4910', name: 'Mantenimiento periodontal',category: 'PERIODONTICS', price: 800,  duration: 60 },
    { code: 'D7140', name: 'Extracción simple',        category: 'ORAL_SURGERY', price: 1200, duration: 30 },
    { code: 'D7210', name: 'Extracción quirúrgica',    category: 'ORAL_SURGERY', price: 2500, duration: 60 },
    { code: 'D9930', name: 'Blanqueamiento dental',    category: 'COSMETIC',    price: 2800, duration: 90 },
  ] as const;

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
        price: sd.price,
        duration: sd.duration,
        isActive: true,
      },
    });
    services[sd.code] = svc;
  }
  console.log(`✅ ${serviceDefs.length} servicios médicos`);

  // ── 5. Inventario ────────────────────────────────────────────────────────────
  const inventoryDefs = [
    { sku: 'INV-001', name: 'Resina compuesta A1',      category: 'SUPPLY',      unit: 'jeringa', stock: 12, min: 3,  cost: 850,  sale: 1200 },
    { sku: 'INV-002', name: 'Resina compuesta A2',      category: 'SUPPLY',      unit: 'jeringa', stock: 8,  min: 3,  cost: 850,  sale: 1200 },
    { sku: 'INV-003', name: 'Ácido grabador 37%',       category: 'SUPPLY',      unit: 'frasco',  stock: 20, min: 5,  cost: 150,  sale: 250  },
    { sku: 'INV-004', name: 'Adhesivo dental universal',category: 'SUPPLY',      unit: 'frasco',  stock: 6,  min: 2,  cost: 450,  sale: 700  },
    { sku: 'INV-005', name: 'Anestesia Lidocaína 2%',   category: 'MEDICATION',  unit: 'carpule', stock: 50, min: 10, cost: 45,   sale: 80   },
    { sku: 'INV-006', name: 'Anestesia Articaína 4%',   category: 'MEDICATION',  unit: 'carpule', stock: 30, min: 8,  cost: 65,   sale: 110  },
    { sku: 'INV-007', name: 'Amoxicilina 500mg',        category: 'MEDICATION',  unit: 'caja',    stock: 15, min: 5,  cost: 80,   sale: 140  },
    { sku: 'INV-008', name: 'Ibuprofeno 400mg',         category: 'MEDICATION',  unit: 'caja',    stock: 10, min: 3,  cost: 45,   sale: 75   },
    { sku: 'INV-009', name: 'Guantes látex M',          category: 'SUPPLY',      unit: 'caja',    stock: 8,  min: 2,  cost: 180,  sale: 280  },
    { sku: 'INV-010', name: 'Mascarillas quirúrgicas',  category: 'SUPPLY',      unit: 'caja',    stock: 5,  min: 2,  cost: 120,  sale: 200  },
    { sku: 'INV-011', name: 'Jeringa aspirable',        category: 'INSTRUMENT',  unit: 'unidad',  stock: 10, min: 3,  cost: 220,  sale: 350  },
    { sku: 'INV-012', name: 'Espejo bucal #5',          category: 'INSTRUMENT',  unit: 'unidad',  stock: 15, min: 5,  cost: 80,   sale: 130  },
    { sku: 'INV-013', name: 'Explorador 5-23',          category: 'INSTRUMENT',  unit: 'unidad',  stock: 12, min: 4,  cost: 120,  sale: 190  },
    { sku: 'INV-014', name: 'Cementos de vidrio ionómero', category: 'SUPPLY',   unit: 'kit',     stock: 4,  min: 1,  cost: 650,  sale: 1000 },
    { sku: 'INV-015', name: 'Film radiográfico dental', category: 'SUPPLY',      unit: 'caja',    stock: 3,  min: 1,  cost: 320,  sale: 500  },
    { sku: 'INV-016', name: 'Papel de articular 200µ',  category: 'SUPPLY',      unit: 'libreta', stock: 20, min: 5,  cost: 60,   sale: 95   },
    { sku: 'INV-017', name: 'Pieza de mano de alta velocidad', category: 'EQUIPMENT', unit: 'unidad', stock: 2, min: 1, cost: 8500, sale: 12000 },
    { sku: 'INV-018', name: 'Gasa estéril 10x10',       category: 'SUPPLY',      unit: 'paquete', stock: 25, min: 8,  cost: 35,   sale: 60   },
    { sku: 'INV-019', name: 'Eyectores de saliva',      category: 'SUPPLY',      unit: 'bolsa',   stock: 10, min: 3,  cost: 90,   sale: 140  },
    { sku: 'INV-020', name: 'Pasta profiláctica',       category: 'SUPPLY',      unit: 'frasco',  stock: 6,  min: 2,  cost: 180,  sale: 280  },
  ] as const;

  const inventoryItems: Record<string, any> = {};
  for (const inv of inventoryDefs) {
    const item = await prisma.inventoryItem.upsert({
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
        supplier: 'Distribuidora Dental CR',
        location: 'Almacén principal',
        isActive: true,
      },
    });
    inventoryItems[inv.sku] = item;

    // Movimiento inicial de entrada
    await prisma.inventoryMovement.create({
      data: {
        itemId: item.id,
        tenantId: tenant.id,
        userId: dentistUser.id,
        type: 'IN',
        quantity: inv.stock,
        reason: 'Stock inicial',
        previousStock: 0,
        newStock: inv.stock,
        createdAt: daysAgo(90),
      },
    });
  }

  // Movimientos de salida simulados
  const movOut = [
    { sku: 'INV-001', qty: 2 }, { sku: 'INV-005', qty: 8 }, { sku: 'INV-009', qty: 3 },
    { sku: 'INV-007', qty: 2 }, { sku: 'INV-012', qty: 1 }, { sku: 'INV-020', qty: 2 },
  ];
  for (const m of movOut) {
    const item = inventoryItems[m.sku];
    await prisma.inventoryMovement.create({
      data: {
        itemId: item.id,
        tenantId: tenant.id,
        userId: asistente2.id,
        type: 'OUT',
        quantity: m.qty,
        reason: 'Uso en procedimiento',
        previousStock: item.currentStock,
        newStock: item.currentStock - m.qty,
        createdAt: daysAgo(rand(1, 30)),
      },
    });
  }
  console.log(`✅ ${inventoryDefs.length} items inventario + movimientos`);

  // ── 6. Seguros médicos ───────────────────────────────────────────────────────
  const insuranceDefs = [
    { code: 'SEG-MERCANTIL', name: 'Mercantil Seguros Dental', phone: '+58021234567', email: 'dental@mercantil.com', website: 'https://mercantil.com' },
    { code: 'SEG-MAPFRE',    name: 'Mapfre Venezuela',        phone: '+58021345678', email: 'salud@mapfre.com.ve',  website: 'https://mapfre.com.ve' },
    { code: 'SEG-CARACAS',   name: 'La Venezolana de Seguros',phone: '+58021456789', email: 'clientes@venezolana.com', website: 'https://venezolana.com' },
  ] as const;

  const insurers: Record<string, any> = {};
  for (const ins of insuranceDefs) {
    const ip = await prisma.insuranceProvider.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: ins.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: ins.name,
        code: ins.code,
        contactPhone: ins.phone,
        contactEmail: ins.email,
        website: ins.website,
        coverageDetails: {
          plans: ['BASIC', 'PREMIUM'],
          maxAnnualBenefit: 50000,
          copay: 20,
          coinsurance: 80,
          deductible: 500,
        },
        isActive: true,
      },
    });
    insurers[ins.code] = ip;
  }

  // Asignar seguros a algunos pacientes
  const patList = Object.values(patients) as any[];
  const insuranceAssignments = [
    { patIdx: 0, code: 'SEG-MERCANTIL', policy: 'POL-001-2025', primary: true, type: 'PREMIUM' },
    { patIdx: 1, code: 'SEG-MAPFRE',    policy: 'POL-002-2025', primary: true, type: 'BASIC'   },
    { patIdx: 2, code: 'SEG-CARACAS',   policy: 'POL-003-2025', primary: true, type: 'BASIC'   },
    { patIdx: 3, code: 'SEG-MERCANTIL', policy: 'POL-004-2025', primary: true, type: 'PREMIUM' },
    { patIdx: 4, code: 'SEG-MAPFRE',    policy: 'POL-005-2025', primary: true, type: 'PREMIUM' },
    { patIdx: 5, code: 'SEG-CARACAS',   policy: 'POL-006-2025', primary: false, type: 'BASIC'  },
    { patIdx: 7, code: 'SEG-MERCANTIL', policy: 'POL-007-2025', primary: true, type: 'BASIC'   },
    { patIdx: 9, code: 'SEG-MAPFRE',    policy: 'POL-008-2025', primary: true, type: 'PREMIUM' },
  ] as const;

  for (const ia of insuranceAssignments) {
    const pat = patList[ia.patIdx];
    if (!pat) continue;
    const existing = await prisma.patientInsurance.findFirst({
      where: { patientId: pat.id, insuranceProviderId: insurers[ia.code].id },
    });
    if (!existing) {
      await prisma.patientInsurance.create({
        data: {
          patientId: pat.id,
          insuranceProviderId: insurers[ia.code].id,
          tenantId: tenant.id,
          policyNumber: ia.policy,
          coverageType: ia.type,
          effectiveDate: daysAgo(365),
          expirationDate: daysFromNow(365),
          isPrimary: ia.primary,
          isActive: true,
          verificationStatus: 'VERIFIED',
          verifiedAt: daysAgo(30),
          copayAmount: 200,
          coinsurancePercent: 80,
          deductible: 500,
          maxAnnualBenefit: 50000,
          usedBenefit: rand(1000, 15000),
        },
      });
    }
  }
  console.log(`✅ 3 aseguradoras + ${insuranceAssignments.length} seguros de pacientes`);

  // ── 7. Citas (pasadas y futuras) ─────────────────────────────────────────────
  type ApptDef = {
    patIdx: number;
    provider: any;
    daysOffset: number; // negativo = pasado, positivo = futuro
    hour: number;
    duration: number;
    status: AppointmentStatus;
    proc: string;
    notes?: string;
  };

  const apptDefs: ApptDef[] = [
    // Pasadas - completadas
    { patIdx: 0,  provider: dentistUser, daysOffset: -90, hour: 9,  duration: 45, status: AppointmentStatus.COMPLETED, proc: 'Examen completo y radiografías',       notes: 'Caries en #16 y #26 detectadas' },
    { patIdx: 0,  provider: dentistUser, daysOffset: -60, hour: 10, duration: 60, status: AppointmentStatus.COMPLETED, proc: 'Obturación resina compuesta #16',       notes: 'Se colocó resina A2, buen resultado' },
    { patIdx: 0,  provider: dentistUser, daysOffset: -30, hour: 11, duration: 45, status: AppointmentStatus.COMPLETED, proc: 'Limpieza dental + profilaxis',           notes: 'Buena higiene general, mínimo sarro' },
    { patIdx: 1,  provider: dentistUser, daysOffset: -75, hour: 14, duration: 30, status: AppointmentStatus.COMPLETED, proc: 'Examen periódico',                       notes: 'Sin hallazgos relevantes' },
    { patIdx: 1,  provider: dentistUser, daysOffset: -45, hour: 9,  duration: 90, status: AppointmentStatus.COMPLETED, proc: 'Endodoncia molar inferior #46',          notes: 'Pulpitis irreversible, conductos limpios' },
    { patIdx: 1,  provider: dentist4,    daysOffset: -20, hour: 10, duration: 90, status: AppointmentStatus.COMPLETED, proc: 'Raspado y alisado radicular cuadrante 3', notes: 'Bolsas periodontales reducidas' },
    { patIdx: 2,  provider: dentistUser, daysOffset: -50, hour: 15, duration: 30, status: AppointmentStatus.COMPLETED, proc: 'Limpieza dental',                        notes: 'Manchas por café removidas' },
    { patIdx: 2,  provider: dentistUser, daysOffset: -10, hour: 9,  duration: 90, status: AppointmentStatus.COMPLETED, proc: 'Blanqueamiento dental',                  notes: 'Excelente resultado, 6 tonos más claro' },
    { patIdx: 3,  provider: dentistUser, daysOffset: -100, hour: 11, duration: 60, status: AppointmentStatus.COMPLETED, proc: 'Examen completo',                       notes: 'Múltiples caries, plan de tratamiento elaborado' },
    { patIdx: 3,  provider: dentistUser, daysOffset: -85, hour: 10, duration: 60, status: AppointmentStatus.COMPLETED, proc: 'Extracción simple #34',                  notes: 'Post-op sin complicaciones' },
    { patIdx: 3,  provider: dentistUser, daysOffset: -70, hour: 14, duration: 45, status: AppointmentStatus.COMPLETED, proc: 'Obturación amalgama #36',               notes: 'Amalgama clase II colocada' },
    { patIdx: 4,  provider: dentistUser, daysOffset: -40, hour: 9,  duration: 45, status: AppointmentStatus.COMPLETED, proc: 'Limpieza dental',                        notes: 'Gingivitis leve' },
    { patIdx: 5,  provider: dentist4,    daysOffset: -55, hour: 15, duration: 90, status: AppointmentStatus.COMPLETED, proc: 'Mantenimiento periodontal',              notes: 'Paciente bajo control periodontal regular' },
    { patIdx: 5,  provider: dentist4,    daysOffset: -25, hour: 10, duration: 90, status: AppointmentStatus.COMPLETED, proc: 'Raspado cuadrante 1',                    notes: 'Mejoría significativa en sondaje' },
    { patIdx: 6,  provider: dentistUser, daysOffset: -35, hour: 11, duration: 60, status: AppointmentStatus.COMPLETED, proc: 'Corona porcelana #11',                   notes: 'Corona cementada definitiva' },
    { patIdx: 7,  provider: dentistUser, daysOffset: -15, hour: 14, duration: 30, status: AppointmentStatus.COMPLETED, proc: 'Examen periódico',                       notes: 'Control semestral rutinario' },
    { patIdx: 8,  provider: dentistUser, daysOffset: -5,  hour: 9,  duration: 45, status: AppointmentStatus.COMPLETED, proc: 'Aplicación de sellantes en #14,15,24,25', notes: 'Paciente joven, sellantes preventivos' },
    { patIdx: 9,  provider: dentistUser, daysOffset: -120, hour: 10, duration: 60, status: AppointmentStatus.COMPLETED, proc: 'Extracción quirúrgica #48',             notes: 'Tercer molar incluido, sin complicaciones' },
    { patIdx: 10, provider: dentistUser, daysOffset: -80, hour: 15, duration: 45, status: AppointmentStatus.COMPLETED, proc: 'Limpieza + radiografías',                notes: 'Inicio de tratamiento de ortodoncia pendiente' },
    { patIdx: 11, provider: dentistUser, daysOffset: -60, hour: 9,  duration: 30, status: AppointmentStatus.COMPLETED, proc: 'Examen pediátrico + flúor',              notes: 'Paciente pediátrico, sin caries, buen estado' },
    // Canceladas
    { patIdx: 2,  provider: dentistUser, daysOffset: -3,  hour: 14, duration: 30, status: AppointmentStatus.CANCELLED, proc: 'Revisión de blanqueamiento',             notes: 'Paciente canceló por trabajo' },
    { patIdx: 6,  provider: dentistUser, daysOffset: -7,  hour: 10, duration: 45, status: AppointmentStatus.CANCELLED, proc: 'Revisión de corona',                     notes: 'No se presentó' },
    // No show
    { patIdx: 4,  provider: dentistUser, daysOffset: -14, hour: 11, duration: 45, status: AppointmentStatus.NO_SHOW,   proc: 'Limpieza dental',                        notes: 'Segunda falta sin aviso' },
    // Futuras - programadas
    { patIdx: 0,  provider: dentistUser, daysOffset: 7,   hour: 9,  duration: 60, status: AppointmentStatus.SCHEDULED, proc: 'Obturación resina compuesta #26',       notes: 'Segunda caries pendiente de tratar' },
    { patIdx: 1,  provider: dentist4,    daysOffset: 5,   hour: 10, duration: 90, status: AppointmentStatus.SCHEDULED, proc: 'Mantenimiento periodontal',              notes: 'Control periodontal programado' },
    { patIdx: 3,  provider: dentistUser, daysOffset: 3,   hour: 14, duration: 45, status: AppointmentStatus.SCHEDULED, proc: 'Obturación resina #44',                 notes: 'Próxima caries del plan de tratamiento' },
    { patIdx: 5,  provider: dentist4,    daysOffset: 10,  hour: 9,  duration: 90, status: AppointmentStatus.SCHEDULED, proc: 'Raspado cuadrante 2',                   notes: 'Continuación del tratamiento periodontal' },
    { patIdx: 7,  provider: dentistUser, daysOffset: 14,  hour: 11, duration: 60, status: AppointmentStatus.SCHEDULED, proc: 'Endodoncia incisivo #21',               notes: 'Diagnóstico previo de periodontitis apical' },
    { patIdx: 8,  provider: dentistUser, daysOffset: 21,  hour: 15, duration: 45, status: AppointmentStatus.SCHEDULED, proc: 'Control sellantes',                     notes: 'Revisión de sellantes colocados' },
    { patIdx: 10, provider: dentistUser, daysOffset: 2,   hour: 9,  duration: 60, status: AppointmentStatus.SCHEDULED, proc: 'Limpieza dental',                       notes: 'Primer limpieza del año' },
    { patIdx: 11, provider: dentistUser, daysOffset: 28,  hour: 10, duration: 30, status: AppointmentStatus.SCHEDULED, proc: 'Control pediátrico 6 meses',            notes: 'Visita rutinaria' },
    // Confirmadas para hoy / mañana
    { patIdx: 4,  provider: dentistUser, daysOffset: 1,   hour: 9,  duration: 45, status: AppointmentStatus.CONFIRMED, proc: 'Examen periódico + radiografías',       notes: 'Paciente con deuda pendiente' },
    { patIdx: 6,  provider: dentistUser, daysOffset: 0,   hour: 14, duration: 60, status: AppointmentStatus.CONFIRMED, proc: 'Revisión de corona + ajuste oclusal',   notes: 'Leve molestia reportada' },
    { patIdx: 9,  provider: dentistUser, daysOffset: 1,   hour: 11, duration: 90, status: AppointmentStatus.CONFIRMED, proc: 'Prótesis parcial removible',            notes: 'Prueba de metal' },
  ];

  for (const ad of apptDefs) {
    const pat = patList[ad.patIdx];
    if (!pat) continue;
    const apptDate = new Date(Date.now() + ad.daysOffset * 86_400_000);
    apptDate.setHours(ad.hour, 0, 0, 0);
    await prisma.appointment.create({
      data: {
        patientId: pat.id,
        providerId: ad.provider.id,
        tenantId: tenant.id,
        scheduledAt: apptDate,
        duration: ad.duration,
        status: ad.status,
        procedureType: ad.proc,
        notes: ad.notes ?? null,
      },
    });
  }
  console.log(`✅ ${apptDefs.length} citas creadas`);

  // ── 8. Odontogramas ──────────────────────────────────────────────────────────
  type ToothEntry = { number: number; condition: ToothCondition; surfaces?: ToothSurface[]; notes?: string };
  type OdonDef = { patIdx: number; notes: string; teeth: ToothEntry[] };

  const odonDefs: OdonDef[] = [
    {
      patIdx: 0,
      notes: 'Paciente con caries múltiples tratadas. Excelente pronóstico.',
      teeth: [
        { number: 11, condition: ToothCondition.HEALTHY },
        { number: 12, condition: ToothCondition.HEALTHY },
        { number: 13, condition: ToothCondition.HEALTHY },
        { number: 14, condition: ToothCondition.FILLED, surfaces: [ToothSurface.OCCLUSAL], notes: 'Obturación amalgama 2021' },
        { number: 15, condition: ToothCondition.HEALTHY },
        { number: 16, condition: ToothCondition.FILLED, surfaces: [ToothSurface.MESIAL, ToothSurface.OCCLUSAL], notes: 'Resina reciente' },
        { number: 17, condition: ToothCondition.HEALTHY },
        { number: 18, condition: ToothCondition.MISSING, notes: 'Extraído 2020' },
        { number: 21, condition: ToothCondition.HEALTHY },
        { number: 22, condition: ToothCondition.HEALTHY },
        { number: 23, condition: ToothCondition.HEALTHY },
        { number: 24, condition: ToothCondition.HEALTHY },
        { number: 25, condition: ToothCondition.HEALTHY },
        { number: 26, condition: ToothCondition.DECAYED, surfaces: [ToothSurface.DISTAL, ToothSurface.OCCLUSAL], notes: 'Caries pendiente de tratar' },
        { number: 27, condition: ToothCondition.HEALTHY },
        { number: 28, condition: ToothCondition.MISSING, notes: 'Extraído 2019' },
        { number: 31, condition: ToothCondition.HEALTHY },
        { number: 32, condition: ToothCondition.HEALTHY },
        { number: 36, condition: ToothCondition.FILLED, surfaces: [ToothSurface.OCCLUSAL], notes: 'Amalgama 2018' },
        { number: 46, condition: ToothCondition.ROOT_CANAL, notes: 'Endodoncia con corona pendiente' },
        { number: 47, condition: ToothCondition.HEALTHY },
        { number: 48, condition: ToothCondition.MISSING, notes: 'Extraído 2022' },
      ],
    },
    {
      patIdx: 1,
      notes: 'Paciente con tratamiento periodontal activo. Múltiples restauraciones.',
      teeth: [
        { number: 11, condition: ToothCondition.HEALTHY },
        { number: 12, condition: ToothCondition.FILLED, surfaces: [ToothSurface.PALATAL] },
        { number: 13, condition: ToothCondition.HEALTHY },
        { number: 14, condition: ToothCondition.CROWN, notes: 'Corona metal-porcelana 2023' },
        { number: 15, condition: ToothCondition.HEALTHY },
        { number: 16, condition: ToothCondition.CROWN, notes: 'Corona metal 2021' },
        { number: 17, condition: ToothCondition.HEALTHY },
        { number: 18, condition: ToothCondition.MISSING },
        { number: 21, condition: ToothCondition.HEALTHY },
        { number: 22, condition: ToothCondition.HEALTHY },
        { number: 23, condition: ToothCondition.HEALTHY },
        { number: 24, condition: ToothCondition.FILLED, surfaces: [ToothSurface.OCCLUSAL] },
        { number: 25, condition: ToothCondition.FILLED, surfaces: [ToothSurface.OCCLUSAL, ToothSurface.DISTAL] },
        { number: 26, condition: ToothCondition.CROWN },
        { number: 27, condition: ToothCondition.HEALTHY },
        { number: 28, condition: ToothCondition.MISSING },
        { number: 36, condition: ToothCondition.ROOT_CANAL, notes: 'Endodoncia reciente' },
        { number: 37, condition: ToothCondition.HEALTHY },
        { number: 38, condition: ToothCondition.MISSING },
        { number: 44, condition: ToothCondition.FILLED, surfaces: [ToothSurface.OCCLUSAL] },
        { number: 46, condition: ToothCondition.FILLED, surfaces: [ToothSurface.MESIAL, ToothSurface.OCCLUSAL] },
        { number: 47, condition: ToothCondition.HEALTHY },
        { number: 48, condition: ToothCondition.MISSING },
      ],
    },
    {
      patIdx: 3,
      notes: 'Paciente adulto mayor, dentición deteriorada por falta de higiene. Tratamiento activo.',
      teeth: [
        { number: 11, condition: ToothCondition.HEALTHY },
        { number: 12, condition: ToothCondition.DECAYED, surfaces: [ToothSurface.MESIAL] },
        { number: 13, condition: ToothCondition.HEALTHY },
        { number: 14, condition: ToothCondition.FILLED },
        { number: 15, condition: ToothCondition.MISSING },
        { number: 16, condition: ToothCondition.MISSING },
        { number: 17, condition: ToothCondition.MISSING },
        { number: 18, condition: ToothCondition.MISSING },
        { number: 21, condition: ToothCondition.HEALTHY },
        { number: 22, condition: ToothCondition.HEALTHY },
        { number: 23, condition: ToothCondition.HEALTHY },
        { number: 24, condition: ToothCondition.FILLED, surfaces: [ToothSurface.OCCLUSAL] },
        { number: 25, condition: ToothCondition.MISSING },
        { number: 26, condition: ToothCondition.MISSING },
        { number: 27, condition: ToothCondition.MISSING },
        { number: 28, condition: ToothCondition.MISSING },
        { number: 31, condition: ToothCondition.HEALTHY },
        { number: 32, condition: ToothCondition.HEALTHY },
        { number: 33, condition: ToothCondition.HEALTHY },
        { number: 34, condition: ToothCondition.MISSING, notes: 'Extraído en consulta' },
        { number: 35, condition: ToothCondition.DECAYED, surfaces: [ToothSurface.DISTAL] },
        { number: 36, condition: ToothCondition.FILLED, surfaces: [ToothSurface.OCCLUSAL, ToothSurface.MESIAL] },
        { number: 37, condition: ToothCondition.MISSING },
        { number: 41, condition: ToothCondition.HEALTHY },
        { number: 42, condition: ToothCondition.HEALTHY },
        { number: 43, condition: ToothCondition.HEALTHY },
        { number: 44, condition: ToothCondition.DECAYED, surfaces: [ToothSurface.OCCLUSAL] },
        { number: 45, condition: ToothCondition.HEALTHY },
        { number: 46, condition: ToothCondition.MISSING },
        { number: 47, condition: ToothCondition.MISSING },
      ],
    },
    {
      patIdx: 6,
      notes: 'Paciente con corona en #11. Buen estado general.',
      teeth: [
        { number: 11, condition: ToothCondition.CROWN, notes: 'Corona porcelana, cementada hace 2 meses' },
        { number: 12, condition: ToothCondition.HEALTHY },
        { number: 13, condition: ToothCondition.HEALTHY },
        { number: 14, condition: ToothCondition.HEALTHY },
        { number: 15, condition: ToothCondition.FILLED, surfaces: [ToothSurface.OCCLUSAL] },
        { number: 16, condition: ToothCondition.HEALTHY },
        { number: 21, condition: ToothCondition.HEALTHY },
        { number: 22, condition: ToothCondition.HEALTHY },
        { number: 23, condition: ToothCondition.HEALTHY },
        { number: 24, condition: ToothCondition.HEALTHY },
        { number: 25, condition: ToothCondition.HEALTHY },
        { number: 26, condition: ToothCondition.HEALTHY },
        { number: 36, condition: ToothCondition.FILLED, surfaces: [ToothSurface.OCCLUSAL] },
        { number: 46, condition: ToothCondition.HEALTHY },
      ],
    },
    {
      patIdx: 8,
      notes: 'Paciente joven (menor), sellantes colocados preventivamente.',
      teeth: [
        { number: 14, condition: ToothCondition.SEALANT, notes: 'Sellante reciente' },
        { number: 15, condition: ToothCondition.SEALANT, notes: 'Sellante reciente' },
        { number: 24, condition: ToothCondition.SEALANT, notes: 'Sellante reciente' },
        { number: 25, condition: ToothCondition.SEALANT, notes: 'Sellante reciente' },
        { number: 16, condition: ToothCondition.HEALTHY },
        { number: 26, condition: ToothCondition.HEALTHY },
        { number: 36, condition: ToothCondition.HEALTHY },
        { number: 46, condition: ToothCondition.HEALTHY },
      ],
    },
  ];

  for (const od of odonDefs) {
    const pat = patList[od.patIdx];
    if (!pat) continue;
    const existing = await prisma.odontogram.findFirst({ where: { patientId: pat.id, tenantId: tenant.id } });
    if (existing) continue;
    const odon = await prisma.odontogram.create({
      data: {
        patientId: pat.id,
        providerId: dentistUser.id,
        tenantId: tenant.id,
        notes: od.notes,
        examinationDate: daysAgo(rand(5, 60)),
      },
    });
    for (const tooth of od.teeth) {
      await prisma.odontogramTooth.create({
        data: {
          odontogramId: odon.id,
          toothNumber: tooth.number,
          condition: tooth.condition,
          surfaces: tooth.surfaces ?? [],
          notes: tooth.notes ?? null,
        },
      });
    }
  }
  console.log(`✅ ${odonDefs.length} odontogramas creados`);

  // ── 9. Planes de tratamiento ─────────────────────────────────────────────────
  type TxItemDef = { description: string; toothNumber?: number; status: TreatmentItemStatus; estimatedCost: number; scheduledDate?: Date };
  type TxDef = { patIdx: number; title: string; status: TreatmentPlanStatus; notes: string; items: TxItemDef[] };

  const txDefs: TxDef[] = [
    {
      patIdx: 0,
      title: 'Plan rehabilitación sector posterior',
      status: TreatmentPlanStatus.IN_PROGRESS,
      notes: 'Paciente acepta plan de tratamiento en 2 fases. Fase 1 completada.',
      items: [
        { description: 'Obturación resina #16 (MESIAL-OCLUSAL)', toothNumber: 16, status: TreatmentItemStatus.COMPLETED, estimatedCost: 1100, scheduledDate: daysAgo(60) },
        { description: 'Obturación resina #26 (DISTAL-OCLUSAL)', toothNumber: 26, status: TreatmentItemStatus.SCHEDULED, estimatedCost: 1100, scheduledDate: daysFromNow(7) },
        { description: 'Corona provisional #46', toothNumber: 46, status: TreatmentItemStatus.PENDING, estimatedCost: 1500 },
        { description: 'Corona porcelana/metal #46', toothNumber: 46, status: TreatmentItemStatus.PENDING, estimatedCost: 5500 },
      ],
    },
    {
      patIdx: 1,
      title: 'Tratamiento periodontal integral',
      status: TreatmentPlanStatus.IN_PROGRESS,
      notes: 'Enfermedad periodontal moderada. 4 cuadrantes. 2 completados.',
      items: [
        { description: 'Raspado y alisado radicular cuadrante 1', status: TreatmentItemStatus.COMPLETED, estimatedCost: 2200, scheduledDate: daysAgo(45) },
        { description: 'Raspado y alisado radicular cuadrante 3', status: TreatmentItemStatus.COMPLETED, estimatedCost: 2200, scheduledDate: daysAgo(20) },
        { description: 'Raspado y alisado radicular cuadrante 2', status: TreatmentItemStatus.SCHEDULED, estimatedCost: 2200, scheduledDate: daysFromNow(5) },
        { description: 'Raspado y alisado radicular cuadrante 4', status: TreatmentItemStatus.PENDING, estimatedCost: 2200 },
        { description: 'Mantenimiento periodontal (mes 3)', status: TreatmentItemStatus.PENDING, estimatedCost: 800 },
        { description: 'Mantenimiento periodontal (mes 6)', status: TreatmentItemStatus.PENDING, estimatedCost: 800 },
      ],
    },
    {
      patIdx: 3,
      title: 'Rehabilitación oral completa',
      status: TreatmentPlanStatus.PROPOSED,
      notes: 'Paciente con múltiples ausencias y caries. Plan extenso a largo plazo.',
      items: [
        { description: 'Extracción simple #34 (completada)', toothNumber: 34, status: TreatmentItemStatus.COMPLETED, estimatedCost: 1200, scheduledDate: daysAgo(85) },
        { description: 'Obturación amalgama #36', toothNumber: 36, status: TreatmentItemStatus.COMPLETED, estimatedCost: 900, scheduledDate: daysAgo(70) },
        { description: 'Obturación resina #44', toothNumber: 44, status: TreatmentItemStatus.SCHEDULED, estimatedCost: 1100, scheduledDate: daysFromNow(3) },
        { description: 'Obturación resina #12 (MESIAL)', toothNumber: 12, status: TreatmentItemStatus.PENDING, estimatedCost: 1100 },
        { description: 'Obturación resina #35', toothNumber: 35, status: TreatmentItemStatus.PENDING, estimatedCost: 1100 },
        { description: 'Prótesis parcial removible superior', status: TreatmentItemStatus.PENDING, estimatedCost: 8000 },
        { description: 'Prótesis parcial removible inferior', status: TreatmentItemStatus.PENDING, estimatedCost: 8000 },
      ],
    },
    {
      patIdx: 7,
      title: 'Tratamiento endodóntico y corona',
      status: TreatmentPlanStatus.APPROVED,
      notes: 'Caries profunda #21 con compromiso pulpar. Tratamiento endodóntico indicado.',
      items: [
        { description: 'Radiografía periapical #21', toothNumber: 21, status: TreatmentItemStatus.COMPLETED, estimatedCost: 200, scheduledDate: daysAgo(15) },
        { description: 'Endodoncia incisivo #21', toothNumber: 21, status: TreatmentItemStatus.SCHEDULED, estimatedCost: 3000, scheduledDate: daysFromNow(14) },
        { description: 'Corona provisional #21', toothNumber: 21, status: TreatmentItemStatus.PENDING, estimatedCost: 1500 },
        { description: 'Corona porcelana definitiva #21', toothNumber: 21, status: TreatmentItemStatus.PENDING, estimatedCost: 5500 },
      ],
    },
    {
      patIdx: 10,
      title: 'Plan preventivo adulto',
      status: TreatmentPlanStatus.IN_PROGRESS,
      notes: 'Paciente sin caries activas. Mantenimiento preventivo.',
      items: [
        { description: 'Limpieza dental semestral (1/2)', status: TreatmentItemStatus.SCHEDULED, estimatedCost: 600, scheduledDate: daysFromNow(2) },
        { description: 'Aplicación de flúor', status: TreatmentItemStatus.PENDING, estimatedCost: 300 },
        { description: 'Limpieza dental semestral (2/2)', status: TreatmentItemStatus.PENDING, estimatedCost: 600 },
      ],
    },
  ];

  for (const td of txDefs) {
    const pat = patList[td.patIdx];
    if (!pat) continue;
    const existing = await prisma.treatmentPlan.findFirst({ where: { patientId: pat.id, tenantId: tenant.id, title: td.title } });
    if (existing) continue;
    const totalCost = td.items.reduce((s, i) => s + i.estimatedCost, 0);
    const plan = await prisma.treatmentPlan.create({
      data: {
        patientId: pat.id,
        providerId: dentistUser.id,
        tenantId: tenant.id,
        title: td.title,
        status: td.status,
        notes: td.notes,
        estimatedCost: totalCost,
        startDate: daysAgo(rand(30, 120)),
      },
    });
    let orderNum = 1;
    for (const item of td.items) {
      await prisma.treatmentPlanItem.create({
        data: {
          planId: plan.id,
          description: item.description,
          toothNumber: item.toothNumber ?? null,
          status: item.status,
          estimatedCost: item.estimatedCost,
          scheduledDate: item.scheduledDate ?? null,
          orderNumber: orderNum++,
        },
      });
    }
  }
  console.log(`✅ ${txDefs.length} planes de tratamiento con ítems`);

  // ── 10. Facturas + Ítems + Pagos ─────────────────────────────────────────────
  type InvItemDef = { description: string; qty: number; unitPrice: number };
  type PayDef = { method: PaymentMethod; amount: number; daysAgoN: number };
  type InvDef = {
    patIdx: number;
    number: string;
    status: InvoiceStatus;
    issueDaysAgo: number;
    dueDaysFromNow: number;
    items: InvItemDef[];
    payments?: PayDef[];
    notes?: string;
  };

  const invDefs: InvDef[] = [
    {
      patIdx: 0,
      number: 'FAC-2025-0001',
      status: InvoiceStatus.PAID,
      issueDaysAgo: 60,
      dueDaysFromNow: -30,
      notes: 'Obturación resina #16',
      items: [
        { description: 'Obturación resina compuesta #16 (Mesial-Oclusal)', qty: 1, unitPrice: 1100 },
        { description: 'Radiografía periapical', qty: 2, unitPrice: 200 },
      ],
      payments: [{ method: PaymentMethod.CREDIT_CARD, amount: 1500, daysAgoN: 59 }],
    },
    {
      patIdx: 0,
      number: 'FAC-2025-0002',
      status: InvoiceStatus.SENT,
      issueDaysAgo: 30,
      dueDaysFromNow: 15,
      notes: 'Limpieza dental',
      items: [
        { description: 'Profilaxis dental / Limpieza', qty: 1, unitPrice: 600 },
        { description: 'Aplicación de flúor', qty: 1, unitPrice: 300 },
      ],
    },
    {
      patIdx: 1,
      number: 'FAC-2025-0003',
      status: InvoiceStatus.PAID,
      issueDaysAgo: 75,
      dueDaysFromNow: -45,
      notes: 'Examen periódico',
      items: [
        { description: 'Examen periódico completo', qty: 1, unitPrice: 450 },
      ],
      payments: [{ method: PaymentMethod.CASH, amount: 450, daysAgoN: 74 }],
    },
    {
      patIdx: 1,
      number: 'FAC-2025-0004',
      status: InvoiceStatus.PAID,
      issueDaysAgo: 45,
      dueDaysFromNow: -15,
      notes: 'Endodoncia + honorarios Dra. Rojas',
      items: [
        { description: 'Endodoncia molar #46', qty: 1, unitPrice: 5000 },
        { description: 'Anestesia local (3 carpules)', qty: 3, unitPrice: 80 },
      ],
      payments: [
        { method: PaymentMethod.BANK_TRANSFER, amount: 3000, daysAgoN: 44 },
        { method: PaymentMethod.CREDIT_CARD, amount: 2240, daysAgoN: 30 },
      ],
    },
    {
      patIdx: 1,
      number: 'FAC-2025-0005',
      status: InvoiceStatus.SENT,
      issueDaysAgo: 20,
      dueDaysFromNow: 10,
      notes: 'Raspado cuadrante 3',
      items: [
        { description: 'Raspado y alisado radicular cuadrante 3', qty: 1, unitPrice: 2200 },
      ],
    },
    {
      patIdx: 2,
      number: 'FAC-2025-0006',
      status: InvoiceStatus.PAID,
      issueDaysAgo: 50,
      dueDaysFromNow: -20,
      notes: 'Limpieza dental',
      items: [
        { description: 'Profilaxis dental', qty: 1, unitPrice: 600 },
      ],
      payments: [{ method: PaymentMethod.CASH, amount: 600, daysAgoN: 49 }],
    },
    {
      patIdx: 2,
      number: 'FAC-2025-0007',
      status: InvoiceStatus.PAID,
      issueDaysAgo: 10,
      dueDaysFromNow: -5,
      notes: 'Blanqueamiento dental',
      items: [
        { description: 'Blanqueamiento dental profesional (LED)', qty: 1, unitPrice: 2800 },
      ],
      payments: [{ method: PaymentMethod.CREDIT_CARD, amount: 2800, daysAgoN: 9 }],
    },
    {
      patIdx: 3,
      number: 'FAC-2025-0008',
      status: InvoiceStatus.PAID,
      issueDaysAgo: 100,
      dueDaysFromNow: -70,
      notes: 'Examen completo',
      items: [
        { description: 'Examen completo inicial', qty: 1, unitPrice: 850 },
        { description: 'Ortopantomografía', qty: 1, unitPrice: 1200 },
      ],
      payments: [{ method: PaymentMethod.CASH, amount: 2050, daysAgoN: 99 }],
    },
    {
      patIdx: 3,
      number: 'FAC-2025-0009',
      status: InvoiceStatus.PAID,
      issueDaysAgo: 85,
      dueDaysFromNow: -55,
      notes: 'Extracción #34',
      items: [
        { description: 'Extracción simple #34', qty: 1, unitPrice: 1200 },
        { description: 'Anestesia local', qty: 2, unitPrice: 80 },
      ],
      payments: [{ method: PaymentMethod.BANK_TRANSFER, amount: 1360, daysAgoN: 84 }],
    },
    {
      patIdx: 3,
      number: 'FAC-2025-0010',
      status: InvoiceStatus.OVERDUE,
      issueDaysAgo: 70,
      dueDaysFromNow: -40,
      notes: 'Amalgama #36 — VENCIDA',
      items: [
        { description: 'Obturación amalgama clase II #36', qty: 1, unitPrice: 900 },
      ],
    },
    {
      patIdx: 4,
      number: 'FAC-2025-0011',
      status: InvoiceStatus.PAID,
      issueDaysAgo: 40,
      dueDaysFromNow: -10,
      notes: 'Limpieza dental',
      items: [
        { description: 'Profilaxis dental', qty: 1, unitPrice: 600 },
      ],
      payments: [{ method: PaymentMethod.CASH, amount: 600, daysAgoN: 39 }],
    },
    {
      patIdx: 5,
      number: 'FAC-2025-0012',
      status: InvoiceStatus.PAID,
      issueDaysAgo: 55,
      dueDaysFromNow: -25,
      notes: 'Mantenimiento periodontal',
      items: [
        { description: 'Mantenimiento periodontal', qty: 1, unitPrice: 800 },
      ],
      payments: [{ method: PaymentMethod.CREDIT_CARD, amount: 800, daysAgoN: 54 }],
    },
    {
      patIdx: 5,
      number: 'FAC-2025-0013',
      status: InvoiceStatus.SENT,
      issueDaysAgo: 25,
      dueDaysFromNow: 5,
      notes: 'Raspado cuadrante 1',
      items: [
        { description: 'Raspado y alisado radicular cuadrante 1', qty: 1, unitPrice: 2200 },
      ],
    },
    {
      patIdx: 6,
      number: 'FAC-2025-0014',
      status: InvoiceStatus.PAID,
      issueDaysAgo: 35,
      dueDaysFromNow: -5,
      notes: 'Corona porcelana #11',
      items: [
        { description: 'Corona porcelana metal-fusionada #11', qty: 1, unitPrice: 5500 },
        { description: 'Corona provisional #11', qty: 1, unitPrice: 1500 },
        { description: 'Radiografía periapical', qty: 1, unitPrice: 200 },
      ],
      payments: [
        { method: PaymentMethod.BANK_TRANSFER, amount: 4000, daysAgoN: 34 },
        { method: PaymentMethod.CREDIT_CARD, amount: 3200, daysAgoN: 20 },
      ],
    },
    {
      patIdx: 7,
      number: 'FAC-2025-0015',
      status: InvoiceStatus.PAID,
      issueDaysAgo: 15,
      dueDaysFromNow: 15,
      notes: 'Examen periódico',
      items: [
        { description: 'Examen periódico', qty: 1, unitPrice: 450 },
        { description: 'Radiografía periapical (2 proyecciones)', qty: 2, unitPrice: 200 },
      ],
      payments: [{ method: PaymentMethod.CASH, amount: 850, daysAgoN: 14 }],
    },
    {
      patIdx: 8,
      number: 'FAC-2025-0016',
      status: InvoiceStatus.PAID,
      issueDaysAgo: 5,
      dueDaysFromNow: 25,
      notes: 'Sellantes pediátricos',
      items: [
        { description: 'Sellante de fosas y fisuras (x4)', qty: 4, unitPrice: 400 },
        { description: 'Aplicación de flúor', qty: 1, unitPrice: 300 },
      ],
      payments: [{ method: PaymentMethod.CASH, amount: 1900, daysAgoN: 4 }],
    },
    {
      patIdx: 9,
      number: 'FAC-2025-0017',
      status: InvoiceStatus.PAID,
      issueDaysAgo: 120,
      dueDaysFromNow: -90,
      notes: 'Extracción quirúrgica #48',
      items: [
        { description: 'Extracción quirúrgica muela del juicio #48', qty: 1, unitPrice: 2500 },
        { description: 'Anestesia local (4 carpules)', qty: 4, unitPrice: 80 },
        { description: 'Prescripción antibiótico + analgésico', qty: 1, unitPrice: 200 },
      ],
      payments: [{ method: PaymentMethod.CREDIT_CARD, amount: 3020, daysAgoN: 119 }],
    },
    {
      patIdx: 10,
      number: 'FAC-2025-0018',
      status: InvoiceStatus.DRAFT,
      issueDaysAgo: 80,
      dueDaysFromNow: -50,
      notes: 'Limpieza y radiografías — BORRADOR',
      items: [
        { description: 'Profilaxis dental', qty: 1, unitPrice: 600 },
        { description: 'Radiografías bitewing (2)', qty: 2, unitPrice: 300 },
      ],
    },
    {
      patIdx: 11,
      number: 'FAC-2025-0019',
      status: InvoiceStatus.PAID,
      issueDaysAgo: 60,
      dueDaysFromNow: -30,
      notes: 'Control pediátrico',
      items: [
        { description: 'Examen pediátrico completo', qty: 1, unitPrice: 450 },
        { description: 'Aplicación de flúor', qty: 1, unitPrice: 300 },
      ],
      payments: [{ method: PaymentMethod.CASH, amount: 750, daysAgoN: 59 }],
    },
  ];

  for (const id of invDefs) {
    const pat = patList[id.patIdx];
    if (!pat) continue;
    const existing = await prisma.invoice.findFirst({ where: { tenantId: tenant.id, invoiceNumber: id.number } });
    if (existing) continue;

    const subtotal = id.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const tax = Math.round(subtotal * 0.16);
    const total = subtotal + tax;

    const inv = await prisma.invoice.create({
      data: {
        patientId: pat.id,
        providerId: dentistUser.id,
        tenantId: tenant.id,
        invoiceNumber: id.number,
        status: id.status,
        issueDate: daysAgo(id.issueDaysAgo),
        dueDate: id.dueDaysFromNow >= 0 ? daysFromNow(id.dueDaysFromNow) : daysAgo(-id.dueDaysFromNow),
        subtotal,
        tax,
        discount: 0,
        total,
        amountPaid: id.payments ? id.payments.reduce((s, p) => s + p.amount, 0) : 0,
        notes: id.notes ?? null,
      },
    });

    for (const item of id.items) {
      await prisma.invoiceItem.create({
        data: {
          invoiceId: inv.id,
          description: item.description,
          quantity: item.qty,
          unitPrice: item.unitPrice,
          total: item.qty * item.unitPrice,
        },
      });
    }

    if (id.payments) {
      for (const pay of id.payments) {
        await prisma.payment.create({
          data: {
            invoiceId: inv.id,
            tenantId: tenant.id,
            amount: pay.amount,
            method: pay.method,
            status: PaymentStatus.COMPLETED,
            paidAt: daysAgo(pay.daysAgoN),
            notes: 'Pago registrado',
          },
        });
      }
    }
  }
  console.log(`✅ ${invDefs.length} facturas + ítems + pagos`);

  // ── 11. Documentos ───────────────────────────────────────────────────────────
  const docDefs = [
    { patIdx: 0,  type: DocumentType.XRAY,    title: 'Radiografía panorámica inicial',       size: 1024 * 512 },
    { patIdx: 0,  type: DocumentType.XRAY,    title: 'Radiografía periapical #16',           size: 1024 * 256 },
    { patIdx: 1,  type: DocumentType.XRAY,    title: 'Radiografía panorámica + periapicales', size: 1024 * 600 },
    { patIdx: 1,  type: DocumentType.CONSENT, title: 'Consentimiento tratamiento periodontal', size: 1024 * 128 },
    { patIdx: 2,  type: DocumentType.CONSENT, title: 'Consentimiento blanqueamiento dental',  size: 1024 * 100 },
    { patIdx: 3,  type: DocumentType.XRAY,    title: 'Ortopantomografía inicial',             size: 1024 * 800 },
    { patIdx: 3,  type: DocumentType.CONSENT, title: 'Consentimiento extracción #34',         size: 1024 * 100 },
    { patIdx: 6,  type: DocumentType.XRAY,    title: 'Radiografía preoperatoria corona #11', size: 1024 * 300 },
    { patIdx: 6,  type: DocumentType.CONSENT, title: 'Consentimiento prótesis fija #11',      size: 1024 * 100 },
    { patIdx: 7,  type: DocumentType.XRAY,    title: 'Periapical #21 — diagnóstico pulpar',  size: 1024 * 250 },
    { patIdx: 9,  type: DocumentType.XRAY,    title: 'Rx preoperatoria extracción #48',      size: 1024 * 280 },
    { patIdx: 9,  type: DocumentType.CONSENT, title: 'Consentimiento cirugía oral #48',       size: 1024 * 100 },
  ] as const;

  for (const dd of docDefs) {
    const pat = patList[dd.patIdx];
    if (!pat) continue;
    await prisma.document.create({
      data: {
        patientId: pat.id,
        uploadedById: dentistUser.id,
        tenantId: tenant.id,
        type: dd.type,
        title: dd.title,
        fileName: `${dd.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.pdf`,
        fileSize: dd.size,
        mimeType: dd.type === DocumentType.XRAY ? 'image/jpeg' : 'application/pdf',
        storageUrl: `https://storage.dentista.com/docs/${tenant.id}/${Date.now()}.${dd.type === DocumentType.XRAY ? 'jpg' : 'pdf'}`,
        isShared: false,
        expiresAt: null,
      },
    });
  }
  console.log(`✅ ${docDefs.length} documentos (Rx + consentimientos)`);

  // ── 12. Notificaciones ───────────────────────────────────────────────────────
  const patient0User = await prisma.user.findFirst({ where: { email: 'ana.gomez@mail.com' } });
  const patient1User = await prisma.user.findFirst({ where: { email: 'miguel.torres@mail.com' } });
  const patient3User = await prisma.user.findFirst({ where: { email: 'jose.morales@mail.com' } });

  const notifDefs = [
    { userId: dentistUser.id, type: NotificationType.EMAIL, channel: NotificationChannel.APPOINTMENT_REMINDER, subject: 'Cita mañana', message: 'Recuerda que Ana Gómez tiene cita mañana a las 9:00 AM para obturación #26.' },
    { userId: dentistUser.id, type: NotificationType.PUSH,  channel: NotificationChannel.SYSTEM_ALERT, subject: 'Stock bajo', message: 'El ítem "Film radiográfico dental" tiene stock por debajo del mínimo (3 cajas).' },
    { userId: dentistUser.id, type: NotificationType.EMAIL, channel: NotificationChannel.APPOINTMENT_CANCELLATION, subject: 'Cita cancelada', message: 'Sofía Vargas canceló su cita del día de hoy.' },
    { userId: dentistUser.id, type: NotificationType.PUSH,  channel: NotificationChannel.PAYMENT_REMINDER, subject: 'Factura vencida', message: 'FAC-2025-0010 de José Morales lleva 40 días vencida. Saldo: Bs 1,044.' },
    ...(patient0User ? [
      { userId: patient0User.id, type: NotificationType.SMS, channel: NotificationChannel.APPOINTMENT_REMINDER, subject: null, message: 'Recordatorio: Su cita con Dr. Smith es en 24 horas.' },
      { userId: patient0User.id, type: NotificationType.EMAIL, channel: NotificationChannel.PAYMENT_REMINDER, subject: 'Factura pendiente', message: 'Tiene una factura pendiente FAC-2025-0002 por Bs 1,044.' },
    ] : []),
    ...(patient1User ? [
      { userId: patient1User.id, type: NotificationType.EMAIL, channel: NotificationChannel.APPOINTMENT_REMINDER, subject: 'Cita próxima semana', message: 'Su mantenimiento periodontal está programado para el lunes.' },
    ] : []),
    ...(patient3User ? [
      { userId: patient3User.id, type: NotificationType.EMAIL, channel: NotificationChannel.PAYMENT_REMINDER, subject: 'Pago pendiente', message: 'Tiene una factura vencida. Comuníquese con la clínica.' },
    ] : []),
    { userId: staffUser.id, type: NotificationType.PUSH, channel: NotificationChannel.SYSTEM_ALERT, subject: 'Lista de espera', message: '3 pacientes en lista de espera para hoy. Revise disponibilidad.' },
    { userId: receptionista2.id, type: NotificationType.PUSH, channel: NotificationChannel.SYSTEM_ALERT, subject: 'Nueva cita confirmada', message: 'Valentina Cruz confirmó su cita para mañana.' },
  ] as any[];

  for (const nd of notifDefs) {
    await prisma.notification.create({
      data: {
        userId: nd.userId,
        tenantId: tenant.id,
        type: nd.type,
        channel: nd.channel,
        subject: nd.subject ?? null,
        message: nd.message,
        isRead: Math.random() > 0.6,
        createdAt: daysAgo(rand(0, 15)),
      },
    });
  }
  console.log(`✅ ${notifDefs.length} notificaciones`);

  // ── 13. Lista de espera ──────────────────────────────────────────────────────
  const waitlistDefs = [
    { patIdx: 4, proc: 'Examen periódico', priority: 2, duration: 30, notes: 'Disponible lunes o jueves' },
    { patIdx: 7, proc: 'Endodoncia #21',   priority: 1, duration: 90, notes: 'Urgente — dolor moderado' },
    { patIdx: 9, proc: 'Consulta prótesis',priority: 3, duration: 60, notes: 'Cualquier horario disponible' },
    { patIdx: 2, proc: 'Control blanqueamiento', priority: 3, duration: 30, notes: 'Preferencia tarde' },
  ] as const;

  for (const wd of waitlistDefs) {
    const pat = patList[wd.patIdx];
    if (!pat) continue;
    const existing = await prisma.waitlist.findFirst({ where: { patientId: pat.id, tenantId: tenant.id } });
    if (existing) continue;
    await prisma.waitlist.create({
      data: {
        patientId: pat.id,
        providerId: dentistUser.id,
        tenantId: tenant.id,
        procedureType: wd.proc,
        duration: wd.duration,
        priority: wd.priority,
        preferredDates: [daysFromNow(1), daysFromNow(3), daysFromNow(7)],
        preferredTimes: ['09:00', '14:00'],
        notes: wd.notes,
        status: WaitlistStatus.WAITING,
      },
    });
  }
  console.log(`✅ ${waitlistDefs.length} entradas en lista de espera`);

  // ── 14. Audit Logs ────────────────────────────────────────────────────────────
  const auditDefs = [
    { userId: dentistUser.id, action: AuditAction.CREATE, entity: 'Patient',       changes: { name: 'Ana Gómez', email: 'ana.gomez@mail.com' } },
    { userId: dentistUser.id, action: AuditAction.UPDATE, entity: 'TreatmentPlan', changes: { status: { from: 'PROPOSED', to: 'IN_PROGRESS' } } },
    { userId: staffUser.id,   action: AuditAction.CREATE, entity: 'Appointment',   changes: { patient: 'Miguel Torres', date: daysFromNow(5).toISOString() } },
    { userId: dentistUser.id, action: AuditAction.CREATE, entity: 'Invoice',       changes: { number: 'FAC-2025-0014', amount: 7200 } },
    { userId: dentistUser.id, action: AuditAction.UPDATE, entity: 'Appointment',   changes: { status: { from: 'SCHEDULED', to: 'COMPLETED' } } },
    { userId: dentistUser.id, action: AuditAction.CREATE, entity: 'Odontogram',    changes: { patient: 'Ana Gómez', teeth: 22 } },
    { userId: receptionista2.id, action: AuditAction.CREATE, entity: 'Appointment', changes: { patient: 'Valentina Cruz', status: 'CONFIRMED' } },
    { userId: staffUser.id,   action: AuditAction.UPDATE, entity: 'Patient',       changes: { phone: { from: '+58041556600', to: '+58041556677' } } },
    { userId: dentistUser.id, action: AuditAction.DELETE, entity: 'Document',      changes: { title: 'Rx provisional (borrador)' } },
    { userId: dentist4.id,    action: AuditAction.CREATE, entity: 'TreatmentPlanItem', changes: { description: 'Raspado cuadrante 2', cost: 2200 } },
  ] as const;

  for (const al of auditDefs) {
    await prisma.auditLog.create({
      data: {
        userId: al.userId,
        tenantId: tenant.id,
        action: al.action,
        entity: al.entity,
        entityId: null,
        changes: al.changes,
        createdAt: daysAgo(rand(0, 30)),
      },
    });
  }
  console.log(`✅ ${auditDefs.length} audit logs`);

  // ── 15. Citas recurrentes ────────────────────────────────────────────────────
  const existingRecurring = await prisma.recurringAppointment.findMany({ where: { tenantId: tenant.id } });
  if (existingRecurring.length === 0) {
    await prisma.recurringAppointment.createMany({
      data: [
        {
          patientId: patList[5].id,
          providerId: dentist4.id,
          tenantId: tenant.id,
          frequency: 'MONTHLY' as any,
          daysOfWeek: [2],
          timeOfDay: '10:00',
          duration: 90,
          procedureType: 'Mantenimiento periodontal mensual',
          startDate: daysAgo(180),
          endDate: daysFromNow(365),
          isActive: true,
        },
        {
          patientId: patList[4].id,
          providerId: dentistUser.id,
          tenantId: tenant.id,
          frequency: 'BIWEEKLY' as any,
          daysOfWeek: [4],
          timeOfDay: '14:00',
          duration: 45,
          procedureType: 'Control de brackets (Ortodoncia)',
          startDate: daysAgo(90),
          endDate: daysFromNow(300),
          isActive: true,
        },
      ],
    });
    console.log('✅ 2 citas recurrentes');
  }

  // ── 16. Chatbot config ────────────────────────────────────────────────────────
  const existingChatbot = await prisma.chatbotConfig.findFirst({ where: { tenantId: tenant.id } });
  if (!existingChatbot) {
    await prisma.chatbotConfig.create({
      data: {
        tenantId: tenant.id,
        isActive: true,
        welcomeMessage: '¡Hola! Soy el asistente virtual de Dr. Smith Dental Practice. ¿En qué puedo ayudarte hoy?',
        systemPrompt: 'Eres el asistente de una clínica dental. Ayudas a los pacientes con información general, programación de citas y dudas sobre procedimientos dentales. No das diagnósticos médicos. Siempre recomienda hablar con el Dr. Smith para evaluación profesional.',
        fallbackMessage: 'Lo siento, no entendí tu consulta. Por favor llama al consultorio o escribe en términos más sencillos.',
        maxSessionDuration: 60,
        collectContactInfo: true,
        appointmentBooking: true,
        faqEnabled: true,
        faqData: {
          preguntas: [
            { q: '¿Cuáles son los horarios?', a: 'Atendemos de Lunes a Viernes 8am-6pm y Sábados 8am-12pm.' },
            { q: '¿Qué seguros aceptan?', a: 'Trabajamos con Mercantil Seguros, Mapfre y La Venezolana de Seguros.' },
            { q: '¿Hacen emergencias?', a: 'Sí, tenemos horario de emergencias. Llama al +58041000000.' },
          ],
        },
      },
    });
    console.log('✅ Chatbot config creado');
  }

  // ── Resumen ───────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed dental completado!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 DATOS CREADOS (tenant: Dr. Smith Dental Practice)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Pacientes nuevos:       12');
  console.log('  Staff adicional:        3 (periodoncista + 2 asistentes)');
  console.log('  Servicios médicos:      17');
  console.log('  Inventario:             20 items + movimientos');
  console.log('  Seguros:                3 proveedores + 8 pólizas');
  console.log('  Citas:                  34 (20 pasadas + 3 canceladas + 11 futuras)');
  console.log('  Odontogramas:           5 (con 60+ dientes registrados)');
  console.log('  Planes tratamiento:     5 (con 24 ítems)');
  console.log('  Facturas:               19 (con ítems + pagos)');
  console.log('  Documentos:             12 (Rx + consentimientos)');
  console.log('  Notificaciones:         10');
  console.log('  Lista de espera:        4');
  console.log('  Audit logs:             10');
  console.log('  Citas recurrentes:      2');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📝 ACCESO:');
  console.log('  dentist@dentista.com   / Dentist123!');
  console.log('  staff@dentista.com     / Staff123!');
  console.log('  recep2@dentista.com    / Staff123!');
  console.log('  dentist4@dentista.com  / Dentist123!  (Periodoncista)');
  console.log('\n👤 PACIENTES (todos con Patient123!):');
  patientDefs.forEach(p => console.log(`  ${p.email.padEnd(30)} — ${p.name}`));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
