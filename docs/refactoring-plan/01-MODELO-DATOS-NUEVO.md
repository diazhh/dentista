# 01 - Modelo de Datos Nuevo

## Resumen de Cambios

El modelo actual está centrado en "Dentist" como tenant owner. El nuevo modelo generaliza esto a "Provider" (cualquier profesional de salud) y hace al paciente una entidad independiente.

---

## 1. Enums Actualizados

```prisma
// ANTES
enum UserRole {
  SUPER_ADMIN
  DENTIST
  STAFF_RECEPTIONIST
  STAFF_BILLING
  STAFF_ASSISTANT
  PATIENT
}

// DESPUÉS
enum UserRole {
  SUPER_ADMIN
  PROVIDER          // Reemplaza DENTIST - cualquier profesional de salud
  CLINIC_ADMIN      // NUEVO - administrador de clínica
  STAFF_MANAGER     // NUEVO - staff que gestiona agenda/pacientes
  STAFF_RECEPTIONIST
  STAFF_BILLING
  STAFF_ASSISTANT
  PATIENT
}

// NUEVO - Especialidades médicas
enum MedicalSpecialty {
  GENERAL_DENTISTRY
  ORTHODONTICS
  ENDODONTICS
  PERIODONTICS
  ORAL_SURGERY
  PEDIATRIC_DENTISTRY
  PROSTHODONTICS
  GENERAL_MEDICINE
  INTERNAL_MEDICINE
  PEDIATRICS
  CARDIOLOGY
  DERMATOLOGY
  OPHTHALMOLOGY
  GYNECOLOGY
  PSYCHOLOGY
  PSYCHIATRY
  PHYSIOTHERAPY
  NUTRITION
  SPEECH_THERAPY
  OCCUPATIONAL_THERAPY
  OTHER
}

// NUEVO - Estado de consentimiento
enum ConsentStatus {
  PENDING       // Solicitado pero no respondido
  GRANTED       // Aceptado
  DENIED        // Rechazado
  REVOKED       // Fue aceptado pero el paciente lo revocó
  EXPIRED       // Venció el tiempo
}

// NUEVO - Nivel de acceso de datos
enum DataAccessLevel {
  FULL              // Acceso completo a la historia
  CLINICAL_ONLY     // Solo datos clínicos
  SCHEDULING_ONLY   // Solo agenda
  DOCUMENTS_SHARED  // Solo documentos compartidos explícitamente
  MINIMAL           // Solo nombre y contacto
}

// NUEVO - Tipo de relación provider-paciente
enum ProviderPatientRelationType {
  REGISTERED_BY_PROVIDER  // El provider registró al paciente (sin cuenta)
  LINKED_BY_PATIENT       // El paciente se vinculó al provider
  MUTUAL                  // Ambos confirmaron la relación
  PROVIDER_ONLY           // El provider tiene datos pero el paciente no aceptó compartir
}
```

---

## 2. Modelos Core Modificados

### User (modificado)

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  passwordHash String?  @map("password_hash")
  phone        String?
  role         UserRole @default(PATIENT)
  avatarUrl    String?  @map("avatar_url")

  // Campos profesionales (solo para PROVIDER)
  licenseNumber   String?          @map("license_number")
  npiNumber       String?          @map("npi_number")
  specialties     MedicalSpecialty[] // CAMBIO: array de especialidades (antes era un solo string)
  bio             String?          @db.Text // NUEVO

  // OAuth
  oauthProvider String? @map("oauth_provider")
  oauthId       String? @map("oauth_id")

  // Preferencias
  language      String  @default("es") // NUEVO
  timezone      String  @default("America/Santo_Domingo") // NUEVO

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relaciones
  ownedTenants         Tenant[]
  tenantMemberships    TenantMembership[]
  patientProfile       Patient?
  sessions             Session[]
  auditLogs            AuditLog[]
  passwordResetTokens  PasswordResetToken[]
  managedClinics       Clinic[]             @relation("ClinicAdmin") // NUEVO
  providerModules      ProviderModule[]     // NUEVO

  @@unique([oauthProvider, oauthId])
  @@map("users")
}
```

### Tenant (modificado)

```prisma
// Tenant ahora representa a CUALQUIER proveedor de salud, no solo dentistas
model Tenant {
  id       String @id @default(uuid())
  ownerId  String @map("owner_id")
  name     String
  subdomain String @unique

  // NUEVO: tipo de práctica
  practiceType    MedicalSpecialty  @map("practice_type") // Especialidad principal

  // Suscripción (sin cambios)
  subscriptionTier   SubscriptionTier   @default(STARTER)
  subscriptionStatus SubscriptionStatus @default(TRIAL)
  stripeCustomerId   String?
  trialEndsAt        DateTime?

  // Límites (sin cambios)
  maxPatients Int @default(100)
  storageGB   Int @default(5)

  // WhatsApp (sin cambios)
  whatsappConnected Boolean @default(false)

  // Políticas de cancelación (sin cambios)
  cancellationMinHours     Int     @default(24)
  cancellationFeeType      String?
  cancellationFeeAmount    Float?
  maxCancellationsPerMonth Int     @default(3)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  owner                    User
  memberships              TenantMembership[]
  providerPatientRelations ProviderPatientRelation[] // RENOMBRADO
  appointments             Appointment[]
  roomAssignments          RoomAssignment[]          // RENOMBRADO
  auditLogs                AuditLog[]
  medicalServices          MedicalService[]          // RENOMBRADO
  chatbotConfig            ChatbotConfig?
  treatmentPlans           TreatmentPlan[]
  invoices                 Invoice[]
  notifications            Notification[]
  calendarConnections      CalendarConnection[]

  @@index([ownerId])
  @@map("tenants")
}
```

### Patient (modificado significativamente)

```prisma
// El paciente es ahora una ENTIDAD INDEPENDIENTE
// Puede existir sin estar vinculado a ningún provider
model Patient {
  id          String   @id @default(uuid())
  userId      String?  @unique @map("user_id") // Nullable: puede existir sin cuenta

  // Identificación
  documentType  String   @map("document_type") // NUEVO: 'CEDULA', 'PASSPORT', 'LICENSE', etc.
  documentId    String   @map("document_id")

  // Datos personales
  firstName   String   @map("first_name")
  lastName    String   @map("last_name")
  dateOfBirth DateTime @map("date_of_birth")
  gender      Gender
  phone       String
  email       String?  // NUEVO: email propio (puede diferir del User email)
  address     Json?    // NUEVO: dirección

  // Datos médicos generales (propiedad del paciente)
  bloodType         String?  @map("blood_type") // NUEVO
  medicalHistory    Json?    @map("medical_history")
  allergies         String[]
  medications       String[]
  chronicConditions String[] // NUEVO

  // Contacto de emergencia
  emergencyContactName  String?
  emergencyContactPhone String?
  emergencyContactRelation String? // NUEVO

  // Portal
  portalEnabled  Boolean @default(false)

  // NUEVO: Preferencias de privacidad
  defaultDataAccess DataAccessLevel @default(MINIMAL) @map("default_data_access")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  user                     User?
  providerPatientRelations ProviderPatientRelation[] // RENOMBRADO
  appointments             Appointment[]
  waitlistEntries          Waitlist[]
  documents                Document[]
  patientConsents          PatientConsent[]         // NUEVO
  sharedDocuments          SharedDocument[]         // NUEVO
  medicalExams             MedicalExam[]            // NUEVO

  @@unique([documentType, documentId]) // Unique por tipo+número de documento
  @@map("patients")
}
```

---

## 3. Modelos Nuevos

### ProviderPatientRelation (reemplaza PatientDentistRelation)

```prisma
model ProviderPatientRelation {
  id         String    @id @default(uuid())
  patientId  String    @map("patient_id")
  providerId String    @map("provider_id") // userId del provider
  tenantId   String    @map("tenant_id")

  // NUEVO: tipo de relación
  relationType ProviderPatientRelationType @default(REGISTERED_BY_PROVIDER)

  // Estado
  isActive  Boolean   @default(true)
  startedAt DateTime  @default(now())
  endedAt   DateTime?

  // NUEVO: nivel de acceso que el paciente otorga
  dataAccessLevel DataAccessLevel @default(MINIMAL)

  // Notas del provider (privadas, no compartidas con el paciente)
  providerNotes String? @db.Text @map("provider_notes")

  // NUEVO: Datos locales del provider sobre este paciente
  // (cuando el paciente no comparte su data global)
  localMedicalHistory Json? @map("local_medical_history")
  localAllergies      String[] @map("local_allergies")
  localMedications    String[] @map("local_medications")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  patient Patient @relation(fields: [patientId], references: [id])
  tenant  Tenant  @relation(fields: [tenantId], references: [id])

  @@unique([patientId, providerId])
  @@index([patientId])
  @@index([providerId])
  @@index([tenantId])
  @@map("provider_patient_relations")
}
```

### PatientConsent (NUEVO)

```prisma
// Registro de consentimientos del paciente para compartir datos
model PatientConsent {
  id          String        @id @default(uuid())
  patientId   String        @map("patient_id")
  providerId  String        @map("provider_id")

  // Qué se comparte
  dataAccessLevel DataAccessLevel

  // Categorías específicas de datos compartidos
  shareAppointments    Boolean @default(true)
  shareMedicalHistory  Boolean @default(false)
  shareDocuments       Boolean @default(false)
  shareLabResults      Boolean @default(false)
  shareBilling         Boolean @default(false)

  // Estado y vigencia
  status      ConsentStatus @default(PENDING)
  grantedAt   DateTime?
  revokedAt   DateTime?
  expiresAt   DateTime?     // IMPORTANTE: consentimiento temporal

  // Auditoría
  requestedBy String        @map("requested_by") // userId que solicitó
  reason      String?       // Por qué se solicita

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  patient     Patient       @relation(fields: [patientId], references: [id])

  @@index([patientId])
  @@index([providerId])
  @@index([status])
  @@index([expiresAt])
  @@map("patient_consents")
}
```

### SharedDocument (NUEVO)

```prisma
// Documentos que el paciente comparte con providers específicos
model SharedDocument {
  id          String   @id @default(uuid())
  patientId   String   @map("patient_id")
  documentId  String   @map("document_id") // Referencia al documento
  providerId  String   @map("provider_id") // Con quién se comparte

  // Vigencia del share
  sharedAt    DateTime @default(now())
  expiresAt   DateTime? // Puede ser temporal
  revokedAt   DateTime?

  isActive    Boolean  @default(true)

  patient     Patient  @relation(fields: [patientId], references: [id])

  @@unique([documentId, providerId])
  @@index([patientId])
  @@index([providerId])
  @@index([expiresAt])
  @@map("shared_documents")
}
```

### MedicalExam (NUEVO)

```prisma
// Exámenes médicos que el paciente sube por su cuenta
model MedicalExam {
  id          String   @id @default(uuid())
  patientId   String   @map("patient_id")

  title       String
  examType    String   @map("exam_type") // 'BLOOD_TEST', 'XRAY', 'MRI', 'CT_SCAN', etc.
  description String?  @db.Text
  examDate    DateTime @map("exam_date")

  // Archivo
  filePath    String   @map("file_path")
  fileName    String   @map("file_name")
  fileSize    Int      @map("file_size")
  mimeType    String   @map("mime_type")

  // FUTURO: Resumen IA
  aiSummary   String?  @db.Text @map("ai_summary")
  aiProcessed Boolean  @default(false) @map("ai_processed")

  // Tags
  tags        String[] @default([])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  patient     Patient  @relation(fields: [patientId], references: [id])

  @@index([patientId])
  @@index([examType])
  @@index([examDate])
  @@map("medical_exams")
}
```

### Clinic (modificado significativamente)

```prisma
model Clinic {
  id        String  @id @default(uuid())
  name      String
  address   Json    // { street, city, state, zipCode, country }
  phone     String
  email     String

  // GPS
  latitude  Float?
  longitude Float?

  // CAMBIO: Admin de clínica es un usuario con rol CLINIC_ADMIN
  adminUserId String? @map("admin_user_id")

  // Detalles
  floors      Int     @default(1)
  description String? @db.Text
  website     String?
  logoUrl     String?

  // NUEVO: Información de negocio
  taxId           String? @map("tax_id")       // RNC o equivalente
  businessHours   Json?   @map("business_hours") // Horario de operación
  specialties     MedicalSpecialty[]             // Especialidades que ofrece
  amenities       String[] @default([])          // WiFi, parking, etc.

  // NUEVO: Configuración de alquiler
  rentalEnabled   Boolean @default(false) @map("rental_enabled")
  rentalRateHourly Float? @map("rental_rate_hourly")
  rentalRateDaily  Float? @map("rental_rate_daily")
  rentalRateMonthly Float? @map("rental_rate_monthly")

  // Control
  createdBy String  @map("created_by")
  isActive  Boolean @default(true)
  isPublic  Boolean @default(true) @map("is_public") // NUEVO: visible en directorio

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  admin       User?              @relation("ClinicAdmin", fields: [adminUserId], references: [id])
  rooms       ConsultationRoom[] // RENOMBRADO de Operatory
  clinicStaff ClinicStaff[]     // NUEVO

  @@map("clinics")
}
```

### ConsultationRoom (reemplaza Operatory)

```prisma
model ConsultationRoom {
  id          String  @id @default(uuid())
  clinicId    String  @map("clinic_id")
  name        String
  floor       Int     @default(1)
  roomNumber  String? @map("room_number") // NUEVO
  description String?

  // NUEVO: Capacidades del consultorio
  capabilities String[] @default([]) // 'XRAY', 'DENTAL_CHAIR', 'EXAM_TABLE', etc.
  equipment    Json?

  // NUEVO: Configuración de scheduling
  bufferMinutes    Int @default(15) @map("buffer_minutes") // Tiempo entre citas
  maxDailyHours    Int @default(10) @map("max_daily_hours")

  // NUEVO: Alquiler
  isShared         Boolean @default(true) @map("is_shared")
  hourlyRate       Float?  @map("hourly_rate")

  isActive    Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  clinic         Clinic            @relation(fields: [clinicId], references: [id])
  roomAssignments RoomAssignment[]
  appointments    Appointment[]

  @@index([clinicId])
  @@map("consultation_rooms")
}
```

### RoomAssignment (reemplaza OperatoryAssignment)

```prisma
// Asignación de consultorios a providers con horarios
model RoomAssignment {
  id          String    @id @default(uuid())
  roomId      String    @map("room_id")
  providerId  String    @map("provider_id") // userId del provider
  tenantId    String    @map("tenant_id")

  // Horario de uso
  schedule    Json      // { monday: [{start: "08:00", end: "12:00"}], ... }
  startDate   DateTime  @map("start_date")
  endDate     DateTime? @map("end_date")

  // NUEVO: Tipo de asignación
  assignmentType String @default("RECURRING") @map("assignment_type") // 'RECURRING', 'ONE_TIME', 'RENTAL'

  // NUEVO: Para alquileres
  rentalRate     Float?  @map("rental_rate")
  rentalPeriod   String? @map("rental_period") // 'HOURLY', 'DAILY', 'MONTHLY'

  isActive  Boolean   @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  room      ConsultationRoom @relation(fields: [roomId], references: [id])
  tenant    Tenant           @relation(fields: [tenantId], references: [id])

  @@index([roomId])
  @@index([providerId])
  @@index([tenantId])
  @@map("room_assignments")
}
```

### ClinicStaff (NUEVO)

```prisma
// Staff propio de la clínica (diferente al staff del provider)
model ClinicStaff {
  id        String   @id @default(uuid())
  clinicId  String   @map("clinic_id")
  userId    String   @map("user_id")
  role      String   // 'RECEPTIONIST', 'ADMIN', 'MAINTENANCE', etc.

  isActive  Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, userId])
  @@index([clinicId])
  @@index([userId])
  @@map("clinic_staff")
}
```

### MedicalService (reemplaza DentalService)

```prisma
model MedicalService {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")

  code        String   // Código del procedimiento
  name        String
  description String?  @db.Text
  category    String   // Categoría general

  // NUEVO: A qué especialidad pertenece
  specialty   MedicalSpecialty

  defaultPrice Float  @map("default_price")
  duration     Int    @default(30) // minutos

  // NUEVO: Requerimientos
  requiredCapabilities String[] @default([]) @map("required_capabilities") // Qué necesita el consultorio
  requiresRoom         Boolean  @default(true) @map("requires_room")

  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([specialty])
  @@index([category])
  @@index([isActive])
  @@map("medical_services")
}
```

### ProviderModule (NUEVO - sistema de plugins)

```prisma
// Módulos activados por provider según su especialidad
model ProviderModule {
  id          String   @id @default(uuid())
  providerId  String   @map("provider_id") // userId
  moduleKey   String   @map("module_key")  // 'dental', 'general', 'psychology', etc.

  isActive    Boolean  @default(true)
  config      Json?    // Configuración específica del módulo

  activatedAt DateTime @default(now()) @map("activated_at")

  provider    User     @relation(fields: [providerId], references: [id])

  @@unique([providerId, moduleKey])
  @@index([providerId])
  @@index([moduleKey])
  @@map("provider_modules")
}
```

---

## 4. Modelos que NO cambian (o cambios mínimos)

Los siguientes modelos mantienen su estructura con solo renaming de `dentistId` → `providerId`:

- **Appointment** - solo renombrar `dentistId` → `providerId`
- **RecurringAppointment** - solo renombrar
- **Waitlist** - solo renombrar
- **TreatmentPlan** - solo renombrar (se mueve a módulo dental como extensión)
- **Invoice** - solo renombrar
- **Payment** - sin cambios
- **Document** - solo renombrar
- **Session** - sin cambios
- **AuditLog** - sin cambios
- **Notification/NotificationPreference** - sin cambios
- **ChatSession/ChatMessage** - sin cambios
- **CalendarConnection/CalendarSyncLog** - sin cambios
- **ChatbotConfig** - renombrar `clinicName` → `practiceName`
- **SubscriptionPlan** - sin cambios
- **Email\*** - sin cambios
- **PasswordResetToken** - sin cambios

---

## 5. Modelos que se mueven a módulos

### Módulo Dental
- `Odontogram` → se mantiene pero se marca como parte del módulo dental
- `OdontogramTooth` → igual
- `TreatmentPlanItem` → se extiende para ser genérico pero con campos dentales opcionales

### Módulo Medicina General (NUEVO)
```prisma
model ClinicalNote {
  id          String   @id @default(uuid())
  patientId   String
  providerId  String
  tenantId    String

  noteType    String   // 'SOAP', 'PROGRESS', 'INITIAL', 'FOLLOW_UP'

  // SOAP format
  subjective  String?  @db.Text
  objective   String?  @db.Text
  assessment  String?  @db.Text
  plan        String?  @db.Text

  // Vital signs
  vitalSigns  Json?    // { bloodPressure, heartRate, temperature, weight, height, bmi }

  // Diagnósticos (ICD-10)
  diagnoses   Json?    // [{ code: "J06.9", description: "...", type: "primary|secondary" }]

  // Prescripciones
  prescriptions Json?  // [{ medication, dosage, frequency, duration }]

  // Referidos
  referrals    Json?   // [{ specialty, provider, reason }]

  appointmentId String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([patientId])
  @@index([providerId])
  @@index([tenantId])
  @@map("clinical_notes")
}
```

---

## 6. Estrategia de Migración de Datos

### Paso 1: Renaming sin pérdida de datos
```sql
-- Renombrar columnas
ALTER TABLE patient_dentist_relations RENAME TO provider_patient_relations;
ALTER TABLE provider_patient_relations RENAME COLUMN dentist_id TO provider_id;
ALTER TABLE operatories RENAME TO consultation_rooms;
ALTER TABLE operatory_assignments RENAME TO room_assignments;
ALTER TABLE room_assignments RENAME COLUMN operatory_id TO room_id;
ALTER TABLE dental_services RENAME TO medical_services;
-- ... etc para todas las tablas con dentist_id
```

### Paso 2: Agregar nuevas columnas
```sql
ALTER TABLE patients ADD COLUMN document_type VARCHAR DEFAULT 'CEDULA';
ALTER TABLE patients ADD COLUMN default_data_access VARCHAR DEFAULT 'MINIMAL';
ALTER TABLE tenants ADD COLUMN practice_type VARCHAR DEFAULT 'GENERAL_DENTISTRY';
ALTER TABLE users ADD COLUMN language VARCHAR DEFAULT 'es';
ALTER TABLE users ADD COLUMN timezone VARCHAR DEFAULT 'America/Santo_Domingo';
-- ... etc
```

### Paso 3: Crear nuevas tablas
- patient_consents
- shared_documents
- medical_exams
- clinic_staff
- provider_modules
- clinical_notes

### Paso 4: Migrar datos existentes
```sql
-- Todos los DENTIST existentes se convierten en PROVIDER
UPDATE users SET role = 'PROVIDER' WHERE role = 'DENTIST';
-- Todos los tenants existentes tienen practice_type = dental
UPDATE tenants SET practice_type = 'GENERAL_DENTISTRY';
-- Todas las relaciones existentes son REGISTERED_BY_PROVIDER
ALTER TABLE provider_patient_relations ADD COLUMN relation_type VARCHAR DEFAULT 'REGISTERED_BY_PROVIDER';
```
