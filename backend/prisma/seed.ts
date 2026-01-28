import { PrismaClient, UserRole, SubscriptionTier, SubscriptionStatus, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const dentistPassword = await bcrypt.hash('Dentist123!', 10);
  const dentist2Password = await bcrypt.hash('Dentist456!', 10);
  const staffPassword = await bcrypt.hash('Staff123!', 10);
  const patientPassword = await bcrypt.hash('Patient123!', 10);
  const patient2Password = await bcrypt.hash('Patient456!', 10);

  // Create Super Admin
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
  console.log('✅ Created Super Admin:', superAdmin.email);

  // Create Dentist User
  const dentistUser = await prisma.user.upsert({
    where: { email: 'dentist@dentista.com' },
    update: {},
    create: {
      email: 'dentist@dentista.com',
      name: 'Dr. John Smith',
      passwordHash: dentistPassword,
      phone: '+1234567891',
      role: UserRole.DENTIST,
      licenseNumber: 'DDS-12345',
      npiNumber: '1234567890',
      specialization: 'General Dentistry',
    },
  });
  console.log('✅ Created Dentist:', dentistUser.email);

  // Create Tenant for Dentist
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'drsmith' },
    update: {},
    create: {
      ownerId: dentistUser.id,
      name: 'Dr. Smith Dental Practice',
      subdomain: 'drsmith',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      maxPatients: 500,
      storageGB: 10,
    },
  });
  console.log('✅ Created Tenant:', tenant.name);

  // Create Patient User
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
  console.log('✅ Created Patient User:', patientUser.email);

  // Create Patient Profile
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
      medicalHistory: {
        conditions: ['Hypertension'],
        surgeries: [],
      },
      portalEnabled: true,
    },
  });
  console.log('✅ Created Patient Profile:', patient.firstName, patient.lastName);

  // Create Patient-Dentist Relation
  const relation = await prisma.patientDentistRelation.upsert({
    where: {
      patientId_dentistId: {
        patientId: patient.id,
        dentistId: dentistUser.id,
      },
    },
    update: {},
    create: {
      patientId: patient.id,
      dentistId: dentistUser.id,
      tenantId: tenant.id,
      isActive: true,
      notes: 'Regular patient since 2024',
    },
  });
  console.log('✅ Created Patient-Dentist Relation');

  // Create Clinic
  const clinic = await prisma.clinic.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Downtown Dental Clinic',
      address: {
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
      phone: '+1234567893',
      email: 'info@downtowndental.com',
      createdBy: superAdmin.id,
    },
  });
  console.log('✅ Created Clinic:', clinic.name);

  // Create Operatory
  const operatory = await prisma.operatory.create({
    data: {
      clinicId: clinic.id,
      name: 'Operatory 1',
      description: 'Main treatment room with digital X-ray',
      equipment: {
        chair: 'Adec 500',
        xray: 'Digital Panoramic',
        light: 'LED Operatory Light',
      },
    },
  });
  console.log('✅ Created Operatory:', operatory.name);

  // Create Operatory Assignment
  const assignment = await prisma.operatoryAssignment.create({
    data: {
      operatoryId: operatory.id,
      dentistId: dentistUser.id,
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
  console.log('✅ Created Operatory Assignment');

  // Create Second Dentist User
  const dentist2User = await prisma.user.upsert({
    where: { email: 'dentist2@dentista.com' },
    update: {},
    create: {
      email: 'dentist2@dentista.com',
      name: 'Dr. Maria Garcia',
      passwordHash: dentist2Password,
      phone: '+1234567894',
      role: UserRole.DENTIST,
      licenseNumber: 'DDS-67890',
      npiNumber: '0987654321',
      specialization: 'Orthodontics',
    },
  });
  console.log('✅ Created Second Dentist:', dentist2User.email);

  // Create Tenant for Second Dentist
  const tenant2 = await prisma.tenant.upsert({
    where: { subdomain: 'drgarcia' },
    update: {},
    create: {
      ownerId: dentist2User.id,
      name: 'Dr. Garcia Orthodontics',
      subdomain: 'drgarcia',
      subscriptionTier: SubscriptionTier.STARTER,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      maxPatients: 100,
      storageGB: 5,
    },
  });
  console.log('✅ Created Second Tenant:', tenant2.name);

  // Create Staff User
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
  console.log('✅ Created Staff User:', staffUser.email);

  // Create Second Patient User
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
  console.log('✅ Created Second Patient User:', patient2User.email);

  // Create Second Patient Profile
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
      medicalHistory: {
        conditions: [],
        surgeries: ['Appendectomy 2010'],
      },
      portalEnabled: true,
    },
  });
  console.log('✅ Created Second Patient Profile:', patient2.firstName, patient2.lastName);

  // Create Subscription Plans
  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'STARTER' },
    update: {},
    create: {
      name: 'Starter',
      code: 'STARTER',
      description: 'Plan básico para clínicas pequeñas que están comenzando',
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      currency: 'USD',
      maxPatients: 100,
      maxUsers: 3,
      storageGB: 5,
      features: ['odontograms', 'treatment_plans', 'invoicing'],
      isActive: true,
      isPublic: true,
      sortOrder: 1,
    },
  });
  console.log('✅ Created Subscription Plan:', starterPlan.name);

  const professionalPlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'PROFESSIONAL' },
    update: {},
    create: {
      name: 'Professional',
      code: 'PROFESSIONAL',
      description: 'Plan profesional para clínicas en crecimiento con funcionalidades avanzadas',
      monthlyPrice: 79.99,
      yearlyPrice: 799.99,
      currency: 'USD',
      maxPatients: 500,
      maxUsers: 10,
      storageGB: 20,
      features: [
        'odontograms',
        'treatment_plans',
        'invoicing',
        'whatsapp',
        'advanced_reports',
        'multi_clinic',
      ],
      isActive: true,
      isPublic: true,
      sortOrder: 2,
    },
  });
  console.log('✅ Created Subscription Plan:', professionalPlan.name);

  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'ENTERPRISE' },
    update: {},
    create: {
      name: 'Enterprise',
      code: 'ENTERPRISE',
      description: 'Plan empresarial para grandes clínicas con soporte prioritario y personalización',
      monthlyPrice: 199.99,
      yearlyPrice: 1999.99,
      currency: 'USD',
      maxPatients: -1, // Unlimited
      maxUsers: -1, // Unlimited
      storageGB: 100,
      features: [
        'odontograms',
        'treatment_plans',
        'invoicing',
        'whatsapp',
        'advanced_reports',
        'api_access',
        'priority_support',
        'multi_clinic',
        'custom_branding',
      ],
      isActive: true,
      isPublic: true,
      sortOrder: 3,
    },
  });
  console.log('✅ Created Subscription Plan:', enterprisePlan.name);

  // Create a test inactive plan
  const testPlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'TEST_PLAN' },
    update: {},
    create: {
      name: 'Test Plan (Inactive)',
      code: 'TEST_PLAN',
      description: 'Plan de prueba desactivado para testing',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      currency: 'USD',
      maxPatients: 50,
      maxUsers: 2,
      storageGB: 2,
      features: ['odontograms'],
      isActive: false,
      isPublic: false,
      sortOrder: 99,
    },
  });
  console.log('✅ Created Test Subscription Plan:', testPlan.name);

  // Create Email Templates
  const welcomeTemplate = await prisma.emailTemplate.upsert({
    where: { type: 'WELCOME' },
    update: {},
    create: {
      type: 'WELCOME',
      name: 'Bienvenida a DentiCloud',
      description: 'Email de bienvenida para nuevos tenants',
      subject: 'Bienvenido a DentiCloud - {{tenantName}}',
      htmlBody: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">¡Bienvenido a DentiCloud!</h1>
            <p>Hola {{ownerName}},</p>
            <p>Estamos emocionados de tenerte en DentiCloud. Tu clínica <strong>{{tenantName}}</strong> ha sido creada exitosamente.</p>
            <h2>Próximos pasos:</h2>
            <ul>
              <li>Configura tu perfil de clínica</li>
              <li>Agrega a tu equipo</li>
              <li>Comienza a registrar pacientes</li>
            </ul>
            <p>Tu período de prueba termina el: <strong>{{trialEndDate}}</strong></p>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>¡Saludos!<br>El equipo de DentiCloud</p>
          </body>
        </html>
      `,
      textBody: 'Bienvenido a DentiCloud, {{ownerName}}. Tu clínica {{tenantName}} ha sido creada exitosamente.',
      variables: ['tenantName', 'ownerName', 'trialEndDate'],
      isActive: true,
    },
  });
  console.log('✅ Created Email Template:', welcomeTemplate.name);

  const trialExpiringTemplate = await prisma.emailTemplate.upsert({
    where: { type: 'TRIAL_EXPIRING' },
    update: {},
    create: {
      type: 'TRIAL_EXPIRING',
      name: 'Trial Expirando',
      description: 'Notificación de que el trial está por expirar',
      subject: 'Tu período de prueba expira pronto - {{tenantName}}',
      htmlBody: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #F59E0B;">Tu período de prueba expira pronto</h1>
            <p>Hola {{ownerName}},</p>
            <p>Tu período de prueba de DentiCloud para <strong>{{tenantName}}</strong> expirará en <strong>{{daysRemaining}} días</strong>.</p>
            <p>Fecha de expiración: <strong>{{trialEndDate}}</strong></p>
            <h2>¿Qué sigue?</h2>
            <p>Para continuar disfrutando de DentiCloud sin interrupciones, te invitamos a suscribirte a uno de nuestros planes.</p>
            <p><a href="{{upgradeUrl}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver Planes</a></p>
            <p>¡Gracias por confiar en DentiCloud!</p>
          </body>
        </html>
      `,
      textBody: 'Tu período de prueba expira en {{daysRemaining}} días. Actualiza tu plan en {{upgradeUrl}}',
      variables: ['tenantName', 'ownerName', 'daysRemaining', 'trialEndDate', 'upgradeUrl'],
      isActive: true,
    },
  });
  console.log('✅ Created Email Template:', trialExpiringTemplate.name);

  const passwordResetTemplate = await prisma.emailTemplate.upsert({
    where: { type: 'PASSWORD_RESET' },
    update: {},
    create: {
      type: 'PASSWORD_RESET',
      name: 'Restablecer Contraseña',
      description: 'Email para restablecer contraseña',
      subject: 'Restablece tu contraseña - DentiCloud',
      htmlBody: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">Restablecer Contraseña</h1>
            <p>Hola {{userName}},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña en DentiCloud.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <p><a href="{{resetUrl}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Restablecer Contraseña</a></p>
            <p>Este enlace expirará en <strong>{{expirationTime}}</strong>.</p>
            <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
            <p>Saludos,<br>El equipo de DentiCloud</p>
          </body>
        </html>
      `,
      textBody: 'Restablece tu contraseña en: {{resetUrl}}. El enlace expira en {{expirationTime}}.',
      variables: ['userName', 'resetUrl', 'expirationTime'],
      isActive: true,
    },
  });
  console.log('✅ Created Email Template:', passwordResetTemplate.name);

  const paymentSuccessTemplate = await prisma.emailTemplate.upsert({
    where: { type: 'PAYMENT_SUCCESS' },
    update: {},
    create: {
      type: 'PAYMENT_SUCCESS',
      name: 'Pago Exitoso',
      description: 'Confirmación de pago recibido',
      subject: 'Pago recibido - {{tenantName}}',
      htmlBody: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10B981;">¡Pago Recibido!</h1>
            <p>Hola {{ownerName}},</p>
            <p>Hemos recibido tu pago de <strong>{{amount}} {{currency}}</strong> para <strong>{{tenantName}}</strong>.</p>
            <h2>Detalles del pago:</h2>
            <ul>
              <li>Monto: {{amount}} {{currency}}</li>
              <li>Plan: {{planName}}</li>
              <li>Fecha: {{paymentDate}}</li>
              <li>Próximo pago: {{nextPaymentDate}}</li>
            </ul>
            <p>Gracias por tu confianza en DentiCloud.</p>
            <p><a href="{{invoiceUrl}}">Ver Factura</a></p>
          </body>
        </html>
      `,
      textBody: 'Pago recibido: {{amount}} {{currency}} para {{planName}}. Próximo pago: {{nextPaymentDate}}',
      variables: ['tenantName', 'ownerName', 'amount', 'currency', 'planName', 'paymentDate', 'nextPaymentDate', 'invoiceUrl'],
      isActive: true,
    },
  });
  console.log('✅ Created Email Template:', paymentSuccessTemplate.name);

  // Create more tenants with different plans and states
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
  console.log('✅ Created Tenant 3:', tenant3.name);

  const tenant4 = await prisma.tenant.upsert({
    where: { subdomain: 'brightsmile' },
    update: {},
    create: {
      ownerId: superAdmin.id,
      name: 'Bright Smile Clinic',
      subdomain: 'brightsmile',
      subscriptionTier: SubscriptionTier.STARTER,
      subscriptionStatus: SubscriptionStatus.CANCELLED,
      trialEndsAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      maxPatients: 100,
      storageGB: 5,
    },
  });
  console.log('✅ Created Tenant 4 (Cancelled):', tenant4.name);

  const tenant5 = await prisma.tenant.upsert({
    where: { subdomain: 'dentalplus' },
    update: {},
    create: {
      ownerId: superAdmin.id,
      name: 'Dental Plus Associates',
      subdomain: 'dentalplus',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      maxPatients: 500,
      storageGB: 20,
    },
  });
  console.log('✅ Created Tenant 5 (Trial):', tenant5.name);

  // Create additional users for different tenants
  const dentist3Password = await bcrypt.hash('Dentist789!', 10);
  const dentist3User = await prisma.user.upsert({
    where: { email: 'dentist3@dentista.com' },
    update: {},
    create: {
      email: 'dentist3@dentista.com',
      name: 'Dr. Robert Chen',
      passwordHash: dentist3Password,
      phone: '+1234567897',
      role: UserRole.DENTIST,
      licenseNumber: 'DDS-11111',
      npiNumber: '1111111111',
      specialization: 'Cosmetic Dentistry',
    },
  });
  console.log('✅ Created Dentist 3:', dentist3User.email);

  const staff2Password = await bcrypt.hash('Staff456!', 10);
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
  console.log('✅ Created Staff 2:', staff2User.email);

  const assistantPassword = await bcrypt.hash('Assistant123!', 10);
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
  console.log('✅ Created Assistant:', assistantUser.email);

  // Create tenant memberships for users
  const membership1 = await prisma.tenantMembership.upsert({
    where: {
      userId_tenantId: {
        userId: dentistUser.id,
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      userId: dentistUser.id,
      tenantId: tenant.id,
      role: UserRole.DENTIST,
      isActive: true,
    },
  });
  console.log('✅ Created Membership: Dentist 1 -> Tenant 1');

  const membership2 = await prisma.tenantMembership.upsert({
    where: {
      userId_tenantId: {
        userId: staffUser.id,
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      userId: staffUser.id,
      tenantId: tenant.id,
      role: UserRole.STAFF_RECEPTIONIST,
      isActive: true,
    },
  });
  console.log('✅ Created Membership: Staff 1 -> Tenant 1');

  const membership3 = await prisma.tenantMembership.upsert({
    where: {
      userId_tenantId: {
        userId: dentist2User.id,
        tenantId: tenant2.id,
      },
    },
    update: {},
    create: {
      userId: dentist2User.id,
      tenantId: tenant2.id,
      role: UserRole.DENTIST,
      isActive: true,
    },
  });
  console.log('✅ Created Membership: Dentist 2 -> Tenant 2');

  const membership4 = await prisma.tenantMembership.upsert({
    where: {
      userId_tenantId: {
        userId: dentist3User.id,
        tenantId: tenant3.id,
      },
    },
    update: {},
    create: {
      userId: dentist3User.id,
      tenantId: tenant3.id,
      role: UserRole.DENTIST,
      isActive: true,
    },
  });
  console.log('✅ Created Membership: Dentist 3 -> Tenant 3');

  const membership5 = await prisma.tenantMembership.upsert({
    where: {
      userId_tenantId: {
        userId: staff2User.id,
        tenantId: tenant3.id,
      },
    },
    update: {},
    create: {
      userId: staff2User.id,
      tenantId: tenant3.id,
      role: UserRole.STAFF_RECEPTIONIST,
      isActive: true,
    },
  });
  console.log('✅ Created Membership: Staff 2 -> Tenant 3');

  const membership6 = await prisma.tenantMembership.upsert({
    where: {
      userId_tenantId: {
        userId: assistantUser.id,
        tenantId: tenant3.id,
      },
    },
    update: {},
    create: {
      userId: assistantUser.id,
      tenantId: tenant3.id,
      role: UserRole.STAFF_ASSISTANT,
      isActive: true,
    },
  });
  console.log('✅ Created Membership: Assistant -> Tenant 3');

  // Create SMTP Configuration (example with Mailtrap for testing)
  const crypto = require('crypto');
  const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  
  function encrypt(text: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  const smtpConfig = await prisma.emailConfiguration.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      smtpHost: 'smtp.mailtrap.io',
      smtpPort: 587,
      smtpUser: 'your-mailtrap-user',
      smtpPassword: encrypt('your-mailtrap-password'),
      smtpSecure: false,
      fromEmail: 'noreply@denticloud.com',
      fromName: 'DentiCloud',
      replyToEmail: 'soporte@denticloud.com',
      isActive: true,
      isVerified: false,
    },
  });
  console.log('✅ Created SMTP Configuration:', smtpConfig.smtpHost);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin:');
  console.log('  Email: admin@dentista.com');
  console.log('  Password: Admin123!');
  console.log('  Role: SUPER_ADMIN');
  console.log('\nDentist 1:');
  console.log('  Email: dentist@dentista.com');
  console.log('  Password: Dentist123!');
  console.log('  Role: DENTIST');
  console.log('  Tenant: Dr. Smith Dental Practice (PROFESSIONAL/ACTIVE)');
  console.log('\nDentist 2:');
  console.log('  Email: dentist2@dentista.com');
  console.log('  Password: Dentist456!');
  console.log('  Role: DENTIST');
  console.log('  Tenant: Dr. Garcia Orthodontics (STARTER/TRIAL)');
  console.log('\nStaff:');
  console.log('  Email: staff@dentista.com');
  console.log('  Password: Staff123!');
  console.log('  Role: STAFF_RECEPTIONIST');
  console.log('\nPatient 1:');
  console.log('  Email: patient@dentista.com');
  console.log('  Password: Patient123!');
  console.log('  Role: PATIENT');
  console.log('\nPatient 2:');
  console.log('  Email: patient2@dentista.com');
  console.log('  Password: Patient456!');
  console.log('  Role: PATIENT');
  console.log('\nDentist 3:');
  console.log('  Email: dentist3@dentista.com');
  console.log('  Password: Dentist789!');
  console.log('  Role: DENTIST');
  console.log('  Tenant: Smile Care Dental Center (ENTERPRISE/ACTIVE)');
  console.log('\nStaff 2:');
  console.log('  Email: staff2@dentista.com');
  console.log('  Password: Staff456!');
  console.log('  Role: STAFF_RECEPTIONIST');
  console.log('  Tenant: Smile Care Dental Center');
  console.log('\nAssistant:');
  console.log('  Email: assistant@dentista.com');
  console.log('  Password: Assistant123!');
  console.log('  Role: STAFF_ASSISTANT');
  console.log('  Tenant: Smile Care Dental Center');
  console.log('\n📊 Tenants Created:');
  console.log('  1. Dr. Smith Dental Practice (PROFESSIONAL/ACTIVE)');
  console.log('  2. Dr. Garcia Orthodontics (STARTER/TRIAL)');
  console.log('  3. Smile Care Dental Center (ENTERPRISE/ACTIVE)');
  console.log('  4. Bright Smile Clinic (STARTER/CANCELLED)');
  console.log('  5. Dental Plus Associates (PROFESSIONAL/TRIAL)');
  console.log('\n📧 SMTP Configuration:');
  console.log('  Host: smtp.mailtrap.io (Example - Update with real credentials)');
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
