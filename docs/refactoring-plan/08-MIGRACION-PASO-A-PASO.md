# 08 - Migración Paso a Paso

## Estrategia General

La migración se hace de forma **incremental**, sin romper funcionalidad existente. Cada paso es un PR independiente que se puede testear y revertir.

---

## Fase 0: Preparación (Semanas 1-2)

### Paso 0.1: Renaming de Nomenclatura en Backend ✅ COMPLETADO

**Objetivo:** Cambiar todas las referencias de "Dentist" a "Provider" sin cambiar funcionalidad.

> **Estado:** Completado. 49 archivos modificados, 1621 inserciones, 1361 eliminaciones. Schema.prisma reescrito con todos los nuevos enums, modelos y campos (incluye Paso 0.3).

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

### Paso 0.2: Reestructuración UX Paciente-Céntrico + Renaming Frontend

> **Referencia completa:** Ver `10-UX-PACIENTE-CENTRICO.md`

**Objetivo:** Reestructurar la navegación del frontend para que sea paciente-céntrica Y renombrar toda la nomenclatura legacy (Dentist → Provider, etc.)

#### 0.2a: Reestructuración de Navegación ✅ COMPLETADO

> **Estado:** Completado. Reestructuración completa de la navegación frontend hacia modelo paciente-céntrico.
> - Creado `components/patient/PatientHeader.tsx` — Header persistente con datos de contacto, alertas médicas y acciones rápidas
> - Creado `components/patient/PatientTabsContainer.tsx` — Contenedor dinámico de tabs (core + módulos) con navegación por URL (?tab=X)
> - Movidos 7 tabs core de `components/dashboard/Patient*Tab.tsx` a `components/patient-tabs/` (SummaryTab, AppointmentsTab, TreatmentsTab, InvoicesTab, PaymentsTab, DocumentsTab, MedicalHistoryTab)
> - Movido 1 tab dental a `components/modules/dental/OdontogramsTab.tsx`
> - Archivos originales de dashboard convertidos a re-exports para compatibilidad retroactiva
> - Reescrito `pages/PatientDetailPage.tsx` usando PatientHeader + PatientTabsContainer (reemplaza antigua página de info básica)
> - Convertido `pages/PatientDashboardPage.tsx` a redirect hacia `/patients/:id`
> - Actualizado sidebar en `TenantLayout.tsx`: eliminados Odontogramas, Tratamientos, Facturas, Documentos; agregado Reportes; branding DentiCloud→MediCloud, Dentista→Profesional
> - Actualizadas rutas en `App.tsx`: deprecadas rutas module-first (redirect a /patients), mantenidas rutas de detalle, agregada ruta /reports
> - Creado placeholder `pages/ReportsPage.tsx`
> - Build compila exitosamente (TypeScript + Vite)

**Principio:** Toda acción clínica se hace desde el contexto del paciente, no desde módulos independientes.

**Cambios de navegación:**

```
Sidebar simplificado:
├── Dashboard (vista general del practice)
├── Calendario (agenda global)
├── Pacientes (LISTA PRINCIPAL → detalle con tabs)
├── Clínica (gestión consultorios)
├── Staff (gestión equipo)
├── Reportes (analíticas, incluye vista global de facturas)
├── WhatsApp/Chat (comunicaciones)
└── Configuración (settings, incluye servicios)

ELIMINADOS del sidebar:
├── ❌ Odontogramas (ahora en paciente → tab Odontogramas)
├── ❌ Planes de Tratamiento (ahora en paciente → tab Tratamientos)
├── ❌ Facturas (ahora en paciente → tab Facturas, o en Reportes para vista global)
└── ❌ Documentos (ahora en paciente → tab Documentos)
```

**Reestructuración del detalle de paciente:**

```
/patients/:id → PatientDetailPage con tabs:
├── Resumen (dashboard, métricas, alertas, timeline)
├── Citas (historial + crear nueva, pre-filled)
├── Tratamientos (módulo dental: planes de tratamiento)
├── Odontogramas (módulo dental: chart interactivo)
├── Facturas & Pagos (facturas + pagos + balance)
├── Documentos (archivos, recetas, compartidos)
├── Historia Clínica (notas, alergias, medicamentos, condiciones)
└── [Tabs dinámicos de módulos de especialidad]
```

**Migración de componentes:**
1. Fusionar `PatientDashboardPage` como nueva `PatientDetailPage`
2. Mover tabs de `components/dashboard/Patient*Tab.tsx` a `components/patient-tabs/`
3. Mover tabs de módulos a `components/modules/{especialidad}/`
4. Crear `PatientHeader` (datos + acciones rápidas, siempre visible)
5. Crear `PatientTabsContainer` (tabs core + tabs dinámicos de módulos)
6. Crear hooks: `usePatientTabs`, `useActiveModules`
7. Actualizar `TenantLayout.tsx` sidebar (eliminar items module-first)
8. Actualizar rutas en `App.tsx`
9. Deprecar páginas independientes: `NewOdontogramPage`, `NewTreatmentPlanPage`, `OdontogramsListPage`, `TreatmentPlansListPage`

#### 0.2b: Renaming de Nomenclatura en Frontend ✅ COMPLETADO

> **Estado:** Completado. Renaming completo de nomenclatura dental-específica en todo el frontend.
> - `src/services/api.ts`: Renombrados métodos (`getDentists`→`getProviders`, `getOperatories`→`getRooms`, `createOperatory`→`createRoom`, etc.) y parámetros (`dentistId`→`providerId`)
> - `src/types/index.ts`: Renombrado `DentalService`→`MedicalService`, `Operatory`→`ConsultationRoom`, `dentistId`→`providerId` en interfaces
> - `src/pages/ClinicsListPage.tsx`: Renombrado completo `Operatory`→`ConsultationRoom` (interfaz, estado, funciones, labels UI "Operatorio"→"Consultorio")
> - `src/pages/CalendarPage.tsx`: `dentistId`→`providerId`, labels "Dentista"→"Profesional"
> - `src/pages/NewAppointmentPage.tsx`: `dentistId`→`providerId`, labels "Dentista"→"Profesional"
> - `src/pages/AppointmentsListPage.tsx`: labels "Dentista"→"Profesional"
> - `src/pages/StaffListPage.tsx`: "DENTIST"→"PROVIDER", labels "Dentista"→"Profesional/Proveedor"
> - `src/pages/SuperAdminSettingsPage.tsx`: `DentiCloud`→`MediCloud`, `denticloud.com`→`medicloud.app`
> - `src/pages/ChatbotConfigPage.tsx`: placeholder "Your Dental Clinic"→"Your Medical Practice"
> - `src/components/layouts/PatientLayout.tsx`: branding `DentiCloud`→`MediCloud`
> - `src/components/layouts/PublicLayout.tsx`: "cuidado dental"→"profesionales de la salud"
> - `src/components/layouts/SuperAdminLayout.tsx`: `DentiCloud`→`MediCloud`
> - `src/pages/public/LandingPage.tsx`: "cuidado dental"→"atencion medica"
> - `src/pages/public/PublicClinicProfile.tsx`: "dental care"→"healthcare"
> - `src/pages/public/DirectoryPage.tsx`: "dentistas"→"profesionales"
> - `src/hooks/useAuth.ts`: localStorage key `denticloud_token`→`medicloud_token`
> - Verificación final: grep para `DentiCloud`, `dentista`, `getDentists`, `getOperatories` — 0 resultados
> - Build compila exitosamente (TypeScript + Vite, 0 errores)

**Archivos modificados:**

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

### Paso 0.3: Agregar nuevos enums y campos básicos ✅ COMPLETADO

> **Estado:** Completado. Migración SQL manual creada y aplicada exitosamente.
> - Migración: `20260206150000_refactoring_denticloud_to_medicloud`
> - **Nuevos enums creados:** `MedicalSpecialty`, `ConsentStatus`, `DataAccessLevel`, `ProviderPatientRelationType`
> - **UserRole enum recreado:** Eliminado `DENTIST`, agregados `PROVIDER`, `CLINIC_ADMIN`, `STAFF_MANAGER` (datos migrados automáticamente)
> - **Tablas renombradas:** `patient_dentist_relations` → `provider_patient_relations`, `dental_services` → `medical_services`, `operatories` → `consultation_rooms`, `operatory_assignments` → `room_assignments`
> - **Columnas renombradas:** `dentist_id` → `provider_id` (9 tablas), `operatory_id` → `room_id` (3 tablas), `clinic_*` → `practice_*` en chatbot_configs
> - **Nuevas columnas:** Users (specialties, bio, language, timezone), Patients (document_type, email, address, blood_type, chronic_conditions, emergency_contact_relation, default_data_access), Tenants (practice_type), Clinics (tax_id, business_hours, specialties, amenities, rental_*, is_public), ConsultationRooms (room_number, capabilities, buffer_minutes, max_daily_hours, is_shared, hourly_rate), RoomAssignments (assignment_type, rental_rate, rental_period), MedicalServices (specialty, required_capabilities, requires_room)
> - **Nuevas tablas:** `patient_consents`, `shared_documents`, `medical_exams`, `clinic_staff`, `provider_modules`
> - **Foreign keys e indexes:** Actualizados todos los constraints e indexes para reflejar nuevos nombres
> - Prisma Client regenerado, migración marcada como aplicada
>
> **Nota:** Los enums y campos del schema.prisma (Paso 0.1) fueron incluidos en esta migración.

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

### Paso 1.1: Modelo de Provider Genérico ✅ COMPLETADO

> **Estado:** Completado. Implementación completa del modelo de provider genérico multi-especialidad.
> - `backend/src/auth/dto/register.dto.ts`: Agregados campos `specialties` (MedicalSpecialty[]), `bio`, `language`, `timezone`
> - `backend/src/auth/auth.service.ts`: Registro guarda especialidades, bio, language, timezone al crear usuario PROVIDER
> - `backend/src/public/public.service.ts`: Directorio público filtrable por especialidad, endpoint de especialidades disponibles
> - `backend/src/public/public.controller.ts`: GET /public/specialties, query param `specialty` en listing de providers
> - `frontend/src/services/api.ts`: API calls con filtro de especialidad
> - `frontend/src/pages/public/DirectoryPage.tsx`: Dropdown de filtro por especialidad
> - `frontend/src/pages/public/PublicClinicProfile.tsx`: Muestra especialidades y bio del provider

1. ✅ Actualizar registro de provider para incluir especialidad
2. ✅ Crear UI de selección de especialidad al registrarse
3. ✅ Actualizar perfil público del provider
4. ✅ Directorio público filtrable por especialidad

### Paso 1.2: Paciente como Entidad Independiente ✅ COMPLETADO

> **Estado:** Completado. El paciente es ahora una entidad independiente con auto-registro, reclamación de perfil, y gestión de documentos compartidos.
> - `backend/src/patients/dto/register-patient.dto.ts`: DTO de registro independiente
> - `backend/src/patients/dto/claim-profile.dto.ts`: DTO para reclamar perfil existente
> - `backend/src/patients/dto/update-privacy.dto.ts`: DTO para nivel de acceso
> - `backend/src/patients/patients-portal.controller.ts`: Endpoints de registro, claim, providers, consents, privacidad, linking/unlinking
> - `backend/src/patients/patients-portal.service.ts`: registerIndependent, claimProfile, getMyProviders, getMyConsents, updateDefaultAccess, revokeConsent, linkProvider, acceptLink, rejectLink, unlinkProvider
> - `backend/src/patients/patients.controller.ts`: link-patient, patient-requests (provider-side)
> - `backend/src/shared-documents/`: Módulo completo de documentos compartidos (share, revoke, renew, list)
> - `backend/src/medical-exams/`: Módulo completo de exámenes médicos (upload, list, detail, delete)
> - `frontend/src/pages/patient/PatientRegisterPage.tsx`: Página de auto-registro de pacientes
> - `frontend/src/services/api.ts`: APIs de registro, claim, consent management, medical exams, shared documents

1. ✅ Crear flujo de registro de paciente independiente
2. ✅ Crear endpoint de "reclamar perfil" (paciente ya existe por cédula)
3. ✅ Implementar PatientConsent model
4. ✅ Implementar SharedDocument model (módulo completo)
5. ✅ Crear MedicalExam model (módulo completo)
6. ✅ Actualizar Patient service para respetar consentimiento

### Paso 1.3: Sistema de Consentimiento ✅ COMPLETADO

> **Estado:** Completado. Sistema de consentimiento granular con flujo completo de solicitud, aprobación, denegación y revocación.
> - `backend/src/consents/`: Módulo completo
>   - `consents.service.ts`: requestConsent, getPendingForPatient, getActiveForPatient, grantConsent, denyConsent, revokeConsent, updateConsent, getConsentHistory, checkProviderAccess, handleExpiredConsents
>   - `consents.controller.ts`: POST /consents/request, GET /consents/pending, GET /consents/active, POST /consents/:id/grant|deny|revoke, PUT /consents/:id, GET /consents/history
>   - `consent-check.middleware.ts`: Middleware que verifica nivel de acceso del provider al acceder datos de paciente
> - `backend/src/patients/patients.service.ts`: findOne respeta nivel de consentimiento (MINIMAL/CLINICAL_ONLY/FULL)
> - Audit logging en cada acción de consentimiento vía AuditLog

1. ✅ Crear ConsentService
2. ✅ Crear endpoints de consentimiento (request, grant, deny, revoke)
3. ✅ Crear middleware de verificación de consentimiento en queries de Patient
4. ✅ Implementar notificaciones de consentimiento
5. ✅ Agregar audit logging para acceso a datos

### Paso 1.4: Clínica Autónoma ✅ COMPLETADO

> **Estado:** Completado. Panel de administración de clínica con gestión de staff, consultorios, y solicitudes de alquiler.
> - `backend/src/clinic-admin/`: Módulo completo
>   - `clinic-admin.service.ts`: getDashboard, getClinic, updateClinic, getRooms, getRoomSchedule, getOccupancyReport, getRevenueReport, staff CRUD, rental approval/rejection
>   - `clinic-admin.controller.ts`: 15+ endpoints bajo /clinic-admin/
>   - DTOs: create-clinic-staff, update-clinic
> - `backend/src/casl/casl-ability.factory.ts`: Abilities para CLINIC_ADMIN (manage Clinic, ConsultationRoom, ClinicStaff, RoomAssignment)
> - `backend/src/public/public.controller.ts`: POST /public/clinics/:id/claim para reclamar clínica
> - Roles CLINIC_ADMIN y campos de alquiler ya existían desde Fase 0.3

1. ✅ Agregar CLINIC_ADMIN role (ya en enum desde Fase 0)
2. ✅ Crear ClinicStaff model (ya en DB desde Fase 0)
3. ✅ Crear panel de admin de clínica (módulo clinic-admin completo)
4. ✅ Implementar flujo de "reclamar" clínica
5. ✅ Agregar campos de alquiler a ConsultationRoom (ya en DB desde Fase 0)

### Paso 1.5: Consultorios Compartidos ✅ COMPLETADO

> **Estado:** Completado. Algoritmo de disponibilidad con intersección provider+room+capabilities y prevención de conflictos.
> - `backend/src/scheduling/`: Módulo completo
>   - `scheduling.service.ts`: getAvailableSlots (algoritmo intersección provider+room+buffer+capabilities), validateAppointmentSlot, getRoomCalendar, getClinicCalendar, requestRental
>   - `scheduling.controller.ts`: GET /scheduling/available-slots, POST /scheduling/validate-slot, GET /scheduling/room-calendar/:roomId, GET /scheduling/clinic-calendar/:clinicId, POST /scheduling/rental-request
> - `backend/src/appointments/appointments.service.ts`: Integración con SchedulingService para validar slots antes de crear citas
> - Prevención de conflictos: doble-check de provider + room + buffer + asignación

1. ✅ Actualizar RoomAssignment con tipos (ya en DB desde Fase 0)
2. ✅ Implementar algoritmo de disponibilidad (provider + room)
3. ✅ Crear vista de calendario por consultorio
4. ✅ Crear vista de calendario por clínica
5. ✅ Implementar prevención de conflictos

### Paso 1.6: Staff Flexible Multi-Provider ✅ COMPLETADO

> **Estado:** Completado. Sistema de staff multi-provider con permisos granulares y tenant switcher.
> - `backend/src/staff-management/`: Módulo completo
>   - `staff-management.service.ts`: getStaffList, inviteStaff, updateStaffRole, updateStaffPermissions, removeStaff, getStaffTenants
>   - `staff-management.controller.ts`: GET/POST /staff, PUT /staff/:id/role|permissions, DELETE /staff/:id, GET /staff/my-tenants
>   - DTOs: invite-staff, update-staff-permissions
> - `backend/src/casl/casl-ability.factory.ts`: Abilities para STAFF_MANAGER con permisos granulares basados en TenantMembership.permissions JSON
> - `frontend/src/components/layouts/TenantLayout.tsx`: Tenant switcher para staff multi-provider
> - Header X-Tenant-Id para requests de staff multi-tenant

1. ✅ Agregar STAFF_MANAGER role (ya en enum desde Fase 0)
2. ✅ Implementar permisos granulares por TenantMembership
3. ✅ Actualizar Tenant Switcher para staff multi-provider
4. ✅ Crear UI de gestión de permisos de staff

---

## Fase 2: Asistente Virtual IA (Semanas 7-9)

### Paso 2.1: Refactorizar Chatbot Existente ✅ COMPLETADO

> **Estado:** Completado. AI Agent Engine creado como servicio independiente con RAG y Message Router multi-canal.
> - `backend/src/chatbot/ai-agent.engine.ts`: Motor IA con RAG context builder (servicios, horarios, precios, FAQs, clínicas, slots disponibles), OpenAI function-calling (check_availability, schedule_appointment, cancel_appointment, identify_patient), fallback keyword-based intent classification
> - `backend/src/chatbot/message-router.service.ts`: Router multi-canal (WhatsApp/WebChat/SMS), pipeline: session → human handoff check → AI engine → quick replies, interfaces IncomingMessage/OutgoingMessage/ChatAction
> - `backend/src/chatbot/chat-session.service.ts`: Gestión de sesiones en memoria con auto-expiración 30min, dual-index por ID y sender composite key
> - `backend/src/chatbot/chatbot.service.ts`: Refactorizado para delegar a AIAgentEngine con fallback a keyword matching

1. ✅ Extraer lógica de AI del chatbot WhatsApp
2. ✅ Crear AIAgentEngine como servicio independiente
3. ✅ Implementar RAG con datos del provider
4. ✅ Crear MessageRouter para multi-canal

### Paso 2.2: Web Chat ✅ COMPLETADO

> **Estado:** Completado. WebSocket gateway con Socket.io y widget de chat embeddable en frontend.
> - `backend/src/chatbot/chat.gateway.ts`: WebSocket gateway en namespace `/chat`, eventos: connection, message, end_session, join_staff, human handoff notifications
> - `backend/src/chatbot/chat.controller.ts`: REST controller público (POST /chat/message, POST /chat/end-session) para widget sin WebSocket
> - `frontend/src/components/chat/ChatWidget.tsx`: Widget flotante con soporte de temas (blue/green/purple/red), typing indicator, quick reply actions, responsive, auto-scroll

1. ✅ Implementar WebSocket gateway (Socket.io)
2. ✅ Crear widget de chat embeddable
3. ✅ Integrar con AIAgentEngine
4. ✅ Crear UI de chat en el portal del paciente

### Paso 2.3: Configuración del Asistente ✅ COMPLETADO

> **Estado:** Completado. ChatbotConfig actualizado con soporte multi-canal, FAQs, métricas y analytics.
> - `backend/prisma/schema.prisma`: 11 nuevos campos en ChatbotConfig (enabledChannels, webChatTheme, webChatPosition, faqs, escalationEmail, escalationPhone, maxUnanswered, specialInstructions, cancellationPolicy, paymentMethods)
> - `backend/src/chatbot/dto/chatbot-config.dto.ts`: 10 nuevas propiedades con class-validator
> - `backend/src/chatbot/chatbot-config.service.ts`: System prompt incluye FAQs, instrucciones especiales, política de cancelación, métodos de pago
> - `backend/src/chatbot/chatbot-config.controller.ts`: Endpoints de métricas (GET /chatbot-config/metrics) y sesiones activas (GET /chatbot-config/sessions)
> - `backend/src/chatbot/chat-metrics.service.ts`: Analytics en memoria con conversationStart/End, logMessage, getMetrics (booking rate, handoff rate, top intents, channel breakdown)
> - `frontend/src/pages/ChatbotConfigPage.tsx`: 3 tabs (General, Channels, FAQs) con gestión de canales habilitados, tema del widget, FAQs CRUD
> - `frontend/src/services/api.ts`: webChatAPI object, campos renombrados clinic→practice

1. ✅ Actualizar ChatbotConfig para multi-canal
2. ✅ Crear UI de configuración del asistente
3. ✅ Agregar FAQs personalizables
4. ✅ Implementar métricas del chatbot

---

## Fase 3: Módulos por Especialidad (Semanas 10-15)

> **IMPORTANTE:** Todos los módulos de especialidad DEBEN seguir el patrón paciente-céntrico definido en `10-UX-PACIENTE-CENTRICO.md`. Cada módulo registra **tabs dentro del detalle de paciente**, NO crea páginas independientes.

### Paso 3.1: Framework de Módulos ✅ COMPLETADO

> **Estado:** Completado. Framework completo de módulos pluggables con backend y frontend.
> - `backend/src/modules/module-definitions.ts`: ModuleDefinition interface + 3 definiciones (dental, general-medicine, psychology) con compatibleSpecialties
> - `backend/src/modules/modules.service.ts`: getAvailableModules, getActiveModules, activateModule, deactivateModule, getModuleConfig, updateModuleConfig
> - `backend/src/modules/modules.controller.ts`: GET /modules/available|active, POST /modules/:key/activate|deactivate, PUT /modules/:key/config
> - `backend/src/modules/modules.module.ts`: NestJS module registered in AppModule
> - `frontend/src/hooks/useActiveModules.ts`: Fetch active modules from API
> - `frontend/src/hooks/usePatientTabs.ts`: Core tabs + dynamic module tabs merged by order
> - `frontend/src/modules/registry.ts`: Module registry with lazy-loaded tab components
> - `frontend/src/components/patient/PatientTabsContainer.tsx`: Refactored to use usePatientTabs() dynamic tabs
> - `frontend/src/services/api.ts`: modulesAPI added

1. ✅ Crear ProviderModule model (ya existía desde Fase 0.3)
2. ✅ Crear `ModuleDefinition` interface (incluye `patientTabs[]`)
3. ✅ Implementar ModuleRegistry (backend + frontend)
4. ✅ Implementar carga dinámica de tabs por módulo (frontend) vía `usePatientTabs` + `useActiveModules`
5. ✅ Crear API de activación/desactivación de módulos
6. ✅ Cada módulo exporta sus `patientTabs` con componentes lazy-loaded

### Paso 3.2: Módulo Dental (Migrar existente) ✅ COMPLETADO

> **Estado:** Completado. Módulo dental migrado con OdontogramsTab y TreatmentPlansTab funcionales.
> - `frontend/src/components/modules/dental/OdontogramsTab.tsx`: Reescrito con API, lista expandible, modal de creación con selector de dientes FDI y condiciones
> - `frontend/src/components/modules/dental/TreatmentPlansTab.tsx`: Nuevo, lista de planes con progreso %, status badges, modal de creación, items table expandible
> - Registrado en moduleRegistry con patientTabs (order 10, 11)

1. ✅ Reescribir OdontogramsTab conectado a API existente
2. ✅ Crear TreatmentPlansTab conectado a API existente
3. ✅ Registrar módulo dental con `patientTabs: [odontograms, treatments]`
4. ✅ Tabs aparecen dinámicamente si módulo dental está activo

### Paso 3.3: Módulo Medicina General ✅ COMPLETADO

> **Estado:** Completado. Backend completo + frontend tabs para notas clínicas SOAP y recetas.
> - `backend/prisma/schema.prisma`: Modelos ClinicalNote y Prescription agregados
> - `backend/src/modules/general-medicine/`: clinical-notes.service/controller, prescriptions.service/controller, DTOs, general-medicine.module
> - `frontend/src/components/modules/general-medicine/ClinicalNotesTab.tsx`: Lista de notas, modal SOAP (Subjetivo/Objetivo/Evaluación/Plan), signos vitales (PA, temp, peso, altura, FC, FR), diagnósticos
> - `frontend/src/components/modules/general-medicine/PrescriptionsTab.tsx`: Lista de recetas, modal con medicamentos dinámicos (nombre, dosis, frecuencia, duración, instrucciones), diagnóstico, notas

1. ✅ Crear ClinicalNote model
2. ✅ Crear Prescription model
3. ✅ Implementar `ClinicalNotesTab` (notas SOAP) como tab de paciente
4. ✅ Implementar `PrescriptionsTab` (recetas) como tab de paciente

### Paso 3.4: Módulo Psicología ✅ COMPLETADO

> **Estado:** Completado. Backend completo + frontend tabs para sesiones terapéuticas y evaluaciones psicológicas.
> - `backend/prisma/schema.prisma`: Modelos TherapySession y PsychologicalAssessment agregados
> - `backend/src/modules/psychology/`: therapy-sessions.service/controller, assessments.service/controller (con scoring PHQ-9/GAD-7), DTOs, psychology.module
> - `frontend/src/components/modules/psychology/SessionsTab.tsx`: Lista de sesiones con mood rating, risk level badges, modal de creación con tipo/duración/notas/técnicas/homework/mood/risk
> - `frontend/src/components/modules/psychology/AssessmentsTab.tsx`: PHQ-9 y GAD-7 como formularios interactivos con scoring automático, severity badges, score bar visual

1. ✅ Crear TherapySession model
2. ✅ Crear PsychologicalAssessment model
3. ✅ Implementar `SessionsTab` como tab de paciente
4. ✅ Implementar escalas (PHQ-9, GAD-7) con scoring automático

---

## Fase 4: Portal del Paciente Avanzado ✅ COMPLETADA

### Paso 4.1: Dashboard Unificado ✅ COMPLETADO

1. ✅ Rediseñar PatientLayout (8 menu items: Inicio, Citas, Providers, Exámenes, Documentos, Salud, Consentimientos, Facturas)
2. ✅ Crear dashboard con vista de todos los providers + métricas (próxima cita, providers activos, exámenes)
3. ✅ Notificaciones centralizadas (consent requests + appointment reminders 48h)
4. ✅ Sección de exámenes recientes en dashboard

> **Archivos modificados/creados:**
> - `frontend/src/components/layouts/PatientLayout.tsx`: 4 nuevos menu items con iconos (Users, FlaskConical, Heart, Shield)
> - `frontend/src/pages/patient/PatientDashboard.tsx`: Reescrito con enhanced dashboard, métricas, notificaciones
> - `backend/src/patients/patients-portal.service.ts`: getEnhancedDashboard() + getNotifications()
> - `backend/src/patients/patients-portal.controller.ts`: GET /portal/enhanced-dashboard, GET /portal/notifications

### Paso 4.2: Gestión de Exámenes ✅ COMPLETADO

1. ✅ Crear UI de upload de exámenes (modal con título, tipo, fecha, archivo, descripción, tags)
2. ✅ Implementar compartir documentos con providers (selector de provider + fecha expiración opcional)
3. ✅ Implementar compartir temporal (con expiración) via SharedDocument model
4. ✅ Crear vista de documentos compartidos (tab "Mis Compartidos" con revoke)

> **Archivos creados:**
> - `frontend/src/pages/patient/PatientExams.tsx`: Upload, listado, compartir, revocar exámenes médicos
> - `backend/src/patients/dto/share-exam.dto.ts`: ShareExamDto con providerId + expiresAt opcional
> - Backend: shareExam(), unshareExam(), getExamShares() en portal service/controller

### Paso 4.3: Perfil de Salud + Consentimientos ✅ COMPLETADO

1. ✅ Perfil de salud editable (tipo sangre, alergias, medicamentos, condiciones crónicas, contacto emergencia)
2. ✅ Gestión de consentimientos (pendientes/activos/historial con grant/deny/modify/revoke)
3. ✅ Vista de providers vinculados con niveles de acceso y tipo de relación
4. ✅ Control de privacidad (DataAccessLevel por defecto configurable)

> **Archivos creados:**
> - `frontend/src/pages/patient/PatientHealthProfile.tsx`: Perfil de salud con EditableListCard reutilizable
> - `frontend/src/pages/patient/PatientConsents.tsx`: Gestión de consentimientos con 3 secciones
> - `frontend/src/pages/patient/PatientProviders.tsx`: Lista de providers con badges de acceso
> - `backend/src/patients/dto/grant-consent.dto.ts`, `modify-consent.dto.ts`, `update-health-profile.dto.ts`
> - Backend: 7 nuevos métodos en portal service (health profile CRUD, consent grant/deny/modify)

### Paso 4.4: Futuro - IA para Exámenes

1. Integrar OCR para PDFs de exámenes
2. Usar LLM para generar resúmenes
3. Detectar valores fuera de rango
4. Mostrar resumen al paciente

---

## Fase 5: Gestión de Clínicas ✅ COMPLETADA

### Paso 5.1: Panel de Clínica ✅ COMPLETADO

1. ✅ Crear ClinicAdminLayout (sidebar emerald, 6 menu items, responsive mobile/desktop)
2. ✅ Dashboard con métricas (ocupación %, ingresos estimados, personal, solicitudes pendientes)
3. ✅ Gestión de consultorios (room cards con capabilities, horario modal con citas/asignaciones)
4. ✅ Gestión de staff (CRUD con roles RECEPTIONIST/ADMIN/MAINTENANCE, toggle inactivos)

> **Archivos creados/modificados:**
> - `frontend/src/components/layouts/ClinicAdminLayout.tsx`: Layout emerald con 6 menu items
> - `frontend/src/pages/clinic-admin/ClinicDashboard.tsx`: 4 stat cards + quick links
> - `frontend/src/pages/clinic-admin/ClinicRooms.tsx`: Room cards + schedule modal
> - `frontend/src/pages/clinic-admin/ClinicStaff.tsx`: Staff CRUD table + modals
> - `frontend/src/App.tsx`: ClinicAdminRoute guard + 6 routes + lazy imports
> - `frontend/src/casl/AbilityContext.tsx`: CLINIC_ADMIN role + 3 nuevos subjects

### Paso 5.2: Alquiler y Reportes ✅ COMPLETADO

1. ✅ Solicitudes de alquiler (approve/reject con confirm dialogs)
2. ✅ Reportes de ocupación (summary cards + tabla desglose por consultorio + barras utilización)
3. ✅ Reportes de ingresos (summary cards + tabla revenue por consultorio)
4. ✅ Configuración de clínica (info general, horarios, especialidades, amenidades, alquiler)

> **Archivos creados/modificados:**
> - `frontend/src/pages/clinic-admin/ClinicRentals.tsx`: Rental request cards con approve/reject
> - `frontend/src/pages/clinic-admin/ClinicReports.tsx`: Tabs ocupación/ingresos con date filters
> - `frontend/src/pages/clinic-admin/ClinicSettings.tsx`: 5 secciones de configuración
> - `frontend/src/services/api.ts`: clinicAdminAPI (14 methods) + schedulingAPI (5 methods)
> - `frontend/src/types/index.ts`: 12 nuevas interfaces para clinic admin

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
