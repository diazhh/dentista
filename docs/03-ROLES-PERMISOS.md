# Roles y Permisos - DentiCloud

**Control de Acceso Basado en Roles (RBAC)**

---

## Roles del Sistema

### 1. Super Admin

**Descripción:** Administrador de la plataforma DentiCloud

**Acceso:**
- ✅ Gestionar todos los tenants (dentistas)
- ✅ Crear clínicas y consultorios
- ✅ Ver métricas de plataforma
- ✅ Gestionar planes de suscripción
- ✅ Soporte técnico (impersonate users)
- ✅ Ver logs de auditoría globales

**No puede:**
- ❌ Ver datos clínicos de pacientes (HIPAA)
- ❌ Acceder a historias médicas

**Dashboard:**
```
┌────────────────────────────────────────┐
│ SUPER ADMIN - PLATFORM                 │
├────────────────────────────────────────┤
│ Total Tenants: 247                     │
│ MRR: $68,450                          │
│ System Uptime: 99.98%                  │
│                                        │
│ Recent Signups                         │
│ Alerts                                 │
│ Support Tickets                        │
└────────────────────────────────────────┘
```

---

### 2. Dentista (Tenant Owner)

**Descripción:** Dentista con su propia suscripción

**Acceso:**
- ✅ CRUD de SUS pacientes (vía PatientDentistRelations)
- ✅ Crear y gestionar citas
- ✅ Odontograma y treatment plans
- ✅ Facturación a pacientes
- ✅ Invitar staff
- ✅ Ver reportes de su práctica
- ✅ Configurar WhatsApp bot
- ✅ Acceder a consultorios asignados
- ✅ Exportar SUS datos

**Permisos especiales:**
- ✅ Puede trabajar en múltiples consultorios (OperatoryAssignments)
- ✅ Puede tener múltiples staff
- ✅ Sus pacientes le pertenecen (portables)

**Dashboard:**
```
┌────────────────────────────────────────┐
│ DR. JUAN PÉREZ                         │
├────────────────────────────────────────┤
│ HOY: Lunes, 20 de Enero                │
│                                        │
│ MIS CITAS HOY                          │
│ ├─ 9:00 AM Paciente A                │
│ ├─ 10:30 AM Paciente B                │
│ └─ 2:00 PM Paciente C                 │
│                                        │
│ MIS ESTADÍSTICAS                       │
│ ├─ Pacientes activos: 150            │
│ ├─ Citas este mes: 42                │
│ └─ Revenue: $12,500                   │
│                                        │
│ CONSULTORIOS                           │
│ ├─ Consultorio 1 (Clínica ABC)       │
│ └─ Consultorio 3 (Clínica XYZ)       │
└────────────────────────────────────────┘
```

**Queries con RLS:**
```typescript
// Ver MIS pacientes (relación activa)
const myPatients = await prisma.patient.findMany({
  where: {
    dentist_relations: {
      some: {
        dentist_id: dentistId, // tenant_id
        is_active: true
      }
    }
  }
});

// Ver MIS citas
const myAppointments = await prisma.appointment.findMany({
  where: {
    dentist_id: dentistId // tenant_id
  }
});
```

---

### 3. Staff (Recepcionista/Asistente/Billing)

**Descripción:** Staff que trabaja para UNO o MÁS dentistas

**Acceso vía TenantMemberships:**
- Un staff puede tener múltiples memberships
- Cada membership tiene role y permisos específicos

**Sub-roles:**

#### 3a. Staff Recepcionista

**Acceso:**
- ✅ Ver TODOS los pacientes del dentista (para scheduling)
- ✅ Crear/editar/cancelar citas
- ✅ Check-in pacientes
- ✅ Enviar recordatorios
- ✅ Upload documentos básicos

**No puede:**
- ❌ Ver historia médica detallada
- ❌ Ver información financiera
- ❌ Editar odontogramas
- ❌ Cambiar configuración

**Dashboard:**
```
┌────────────────────────────────────────┐
│ RECEPCIÓN - Ana García                 │
│ Trabajando para: Dr. Pérez             │
├────────────────────────────────────────┤
│ CITAS HOY                              │
│ ├─ 9:00 AM Dr. Pérez - Paciente A    │
│ │  [Check-in] [Confirmar]            │
│ ├─ 10:30 AM Dr. Pérez - Paciente B   │
│ └─ ...                                 │
│                                        │
│ PENDIENTES                             │
│ ├─ 3 confirmaciones por enviar        │
│ └─ 2 pacientes en sala de espera     │
└────────────────────────────────────────┘
```

#### 3b. Staff Billing

**Acceso:**
- ✅ Ver TODOS los pacientes del dentista
- ✅ Crear y enviar facturas
- ✅ Procesar pagos
- ✅ Ver cuentas por cobrar
- ✅ Ver reportes financieros

**No puede:**
- ❌ Ver historia médica
- ❌ Editar odontogramas
- ❌ Cambiar configuración

**Dashboard:**
```
┌────────────────────────────────────────┐
│ BILLING - Carlos Ruiz                  │
│ Trabajando para: Dr. Pérez, Dra. López│
├────────────────────────────────────────┤
│ HOY                                    │
│ ├─ Pagos recibidos: $2,340           │
│ ├─ Facturas creadas: 8               │
│ └─ Pendiente: $890                    │
│                                        │
│ CUENTAS POR COBRAR                     │
│ ├─ Dr. Pérez: $4,560                 │
│ └─ Dra. López: $2,120                │
└────────────────────────────────────────┘
```

**Queries con permisos:**
```typescript
// Staff puede ver TODOS los pacientes del dentista (no filtrado)
const allPatients = await prisma.patient.findMany({
  where: {
    dentist_relations: {
      some: {
        dentist_id: { in: staffMemberDentistIds }, // Todos los dentistas para los que trabaja
        is_active: true
      }
    }
  }
});
```

---

### 4. Paciente

**Descripción:** Paciente con acceso al portal

**Acceso:**
- ✅ Ver SU información personal
- ✅ Ver SUS citas (con CADA dentista)
- ✅ Agendar citas online
- ✅ Ver SUS facturas
- ✅ Pagar facturas
- ✅ Ver SUS documentos
- ✅ Ver SUS treatment plans
- ✅ Comunicarse con el consultorio

**Permisos especiales:**
- ✅ Puede ver historial con MÚLTIPLES dentistas
- ✅ Cada dentista tiene su propia sección en el portal

**Portal del Paciente:**
```
┌────────────────────────────────────────┐
│ PORTAL - Juan Rodríguez                │
├────────────────────────────────────────┤
│ MIS DENTISTAS                          │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ Dr. Juan Pérez (ACTUAL)          │  │
│ │ ├─ Última cita: 15 Ene 2025     │  │
│ │ ├─ Próxima: 3 Feb 2025          │  │
│ │ └─ [Ver Historial] [Nueva Cita] │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ Dra. María López (Anterior)      │  │
│ │ ├─ Última cita: 20 Dic 2024     │  │
│ │ ├─ Total de citas: 8            │  │
│ │ └─ [Ver Historial]              │  │
│ └──────────────────────────────────┘  │
│                                        │
│ PRÓXIMA CITA                           │
│ ├─ 3 Feb 2025, 10:00 AM             │
│ ├─ Dr. Pérez - Limpieza             │
│ └─ [Confirmar] [Reprogramar]         │
│                                        │
│ FACTURAS PENDIENTES                    │
│ └─ $340.00 - [Pagar]                 │
└────────────────────────────────────────┘
```

**Queries del paciente:**
```typescript
// Ver MI información con TODOS mis dentistas
const myDentists = await prisma.patientDentistRelation.findMany({
  where: {
    patient_id: patientId
  },
  include: {
    dentist: {
      select: {
        id: true,
        name: true,
        specialization: true
      }
    }
  },
  orderBy: {
    started_at: 'desc'
  }
});

// Ver MIS citas con un dentista específico
const myAppointmentsWithDentist = await prisma.appointment.findMany({
  where: {
    patient_id: patientId,
    dentist_id: selectedDentistId
  },
  orderBy: {
    start_time: 'desc'
  }
});
```

---

## Matriz de Permisos

| Feature | Super Admin | Dentista | Staff Recep | Staff Billing | Paciente |
|---------|------------|----------|-------------|---------------|----------|
| **Pacientes** |
| Ver todos los pacientes | ❌ (HIPAA) | ✅ MIS pacientes | ✅ Todos del dentista | ✅ Todos del dentista | ✅ Solo YO |
| Crear paciente | ❌ | ✅ | ✅ | ❌ | ❌ |
| Editar paciente | ❌ | ✅ MIS pacientes | ✅ Info básica | ❌ | ✅ Mi info básica |
| Ver historia médica | ❌ | ✅ MIS pacientes | ❌ | ❌ | ✅ MI historia |
| Editar historia médica | ❌ | ✅ MIS pacientes | ❌ | ❌ | ❌ |
| Exportar pacientes | ❌ | ✅ MIS pacientes | ❌ | ❌ | ❌ |
| **Citas** |
| Ver citas | ❌ | ✅ MIS citas | ✅ Todas del dentista | ✅ Todas del dentista | ✅ MIS citas |
| Crear cita | ❌ | ✅ | ✅ | ❌ | ✅ MIS citas |
| Editar cita | ❌ | ✅ MIS citas | ✅ | ❌ | ✅ MIS citas |
| Cancelar cita | ❌ | ✅ MIS citas | ✅ | ❌ | ✅ MIS citas |
| **Clinical** |
| Ver odontograma | ❌ | ✅ MIS pacientes | ❌ | ❌ | ✅ MI odontograma |
| Editar odontograma | ❌ | ✅ MIS pacientes | ❌ | ❌ | ❌ |
| Ver treatment plans | ❌ | ✅ MIS pacientes | ❌ | ❌ | ✅ MIS planes |
| Crear treatment plan | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Billing** |
| Ver facturas | ❌ | ✅ MIS facturas | ❌ | ✅ Todas del dentista | ✅ MIS facturas |
| Crear factura | ❌ | ✅ | ❌ | ✅ | ❌ |
| Procesar pago | ❌ | ✅ | ❌ | ✅ | ✅ MIS facturas |
| Ver reportes financieros | ✅ Platform | ✅ MIS reportes | ❌ | ✅ Del dentista | ❌ |
| **Configuración** |
| Gestionar clínicas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestionar consultorios | ✅ | ❌ | ❌ | ❌ | ❌ |
| Configurar WhatsApp | ❌ | ✅ | ❌ | ❌ | ❌ |
| Invitar staff | ❌ | ✅ | ❌ | ❌ | ❌ |
| Ver analytics | ✅ Platform | ✅ MIS analytics | ❌ | ✅ Del dentista | ❌ |
| **Suscripción** |
| Cambiar plan | ❌ | ✅ MI plan | ❌ | ❌ | ❌ |
| Ver billing | ✅ Todos | ✅ MI billing | ❌ | ❌ | ❌ |

---

## Implementación de Permisos

### Guards en NestJS

```typescript
// tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.params.tenantId || request.body.tenant_id;

    // Validar que el usuario tiene acceso a este tenant
    const membership = user.memberships.find(m => m.tenant_id === tenantId);

    if (!membership || membership.status !== 'active') {
      throw new ForbiddenException('No access to this tenant');
    }

    // Agregar contexto al request
    request.tenantContext = {
      userId: user.id,
      tenantId: tenantId,
      role: membership.role,
      permissions: membership.permissions
    };

    return true;
  }
}

// patient-access.guard.ts
@Injectable()
export class PatientAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { userId, tenantId, role } = request.tenantContext;
    const patientId = request.params.patientId;

    // Si es staff, tiene acceso a todos los pacientes del dentista
    if (role.startsWith('staff_')) {
      return true;
    }

    // Si es dentista, validar que el paciente tiene relación activa
    const hasAccess = await prisma.patientDentistRelation.findFirst({
      where: {
        patient_id: patientId,
        dentist_id: tenantId,
        is_active: true
      }
    });

    if (!hasAccess) {
      throw new ForbiddenException('No access to this patient');
    }

    return true;
  }
}
```

### Decorators

```typescript
// roles.decorator.ts
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// Usage
@Get('patients')
@Roles('dentist', 'staff_receptionist', 'staff_billing')
@UseGuards(TenantGuard, RolesGuard)
async getPatients(@Request() req) {
  const { tenantId, role } = req.tenantContext;

  // Aplicar filtros según role
  return this.patientsService.findAll(tenantId, role);
}
```

### CASL (Attribute-Based Access Control)

```typescript
// abilities.factory.ts
@Injectable()
export class AbilitiesFactory {
  createForUser(user: User, tenantContext: TenantContext) {
    const { can, cannot, build } = new AbilityBuilder(Ability);

    if (tenantContext.role === 'dentist') {
      // Dentista puede hacer todo con SUS pacientes
      can('manage', 'Patient', { dentist_id: tenantContext.tenantId });
      can('manage', 'Appointment', { dentist_id: tenantContext.tenantId });
      can('manage', 'TreatmentPlan', { dentist_id: tenantContext.tenantId });
      can('manage', 'Invoice', { dentist_id: tenantContext.tenantId });
    }

    if (tenantContext.role === 'staff_receptionist') {
      // Staff puede ver y editar citas
      can('read', 'Patient'); // Todos del dentista
      can('manage', 'Appointment', { dentist_id: tenantContext.tenantId });
      cannot('read', 'MedicalHistory'); // No puede ver historia médica
      cannot('read', 'Invoice'); // No puede ver facturas
    }

    if (tenantContext.role === 'staff_billing') {
      can('read', 'Patient'); // Todos del dentista
      can('read', 'Appointment');
      can('manage', 'Invoice', { dentist_id: tenantContext.tenantId });
      can('manage', 'Payment', { dentist_id: tenantContext.tenantId });
      cannot('read', 'MedicalHistory');
      cannot('update', 'DentalChart');
    }

    return build();
  }
}
```

---

## Escenarios de Permisos

### Escenario 1: Staff trabaja para 2 dentistas

```typescript
// Ana (staff) tiene 2 memberships:
const anaMemberships = [
  {
    tenant_id: 'dr-perez',
    role: 'staff_receptionist',
    status: 'active'
  },
  {
    tenant_id: 'dra-lopez',
    role: 'staff_billing',
    status: 'active'
  }
];

// Cuando Ana está en el workspace de Dr. Pérez:
// - Puede agendar citas
// - Puede ver todos los pacientes
// - NO puede ver facturas

// Cuando Ana está en el workspace de Dra. López:
// - Puede crear facturas
// - Puede procesar pagos
// - NO puede agendar citas
```

### Escenario 2: Paciente con múltiples dentistas

```typescript
// Juan (paciente) tiene 2 relaciones:
const juanDentists = [
  {
    dentist_id: 'dr-perez',
    is_active: true,
    started_at: '2024-01-01'
  },
  {
    dentist_id: 'dra-garcia',
    is_active: false, // Dentista anterior
    started_at: '2022-01-01',
    ended_at: '2023-12-31'
  }
];

// En el portal, Juan puede:
// - Ver su historial COMPLETO con Dra. García (2022-2023)
// - Ver su historial ACTUAL con Dr. Pérez (2024-presente)
// - Agendar nuevas citas solo con Dr. Pérez (dentista activo)
```

### Escenario 3: Dentista en múltiples consultorios

```typescript
// Dr. Pérez trabaja en 2 consultorios:
const drPerezOperatories = [
  {
    operatory_id: 'consultorio-1',
    clinic_id: 'clinica-abc',
    schedule: {
      monday: ['9:00-13:00', '14:00-18:00'],
      tuesday: ['9:00-13:00', '14:00-18:00'],
      wednesday: ['9:00-13:00']
    }
  },
  {
    operatory_id: 'consultorio-3',
    clinic_id: 'clinica-xyz',
    schedule: {
      thursday: ['9:00-17:00'],
      friday: ['9:00-14:00']
    }
  }
];

// Permisos:
// - Puede agendar citas EN AMBOS consultorios
// - Solo en los horarios asignados
// - Sistema valida disponibilidad según OperatoryAssignment
```

---

**Versión:** 3.0
**Última actualización:** 30 de Diciembre, 2025
