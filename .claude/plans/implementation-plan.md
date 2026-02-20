# 🦷 MediCloud - Plan de Implementación Completo

**Fecha:** 30 Enero 2026
**Estado:** Completado
**Completado:** ~99%

---

## 📊 Resumen Ejecutivo

Este plan aborda:
1. **Funcionalidades faltantes** según documentación de Notion
2. **Corrección de bugs críticos** encontrados en el análisis de código
3. **Mejoras de seguridad** para aislamiento de tenants
4. **Optimizaciones** de performance y arquitectura

---

## 🚨 FASE 0: CORRECCIONES CRÍTICAS DE SEGURIDAD

> **Prioridad: INMEDIATA**
> **Tiempo estimado: 2-3 días**

### 0.1 Normalizar Identificadores de Usuario en JWT

**Problema:** Inconsistencia entre `req.user.id`, `req.user.userId`, `req.user.sub`

**Archivos a modificar:**
- `backend/src/auth/strategies/jwt.strategy.ts`
- Todos los controladores que usan `req.user`

**Solución:**
```typescript
// jwt.strategy.ts - Normalizar payload
async validate(payload: any) {
  return {
    userId: payload.sub,      // Siempre usar userId
    email: payload.email,
    role: payload.role,
    tenantId: payload.tenantId,
    memberships: payload.memberships,
  };
}
```

### 0.2 Validación de Tenant en Todos los Servicios

**Problema:** Queries sin filtro de `tenantId` permiten acceso cross-tenant

**Archivos a modificar:**
- `backend/src/appointments/appointments.service.ts`
- `backend/src/invoices/invoices.service.ts`
- `backend/src/patients/patients.service.ts`

**Solución:** Agregar `tenantId` a TODAS las queries WHERE

### 0.3 Race Condition en Invoice Number

**Problema:** Generación de número de factura sin transacción

**Archivo:** `backend/src/invoices/invoices.service.ts`

**Solución:**
```typescript
private async generateInvoiceNumber(tenantId: string): Promise<string> {
  return await this.prisma.$transaction(async (tx) => {
    const lastInvoice = await tx.invoice.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true },
    });
    // Generar siguiente número basado en el último
  });
}
```

### 0.4 Validación WhatsApp - Rate Limiting y Sanitización

**Problema:** Sin validación de números, sin rate limiting

**Archivo:** `backend/src/whatsapp/whatsapp.service.ts`

**Solución:**
- Validar formato de número telefónico
- Implementar rate limiting (máx 100 msgs/hora por tenant)
- Sanitizar mensaje antes de enviar

### 0.5 Relación Patient-Dentist con TenantId Correcto

**Problema:** `tenantId = dentistId` es incorrecto

**Archivo:** `backend/src/patients/patients.service.ts`

**Solución:** Obtener `tenantId` del contexto del usuario autenticado, no del dentistId

---

## 🔐 FASE 1: AUTENTICACIÓN COMPLETA

> **Prioridad: ALTA**
> **Dependencias: Fase 0**

### 1.1 Recuperación de Contraseña

**Backend - Nuevos endpoints:**
```
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

**Archivos a crear:**
- `backend/src/auth/dto/forgot-password.dto.ts`
- `backend/src/auth/dto/reset-password.dto.ts`

**Archivos a modificar:**
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.controller.ts`

**Modelo Prisma - Agregar:**
```prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("password_reset_tokens")
}
```

**Frontend - Nuevas páginas:**
- `frontend/src/pages/ForgotPassword.tsx`
- `frontend/src/pages/ResetPassword.tsx`

**Flujo:**
1. Usuario ingresa email
2. Sistema genera token UUID con expiración 1 hora
3. Envía email con link: `/reset-password?token=xxx`
4. Usuario ingresa nueva contraseña
5. Sistema valida token, actualiza password, marca token como usado

### 1.2 Mejoras OAuth

**Problema actual:** OAuth siempre crea PATIENT

**Solución:**
- Agregar parámetro `role` al flow OAuth
- Permitir registro de Dentistas por OAuth
- Encriptar `oauthId` en base de datos

---

## 💳 FASE 2: INTEGRACIÓN STRIPE

> **Prioridad: ALTA**
> **Dependencias: Fase 1**

### 2.1 Configuración Stripe

**Archivos a crear:**
- `backend/src/stripe/stripe.module.ts`
- `backend/src/stripe/stripe.service.ts`
- `backend/src/stripe/stripe.controller.ts`
- `backend/src/stripe/webhooks/stripe-webhook.controller.ts`

**Endpoints:**
```
POST /api/stripe/create-payment-intent
POST /api/stripe/create-customer
POST /api/stripe/attach-payment-method
POST /api/stripe/webhooks (webhook de Stripe)
GET  /api/stripe/payment-methods
```

### 2.2 Pagos Online para Pacientes

**Frontend - Modificar:**
- `frontend/src/pages/patient/PatientInvoices.tsx` (crear)
- Agregar componente de pago con Stripe Elements

**Flujo:**
1. Paciente ve factura pendiente
2. Click "Pagar ahora"
3. Modal con Stripe Elements
4. Procesar pago
5. Webhook actualiza estado de factura

### 2.3 Generación de PDF

**Dependencia:** `@react-pdf/renderer` o `puppeteer`

**Archivos a crear:**
- `backend/src/invoices/invoice-pdf.service.ts`
- `backend/src/invoices/templates/invoice.template.ts`

**Endpoints:**
```
GET /api/invoices/:id/pdf
GET /api/payments/:id/receipt
```

---

## 💬 FASE 3: WHATSAPP CHATBOT CON IA

> **Prioridad: ALTA**
> **Dependencias: Fase 0**

### 3.1 Integración OpenAI

**Archivos a crear:**
- `backend/src/ai/ai.module.ts`
- `backend/src/ai/ai.service.ts`
- `backend/src/ai/prompts/dental-assistant.prompt.ts`

**Configuración:**
```typescript
// ai.service.ts
import OpenAI from 'openai';

@Injectable()
export class AIService {
  private openai: OpenAI;

  async processMessage(message: string, context: ChatContext): Promise<AIResponse> {
    // System prompt personalizado por tenant
    // Function calling para extraer intents
    // Manejo de contexto conversacional
  }
}
```

### 3.2 Handlers de Intents

**Archivos a crear:**
- `backend/src/whatsapp/handlers/base.handler.ts`
- `backend/src/whatsapp/handlers/schedule-appointment.handler.ts`
- `backend/src/whatsapp/handlers/cancel-appointment.handler.ts`
- `backend/src/whatsapp/handlers/check-availability.handler.ts`
- `backend/src/whatsapp/handlers/faq.handler.ts`

**Intents soportados:**
- `SCHEDULE_APPOINTMENT` - Agendar cita
- `CANCEL_APPOINTMENT` - Cancelar cita
- `RESCHEDULE_APPOINTMENT` - Reprogramar
- `CHECK_AVAILABILITY` - Ver disponibilidad
- `FAQ` - Preguntas frecuentes
- `HUMAN_HANDOFF` - Transferir a humano

### 3.3 Modelos de Chat

**Prisma - Agregar:**
```prisma
model ChatSession {
  id           String   @id @default(uuid())
  tenantId     String   @map("tenant_id")
  patientPhone String   @map("patient_phone")
  patientName  String?  @map("patient_name")
  status       ChatStatus @default(ACTIVE)
  context      Json?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  messages ChatMessage[]

  @@map("chat_sessions")
}

model ChatMessage {
  id        String   @id @default(uuid())
  sessionId String   @map("session_id")
  sender    String   // 'bot' | 'patient' | 'staff'
  message   String
  intent    String?
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")

  session ChatSession @relation(fields: [sessionId], references: [id])

  @@map("chat_messages")
}

enum ChatStatus {
  ACTIVE
  HUMAN_TAKEOVER
  CLOSED
}
```

---

## 📅 FASE 4: SINCRONIZACIÓN DE CALENDARIOS

> **Prioridad: MEDIA**
> **Dependencias: Fase 1**

### 4.1 Google Calendar

**Archivos a crear:**
- `backend/src/calendar-sync/calendar-sync.module.ts`
- `backend/src/calendar-sync/google-calendar.service.ts`
- `backend/src/calendar-sync/dto/calendar-sync.dto.ts`

**Endpoints:**
```
GET  /api/calendar-sync/google/auth
GET  /api/calendar-sync/google/callback
POST /api/calendar-sync/google/sync
DELETE /api/calendar-sync/google/disconnect
```

**Modelo:**
```prisma
model CalendarConnection {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  provider     String   // 'google' | 'outlook' | 'apple'
  accessToken  String   @map("access_token")
  refreshToken String   @map("refresh_token")
  calendarId   String   @map("calendar_id")
  syncEnabled  Boolean  @default(true) @map("sync_enabled")
  lastSyncAt   DateTime? @map("last_sync_at")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, provider])
  @@map("calendar_connections")
}
```

### 4.2 Outlook Calendar

**Similar a Google con Microsoft Graph API**

### 4.3 Sync Bidireccional

- Crear cita en MediCloud → Crear evento en Google
- Crear evento en Google → Crear cita en MediCloud
- Cancelar en cualquiera → Sincronizar

---

## 🏥 FASE 5: FRONTEND CLÍNICAS Y STAFF

> **Prioridad: MEDIA**
> **Dependencias: Ninguna**

### 5.1 Gestión de Clínicas

**Páginas a crear:**
- `frontend/src/pages/ClinicsListPage.tsx`
- `frontend/src/pages/ClinicDetailPage.tsx`
- `frontend/src/pages/NewClinicPage.tsx`
- `frontend/src/pages/OperatoriesPage.tsx`

**Componentes:**
- `frontend/src/components/clinics/ClinicForm.tsx`
- `frontend/src/components/clinics/OperatoryCard.tsx`
- `frontend/src/components/clinics/FloorSelector.tsx`

### 5.2 Gestión de Staff

**Páginas a crear:**
- `frontend/src/pages/StaffListPage.tsx`
- `frontend/src/pages/InviteStaffPage.tsx`
- `frontend/src/pages/StaffPermissionsPage.tsx`

**Componentes:**
- `frontend/src/components/staff/InvitationForm.tsx`
- `frontend/src/components/staff/PermissionsMatrix.tsx`
- `frontend/src/components/staff/TenantSwitcher.tsx`

### 5.3 Switch Context Multi-Tenant

**Backend - Nuevo endpoint:**
```
POST /api/auth/switch-tenant
Body: { tenantId: string }
Response: { accessToken: string, refreshToken: string }
```

**Frontend:**
- Componente `TenantSwitcher` en navbar
- Persistir último tenant en localStorage
- Recargar datos al cambiar

---

## 🔧 FASE 6: SUPER ADMIN COMPLETO

> **Prioridad: MEDIA**
> **Dependencias: Ninguna**

### 6.1 Impersonate Tenant

**Backend:**
```typescript
// admin.controller.ts
@Post('tenants/:id/impersonate')
@Roles('SUPER_ADMIN')
async impersonate(@Param('id') tenantId: string, @Request() req) {
  // Generar JWT temporal (15 min) con tenantId
  // Registrar en audit log
  return { impersonationToken: '...' };
}
```

**Frontend:**
- Botón "Impersonate" en detalle de tenant
- Banner indicando modo impersonate
- Botón para salir de impersonate

### 6.2 Audit Logs Mejorados

**Ya existe pero mejorar:**
- Filtros avanzados
- Exportación
- Alertas por actividad sospechosa

---

## 📊 FASE 7: REPORTES Y ANALYTICS

> **Prioridad: BAJA**
> **Dependencias: Fases 2, 3**

### 7.1 Reportes Financieros

**Endpoints:**
```
GET /api/reports/revenue?startDate&endDate&groupBy
GET /api/reports/appointments?startDate&endDate
GET /api/reports/patients?startDate&endDate
```

### 7.2 Exportación

**Formatos:** Excel, PDF, CSV

**Archivos a crear:**
- `backend/src/reports/reports.module.ts`
- `backend/src/reports/reports.service.ts`
- `backend/src/reports/exporters/excel.exporter.ts`
- `backend/src/reports/exporters/pdf.exporter.ts`

### 7.3 Dashboard Mejorado

**Frontend:**
- Gráficos con Recharts (ya instalado)
- KPIs principales
- Comparativa mensual

---

## 🛠️ FASE 8: MEJORAS DE ARQUITECTURA

> **Prioridad: CONTINUA**

### 8.1 Logger Estructurado

**Reemplazar `console.log/error` con Winston o Pino:**
```typescript
// logger.service.ts
@Injectable()
export class LoggerService {
  private logger = winston.createLogger({...});

  info(message: string, context?: object) {...}
  error(message: string, error?: Error, context?: object) {...}
  warn(message: string, context?: object) {...}
}
```

### 8.2 Middleware de Tenant Context

**Centralizar extracción de tenantId:**
```typescript
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    req.tenantContext = {
      tenantId: user.tenantId,
      userId: user.userId,
      role: user.role,
    };
    next();
  }
}
```

### 8.3 Transacciones en Operaciones Críticas

**Envolver en `prisma.$transaction()`:**
- Crear paciente + relación
- Crear factura + items
- Transferir paciente
- Import CSV

### 8.4 Optimización de Queries

**Usar `select` específico en lugar de `include` completo:**
```typescript
// Antes
include: { patient: true, operatory: { include: { clinic: true } } }

// Después
select: {
  id: true,
  appointmentDate: true,
  patient: { select: { firstName: true, lastName: true, phone: true } },
  operatory: { select: { name: true } },
}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Fase 0 - Crítico
- [x] Normalizar req.user en todos los controladores
- [x] Agregar tenantId a todas las queries
- [x] Fix race condition en invoice number
- [x] Validación WhatsApp
- [x] Fix relación Patient-Dentist

### Fase 1 - Auth
- [x] Modelo PasswordResetToken
- [x] Endpoints forgot/reset password
- [x] Email de recuperación
- [x] Frontend páginas (ForgotPassword.tsx, ResetPassword.tsx)

### Fase 2 - Stripe
- [x] Módulo Stripe (stripe.module.ts, stripe.service.ts, stripe.controller.ts)
- [x] Payment intents / Checkout sessions
- [x] Webhooks
- [x] Frontend pago (PatientInvoices.tsx con integración Stripe Checkout)
- [x] Generación PDF (pdf.service.ts con pdfmake)

### Fase 3 - WhatsApp IA
- [x] Módulo AI con OpenAI (chatbot.module.ts, chatbot.service.ts)
- [x] Modelos ChatSession/Message (agregados al schema.prisma)
- [x] Handlers de intents (en chatbot.service.ts)
- [x] Configuración por tenant (ChatbotConfig model, chatbot-config.service.ts, chatbot-config.controller.ts)

### Fase 4 - Calendar Sync
- [x] Google Calendar OAuth (calendar-sync.module.ts, calendar-sync.service.ts)
- [x] Modelos CalendarConnection/CalendarSyncLog (en schema.prisma)
- [x] Sync bidireccional (syncAppointmentToCalendar)
- [ ] Outlook Calendar OAuth (pendiente - estructura lista)
- [x] UI de conexión frontend (CalendarSyncPage.tsx)

### Fase 5 - Frontend
- [x] Páginas de Clínicas (ClinicsListPage.tsx)
- [x] Páginas de Staff (StaffListPage.tsx)
- [x] Switch Tenant (TenantSwitcher.tsx, switch-tenant endpoint)
- [x] Permisos UI (PermissionsPage.tsx)

### Fase 6 - Super Admin
- [x] Impersonate (admin.service.ts impersonateUser, stopImpersonation)
- [x] Audit mejorado (exportación CSV, alertas de actividad sospechosa, timeline de usuario, historial de entidad)

### Fase 7 - Reportes
- [x] Endpoints de reportes (reports.module.ts, reports.service.ts, reports.controller.ts)
- [x] Dashboard summary, Financial, Appointments, Patients, TreatmentPlans reports
- [x] Exportadores (Excel/PDF) (excel.exporter.ts, pdf.exporter.ts)
- [x] Dashboard gráficos frontend (ReportsPage.tsx con Recharts)

### Fase 8 - Arquitectura
- [x] Logger estructurado (usando NestJS Logger)
- [x] Middleware tenant (tenant-context.middleware.ts, tenant.decorator.ts, tenant.guard.ts)
- [x] Transacciones (en operaciones críticas)
- [x] Query optimization (query-helpers.ts con selects específicos)

---

## 📅 TIMELINE SUGERIDO

| Semana | Fase | Entregables |
|--------|------|-------------|
| 1 | 0 | Fixes críticos de seguridad |
| 2 | 1 | Recuperación de contraseña completa |
| 3-4 | 2 | Stripe + PDF |
| 5-6 | 3 | WhatsApp con IA |
| 7 | 4 | Google Calendar sync |
| 8 | 5 | Frontend Clínicas/Staff |
| 9 | 6-7 | Super Admin + Reportes |
| 10 | 8 | Optimizaciones finales |

---

## 🔗 Referencias

- [Notion - Plan Original](https://www.notion.so/MediCloud-Plan-de-Implementaci-n-Detallado-2da74f435143818aad43d7ad65631149)
- [Stripe Docs](https://stripe.com/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Google Calendar API](https://developers.google.com/calendar)
