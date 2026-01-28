# Modelo de Datos - DentiCloud

**Single Database con Row-Level Security**

---

## Tabla de Contenidos

1. [Principios del Modelo](#principios-del-modelo)
2. [Diagrama ER](#diagrama-er)
3. [Entidades Principales](#entidades-principales)
4. [Relaciones Clave](#relaciones-clave)
5. [Schema Prisma](#schema-prisma)

---

## Principios del Modelo

### 1. Single Database
- UNA sola base de datos PostgreSQL
- Todas las tablas incluyen `tenant_id` (excepto tablas de plataforma)
- Row-level security mediante filtros en queries

### 2. Tenants = Dentistas
- Cada dentista es un tenant
- `tenant_id` = `dentist_user_id`
- TODOS los dentistas pagan suscripción

### 3. Pacientes con Múltiples Dentistas
- Relación N:M entre `patients` y `users` (dentistas)
- Tabla pivot: `patient_dentist_relations`
- Un paciente puede tener historial con múltiples dentistas

### 4. Staff Multi-Dentista
- Staff tiene UNA cuenta
- Relación N:M con dentistas via `tenant_memberships`
- Puede trabajar para múltiples dentistas simultáneamente

### 5. Clínicas y Consultorios
- Clínicas creadas por super admin
- Consultorios pertenecen a clínicas
- Múltiples dentistas comparten consultorios

---

## Diagrama ER

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATFORM TABLES                           │
│  (Sin tenant_id, compartidas por todos)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Users                          SubscriptionPlans           │
│  ├─ id (PK)                    ├─ id (PK)                  │
│  ├─ email (unique)             ├─ name                      │
│  ├─ name                       ├─ price                     │
│  ├─ role (super_admin |        ├─ max_patients             │
│  │        dentist |             ├─ features                 │
│  │        staff |               └─ ...                      │
│  │        patient)                                          │
│  ├─ licenseNumber                                           │
│  └─ ...                                                     │
│       │                                                     │
│       │                        Clinics                      │
│       │                        ├─ id (PK)                   │
│       │                        ├─ name                      │
│       │                        ├─ address                   │
│       │                        └─ created_by (super admin)  │
│       │                              │                      │
│       │                              ▼                      │
│       │                        Operatories                  │
│       │                        ├─ id (PK)                   │
│       │                        ├─ clinic_id (FK)            │
│       │                        ├─ name                      │
│       │                        └─ equipment                 │
│       │                                                     │
│       ▼                                                     │
│  Tenants (cada dentista)                                    │
│  ├─ id (PK) = user_id                                      │
│  ├─ subscription_plan_id (FK)                              │
│  ├─ subscription_status                                     │
│  ├─ stripe_customer_id                                      │
│  └─ ...                                                     │
│       │                                                     │
│       ▼                                                     │
│  TenantMemberships (N:M Users ↔ Tenants)                   │
│  ├─ id (PK)                                                │
│  ├─ user_id (FK) ──────┐                                  │
│  ├─ tenant_id (FK) ────┼─── Para dentistas: su propio    │
│  ├─ role               │     tenant + otros si comparte   │
│  ├─ permissions        │                                   │
│  └─ operatory_ids[]    └─── Para staff: múltiples tenants │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  TENANT-SCOPED TABLES                        │
│  (Todas incluyen tenant_id para RLS)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Patients                                                    │
│  ├─ id (PK)                                                 │
│  ├─ first_name                                              │
│  ├─ last_name                                               │
│  ├─ email                                                   │
│  ├─ phone                                                   │
│  └─ ...                                                     │
│       │                                                     │
│       ▼                                                     │
│  PatientDentistRelations (N:M)  ⭐ CRÍTICO                 │
│  ├─ id (PK)                                                │
│  ├─ patient_id (FK)                                        │
│  ├─ dentist_id (FK) ──── tenant_id del dentista           │
│  ├─ is_active (current dentist?)                           │
│  ├─ started_at                                              │
│  ├─ ended_at                                                │
│  └─ notes (why changed dentist)                            │
│       │                                                     │
│       ├──► MedicalHistories                                │
│       │    ├─ id (PK)                                       │
│       │    ├─ patient_id (FK)                               │
│       │    ├─ dentist_id (FK) ⭐ Historia por dentista     │
│       │    ├─ tenant_id (RLS)                               │
│       │    ├─ allergies                                     │
│       │    ├─ medications                                   │
│       │    └─ ...                                           │
│       │                                                     │
│       ├──► DentalCharts                                    │
│       │    ├─ id (PK)                                       │
│       │    ├─ patient_id (FK)                               │
│       │    ├─ dentist_id (FK) ⭐ Chart por dentista        │
│       │    ├─ tenant_id (RLS)                               │
│       │    ├─ chart_data (jsonb)                            │
│       │    ├─ created_at                                    │
│       │    └─ ...                                           │
│       │                                                     │
│       └──► Appointments                                    │
│            ├─ id (PK)                                       │
│            ├─ patient_id (FK)                               │
│            ├─ dentist_id (FK) ⭐ tenant_id                 │
│            ├─ operatory_id (FK)                             │
│            ├─ tenant_id (RLS) = dentist_id                  │
│            ├─ start_time                                    │
│            ├─ end_time                                      │
│            ├─ status                                        │
│            └─ ...                                           │
│                  │                                          │
│                  ▼                                          │
│            OperatoryAssignments (N:M)                       │
│            ├─ id (PK)                                       │
│            ├─ operatory_id (FK)                             │
│            ├─ dentist_id (FK)                               │
│            ├─ tenant_id (RLS) = dentist_id                  │
│            ├─ schedule (jsonb)                              │
│            ├─ start_date                                    │
│            └─ end_date                                      │
│                                                             │
│  TreatmentPlans                                             │
│  ├─ id (PK)                                                 │
│  ├─ patient_id (FK)                                         │
│  ├─ dentist_id (FK) ⭐ tenant_id                           │
│  ├─ tenant_id (RLS) = dentist_id                            │
│  ├─ status                                                  │
│  ├─ total_cost                                              │
│  └─ procedures (jsonb)                                      │
│                                                             │
│  Invoices                                                   │
│  ├─ id (PK)                                                 │
│  ├─ patient_id (FK)                                         │
│  ├─ dentist_id (FK) ⭐ tenant_id                           │
│  ├─ tenant_id (RLS) = dentist_id                            │
│  ├─ total                                                   │
│  ├─ status                                                  │
│  └─ ...                                                     │
│                                                             │
│  WhatsAppConnections  ⭐ CRÍTICO                            │
│  ├─ id (PK)                                                 │
│  ├─ dentist_id (FK) ⭐ tenant_id (uno por dentista)        │
│  ├─ tenant_id (RLS) = dentist_id                            │
│  ├─ phone_number                                            │
│  ├─ connection_status                                       │
│  ├─ qr_code                                                 │
│  ├─ session_data (encrypted)                               │
│  └─ ...                                                     │
│                                                             │
│  ChatSessions                                               │
│  ├─ id (PK)                                                 │
│  ├─ whatsapp_connection_id (FK)                             │
│  ├─ dentist_id (FK) ⭐ tenant_id                           │
│  ├─ tenant_id (RLS) = dentist_id                            │
│  ├─ patient_phone                                           │
│  ├─ patient_id (FK, nullable)                               │
│  └─ messages (jsonb)                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Entidades Principales

### 1. Users (Platform Table)

**Sin `tenant_id`** - Tabla compartida de plataforma

```typescript
model User {
  id                String   @id @default(uuid())
  email             String   @unique
  password_hash     String?  // Nullable si usa OAuth
  name              String
  phone             String?
  avatar_url        String?

  // Tipo de usuario
  role              UserRole // super_admin | dentist | staff | patient

  // Para dentistas
  license_number    String?
  npi_number        String?
  specialization    String?

  // OAuth
  oauth_provider    OAuthProvider? // google | apple | microsoft
  oauth_id          String?

  // Si es dentista, tiene su propio tenant
  tenant            Tenant?  @relation("DentistTenant")

  // Memberships: puede ser miembro de múltiples tenants
  memberships       TenantMembership[]

  // Si es paciente
  patient_profile   Patient?

  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  @@index([email])
  @@index([role])
}

enum UserRole {
  super_admin
  dentist
  staff
  patient
}

enum OAuthProvider {
  google
  apple
  microsoft
}
```

### 2. Tenants (Platform Table)

**Cada dentista ES un tenant**

```typescript
model Tenant {
  id                    String   @id // = dentist user_id
  dentist               User     @relation("DentistTenant", fields: [id], references: [id])

  // Subscription
  subscription_plan_id  String
  subscription_plan     SubscriptionPlan @relation(fields: [subscription_plan_id], references: [id])
  subscription_status   SubscriptionStatus // trial | active | past_due | cancelled
  trial_ends_at         DateTime?

  // Stripe
  stripe_customer_id    String?
  stripe_subscription_id String?

  // Limits (según plan)
  max_patients          Int?
  max_staff             Int?
  storage_gb            Int

  // Features enabled
  features              Json // { whatsapp: true, ai_chatbot: true, ... }

  // Metadata
  subdomain             String?  @unique // Optional: drperez.denticloud.com
  business_name         String?
  business_address      Json?

  // Memberships (staff que trabajan para este dentista)
  memberships           TenantMembership[]

  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  @@index([subscription_status])
}

enum SubscriptionStatus {
  trial
  active
  past_due
  cancelled
}
```

### 3. TenantMemberships (Platform Table)

**N:M entre Users y Tenants**

```typescript
model TenantMembership {
  id          String   @id @default(uuid())

  // User (staff) que trabaja para tenant (dentista)
  user_id     String
  user        User     @relation(fields: [user_id], references: [id])

  // Tenant (dentista) para quien trabaja
  tenant_id   String
  tenant      Tenant   @relation(fields: [tenant_id], references: [id])

  // Role en este tenant
  role        MembershipRole // owner | staff_receptionist | staff_billing | staff_assistant

  // Permisos específicos
  permissions Json // { canViewAllPatients: true, canEditSchedule: false, ... }

  // Para staff: consultorios asignados
  operatory_ids String[] // Consultorios en los que trabaja

  // Status
  status      MembershipStatus // pending_invitation | active | inactive
  invited_at  DateTime?
  accepted_at DateTime?

  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@unique([user_id, tenant_id])
  @@index([user_id])
  @@index([tenant_id])
  @@index([status])
}

enum MembershipRole {
  owner               // El dentista dueño
  staff_receptionist
  staff_billing
  staff_assistant
}

enum MembershipStatus {
  pending_invitation
  active
  inactive
}
```

### 4. Clinics (Platform Table)

**Creadas por Super Admin**

```typescript
model Clinic {
  id              String   @id @default(uuid())
  name            String
  address         Json
  phone           String?
  email           String?

  // Creada por super admin
  created_by      String
  created_by_user User     @relation(fields: [created_by], references: [id])

  // Operatories (consultorios)
  operatories     Operatory[]

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@index([name])
}
```

### 5. Operatories (Platform Table)

**Consultorios que pertenecen a clínicas**

```typescript
model Operatory {
  id          String   @id @default(uuid())

  clinic_id   String
  clinic      Clinic   @relation(fields: [clinic_id], references: [id])

  name        String   // "Consultorio 1", "Operatorio A"
  description String?
  equipment   Json?    // { chair: "Brand X", xray: true, ... }
  is_active   Boolean  @default(true)

  // Assignments: qué dentistas usan este consultorio
  assignments OperatoryAssignment[]

  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@index([clinic_id])
  @@index([is_active])
}
```

### 6. Patients (Tenant-Scoped)

**Con `tenant_id` implícito via relaciones**

```typescript
model Patient {
  id              String   @id @default(uuid())

  // Información básica
  first_name      String
  last_name       String
  date_of_birth   DateTime
  gender          Gender
  email           String?
  phone           String
  address         Json?
  emergency_contact Json?

  // Relación N:M con dentistas ⭐ CRÍTICO
  dentist_relations PatientDentistRelation[]

  // Historial médico (uno por dentista)
  medical_histories MedicalHistory[]

  // Charts dentales (uno por dentista)
  dental_charts   DentalChart[]

  // Appointments
  appointments    Appointment[]

  // Treatment plans
  treatment_plans TreatmentPlan[]

  // Documents
  documents       Document[]

  // Invoices
  invoices        Invoice[]

  // Insurance
  insurance       Json?

  // Portal access
  user_id         String?  // Si tiene cuenta de paciente
  user            User?    @relation(fields: [user_id], references: [id])

  // Status
  status          PatientStatus @default(active)

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  deleted_at      DateTime? // Soft delete

  @@index([email])
  @@index([phone])
  @@index([status])
}

enum Gender {
  male
  female
  other
  prefer_not_to_say
}

enum PatientStatus {
  active
  inactive
  archived
}
```

### 7. PatientDentistRelations (Tenant-Scoped) ⭐

**Relación N:M entre Paciente y Dentista**

```typescript
model PatientDentistRelation {
  id          String   @id @default(uuid())

  // Paciente
  patient_id  String
  patient     Patient  @relation(fields: [patient_id], references: [id])

  // Dentista (tenant)
  dentist_id  String   // ⭐ Este es el tenant_id para RLS
  dentist     User     @relation(fields: [dentist_id], references: [id])

  // ¿Es el dentista actual del paciente?
  is_active   Boolean  @default(true)

  // Fechas de la relación
  started_at  DateTime @default(now())
  ended_at    DateTime? // Si cambió de dentista

  // Razón del cambio (opcional)
  notes       String?

  // Para RLS: tenant_id = dentist_id
  tenant_id   String   // Computed: = dentist_id

  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@unique([patient_id, dentist_id]) // Un registro por par
  @@index([patient_id])
  @@index([dentist_id]) // Para queries por tenant
  @@index([is_active])
  @@index([tenant_id]) // Para RLS
}
```

**Queries importantes:**

```typescript
// Obtener dentista actual de un paciente
const currentDentist = await prisma.patientDentistRelation.findFirst({
  where: {
    patient_id: patientId,
    is_active: true,
  },
  include: { dentist: true }
});

// Obtener todos los pacientes activos de un dentista
const patients = await prisma.patient.findMany({
  where: {
    dentist_relations: {
      some: {
        dentist_id: dentistId, // tenant_id
        is_active: true,
      }
    }
  }
});

// Historial completo de dentistas de un paciente (para portal)
const dentistHistory = await prisma.patientDentistRelation.findMany({
  where: {
    patient_id: patientId,
  },
  include: {
    dentist: true,
  },
  orderBy: {
    started_at: 'desc',
  }
});
```

### 8. MedicalHistory (Tenant-Scoped)

**Una historia por paciente-dentista**

```typescript
model MedicalHistory {
  id              String   @id @default(uuid())

  // Paciente
  patient_id      String
  patient         Patient  @relation(fields: [patient_id], references: [id])

  // Dentista que creó esta historia
  dentist_id      String   // ⭐ tenant_id
  dentist         User     @relation(fields: [dentist_id], references: [id])

  // Para RLS
  tenant_id       String   // = dentist_id

  // Datos médicos
  allergies       String[]
  medications     String[]
  medical_conditions String[]
  previous_surgeries String[]
  smoking_status  SmokingStatus
  alcohol_consumption AlcoholConsumption

  // Historial dental con ESTE dentista
  previous_dental_work String?
  last_cleaning   DateTime?
  last_xray       DateTime?

  // Notes del dentista
  notes           String?

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@unique([patient_id, dentist_id]) // Una por par
  @@index([patient_id])
  @@index([dentist_id]) // Para RLS
  @@index([tenant_id])
}

enum SmokingStatus {
  never
  former
  current
}

enum AlcoholConsumption {
  none
  occasional
  moderate
  heavy
}
```

### 9. Appointments (Tenant-Scoped)

```typescript
model Appointment {
  id              String   @id @default(uuid())

  // Paciente
  patient_id      String
  patient         Patient  @relation(fields: [patient_id], references: [id])

  // Dentista (provider) ⭐ tenant_id
  dentist_id      String
  dentist         User     @relation(fields: [dentist_id], references: [id])

  // Consultorio
  operatory_id    String
  operatory       Operatory @relation(fields: [operatory_id], references: [id])

  // Para RLS
  tenant_id       String   // = dentist_id

  // Timing
  start_time      DateTime
  end_time        DateTime
  duration_minutes Int

  // Type y Status
  appointment_type AppointmentType
  status          AppointmentStatus @default(scheduled)

  // Detalles
  reason          String?
  notes           String?
  procedures      Json[]

  // Confirmación
  confirmation_status ConfirmationStatus @default(pending)
  reminder_sent   Boolean @default(false)

  // Calendar integration
  external_calendar_event_id String?

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@index([patient_id])
  @@index([dentist_id]) // Para RLS y queries
  @@index([operatory_id])
  @@index([start_time])
  @@index([status])
  @@index([tenant_id])
}

enum AppointmentType {
  checkup
  cleaning
  filling
  crown
  root_canal
  extraction
  emergency
  consultation
  other
}

enum AppointmentStatus {
  scheduled
  confirmed
  checked_in
  in_progress
  completed
  cancelled
  no_show
}

enum ConfirmationStatus {
  pending
  confirmed
  declined
}
```

### 10. OperatoryAssignments (Tenant-Scoped)

**N:M entre Dentista y Consultorio**

```typescript
model OperatoryAssignment {
  id            String   @id @default(uuid())

  // Consultorio
  operatory_id  String
  operatory     Operatory @relation(fields: [operatory_id], references: [id])

  // Dentista ⭐ tenant_id
  dentist_id    String
  dentist       User     @relation(fields: [dentist_id], references: [id])

  // Para RLS
  tenant_id     String   // = dentist_id

  // Horarios asignados
  schedule      Json     // { monday: ["9:00-13:00", "14:00-18:00"], ... }

  // Fechas de asignación
  start_date    DateTime
  end_date      DateTime?

  // Status
  is_active     Boolean  @default(true)

  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  @@unique([operatory_id, dentist_id, start_date])
  @@index([operatory_id])
  @@index([dentist_id]) // Para RLS
  @@index([is_active])
  @@index([tenant_id])
}
```

**Validación de disponibilidad:**

```typescript
// Validar que dentista tiene acceso al consultorio en ese horario
async function validateOperatoryAccess(
  dentistId: string,
  operatoryId: string,
  appointmentTime: DateTime
): Promise<boolean> {
  const assignment = await prisma.operatoryAssignment.findFirst({
    where: {
      dentist_id: dentistId,
      operatory_id: operatoryId,
      is_active: true,
      start_date: { lte: appointmentTime },
      OR: [
        { end_date: null },
        { end_date: { gte: appointmentTime } }
      ]
    }
  });

  if (!assignment) return false;

  // Validar horario del día
  const dayOfWeek = appointmentTime.toFormat('EEEE').toLowerCase();
  const timeSlots = assignment.schedule[dayOfWeek];

  // Check if appointmentTime is within any time slot
  return timeSlots.some(slot => isTimeInSlot(appointmentTime, slot));
}
```

### 11. WhatsAppConnections (Tenant-Scoped) ⭐

**Una conexión por dentista**

```typescript
model WhatsAppConnection {
  id                String   @id @default(uuid())

  // Dentista (tenant) dueño de esta conexión
  dentist_id        String   @unique // ⭐ tenant_id, UNIQUE: uno por dentista
  dentist           User     @relation(fields: [dentist_id], references: [id])

  // Para RLS
  tenant_id         String   // = dentist_id

  // WhatsApp details
  phone_number      String   @unique
  connection_status ConnectionStatus @default(disconnected)

  // Baileys session data (encrypted)
  session_data      String?  // JSON encrypted
  qr_code           String?  // Para mostrar en setup
  qr_generated_at   DateTime?

  // Sessions
  chat_sessions     ChatSession[]

  // Stats
  messages_sent     Int      @default(0)
  messages_received Int      @default(0)

  // Config
  auto_reply_enabled Boolean @default(true)
  business_hours    Json?

  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  connected_at      DateTime?
  disconnected_at   DateTime?

  @@index([dentist_id]) // Para RLS
  @@index([connection_status])
  @@index([tenant_id])
}

enum ConnectionStatus {
  disconnected
  connecting
  connected
  error
}
```

### 12. ChatSessions (Tenant-Scoped)

```typescript
model ChatSession {
  id                      String   @id @default(uuid())

  // WhatsApp connection
  whatsapp_connection_id  String
  whatsapp_connection     WhatsAppConnection @relation(fields: [whatsapp_connection_id], references: [id])

  // Dentista (tenant)
  dentist_id              String
  dentist                 User     @relation(fields: [dentist_id], references: [id])

  // Para RLS
  tenant_id               String   // = dentist_id

  // Paciente (si se identifica)
  patient_id              String?
  patient                 Patient? @relation(fields: [patient_id], references: [id])
  patient_phone           String

  // Conversación
  messages                Json[]   // Array de mensajes
  context                 Json?    // Contexto del chat (intent, entities, etc.)

  // Status
  status                  ChatStatus @default(active)
  handed_off_to_human     Boolean @default(false)

  // Timing
  started_at              DateTime @default(now())
  ended_at                DateTime?
  last_message_at         DateTime @default(now())

  created_at              DateTime @default(now())
  updated_at              DateTime @updatedAt

  @@index([whatsapp_connection_id])
  @@index([dentist_id]) // Para RLS
  @@index([patient_id])
  @@index([patient_phone])
  @@index([status])
  @@index([tenant_id])
}

enum ChatStatus {
  active
  completed
  handed_off
}
```

---

## Relaciones Clave

### 1. Paciente ↔ Dentista (N:M)

```typescript
// Un paciente puede tener múltiples dentistas
const patient = await prisma.patient.findUnique({
  where: { id: patientId },
  include: {
    dentist_relations: {
      include: {
        dentist: true
      },
      orderBy: {
        started_at: 'desc'
      }
    }
  }
});

// Dentistas: [Dr. A (2022-2023), Dr. B (2024-actual)]
```

### 2. Staff ↔ Dentistas (N:M)

```typescript
// Staff trabaja para múltiples dentistas
const staff = await prisma.user.findUnique({
  where: { id: staffId },
  include: {
    memberships: {
      where: {
        status: 'active'
      },
      include: {
        tenant: {
          include: {
            dentist: true
          }
        }
      }
    }
  }
});

// Memberships: [Dr. Pérez, Dr. López, Dra. García]
```

### 3. Dentista ↔ Consultorios (N:M)

```typescript
// Dentista trabaja en múltiples consultorios
const assignments = await prisma.operatoryAssignment.findMany({
  where: {
    dentist_id: dentistId,
    is_active: true
  },
  include: {
    operatory: {
      include: {
        clinic: true
      }
    }
  }
});

// Assignments: [Consultorio 1 Lun-Mie, Consultorio 3 Jue-Vie]
```

---

## Schema Prisma

**Ver archivo completo:** `prisma/schema.prisma`

```prisma
// Single database para todos los tenants
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Platform tables (sin tenant_id)
model User { ... }
model Tenant { ... }
model TenantMembership { ... }
model SubscriptionPlan { ... }
model Clinic { ... }
model Operatory { ... }

// Tenant-scoped tables (con tenant_id)
model Patient { ... }
model PatientDentistRelation { ... } // ⭐ N:M
model MedicalHistory { ... }
model DentalChart { ... }
model Appointment { ... }
model OperatoryAssignment { ... }
model TreatmentPlan { ... }
model Invoice { ... }
model Payment { ... }
model WhatsAppConnection { ... } // ⭐ Crítico
model ChatSession { ... }
model Document { ... }
model Communication { ... }
model AuditLog { ... }
```

---

**Versión:** 3.0
**Última actualización:** 30 de Diciembre, 2025
