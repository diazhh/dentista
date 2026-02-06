# 02 - Roles y Permisos Actualizado

## 1. Roles del Sistema

### 1.1 Tabla de Roles

| Rol | Descripción | Scope |
|-----|-------------|-------|
| `SUPER_ADMIN` | Administrador de la plataforma | Global |
| `PROVIDER` | Profesional de salud (dentista, médico, psicólogo, etc.) | Tenant (su práctica) |
| `CLINIC_ADMIN` | Administrador de una clínica física | Clínica |
| `STAFF_MANAGER` | Gestiona agenda y pacientes de uno o más providers | Tenant(s) |
| `STAFF_RECEPTIONIST` | Recepción, agenda, atención al público | Tenant(s) o Clínica |
| `STAFF_BILLING` | Facturación y cobranza | Tenant(s) |
| `STAFF_ASSISTANT` | Asistente clínico | Tenant(s) |
| `PATIENT` | Paciente | Propio |

### 1.2 Jerarquía de Roles

```
SUPER_ADMIN
├── PROVIDER (owner de su tenant)
│   ├── STAFF_MANAGER
│   ├── STAFF_RECEPTIONIST
│   ├── STAFF_BILLING
│   └── STAFF_ASSISTANT
├── CLINIC_ADMIN (admin de su clínica)
│   ├── STAFF_RECEPTIONIST (de la clínica)
│   └── Clinic Staff
└── PATIENT (independiente)
```

---

## 2. Matriz de Permisos

### 2.1 Gestión de Pacientes

| Acción | SUPER_ADMIN | PROVIDER | CLINIC_ADMIN | STAFF_MANAGER | STAFF_RECEP | STAFF_BILLING | STAFF_ASSIST | PATIENT |
|--------|:-----------:|:--------:|:------------:|:-------------:|:-----------:|:-------------:|:------------:|:-------:|
| Ver lista pacientes (global) | x | - | - | - | - | - | - | - |
| Ver pacientes del tenant | - | x | - | x | x | Parcial | x | - |
| Crear/registrar paciente | - | x | - | x | x | - | - | - |
| Editar datos paciente | - | x | - | x | - | - | - | Propio |
| Ver historia clínica | - | x | - | - | - | - | x | Propio* |
| Crear nota clínica | - | x | - | - | - | - | - | - |
| Ver datos de facturación | - | x | - | - | - | x | - | Propio |
| Eliminar paciente | - | x | - | - | - | - | - | - |

*Propio = solo sus propios datos. El paciente decide qué comparte.

### 2.2 Gestión de Citas

| Acción | SUPER_ADMIN | PROVIDER | CLINIC_ADMIN | STAFF_MANAGER | STAFF_RECEP | STAFF_BILLING | STAFF_ASSIST | PATIENT |
|--------|:-----------:|:--------:|:------------:|:-------------:|:-----------:|:-------------:|:------------:|:-------:|
| Ver calendario global | x | - | x (su clínica) | - | - | - | - | - |
| Ver calendario del provider | - | Propio | - | Asignados | Asignados | - | Asignados | - |
| Crear cita | - | x | - | x | x | - | - | Via portal/chat |
| Editar cita | - | x | - | x | x | - | - | Propia (reschedule) |
| Cancelar cita | - | x | - | x | x | - | - | Propia |
| Ver citas propias | - | - | - | - | - | - | - | x |

### 2.3 Gestión de Clínica y Consultorios

| Acción | SUPER_ADMIN | PROVIDER | CLINIC_ADMIN | STAFF_MANAGER | STAFF_RECEP | PATIENT |
|--------|:-----------:|:--------:|:------------:|:-------------:|:-----------:|:-------:|
| Crear clínica | x | - | - | - | - | - |
| Editar clínica | x | - | x (propia) | - | - | - |
| Crear consultorio | x | - | x | - | - | - |
| Asignar consultorio | x | - | x | - | - | - |
| Ver disponibilidad | x | x | x | x | x | - |
| Reservar consultorio | - | x | x | - | - | - |

### 2.4 Facturación

| Acción | SUPER_ADMIN | PROVIDER | CLINIC_ADMIN | STAFF_MANAGER | STAFF_RECEP | STAFF_BILLING | PATIENT |
|--------|:-----------:|:--------:|:------------:|:-------------:|:-----------:|:-------------:|:-------:|
| Crear factura | - | x | - | - | - | x | - |
| Ver facturas | - | x | - | - | - | x | Propias |
| Registrar pago | - | x | - | - | - | x | - |
| Ver reportes financieros | - | x | - | - | - | x | - |

### 2.5 Portal del Paciente

| Acción | PATIENT |
|--------|:-------:|
| Ver sus citas (todos sus providers) | x |
| Agendar cita (via portal o chatbot) | x |
| Ver su historial médico | x |
| Subir exámenes médicos | x |
| Compartir documentos con provider | x |
| Revocar acceso a datos | x |
| Gestionar consentimientos | x |
| Ver facturas y pagos | x |
| Actualizar perfil | x |
| Unirse a la red de un provider | x |

---

## 3. Sistema de Staff Multi-Provider

### 3.1 Cómo funciona

Un staff puede trabajar para múltiples providers. Esto se gestiona a través de `TenantMembership`:

```
Staff A → TenantMembership → Provider 1 (STAFF_RECEPTIONIST)
       → TenantMembership → Provider 2 (STAFF_MANAGER)
       → TenantMembership → Provider 3 (STAFF_BILLING)
```

El staff ve un **tenant switcher** en su interfaz para cambiar entre los providers que gestiona.

### 3.2 Permisos Granulares por Membership

Cada `TenantMembership` tiene un campo `permissions` (JSON) que permite configuración granular:

```json
{
  "patients": {
    "view": true,
    "create": true,
    "edit": true,
    "delete": false
  },
  "appointments": {
    "view": true,
    "create": true,
    "edit": true,
    "cancel": true
  },
  "billing": {
    "view": false,
    "create": false
  },
  "clinical": {
    "viewNotes": false,
    "viewDocuments": true
  }
}
```

### 3.3 Staff de Clínica vs. Staff de Provider

| Aspecto | Staff de Provider | Staff de Clínica |
|---------|-------------------|------------------|
| Contratado por | Provider (dentista, médico) | Clínica |
| Ve datos de | Pacientes del provider | Agenda de consultorios |
| Gestiona | Agenda, pacientes, facturación | Recursos, consultorios, mantenimiento |
| Modelo | TenantMembership | ClinicStaff |
| Switch context | Entre providers | No aplica |

---

## 4. CASL Abilities Actualizadas

### 4.1 Provider Abilities

```typescript
export function defineProviderAbilities(user: User, tenantId: string) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  // Pacientes de su tenant
  can('manage', 'Patient', { tenantId });
  cannot('delete', 'Patient'); // Solo desactivar

  // Citas de su tenant
  can('manage', 'Appointment', { tenantId });

  // Notas clínicas
  can('manage', 'ClinicalNote', { providerId: user.id, tenantId });

  // Facturación
  can('manage', 'Invoice', { tenantId });
  can('manage', 'Payment', { tenantId });

  // Documentos
  can('manage', 'Document', { tenantId });

  // Servicios médicos
  can('manage', 'MedicalService', { tenantId });

  // Módulos de especialidad
  can('manage', 'ProviderModule', { providerId: user.id });

  // Chatbot config
  can('manage', 'ChatbotConfig', { tenantId });

  // Staff
  can('manage', 'TenantMembership', { tenantId });

  // Consultorios (solo ver y reservar)
  can('read', 'ConsultationRoom');
  can('create', 'RoomAssignment', { tenantId });

  return build();
}
```

### 4.2 Patient Abilities

```typescript
export function definePatientAbilities(user: User, patientId: string) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  // Su propio perfil
  can('read', 'Patient', { id: patientId });
  can('update', 'Patient', { id: patientId });

  // Sus citas
  can('read', 'Appointment', { patientId });
  can('create', 'Appointment', { patientId }); // Via portal/chatbot

  // Sus documentos
  can('manage', 'MedicalExam', { patientId });
  can('read', 'Document', { patientId });

  // Sus consentimientos
  can('manage', 'PatientConsent', { patientId });

  // Compartir documentos
  can('manage', 'SharedDocument', { patientId });

  // Sus facturas y pagos (solo lectura)
  can('read', 'Invoice', { patientId });
  can('read', 'Payment', { patientId });

  // Sus relaciones con providers
  can('read', 'ProviderPatientRelation', { patientId });
  can('update', 'ProviderPatientRelation', { patientId }); // Aceptar/rechazar

  return build();
}
```

### 4.3 Clinic Admin Abilities

```typescript
export function defineClinicAdminAbilities(user: User, clinicId: string) {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  // Su clínica
  can('read', 'Clinic', { id: clinicId });
  can('update', 'Clinic', { id: clinicId });

  // Consultorios
  can('manage', 'ConsultationRoom', { clinicId });

  // Asignaciones
  can('manage', 'RoomAssignment', { roomId: { $in: 'clinic.rooms' } });

  // Staff de clínica
  can('manage', 'ClinicStaff', { clinicId });

  // Reportes de ocupación
  can('read', 'Report', { clinicId });

  return build();
}
```

---

## 5. Flujo de Autenticación Actualizado

### 5.1 Login → Determinar contexto

```
1. User se autentica (email/password o OAuth)
2. Backend verifica credenciales
3. Si es PROVIDER → JWT incluye tenantId de su tenant
4. Si es STAFF → JWT incluye lista de tenantIds donde tiene membership
5. Si es PATIENT → JWT incluye patientId + lista de providerIds vinculados
6. Si es CLINIC_ADMIN → JWT incluye clinicId
7. Si es SUPER_ADMIN → JWT incluye flag superAdmin
```

### 5.2 JWT Payload Extendido

```typescript
interface JWTPayload {
  sub: string;          // userId
  email: string;
  role: UserRole;
  tenantId?: string;    // Para PROVIDER
  tenantIds?: string[]; // Para STAFF (múltiples tenants)
  patientId?: string;   // Para PATIENT
  clinicId?: string;    // Para CLINIC_ADMIN
  isSuperAdmin: boolean;
}
```
