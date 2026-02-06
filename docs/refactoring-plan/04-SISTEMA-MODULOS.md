# 04 - Sistema de Módulos por Especialidad

## 1. Concepto

Cada especialidad médica tiene herramientas clínicas únicas. En lugar de construir todo en el core, usamos un **sistema de módulos pluggables** donde cada especialidad activa las herramientas que necesita.

---

## 2. Arquitectura de Módulos

### 2.1 Backend: Módulos NestJS Dinámicos

```
/backend/src/modules/
  /core/                    # Módulo core (siempre activo)
  /dental/                  # Odontología
  │  ├── dental.module.ts
  │  ├── odontogram/
  │  │   ├── odontogram.controller.ts
  │  │   ├── odontogram.service.ts
  │  │   └── dto/
  │  ├── treatment-plans/   # Planes de tratamiento dental
  │  ├── cdt-codes/         # Códigos CDT
  │  └── dental.definition.ts  # Metadata del módulo
  /general-medicine/        # Medicina general
  │  ├── general.module.ts
  │  ├── clinical-notes/    # Notas SOAP
  │  ├── prescriptions/     # Recetas
  │  ├── referrals/         # Referidos
  │  ├── vitals/            # Signos vitales
  │  └── general.definition.ts
  /psychology/              # Psicología
  │  ├── psychology.module.ts
  │  ├── sessions/          # Sesiones terapéuticas
  │  ├── assessments/       # Escalas y evaluaciones
  │  ├── progress/          # Seguimiento de progreso
  │  └── psychology.definition.ts
  /physiotherapy/           # Fisioterapia
  │  ├── physiotherapy.module.ts
  │  ├── exercises/         # Plan de ejercicios
  │  ├── rehabilitation/    # Seguimiento de rehabilitación
  │  ├── measurements/      # Mediciones funcionales
  │  └── physiotherapy.definition.ts
  /dermatology/             # Dermatología
  │  ├── dermatology.module.ts
  │  ├── body-mapping/      # Mapeo corporal
  │  ├── lesion-tracking/   # Seguimiento de lesiones
  │  └── dermatology.definition.ts
  /nutrition/               # Nutrición
  │  ├── nutrition.module.ts
  │  ├── meal-plans/        # Planes alimentarios
  │  ├── body-measurements/ # Medidas corporales
  │  └── nutrition.definition.ts
```

### 2.2 Definición de Módulo

Cada módulo tiene un archivo de definición que describe sus capacidades:

```typescript
// /modules/dental/dental.definition.ts
export const DentalModuleDefinition: ModuleDefinition = {
  key: 'dental',
  name: 'Odontología',
  description: 'Herramientas para práctica odontológica',
  icon: 'tooth',
  version: '1.0.0',
  specialty: MedicalSpecialty.GENERAL_DENTISTRY,

  // Especialidades compatibles
  compatibleSpecialties: [
    MedicalSpecialty.GENERAL_DENTISTRY,
    MedicalSpecialty.ORTHODONTICS,
    MedicalSpecialty.ENDODONTICS,
    MedicalSpecialty.PERIODONTICS,
    MedicalSpecialty.ORAL_SURGERY,
    MedicalSpecialty.PEDIATRIC_DENTISTRY,
    MedicalSpecialty.PROSTHODONTICS,
  ],

  // Features que provee
  features: [
    {
      key: 'odontogram',
      name: 'Odontograma Digital',
      description: 'Gráfico interactivo dental',
      route: '/clinical/odontogram',
    },
    {
      key: 'dental-treatment-plans',
      name: 'Planes de Tratamiento Dental',
      description: 'Planificación con códigos CDT',
      route: '/clinical/treatment-plans',
    },
    {
      key: 'cdt-codes',
      name: 'Catálogo CDT',
      description: 'Códigos de procedimientos dentales',
      route: '/settings/cdt-codes',
    },
  ],

  // Tablas de DB que usa
  models: ['Odontogram', 'OdontogramTooth', 'TreatmentPlan', 'TreatmentPlanItem'],

  // Rutas de API que registra
  apiPrefix: '/api/modules/dental',

  // Configuración por defecto
  defaultConfig: {
    toothNumberingSystem: 'FDI', // FDI o Universal
    enablePeriodontalChart: false,
  },

  // Requerimientos del consultorio
  requiredCapabilities: ['DENTAL_CHAIR'],
};
```

### 2.3 Frontend: Módulos Lazy-Loaded

```typescript
// /frontend/src/modules/index.ts
export const moduleRegistry: Record<string, ModuleConfig> = {
  dental: {
    key: 'dental',
    name: 'Odontología',
    icon: ToothIcon,
    routes: () => import('./dental/routes'),
    components: () => import('./dental/components'),
    dashboardWidgets: () => import('./dental/widgets'),
  },
  'general-medicine': {
    key: 'general-medicine',
    name: 'Medicina General',
    icon: StethoscopeIcon,
    routes: () => import('./general-medicine/routes'),
    components: () => import('./general-medicine/components'),
    dashboardWidgets: () => import('./general-medicine/widgets'),
  },
  psychology: {
    key: 'psychology',
    name: 'Psicología',
    icon: BrainIcon,
    routes: () => import('./psychology/routes'),
    components: () => import('./psychology/components'),
    dashboardWidgets: () => import('./psychology/widgets'),
  },
  // ...
};
```

---

## 3. Módulos Detallados

### 3.1 Módulo Dental (migración de lo existente)

**Ya implementado:** Odontograma, TreatmentPlans, CDT codes
**Nuevas features:**
- Periodontal chart (profundidad de sondaje)
- Radiographic annotations
- Templates de tratamiento comunes

**Modelos específicos:**
- `Odontogram` (ya existe)
- `OdontogramTooth` (ya existe)
- `TreatmentPlan` (ya existe, se marca como dental)
- `TreatmentPlanItem` (ya existe)
- `PeriodontalChart` (nuevo, futuro)

### 3.2 Módulo Medicina General (NUEVO)

**Features:**
- Notas clínicas SOAP
- Registro de signos vitales
- Prescripciones/Recetas
- Referidos a especialistas
- Diagnósticos ICD-10

**Modelos:**
```prisma
model ClinicalNote {
  id            String   @id @default(uuid())
  patientId     String
  providerId    String
  tenantId      String
  appointmentId String?

  noteType    String   // 'SOAP', 'PROGRESS', 'INITIAL', 'FOLLOW_UP'

  subjective  String?  @db.Text
  objective   String?  @db.Text
  assessment  String?  @db.Text
  plan        String?  @db.Text

  vitalSigns  Json?
  diagnoses   Json?    // ICD-10 codes
  prescriptions Json?
  referrals    Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([patientId])
  @@index([providerId])
  @@index([tenantId])
  @@map("clinical_notes")
}

model Prescription {
  id            String   @id @default(uuid())
  patientId     String
  providerId    String
  tenantId      String
  clinicalNoteId String?

  medications   Json     // [{name, dosage, frequency, duration, instructions}]
  diagnosis     String?
  notes         String?

  issuedAt      DateTime @default(now())
  expiresAt     DateTime?

  // PDF generado
  pdfPath       String?

  createdAt     DateTime @default(now())

  @@index([patientId])
  @@index([providerId])
  @@map("prescriptions")
}
```

### 3.3 Módulo Psicología (NUEVO)

**Features:**
- Registro de sesiones terapéuticas
- Escalas de evaluación (PHQ-9, GAD-7, BDI, etc.)
- Seguimiento de progreso terapéutico
- Notas de sesión (con nivel de confidencialidad extra)

**Modelos:**
```prisma
model TherapySession {
  id            String   @id @default(uuid())
  patientId     String
  providerId    String
  tenantId      String
  appointmentId String?

  sessionNumber Int
  sessionType   String   // 'INDIVIDUAL', 'COUPLE', 'FAMILY', 'GROUP'
  duration      Int      // minutos

  notes         String?  @db.Text // Notas del terapeuta (confidenciales)
  techniques    String[] // Técnicas utilizadas
  homework      String?  @db.Text // Tareas para el paciente
  progress      String?  @db.Text // Progreso observado

  moodRating    Int?     // 1-10 (auto-reportado por paciente)
  riskLevel     String?  // 'NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([patientId])
  @@index([providerId])
  @@map("therapy_sessions")
}

model PsychologicalAssessment {
  id            String   @id @default(uuid())
  patientId     String
  providerId    String
  tenantId      String

  assessmentType String  // 'PHQ9', 'GAD7', 'BDI', 'MMPI', etc.
  responses      Json    // Respuestas del paciente
  score          Int
  interpretation String? @db.Text
  severity       String? // 'MINIMAL', 'MILD', 'MODERATE', 'SEVERE'

  administeredAt DateTime @default(now())

  @@index([patientId])
  @@index([assessmentType])
  @@map("psychological_assessments")
}
```

### 3.4 Módulo Fisioterapia (NUEVO)

**Features:**
- Planes de ejercicios
- Seguimiento de rehabilitación
- Mediciones funcionales (ROM, fuerza, etc.)
- Body chart para marcar áreas de dolor

### 3.5 Módulo Nutrición (NUEVO)

**Features:**
- Planes alimentarios
- Seguimiento de medidas corporales
- Registro de ingesta diaria
- Cálculo de macronutrientes

### 3.6 Módulo Dermatología (NUEVO)

**Features:**
- Body mapping (fotos de lesiones con ubicación en diagrama corporal)
- Seguimiento visual de lesiones en el tiempo
- Registro de biopsias

---

## 4. Cómo se activan los módulos

### 4.1 Al crear un tenant (provider)

```
1. Provider se registra
2. Selecciona su especialidad principal
3. El sistema sugiere módulos compatibles
4. Provider activa los que necesita
5. Se crea ProviderModule por cada módulo activado
6. Frontend carga solo los módulos activos (lazy loading)
```

### 4.2 API de Módulos

```
GET    /api/modules/available          # Lista módulos disponibles para la especialidad
GET    /api/modules/active             # Módulos activos del provider
POST   /api/modules/:key/activate     # Activar módulo
POST   /api/modules/:key/deactivate   # Desactivar módulo
PUT    /api/modules/:key/config       # Configurar módulo
```

### 4.3 Frontend: Carga Dinámica

```typescript
// En el layout principal del provider
function ProviderLayout() {
  const { activeModules } = useProviderModules();

  return (
    <Layout>
      <Sidebar>
        {/* Menú core (siempre visible) */}
        <NavItem to="/dashboard" icon={DashboardIcon}>Dashboard</NavItem>
        <NavItem to="/patients" icon={PatientsIcon}>Pacientes</NavItem>
        <NavItem to="/appointments" icon={CalendarIcon}>Citas</NavItem>
        <NavItem to="/billing" icon={BillingIcon}>Facturación</NavItem>

        {/* Menú de módulos (dinámico) */}
        {activeModules.map(mod => (
          <ModuleNavItems key={mod.key} module={mod} />
        ))}

        <NavItem to="/settings" icon={SettingsIcon}>Configuración</NavItem>
      </Sidebar>
      <Content>
        <Outlet />
      </Content>
    </Layout>
  );
}
```

---

## 5. Impacto en Suscripción

Los módulos pueden estar asociados a tiers de suscripción:

| Módulo | STARTER | PROFESSIONAL | ENTERPRISE |
|--------|:-------:|:------------:|:----------:|
| Core (citas, pacientes, facturación) | x | x | x |
| 1 módulo de especialidad | x | x | x |
| Módulos adicionales | - | x (hasta 3) | x (ilimitados) |
| Módulos premium (IA, analytics) | - | - | x |
