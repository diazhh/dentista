# 🏥 ROADMAP: Dashboard del Paciente - Centro de Administración por Tenant

## 📋 Visión General

El Dashboard del Paciente es el **centro de control** donde cada dentista puede ver toda la historia clínica y administrativa de sus pacientes. Cada tenant solo ve la información relacionada con sus propios pacientes, respetando la relación N:M (un paciente puede tener múltiples dentistas).

---

## 🎯 Objetivos

1. **Vista 360° del Paciente**: Historia clínica completa desde un solo lugar
2. **Aislamiento por Tenant**: Cada dentista solo ve datos de su relación con el paciente
3. **Gestión Integral**: Desde el dashboard se puede agendar citas, ver tratamientos, pagos, etc.
4. **Dashboard de Cita**: Vista detallada de cada cita con todo lo que ocurrió

---

## 🏗️ Arquitectura

### Ruta Principal
```
/patients/:patientId/dashboard
```

### Estructura de Tabs
```
┌─────────────────────────────────────────────────────┐
│  👤 María González - 25 años                        │
│  📧 maria@email.com | 📱 +1234567890                │
├─────────────────────────────────────────────────────┤
│  [Resumen] [Citas] [Tratamientos] [Odontogramas]   │
│  [Facturas] [Pagos] [Documentos] [Historia Médica] │
├─────────────────────────────────────────────────────┤
│                                                      │
│              CONTENIDO DEL TAB ACTIVO               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 📑 Tabs del Dashboard

### 1️⃣ **Tab: Resumen** (Vista Principal)

**Propósito**: Vista rápida del estado actual del paciente

**Contenido**:
- 📊 **Métricas Rápidas**
  - Próxima cita
  - Tratamientos activos
  - Balance pendiente
  - Última visita
  
- �� **Timeline Reciente** (últimos 30 días)
  - Citas realizadas
  - Tratamientos iniciados/completados
  - Pagos recibidos
  - Documentos subidos

- ⚠️ **Alertas y Recordatorios**
  - Tratamientos pendientes
  - Pagos vencidos
  - Citas próximas
  - Alergias importantes

- 🎯 **Acciones Rápidas**
  - ➕ Agendar Nueva Cita
  - 💳 Registrar Pago
  - 📄 Subir Documento
  - 🦷 Nuevo Odontograma

**Backend Endpoint**:
```
GET /api/patients/:patientId/dashboard/summary
```

**Response**:
```json
{
  "metrics": {
    "nextAppointment": { "date": "2026-01-10", "time": "10:00", "type": "Limpieza" },
    "activeTreatments": 2,
    "pendingBalance": 500.00,
    "lastVisit": "2025-12-20"
  },
  "recentTimeline": [...],
  "alerts": [...],
  "quickStats": {...}
}
```

---

### 2️⃣ **Tab: Citas**

**Propósito**: Gestión completa de citas del paciente

**Contenido**:
- 📅 **Lista de Citas** (filtrable por estado/fecha)
  - Próximas citas
  - Historial de citas
  - Citas canceladas
  
- 🔍 **Filtros**:
  - Por estado: Scheduled, Completed, Cancelled, No Show
  - Por rango de fechas
  - Por tipo de cita

- 📝 **Cada Cita Muestra**:
  - Fecha y hora
  - Estado (badge con color)
  - Tipo de cita
  - Duración
  - Consultorio
  - Botón "Ver Detalles" → Abre Dashboard de Cita

- ➕ **Botón**: "Agendar Nueva Cita"

**Backend Endpoint**:
```
GET /api/patients/:patientId/appointments?status=&startDate=&endDate=
```

---

### 3️⃣ **Dashboard de Cita Individual** (Modal/Página)

**Ruta**: `/patients/:patientId/appointments/:appointmentId`

**Propósito**: Vista detallada de TODO lo que ocurrió en una cita específica

**Contenido**:

#### 📋 **Información General**
- Fecha y hora
- Duración real vs programada
- Estado
- Consultorio
- Dentista asignado

#### 🦷 **Procedimientos Realizados**
- Lista de procedimientos
- Dientes tratados
- Códigos de procedimiento
- Costos

#### 💊 **Prescripciones y Recetas**
- Medicamentos recetados
- Dosis
- Duración del tratamiento
- Instrucciones especiales

#### 📝 **Notas Clínicas**
- Diagnóstico
- Observaciones del dentista
- Síntomas reportados
- Recomendaciones

#### 💰 **Información Financiera**
- Costo total de la cita
- Pagos realizados en la cita
- Balance pendiente
- Link a factura asociada

#### 📸 **Imágenes y Documentos**
- Radiografías tomadas
- Fotos clínicas
- Documentos generados

#### 🔗 **Relaciones**
- Plan de tratamiento asociado
- Odontograma actualizado
- Factura generada
- Próxima cita recomendada

**Backend Endpoint**:
```
GET /api/patients/:patientId/appointments/:appointmentId/details
```

**Response**:
```json
{
  "appointment": {...},
  "procedures": [...],
  "prescriptions": [...],
  "clinicalNotes": {...},
  "financial": {...},
  "media": [...],
  "relatedRecords": {...}
}
```

---

### 4️⃣ **Tab: Tratamientos**

**Propósito**: Planes de tratamiento activos y completados

**Contenido**:
- 📊 **Lista de Planes de Tratamiento**
  - Estado: Pending, In Progress, Completed, Cancelled
  - Progreso visual (barra de progreso)
  - Fecha de inicio/fin
  - Costo total vs pagado

- 📝 **Detalle de Cada Plan**:
  - Items del tratamiento
  - Procedimientos completados vs pendientes
  - Dientes involucrados
  - Notas del dentista
  - Citas asociadas

- ➕ **Botón**: "Nuevo Plan de Tratamiento"

**Backend Endpoint**:
```
GET /api/patients/:patientId/treatment-plans
GET /api/patients/:patientId/treatment-plans/:planId
```

---

### 5️⃣ **Tab: Odontogramas**

**Propósito**: Historial de odontogramas del paciente

**Contenido**:
- 📅 **Lista de Odontogramas** (ordenados por fecha)
  - Fecha de creación
  - Dentista que lo creó
  - Número de dientes con condiciones
  - Botón "Ver Detalle"

- 🦷 **Vista de Odontograma**:
  - Visualización interactiva
  - Leyenda de condiciones
  - Notas generales
  - Notas por diente
  - Comparación con odontogramas anteriores

- ➕ **Botón**: "Nuevo Odontograma"

**Backend Endpoint**:
```
GET /api/patients/:patientId/odontograms
GET /api/patients/:patientId/odontograms/:odontogramId
```

---

### 6️⃣ **Tab: Facturas**

**Propósito**: Gestión de facturación del paciente

**Contenido**:
- 💳 **Resumen Financiero**
  - Total facturado
  - Total pagado
  - Balance pendiente
  - Facturas vencidas

- 📄 **Lista de Facturas**
  - Número de factura
  - Fecha de emisión
  - Monto total
  - Balance pendiente
  - Estado: Draft, Sent, Paid, Overdue, Cancelled
  - Botón "Ver Detalle"

- 🔍 **Filtros**:
  - Por estado
  - Por rango de fechas
  - Por monto

- ➕ **Botón**: "Nueva Factura"

**Backend Endpoint**:
```
GET /api/patients/:patientId/invoices/summary
GET /api/patients/:patientId/invoices
```

---

### 7️⃣ **Tab: Pagos**

**Propósito**: Historial de pagos del paciente

**Contenido**:
- 💰 **Historial de Pagos**
  - Fecha de pago
  - Monto
  - Método de pago
  - Factura asociada
  - Recibo (descargable)

- 📊 **Estadísticas**
  - Total pagado (histórico)
  - Método de pago más usado
  - Promedio de pago

- ➕ **Botón**: "Registrar Pago"

**Backend Endpoint**:
```
GET /api/patients/:patientId/payments
POST /api/patients/:patientId/payments
```

---

### 8️⃣ **Tab: Documentos**

**Propósito**: Repositorio de documentos del paciente

**Contenido**:
- 📁 **Categorías de Documentos**:
  - Radiografías
  - Fotos clínicas
  - Recetas
  - Consentimientos
  - Laboratorio
  - Seguros
  - Reportes
  - Otros

- 📄 **Lista de Documentos**
  - Nombre del archivo
  - Tipo
  - Fecha de subida
  - Tamaño
  - Tags
  - Botones: Ver, Descargar, Eliminar

- 🔍 **Búsqueda y Filtros**:
  - Por tipo
  - Por fecha
  - Por tags

- ➕ **Botón**: "Subir Documento"

**Backend Endpoint**:
```
GET /api/patients/:patientId/documents?type=&tags=
POST /api/patients/:patientId/documents
```

---

### 9️⃣ **Tab: Historia Médica**

**Propósito**: Información médica general del paciente

**Contenido**:
- 🩺 **Información Personal**
  - Datos demográficos
  - Contacto de emergencia
  - Seguro médico

- ⚕️ **Historia Médica**
  - Alergias (destacadas)
  - Medicamentos actuales
  - Condiciones médicas
  - Cirugías previas
  - Historial familiar

- 📝 **Notas Generales**
  - Observaciones importantes
  - Preferencias del paciente
  - Restricciones

- ✏️ **Botón**: "Editar Información"

**Backend Endpoint**:
```
GET /api/patients/:patientId/medical-history
PUT /api/patients/:patientId/medical-history
```

---

## 🔐 Seguridad y Aislamiento por Tenant

### Reglas de Acceso:
1. ✅ El dentista solo ve datos de pacientes con relación activa (`PatientDentistRelation.isActive = true`)
2. ✅ Todas las queries filtran por `dentistId` del usuario autenticado
3. ✅ No se pueden ver datos de otros tenants
4. ✅ Los pacientes compartidos entre dentistas ven datos aislados por tenant

### Validación Backend:
```typescript
// Middleware de validación
async validatePatientAccess(dentistId: string, patientId: string) {
  const relation = await prisma.patientDentistRelation.findFirst({
    where: {
      patientId,
      dentistId,
      isActive: true
    }
  });
  
  if (!relation) {
    throw new ForbiddenException('No access to this patient');
  }
}
```

---

## 📊 Endpoints Backend Necesarios

### Dashboard Summary
```
GET /api/patients/:patientId/dashboard/summary
```

### Appointments
```
GET /api/patients/:patientId/appointments
GET /api/patients/:patientId/appointments/:appointmentId/details
POST /api/patients/:patientId/appointments
```

### Treatment Plans
```
GET /api/patients/:patientId/treatment-plans
GET /api/patients/:patientId/treatment-plans/:planId
```

### Odontograms
```
GET /api/patients/:patientId/odontograms
GET /api/patients/:patientId/odontograms/:odontogramId
```

### Invoices & Payments
```
GET /api/patients/:patientId/invoices/summary
GET /api/patients/:patientId/invoices
GET /api/patients/:patientId/payments
POST /api/patients/:patientId/payments
```

### Documents
```
GET /api/patients/:patientId/documents
POST /api/patients/:patientId/documents
DELETE /api/patients/:patientId/documents/:documentId
```

### Medical History
```
GET /api/patients/:patientId/medical-history
PUT /api/patients/:patientId/medical-history
```

---

## 🎨 Componentes Frontend

### Componentes Principales:
1. `PatientDashboardLayout.tsx` - Layout principal con tabs
2. `PatientSummaryTab.tsx` - Tab de resumen
3. `PatientAppointmentsTab.tsx` - Tab de citas
4. `AppointmentDetailModal.tsx` - Dashboard de cita individual
5. `PatientTreatmentsTab.tsx` - Tab de tratamientos
6. `PatientOdontogramsTab.tsx` - Tab de odontogramas
7. `PatientInvoicesTab.tsx` - Tab de facturas
8. `PatientPaymentsTab.tsx` - Tab de pagos
9. `PatientDocumentsTab.tsx` - Tab de documentos
10. `PatientMedicalHistoryTab.tsx` - Tab de historia médica

### Componentes Reutilizables:
- `MetricCard.tsx` - Tarjetas de métricas
- `TimelineItem.tsx` - Items del timeline
- `AlertBanner.tsx` - Banners de alertas
- `QuickActionButton.tsx` - Botones de acciones rápidas
- `StatusBadge.tsx` - Badges de estado
- `ProgressBar.tsx` - Barras de progreso

---

## 📅 Plan de Implementación

### Sprint 1: Backend Foundation (3-4 días) ✅ COMPLETADO
- [x] Crear endpoints de dashboard summary
- [x] Crear endpoint de appointment details
- [x] Agregar validación de acceso por tenant
- [x] Crear DTOs y servicios necesarios

### Sprint 2: Frontend Layout (2-3 días) ✅ COMPLETADO
- [x] Crear PatientDashboardLayout con tabs
- [x] Implementar PatientSummaryTab
- [x] Implementar PatientAppointmentsTab
- [x] Crear estructura de tabs

### Sprint 3: Tabs Restantes (3-4 días) ✅ COMPLETADO
- [x] Implementar PatientTreatmentsTab con datos reales
- [x] Implementar PatientOdontogramsTab (placeholder)
- [x] Implementar PatientInvoicesTab con resumen financiero
- [x] Implementar PatientPaymentsTab con estadísticas

### Sprint 4: Finalización (2-3 días) 🔄 EN PROGRESO
- [x] Implementar PatientDocumentsTab con filtros por categoría
- [x] Implementar PatientMedicalHistoryTab (placeholder)
- [x] Agregar ruta en App.tsx
- [ ] Instalar componentes UI faltantes (shadcn/ui)
- [ ] Implementar modal de detalles de cita
- [ ] Conectar acciones rápidas
- [ ] Testing y refinamiento

---

## 🧪 Datos de Prueba Necesarios

Para probar completamente el dashboard, necesitamos:

1. **5-10 Pacientes** con datos completos
2. **20-30 Citas** en diferentes estados
3. **5-10 Planes de Tratamiento** activos y completados
4. **10-15 Odontogramas** con diferentes condiciones
5. **15-20 Facturas** en diferentes estados
6. **20-30 Pagos** con diferentes métodos
7. **20-30 Documentos** de diferentes tipos
8. **Relaciones N:M** - Algunos pacientes compartidos entre dentistas

---

## ✅ Criterios de Éxito

1. ✅ El dentista puede ver toda la historia del paciente desde un solo lugar
2. ✅ Cada tab carga rápido y muestra información relevante
3. ✅ El aislamiento por tenant funciona correctamente
4. ✅ Las acciones rápidas funcionan (agendar cita, registrar pago, etc.)
5. ✅ El dashboard de cita muestra todos los detalles relevantes
6. ✅ La navegación entre tabs es fluida
7. ✅ Los filtros y búsquedas funcionan correctamente
8. ✅ Responsive design para tablets

---

---

## 🏥 Módulo de Clínicas y Consultorios (Tenant)

### 📋 Contexto del Modelo de Negocio

Según el modelo de DentiCloud:
- **Clínicas** son creadas por Super Admin
- **Consultorios** pertenecen a clínicas y son espacios físicos compartidos
- **Varios dentistas pueden compartir UN consultorio** según horarios
- Los dentistas (tenants) se asignan a consultorios mediante `OperatoryAssignment`

### 🎯 Funcionalidades para el Tenant

#### 1️⃣ **Vista de Clínicas Disponibles** (Solo Lectura)
El dentista puede ver las clínicas donde tiene consultorios asignados.

**Endpoint Backend:**
```
GET /api/clinics/my-clinics
```

**Response:**
```json
{
  "clinics": [
    {
      "id": "uuid",
      "name": "Clínica Dental ABC",
      "address": {...},
      "phone": "+1234567890",
      "email": "info@clinicaabc.com",
      "operatories": [
        {
          "id": "uuid",
          "name": "Consultorio 1",
          "floor": 2,
          "equipment": {...}
        }
      ]
    }
  ]
}
```

#### 2️⃣ **Gestión de Consultorios Asignados**

El dentista puede:
- Ver sus consultorios asignados
- Ver horarios de disponibilidad
- Ver equipamiento disponible
- **NO puede crear/editar clínicas** (solo Super Admin)

**Endpoints Backend:**
```
GET /api/operatories/my-assignments
GET /api/operatories/:id/schedule
GET /api/operatories/:id/availability?date=YYYY-MM-DD
```

#### 3️⃣ **Asignación de Consultorios a Citas**

Al crear una cita, el dentista puede:
- Seleccionar el consultorio donde se realizará
- Ver disponibilidad del consultorio
- Validar conflictos de horarios

**Modificación en Appointment:**
- El campo `operatoryId` ya existe en el modelo
- Debe ser obligatorio al crear citas
- Validar que el dentista tenga acceso al consultorio

#### 4️⃣ **Dashboard de Consultorio**

Vista para cada consultorio asignado mostrando:
- **Calendario de citas** del consultorio
- **Dentistas asignados** y sus horarios
- **Equipamiento disponible**
- **Estadísticas de uso**

**Ruta Frontend:**
```
/operatories/:operatoryId/dashboard
```

### 📊 Componentes del Dashboard de Consultorio

#### Tab: Información General
- Nombre y ubicación del consultorio
- Clínica a la que pertenece
- Piso y descripción
- Equipamiento (JSON)

#### Tab: Calendario
- Vista de todas las citas en el consultorio
- Filtro por dentista
- Vista día/semana/mes
- Indicador de disponibilidad

#### Tab: Horarios de Asignación
- Tabla con horarios por día de la semana
- Dentistas asignados en cada franja horaria
- Validación de conflictos

#### Tab: Estadísticas
- Tasa de ocupación
- Citas por dentista
- Horas más ocupadas
- Tiempo promedio por cita

### 🔧 Implementación Técnica

#### Backend: Nuevos Endpoints

```typescript
// Clínicas del tenant
GET /api/clinics/my-clinics
Response: Lista de clínicas donde el dentista tiene consultorios

// Consultorios asignados
GET /api/operatories/my-assignments
Response: Lista de OperatoryAssignment del dentista

// Horarios de consultorio
GET /api/operatories/:id/schedule
Response: Horarios configurados (JSON schedule)

// Disponibilidad de consultorio
GET /api/operatories/:id/availability?date=YYYY-MM-DD&duration=60
Response: Franjas horarias disponibles

// Citas por consultorio
GET /api/operatories/:id/appointments?startDate=&endDate=
Response: Todas las citas del consultorio en el rango

// Estadísticas de consultorio
GET /api/operatories/:id/statistics?startDate=&endDate=
Response: Métricas de uso del consultorio
```

#### Frontend: Nuevos Componentes

```typescript
// Páginas
- OperatoriesListPage.tsx          // Lista de consultorios asignados
- OperatoryDashboardPage.tsx       // Dashboard de consultorio individual
- OperatoryCalendarPage.tsx        // Calendario del consultorio

// Componentes
- OperatoryCard.tsx                // Tarjeta de consultorio
- OperatorySelector.tsx            // Selector para citas
- OperatoryScheduleView.tsx        // Vista de horarios
- OperatoryAvailability.tsx        // Indicador de disponibilidad
- OperatoryStatistics.tsx          // Gráficos de estadísticas
```

#### Modificaciones en Citas

**Formulario de Nueva Cita:**
```typescript
// Agregar campo obligatorio
<OperatorySelector
  clinics={myClinics}
  selectedOperatoryId={formData.operatoryId}
  appointmentDate={formData.appointmentDate}
  duration={formData.duration}
  onChange={(operatoryId) => setFormData({...formData, operatoryId})}
/>
```

**Validación Backend:**
```typescript
async validateOperatoryAvailability(
  operatoryId: string,
  dentistId: string,
  appointmentDate: Date,
  duration: number
) {
  // 1. Verificar que el dentista tenga asignado el consultorio
  // 2. Verificar que esté en el horario asignado
  // 3. Verificar que no haya conflictos con otras citas
  // 4. Retornar true/false
}
```

### 🗺️ Integración con Dashboard del Paciente

#### En el Tab de Citas del Paciente:
Mostrar el consultorio donde se realizó/realizará cada cita:
```
📅 15 Ene 2026, 10:00 AM
🏥 Clínica Dental ABC - Consultorio 2
👨‍⚕️ Dr. John Smith
⏱️ 60 minutos
```

#### En el Dashboard de Cita Individual:
Agregar sección de ubicación:
```typescript
// Información de Ubicación
- Clínica: Clínica Dental ABC
- Consultorio: Consultorio 2 (Piso 2)
- Dirección: 123 Main Street, New York
- Equipamiento: Sillón Adec 500, Rayos X Digital
```

### 📅 Plan de Implementación - Clínicas y Consultorios

#### Sprint 5: Backend - Consultorios (2-3 días)
- [ ] Endpoint GET /api/clinics/my-clinics
- [ ] Endpoint GET /api/operatories/my-assignments
- [ ] Endpoint GET /api/operatories/:id/schedule
- [ ] Endpoint GET /api/operatories/:id/availability
- [ ] Endpoint GET /api/operatories/:id/appointments
- [ ] Endpoint GET /api/operatories/:id/statistics
- [ ] Validación de disponibilidad de consultorio
- [ ] Middleware de acceso a consultorios

#### Sprint 6: Frontend - Consultorios (3-4 días)
- [ ] OperatoriesListPage - Lista de consultorios
- [ ] OperatoryDashboardPage - Dashboard individual
- [ ] OperatorySelector - Selector para citas
- [ ] OperatoryScheduleView - Vista de horarios
- [ ] OperatoryStatistics - Gráficos
- [ ] Integración en formulario de citas
- [ ] Mostrar consultorio en lista de citas

#### Sprint 7: Integración Dashboard Paciente (1-2 días)
- [ ] Agregar consultorio en tab de citas del paciente
- [ ] Agregar ubicación en dashboard de cita individual
- [ ] Mostrar mapa de ubicación (opcional)
- [ ] Testing completo de flujo

### ✅ Criterios de Éxito - Módulo de Consultorios

1. ✅ El dentista puede ver sus clínicas y consultorios asignados
2. ✅ Al crear una cita, se selecciona el consultorio obligatoriamente
3. ✅ El sistema valida disponibilidad del consultorio
4. ✅ El sistema previene conflictos de horarios
5. ✅ El dashboard de consultorio muestra todas las citas
6. ✅ Las estadísticas reflejan el uso real del consultorio
7. ✅ El paciente ve en qué consultorio fue/será atendido
8. ✅ La integración con el dashboard del paciente es fluida

### 🔒 Reglas de Negocio - Consultorios

1. **Acceso a Consultorios:**
   - Solo dentistas con `OperatoryAssignment` activo pueden usar el consultorio
   - Super Admin puede ver todos los consultorios

2. **Asignación de Citas:**
   - Una cita DEBE tener un `operatoryId`
   - El consultorio debe estar disponible en ese horario
   - El dentista debe tener asignado el consultorio

3. **Horarios:**
   - Los horarios se definen en `OperatoryAssignment.schedule` (JSON)
   - Formato: `{ monday: { start: "09:00", end: "17:00" }, ... }`
   - Se valida contra estos horarios al crear citas

4. **Conflictos:**
   - No se permiten dos citas en el mismo consultorio al mismo tiempo
   - Validación en backend antes de crear/actualizar cita

5. **Visualización:**
   - El dentista solo ve sus propias citas en el consultorio
   - El Super Admin ve todas las citas de todos los dentistas

---

## 🚀 Próximos Pasos Actualizados

1. **Revisar y aprobar este roadmap extendido**
2. **Implementar Sprint 1-4: Dashboard del Paciente**
3. **Implementar Sprint 5-6: Módulo de Consultorios**
4. **Implementar Sprint 7: Integración completa**
5. **Testing end-to-end de todo el flujo**

---

**Fecha de Creación**: 2026-01-05  
**Última Actualización**: 2026-01-05 (Implementación en Progreso)  
**Estado**: 🔄 Sprint 4 - Finalización en Progreso

---

## 📊 RESUMEN DE IMPLEMENTACIÓN ACTUAL (2026-01-05)

### ✅ Backend Completado (100%)

**Archivos Creados:**
- `backend/src/patients/dto/dashboard-summary.dto.ts` - DTOs para métricas y timeline
- `backend/src/patients/dto/appointment-detail.dto.ts` - DTOs para vista detallada de citas
- `backend/src/patients/patients-dashboard.service.ts` - Servicio con lógica de negocio
- `backend/src/patients/patients.controller.ts` - 2 endpoints nuevos agregados

**Endpoints Implementados:**
1. `GET /api/patients/:id/dashboard/summary` - Métricas, timeline, alertas y estadísticas
2. `GET /api/patients/:id/appointments/:appointmentId/details` - Detalles completos de cita

**Características:**
- ✅ Validación de acceso por tenant (PatientDentistRelation)
- ✅ Métricas: próxima cita, tratamientos activos, balance pendiente, última visita
- ✅ Timeline de últimos 30 días (citas, pagos, documentos)
- ✅ Alertas inteligentes (facturas vencidas, citas próximas, alergias)
- ✅ Estadísticas rápidas (total citas, tratamientos, pagos, documentos)
- ✅ Vista detallada de cita con procedimientos, prescripciones, notas, financiero, media

### ✅ Frontend Completado (85%)

**Archivos Creados:**
- `frontend/src/pages/PatientDashboardPage.tsx` - Layout principal con 8 tabs
- `frontend/src/components/dashboard/PatientSummaryTab.tsx` - Tab resumen con métricas y timeline
- `frontend/src/components/dashboard/PatientAppointmentsTab.tsx` - Lista de citas con filtros
- `frontend/src/components/dashboard/PatientTreatmentsTab.tsx` - Planes de tratamiento con progreso
- `frontend/src/components/dashboard/PatientOdontogramsTab.tsx` - Placeholder
- `frontend/src/components/dashboard/PatientInvoicesTab.tsx` - Facturas con resumen financiero
- `frontend/src/components/dashboard/PatientPaymentsTab.tsx` - Historial de pagos con estadísticas
- `frontend/src/components/dashboard/PatientDocumentsTab.tsx` - Documentos con filtros por categoría
- `frontend/src/components/dashboard/PatientMedicalHistoryTab.tsx` - Placeholder

**Ruta Agregada:**
- `/patients/:patientId/dashboard` en `App.tsx`

**Tabs Implementados:**
1. **Resumen** ✅ - Métricas, timeline, alertas, acciones rápidas, estadísticas
2. **Citas** ✅ - Lista con filtros por estado/fecha, badges de estado
3. **Tratamientos** ✅ - Planes con barra de progreso, items completados/pendientes
4. **Odontogramas** 🔄 - Placeholder (pendiente implementación completa)
5. **Facturas** ✅ - Resumen financiero (4 cards), lista con estados y vencimientos
6. **Pagos** ✅ - Estadísticas (total, promedio, método más usado), historial completo
7. **Documentos** ✅ - Filtros por categoría (8 tipos), vista con tags y acciones
8. **Historia Médica** 🔄 - Placeholder (pendiente implementación completa)

### 🔄 Pendiente para Completar Sprint 4

1. **Componentes UI** - Los tabs usan componentes de shadcn/ui que necesitan instalarse:
   - `Card`, `CardContent`, `CardHeader`, `CardTitle`
   - `Button` con variantes
   - `Badge`
   - `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

2. **Modal de Detalles de Cita** - Implementar modal que use el endpoint `/appointments/:id/details`

3. **Acciones Rápidas** - Conectar botones:
   - "Agendar Nueva Cita" → Formulario de citas
   - "Registrar Pago" → Formulario de pagos
   - "Subir Documento" → Formulario de documentos
   - "Nuevo Odontograma" → Formulario de odontogramas

4. **Testing** - Probar flujo completo con datos reales

### 🎯 Próximos Pasos Inmediatos

1. Verificar/instalar componentes UI de shadcn/ui
2. Implementar modal de detalles de cita
3. Conectar acciones rápidas a formularios existentes
4. Probar dashboard con usuario dentista y datos de prueba
5. Implementar tabs de Odontogramas e Historia Médica con datos reales

---

## 🏢 MÓDULO COMPLETO: Sistema de Consultorios y Gestión de Horarios

### 🎯 Filosofía del Sistema

El sistema debe soportar la realidad de las prácticas dentales modernas:
- **Dentistas con consultorio propio** que pueden compartirlo
- **Dentistas que alquilan** en clínicas por días/horarios
- **Múltiples dentistas compartiendo** el mismo consultorio
- **Dentistas multi-ubicación** que trabajan en varios lugares
- **Pacientes que eligen** dónde y cuándo ver a su doctor

### 📋 Escenarios Reales de Uso

#### **Escenario 1: Dentista con Consultorio Propio**
```
Dr. Juan Pérez:
├─ Tiene su consultorio privado
├─ Ubicación: Calle 123, Oficina 5
├─ Horario: Lun-Vie 8am-6pm, Sáb 9am-2pm
└─ Puede compartirlo con otros dentistas si quiere
```

#### **Escenario 2: Dentista Alquila en Clínica**
```
Dra. María García:
├─ Alquila Consultorio 2 en "Clínica Dental ABC"
├─ Horario: Lun-Mie-Vie 9am-5pm
├─ Paga renta mensual a la clínica
└─ Otros dentistas usan el mismo consultorio otros días
```

#### **Escenario 3: Consultorios Compartidos**
```
Consultorio compartido entre 3 dentistas:
├─ Dr. Smith: Lun-Mar 8am-4pm
├─ Dra. López: Mie-Jue 8am-4pm
└─ Dr. Ramírez: Vie 8am-4pm, Sáb 9am-2pm
```

#### **Escenario 4: Dentista Multi-Ubicación**
```
Dr. Carlos Ruiz trabaja en:
├─ Su consultorio propio: Lun-Mie 8am-2pm
├─ Clínica ABC: Mie 3pm-8pm, Jue 8am-5pm
└─ Clínica XYZ: Vie 8am-5pm
```

### 🔑 Conceptos Clave del Sistema

#### **1. Propiedad del Consultorio**

**Tipos de Propiedad:**
- `DENTIST_OWNED`: El dentista es dueño/alquila el espacio físico
- `CLINIC_OWNED`: La clínica es dueña, alquila a dentistas
- `SHARED_OWNERSHIP`: Varios dentistas co-propietarios

**Tipos de Relación (OperatoryAssignment):**
- `OWNER`: Propietario del consultorio (control total)
- `RENTER`: Alquila el consultorio de una clínica
- `SHARED`: Co-propietario con otros dentistas
- `GUEST`: Invitado por el propietario (uso temporal)

#### **2. Gestión de Horarios**

**Horario Base (`schedule` en OperatoryAssignment):**
```json
{
  "monday": { "start": "08:00", "end": "17:00" },
  "tuesday": { "start": "08:00", "end": "17:00" },
  "wednesday": { "start": "08:00", "end": "17:00" },
  "thursday": null,  // No trabaja este día
  "friday": { "start": "08:00", "end": "15:00" },
  "saturday": { "start": "09:00", "end": "14:00" },
  "sunday": null
}
```

**Reglas de Horarios:**
1. **Sin Solapamiento**: Dos dentistas NO pueden tener horarios que se solapen en el mismo consultorio
2. **Dentro del Horario Base**: Las citas solo se pueden agendar dentro del horario asignado
3. **Validación en Tiempo Real**: Al agendar, el sistema verifica disponibilidad
4. **Bloqueos Temporales**: Vacaciones, días libres, eventos especiales

#### **3. Vista del Paciente**

El paciente debe poder:
1. ✅ Ver en qué ubicaciones atiende su doctor
2. ✅ Ver los horarios disponibles en cada ubicación
3. ✅ Elegir dónde quiere ser atendido
4. ✅ Ver disponibilidad en tiempo real
5. ✅ Recibir sugerencias de horarios alternativos

### 📊 Modelo de Datos Actualizado

#### **Modificación al Schema de Operatory**

```prisma
model Operatory {
  id          String  @id @default(uuid())
  name        String
  
  // CAMBIO: clinicId ahora es opcional
  clinicId    String?  @map("clinic_id")
  floor       Int      @default(0) // 0 = sin piso (consultorio propio)
  
  // NUEVO: Tipo de propiedad
  ownershipType OperatoryOwnership @default(DENTIST_OWNED)
  
  // NUEVO: Propietario principal (si es DENTIST_OWNED)
  primaryOwnerId String? @map("primary_owner_id")
  
  // NUEVO: Dirección (si no tiene clínica)
  address     Json?  // { street, city, state, zipCode, country }
  
  description String?
  isActive    Boolean @default(true) @map("is_active")
  equipment   Json?
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  clinic               Clinic?               @relation(fields: [clinicId], references: [id])
  operatoryAssignments OperatoryAssignment[]
  appointments         Appointment[]
  
  @@index([clinicId])
  @@index([primaryOwnerId])
  @@map("operatories")
}

enum OperatoryOwnership {
  DENTIST_OWNED   // Consultorio propio del dentista
  CLINIC_OWNED    // Consultorio de clínica
  SHARED_OWNERSHIP // Co-propiedad entre dentistas
}
```

#### **Modificación al Schema de OperatoryAssignment**

```prisma
model OperatoryAssignment {
  id          String    @id @default(uuid())
  operatoryId String    @map("operatory_id")
  dentistId   String    @map("dentist_id")
  tenantId    String    @map("tenant_id")
  
  // NUEVO: Tipo de asignación
  assignmentType AssignmentType @default(RENTER)
  
  // Horarios base (JSON con días de la semana)
  schedule  Json
  
  startDate DateTime  @map("start_date")
  endDate   DateTime? @map("end_date")
  isActive  Boolean   @default(true) @map("is_active")
  
  // NUEVO: Permisos
  canInviteOthers   Boolean @default(false) @map("can_invite_others")
  canModifySchedule Boolean @default(false) @map("can_modify_schedule")
  
  // NUEVO: Costo de alquiler (si aplica)
  rentalCost Float? @map("rental_cost")
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  operatory Operatory @relation(fields: [operatoryId], references: [id])
  tenant    Tenant    @relation(fields: [tenantId], references: [id])
  
  @@index([operatoryId])
  @@index([dentistId])
  @@index([tenantId])
  @@map("operatory_assignments")
}

enum AssignmentType {
  OWNER   // Propietario del consultorio
  RENTER  // Alquila de una clínica
  SHARED  // Co-propietario
  GUEST   // Invitado temporal
}
```

#### **Nuevo Modelo: OperatoryAvailability**

```prisma
model OperatoryAvailability {
  id          String   @id @default(uuid())
  operatoryId String   @map("operatory_id")
  dentistId   String   @map("dentist_id")
  
  // Bloqueo de disponibilidad
  blockDate   DateTime @map("block_date")
  startTime   String   @map("start_time") // "09:00"
  endTime     String   @map("end_time")   // "17:00"
  
  blockReason BlockReason @map("block_reason")
  notes       String?
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@index([operatoryId, blockDate])
  @@index([dentistId, blockDate])
  @@map("operatory_availability")
}

enum BlockReason {
  VACATION      // Vacaciones
  SICK_LEAVE    // Enfermedad
  MEETING       // Reunión/Evento
  MAINTENANCE   // Mantenimiento del consultorio
  EMERGENCY     // Emergencia
  OTHER         // Otro
}
```

### 🔄 Flujos Principales

#### **Flujo 1: Dentista Crea Su Consultorio Propio**

1. Dentista → "Mis Consultorios" → "Crear Consultorio Propio"
2. Llena formulario:
   - Nombre del consultorio
   - Dirección completa
   - Equipamiento
   - Horarios base de trabajo
3. Sistema crea:
   - `Operatory` con `ownershipType = DENTIST_OWNED`, `clinicId = null`
   - `OperatoryAssignment` con `assignmentType = OWNER`
4. Dentista puede:
   - Agendar citas inmediatamente
   - Compartir con otros dentistas
   - Modificar horarios libremente

#### **Flujo 2: Dentista Solicita Alquilar en Clínica**

1. Dentista → "Buscar Clínicas"
2. Selecciona clínica → Ve consultorios disponibles
3. Solicita alquilar consultorio específico
4. Propone horarios deseados (ej: Lun-Mie-Vie 9am-5pm)
5. Sistema valida que no haya conflictos con otros dentistas
6. Admin de clínica recibe solicitud
7. Admin aprueba/rechaza:
   - Si aprueba: Crea `OperatoryAssignment` con `assignmentType = RENTER`
   - Define costo de alquiler
8. Dentista recibe notificación y puede agendar citas

#### **Flujo 3: Dentista Comparte Su Consultorio**

1. Dentista (propietario) → "Mi Consultorio" → "Compartir"
2. Busca dentista a invitar
3. Define horarios a ceder (ej: Jue-Vie 8am-4pm)
4. Sistema valida:
   - Que no solape con sus propios horarios
   - Que no solape con otros invitados
5. Crea `OperatoryAssignment` con `assignmentType = GUEST`
6. Invitado recibe notificación
7. Invitado acepta y puede usar el consultorio en esos horarios

#### **Flujo 4: Paciente Busca Disponibilidad de Su Doctor**

1. Paciente → "Agendar Cita" → Selecciona doctor
2. Sistema consulta todos los `OperatoryAssignment` activos del doctor
3. Muestra ubicaciones:
   ```
   ¿Dónde te gustaría ser atendido?
   
   ○ Consultorio Dr. Smith (Calle 123)
     Disponible: Lun-Vie 8am-6pm
   
   ○ Clínica Dental ABC (Av. Principal 456)
     Disponible: Lun, Mie, Vie 9am-5pm
   ```
4. Paciente selecciona ubicación
5. Sistema muestra calendario con slots disponibles
6. Paciente elige fecha/hora y confirma
7. Sistema valida y crea la cita

#### **Flujo 5: Validación de Conflictos al Agendar**

```typescript
async function validateAppointment(
  dentistId: string,
  operatoryId: string,
  appointmentDate: Date,
  startTime: string,
  endTime: string
): Promise<ValidationResult> {
  
  // 1. Verificar que dentista tenga asignación activa
  const assignment = await getActiveAssignment(dentistId, operatoryId);
  if (!assignment) {
    return { valid: false, error: "Dentista no tiene acceso a este consultorio" };
  }
  
  // 2. Verificar que esté dentro del horario base
  const dayOfWeek = getDayOfWeek(appointmentDate);
  const schedule = assignment.schedule[dayOfWeek];
  if (!schedule || !isTimeBetween(startTime, schedule.start, schedule.end)) {
    return { valid: false, error: "Fuera del horario asignado" };
  }
  
  // 3. Verificar que no haya bloqueos
  const blocks = await getAvailabilityBlocks(dentistId, operatoryId, appointmentDate);
  if (hasConflictWithBlocks(blocks, startTime, endTime)) {
    return { valid: false, error: "Dentista no disponible (vacaciones/bloqueo)" };
  }
  
  // 4. Verificar que no haya otra cita en ese consultorio
  const existingAppointments = await getAppointments({
    operatoryId,
    date: appointmentDate,
    timeRange: { start: startTime, end: endTime }
  });
  if (existingAppointments.length > 0) {
    return { valid: false, error: "Consultorio ocupado en ese horario" };
  }
  
  // 5. Verificar que dentista no tenga otra cita (en otro lugar)
  const dentistAppointments = await getAppointments({
    dentistId,
    date: appointmentDate,
    timeRange: { start: startTime, end: endTime }
  });
  if (dentistAppointments.length > 0) {
    return { valid: false, error: "Dentista tiene otra cita programada" };
  }
  
  return { valid: true };
}
```

---

## 👨‍⚕️ MÓDULO TENANT: Gestión de Clínicas

### 🎯 Funcionalidades del Tenant

#### 1️⃣ **Solicitar Acceso a Clínica Existente**

El dentista puede:
- Ver lista de clínicas públicas disponibles
- Solicitar acceso a una clínica
- El Super Admin aprueba/rechaza la solicitud

**Flujo:**
```
1. Dentista busca clínica → "Clínica Dental ABC"
2. Dentista solicita acceso
3. Super Admin recibe notificación
4. Super Admin aprueba y asigna consultorio + horario
5. Dentista puede usar el consultorio
```

**Endpoints Backend:**
```typescript
// Ver clínicas públicas disponibles
GET /api/clinics/public
Response: Lista de clínicas donde puede solicitar acceso

// Solicitar acceso a clínica
POST /api/clinics/:id/request-access
Body: { message: "Necesito consultorio Lun-Vie 9am-5pm" }
Response: { requestId, status: "PENDING" }

// Ver mis solicitudes
GET /api/clinics/my-requests
Response: Lista de solicitudes con estado (PENDING, APPROVED, REJECTED)
```

#### 2️⃣ **Crear Clínica Propia (Básica)**

Si la clínica que necesita no existe, el dentista puede crearla:

**Campos que puede crear:**
- ✅ Nombre de la clínica
- ✅ Dirección completa
- ✅ Teléfono
- ✅ Email
- ✅ Descripción básica

**Campos que NO puede gestionar** (Solo Super Admin):
- ❌ Número de pisos
- ❌ Crear consultorios
- ❌ Asignar consultorios
- ❌ Ubicación GPS (latitude/longitude)
- ❌ Logo de la clínica
- ❌ Administrador de clínica
- ❌ Website

**Endpoint Backend:**
```typescript
POST /api/clinics/create-own
Body: {
  name: "Consultorio Dr. Smith",
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA"
  },
  phone: "+1234567890",
  email: "info@drsmith.com",
  description: "Consultorio dental privado"
}
Response: {
  clinic: {...},
  message: "Clínica creada. Un administrador la revisará y configurará los consultorios."
}
```

**Flujo Post-Creación:**
1. Dentista crea clínica básica
2. Sistema notifica a Super Admin
3. Super Admin revisa y configura:
   - Número de pisos
   - Crea consultorios
   - Asigna el consultorio al dentista
4. Dentista recibe notificación de que ya puede usar su clínica

#### 3️⃣ **Ver Mis Clínicas y Consultorios**

El dentista ve:
- Clínicas donde tiene consultorios asignados
- Consultorios específicos asignados a él
- Horarios de cada consultorio
- Equipamiento disponible

**Endpoints Backend:**
```typescript
GET /api/clinics/my-clinics
Response: {
  clinics: [
    {
      id: "uuid",
      name: "Clínica Dental ABC",
      address: {...},
      myOperatories: [
        {
          id: "uuid",
          name: "Consultorio 2",
          floor: 1,
          schedule: {
            monday: { start: "09:00", end: "17:00" },
            tuesday: { start: "09:00", end: "17:00" }
          }
        }
      ]
    }
  ]
}
```

### �� Frontend: Páginas del Tenant

#### **ClinicsPage.tsx** - Lista de Clínicas
```typescript
Tabs:
- "Mis Clínicas" → Clínicas donde tiene acceso
- "Clínicas Públicas" → Clínicas disponibles para solicitar acceso
- "Mis Solicitudes" → Estado de solicitudes pendientes

Acciones:
- Ver detalles de clínica
- Solicitar acceso a clínica pública
- Crear nueva clínica propia
```

#### **CreateClinicModal.tsx** - Crear Clínica Propia
```typescript
Formulario simple:
- Nombre de la clínica
- Dirección (street, city, state, zipCode, country)
- Teléfono
- Email
- Descripción

Mensaje:
"Nota: Un administrador revisará tu clínica y configurará 
los consultorios. Te notificaremos cuando esté lista."
```

#### **ClinicAccessRequestModal.tsx** - Solicitar Acceso
```typescript
Formulario:
- Clínica seleccionada (readonly)
- Horario preferido
- Días de la semana
- Mensaje para el administrador

Botón: "Enviar Solicitud"
```

---

## 🔧 MÓDULO SUPER ADMIN: Gestión Completa de Clínicas

### 🎯 Funcionalidades del Super Admin

#### 1️⃣ **Gestión de Clínicas**

**CRUD Completo:**
```typescript
// Crear clínica pública
POST /api/admin/clinics
Body: {
  name: "Centro Médico XYZ",
  address: {...},
  phone: "+1234567890",
  email: "info@centroxyz.com",
  floors: 3,
  description: "Centro médico de 3 pisos",
  latitude: 40.7128,
  longitude: -74.0060,
  website: "https://centroxyz.com",
  adminUserId: "uuid-del-admin-clinica" // opcional
}

// Actualizar clínica
PATCH /api/admin/clinics/:id
Body: { campos a actualizar }

// Activar/Desactivar clínica
PATCH /api/admin/clinics/:id/toggle-active
Body: { isActive: false }

// Eliminar clínica
DELETE /api/admin/clinics/:id

// Ver todas las clínicas
GET /api/admin/clinics?page=1&limit=20&status=active

// Ver clínicas creadas por tenants (pendientes de configuración)
GET /api/admin/clinics/tenant-created?status=pending
```

#### 2️⃣ **Gestión de Consultorios**

**CRUD Completo:**
```typescript
// Crear consultorio
POST /api/admin/clinics/:clinicId/operatories
Body: {
  name: "Consultorio 1",
  floor: 2,
  description: "Consultorio con equipo digital",
  equipment: {
    chair: "Adec 500",
    xray: "Digital Panoramic",
    light: "LED Operatory Light",
    tools: ["Drill", "Scaler", "Mirror"]
  }
}

// Actualizar consultorio
PATCH /api/admin/operatories/:id
Body: { campos a actualizar }

// Activar/Desactivar consultorio
PATCH /api/admin/operatories/:id/toggle-active

// Eliminar consultorio
DELETE /api/admin/operatories/:id

// Ver consultorios de una clínica
GET /api/admin/clinics/:clinicId/operatories
```

#### 3️⃣ **Gestión de Asignaciones**

**Asignar consultorios a dentistas:**
```typescript
// Crear asignación
POST /api/admin/operatory-assignments
Body: {
  operatoryId: "uuid",
  dentistId: "uuid",
  tenantId: "uuid",
  schedule: {
    monday: { start: "09:00", end: "17:00" },
    tuesday: { start: "09:00", end: "17:00" },
    wednesday: { start: "09:00", end: "17:00" },
    thursday: { start: "09:00", end: "17:00" },
    friday: { start: "09:00", end: "15:00" }
  },
  startDate: "2026-01-01",
  endDate: null // null = indefinido
}

// Actualizar asignación
PATCH /api/admin/operatory-assignments/:id
Body: { schedule, endDate, isActive }

// Ver asignaciones de un consultorio
GET /api/admin/operatories/:id/assignments

// Ver conflictos de horarios
GET /api/admin/operatories/:id/conflicts?date=YYYY-MM-DD

// Terminar asignación
PATCH /api/admin/operatory-assignments/:id/end
Body: { endDate: "2026-12-31" }
```

#### 4️⃣ **Gestión de Solicitudes de Acceso**

```typescript
// Ver solicitudes pendientes
GET /api/admin/clinic-access-requests?status=PENDING

// Aprobar solicitud
POST /api/admin/clinic-access-requests/:id/approve
Body: {
  operatoryId: "uuid",
  schedule: {...},
  startDate: "2026-01-15"
}
Response: Crea OperatoryAssignment automáticamente

// Rechazar solicitud
POST /api/admin/clinic-access-requests/:id/reject
Body: { reason: "No hay consultorios disponibles" }

// Ver historial de solicitudes
GET /api/admin/clinic-access-requests?dentistId=uuid
```

### 📱 Frontend: Páginas del Super Admin

#### **AdminClinicsPage.tsx** - Gestión de Clínicas
```typescript
Tabs:
- "Todas las Clínicas" → Lista completa con filtros
- "Creadas por Tenants" → Clínicas pendientes de configuración
- "Solicitudes de Acceso" → Solicitudes pendientes

Lista de Clínicas:
- Nombre, dirección, pisos
- Número de consultorios
- Dentistas asignados
- Estado (activa/inactiva)
- Acciones: Editar, Ver Consultorios, Desactivar

Acciones:
- Crear nueva clínica pública
- Configurar clínica creada por tenant
- Ver/Aprobar solicitudes de acceso
```

#### **AdminClinicDetailPage.tsx** - Detalle de Clínica
```typescript
Tabs:
- "Información" → Datos de la clínica, mapa GPS
- "Consultorios" → Lista de consultorios por piso
- "Asignaciones" → Dentistas asignados y horarios
- "Estadísticas" → Uso de consultorios

Acciones:
- Editar información de clínica
- Agregar consultorio
- Ver calendario de ocupación
```

#### **AdminOperatoriesPage.tsx** - Gestión de Consultorios
```typescript
Vista por Piso:
Piso 1:
  - Consultorio 1 (Dr. Smith: Lun-Vie 9am-5pm)
  - Consultorio 2 (Dra. García: Lun-Mie 9am-5pm, Dr. López: Jue-Vie 9am-5pm)

Piso 2:
  - Consultorio 3 (Disponible)
  - Consultorio 4 (Dr. Ramírez: Lun-Vie 2pm-8pm)

Acciones:
- Crear consultorio
- Editar consultorio
- Asignar a dentista
- Ver calendario de ocupación
```

#### **AdminAssignmentsPage.tsx** - Gestión de Asignaciones
```typescript
Tabla de Asignaciones:
Columns:
- Clínica
- Consultorio
- Dentista
- Horario (resumen)
- Fecha inicio/fin
- Estado
- Acciones

Filtros:
- Por clínica
- Por dentista
- Por consultorio
- Por estado (activa/terminada)

Acciones:
- Crear asignación
- Editar horarios
- Terminar asignación
- Ver conflictos
```

#### **AdminAccessRequestsPage.tsx** - Solicitudes de Acceso
```typescript
Lista de Solicitudes:
- Dentista solicitante
- Clínica solicitada
- Horario preferido
- Mensaje
- Fecha de solicitud
- Estado

Acciones por solicitud:
- Aprobar → Abre modal para asignar consultorio
- Rechazar → Abre modal para dar razón
- Ver perfil del dentista
```

---

## 🗺️ Plan de Implementación Actualizado

### Sprint 1-4: Dashboard del Paciente (Ya definido)

### Sprint 5: Backend - Clínicas Tenant (2-3 días)
- [ ] Endpoint POST /api/clinics/create-own
- [ ] Endpoint GET /api/clinics/public
- [ ] Endpoint POST /api/clinics/:id/request-access
- [ ] Endpoint GET /api/clinics/my-requests
- [ ] Endpoint GET /api/clinics/my-clinics
- [ ] Modelo ClinicAccessRequest
- [ ] Validaciones y notificaciones

### Sprint 6: Frontend - Clínicas Tenant (2-3 días)
- [ ] ClinicsPage con tabs
- [ ] CreateClinicModal
- [ ] ClinicAccessRequestModal
- [ ] Lista de mis clínicas
- [ ] Lista de solicitudes

### Sprint 7: Backend - Admin Clínicas (3-4 días)
- [ ] CRUD completo de clínicas (admin)
- [ ] CRUD completo de consultorios
- [ ] Gestión de asignaciones
- [ ] Gestión de solicitudes de acceso
- [ ] Validación de conflictos de horarios
- [ ] Endpoints de estadísticas

### Sprint 8: Frontend - Admin Clínicas (4-5 días)
- [ ] AdminClinicsPage
- [ ] AdminClinicDetailPage
- [ ] AdminOperatoriesPage
- [ ] AdminAssignmentsPage
- [ ] AdminAccessRequestsPage
- [ ] Calendario de ocupación
- [ ] Gráficos de estadísticas

### Sprint 9: Integración Completa (2-3 días)
- [ ] Integrar selector de consultorio en formulario de citas
- [ ] Validar disponibilidad al crear citas
- [ ] Mostrar consultorio en dashboard del paciente
- [ ] Notificaciones de solicitudes aprobadas/rechazadas
- [ ] Testing end-to-end completo

---

## 🔒 Reglas de Negocio Completas

### **Creación de Clínicas:**
1. **Super Admin** puede crear clínicas públicas con todos los campos
2. **Tenant** puede crear clínicas propias solo con campos básicos
3. Clínicas creadas por tenants quedan en estado "PENDING_CONFIGURATION"
4. Super Admin debe configurar pisos y consultorios antes de activarla

### **Solicitudes de Acceso:**
1. Tenant solo puede solicitar acceso a clínicas públicas activas
2. Una solicitud puede estar: PENDING, APPROVED, REJECTED
3. Al aprobar, Super Admin DEBE asignar consultorio y horario
4. Tenant recibe notificación del resultado

### **Asignaciones de Consultorios:**
1. Un consultorio puede tener múltiples asignaciones (diferentes horarios)
2. No puede haber conflictos de horarios en el mismo consultorio
3. Asignaciones tienen fecha de inicio y fin (opcional)
4. Solo asignaciones activas se consideran para disponibilidad

### **Validación de Citas:**
1. Al crear cita, DEBE seleccionar consultorio
2. Consultorio debe tener asignación activa para ese dentista
3. Horario de cita debe estar dentro del horario asignado
4. No puede haber otra cita en el mismo consultorio al mismo tiempo

### **Pisos y Consultorios:**
1. Cada clínica define número de pisos (1-N)
2. Cada consultorio está en un piso específico
3. Los pisos se usan para organización visual
4. No hay límite de consultorios por piso

---

## ✅ Criterios de Éxito Completos

### Módulo Tenant:
1. ✅ Tenant puede ver clínicas públicas disponibles
2. ✅ Tenant puede solicitar acceso a clínica
3. ✅ Tenant puede crear su propia clínica básica
4. ✅ Tenant ve estado de sus solicitudes
5. ✅ Tenant ve sus clínicas y consultorios asignados

### Módulo Super Admin:
1. ✅ Admin puede crear clínicas públicas completas
2. ✅ Admin puede configurar clínicas creadas por tenants
3. ✅ Admin puede crear/editar consultorios
4. ✅ Admin puede asignar consultorios a dentistas
5. ✅ Admin puede aprobar/rechazar solicitudes
6. ✅ Admin ve calendario de ocupación
7. ✅ Admin ve estadísticas de uso

### Integración:
1. ✅ Selector de consultorio funciona en formulario de citas
2. ✅ Validación de disponibilidad previene conflictos
3. ✅ Dashboard del paciente muestra consultorio de cada cita
4. ✅ Notificaciones funcionan correctamente
5. ✅ Sistema de pisos se visualiza correctamente

---

**Fecha de Actualización**: 2026-01-05 (Agregado Módulo Completo de Clínicas)  
**Estado**: 📋 Planificación Completa y Detallada

### 🎨 Vistas de Usuario

#### **Vista Dentista: "Mis Consultorios"**

```
┌─────────────────────────────────────────────────────┐
│ Mis Consultorios                    [+ Crear Propio] │
│                                     [🔍 Buscar Clínicas] │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📍 Consultorio Dr. Smith (Propio)                   │
│    Calle 123, Ciudad                                 │
│    Lun-Vie: 8am-6pm, Sáb: 9am-2pm                  │
│    Ocupación: 85% | Citas este mes: 42              │
│    [Ver Calendario] [Compartir] [Editar] [Bloquear] │
│                                                      │
│ 🏥 Clínica Dental ABC - Consultorio 2               │
│    Av. Principal 456                                 │
│    Lun-Mie-Vie: 9am-5pm (Alquilado - $500/mes)     │
│    Ocupación: 72% | Citas este mes: 28              │
│    [Ver Calendario] [Renovar Contrato]               │
│                                                      │
│ 🤝 Consultorio Compartido (Dr. López)               │
│    Calle 789, Ciudad                                 │
│    Jue: 8am-4pm (Invitado)                          │
│    Ocupación: 60% | Citas este mes: 8               │
│    [Ver Calendario]                                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### **Vista Paciente: "Agendar Cita con Dr. Smith"**

**Paso 1: Selección de Ubicación**
```
┌─────────────────────────────────────────────────────┐
│ Agendar Cita con Dr. Smith                          │
├─────────────────────────────────────────────────────┤
│ ¿Dónde te gustaría ser atendido?                    │
│                                                      │
│ ○ 📍 Consultorio Dr. Smith                          │
│   Calle 123, Ciudad                                  │
│   Disponible: Lun-Vie 8am-6pm, Sáb 9am-2pm         │
│   [Ver en mapa]                                      │
│                                                      │
│ ○ 🏥 Clínica Dental ABC                             │
│   Av. Principal 456                                  │
│   Disponible: Lun, Mie, Vie 9am-5pm                 │
│   [Ver en mapa]                                      │
│                                                      │
│ [Continuar]                                          │
└─────────────────────────────────────────────────────┘
```

**Paso 2: Selección de Fecha y Hora**
```
┌─────────────────────────────────────────────────────┐
│ Horarios Disponibles                                 │
│ Consultorio Dr. Smith - Enero 2026                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Semana del 13 al 17 de Enero                        │
│                                                      │
│ Lun 13    Mar 14    Mie 15    Jue 16    Vie 17     │
│ ────────────────────────────────────────────────    │
│ 9:00am ✓   9:00am ✓   9:00am ✓   9:00am ✓   9:00am ✓ │
│ 10:00am ✗  10:00am ✓  10:00am ✗  10:00am ✓  10:00am ✓ │
│ 11:00am ✓  11:00am ✓  11:00am ✓  11:00am ✓  11:00am ✓ │
│ 2:00pm ✓   2:00pm ✗   2:00pm ✓   2:00pm ✓   2:00pm ✓ │
│ 3:00pm ✓   3:00pm ✓   3:00pm ✓   3:00pm ✗   3:00pm ✓ │
│ 4:00pm ✓   4:00pm ✓   4:00pm ✓   4:00pm ✓   4:00pm ✗ │
│                                                      │
│ ✓ = Disponible  ✗ = Ocupado                         │
│                                                      │
│ [< Semana Anterior] [Semana Siguiente >]            │
└─────────────────────────────────────────────────────┘
```

#### **Vista Admin Clínica: "Gestión de Consultorios"**

```
┌─────────────────────────────────────────────────────┐
│ Clínica Dental ABC - Consultorios                   │
│                                [+ Agregar Consultorio] │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Piso 1:                                              │
│   📍 Consultorio 1                                   │
│   ├─ Dr. Ramírez (Lun-Vie 8am-5pm) - $600/mes      │
│   └─ Ocupación: 90% | [Ver Calendario]              │
│                                                      │
│   📍 Consultorio 2                                   │
│   ├─ Dr. Smith (Lun-Mie-Vie 9am-5pm) - $500/mes    │
│   ├─ Dra. García (Mar-Jue 9am-5pm) - $400/mes      │
│   └─ Ocupación: 85% | [Ver Calendario]              │
│                                                      │
│ Piso 2:                                              │
│   📍 Consultorio 3                                   │
│   └─ [Disponible para alquilar]                     │
│      [Publicar] [Configurar]                         │
│                                                      │
│ [Ver Solicitudes de Alquiler (3)]                   │
│ [Ver Ingresos por Alquileres]                       │
└─────────────────────────────────────────────────────┘
```

### 🔧 Endpoints Backend Completos

#### **Módulo Tenant: Consultorios**

```typescript
// Crear consultorio propio
POST /api/operatories/create-own
Body: {
  name: "Consultorio Dr. Smith",
  address: { street, city, state, zipCode, country },
  equipment: { chair: "...", xray: "...", ... },
  baseSchedule: {
    monday: { start: "08:00", end: "17:00" },
    // ... otros días
  }
}
Response: { operatory, assignment }

// Ver mis consultorios
GET /api/operatories/my-operatories
Response: [
  {
    id, name, address, ownershipType,
    myAssignment: { schedule, assignmentType, ... },
    stats: { occupancyRate, appointmentsThisMonth }
  }
]

// Compartir mi consultorio
POST /api/operatories/:id/share
Body: {
  inviteDentistId: "uuid",
  schedule: { monday: {...}, ... },
  startDate: "2026-01-15",
  endDate: null
}
Response: { assignment, invitation }

// Buscar clínicas para alquilar
GET /api/clinics/available-for-rent
Response: [
  {
    clinic: {...},
    availableOperatories: [
      {
        operatory: {...},
        availableSchedules: [...],
        rentalCost: 500
      }
    ]
  }
]

// Solicitar alquilar consultorio de clínica
POST /api/operatories/:id/request-rental
Body: {
  proposedSchedule: { monday: {...}, ... },
  startDate: "2026-02-01",
  message: "Necesito consultorio para..."
}
Response: { request }

// Bloquear disponibilidad (vacaciones, etc)
POST /api/operatories/:id/block-availability
Body: {
  blockDate: "2026-03-15",
  startTime: "09:00",
  endTime: "17:00",
  blockReason: "VACATION",
  notes: "Vacaciones de verano"
}
Response: { availability }

// Ver disponibilidad de consultorio
GET /api/operatories/:id/availability?date=2026-01-15
Response: {
  operatory: {...},
  date: "2026-01-15",
  timeSlots: [
    { time: "09:00", available: true, dentist: null },
    { time: "10:00", available: false, dentist: "Dr. Smith", appointmentId: "..." },
    // ...
  ]
}
```

#### **Módulo Admin: Gestión de Consultorios**

```typescript
// CRUD de consultorios de clínica
POST /api/admin/clinics/:clinicId/operatories
PATCH /api/admin/operatories/:id
DELETE /api/admin/operatories/:id
GET /api/admin/clinics/:clinicId/operatories

// Ver solicitudes de alquiler
GET /api/admin/operatory-rental-requests?status=PENDING
Response: [
  {
    id, operatory, dentist, proposedSchedule,
    requestDate, message, status
  }
]

// Aprobar solicitud de alquiler
POST /api/admin/operatory-rental-requests/:id/approve
Body: {
  schedule: { monday: {...}, ... },
  rentalCost: 500,
  startDate: "2026-02-01",
  endDate: null
}
Response: { assignment }

// Rechazar solicitud
POST /api/admin/operatory-rental-requests/:id/reject
Body: { reason: "No hay disponibilidad en esos horarios" }

// Ver ocupación de consultorios
GET /api/admin/operatories/:id/occupancy?startDate=&endDate=
Response: {
  operatory: {...},
  period: { start, end },
  occupancyRate: 85,
  totalHours: 160,
  bookedHours: 136,
  dentists: [
    { dentist: {...}, hours: 80, appointments: 20 }
  ]
}

// Ver conflictos de horarios
GET /api/admin/operatories/:id/schedule-conflicts
Response: [
  {
    dentist1: {...},
    dentist2: {...},
    conflictingSchedule: { monday: {...} },
    severity: "HIGH"
  }
]
```

#### **Módulo Paciente: Disponibilidad**

```typescript
// Ver ubicaciones donde atiende mi doctor
GET /api/patients/my-doctors/:dentistId/locations
Response: [
  {
    operatory: { id, name, address, ... },
    schedule: { monday: {...}, ... },
    nextAvailableSlot: "2026-01-15T10:00:00"
  }
]

// Ver disponibilidad de doctor en ubicación específica
GET /api/patients/availability?dentistId=&operatoryId=&date=2026-01-15
Response: {
  date: "2026-01-15",
  operatory: {...},
  dentist: {...},
  availableSlots: [
    { time: "09:00", duration: 60 },
    { time: "11:00", duration: 60 },
    { time: "14:00", duration: 60 }
  ]
}

// Agendar cita con selección de ubicación
POST /api/appointments
Body: {
  dentistId: "uuid",
  operatoryId: "uuid",  // OBLIGATORIO
  patientId: "uuid",
  appointmentDate: "2026-01-15",
  startTime: "10:00",
  duration: 60,
  procedureType: "Limpieza"
}
Response: { appointment }
```

### 📅 Plan de Implementación Actualizado

#### **Sprint 1-4: Dashboard del Paciente** (Ya definido anteriormente)

#### **Sprint 5: Backend - Modificación de Schema (1-2 días)**
- [ ] Modificar modelo `Operatory` (clinicId opcional, ownershipType, primaryOwnerId, address)
- [ ] Modificar modelo `OperatoryAssignment` (assignmentType, permisos, rentalCost)
- [ ] Crear modelo `OperatoryAvailability` (bloqueos)
- [ ] Crear enums `OperatoryOwnership`, `AssignmentType`, `BlockReason`
- [ ] Migración de base de datos
- [ ] Actualizar seed data con ejemplos de cada tipo

#### **Sprint 6: Backend - Consultorios Tenant (3-4 días)**
- [ ] Endpoint POST /api/operatories/create-own
- [ ] Endpoint GET /api/operatories/my-operatories
- [ ] Endpoint POST /api/operatories/:id/share
- [ ] Endpoint GET /api/clinics/available-for-rent
- [ ] Endpoint POST /api/operatories/:id/request-rental
- [ ] Endpoint POST /api/operatories/:id/block-availability
- [ ] Endpoint GET /api/operatories/:id/availability
- [ ] Validación de conflictos de horarios
- [ ] Servicio de validación de solapamiento

#### **Sprint 7: Backend - Admin Consultorios (2-3 días)**
- [ ] CRUD completo de consultorios de clínica
- [ ] Endpoint GET /api/admin/operatory-rental-requests
- [ ] Endpoint POST /api/admin/operatory-rental-requests/:id/approve
- [ ] Endpoint POST /api/admin/operatory-rental-requests/:id/reject
- [ ] Endpoint GET /api/admin/operatories/:id/occupancy
- [ ] Endpoint GET /api/admin/operatories/:id/schedule-conflicts
- [ ] Reportes y estadísticas

#### **Sprint 8: Backend - Disponibilidad Paciente (2 días)**
- [ ] Endpoint GET /api/patients/my-doctors/:dentistId/locations
- [ ] Endpoint GET /api/patients/availability
- [ ] Modificar POST /api/appointments (operatoryId obligatorio)
- [ ] Validación completa al agendar citas
- [ ] Algoritmo de sugerencias de horarios

#### **Sprint 9: Frontend - Consultorios Tenant (3-4 días)**
- [ ] MyOperatoriesPage - Lista de consultorios
- [ ] CreateOperatoryModal - Crear consultorio propio
- [ ] ShareOperatoryModal - Compartir consultorio
- [ ] OperatoryCalendarView - Calendario de ocupación
- [ ] AvailableClinicsPage - Buscar clínicas para alquilar
- [ ] RequestRentalModal - Solicitar alquiler
- [ ] BlockAvailabilityModal - Bloquear fechas

#### **Sprint 10: Frontend - Admin Consultorios (3-4 días)**
- [ ] AdminOperatoriesPage - Gestión de consultorios
- [ ] AdminOperatoryDetailPage - Detalle con calendario
- [ ] AdminRentalRequestsPage - Solicitudes de alquiler
- [ ] ApproveRentalModal - Aprobar con horarios
- [ ] OperatoryOccupancyChart - Gráficos de ocupación
- [ ] ScheduleConflictsView - Vista de conflictos

#### **Sprint 11: Frontend - Disponibilidad Paciente (2-3 días)**
- [ ] LocationSelectorStep - Selección de ubicación
- [ ] AvailabilityCalendar - Calendario con slots
- [ ] TimeSlotPicker - Selector de horarios
- [ ] AlternativeSuggestionsView - Sugerencias
- [ ] Modificar AppointmentForm (incluir operatoryId)
- [ ] Mostrar ubicación en lista de citas

#### **Sprint 12: Integración y Testing (2-3 días)**
- [ ] Integrar selector de ubicación en flujo de citas
- [ ] Mostrar ubicación en dashboard del paciente
- [ ] Testing de validaciones de conflictos
- [ ] Testing de compartición de consultorios
- [ ] Testing de alquiler en clínicas
- [ ] Testing de disponibilidad multi-ubicación
- [ ] Testing end-to-end completo

### ✅ Criterios de Éxito Completos

#### **Módulo Tenant:**
1. ✅ Dentista puede crear su consultorio propio con dirección y horarios
2. ✅ Dentista puede compartir su consultorio con otros dentistas
3. ✅ Dentista puede buscar clínicas y solicitar alquilar consultorios
4. ✅ Dentista puede ver todos sus consultorios en un solo lugar
5. ✅ Dentista puede bloquear disponibilidad (vacaciones, etc.)
6. ✅ Sistema previene conflictos de horarios al compartir

#### **Módulo Admin:**
1. ✅ Admin puede crear consultorios en clínicas
2. ✅ Admin puede ver solicitudes de alquiler
3. ✅ Admin puede aprobar/rechazar con asignación de horarios
4. ✅ Admin ve ocupación y estadísticas de consultorios
5. ✅ Admin puede detectar conflictos de horarios
6. ✅ Admin puede gestionar múltiples dentistas por consultorio

#### **Módulo Paciente:**
1. ✅ Paciente ve todas las ubicaciones donde atiende su doctor
2. ✅ Paciente puede elegir dónde quiere ser atendido
3. ✅ Paciente ve disponibilidad en tiempo real
4. ✅ Paciente recibe sugerencias de horarios alternativos
5. ✅ Sistema muestra claramente dónde será la cita
6. ✅ Paciente puede ver historial de citas por ubicación

#### **Validaciones:**
1. ✅ No se permiten horarios solapados en mismo consultorio
2. ✅ Citas solo dentro del horario base asignado
3. ✅ Respeto de bloqueos de disponibilidad
4. ✅ Prevención de doble reserva (mismo consultorio, misma hora)
5. ✅ Prevención de conflicto del dentista (dos citas al mismo tiempo)
6. ✅ Validación en tiempo real al agendar

### 🔒 Reglas de Negocio Finales

#### **Propiedad y Permisos:**
1. **OWNER**: Control total, puede compartir, modificar horarios
2. **RENTER**: Uso según contrato, no puede compartir sin permiso
3. **SHARED**: Co-propietario, puede compartir con aprobación de otros
4. **GUEST**: Uso temporal, sin permisos de gestión

#### **Horarios:**
1. Horarios base se definen por día de semana
2. Horarios NO pueden solaparse entre dentistas del mismo consultorio
3. Bloqueos temporales tienen prioridad sobre horarios base
4. Citas solo se pueden agendar dentro de horarios válidos

#### **Alquiler:**
1. Clínicas definen costo de alquiler por consultorio
2. Dentista solicita con horarios propuestos
3. Admin aprueba/rechaza y asigna horarios finales
4. Contrato tiene fecha inicio y fin (opcional)

#### **Compartición:**
1. Solo propietario (OWNER) puede invitar a otros
2. Invitado recibe tipo GUEST
3. Horarios cedidos no pueden solaparse con propietario
4. Propietario puede revocar acceso en cualquier momento

#### **Disponibilidad:**
1. Sistema calcula disponibilidad en tiempo real
2. Considera: horario base + bloqueos + citas existentes
3. Paciente ve solo slots realmente disponibles
4. Sugerencias automáticas si no hay disponibilidad

---

**Fecha de Actualización**: 2026-01-05 (Sistema Completo de Consultorios y Horarios)  
**Estado**: 📋 Planificación Completa con Filosofía Correcta  
**Próximo Paso**: Revisar y aprobar antes de implementación
