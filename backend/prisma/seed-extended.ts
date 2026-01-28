import { PrismaClient, AppointmentStatus, TreatmentPlanStatus, TreatmentItemStatus, InvoiceStatus, PaymentMethod, PaymentStatus, Gender, ToothCondition, ToothSurface, DocumentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting extended seed for Patient Dashboard testing...');

  // Get existing dentist and tenant
  const dentist = await prisma.user.findUnique({ where: { email: 'dentist@dentista.com' } });
  const tenant = await prisma.tenant.findUnique({ where: { subdomain: 'drsmith' } });

  if (!dentist || !tenant) {
    throw new Error('Dentist or tenant not found. Run main seed first.');
  }

  // Create 8 additional patients
  const patientsData = [
    { email: 'maria.gonzalez@email.com', firstName: 'María', lastName: 'González', documentId: '003-1111111-1', dateOfBirth: '1992-03-10', gender: Gender.FEMALE, allergies: ['Latex'], medications: ['Ibuprofeno'] },
    { email: 'carlos.rodriguez@email.com', firstName: 'Carlos', lastName: 'Rodríguez', documentId: '003-2222222-2', dateOfBirth: '1988-07-22', gender: Gender.MALE, allergies: [], medications: ['Metformina'] },
    { email: 'ana.martinez@email.com', firstName: 'Ana', lastName: 'Martínez', documentId: '003-3333333-3', dateOfBirth: '1995-11-05', gender: Gender.FEMALE, allergies: ['Penicilina'], medications: [] },
    { email: 'luis.fernandez@email.com', firstName: 'Luis', lastName: 'Fernández', documentId: '003-4444444-4', dateOfBirth: '1990-01-15', gender: Gender.MALE, allergies: [], medications: ['Aspirina'] },
    { email: 'sofia.lopez@email.com', firstName: 'Sofía', lastName: 'López', documentId: '003-5555555-5', dateOfBirth: '1998-09-30', gender: Gender.FEMALE, allergies: ['Anestesia local'], medications: [] },
    { email: 'miguel.sanchez@email.com', firstName: 'Miguel', lastName: 'Sánchez', documentId: '003-6666666-6', dateOfBirth: '1985-04-18', gender: Gender.MALE, allergies: [], medications: ['Losartán'] },
    { email: 'laura.torres@email.com', firstName: 'Laura', lastName: 'Torres', documentId: '003-7777777-7', dateOfBirth: '1993-12-25', gender: Gender.FEMALE, allergies: ['Yodo'], medications: [] },
    { email: 'pedro.ramirez@email.com', firstName: 'Pedro', lastName: 'Ramírez', documentId: '003-8888888-8', dateOfBirth: '1987-06-08', gender: Gender.MALE, allergies: [], medications: ['Atorvastatina'] },
  ];

  const patients = [];
  for (const data of patientsData) {
    const password = await bcrypt.hash(data.documentId, 10);
    
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        name: `${data.firstName} ${data.lastName}`,
        passwordHash: password,
        phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
        role: 'PATIENT',
      },
    });

    const patient = await prisma.patient.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        documentId: data.documentId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        allergies: data.allergies,
        medications: data.medications,
        emergencyContactName: 'Contacto de Emergencia',
        emergencyContactPhone: '+1-555-9999',
        portalEnabled: true,
      },
    });

    // Create patient-dentist relation
    await prisma.patientDentistRelation.upsert({
      where: {
        patientId_dentistId: {
          patientId: patient.id,
          dentistId: dentist.id,
        },
      },
      update: {},
      create: {
        patientId: patient.id,
        dentistId: dentist.id,
        tenantId: tenant.id,
        isActive: true,
        notes: `Paciente regular desde ${new Date().getFullYear() - 1}`,
      },
    });

    patients.push(patient);
    console.log(`✅ Created patient: ${patient.firstName} ${patient.lastName}`);
  }

  // Get first patient for detailed data
  const mainPatient = patients[0];

  // Create appointments (past, present, future)
  const appointmentsData = [
    { date: new Date('2025-11-15T10:00:00'), status: AppointmentStatus.COMPLETED, type: 'Limpieza Dental', duration: 60, notes: 'Limpieza rutinaria completada sin complicaciones' },
    { date: new Date('2025-12-01T14:00:00'), status: AppointmentStatus.COMPLETED, type: 'Revisión General', duration: 30, notes: 'Se detectó caries en molar 36' },
    { date: new Date('2025-12-10T09:00:00'), status: AppointmentStatus.COMPLETED, type: 'Tratamiento de Caries', duration: 90, notes: 'Resina en molar 36 completada exitosamente' },
    { date: new Date('2025-12-20T11:00:00'), status: AppointmentStatus.COMPLETED, type: 'Control Post-Tratamiento', duration: 30, notes: 'Evolución favorable, sin dolor' },
    { date: new Date('2026-01-08T15:00:00'), status: AppointmentStatus.COMPLETED, type: 'Limpieza Dental', duration: 60, notes: 'Limpieza profunda con ultrasonido' },
    { date: new Date('2026-01-15T10:00:00'), status: AppointmentStatus.SCHEDULED, type: 'Endodoncia', duration: 120, notes: 'Programada endodoncia en molar 46' },
    { date: new Date('2026-01-22T14:00:00'), status: AppointmentStatus.SCHEDULED, type: 'Control Endodoncia', duration: 30, notes: 'Control post-endodoncia' },
    { date: new Date('2026-02-05T09:00:00'), status: AppointmentStatus.SCHEDULED, type: 'Limpieza Dental', duration: 60, notes: 'Limpieza de mantenimiento' },
  ];

  const appointments = [];
  for (const data of appointmentsData) {
    const appointment = await prisma.appointment.create({
      data: {
        patientId: mainPatient.id,
        dentistId: dentist.id,
        tenantId: tenant.id,
        appointmentDate: data.date,
        duration: data.duration,
        status: data.status,
        procedureType: data.type,
        notes: data.notes,
      },
    });
    appointments.push(appointment);
  }
  console.log(`✅ Created ${appointments.length} appointments for ${mainPatient.firstName}`);

  // Create treatment plans
  const treatmentPlan1 = await prisma.treatmentPlan.create({
    data: {
      patientId: mainPatient.id,
      dentistId: dentist.id,
      tenantId: tenant.id,
      title: 'Plan de Tratamiento Integral 2025',
      description: 'Tratamiento completo para restauración dental',
      status: TreatmentPlanStatus.IN_PROGRESS,
      startDate: new Date('2025-12-01'),
      totalCost: 2500.00,
      items: {
        create: [
          {
            procedureCode: 'D1110',
            procedureName: 'Limpieza Dental Profunda',
            estimatedCost: 150.00,
            status: TreatmentItemStatus.COMPLETED,
            notes: 'Completada con éxito',
          },
          {
            procedureCode: 'D2391',
            procedureName: 'Resina en Molar 36',
            tooth: '36',
            estimatedCost: 200.00,
            status: TreatmentItemStatus.COMPLETED,
            notes: 'Resina compuesta clase II',
          },
          {
            procedureCode: 'D3310',
            procedureName: 'Endodoncia Molar 46',
            tooth: '46',
            estimatedCost: 800.00,
            status: TreatmentItemStatus.IN_PROGRESS,
            notes: 'Programada para enero 2026',
          },
          {
            procedureCode: 'D2750',
            procedureName: 'Corona Porcelana Molar 46',
            tooth: '46',
            estimatedCost: 1200.00,
            status: TreatmentItemStatus.PENDING,
            notes: 'Posterior a endodoncia',
          },
          {
            procedureCode: 'D1110',
            procedureName: 'Limpieza de Mantenimiento',
            estimatedCost: 150.00,
            status: TreatmentItemStatus.PENDING,
            notes: 'Cada 6 meses',
          },
        ],
      },
    },
  });
  console.log(`✅ Created treatment plan: ${treatmentPlan1.title}`);

  const treatmentPlan2 = await prisma.treatmentPlan.create({
    data: {
      patientId: mainPatient.id,
      dentistId: dentist.id,
      tenantId: tenant.id,
      title: 'Plan Preventivo 2026',
      description: 'Mantenimiento y prevención',
      status: TreatmentPlanStatus.PROPOSED,
      startDate: new Date('2026-03-01'),
      totalCost: 600.00,
      items: {
        create: [
          {
            procedureCode: 'D1110',
            procedureName: 'Limpieza Dental',
            estimatedCost: 150.00,
            status: TreatmentItemStatus.PENDING,
          },
          {
            procedureCode: 'D1206',
            procedureName: 'Aplicación de Flúor',
            estimatedCost: 50.00,
            status: TreatmentItemStatus.PENDING,
          },
          {
            procedureCode: 'D1351',
            procedureName: 'Sellantes Molares',
            tooth: '16',
            estimatedCost: 400.00,
            status: TreatmentItemStatus.PENDING,
          },
        ],
      },
    },
  });
  console.log(`✅ Created treatment plan: ${treatmentPlan2.title}`);

  // Create odontograms
  const odontogram1 = await prisma.odontogram.create({
    data: {
      patientId: mainPatient.id,
      dentistId: dentist.id,
      tenantId: tenant.id,
      date: new Date('2025-12-01'),
      notes: 'Evaluación inicial - Se detecta caries en molar 36 y necesidad de endodoncia en molar 46',
      teeth: {
        create: [
          {
            toothNumber: 36,
            condition: ToothCondition.CAVITY,
            surfaces: [ToothSurface.OCCLUSAL],
            notes: 'Caries clase II oclusal',
          },
          {
            toothNumber: 46,
            condition: ToothCondition.CAVITY,
            surfaces: [ToothSurface.OCCLUSAL, ToothSurface.MESIAL],
            notes: 'Caries profunda con compromiso pulpar',
          },
          {
            toothNumber: 11,
            condition: ToothCondition.HEALTHY,
            surfaces: [],
            notes: 'Sano',
          },
        ],
      },
    },
  });
  console.log(`✅ Created odontogram from ${odontogram1.date.toISOString().split('T')[0]}`);

  const odontogram2 = await prisma.odontogram.create({
    data: {
      patientId: mainPatient.id,
      dentistId: dentist.id,
      tenantId: tenant.id,
      date: new Date('2026-01-08'),
      notes: 'Control post-tratamiento - Molar 36 restaurado con resina, molar 46 pendiente de endodoncia',
      teeth: {
        create: [
          {
            toothNumber: 36,
            condition: ToothCondition.FILLED,
            surfaces: [ToothSurface.OCCLUSAL],
            notes: 'Resina compuesta clase II',
          },
          {
            toothNumber: 46,
            condition: ToothCondition.CAVITY,
            surfaces: [ToothSurface.OCCLUSAL, ToothSurface.MESIAL],
            notes: 'Pendiente endodoncia',
          },
        ],
      },
    },
  });
  console.log(`✅ Created odontogram from ${odontogram2.date.toISOString().split('T')[0]}`);

  // Create invoices
  const invoice1 = await prisma.invoice.create({
    data: {
      patientId: mainPatient.id,
      dentistId: dentist.id,
      tenantId: tenant.id,
      invoiceNumber: 'INV-2025-001',
      issueDate: new Date('2025-12-01'),
      dueDate: new Date('2025-12-31'),
      status: InvoiceStatus.PAID,
      subtotal: 150.00,
      tax: 0.00,
      total: 150.00,
      amountPaid: 150.00,
      balance: 0.00,
      notes: 'Limpieza dental profunda',
      items: {
        create: [
          {
            description: 'Limpieza Dental Profunda',
            quantity: 1,
            unitPrice: 150.00,
            total: 150.00,
          },
        ],
      },
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      patientId: mainPatient.id,
      dentistId: dentist.id,
      tenantId: tenant.id,
      invoiceNumber: 'INV-2025-002',
      issueDate: new Date('2025-12-10'),
      dueDate: new Date('2026-01-10'),
      status: InvoiceStatus.PAID,
      subtotal: 200.00,
      tax: 0.00,
      total: 200.00,
      amountPaid: 200.00,
      balance: 0.00,
      notes: 'Resina en molar 36',
      items: {
        create: [
          {
            description: 'Resina Compuesta Clase II - Molar 36',
            quantity: 1,
            unitPrice: 200.00,
            total: 200.00,
          },
        ],
      },
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      patientId: mainPatient.id,
      dentistId: dentist.id,
      tenantId: tenant.id,
      treatmentPlanId: treatmentPlan1.id,
      invoiceNumber: 'INV-2026-001',
      issueDate: new Date('2026-01-08'),
      dueDate: new Date('2026-02-08'),
      status: InvoiceStatus.SENT,
      subtotal: 2000.00,
      tax: 0.00,
      total: 2000.00,
      amountPaid: 500.00,
      balance: 1500.00,
      notes: 'Endodoncia y corona molar 46',
      items: {
        create: [
          {
            description: 'Endodoncia Molar 46',
            quantity: 1,
            unitPrice: 800.00,
            total: 800.00,
          },
          {
            description: 'Corona Porcelana Molar 46',
            quantity: 1,
            unitPrice: 1200.00,
            total: 1200.00,
          },
        ],
      },
    },
  });
  console.log(`✅ Created 3 invoices`);

  // Create payments
  await prisma.payment.create({
    data: {
      patientId: mainPatient.id,
      tenantId: tenant.id,
      invoiceId: invoice1.id,
      amount: 150.00,
      paymentDate: new Date('2025-12-01'),
      paymentMethod: PaymentMethod.CASH,
      status: PaymentStatus.COMPLETED,
      notes: 'Pago en efectivo',
    },
  });

  await prisma.payment.create({
    data: {
      patientId: mainPatient.id,
      tenantId: tenant.id,
      invoiceId: invoice2.id,
      amount: 200.00,
      paymentDate: new Date('2025-12-10'),
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: PaymentStatus.COMPLETED,
      notes: 'Pago con tarjeta de crédito',
    },
  });

  await prisma.payment.create({
    data: {
      patientId: mainPatient.id,
      tenantId: tenant.id,
      invoiceId: invoice3.id,
      amount: 500.00,
      paymentDate: new Date('2026-01-08'),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.COMPLETED,
      notes: 'Anticipo 25% - Transferencia bancaria',
    },
  });
  console.log(`✅ Created 3 payments`);

  // Create documents
  const documentTypes = [
    { type: DocumentType.XRAY, title: 'Radiografía Panorámica', description: 'Radiografía inicial', fileName: 'radiografia-panoramica.pdf' },
    { type: DocumentType.PHOTO, title: 'Foto Clínica - Molar 36', description: 'Antes del tratamiento', fileName: 'foto-molar-36-antes.jpg' },
    { type: DocumentType.PHOTO, title: 'Foto Clínica - Molar 36 Post', description: 'Después de resina', fileName: 'foto-molar-36-despues.jpg' },
    { type: DocumentType.PRESCRIPTION, title: 'Receta - Ibuprofeno', description: 'Post tratamiento molar 36', fileName: 'receta-ibuprofeno.pdf' },
    { type: DocumentType.CONSENT_FORM, title: 'Consentimiento Endodoncia', description: 'Firmado 2026-01-05', fileName: 'consentimiento-endodoncia.pdf' },
    { type: DocumentType.MEDICAL_RECORD, title: 'Historia Clínica', description: 'Historia clínica completa', fileName: 'historia-clinica.pdf' },
  ];

  for (const doc of documentTypes) {
    const filePath = `/uploads/documents/${Date.now()}-${doc.fileName}`;
    await prisma.document.create({
      data: {
        patientId: mainPatient.id,
        dentistId: dentist.id,
        tenantId: tenant.id,
        type: doc.type,
        title: doc.title,
        description: doc.description,
        filePath: filePath,
        fileName: doc.fileName,
        fileSize: Math.floor(Math.random() * 500000) + 100000,
        mimeType: doc.fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        uploadedBy: dentist.id,
        tags: [doc.type],
      },
    });
  }
  console.log(`✅ Created ${documentTypes.length} documents`);

  // Create some appointments for other patients
  for (let i = 1; i < patients.length; i++) {
    const patient = patients[i];
    const numAppointments = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < numAppointments; j++) {
      const daysOffset = Math.floor(Math.random() * 60) - 30;
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + daysOffset);
      
      await prisma.appointment.create({
        data: {
          patientId: patient.id,
          dentistId: dentist.id,
          tenantId: tenant.id,
          appointmentDate,
          duration: 60,
          status: daysOffset < 0 ? AppointmentStatus.COMPLETED : AppointmentStatus.SCHEDULED,
          procedureType: ['Limpieza', 'Revisión', 'Tratamiento'][Math.floor(Math.random() * 3)],
          notes: 'Cita de rutina',
        },
      });
    }
  }
  console.log(`✅ Created appointments for other patients`);

  console.log('\n🎉 Extended seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Patients: ${patients.length}`);
  console.log(`   - Appointments: ${appointments.length} (for main patient)`);
  console.log(`   - Treatment Plans: 2`);
  console.log(`   - Odontograms: 2`);
  console.log(`   - Invoices: 3`);
  console.log(`   - Payments: 3`);
  console.log(`   - Documents: ${documentTypes.length}`);
  console.log(`\n👤 Main test patient: ${mainPatient.firstName} ${mainPatient.lastName}`);
  console.log(`   Email: maria.gonzalez@email.com`);
  console.log(`   Document ID: ${mainPatient.documentId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
