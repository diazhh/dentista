import {
  PrismaClient,
  AppointmentStatus,
  RecurrenceFrequency,
  WaitlistStatus,
  TreatmentPlanStatus,
  TreatmentItemStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  DocumentType,
  ToothCondition,
  ToothSurface,
  NotificationType,
  NotificationChannel,
  AuditAction,
  ChatSessionStatus,
  ChatMessageSender,
} from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🧪 Starting test data seed...\n');

  // Get existing entities created by main seed
  const dentistUser = await prisma.user.findUnique({ where: { email: 'dentist@dentista.com' } });
  const dentist2User = await prisma.user.findUnique({ where: { email: 'dentist2@dentista.com' } });
  const dentist3User = await prisma.user.findUnique({ where: { email: 'dentist3@dentista.com' } });
  const staffUser = await prisma.user.findUnique({ where: { email: 'staff@dentista.com' } });
  const patientUser = await prisma.user.findUnique({ where: { email: 'patient@dentista.com' } });
  const patient2User = await prisma.user.findUnique({ where: { email: 'patient2@dentista.com' } });

  const tenant = await prisma.tenant.findUnique({ where: { subdomain: 'drsmith' } });
  const tenant2 = await prisma.tenant.findUnique({ where: { subdomain: 'drgarcia' } });
  const tenant3 = await prisma.tenant.findUnique({ where: { subdomain: 'smilecare' } });

  const patient = await prisma.patient.findFirst({ where: { userId: patientUser?.id } });
  const patient2 = await prisma.patient.findFirst({ where: { userId: patient2User?.id } });
  const operatory = await prisma.operatory.findFirst();

  if (!dentistUser || !tenant || !patient || !operatory) {
    console.error('❌ Missing required entities. Run main seed first.');
    process.exit(1);
  }

  // ==========================================
  // Create Additional Patients (without user accounts)
  // ==========================================
  console.log('👥 Creating additional patients...');

  const additionalPatients = await Promise.all([
    prisma.patient.upsert({
      where: { documentId: '003-1111111-1' },
      update: {},
      create: {
        documentId: '003-1111111-1',
        firstName: 'Maria',
        lastName: 'Rodriguez',
        dateOfBirth: new Date('1988-03-12'),
        gender: 'FEMALE',
        phone: '+1-555-0201',
        allergies: ['Lidocaine'],
        medications: ['Metformin'],
        medicalHistory: { conditions: ['Diabetes Type 2'], surgeries: [] },
        portalEnabled: false,
        emergencyContactName: 'Carlos Rodriguez',
        emergencyContactPhone: '+1-555-0202',
      },
    }),
    prisma.patient.upsert({
      where: { documentId: '004-2222222-2' },
      update: {},
      create: {
        documentId: '004-2222222-2',
        firstName: 'Carlos',
        lastName: 'Martinez',
        dateOfBirth: new Date('1975-07-22'),
        gender: 'MALE',
        phone: '+1-555-0203',
        allergies: [],
        medications: ['Lisinopril', 'Aspirin'],
        medicalHistory: { conditions: ['Hypertension', 'Heart Disease'], surgeries: ['Bypass 2018'] },
        portalEnabled: false,
        emergencyContactName: 'Ana Martinez',
        emergencyContactPhone: '+1-555-0204',
      },
    }),
    prisma.patient.upsert({
      where: { documentId: '005-3333333-3' },
      update: {},
      create: {
        documentId: '005-3333333-3',
        firstName: 'Sofia',
        lastName: 'Hernandez',
        dateOfBirth: new Date('2015-01-10'),
        gender: 'FEMALE',
        phone: '+1-555-0205',
        allergies: ['Penicillin', 'Latex'],
        medications: [],
        medicalHistory: { conditions: [], surgeries: [] },
        portalEnabled: false,
        emergencyContactName: 'Laura Hernandez',
        emergencyContactPhone: '+1-555-0206',
      },
    }),
    prisma.patient.upsert({
      where: { documentId: '006-4444444-4' },
      update: {},
      create: {
        documentId: '006-4444444-4',
        firstName: 'Roberto',
        lastName: 'Garcia',
        dateOfBirth: new Date('1965-11-30'),
        gender: 'MALE',
        phone: '+1-555-0207',
        allergies: [],
        medications: ['Warfarin'],
        medicalHistory: { conditions: ['Blood clotting disorder'], surgeries: ['Hip replacement 2020'] },
        portalEnabled: false,
        emergencyContactName: 'Carmen Garcia',
        emergencyContactPhone: '+1-555-0208',
      },
    }),
    prisma.patient.upsert({
      where: { documentId: '007-5555555-5' },
      update: {},
      create: {
        documentId: '007-5555555-5',
        firstName: 'Elena',
        lastName: 'Torres',
        dateOfBirth: new Date('1992-09-05'),
        gender: 'FEMALE',
        phone: '+1-555-0209',
        allergies: [],
        medications: [],
        medicalHistory: { conditions: [], surgeries: [] },
        portalEnabled: true,
        emergencyContactName: 'Miguel Torres',
        emergencyContactPhone: '+1-555-0210',
      },
    }),
  ]);
  console.log(`✅ Created ${additionalPatients.length} additional patients`);

  // Create patient-dentist relations for new patients
  for (const p of additionalPatients) {
    await prisma.patientDentistRelation.upsert({
      where: { patientId_dentistId: { patientId: p.id, dentistId: dentistUser.id } },
      update: {},
      create: {
        patientId: p.id,
        dentistId: dentistUser.id,
        tenantId: tenant.id,
        isActive: true,
        notes: 'Added as test patient',
      },
    });
  }
  console.log('✅ Created patient-dentist relations');

  // ==========================================
  // Create Appointments
  // ==========================================
  console.log('\n📅 Creating appointments...');

  const now = new Date();
  const appointments = [];

  // Past appointments (completed, cancelled, no-show)
  const pastDates = [
    new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),  // 7 days ago
    new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),  // 3 days ago
  ];

  const procedureTypes = [
    'Limpieza dental',
    'Extracción',
    'Endodoncia',
    'Blanqueamiento',
    'Revisión general',
    'Ortodoncia - Ajuste',
    'Corona dental',
    'Implante dental',
    'Relleno de caries',
    'Radiografía panorámica',
  ];

  // Completed appointments
  for (let i = 0; i < pastDates.length; i++) {
    const apptDate = pastDates[i];
    apptDate.setHours(9 + i, 0, 0, 0);

    appointments.push(
      await prisma.appointment.create({
        data: {
          patientId: patient!.id,
          dentistId: dentistUser.id,
          tenantId: tenant.id,
          operatoryId: operatory.id,
          appointmentDate: apptDate,
          duration: 30 + (i * 15),
          status: AppointmentStatus.COMPLETED,
          procedureType: procedureTypes[i % procedureTypes.length],
          notes: `Completed appointment #${i + 1}`,
          reminderSent: true,
          confirmedVia: 'WHATSAPP',
        },
      })
    );
  }

  // Cancelled appointment
  const cancelledDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  cancelledDate.setHours(14, 0, 0, 0);
  appointments.push(
    await prisma.appointment.create({
      data: {
        patientId: additionalPatients[0].id,
        dentistId: dentistUser.id,
        tenantId: tenant.id,
        operatoryId: operatory.id,
        appointmentDate: cancelledDate,
        duration: 45,
        status: AppointmentStatus.CANCELLED,
        procedureType: 'Corona dental',
        notes: 'Patient cancelled due to illness',
        reminderSent: true,
      },
    })
  );

  // No-show appointment
  const noShowDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  noShowDate.setHours(11, 0, 0, 0);
  appointments.push(
    await prisma.appointment.create({
      data: {
        patientId: additionalPatients[1].id,
        dentistId: dentistUser.id,
        tenantId: tenant.id,
        operatoryId: operatory.id,
        appointmentDate: noShowDate,
        duration: 30,
        status: AppointmentStatus.NO_SHOW,
        procedureType: 'Revisión general',
        notes: 'Patient did not show up, no prior notice',
        reminderSent: true,
      },
    })
  );

  // Future appointments (scheduled)
  const futureDates = [
    new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),  // Tomorrow
    new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),  // 3 days
    new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),  // 1 week
    new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
    new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 1 month
  ];

  for (let i = 0; i < futureDates.length; i++) {
    const apptDate = futureDates[i];
    apptDate.setHours(10 + i, 30, 0, 0);

    appointments.push(
      await prisma.appointment.create({
        data: {
          patientId: [patient!.id, patient2!.id, ...additionalPatients.map(p => p.id)][i % 7],
          dentistId: dentistUser.id,
          tenantId: tenant.id,
          operatoryId: operatory.id,
          appointmentDate: apptDate,
          duration: 30 + (i * 15),
          status: AppointmentStatus.SCHEDULED,
          procedureType: procedureTypes[(i + 5) % procedureTypes.length],
          notes: `Upcoming appointment #${i + 1}`,
          reminderSent: i < 2, // Only first 2 have reminders sent
          confirmedVia: i === 0 ? 'EMAIL' : null,
        },
      })
    );
  }
  console.log(`✅ Created ${appointments.length} appointments`);

  // ==========================================
  // Create Recurring Appointments
  // ==========================================
  console.log('\n🔄 Creating recurring appointments...');

  const recurring1 = await prisma.recurringAppointment.create({
    data: {
      patientId: patient!.id,
      dentistId: dentistUser.id,
      tenantId: tenant.id,
      operatoryId: operatory.id,
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      duration: 30,
      procedureType: 'Limpieza dental',
      notes: 'Monthly cleaning - Jane Doe',
      timeOfDay: '09:00',
      daysOfWeek: [1], // Monday
      isActive: true,
    },
  });

  const recurring2 = await prisma.recurringAppointment.create({
    data: {
      patientId: additionalPatients[2].id, // Sofia (child)
      dentistId: dentistUser.id,
      tenantId: tenant.id,
      frequency: RecurrenceFrequency.QUARTERLY,
      interval: 1,
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      duration: 45,
      procedureType: 'Ortodoncia - Ajuste',
      notes: 'Quarterly orthodontic adjustment',
      timeOfDay: '15:00',
      daysOfWeek: [3], // Wednesday
      isActive: true,
    },
  });
  console.log('✅ Created 2 recurring appointments');

  // ==========================================
  // Create Waitlist Entries
  // ==========================================
  console.log('\n⏳ Creating waitlist entries...');

  const waitlistEntries = await Promise.all([
    prisma.waitlist.create({
      data: {
        patientId: additionalPatients[0].id,
        dentistId: dentistUser.id,
        tenantId: tenant.id,
        preferredDates: [
          new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
          new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        ],
        preferredTimes: ['morning', 'afternoon'],
        procedureType: 'Extracción de muela del juicio',
        duration: 60,
        priority: 2,
        status: WaitlistStatus.WAITING,
        notes: 'Urgent - patient in pain',
        expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.waitlist.create({
      data: {
        patientId: additionalPatients[3].id,
        dentistId: dentistUser.id,
        tenantId: tenant.id,
        preferredDates: [
          new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        ],
        preferredTimes: ['morning'],
        procedureType: 'Implante dental',
        duration: 90,
        priority: 1,
        status: WaitlistStatus.CONTACTED,
        notes: 'Waiting for insurance approval',
        contactedAt: new Date(),
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.waitlist.create({
      data: {
        patientId: additionalPatients[4].id,
        dentistId: dentistUser.id,
        tenantId: tenant.id,
        preferredDates: [
          new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        ],
        preferredTimes: ['evening'],
        procedureType: 'Blanqueamiento',
        duration: 60,
        priority: 3,
        status: WaitlistStatus.SCHEDULED,
        notes: 'Scheduled for this week',
        scheduledAppointmentId: appointments[appointments.length - 1].id,
      },
    }),
  ]);
  console.log(`✅ Created ${waitlistEntries.length} waitlist entries`);

  // ==========================================
  // Create Treatment Plans
  // ==========================================
  console.log('\n📋 Creating treatment plans...');

  const treatmentPlan1 = await prisma.treatmentPlan.create({
    data: {
      patientId: patient!.id,
      dentistId: dentistUser.id,
      tenantId: tenant.id,
      title: 'Plan de Tratamiento Integral - Jane Doe',
      description: 'Tratamiento completo incluyendo limpieza, rellenos y corona',
      diagnosis: 'Caries en molares superiores, necesidad de corona en premolar',
      status: TreatmentPlanStatus.IN_PROGRESS,
      totalCost: 2500.00,
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      notes: 'Paciente con buena higiene oral, colaborador',
      items: {
        create: [
          {
            tooth: '16',
            surface: 'oclusal',
            procedureCode: 'D1110',
            procedureName: 'Limpieza profiláctica',
            description: 'Limpieza dental completa',
            status: TreatmentItemStatus.COMPLETED,
            estimatedCost: 150.00,
            actualCost: 150.00,
            priority: 1,
            estimatedDuration: 30,
          },
          {
            tooth: '26',
            surface: 'mesial-oclusal',
            procedureCode: 'D2391',
            procedureName: 'Relleno de composite',
            description: 'Relleno de resina compuesta en molar',
            status: TreatmentItemStatus.COMPLETED,
            estimatedCost: 350.00,
            actualCost: 350.00,
            priority: 2,
            estimatedDuration: 45,
          },
          {
            tooth: '14',
            surface: 'full',
            procedureCode: 'D2740',
            procedureName: 'Corona de porcelana',
            description: 'Corona de porcelana fusionada a metal',
            status: TreatmentItemStatus.IN_PROGRESS,
            estimatedCost: 1200.00,
            priority: 3,
            estimatedDuration: 90,
          },
          {
            tooth: '36',
            surface: 'distal',
            procedureCode: 'D2391',
            procedureName: 'Relleno de composite',
            description: 'Relleno preventivo',
            status: TreatmentItemStatus.PENDING,
            estimatedCost: 300.00,
            priority: 4,
            estimatedDuration: 40,
          },
          {
            tooth: '46',
            surface: 'oclusal',
            procedureCode: 'D2391',
            procedureName: 'Relleno de composite',
            description: 'Relleno preventivo',
            status: TreatmentItemStatus.PENDING,
            estimatedCost: 300.00,
            priority: 5,
            estimatedDuration: 40,
          },
        ],
      },
    },
  });

  const treatmentPlan2 = await prisma.treatmentPlan.create({
    data: {
      patientId: additionalPatients[1].id, // Carlos Martinez
      dentistId: dentistUser.id,
      tenantId: tenant.id,
      title: 'Rehabilitación Oral Completa',
      description: 'Plan de rehabilitación para paciente con enfermedad periodontal',
      diagnosis: 'Enfermedad periodontal moderada, pérdida ósea en sector posterior',
      status: TreatmentPlanStatus.PROPOSED,
      totalCost: 8500.00,
      notes: 'Paciente con antecedentes cardíacos, precaución con anestesia',
      items: {
        create: [
          {
            procedureCode: 'D4341',
            procedureName: 'Raspado y alisado radicular',
            description: 'Tratamiento periodontal profundo - cuadrante superior derecho',
            status: TreatmentItemStatus.PENDING,
            estimatedCost: 800.00,
            priority: 1,
            estimatedDuration: 60,
          },
          {
            procedureCode: 'D4341',
            procedureName: 'Raspado y alisado radicular',
            description: 'Tratamiento periodontal profundo - cuadrante superior izquierdo',
            status: TreatmentItemStatus.PENDING,
            estimatedCost: 800.00,
            priority: 2,
            estimatedDuration: 60,
          },
          {
            tooth: '47',
            procedureCode: 'D7210',
            procedureName: 'Extracción quirúrgica',
            description: 'Extracción de molar con movilidad grado 3',
            status: TreatmentItemStatus.PENDING,
            estimatedCost: 450.00,
            priority: 3,
            estimatedDuration: 45,
          },
          {
            tooth: '47',
            procedureCode: 'D6010',
            procedureName: 'Implante dental',
            description: 'Colocación de implante osteointegrado',
            status: TreatmentItemStatus.PENDING,
            estimatedCost: 3500.00,
            priority: 4,
            estimatedDuration: 90,
          },
          {
            tooth: '47',
            procedureCode: 'D6058',
            procedureName: 'Corona sobre implante',
            description: 'Corona de porcelana sobre implante',
            status: TreatmentItemStatus.PENDING,
            estimatedCost: 1500.00,
            priority: 5,
            estimatedDuration: 60,
          },
        ],
      },
    },
  });

  const treatmentPlan3 = await prisma.treatmentPlan.create({
    data: {
      patientId: additionalPatients[2].id, // Sofia (child)
      dentistId: dentistUser.id,
      tenantId: tenant.id,
      title: 'Tratamiento Ortodóncico - Fase 1',
      description: 'Ortodoncia interceptiva para corrección de mordida cruzada',
      diagnosis: 'Mordida cruzada anterior, apiñamiento moderado',
      status: TreatmentPlanStatus.ACCEPTED,
      totalCost: 3200.00,
      startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      notes: 'Paciente pediátrico, padres muy colaboradores',
      items: {
        create: [
          {
            procedureCode: 'D8080',
            procedureName: 'Aparatología ortodóncica',
            description: 'Instalación de brackets metálicos',
            status: TreatmentItemStatus.COMPLETED,
            estimatedCost: 1500.00,
            actualCost: 1500.00,
            priority: 1,
            estimatedDuration: 90,
          },
          {
            procedureCode: 'D8670',
            procedureName: 'Ajuste ortodóncico',
            description: 'Ajustes mensuales (12 sesiones)',
            status: TreatmentItemStatus.IN_PROGRESS,
            estimatedCost: 1200.00,
            priority: 2,
            estimatedDuration: 30,
          },
          {
            procedureCode: 'D8680',
            procedureName: 'Retención ortodóncica',
            description: 'Retenedores fijos y removibles',
            status: TreatmentItemStatus.PENDING,
            estimatedCost: 500.00,
            priority: 3,
            estimatedDuration: 45,
          },
        ],
      },
    },
  });
  console.log('✅ Created 3 treatment plans with items');

  // ==========================================
  // Create Invoices and Payments
  // ==========================================
  console.log('\n💰 Creating invoices and payments...');

  // Invoice for completed treatment
  const invoice1 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-0001' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-0001',
      patientId: patient!.id,
      dentistId: dentistUser.id,
      tenantId: tenant.id,
      treatmentPlanId: treatmentPlan1.id,
      issueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      status: InvoiceStatus.PAID,
      subtotal: 500.00,
      tax: 40.00,
      discount: 50.00,
      total: 490.00,
      amountPaid: 490.00,
      balance: 0,
      notes: 'Paid in full - Thank you!',
      items: {
        create: [
          {
            description: 'Limpieza profiláctica',
            quantity: 1,
            unitPrice: 150.00,
            total: 150.00,
          },
          {
            description: 'Relleno de composite - Molar 26',
            quantity: 1,
            unitPrice: 350.00,
            total: 350.00,
          },
        ],
      },
    },
  });

  // Payment for invoice 1
  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      patientId: patient!.id,
      tenantId: tenant.id,
      amount: 490.00,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentDate: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
      status: PaymentStatus.COMPLETED,
      transactionId: 'ch_test_123456789',
      notes: 'Payment via credit card',
    },
  });

  // Invoice partially paid
  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0002',
      patientId: patient!.id,
      dentistId: dentistUser.id,
      tenantId: tenant.id,
      treatmentPlanId: treatmentPlan1.id,
      issueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      status: InvoiceStatus.SENT,
      subtotal: 1200.00,
      tax: 96.00,
      discount: 0,
      total: 1296.00,
      amountPaid: 500.00,
      balance: 796.00,
      notes: 'Corona dental - Partial payment received',
      items: {
        create: [
          {
            description: 'Corona de porcelana - Premolar 14',
            quantity: 1,
            unitPrice: 1200.00,
            total: 1200.00,
          },
        ],
      },
    },
  });

  // Partial payment for invoice 2
  await prisma.payment.create({
    data: {
      invoiceId: invoice2.id,
      patientId: patient!.id,
      tenantId: tenant.id,
      amount: 500.00,
      paymentMethod: PaymentMethod.CASH,
      paymentDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      status: PaymentStatus.COMPLETED,
      notes: 'Initial deposit',
    },
  });

  // Overdue invoice
  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0003',
      patientId: additionalPatients[0].id,
      dentistId: dentistUser.id,
      tenantId: tenant.id,
      issueDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      status: InvoiceStatus.OVERDUE,
      subtotal: 750.00,
      tax: 60.00,
      discount: 0,
      total: 810.00,
      amountPaid: 0,
      balance: 810.00,
      notes: 'OVERDUE - Patient contacted, payment plan discussed',
      items: {
        create: [
          {
            description: 'Endodoncia - Molar',
            quantity: 1,
            unitPrice: 750.00,
            total: 750.00,
          },
        ],
      },
    },
  });

  // Draft invoice
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0004',
      patientId: additionalPatients[2].id,
      dentistId: dentistUser.id,
      tenantId: tenant.id,
      treatmentPlanId: treatmentPlan3.id,
      issueDate: now,
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: InvoiceStatus.DRAFT,
      subtotal: 1500.00,
      tax: 120.00,
      discount: 150.00,
      total: 1470.00,
      amountPaid: 0,
      balance: 1470.00,
      notes: 'Draft - Orthodontic treatment installation',
      items: {
        create: [
          {
            description: 'Instalación de brackets metálicos',
            quantity: 1,
            unitPrice: 1500.00,
            total: 1500.00,
          },
        ],
      },
    },
  });
  console.log('✅ Created 4 invoices with payments');

  // ==========================================
  // Create Documents
  // ==========================================
  console.log('\n📄 Creating documents...');

  const documents = await Promise.all([
    prisma.document.create({
      data: {
        patientId: patient!.id,
        dentistId: dentistUser.id,
        tenantId: tenant.id,
        type: DocumentType.XRAY,
        title: 'Radiografía Panorámica',
        description: 'Radiografía panorámica inicial',
        filePath: '/uploads/patients/jane-doe/xrays/panoramic-2026-01.jpg',
        fileName: 'panoramic-2026-01.jpg',
        fileSize: 2500000,
        mimeType: 'image/jpeg',
        uploadedBy: dentistUser.id,
        tags: ['panoramic', 'initial', '2026'],
      },
    }),
    prisma.document.create({
      data: {
        patientId: patient!.id,
        dentistId: dentistUser.id,
        tenantId: tenant.id,
        type: DocumentType.XRAY,
        title: 'Radiografía Periapical - Molar 16',
        description: 'Radiografía periapical para evaluación de caries',
        filePath: '/uploads/patients/jane-doe/xrays/periapical-16-2026-01.jpg',
        fileName: 'periapical-16-2026-01.jpg',
        fileSize: 850000,
        mimeType: 'image/jpeg',
        uploadedBy: dentistUser.id,
        tags: ['periapical', 'molar-16', '2026'],
      },
    }),
    prisma.document.create({
      data: {
        patientId: patient!.id,
        dentistId: dentistUser.id,
        tenantId: tenant.id,
        type: DocumentType.PHOTO,
        title: 'Fotos Intraorales - Pre-tratamiento',
        description: 'Fotografías intraorales antes del tratamiento',
        filePath: '/uploads/patients/jane-doe/photos/intraoral-pre-2026-01.zip',
        fileName: 'intraoral-pre-2026-01.zip',
        fileSize: 15000000,
        mimeType: 'application/zip',
        uploadedBy: dentistUser.id,
        tags: ['intraoral', 'pre-treatment', '2026'],
      },
    }),
    prisma.document.create({
      data: {
        patientId: patient!.id,
        dentistId: dentistUser.id,
        tenantId: tenant.id,
        type: DocumentType.CONSENT_FORM,
        title: 'Consentimiento Informado - Corona',
        description: 'Formulario de consentimiento firmado para procedimiento de corona',
        filePath: '/uploads/patients/jane-doe/consents/consent-crown-2026-01.pdf',
        fileName: 'consent-crown-2026-01.pdf',
        fileSize: 250000,
        mimeType: 'application/pdf',
        uploadedBy: staffUser!.id,
        tags: ['consent', 'crown', '2026'],
      },
    }),
    prisma.document.create({
      data: {
        patientId: additionalPatients[1].id,
        dentistId: dentistUser.id,
        tenantId: tenant.id,
        type: DocumentType.MEDICAL_RECORD,
        title: 'Historia Clínica Cardiológica',
        description: 'Certificado médico del cardiólogo',
        filePath: '/uploads/patients/carlos-martinez/records/cardio-clearance-2026.pdf',
        fileName: 'cardio-clearance-2026.pdf',
        fileSize: 180000,
        mimeType: 'application/pdf',
        uploadedBy: dentistUser.id,
        tags: ['medical-clearance', 'cardiology', '2026'],
      },
    }),
  ]);
  console.log(`✅ Created ${documents.length} documents`);

  // ==========================================
  // Create Odontograms
  // ==========================================
  console.log('\n🦷 Creating odontograms...');

  const odontogram1 = await prisma.odontogram.create({
    data: {
      patientId: patient!.id,
      dentistId: dentistUser.id,
      tenantId: tenant.id,
      date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      notes: 'Evaluación inicial - múltiples caries detectadas',
      teeth: {
        create: [
          { toothNumber: 16, condition: ToothCondition.CAVITY, surfaces: [ToothSurface.OCCLUSAL], notes: 'Caries profunda', color: '#FF6B6B' },
          { toothNumber: 26, condition: ToothCondition.FILLED, surfaces: [ToothSurface.MESIAL, ToothSurface.OCCLUSAL], notes: 'Relleno realizado', color: '#4ECDC4' },
          { toothNumber: 14, condition: ToothCondition.CROWN, surfaces: [], notes: 'Corona en proceso', color: '#45B7D1' },
          { toothNumber: 36, condition: ToothCondition.CAVITY, surfaces: [ToothSurface.DISTAL], notes: 'Caries incipiente', color: '#FFA07A' },
          { toothNumber: 46, condition: ToothCondition.CAVITY, surfaces: [ToothSurface.OCCLUSAL], notes: 'Caries incipiente', color: '#FFA07A' },
          { toothNumber: 18, condition: ToothCondition.MISSING, surfaces: [], notes: 'Extraído previamente' },
          { toothNumber: 28, condition: ToothCondition.MISSING, surfaces: [], notes: 'Extraído previamente' },
          { toothNumber: 38, condition: ToothCondition.EXTRACTION_NEEDED, surfaces: [], notes: 'Impactado, recomendar extracción', color: '#FF4444' },
          { toothNumber: 48, condition: ToothCondition.EXTRACTION_NEEDED, surfaces: [], notes: 'Impactado, recomendar extracción', color: '#FF4444' },
          { toothNumber: 11, condition: ToothCondition.HEALTHY, surfaces: [], color: '#90EE90' },
          { toothNumber: 21, condition: ToothCondition.HEALTHY, surfaces: [], color: '#90EE90' },
          { toothNumber: 12, condition: ToothCondition.HEALTHY, surfaces: [], color: '#90EE90' },
          { toothNumber: 22, condition: ToothCondition.HEALTHY, surfaces: [], color: '#90EE90' },
        ],
      },
    },
  });

  const odontogram2 = await prisma.odontogram.create({
    data: {
      patientId: additionalPatients[1].id, // Carlos Martinez
      dentistId: dentistUser.id,
      tenantId: tenant.id,
      date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      notes: 'Evaluación periodontal completa',
      teeth: {
        create: [
          { toothNumber: 47, condition: ToothCondition.EXTRACTION_NEEDED, surfaces: [], notes: 'Movilidad grado 3, pérdida ósea severa', color: '#FF4444' },
          { toothNumber: 37, condition: ToothCondition.ROOT_CANAL, surfaces: [], notes: 'Endodoncia realizada hace 5 años', color: '#9370DB' },
          { toothNumber: 16, condition: ToothCondition.CROWN, surfaces: [], notes: 'Corona antigua, revisar', color: '#45B7D1' },
          { toothNumber: 26, condition: ToothCondition.BRIDGE, surfaces: [], notes: 'Puente 24-26', color: '#45B7D1' },
          { toothNumber: 24, condition: ToothCondition.BRIDGE, surfaces: [], notes: 'Pilar de puente', color: '#45B7D1' },
          { toothNumber: 25, condition: ToothCondition.MISSING, surfaces: [], notes: 'Póntico' },
          { toothNumber: 36, condition: ToothCondition.WORN, surfaces: [ToothSurface.OCCLUSAL], notes: 'Desgaste por bruxismo', color: '#FFD700' },
          { toothNumber: 46, condition: ToothCondition.WORN, surfaces: [ToothSurface.OCCLUSAL], notes: 'Desgaste por bruxismo', color: '#FFD700' },
        ],
      },
    },
  });

  // Child odontogram (deciduous teeth)
  const odontogram3 = await prisma.odontogram.create({
    data: {
      patientId: additionalPatients[2].id, // Sofia (child)
      dentistId: dentistUser.id,
      tenantId: tenant.id,
      date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      notes: 'Evaluación ortodóncica - dentición mixta',
      teeth: {
        create: [
          { toothNumber: 55, condition: ToothCondition.HEALTHY, surfaces: [], notes: 'Diente temporal', color: '#90EE90' },
          { toothNumber: 54, condition: ToothCondition.CAVITY, surfaces: [ToothSurface.OCCLUSAL], notes: 'Caries en diente temporal', color: '#FFA07A' },
          { toothNumber: 65, condition: ToothCondition.HEALTHY, surfaces: [], color: '#90EE90' },
          { toothNumber: 11, condition: ToothCondition.HEALTHY, surfaces: [], notes: 'Diente permanente erupcionado', color: '#90EE90' },
          { toothNumber: 21, condition: ToothCondition.HEALTHY, surfaces: [], notes: 'Diente permanente erupcionado', color: '#90EE90' },
          { toothNumber: 16, condition: ToothCondition.HEALTHY, surfaces: [], notes: 'Primer molar permanente', color: '#90EE90' },
          { toothNumber: 26, condition: ToothCondition.HEALTHY, surfaces: [], notes: 'Primer molar permanente', color: '#90EE90' },
          { toothNumber: 36, condition: ToothCondition.HEALTHY, surfaces: [], notes: 'Primer molar permanente', color: '#90EE90' },
          { toothNumber: 46, condition: ToothCondition.HEALTHY, surfaces: [], notes: 'Primer molar permanente', color: '#90EE90' },
        ],
      },
    },
  });
  console.log('✅ Created 3 odontograms with teeth data');

  // ==========================================
  // Create Notifications
  // ==========================================
  console.log('\n🔔 Creating notifications...');

  const notifications = await Promise.all([
    // Appointment reminder
    prisma.notification.create({
      data: {
        userId: patientUser!.id,
        tenantId: tenant.id,
        type: NotificationType.WHATSAPP,
        channel: NotificationChannel.APPOINTMENT_REMINDER,
        subject: 'Recordatorio de cita',
        message: 'Hola Jane, le recordamos su cita mañana a las 10:30 AM con Dr. Smith.',
        metadata: { appointmentId: appointments[appointments.length - 1].id },
        sent: true,
        sentAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        scheduledFor: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
    }),
    // Appointment confirmation
    prisma.notification.create({
      data: {
        userId: patientUser!.id,
        tenantId: tenant.id,
        type: NotificationType.EMAIL,
        channel: NotificationChannel.APPOINTMENT_CONFIRMATION,
        subject: 'Cita confirmada',
        message: 'Su cita ha sido confirmada para el próximo lunes a las 9:00 AM.',
        sent: true,
        sentAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    // Payment reminder (pending)
    prisma.notification.create({
      data: {
        userId: patientUser!.id,
        tenantId: tenant.id,
        type: NotificationType.EMAIL,
        channel: NotificationChannel.PAYMENT_REMINDER,
        subject: 'Recordatorio de pago',
        message: 'Tiene un saldo pendiente de $796.00. Por favor realice el pago antes del vencimiento.',
        metadata: { invoiceId: invoice2.id, amount: 796.00 },
        sent: false,
        scheduledFor: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      },
    }),
    // Waitlist update
    prisma.notification.create({
      data: {
        userId: additionalPatients[0].id,
        tenantId: tenant.id,
        type: NotificationType.SMS,
        channel: NotificationChannel.WAITLIST_UPDATE,
        subject: 'Disponibilidad de cita',
        message: 'Se ha liberado un espacio para mañana a las 2:00 PM. Responda SI para confirmar.',
        metadata: { waitlistId: waitlistEntries[0].id },
        sent: true,
        sentAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    // Failed notification
    prisma.notification.create({
      data: {
        userId: additionalPatients[3].id,
        tenantId: tenant.id,
        type: NotificationType.SMS,
        channel: NotificationChannel.APPOINTMENT_REMINDER,
        subject: 'Recordatorio de cita',
        message: 'Recordatorio: Tiene una cita programada para mañana.',
        sent: false,
        failed: true,
        failureReason: 'Invalid phone number format',
        scheduledFor: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log(`✅ Created ${notifications.length} notifications`);

  // ==========================================
  // Create Notification Preferences
  // ==========================================
  console.log('\n⚙️ Creating notification preferences...');

  await Promise.all([
    prisma.notificationPreference.upsert({
      where: { userId_tenantId: { userId: patientUser!.id, tenantId: tenant.id } },
      update: {},
      create: {
        userId: patientUser!.id,
        tenantId: tenant.id,
        emailEnabled: true,
        smsEnabled: false,
        whatsappEnabled: true,
        pushEnabled: true,
        appointmentReminders: true,
        appointmentConfirmation: true,
        waitlistUpdates: true,
        paymentReminders: true,
        marketingEmails: false,
        reminderHoursBefore: [24, 2],
      },
    }),
    prisma.notificationPreference.upsert({
      where: { userId_tenantId: { userId: patient2User!.id, tenantId: tenant.id } },
      update: {},
      create: {
        userId: patient2User!.id,
        tenantId: tenant.id,
        emailEnabled: true,
        smsEnabled: true,
        whatsappEnabled: false,
        pushEnabled: false,
        appointmentReminders: true,
        appointmentConfirmation: true,
        waitlistUpdates: false,
        paymentReminders: true,
        marketingEmails: true,
        reminderHoursBefore: [48, 24],
      },
    }),
  ]);
  console.log('✅ Created notification preferences');

  // ==========================================
  // Create Audit Logs
  // ==========================================
  console.log('\n📝 Creating audit logs...');

  const auditLogs = await Promise.all([
    prisma.auditLog.create({
      data: {
        userId: dentistUser.id,
        tenantId: tenant.id,
        action: AuditAction.CREATE,
        entity: 'Appointment',
        entityId: appointments[0].id,
        changes: { new: { status: 'SCHEDULED', procedureType: 'Limpieza dental' } },
        metadata: { source: 'web-app' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: dentistUser.id,
        tenantId: tenant.id,
        action: AuditAction.UPDATE,
        entity: 'Appointment',
        entityId: appointments[0].id,
        changes: { before: { status: 'SCHEDULED' }, after: { status: 'COMPLETED' } },
        ipAddress: '192.168.1.100',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: staffUser!.id,
        tenantId: tenant.id,
        action: AuditAction.LOGIN,
        entity: 'User',
        entityId: staffUser!.id,
        metadata: { loginMethod: 'password' },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: dentistUser.id,
        tenantId: tenant.id,
        action: AuditAction.CREATE,
        entity: 'TreatmentPlan',
        entityId: treatmentPlan1.id,
        changes: { new: { title: treatmentPlan1.title, totalCost: 2500 } },
        ipAddress: '192.168.1.100',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: dentistUser.id,
        tenantId: tenant.id,
        action: AuditAction.EXPORT,
        entity: 'Invoice',
        entityId: invoice1.id,
        metadata: { format: 'PDF', destination: 'email' },
        ipAddress: '192.168.1.100',
      },
    }),
  ]);
  console.log(`✅ Created ${auditLogs.length} audit logs`);

  // ==========================================
  // Create Chat Sessions and Messages (WhatsApp Bot)
  // ==========================================
  console.log('\n💬 Creating chat sessions and messages...');

  const chatSession1 = await prisma.chatSession.create({
    data: {
      tenantId: tenant.id,
      patientId: patient!.id,
      patientPhone: '+1-555-0123',
      patientName: 'Jane Doe',
      status: ChatSessionStatus.CLOSED,
      context: { lastFlow: 'schedule_appointment', completed: true },
      lastIntent: 'SCHEDULE_APPOINTMENT',
      closedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      messages: {
        create: [
          {
            sender: ChatMessageSender.PATIENT,
            message: 'Hola, quiero agendar una cita',
            intent: 'GREETING',
            confidence: 0.95,
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000),
          },
          {
            sender: ChatMessageSender.BOT,
            message: '¡Hola Jane! Bienvenida a Dr. Smith Dental Practice. ¿En qué puedo ayudarte hoy?\n\n1. Agendar cita\n2. Cancelar cita\n3. Consultar horarios\n4. Hablar con recepción',
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 29 * 60 * 1000),
          },
          {
            sender: ChatMessageSender.PATIENT,
            message: '1',
            intent: 'SCHEDULE_APPOINTMENT',
            confidence: 0.98,
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 28 * 60 * 1000),
          },
          {
            sender: ChatMessageSender.BOT,
            message: '¡Perfecto! ¿Qué tipo de servicio necesitas?\n\n1. Limpieza dental\n2. Revisión general\n3. Emergencia\n4. Otro',
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 27 * 60 * 1000),
          },
          {
            sender: ChatMessageSender.PATIENT,
            message: 'Limpieza',
            intent: 'SELECT_SERVICE',
            confidence: 0.92,
            metadata: { selectedService: 'cleaning' },
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 26 * 60 * 1000),
          },
          {
            sender: ChatMessageSender.BOT,
            message: 'Estos son los horarios disponibles para limpieza dental:\n\n📅 Lunes 3 Feb - 10:30 AM\n📅 Martes 4 Feb - 2:00 PM\n📅 Jueves 6 Feb - 9:00 AM\n\n¿Cuál prefieres?',
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 25 * 60 * 1000),
          },
          {
            sender: ChatMessageSender.PATIENT,
            message: 'El lunes está bien',
            intent: 'CONFIRM_APPOINTMENT',
            confidence: 0.88,
            metadata: { selectedDate: '2026-02-03', selectedTime: '10:30' },
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 24 * 60 * 1000),
          },
          {
            sender: ChatMessageSender.BOT,
            message: '✅ ¡Cita confirmada!\n\n📅 Fecha: Lunes 3 de Febrero, 2026\n⏰ Hora: 10:30 AM\n🏥 Servicio: Limpieza dental\n👨‍⚕️ Doctor: Dr. John Smith\n\nTe enviaremos un recordatorio 24 horas antes. ¡Gracias por confiar en nosotros!',
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 23 * 60 * 1000),
          },
        ],
      },
    },
  });

  const chatSession2 = await prisma.chatSession.create({
    data: {
      tenantId: tenant.id,
      patientPhone: '+1-555-9999',
      patientName: 'Unknown',
      status: ChatSessionStatus.HUMAN_TAKEOVER,
      context: { reason: 'complex_query', takenOverBy: staffUser!.id },
      lastIntent: 'HUMAN_HANDOFF',
      messages: {
        create: [
          {
            sender: ChatMessageSender.PATIENT,
            message: 'Necesito hablar con alguien sobre un problema con mi factura',
            intent: 'BILLING_QUERY',
            confidence: 0.75,
            createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          },
          {
            sender: ChatMessageSender.BOT,
            message: 'Entiendo que tienes una consulta sobre facturación. Déjame conectarte con nuestro equipo de atención al cliente.',
            createdAt: new Date(now.getTime() - 59 * 60 * 1000),
          },
          {
            sender: ChatMessageSender.BOT,
            message: '⏳ Un miembro de nuestro equipo te atenderá en breve. Tiempo estimado de espera: 5 minutos.',
            createdAt: new Date(now.getTime() - 58 * 60 * 1000),
          },
          {
            sender: ChatMessageSender.STAFF,
            message: 'Hola, soy Sarah de recepción. ¿En qué puedo ayudarte con tu factura?',
            staffUserId: staffUser!.id,
            createdAt: new Date(now.getTime() - 55 * 60 * 1000),
          },
          {
            sender: ChatMessageSender.PATIENT,
            message: 'Me cobraron dos veces por la misma consulta',
            createdAt: new Date(now.getTime() - 50 * 60 * 1000),
          },
          {
            sender: ChatMessageSender.STAFF,
            message: 'Déjame revisar tu cuenta. ¿Me puedes proporcionar tu número de cédula o el número de factura?',
            staffUserId: staffUser!.id,
            createdAt: new Date(now.getTime() - 48 * 60 * 1000),
          },
        ],
      },
    },
  });

  const chatSession3 = await prisma.chatSession.create({
    data: {
      tenantId: tenant.id,
      patientId: additionalPatients[4].id,
      patientPhone: '+1-555-0209',
      patientName: 'Elena Torres',
      status: ChatSessionStatus.ACTIVE,
      context: { currentFlow: 'faq', awaitingInput: true },
      lastIntent: 'FAQ',
      messages: {
        create: [
          {
            sender: ChatMessageSender.PATIENT,
            message: 'Cuáles son los horarios de atención?',
            intent: 'FAQ_HOURS',
            confidence: 0.96,
            createdAt: new Date(now.getTime() - 5 * 60 * 1000),
          },
          {
            sender: ChatMessageSender.BOT,
            message: '🕐 Nuestros horarios de atención son:\n\n📅 Lunes a Jueves: 9:00 AM - 5:00 PM\n📅 Viernes: 9:00 AM - 3:00 PM\n📅 Sábados y Domingos: Cerrado\n\n¿Hay algo más en lo que pueda ayudarte?',
            createdAt: new Date(now.getTime() - 4 * 60 * 1000),
          },
        ],
      },
    },
  });
  console.log('✅ Created 3 chat sessions with messages');

  // ==========================================
  // Create Chatbot Config
  // ==========================================
  console.log('\n🤖 Creating chatbot configurations...');

  await prisma.chatbotConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      isEnabled: true,
      welcomeMessage: '¡Hola! Bienvenido a Dr. Smith Dental Practice. Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
      fallbackMessage: 'Lo siento, no entendí tu mensaje. Por favor selecciona una opción o escribe "humano" para hablar con una persona.',
      clinicName: 'Dr. Smith Dental Practice',
      clinicAddress: '123 Main Street, New York, NY 10001',
      clinicPhone: '+1234567893',
      clinicWebsite: 'https://drsmith-dental.com',
      operatingHours: {
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '17:00' },
        friday: { open: '09:00', close: '15:00' },
        saturday: null,
        sunday: null,
      },
      pricingInfo: [
        { service: 'Limpieza dental', price: 150, duration: 30 },
        { service: 'Revisión general', price: 100, duration: 20 },
        { service: 'Blanqueamiento', price: 350, duration: 60 },
        { service: 'Relleno de caries', price: 250, duration: 45 },
        { service: 'Extracción simple', price: 200, duration: 30 },
        { service: 'Corona dental', price: 1200, duration: 90 },
      ],
      aiModel: 'gpt-4',
      aiTemperature: 0.7,
      maxTokens: 500,
      systemPrompt: 'Eres un asistente virtual amable y profesional para una clínica dental. Ayuda a los pacientes a agendar citas, responder preguntas frecuentes y proporcionar información sobre servicios. Siempre sé cortés y empático.',
      allowScheduling: true,
      allowCancellation: true,
      allowRescheduling: true,
      requireIdentification: true,
      autoResponseDelay: 1500,
      humanHandoffKeywords: ['humano', 'persona', 'agente', 'recepcionista', 'hablar con alguien'],
      maxMessagesPerHour: 100,
    },
  });
  console.log('✅ Created chatbot configuration');

  // ==========================================
  // Summary
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 TEST DATA SEED COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\n📊 Summary of created test data:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👥 Additional Patients: ${additionalPatients.length}`);
  console.log(`📅 Appointments: ${appointments.length}`);
  console.log(`🔄 Recurring Appointments: 2`);
  console.log(`⏳ Waitlist Entries: ${waitlistEntries.length}`);
  console.log(`📋 Treatment Plans: 3`);
  console.log(`💰 Invoices: 4`);
  console.log(`📄 Documents: ${documents.length}`);
  console.log(`🦷 Odontograms: 3`);
  console.log(`🔔 Notifications: ${notifications.length}`);
  console.log(`📝 Audit Logs: ${auditLogs.length}`);
  console.log(`💬 Chat Sessions: 3`);
  console.log(`🤖 Chatbot Config: 1`);
  console.log('\n');
}

seedTestData()
  .catch((e) => {
    console.error('❌ Test data seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
