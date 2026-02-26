# Informe de Auditoría del Codebase — MediCloud (dentista)

**Fecha:** 2026-02-26
**Alcance:** Backend (NestJS), Frontend (React/Vite), Prisma Schema, Docker, Flujos Clínicos

---

## Resumen Ejecutivo

Se identificaron **47 problemas** organizados en 7 categorías. Los más críticos son:
- **Autenticación rota** en ~30 páginas/componentes que usan `localStorage.getItem('token')` cuando el sistema usa `storage.getItem('accessToken')` con prefijo `medicloud_`
- **4 tabs de especialidad son placeholders vacíos** (Psicología y Medicina General) a pesar de tener backend completo
- **URLs hardcodeadas** `http://localhost:3000` en ~40 archivos, impidiendo deployment a producción
- **1 tab core "Historia Médica" es placeholder vacío**

---

## 1. CRÍTICO: Autenticación Rota (Token Mismatch)

### Problema
El sistema de autenticación guarda el token como `medicloud_accessToken` en localStorage (vía `storage` utility en `frontend/src/utils/storage.ts:32`), pero **~30 archivos** leen el token con `localStorage.getItem('token')`, que **siempre retorna `null`**.

Esto significa que todas las peticiones `fetch()` y `axios` directas en esos archivos **nunca envían el header Authorization**, causando errores 401 silenciosos.

### Archivos Afectados

| Archivo | Líneas | Impacto |
|---------|--------|---------|
| `frontend/src/pages/PatientDetailPage.tsx` | 42 | **Página de detalle de paciente no carga datos** |
| `frontend/src/pages/PatientsListPage.tsx` | 35, 55, 87, 113, 147 | Lista de pacientes, búsqueda, export/import CSV, delete |
| `frontend/src/pages/NewPatientPage.tsx` | 28 | **Crear paciente falla silenciosamente** |
| `frontend/src/pages/NewAppointmentPage.tsx` | 36, 51 | Crear cita falla |
| `frontend/src/pages/NewInvoicePage.tsx` | 63, 75, 122 | Crear factura falla |
| `frontend/src/pages/NewOdontogramPage.tsx` | 61, 123 | Crear odontograma falla |
| `frontend/src/pages/NewTreatmentPlanPage.tsx` | 62, 104 | Crear plan de tratamiento falla |
| `frontend/src/pages/CalendarPage.tsx` | 43, 65 | Calendario no carga, drag-drop no actualiza |
| `frontend/src/pages/AppointmentDetailPage.tsx` | 39, 55, 74 | Detalle de cita no carga |
| `frontend/src/pages/InvoiceDetailPage.tsx` | 72, 88, 120, 138 | Detalle factura, pagos, cambio status |
| `frontend/src/pages/OdontogramDetailPage.tsx` | 73, 91, 110 | Detalle odontograma, delete, editar dientes |
| `frontend/src/pages/TreatmentPlanDetailPage.tsx` | 56, 70, 87, 106 | Detalle plan, actualizar items, delete |
| `frontend/src/pages/AppointmentsListPage.tsx` | 42 | Lista de citas no carga |
| `frontend/src/pages/InvoicesListPage.tsx` | 42 | Lista de facturas no carga |
| `frontend/src/pages/DocumentsListPage.tsx` | 59, 77, 96, 137, 160 | Documentos: listar, upload, download, delete |
| `frontend/src/pages/OdontogramsListPage.tsx` | 33 | Lista odontogramas (deprecated pero accesible) |
| `frontend/src/pages/TreatmentPlansListPage.tsx` | 43 | Lista planes (deprecated pero accesible) |
| `frontend/src/components/patient-tabs/SummaryTab.tsx` | 63 | **Tab Resumen del paciente no carga** |
| `frontend/src/components/patient-tabs/AppointmentsTab.tsx` | 30 | Tab Citas del paciente no carga |
| `frontend/src/components/patient-tabs/InvoicesTab.tsx` | 42 | Tab Facturas no carga |
| `frontend/src/components/patient-tabs/PaymentsTab.tsx` | 41 | Tab Pagos no carga |
| `frontend/src/components/patient-tabs/DocumentsTab.tsx` | 33 | Tab Documentos no carga |
| `frontend/src/components/patient-tabs/TreatmentsTab.tsx` | 44 | Tab Tratamientos (no referenciado) |
| `frontend/src/pages/SuperAdminDashboard.tsx` | 31, 34 | Dashboard SuperAdmin |
| `frontend/src/pages/SuperAdminUsersPage.tsx` | 56, 70, 97, 120, 138, 159 | Gestión usuarios |
| `frontend/src/pages/SuperAdminTenantsPage.tsx` | 33 | Lista tenants |
| `frontend/src/pages/SuperAdminPlansPage.tsx` | 79, 94, 106, 124, 141, 156 | Gestión planes |
| `frontend/src/pages/SuperAdminSubscriptionsPage.tsx` | 35, 60 | Suscripciones |
| `frontend/src/pages/SuperAdminEmailConfigPage.tsx` | 60, 74, 91, 108, 121, 140 | Config email |
| `frontend/src/pages/SuperAdminEmailTemplatesPage.tsx` | 72, 87, 99, 117, 134, 149 | Templates email |
| `frontend/src/pages/SuperAdminAuditLogsPage.tsx` | 46, 60 | Audit logs |
| `frontend/src/pages/SuperAdminEmailLogsPage.tsx` | 50 | Email logs |
| `frontend/src/pages/TenantDetailPage.tsx` | 87, 106, 122, 137, 152, 169, 194, 213, 231 | Detalle tenant |

### Solución
Migrar todos estos archivos a usar la instancia `api` de `frontend/src/services/api.ts` (que ya maneja tokens automáticamente via interceptor), o al menos usar `storage.getItem('accessToken')` en lugar de `localStorage.getItem('token')`.

---

## 2. CRÍTICO: URLs Hardcodeadas a localhost

### Problema
~40 archivos tienen `http://localhost:3000/api` hardcodeado directamente en las llamadas HTTP, en lugar de usar la instancia `api` de Axios (que usa `VITE_API_URL`). Esto impide deployment a cualquier ambiente que no sea desarrollo local.

### Archivos Afectados
Todos los archivos listados en la sección 1, más:
- `frontend/src/pages/OAuthCallback.tsx:17` — usa `fetch('http://localhost:3000/api/users/profile')`

### Solución
Reemplazar todas las llamadas `fetch()` y `axios.get/post('http://localhost:3000/api/...')` con la instancia `api` importada de `services/api.ts`.

---

## 3. CRÍTICO: Tabs de Especialidad Son Placeholders Vacíos

### Problema
El backend tiene controllers, services y DTOs completos para estas especialidades, pero los componentes frontend son **stubs estáticos** que solo muestran "Próximamente":

| Tab | Archivo Frontend | Backend Completo? |
|-----|-----------------|-------------------|
| **Notas Clínicas** (Medicina General) | `frontend/src/components/modules/general-medicine/ClinicalNotesTab.tsx` | Sí — `modules/general-medicine/clinical-notes` con CRUD completo |
| **Recetas** (Medicina General) | `frontend/src/components/modules/general-medicine/PrescriptionsTab.tsx` | Sí — `modules/general-medicine/prescriptions` con CRUD completo |
| **Sesiones** (Psicología) | `frontend/src/components/modules/psychology/SessionsTab.tsx` | Sí — `modules/psychology/therapy-sessions` con CRUD completo |
| **Evaluaciones** (Psicología) | `frontend/src/components/modules/psychology/AssessmentsTab.tsx` | Sí — `modules/psychology/assessments` con CRUD + PHQ-9/GAD-7 scoring |
| **Historia Médica** (Core Tab) | `frontend/src/components/patient-tabs/MedicalHistoryTab.tsx` | N/A — sin endpoint dedicado |

### Impacto
- Un psicólogo NO puede registrar sesiones terapéuticas ni evaluaciones
- Un médico general NO puede crear notas clínicas SOAP ni recetas
- El tab "Historia Médica" siempre dice "En desarrollo"

### Solución
Implementar los componentes frontend con CRUD completo, siguiendo el patrón de los tabs funcionales (ej: `SkinLesionsTab.tsx`, `ExercisePlansTab.tsx`).

---

## 4. ALTO: Flujos Clínicos Rotos por Especialidad

### 4.1 Flujo Odontológico (Parcialmente Funcional)

**Crear Paciente → Ver Paciente → Odontograma → Plan de Tratamiento**

| Paso | Estado | Problema |
|------|--------|----------|
| Crear paciente (`/patients/new`) | ROTO | Usa `localStorage.getItem('token')` — nunca autentica |
| Listar pacientes (`/patients`) | ROTO | Mismo problema de token |
| Ver detalle paciente (`/patients/:id`) | ROTO | Usa `fetch()` con `localStorage.getItem('token')` |
| Tab Resumen | ROTO | Usa `fetch()` con `localStorage.getItem('token')` |
| Tab Citas | ROTO | Usa `fetch()` con `localStorage.getItem('token')` |
| Tab Odontograma | FUNCIONAL | Usa `api` de Axios correctamente |
| Tab Tratamientos | FUNCIONAL | Usa `api` de Axios correctamente |
| Tab Facturas | ROTO | Usa `fetch()` con `localStorage.getItem('token')` |
| Tab Pagos | ROTO | Usa `fetch()` con `localStorage.getItem('token')` |
| Tab Documentos | ROTO | Usa `fetch()` con `localStorage.getItem('token')` |

**Nota:** Aunque los tabs de Odontograma y Tratamientos funcionan correctamente con la API, el flujo está interrumpido porque **no se puede crear ni ver pacientes** (los pasos previos están rotos).

### 4.2 Flujo Fisioterapia
| Paso | Estado | Nota |
|------|--------|------|
| Tab Ejercicios | FUNCIONAL | Usa `api` correctamente |
| Tab Evaluación Funcional | FUNCIONAL | Usa `api` correctamente |

### 4.3 Flujo Dermatología
| Paso | Estado | Nota |
|------|--------|------|
| Tab Lesiones Cutáneas | FUNCIONAL | Usa `api` correctamente |

### 4.4 Flujo Oftalmología
| Paso | Estado | Nota |
|------|--------|------|
| Tab Exámenes Oculares | FUNCIONAL | Usa `api` correctamente |
| Tab Receta Óptica | FUNCIONAL | Usa `api` correctamente |

### 4.5 Flujo Cardiología
| Paso | Estado | Nota |
|------|--------|------|
| Tab Evaluación Cardíaca | FUNCIONAL | Usa `api` correctamente |

### 4.6 Flujo Pediatría
| Paso | Estado | Nota |
|------|--------|------|
| Tab Crecimiento | FUNCIONAL | Usa `api` correctamente |
| Tab Vacunas | FUNCIONAL | Usa `api` correctamente |

### 4.7 Flujo Nutrición
| Paso | Estado | Nota |
|------|--------|------|
| Tab Plan Alimentario | FUNCIONAL | Usa `api` correctamente |
| Tab Medidas Corporales | FUNCIONAL | Usa `api` correctamente |

### 4.8 Flujo Ginecología
| Paso | Estado | Nota |
|------|--------|------|
| Tab Examen Ginecológico | FUNCIONAL | Usa `api` correctamente |

### 4.9 Flujo Medicina General
| Paso | Estado | Nota |
|------|--------|------|
| Tab Notas Clínicas | PLACEHOLDER | Solo muestra "Próximamente" |
| Tab Recetas | PLACEHOLDER | Solo muestra "Próximamente" |

### 4.10 Flujo Psicología
| Paso | Estado | Nota |
|------|--------|------|
| Tab Sesiones | PLACEHOLDER | Solo muestra "Próximamente" |
| Tab Evaluaciones | PLACEHOLDER | Solo muestra "Próximamente" |

---

## 5. MEDIO: Inconsistencias de Código y Patrones Mixtos

### 5.1 Dos Patrones de HTTP Client Mezclados

El codebase usa **3 formas distintas** de hacer llamadas HTTP:

1. **`api` instance** (correcto) — instancia de Axios con interceptores de auth, refresh token y tenant. Usado por módulos de especialidad (Phase 6) y algunos componentes nuevos.
2. **`axios.get/post('http://localhost:3000/...')` con `localStorage.getItem('token')`** — llamadas Axios directas hardcodeadas. Usado por páginas SuperAdmin y varias páginas de gestión.
3. **`fetch('http://localhost:3000/...')` con `localStorage.getItem('token')`** — fetch nativo. Usado por core tabs y `PatientDetailPage`.

### 5.2 Tab `TreatmentsTab.tsx` Huérfano

- `frontend/src/components/patient-tabs/TreatmentsTab.tsx` existe pero **no está referenciado** en `usePatientTabs.ts` ni en ningún otro archivo.
- Es diferente de `dental/TreatmentPlansTab.tsx` (que sí está en el module registry).
- Este archivo es código muerto pero podría confundir a desarrolladores.

### 5.3 Dental Module: Rutas API Inconsistentes

El módulo dental tiene sus endpoints en rutas root-level:
- Odontogramas: `GET/POST /odontograms` (Controller en `backend/src/odontograms/`)
- Treatment Plans: `GET/POST /treatment-plans` (Controller en `backend/src/treatment-plans/`)

Mientras que **todos los demás módulos** usan el patrón `modules/{specialty}/{resource}`:
- `GET/POST /modules/dermatology/skin-lesions`
- `GET/POST /modules/cardiology/cardiac-assessments`
- etc.

El `module-definitions.ts` dice `apiPrefix: '/api/modules/dental'` pero los endpoints reales son `/odontograms` y `/treatment-plans`.

### 5.4 Botones "Acciones Rápidas" Sin Funcionalidad

En `SummaryTab.tsx:284-299`, los botones "Nueva Cita", "Registrar Pago", "Subir Documento" y "Nuevo Odontograma" son `<Button>` sin `onClick` handler — no hacen nada.

---

## 6. MEDIO: Problemas de Infraestructura y Configuración

### 6.1 Docker: Nomenclatura Legacy

`docker-compose.yml` usa contenedores con nombre `dentista-postgres` y `dentista-redis` en un proyecto que ahora se llama MediCloud. No es un bug funcional pero genera confusión.

### 6.2 Falta de Redis Password

`docker-compose.yml:21` — Redis no tiene contraseña configurada. En producción esto es un riesgo de seguridad.

### 6.3 Backend `.env` con Credenciales Reales

El archivo `backend/.env` está commiteado en el repositorio (debería estar en `.gitignore` con solo un `.env.example`).

### 6.4 Deprecated Crypto API

`backend/src/email/` usa `crypto.createDecipher` que fue deprecado en Node.js 22+. Debe migrarse a `crypto.createDecipheriv`.

---

## 7. BAJO: Problemas Menores y Mejoras

### 7.1 Dental Module `apiPrefix` Incorrecto

En `backend/src/modules/module-definitions.ts:52`:
```ts
apiPrefix: '/api/modules/dental',
```
Pero los endpoints reales son `/api/odontograms` y `/api/treatment-plans`. Esto puede confundir al frontend si intenta construir URLs dinámicamente basándose en `apiPrefix`.

### 7.2 Core Tabs Sin Paginación

Los tabs de paciente (Citas, Facturas, Pagos, Documentos) hacen `fetch()` sin paginación. Para pacientes con muchos registros, esto puede causar lentitud.

### 7.3 Páginas Deprecated Aún Accesibles

Las rutas en `App.tsx` redireccionan a `/patients`:
- `/treatment-plans` → redirect
- `/treatment-plans/new` → redirect
- `/odontograms` → redirect
- `/documents` → redirect
- `/invoices/new` → redirect

Pero las páginas originales aún existen como archivos:
- `OdontogramsListPage.tsx`
- `TreatmentPlansListPage.tsx`
- `NewOdontogramPage.tsx`
- `NewTreatmentPlanPage.tsx`
- `NewInvoicePage.tsx`
- `DocumentsListPage.tsx`

Estos son dead code que se puede eliminar.

### 7.4 `OAuthCallback.tsx` Usa Endpoint Incorrecto

```ts
fetch('http://localhost:3000/api/users/profile', ...)
```

No hay un endpoint `GET /users/profile` en el backend. El endpoint correcto sería `GET /users/me` o similar.

---

## Prioridad de Corrección

| # | Categoría | Prioridad | Esfuerzo | Archivos |
|---|-----------|-----------|----------|----------|
| 1 | Token mismatch + URLs hardcoded | CRÍTICO | Alto (~30 archivos) | Sección 1 + 2 |
| 2 | Tabs placeholder (Psicología + Medicina General) | CRÍTICO | Alto (4 componentes completos) | Sección 3 |
| 3 | MedicalHistoryTab placeholder | ALTO | Medio (1 componente) | Sección 3 |
| 4 | Botones sin funcionalidad en SummaryTab | MEDIO | Bajo | Sección 5.4 |
| 5 | Estandarizar rutas del módulo dental | MEDIO | Medio | Sección 5.3 |
| 6 | Eliminar dead code | BAJO | Bajo | Sección 7.3 |
| 7 | Redis password + .env + crypto deprecated | MEDIO | Bajo | Sección 6 |

---

## Conteo de Issues

- **CRÍTICO:** 3 categorías (autenticación, URLs, placeholders)
- **ALTO:** 2 (flujos clínicos rotos, historia médica)
- **MEDIO:** 5 (patrones mixtos, tabs huérfanos, rutas inconsistentes, infra, botones)
- **BAJO:** 4 (apiPrefix, paginación, dead code, OAuth)
- **Total:** 14 categorías con ~47 instancias individuales
