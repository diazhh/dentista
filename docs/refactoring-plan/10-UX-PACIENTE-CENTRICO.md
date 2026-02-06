# 10 - UX Paciente-Céntrico (Interfaz del Provider)

## 1. Principio Fundamental

La interfaz del provider debe ser **paciente-céntrica**: toda la información clínica, administrativa y de seguimiento de un paciente se accede desde el **detalle del paciente**, no desde módulos independientes.

> **Regla de oro:** Si una acción clínica involucra un paciente, se hace desde el contexto del paciente.

---

## 2. Problema del Diseño Anterior

### Flujo anterior (Module-First)

```
Sidebar → Odontogramas → [Seleccionar paciente] → Crear odontograma
Sidebar → Planes de Tratamiento → [Seleccionar paciente] → Crear plan
Sidebar → Facturas → [Seleccionar paciente] → Crear factura
```

**Problemas:**
- El provider debe recordar en qué módulo está y seleccionar el paciente cada vez
- Contexto clínico fragmentado: para ver el panorama completo del paciente hay que navegar entre múltiples páginas
- La selección de paciente es repetitiva y propensa a errores
- No refleja el flujo real de atención médica (que siempre gira alrededor del paciente)

### Flujo nuevo (Patient-First)

```
Sidebar → Pacientes → [Click paciente] → Detalle completo con tabs
                                          ├── Resumen (dashboard)
                                          ├── Citas
                                          ├── Tratamientos
                                          ├── Odontogramas (módulo dental)
                                          ├── Facturas & Pagos
                                          ├── Documentos
                                          ├── Historia Clínica
                                          └── [Módulos de especialidad...]
```

---

## 3. Arquitectura de Navegación

### 3.1 Sidebar del Provider (Simplificado)

```
┌─────────────────────────┐
│  🏠 Dashboard           │  ← Vista general del practice
│  📅 Calendario          │  ← Agenda global de citas
│  👥 Pacientes           │  ← LISTA PRINCIPAL → detalle
│  🏥 Clínica             │  ← Gestión de consultorios
│  👨‍💼 Staff              │  ← Gestión de equipo
│  📊 Reportes            │  ← Analíticas y reportes
│  💬 WhatsApp/Chat       │  ← Comunicaciones
│  ⚙️ Configuración       │  ← Settings del practice
└─────────────────────────┘
```

**Lo que se ELIMINA del sidebar:**
- ❌ Odontogramas (se accede desde paciente)
- ❌ Planes de Tratamiento (se accede desde paciente)
- ❌ Facturas (se accede desde paciente, o desde Reportes para vista global)
- ❌ Documentos (se accede desde paciente)
- ❌ Servicios (se mueve a Configuración)

**Nota:** Las vistas de lista global (ej: "todas las facturas", "todos los tratamientos") se mantienen accesibles desde **Reportes** o como sub-rutas, pero no como items principales del sidebar.

### 3.2 Flujo de Pacientes

```
/patients                    → Lista de pacientes (búsqueda, filtros)
/patients/:id                → Detalle del paciente (con tabs)
/patients/:id?tab=summary    → Tab de resumen
/patients/:id?tab=appointments → Tab de citas
/patients/:id?tab=treatments  → Tab de tratamientos
/patients/:id?tab=odontograms → Tab de odontogramas (si módulo dental activo)
/patients/:id?tab=invoices    → Tab de facturas y pagos
/patients/:id?tab=documents   → Tab de documentos
/patients/:id?tab=history     → Tab de historia clínica
/patients/:id?tab=exams       → Tab de exámenes médicos
```

---

## 4. Diseño del Detalle de Paciente

### 4.1 Layout General

```
┌──────────────────────────────────────────────────────────────┐
│  ← Volver a pacientes                                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [Avatar]  María López García                          │  │
│  │            Cédula: 001-1234567-8 · 34 años · Femenino │  │
│  │            📱 809-555-1234 · 📧 maria@email.com        │  │
│  │            🩸 O+ · ⚠️ Alergia: Penicilina              │  │
│  │            [Editar] [Agendar Cita] [Mensaje]            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────┬───────┬────────────┬──────────┬────────┬────────┐  │
│  │Resum.│ Citas │Tratamientos│Odontogr. │Facturas│  Docs  │  │
│  └──────┴───────┴────────────┴──────────┴────────┴────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │           Contenido del tab seleccionado               │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Header del Paciente (Siempre Visible)

El header es un componente `PatientHeader` que se muestra siempre en la parte superior del detalle, independientemente del tab activo. Contiene:

- **Datos esenciales**: Nombre, documento, edad, género
- **Contacto rápido**: Teléfono, email (clickeables)
- **Alertas médicas**: Tipo de sangre, alergias (badge rojo), condiciones crónicas
- **Acciones rápidas**: Editar paciente, Agendar cita, Enviar mensaje
- **Status indicators**: Última visita, próxima cita, balance pendiente

### 4.3 Sistema de Tabs

Los tabs se dividen en dos categorías:

#### Tabs Core (siempre visibles)

| Tab | Icono | Contenido |
|-----|-------|-----------|
| **Resumen** | 📊 | Dashboard con métricas, timeline de actividad, alertas, próximas citas |
| **Citas** | 📅 | Historial y próximas citas, crear nueva cita (pre-filled con paciente) |
| **Facturas & Pagos** | 💰 | Facturas pendientes/pagadas, crear factura, registrar pago |
| **Documentos** | 📁 | Archivos subidos, recetas, documentos compartidos |
| **Historia Clínica** | 📋 | Notas médicas, alergias, medicamentos, condiciones, timeline médico |

#### Tabs de Módulos (dinámicos según especialidad)

| Tab | Módulo | Contenido |
|-----|--------|-----------|
| **Odontogramas** | `dental` | Chart dental interactivo, historial de odontogramas |
| **Tratamientos** | `dental` | Planes de tratamiento dental, progreso |
| **Notas SOAP** | `general` | Notas de consulta en formato SOAP |
| **Recetas** | `general` | Prescripciones médicas |
| **Sesiones** | `psychology` | Sesiones terapéuticas, escalas PHQ-9/GAD-7 |
| **Ejercicios** | `physiotherapy` | Planes de ejercicios, rehabilitación |
| **Body Map** | `dermatology` | Fotografías de lesiones, seguimiento visual |

**Los tabs de módulos solo aparecen si el módulo está activado para el provider.**

---

## 5. Comportamiento de Cada Tab

### 5.1 Tab Resumen (Dashboard)

```
┌─────────────────────────────────────────────────┐
│  Métricas rápidas:                              │
│  ┌──────┐ ┌──────────┐ ┌───────────┐ ┌───────┐ │
│  │ 3    │ │ 2        │ │ $5,400    │ │ Hace  │ │
│  │ Citas│ │ Tratam.  │ │ Balance   │ │ 3 días│ │
│  │ prox.│ │ activos  │ │ pendiente │ │ última│ │
│  └──────┘ └──────────┘ └───────────┘ └───────┘ │
│                                                  │
│  ⚠️ Alertas                                      │
│  ├── Pago pendiente hace 30+ días               │
│  └── Tratamiento #2 no ha progresado en 2 meses │
│                                                  │
│  📅 Próximas citas          ⏰ Actividad reciente│
│  ├── Mar 11, 9:00 Limpieza  │ Hoy: Factura pagada│
│  └── Jue 20, 14:00 Control  │ Ayer: Cita completada│
│                              │ 3 Feb: Odontograma │
│                                                  │
│  ⚡ Acciones rápidas                              │
│  [+ Cita] [+ Factura] [+ Documento] [+ Nota]    │
└─────────────────────────────────────────────────┘
```

### 5.2 Tab Citas

- **Vista de lista** con filtros: próximas, pasadas, canceladas
- **Botón "Nueva cita"** que abre modal/form con paciente pre-seleccionado
- Cada cita muestra: fecha, hora, tipo, servicio, provider, status
- Click en cita → detalle expandible o modal con notas, servicios, acciones

### 5.3 Tab Tratamientos (Módulo Dental)

- **Lista de planes de tratamiento** del paciente
- **Botón "Nuevo plan"** abre form con paciente pre-seleccionado
- Cada plan muestra: progreso (%), procedimientos, costo total, balance
- Vista de detalle del plan con timeline de procedimientos

### 5.4 Tab Odontogramas (Módulo Dental)

- **Lista de odontogramas** del paciente con fechas
- **Botón "Nuevo odontograma"** abre la interfaz dental con paciente pre-seleccionado
- Preview visual del último odontograma
- Comparación entre odontogramas (evolución)

### 5.5 Tab Facturas & Pagos

- **Vista dividida**: Facturas | Pagos
- **Facturas**: Lista con status (pendiente, pagada, vencida), botón "Nueva factura" pre-filled
- **Pagos**: Historial de pagos, botón "Registrar pago"
- Resumen: Total facturado, total cobrado, balance pendiente

### 5.6 Tab Documentos

- **Grid/Lista de documentos** con thumbnails
- **Categorías**: Recetas, exámenes, consentimientos, otros
- **Botón "Subir documento"** con asociación automática al paciente
- Compartir documento con paciente (si tiene portal activo)

### 5.7 Tab Historia Clínica

- **Timeline médico** cronológico (toda la interacción)
- **Secciones editables**: Alergias, medicamentos actuales, condiciones crónicas
- **Notas médicas** por fecha de consulta
- **Antecedentes familiares y personales**

---

## 6. Interacciones y UX Patterns

### 6.1 Creación In-Context

Toda creación de entidades clínicas se hace **dentro del contexto del paciente**:

```typescript
// ❌ ANTES: Navegar a página independiente
navigate('/odontograms/new'); // Requiere seleccionar paciente

// ✅ AHORA: Acción dentro del tab del paciente
// El componente ya tiene el patientId del contexto
<NewOdontogramForm patientId={patient.id} onComplete={refreshTab} />
```

**Patterns de creación:**
1. **Modal**: Para formularios cortos (nueva cita, registrar pago)
2. **Slide-over panel**: Para formularios medianos (nueva factura)
3. **Full-tab**: Para interfaces complejas (odontograma, plan de tratamiento)

### 6.2 Navegación por URL

Los tabs se reflejan en la URL para permitir deep-linking y compartir:

```
/patients/abc123                    → Tab por defecto (Resumen)
/patients/abc123?tab=appointments   → Tab de citas
/patients/abc123?tab=odontograms    → Tab de odontogramas
/patients/abc123?tab=treatments&action=new → Nuevo tratamiento
```

### 6.3 Persistencia de Estado

- El tab activo se persiste en la URL (query param `tab`)
- Al volver de una sub-navegación, se restaura el tab anterior
- Los filtros dentro de cada tab se mantienen durante la sesión
- El scroll position se preserva al cambiar entre tabs

### 6.4 Responsive Design

```
Desktop (>1024px):
┌──────────────────────────────────┐
│ Header del paciente              │
│ [Tab1] [Tab2] [Tab3] [Tab4] ... │
│ Contenido del tab                │
└──────────────────────────────────┘

Tablet (768-1024px):
┌──────────────────────────────────┐
│ Header del paciente (compacto)   │
│ [Tab1] [Tab2] [Tab3] [→ más]    │
│ Contenido del tab                │
└──────────────────────────────────┘

Mobile (<768px):
┌──────────────────────────────────┐
│ Header del paciente (minimal)    │
│ [Dropdown: seleccionar sección]  │
│ Contenido del tab                │
└──────────────────────────────────┘
```

---

## 7. Componentes Técnicos

### 7.1 Estructura de Archivos

```
frontend/src/
├── pages/
│   ├── PatientsListPage.tsx          # Lista de pacientes
│   └── PatientDetailPage.tsx         # Detalle con tabs (REESCRIBIR)
│
├── components/
│   ├── patient/
│   │   ├── PatientHeader.tsx         # Header siempre visible
│   │   ├── PatientTabsContainer.tsx  # Contenedor de tabs dinámicos
│   │   └── PatientQuickActions.tsx   # Botones de acción rápida
│   │
│   ├── patient-tabs/                 # Tab components (core)
│   │   ├── SummaryTab.tsx
│   │   ├── AppointmentsTab.tsx
│   │   ├── InvoicesTab.tsx
│   │   ├── PaymentsTab.tsx
│   │   ├── DocumentsTab.tsx
│   │   └── MedicalHistoryTab.tsx
│   │
│   └── modules/                      # Tab components (por módulo)
│       ├── dental/
│       │   ├── OdontogramsTab.tsx
│       │   └── TreatmentPlansTab.tsx
│       ├── general/
│       │   ├── ClinicalNotesTab.tsx
│       │   └── PrescriptionsTab.tsx
│       └── psychology/
│           ├── SessionsTab.tsx
│           └── AssessmentsTab.tsx
│
├── hooks/
│   ├── usePatientDetail.ts           # Fetch y cache de datos del paciente
│   ├── usePatientTabs.ts             # Lógica de tabs dinámicos
│   └── useActiveModules.ts           # Módulos activos del provider
│
└── types/
    └── patient.ts                    # Tipos del detalle de paciente
```

### 7.2 Componente Principal

```typescript
// PatientDetailPage.tsx (concepto)
export default function PatientDetailPage() {
  const { patientId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'summary';

  const { patient, loading } = usePatientDetail(patientId);
  const { tabs } = usePatientTabs(); // Core tabs + module tabs

  return (
    <div>
      <PatientHeader patient={patient} />

      <Tabs value={activeTab} onValueChange={(tab) =>
        setSearchParams({ tab })
      }>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.icon} {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id}>
            <tab.component patientId={patientId} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

### 7.3 Hook de Tabs Dinámicos

```typescript
// usePatientTabs.ts (concepto)
export function usePatientTabs() {
  const { activeModules } = useActiveModules();

  const coreTabs = [
    { id: 'summary', label: 'Resumen', icon: '📊', component: SummaryTab },
    { id: 'appointments', label: 'Citas', icon: '📅', component: AppointmentsTab },
    { id: 'invoices', label: 'Facturas', icon: '💰', component: InvoicesTab },
    { id: 'documents', label: 'Documentos', icon: '📁', component: DocumentsTab },
    { id: 'history', label: 'Historia', icon: '📋', component: MedicalHistoryTab },
  ];

  const moduleTabs = activeModules.flatMap(mod =>
    mod.patientTabs.map(tab => ({
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
      component: tab.component,
    }))
  );

  return { tabs: [...coreTabs, ...moduleTabs] };
}
```

---

## 8. Migración de Páginas Independientes

### Lo que se depreca

| Página Actual | Ruta | Nuevo Acceso |
|--------------|------|-------------|
| `OdontogramsListPage` | `/odontograms` | → `/patients/:id?tab=odontograms` |
| `NewOdontogramPage` | `/odontograms/new` | → Modal/inline dentro del tab de odontogramas |
| `TreatmentPlansListPage` | `/treatment-plans` | → `/patients/:id?tab=treatments` |
| `NewTreatmentPlanPage` | `/treatment-plans/new` | → Modal/inline dentro del tab de tratamientos |
| `InvoicesListPage` (por paciente) | `/invoices` | → `/patients/:id?tab=invoices` |
| `NewInvoicePage` | `/invoices/new` | → Modal/inline dentro del tab de facturas |
| `PatientDetailPage` (vieja) | `/patients/:id` | → Se reemplaza con nueva versión con tabs |
| `PatientDashboardPage` | `/patients/:id/dashboard` | → Se fusiona como la NUEVA `/patients/:id` |

### Lo que se mantiene (como vistas globales)

| Página | Ruta | Propósito |
|--------|------|-----------|
| `InvoicesListPage` | `/invoices` | Vista global de TODAS las facturas (acceso desde Reportes) |
| `CalendarPage` | `/calendar` | Agenda global de citas |
| `ReportsPage` | `/reports` | Reportes y analíticas |

### Rutas del Router Actualizadas

```
/patients                           → PatientsListPage (lista con búsqueda)
/patients/:id                       → PatientDetailPage (nuevo, con tabs)
/patients/:id?tab=summary           → Tab de resumen
/patients/:id?tab=appointments      → Tab de citas
/patients/:id?tab=treatments        → Tab de tratamientos (dental)
/patients/:id?tab=odontograms       → Tab de odontogramas (dental)
/patients/:id?tab=invoices          → Tab de facturas y pagos
/patients/:id?tab=documents         → Tab de documentos
/patients/:id?tab=history           → Tab de historia clínica
/patients/:id?tab=exams             → Tab de exámenes (futuro)

/calendar                           → CalendarPage (agenda global)
/invoices                           → InvoicesListPage (vista global, desde Reportes)
/reports                            → ReportsPage
/clinics                            → ClinicsPage (gestión de consultorios)
/staff                              → StaffPage (gestión de equipo)
/settings                           → SettingsPage (incluye servicios, chatbot, etc.)
```

---

## 9. Reglas para Nuevos Módulos

**Cada nuevo módulo de especialidad DEBE seguir este patrón:**

### 9.1 Registro de Tabs

```typescript
// modules/dental/index.ts
export const dentalModule: ModuleDefinition = {
  id: 'dental',
  name: 'Odontología',
  specialty: MedicalSpecialty.GENERAL_DENTISTRY,

  // Tabs que aparecen en el detalle del paciente
  patientTabs: [
    {
      id: 'odontograms',
      label: 'Odontogramas',
      icon: '🦷',
      component: lazy(() => import('./tabs/OdontogramsTab')),
      order: 10, // Después de los tabs core
    },
    {
      id: 'treatments',
      label: 'Tratamientos',
      icon: '📋',
      component: lazy(() => import('./tabs/TreatmentPlansTab')),
      order: 11,
    },
  ],

  // Servicios específicos del módulo
  serviceCategories: ['dental-cleaning', 'restoration', 'endodontics', ...],

  // Configuración adicional del dashboard
  dashboardWidgets: [...],
};
```

### 9.2 Checklist de Nuevo Módulo

- [ ] Definir `ModuleDefinition` con `patientTabs`
- [ ] Cada tab recibe `patientId` como prop
- [ ] Creación de entidades via modal/panel (NO página separada)
- [ ] El tab maneja su propio state y fetch de datos
- [ ] Los tabs respetan el orden definido en `order`
- [ ] Componentes usan lazy loading (`React.lazy`)
- [ ] Tests: tab se renderiza correctamente dentro del detalle
- [ ] Tests: creación de entidades funciona con patientId pre-filled

### 9.3 Anti-Patterns (NO hacer)

```
❌ Crear una página independiente para un módulo de especialidad
❌ Requerir selección de paciente cuando ya se está en contexto de paciente
❌ Navegar fuera del detalle de paciente para completar una acción clínica
❌ Agregar items al sidebar por cada módulo de especialidad
❌ Duplicar la lógica de fetch de paciente en cada tab
```

---

## 10. Impacto en el Portal del Paciente

El portal del paciente (doc `07-PORTAL-PACIENTE.md`) sigue un diseño similar pero desde la perspectiva del paciente:

- El paciente ve sus **providers** como entidades principales
- Dentro de cada provider, ve la misma estructura de tabs (citas, tratamientos, facturas, documentos)
- La diferencia es que el paciente ve un **dashboard unificado** que agrega todos sus providers

---

## 11. Estado de Componentes Existentes

### Ya implementados (necesitan migración)

| Componente | Ubicación | Estado |
|-----------|-----------|--------|
| `PatientDashboardPage` | `pages/PatientDashboardPage.tsx` | 8 tabs funcionales → fusionar como nueva PatientDetailPage |
| `PatientSummaryTab` | `components/dashboard/PatientSummaryTab.tsx` | Funcional → mover a `patient-tabs/` |
| `PatientAppointmentsTab` | `components/dashboard/PatientAppointmentsTab.tsx` | Funcional → mover a `patient-tabs/` |
| `PatientTreatmentsTab` | `components/dashboard/PatientTreatmentsTab.tsx` | Funcional → mover a `patient-tabs/` |
| `PatientOdontogramsTab` | `components/dashboard/PatientOdontogramsTab.tsx` | Funcional → mover a `modules/dental/` |
| `PatientInvoicesTab` | `components/dashboard/PatientInvoicesTab.tsx` | Funcional → mover a `patient-tabs/` |
| `PatientPaymentsTab` | `components/dashboard/PatientPaymentsTab.tsx` | Funcional → mover a `patient-tabs/` |
| `PatientDocumentsTab` | `components/dashboard/PatientDocumentsTab.tsx` | Funcional → mover a `patient-tabs/` |
| `PatientMedicalHistoryTab` | `components/dashboard/PatientMedicalHistoryTab.tsx` | Funcional → mover a `patient-tabs/` |

### Por crear

| Componente | Propósito |
|-----------|-----------|
| `PatientHeader` | Header persistente con datos del paciente y acciones rápidas |
| `PatientTabsContainer` | Contenedor que renderiza tabs core + módulos dinámicos |
| `usePatientTabs` | Hook que resuelve tabs según módulos activos |
| `useActiveModules` | Hook que obtiene módulos activos del provider |
