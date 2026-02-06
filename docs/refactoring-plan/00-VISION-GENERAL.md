# MediCloud - Plan de Refactorización Completa

## De "DentiCloud" a "MediCloud": Plataforma Multi-Disciplina de Servicios Médicos

**Fecha:** 2026-02-06
**Versión:** 1.0

---

## 1. Visión del Producto

MediCloud no es solo una plataforma para dentistas. Es un **ecosistema de servicios médicos** donde múltiples actores independientes interactúan:

### Actores Principales

| Actor | Descripción | Puede existir sin... |
|-------|-------------|---------------------|
| **Doctor/Proveedor** | Cualquier profesional de salud (dentista, médico general, psicólogo, fisioterapeuta, etc.) | Sin clínica. Sin que sus pacientes estén registrados. |
| **Paciente** | Persona que recibe servicios médicos | Sin doctor asociado. Sin clínica. |
| **Clínica** | Establecimiento físico con consultorios | Sin doctores. Sin pacientes directos. |
| **Staff** | Personal administrativo y asistencial | Sin clínica (asociado a doctores). |

### Principios Fundamentales

1. **Independencia de actores**: Cada actor existe de forma autónoma. Las relaciones son opcionales.
2. **Paciente como ciudadano de primera clase**: El paciente es dueño de su data. Decide qué comparte y con quién.
3. **Multi-disciplina**: No solo dental. Cada especialidad tiene herramientas específicas.
4. **Consultorios compartidos**: Los consultorios son recursos que se alquilan/comparten entre doctores.
5. **IA como asistente**: Cada doctor tiene un asistente virtual para gestión de citas via chat.
6. **Staff flexible**: Un staff puede gestionar a uno o más doctores.
7. **UX Paciente-Céntrico**: La interfaz del provider es paciente-céntrica. Toda acción clínica se realiza desde el detalle del paciente (tabs), no desde módulos independientes. Los módulos de especialidad se integran como tabs dentro del paciente. Ver `10-UX-PACIENTE-CENTRICO.md`.

---

## 2. Cambios Arquitecturales Clave vs. Estado Actual

### 2.1 Lo que ya está bien (mantener)

- Stack tecnológico (NestJS + React + PostgreSQL + Redis + Prisma)
- Multi-tenancy con Row-Level Security
- Sistema de autenticación (JWT + OAuth + CASL)
- Integración WhatsApp con Baileys
- Calendar Sync (Google, Outlook, Apple)
- Sistema de notificaciones (BullMQ)
- Integración Stripe para pagos

### 2.2 Lo que debe cambiar fundamentalmente

| Aspecto | Estado Actual | Estado Deseado |
|---------|--------------|----------------|
| **Modelo de tenant** | Tenant = 1 Dentista | Tenant = 1 Proveedor de salud (cualquier disciplina) |
| **Roles** | DENTIST, STAFF_*, PATIENT | PROVIDER, CLINIC_ADMIN, STAFF_*, PATIENT (+ roles por disciplina) |
| **Paciente** | Creado por el dentista, atado a tenant | Entidad independiente, se vincula opcionalmente |
| **Clínica** | Creada por Super Admin, estática | Entidad autónoma con su propio admin, alquila consultorios |
| **Consultorios** | Asignados a dentistas fijos | Recursos compartidos con calendarios de disponibilidad |
| **Servicios** | Solo `DentalService` | `MedicalService` genérico + herramientas por especialidad |
| **Odontograma** | Herramienta core dental | Plugin/módulo de la especialidad dental |
| **Relación Dr-Paciente** | Dr tiene pacientes | Bidireccional: Dr registra paciente O paciente se vincula a Dr |
| **Data del paciente** | Visible para el tenant | Controlada por consentimiento del paciente |
| **Nomenclatura** | "Dentist", "DentalService", etc. | "Provider", "MedicalService", etc. |

---

## 3. Arquitectura de Módulos por Especialidad

### 3.1 Core (Todas las disciplinas)

- Gestión de citas y calendario
- Gestión de pacientes
- Facturación y pagos
- Documentos y archivos
- Notificaciones y comunicación
- Chatbot IA / Asistente virtual
- Reportes y analíticas

### 3.2 Módulos por Especialidad (Plugins)

| Especialidad | Herramientas Específicas |
|-------------|------------------------|
| **Odontología** | Odontograma, planes de tratamiento dental, códigos CDT |
| **Medicina General** | Historia clínica general, examen físico, recetas, referidos |
| **Psicología/Psiquiatría** | Notas SOAP, sesiones, escalas de evaluación, progreso terapéutico |
| **Fisioterapia** | Plan de ejercicios, seguimiento de rehabilitación, mediciones funcionales |
| **Dermatología** | Body mapping (fotos de lesiones), seguimiento visual, biopsias |
| **Oftalmología** | Agudeza visual, presión intraocular, fondo de ojo, receta de lentes |
| **Cardiología** | ECG, monitoreo de presión, ecocardiograma, factores de riesgo |
| **Pediatría** | Curvas de crecimiento, vacunación, desarrollo |
| **Nutrición** | Plan alimentario, medidas corporales, seguimiento de peso |
| **Ginecología** | Control prenatal, papanicolaou, ecografías |

### 3.3 Sistema de Plugins

Cada especialidad se implementa como un **módulo pluggable**:

```
/modules
  /dental          → odontograma, CDT codes, planes de tratamiento dental
  /general         → historia clínica general, recetas
  /psychology      → sesiones, escalas, notas terapéuticas
  /physiotherapy   → ejercicios, rehabilitación
  /dermatology     → body mapping, fotos
  ...
```

Un proveedor activa los módulos que necesita según su especialidad. Un proveedor multidisciplinario puede activar varios.

---

## 4. Modelo de Relaciones

```
                    ┌──────────┐
                    │ PLATFORM │
                    │ (SaaS)   │
                    └────┬─────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼─────┐  ┌─────▼─────┐  ┌────▼─────┐
    │  PROVIDER  │  │  PATIENT  │  │  CLINIC  │
    │ (Doctor)   │  │           │  │          │
    └─────┬──────┘  └─────┬─────┘  └────┬─────┘
          │               │              │
          │   ┌───────────┤              │
          │   │ Consent    │              │
          │   │ Layer      │              │
          ├───┤           │              │
          │   └───────────┘              │
          │                              │
          │        ┌─────────┐           │
          ├───────▶│  STAFF  │           │
          │        └─────────┘           │
          │                              │
          │     ┌──────────────┐         │
          └────▶│ CONSULTATION │◀────────┘
                │    ROOM      │
                └──────────────┘
```

### Relaciones Clave:

1. **Provider ↔ Patient**: Relación N:M con consentimiento granular
   - El Dr puede registrar un paciente que NO está en el sistema (datos mínimos, sin cuenta)
   - El paciente puede vincularse a un Dr (solicitud bidireccional)
   - Si el paciente no acepta la relación, el Dr aún puede tener datos locales (sin acceso a la data compartida del paciente)

2. **Provider ↔ Clinic**: Relación N:M temporal (alquiler de consultorios)
   - Un Dr atiende en múltiples clínicas
   - Una clínica tiene múltiples Drs

3. **Provider ↔ Staff**: Relación N:M
   - Un staff gestiona a múltiples Drs
   - Un Dr tiene múltiples staff

4. **Clinic ↔ Consultation Room**: Relación 1:N
   - La clínica es dueña de los consultorios
   - Los consultorios se asignan por horarios

5. **Patient ↔ Data**: El paciente es dueño
   - Puede subir exámenes médicos
   - Puede compartir datos con Drs por tiempo limitado
   - IA para resúmenes de exámenes (futuro)

---

## 5. Fases de Implementación

### Fase 0: Preparación ✅ COMPLETADA
- ✅ 0.1: Backend nomenclature + Prisma schema refactored
- ✅ 0.2a: Frontend UX patient-centric restructuring
- ✅ 0.2b: Frontend dental→generic nomenclature rename
- ✅ 0.3: Prisma DB migration applied + all TS errors fixed

### Fase 1: Core Multi-Disciplina ✅ COMPLETADA
- ✅ 1.1: Modelo de Provider genérico con especialidades (registro, perfil público, directorio filtrable)
- ✅ 1.2: Paciente como entidad independiente (auto-registro, claim profile, shared docs, medical exams)
- ✅ 1.3: Sistema de consentimiento granular (request/grant/deny/revoke, middleware, audit logging)
- ✅ 1.4: Clínica autónoma (CLINIC_ADMIN panel, staff CRUD, claim clinic, rental management)
- ✅ 1.5: Consultorios compartidos (availability algorithm, conflict prevention, room/clinic calendars)
- ✅ 1.6: Staff flexible multi-provider (granular permissions, tenant switcher, staff management)

### Fase 2: Asistente Virtual IA (2-3 semanas)
- Chatbot IA por provider (no solo WhatsApp, también web chat)
- RAG con datos del provider (horarios, servicios, precios)
- Agendamiento via chat
- Escalamiento a humano

### Fase 3: Módulos por Especialidad (4-6 semanas)
- Sistema de plugins
- Módulo dental (migrar odontograma existente)
- Módulo medicina general
- Módulo psicología
- Framework para crear nuevos módulos

### Fase 4: Portal del Paciente Avanzado (2-3 semanas)
- Dashboard unificado del paciente (todos sus proveedores)
- Carga de exámenes médicos
- Compartir datos con proveedores (con tiempo limitado)
- IA para resúmenes de exámenes (futuro)

### Fase 5: Gestión de Clínicas (2-3 semanas)
- Panel de admin de clínica
- Alquiler de consultorios
- Gestión de recursos y equipamiento
- Reportes de ocupación

---

## 6. Archivos del Plan

| Archivo | Contenido |
|---------|-----------|
| `00-VISION-GENERAL.md` | Este archivo - visión general |
| `01-MODELO-DATOS-NUEVO.md` | Nuevo esquema de base de datos |
| `02-ROLES-PERMISOS-NUEVO.md` | Sistema de roles y permisos actualizado |
| `03-SISTEMA-CONSENTIMIENTO.md` | Cómo funciona el data sharing paciente-provider |
| `04-SISTEMA-MODULOS.md` | Arquitectura de plugins por especialidad |
| `05-CONSULTORIOS-COMPARTIDOS.md` | Modelo de consultorios y scheduling |
| `06-ASISTENTE-VIRTUAL-IA.md` | Diseño del chatbot IA multi-canal |
| `07-PORTAL-PACIENTE.md` | Features del portal del paciente |
| `08-MIGRACION-PASO-A-PASO.md` | Guía detallada de migración |
| `09-API-ENDPOINTS-NUEVOS.md` | Listado de endpoints nuevos/modificados |
| `10-UX-PACIENTE-CENTRICO.md` | **Arquitectura UX paciente-céntrica del provider** |
