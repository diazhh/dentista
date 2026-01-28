# Arquitectura del Sistema - DentiCloud

**Sistema SaaS Multi-Tenant con Single Database**

---

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
3. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
4. [Multi-Tenancy con Single DB](#multi-tenancy-con-single-db)
5. [Módulos del Sistema](#módulos-del-sistema)
6. [Integraciones](#integraciones)
7. [Seguridad y Compliance](#seguridad-y-compliance)

---

## Visión General

### Modelo de Negocio

DentiCloud es un SaaS donde:
- **Clientes:** TODOS los dentistas (cada uno paga suscripción)
- **Tenants:** Cada dentista es un tenant lógico
- **Base de datos:** Single DB con row-level security por `tenant_id`
- **Pacientes:** Relación N:M con dentistas (un paciente puede tener múltiples dentistas)
- **Staff:** Trabajan para múltiples dentistas (memberships)
- **Clínicas:** Creadas por super admin, contienen consultorios
- **Consultorios:** Compartidos por múltiples dentistas según horarios

### Stack Tecnológico

**Frontend:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- TanStack Query (data fetching)

**Backend:**
- NestJS 10+
- TypeScript
- Prisma ORM
- PostgreSQL 15+
- Redis (cache & queue)
- BullMQ (job queue)

**Infrastructure:**
- AWS (ECS, RDS, ElastiCache, S3)
- Docker
- Terraform (IaC)
- GitHub Actions (CI/CD)

---

## Arquitectura de Alto Nivel

```
┌──────────────────────────────────────────────────────────────┐
│                         USERS                                 │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Dentistas│  │  Staff   │  │ Pacientes│  │SuperAdmin│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                  Load Balancer (ALB)                          │
└───────────┬──────────────────────────────────────┬───────────┘
            │                                       │
            ▼                                       ▼
┌───────────────────┐                    ┌──────────────────┐
│   Next.js App     │                    │   NestJS API     │
│   (Frontend)      │◄───────REST────────┤   (Backend)      │
│                   │                    │                  │
│ - Multi-tenant UI │                    │ - Row-level RLS  │
│ - Staff Dashboard │                    │ - Tenant context │
│ - Patient Portal  │                    │ - WhatsApp Bot   │
└───────────────────┘                    └────────┬─────────┘
                                                  │
        ┌─────────────────────────────────────────┼──────────────────┐
        │                                         │                  │
        ▼                                         ▼                  ▼
┌──────────────┐                       ┌──────────────┐    ┌─────────────┐
│ PostgreSQL   │                       │    Redis     │    │   AWS S3    │
│              │                       │              │    │             │
│ SINGLE DB:   │                       │ - Cache      │    │ - Documents │
│ ├─ Users     │                       │ - Sessions   │    │ - Images    │
│ ├─ Tenants   │                       │ - Queue      │    │ - X-rays    │
│ ├─ Patients  │                       │ - Rate Limit │    └─────────────┘
│ ├─ Clinics   │                       └──────┬───────┘
│ ├─ Operatory │                              │
│ ├─ Appoint.  │                              ▼
│ └─ ...       │                    ┌──────────────────┐
└──────────────┘                    │   BullMQ Workers │
                                    │                  │
                                    │ - Email jobs     │
                                    │ - SMS jobs       │
                                    │ - WhatsApp jobs  │
                                    │ - Reminders      │
                                    └──────────────────┘
```

---

## Arquitectura de Base de Datos

### Decisión: Single Database

**❌ Opción Rechazada:** Database-per-Tenant
- Demasiado compleja para este caso de uso
- Difícil de gestionar 1000+ databases
- Problemas con connection pooling
- Dificulta reportes cross-tenant

**✅ Opción Seleccionada:** Single Database con Row-Level Security
- Más simple de implementar y mantener
- Escalable hasta 10,000+ tenants
- Queries eficientes con índices adecuados
- Facilita features cross-tenant (si se necesitan en futuro)

### Row-Level Security (RLS)

Cada query incluye filtro por `tenant_id`:

```typescript
// Ejemplo: Obtener pacientes del dentista actual
const patients = await prisma.patient.findMany({
  where: {
    patientDentistRelations: {
      some: {
        dentistId: currentDentistId, // tenant_id
        isActive: true
      }
    }
  }
});
```

### Índices Críticos

```sql
-- Índices en tenant_id para row-level filtering
CREATE INDEX idx_patients_tenant ON patients(tenant_id);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_dental_charts_tenant ON dental_charts(tenant_id);

-- Índices compuestos para queries comunes
CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, appointment_date);
CREATE INDEX idx_patients_tenant_status ON patients(tenant_id, status);

-- Índice para relación N:M paciente-dentista
CREATE INDEX idx_patient_dentist_active ON patient_dentist_relations(dentist_id, is_active);
```

---

## Multi-Tenancy con Single DB

### Context Service

Cada request incluye el contexto del tenant actual:

```typescript
// tenant-context.service.ts
export class TenantContext {
  userId: string;          // Usuario actual
  tenantId: string;        // Dentista (tenant) actual
  role: UserRole;          // owner | dentist | staff | patient
  clinicId?: string;       // Si está trabajando en clínica
  operatoryIds?: string[]; // Consultorios asignados
}

// Middleware para extraer contexto del JWT
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const token = extractToken(req);
    const decoded = verifyJWT(token);

    req.tenantContext = {
      userId: decoded.userId,
      tenantId: decoded.activeTenantId, // Seleccionado en frontend
      role: decoded.memberships.find(m => m.tenantId === decoded.activeTenantId).role,
      // ...
    };

    next();
  }
}
```

### Tenant-Scoped Repository Pattern

```typescript
// base-repository.ts
export abstract class BaseTenantRepository<T> {
  constructor(protected prisma: PrismaService) {}

  // Todas las queries automáticamente filtran por tenant_id
  async findMany(where: any = {}) {
    const tenantId = this.getTenantId(); // From AsyncLocalStorage

    return this.prisma[this.model].findMany({
      where: {
        ...where,
        tenant_id: tenantId, // Siempre incluido
      }
    });
  }

  async create(data: any) {
    const tenantId = this.getTenantId();

    return this.prisma[this.model].create({
      data: {
        ...data,
        tenant_id: tenantId,
      }
    });
  }
}

// patient.repository.ts
export class PatientRepository extends BaseTenantRepository<Patient> {
  protected model = 'patient';

  // Queries específicas de paciente
  async findActiveByDentist(dentistId: string) {
    return this.findMany({
      patientDentistRelations: {
        some: {
          dentistId,
          isActive: true,
        }
      }
    });
  }
}
```

---

## Módulos del Sistema

### 1. Authentication & Authorization Module

**Responsabilidades:**
- Registro y login de usuarios
- OAuth (Google, Apple, Microsoft)
- JWT tokens (access + refresh)
- Multi-tenant context management
- Role-based access control

**Entidades:**
- Users
- Tenants
- TenantMemberships (N:M Users ↔ Tenants)
- Sessions

### 2. Patient Management Module

**Responsabilidades:**
- CRUD de pacientes
- Historia médica
- Relación N:M paciente-dentista
- Documentos del paciente
- Portal de pacientes

**Entidades:**
- Patients
- PatientDentistRelations (N:M)
- MedicalHistories
- PatientDocuments

**Features clave:**
- Un paciente puede tener múltiples dentistas
- Paciente ve su historial con CADA dentista en el portal
- Transfer de paciente entre dentistas

### 3. Scheduling Module

**Responsabilidades:**
- Gestión de citas
- Disponibilidad de consultorios
- Asignación de consultorios a dentistas
- Recordatorios automáticos
- Recurring appointments

**Entidades:**
- Appointments
- Operatories (Consultorios)
- OperatoryAssignments (N:M Dentista ↔ Consultorio)
- Schedules
- Waitlist

**Lógica compleja:**
- Validar disponibilidad de consultorio según horarios
- Detectar conflictos de schedule
- Múltiples dentistas en mismo consultorio

### 4. Clinical Module

**Responsabilidades:**
- Odontograma digital
- Treatment plans
- Procedure tracking
- Clinical notes

**Entidades:**
- DentalCharts
- TreatmentPlans
- Procedures
- ClinicalNotes

### 5. Billing & Payments Module

**Responsabilidades:**
- Facturación a pacientes
- Procesamiento de pagos (Stripe)
- Cuentas por cobrar
- Reportes financieros

**Entidades:**
- Invoices
- Payments
- PaymentPlans

### 6. Communication Module

**Responsabilidades:**
- Email (SendGrid)
- SMS (Twilio)
- WhatsApp (Baileys)
- Recordatorios automáticos

**Entidades:**
- Communications
- Templates
- WhatsAppSessions

### 7. WhatsApp Chatbot Module ⭐ (CRÍTICO)

**Responsabilidades:**
- Conexión WhatsApp por dentista (Baileys)
- Chatbot con IA (OpenAI GPT-4)
- Agendar citas vía chat
- Enviar facturas, recetas
- Recordatorios automáticos

**Entidades:**
- WhatsAppConnections (una por dentista)
- ChatSessions
- ChatMessages

**Ver:** [04-WHATSAPP-CHATBOT.md](./04-WHATSAPP-CHATBOT.md)

### 8. Clinic & Operatory Management Module

**Responsabilidades:**
- Gestión de clínicas (super admin)
- Gestión de consultorios (super admin)
- Asignación de consultorios a dentistas
- Horarios por consultorio

**Entidades:**
- Clinics
- Operatories
- OperatoryAssignments

### 9. Staff Management Module

**Responsabilidades:**
- Invitaciones de staff
- Staff trabaja para múltiples dentistas
- Permisos por dentista

**Entidades:**
- TenantMemberships (staff tiene múltiples)
- StaffPermissions

### 10. Subscription & Billing (Platform) Module

**Responsabilidades:**
- Planes de suscripción
- Billing a dentistas (NO a pacientes)
- Stripe para suscripciones
- Enforcement de límites

**Entidades:**
- SubscriptionPlans
- Subscriptions
- PlatformInvoices

---

## Integraciones

### 1. WhatsApp (Baileys) - CRÍTICO ⭐

**Prioridad:** MVP o Fase 2 temprano

**Implementación:**
- Cada dentista conecta su número de WhatsApp
- QR code generado con Baileys
- Bot con OpenAI GPT-4
- Puede agendar citas, enviar docs, etc.

**Ver detalles:** [04-WHATSAPP-CHATBOT.md](./04-WHATSAPP-CHATBOT.md)

### 2. Calendarios

- Google Calendar API
- Microsoft Graph (Outlook)
- CalDAV (Apple Calendar)

**Sync bidireccional:**
- Cita creada en DentiCloud → aparece en Google Calendar
- Cita creada en Google Calendar → aparece en DentiCloud

### 3. Pagos

- **Stripe** para pagos de pacientes
- **Stripe Subscriptions** para suscripciones de dentistas

### 4. Email & SMS

- **SendGrid** para emails
- **Twilio** para SMS

### 5. IA

- **OpenAI GPT-4** para chatbot
- **Dialogflow CX** (alternativa)

---

## Seguridad y Compliance

### HIPAA Compliance

**Requerimientos:**
- ✅ Encryption at rest (RDS encryption)
- ✅ Encryption in transit (TLS/SSL)
- ✅ Access controls (RBAC)
- ✅ Audit logs (todas las acciones)
- ✅ BAA con AWS
- ✅ BAA con providers (SendGrid, Twilio, etc.)

### Row-Level Security

**Implementación:**
- Middleware valida tenant_id en cada request
- Prisma queries automáticamente filtran por tenant_id
- Guards verifican permisos en contexto de tenant

```typescript
// Guard example
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantContext = request.tenantContext;

    // Validar que el usuario tiene acceso al tenant
    if (!tenantContext || !tenantContext.tenantId) {
      throw new UnauthorizedException('No tenant context');
    }

    // Validar que el recurso pertenece al tenant
    const resourceTenantId = request.params.tenantId || request.body.tenantId;
    if (resourceTenantId && resourceTenantId !== tenantContext.tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
```

### Data Isolation

**Estrategias:**
- Row-level filtering en todas las queries
- Índices en `tenant_id`
- Tests para verificar no hay data leakage
- Audit logs de accesos

### Authentication

**Multi-factor:**
- Email/password + 2FA (opcional)
- OAuth (Google, Apple, Microsoft)
- JWT tokens con short expiration
- Refresh tokens en HttpOnly cookies

---

## Escalabilidad

### Horizontal Scaling

**API:**
- Stateless (context en JWT)
- Auto-scaling con ECS
- Load balancer (ALB)

**Database:**
- RDS con read replicas
- Connection pooling (RDS Proxy)
- Sharding futuro si es necesario (por tenant_id)

**Cache:**
- Redis con keys incluyendo tenant_id
- Cache invalidation por tenant

### Performance Optimizations

**Database:**
- Índices en `tenant_id` + campos filtrados
- Materialized views para reportes
- Partition tables por fecha (appointments, audit_logs)

**API:**
- Response caching
- Query optimization
- N+1 prevention (DataLoader)

---

**Versión:** 3.0
**Última actualización:** 30 de Diciembre, 2025
