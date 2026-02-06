# 08 - Migración Paso a Paso

## Estrategia General

La migración se hace de forma **incremental**, sin romper funcionalidad existente. Cada paso es un PR independiente que se puede testear y revertir.

---

## Fase 0: Preparación (Semanas 1-2)

### Paso 0.1: Renaming de Nomenclatura en Backend

**Objetivo:** Cambiar todas las referencias de "Dentist" a "Provider" sin cambiar funcionalidad.

**Archivos a modificar:**

```
Backend:
├── prisma/schema.prisma
│   ├── UserRole: DENTIST → PROVIDER (agregar alias temporal)
│   ├── PatientDentistRelation → ProviderPatientRelation
│   ├── DentalService → MedicalService
│   ├── Operatory → ConsultationRoom
│   ├── OperatoryAssignment → RoomAssignment
│   ├── Todos los dentistId → providerId
│   └── Todos los operatoryId → roomId
│
├── src/patients/ (renaming en DTOs y services)
├── src/appointments/ (renaming)
├── src/clinics/ (renaming operatory → room)
├── src/services/ (dental-services → medical-services)
├── src/treatment-plans/ (renaming)
├── src/odontograms/ (se mantiene, es módulo dental)
├── src/invoices/ (renaming)
├── src/reports/ (renaming)
├── src/chatbot/ (renaming)
├── src/auth/ (roles update)
└── src/casl/ (abilities update)
```

**Migración DB:**
```sql
-- Paso 1: Renombrar tablas
ALTER TABLE patient_dentist_relations RENAME TO provider_patient_relations;
ALTER TABLE dental_services RENAME TO medical_services;
ALTER TABLE operatories RENAME TO consultation_rooms;
ALTER TABLE operatory_assignments RENAME TO room_assignments;

-- Paso 2: Renombrar columnas
ALTER TABLE provider_patient_relations RENAME COLUMN dentist_id TO provider_id;
ALTER TABLE appointments RENAME COLUMN dentist_id TO provider_id;
ALTER TABLE appointments RENAME COLUMN operatory_id TO room_id;
ALTER TABLE recurring_appointments RENAME COLUMN dentist_id TO provider_id;
ALTER TABLE recurring_appointments RENAME COLUMN operatory_id TO room_id;
ALTER TABLE waitlist RENAME COLUMN dentist_id TO provider_id;
ALTER TABLE treatment_plans RENAME COLUMN dentist_id TO provider_id;
ALTER TABLE invoices RENAME COLUMN dentist_id TO provider_id;
ALTER TABLE documents RENAME COLUMN dentist_id TO provider_id;
ALTER TABLE odontograms RENAME COLUMN dentist_id TO provider_id;
ALTER TABLE room_assignments RENAME COLUMN operatory_id TO room_id;
ALTER TABLE room_assignments RENAME COLUMN dentist_id TO provider_id;

-- Paso 3: Actualizar enum UserRole
-- (Prisma maneja esto, pero conceptualmente:)
UPDATE users SET role = 'PROVIDER' WHERE role = 'DENTIST';
```

**Tests:** Todos los tests existentes deben pasar con los nuevos nombres.

### Paso 0.2: Renaming de Nomenclatura en Frontend

**Archivos a modificar:**

```
Frontend:
├── src/types/index.ts (actualizar interfaces)
├── src/services/api.ts (actualizar endpoints)
├── src/pages/ (renaming en todos los componentes)
│   ├── Labels: "Dentista" → "Proveedor" / "Doctor"
│   ├── Variables: dentist → provider
│   └── URLs: /dentist/ → /provider/
├── src/components/ (renaming)
└── src/casl/ (abilities update)
```

### Paso 0.3: Agregar nuevos enums y campos básicos

**Sin romper nada existente, agregar:**

```prisma
// Agregar a schema.prisma
enum MedicalSpecialty { ... }
enum ConsentStatus { ... }
enum DataAccessLevel { ... }
enum ProviderPatientRelationType { ... }

// Agregar campo a Tenant
model Tenant {
  // ... campos existentes ...
  practiceType MedicalSpecialty @default(GENERAL_DENTISTRY)
}

// Agregar campos a User
model User {
  // ... campos existentes ...
  language String @default("es")
  timezone String @default("America/Santo_Domingo")
}

// Agregar campos a Patient
model Patient {
  // ... campos existentes ...
  documentType String @default("CEDULA")
  bloodType String?
  chronicConditions String[] @default([])
  defaultDataAccess DataAccessLevel @default(MINIMAL)
}

// Agregar campos a ProviderPatientRelation
model ProviderPatientRelation {
  // ... campos existentes ...
  relationType ProviderPatientRelationType @default(REGISTERED_BY_PROVIDER)
  dataAccessLevel DataAccessLevel @default(MINIMAL)
  localMedicalHistory Json?
  localAllergies String[] @default([])
  localMedications String[] @default([])
}
```

---

## Fase 1: Core Multi-Disciplina (Semanas 3-6)

### Paso 1.1: Modelo de Provider Genérico

1. Actualizar registro de provider para incluir especialidad
2. Crear UI de selección de especialidad al registrarse
3. Actualizar perfil público del provider
4. Directorio público filtrable por especialidad

### Paso 1.2: Paciente como Entidad Independiente

1. Crear flujo de registro de paciente independiente
2. Crear endpoint de "reclamar perfil" (paciente ya existe por cédula)
3. Implementar PatientConsent model
4. Implementar SharedDocument model
5. Crear MedicalExam model
6. Actualizar Patient service para respetar consentimiento

### Paso 1.3: Sistema de Consentimiento

1. Crear ConsentService
2. Crear endpoints de consentimiento (request, grant, deny, revoke)
3. Crear middleware de verificación de consentimiento en queries de Patient
4. Implementar notificaciones de consentimiento
5. Agregar audit logging para acceso a datos

### Paso 1.4: Clínica Autónoma

1. Agregar CLINIC_ADMIN role
2. Crear ClinicStaff model
3. Crear panel de admin de clínica
4. Implementar flujo de "reclamar" clínica
5. Agregar campos de alquiler a ConsultationRoom

### Paso 1.5: Consultorios Compartidos

1. Actualizar RoomAssignment con tipos (RECURRING, ONE_TIME, RENTAL)
2. Implementar algoritmo de disponibilidad (provider + room)
3. Crear vista de calendario por consultorio
4. Crear vista de calendario por clínica
5. Implementar prevención de conflictos

### Paso 1.6: Staff Flexible Multi-Provider

1. Agregar STAFF_MANAGER role
2. Implementar permisos granulares por TenantMembership
3. Actualizar Tenant Switcher para staff multi-provider
4. Crear UI de gestión de permisos de staff

---

## Fase 2: Asistente Virtual IA (Semanas 7-9)

### Paso 2.1: Refactorizar Chatbot Existente

1. Extraer lógica de AI del chatbot WhatsApp
2. Crear AIAgentEngine como servicio independiente
3. Implementar RAG con datos del provider
4. Crear MessageRouter para multi-canal

### Paso 2.2: Web Chat

1. Implementar WebSocket gateway (Socket.io)
2. Crear widget de chat embeddable
3. Integrar con AIAgentEngine
4. Crear UI de chat en el portal del paciente

### Paso 2.3: Configuración del Asistente

1. Actualizar ChatbotConfig para multi-canal
2. Crear UI de configuración del asistente
3. Agregar FAQs personalizables
4. Implementar métricas del chatbot

---

## Fase 3: Módulos por Especialidad (Semanas 10-15)

### Paso 3.1: Framework de Módulos

1. Crear ProviderModule model
2. Crear ModuleDefinition interface
3. Implementar ModuleRegistry (backend)
4. Implementar carga dinámica de módulos (frontend)
5. Crear API de activación/desactivación de módulos

### Paso 3.2: Módulo Dental (Migrar existente)

1. Mover Odontogram a /modules/dental/
2. Mover TreatmentPlan a /modules/dental/
3. Registrar módulo dental
4. Verificar que todo sigue funcionando

### Paso 3.3: Módulo Medicina General

1. Crear ClinicalNote model
2. Crear Prescription model
3. Implementar UI de notas SOAP
4. Implementar recetas con PDF
5. Implementar referidos

### Paso 3.4: Módulo Psicología

1. Crear TherapySession model
2. Crear PsychologicalAssessment model
3. Implementar UI de sesiones
4. Implementar escalas (PHQ-9, GAD-7)
5. Dashboard de progreso terapéutico

---

## Fase 4: Portal del Paciente Avanzado (Semanas 16-18)

### Paso 4.1: Dashboard Unificado

1. Rediseñar PatientLayout
2. Crear dashboard con vista de todos los providers
3. Calendario unificado de citas
4. Notificaciones centralizadas

### Paso 4.2: Gestión de Exámenes

1. Crear UI de upload de exámenes
2. Implementar compartir documentos con providers
3. Implementar compartir temporal (con expiración)
4. Crear vista de documentos compartidos conmigo (para provider)

### Paso 4.3: Futuro - IA para Exámenes

1. Integrar OCR para PDFs de exámenes
2. Usar LLM para generar resúmenes
3. Detectar valores fuera de rango
4. Mostrar resumen al paciente

---

## Fase 5: Gestión de Clínicas (Semanas 19-21)

### Paso 5.1: Panel de Clínica

1. Crear layout ClinicAdmin
2. Dashboard de ocupación
3. Gestión de consultorios
4. Gestión de staff de clínica

### Paso 5.2: Alquiler de Consultorios

1. Flujo de solicitud de alquiler
2. Aprobación por clinic admin
3. Facturación de alquiler
4. Reportes de ingresos

---

## Checklist de Migración por Paso

### Para cada paso:

- [ ] Crear branch desde main
- [ ] Escribir migración de Prisma
- [ ] Actualizar DTOs y servicios backend
- [ ] Actualizar tests backend
- [ ] Actualizar frontend (tipos, servicios, componentes)
- [ ] Verificar que todos los tests pasan
- [ ] Code review
- [ ] Merge a main
- [ ] Verificar en staging

---

## Riesgos y Mitigación

| Riesgo | Mitigación |
|--------|-----------|
| Rotura de funcionalidad existente | Cada paso es un PR pequeño con tests |
| Migración de datos | Scripts de migración reversibles |
| Performance con queries cross-tenant (paciente) | Indexes adecuados + caché Redis |
| Complejidad del scheduling compartido | Empezar simple, iterar |
| Adopción de nuevos roles | Migración automática de DENTIST → PROVIDER |
