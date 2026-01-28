# 🚀 ROADMAP COMPLETO - MÓDULO SUPERADMIN
## DentiCloud - Plan de Implementación Detallado

**Fecha de Creación:** 5 de Enero, 2026  
**Versión:** 1.0  
**Basado en:** Análisis del documento de Notion + Implementación actual

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estado Actual](#estado-actual)
3. [Módulo 1: Gestión de Tenants](#modulo-1-gestion-de-tenants)
4. [Módulo 2: Gestión de Usuarios](#modulo-2-gestion-de-usuarios)
5. [Módulo 3: Gestión de Planes y Suscripciones](#modulo-3-gestion-de-planes-y-suscripciones)
6. [Módulo 4: Sistema de Facturación](#modulo-4-sistema-de-facturacion)
7. [Módulo 5: Configuración de Correos](#modulo-5-configuracion-de-correos)
8. [Módulo 6: Analytics y Reportes](#modulo-6-analytics-y-reportes)
9. [Módulo 7: Audit Logs](#modulo-7-audit-logs)
10. [Módulo 8: Configuración Global](#modulo-8-configuracion-global)
11. [Módulo 9: Soporte y Tickets](#modulo-9-soporte-y-tickets)
12. [Módulo 10: Auto-Registro de Tenants](#modulo-10-auto-registro-de-tenants)

---

## 🎯 RESUMEN EJECUTIVO

El módulo de SuperAdmin es el corazón administrativo de DentiCloud, una plataforma SaaS multi-tenant para gestión de clínicas dentales. Este documento detalla **TODAS** las funcionalidades necesarias para un sistema SuperAdmin completo y profesional.

### Objetivos Principales:
- ✅ Gestión completa de tenants (clínicas)
- ✅ Control total de usuarios y permisos
- ✅ Administración de planes y suscripciones
- ✅ Sistema de facturación automatizado
- ✅ Configuración de correos y plantillas
- ✅ Analytics y reportes en tiempo real
- ✅ Sistema de auditoría completo
- ✅ Auto-registro de nuevos tenants
- ✅ Soporte y sistema de tickets

---

## 📊 ESTADO ACTUAL

### ✅ Implementado (Backend)

**Endpoints de Tenants:**
- `GET /api/admin/tenants` - Listar todos los tenants
- `GET /api/admin/tenants/:id` - Obtener detalles de tenant
- `POST /api/admin/tenants` - Crear nuevo tenant
- `PUT /api/admin/tenants/:id` - Actualizar tenant (nombre, subdomain)
- `DELETE /api/admin/tenants/:id` - Eliminar tenant
- `PUT /api/admin/tenants/:id/subscription` - Actualizar suscripción
- `POST /api/admin/tenants/:id/suspend` - Suspender tenant
- `POST /api/admin/tenants/:id/reactivate` - Reactivar tenant

**Endpoints de Usuarios:**
- `GET /api/admin/users` - Listar usuarios con filtros
- `GET /api/admin/users/:id` - Obtener usuario por ID
- `POST /api/admin/users` - Crear usuario
- `PUT /api/admin/users/:id` - Actualizar usuario
- `DELETE /api/admin/users/:id` - Eliminar usuario
- `POST /api/admin/users/:id/impersonate` - Impersonar usuario
- `GET /api/admin/users/statistics` - Estadísticas de usuarios

**Endpoints de Métricas:**
- `GET /api/admin/metrics/system` - Métricas del sistema
- `GET /api/admin/metrics/revenue` - Métricas de ingresos (MRR, ARR)
- `GET /api/admin/metrics/activity` - Actividad de tenants

**Endpoints de Audit Logs:**
- `GET /api/admin/audit-logs` - Listar audit logs con filtros
- `GET /api/admin/audit-logs/:id` - Obtener audit log específico
- `GET /api/admin/audit-logs/statistics` - Estadísticas de auditoría

### ✅ Implementado (Frontend)

**Páginas Existentes:**
- `SuperAdminDashboard.tsx` - Dashboard principal
- `SuperAdminTenantsPage.tsx` - Lista de tenants
- `TenantDetailPage.tsx` - Detalle de tenant con tabs
- `SuperAdminUsersPage.tsx` - Gestión de usuarios
- `SuperAdminSubscriptionsPage.tsx` - Gestión de suscripciones
- `SuperAdminAnalyticsPage.tsx` - Analytics y gráficos
- `SuperAdminAuditLogsPage.tsx` - Logs de auditoría
- `SuperAdminSettingsPage.tsx` - Configuración global

### ❌ FALTANTE (Crítico)

**Backend:**
1. Sistema de gestión de planes (CRUD de planes)
2. Sistema de facturación automatizada
3. Integración con Stripe/pasarelas de pago
4. Sistema de configuración de correos (SMTP)
5. Sistema de plantillas de correo
6. Sistema de tickets de soporte
7. API de auto-registro de tenants
8. Webhooks de Stripe
9. Sistema de notificaciones al superadmin
10. Exportación de datos (CSV, PDF)

**Frontend:**
1. Gestión de usuarios dentro de cada tenant (en detalle de tenant)
2. Interfaz de gestión de planes
3. Interfaz de facturación
4. Editor de plantillas de correo
5. Sistema de tickets
6. Página de auto-registro público
7. Exportación de reportes

---

## 🏢 MÓDULO 1: GESTIÓN DE TENANTS

### 1.1 Lista de Tenants (✅ Implementado Parcialmente)

**Estado:** Backend completo, Frontend necesita mejoras

**Funcionalidades Actuales:**
- ✅ Listar todos los tenants con paginación
- ✅ Búsqueda por nombre/email
- ✅ Ver estadísticas básicas (total, activos, suspendidos)
- ✅ Navegación a detalle de tenant

**Funcionalidades Faltantes:**
- ❌ Filtros avanzados (por plan, estado, fecha de creación)
- ❌ Ordenamiento por columnas
- ❌ Exportar lista a CSV/Excel
- ❌ Vista de tarjetas vs tabla
- ❌ Acciones masivas (suspender múltiples, cambiar plan)

**Implementación Requerida:**

**Backend:**
```typescript
// Agregar a admin.controller.ts
@Get('tenants/export')
async exportTenants(@Query('format') format: 'csv' | 'excel') {
  return this.adminService.exportTenants(format);
}

@Post('tenants/bulk-action')
async bulkAction(@Body() data: {
  tenantIds: string[];
  action: 'suspend' | 'reactivate' | 'change-plan';
  planId?: string;
}) {
  return this.adminService.bulkTenantAction(data);
}
```

**Frontend:**
- Agregar filtros avanzados en SuperAdminTenantsPage
- Implementar selección múltiple con checkboxes
- Botón de exportar con opciones CSV/Excel
- Toggle entre vista de tabla y tarjetas

---

### 1.2 Detalle de Tenant (✅ Implementado Parcialmente)

**Estado:** Estructura básica implementada, faltan secciones

**Tabs Actuales:**
- ✅ Información General
- ✅ Usuarios (lista básica)
- ✅ Suscripción

**Tabs Faltantes:**
- ❌ **Facturación** - Historial de pagos, facturas
- ❌ **Uso de Recursos** - Pacientes, storage, usuarios activos
- ❌ **Actividad** - Últimas acciones, login history
- ❌ **Configuración** - Políticas de cancelación, WhatsApp
- ❌ **Soporte** - Tickets abiertos por este tenant

**Funcionalidades Requeridas en Tab "Usuarios":**

**Backend:**
```typescript
// Agregar a admin.controller.ts
@Get('tenants/:id/users')
async getTenantUsers(
  @Param('id') tenantId: string,
  @Query('page') page?: string,
  @Query('limit') limit?: string,
) {
  return this.adminService.getTenantUsers(tenantId, {
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });
}

@Post('tenants/:id/users')
async addUserToTenant(
  @Param('id') tenantId: string,
  @Body() data: {
    userId?: string; // Usuario existente
    email?: string;  // Crear nuevo usuario
    name?: string;
    role: string;
  }
) {
  return this.adminService.addUserToTenant(tenantId, data);
}

@Delete('tenants/:tenantId/users/:userId')
async removeUserFromTenant(
  @Param('tenantId') tenantId: string,
  @Param('userId') userId: string,
) {
  return this.adminService.removeUserFromTenant(tenantId, userId);
}

@Put('tenants/:tenantId/users/:userId/role')
async updateUserRole(
  @Param('tenantId') tenantId: string,
  @Param('userId') userId: string,
  @Body() data: { role: string }
) {
  return this.adminService.updateTenantUserRole(tenantId, userId, data.role);
}
```

**Frontend - Tab Usuarios:**
```typescript
// En TenantDetailPage.tsx, tab "Usuarios"
- Lista de usuarios del tenant con roles
- Botón "Agregar Usuario"
  - Modal con dos opciones:
    1. Seleccionar usuario existente
    2. Crear nuevo usuario
- Acciones por usuario:
  - Cambiar rol
  - Remover del tenant
  - Ver detalles del usuario
- Filtros por rol
- Búsqueda por nombre/email
```

**Frontend - Tab Facturación:**
```typescript
// Nuevo tab en TenantDetailPage.tsx
- Historial de facturas (tabla)
- Próximo pago programado
- Método de pago configurado
- Botón "Generar factura manual"
- Botón "Ver todas las facturas"
- Gráfico de pagos mensuales
```

**Frontend - Tab Uso de Recursos:**
```typescript
// Nuevo tab en TenantDetailPage.tsx
- Pacientes: X / Y (límite del plan)
- Storage: X GB / Y GB (límite del plan)
- Usuarios activos: X / Y
- Citas este mes: X
- Gráficos de uso histórico
- Alertas si están cerca del límite
```

---

### 1.3 Crear Tenant (✅ Backend, ❌ Frontend Mejorado)

**Estado:** Endpoint existe, interfaz necesita mejoras

**Funcionalidades Actuales:**
- ✅ Crear tenant con datos básicos
- ✅ Asignar owner existente

**Funcionalidades Faltantes:**
- ❌ Crear tenant + owner en un solo paso
- ❌ Enviar email de bienvenida automático
- ❌ Configurar trial automático
- ❌ Wizard de configuración inicial

**Implementación Requerida:**

**Backend:**
```typescript
// Modificar admin.service.ts
async createTenantWithOwner(data: {
  // Datos del tenant
  tenantName: string;
  subdomain: string;
  subscriptionTier: string;
  
  // Datos del owner
  ownerEmail: string;
  ownerName: string;
  ownerPassword?: string; // Opcional, se genera si no se provee
  
  // Configuración
  sendWelcomeEmail: boolean;
  trialDays: number;
}) {
  // 1. Crear usuario owner si no existe
  // 2. Crear tenant
  // 3. Crear membership
  // 4. Enviar email de bienvenida
  // 5. Registrar en audit log
}
```

**Frontend:**
```typescript
// Wizard de creación en modal o página separada
Paso 1: Información del Tenant
  - Nombre de la clínica
  - Subdomain (auto-generar sugerencia)
  - Plan inicial
  
Paso 2: Información del Owner
  - Nombre completo
  - Email
  - Teléfono (opcional)
  - ¿Crear contraseña o enviar link?
  
Paso 3: Configuración Inicial
  - Días de trial (default 14)
  - Enviar email de bienvenida (checkbox)
  - Límites personalizados (opcional)
  
Paso 4: Confirmación
  - Resumen de todo
  - Botón "Crear Tenant"
```

---

### 1.4 Editar Tenant (✅ Implementado)

**Estado:** Funcional

**Funcionalidades:**
- ✅ Editar nombre
- ✅ Editar subdomain
- ✅ Actualizar suscripción
- ✅ Cambiar límites

---

### 1.5 Suspender/Reactivar Tenant (✅ Implementado)

**Estado:** Backend completo, Frontend en detalle

**Funcionalidades:**
- ✅ Suspender tenant (cambia estado a CANCELLED)
- ✅ Reactivar tenant (cambia estado a ACTIVE)
- ✅ Registro en audit logs

**Mejoras Requeridas:**
- ❌ Razón de suspensión (campo de texto)
- ❌ Notificar al tenant por email
- ❌ Programar suspensión futura
- ❌ Suspensión temporal vs permanente

---

### 1.6 Eliminar Tenant (✅ Implementado)

**Estado:** Funcional con confirmación

**Funcionalidades:**
- ✅ Eliminar tenant y datos relacionados
- ✅ Confirmación requerida
- ✅ Registro en audit logs

**Mejoras Requeridas:**
- ❌ Soft delete (marcar como eliminado sin borrar)
- ❌ Período de gracia (30 días para recuperar)
- ❌ Exportar datos antes de eliminar
- ❌ Notificar al owner

---

## 👥 MÓDULO 2: GESTIÓN DE USUARIOS

### 2.1 Lista de Usuarios (✅ Implementado)

**Estado:** Funcional con filtros básicos

**Funcionalidades Actuales:**
- ✅ Listar todos los usuarios
- ✅ Filtrar por rol
- ✅ Búsqueda por nombre/email
- ✅ Paginación
- ✅ Ver estadísticas

**Funcionalidades Faltantes:**
- ❌ Filtrar por tenant
- ❌ Filtrar por estado (activo/inactivo)
- ❌ Exportar a CSV
- ❌ Vista de usuarios sin tenant
- ❌ Acciones masivas

---

### 2.2 Crear Usuario (✅ Implementado)

**Estado:** Funcional

**Funcionalidades:**
- ✅ Crear usuario con email, nombre, rol
- ✅ Asignar contraseña
- ✅ Registro en audit logs

**Mejoras Requeridas:**
- ❌ Enviar email de invitación
- ❌ Asignar a tenant al crear
- ❌ Configurar permisos personalizados

---

### 2.3 Editar Usuario (✅ Implementado)

**Estado:** Funcional

**Funcionalidades:**
- ✅ Editar nombre, email, rol, teléfono
- ✅ Registro en audit logs

---

### 2.4 Eliminar Usuario (✅ Implementado)

**Estado:** Funcional

**Funcionalidades:**
- ✅ Eliminar usuario
- ✅ Confirmación requerida

**Mejoras:**
- ❌ Verificar si es owner de algún tenant
- ❌ Transferir ownership antes de eliminar
- ❌ Soft delete

---

### 2.5 Impersonar Usuario (✅ Implementado Backend)

**Estado:** Backend completo, Frontend básico

**Funcionalidades:**
- ✅ Generar token de impersonación
- ✅ Registro en audit logs

**Mejoras Requeridas:**
- ❌ Banner visible "Estás impersonando a X"
- ❌ Botón "Salir de impersonación"
- ❌ Límite de tiempo de impersonación
- ❌ Registro detallado de acciones durante impersonación

---


## 💳 MÓDULO 3: GESTIÓN DE PLANES Y SUSCRIPCIONES

### 3.1 Gestión de Planes (❌ NO IMPLEMENTADO)

**Estado:** CRÍTICO - Completamente faltante

**Funcionalidades Requeridas:**

**Backend - Modelo de Datos:**
```typescript
// Agregar a schema.prisma
model SubscriptionPlan {
  id          String   @id @default(uuid())
  name        String   // "Starter", "Professional", "Enterprise"
  code        String   @unique // "STARTER", "PROFESSIONAL", "ENTERPRISE"
  description String?
  
  // Pricing
  monthlyPrice  Float   @map("monthly_price")
  yearlyPrice   Float?  @map("yearly_price")
  currency      String  @default("USD")
  
  // Limits
  maxPatients   Int     @map("max_patients")
  maxUsers      Int     @map("max_users")
  storageGB     Int     @map("storage_gb")
  
  // Features
  features      Json    // Array de features habilitadas
  
  // Status
  isActive      Boolean @default(true) @map("is_active")
  isPublic      Boolean @default(true) @map("is_public") // Visible en página de pricing
  sortOrder     Int     @default(0) @map("sort_order")
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@map("subscription_plans")
}
```

**Backend - Endpoints:**
```typescript
// plans.controller.ts
@Get('plans')
async getAllPlans(@Query('includeInactive') includeInactive?: boolean) {
  return this.plansService.findAll(includeInactive);
}

@Get('plans/:id')
async getPlanById(@Param('id') id: string) {
  return this.plansService.findById(id);
}

@Post('plans')
async createPlan(@Body() data: CreatePlanDto) {
  return this.plansService.create(data);
}

@Put('plans/:id')
async updatePlan(@Param('id') id: string, @Body() data: UpdatePlanDto) {
  return this.plansService.update(id, data);
}

@Delete('plans/:id')
async deletePlan(@Param('id') id: string) {
  return this.plansService.delete(id);
}

@Post('plans/:id/activate')
async activatePlan(@Param('id') id: string) {
  return this.plansService.activate(id);
}

@Post('plans/:id/deactivate')
async deactivatePlan(@Param('id') id: string) {
  return this.plansService.deactivate(id);
}
```

**Frontend - Página de Gestión de Planes:**
```typescript
// SuperAdminPlansPage.tsx

Secciones:
1. Lista de Planes
   - Tarjetas visuales con cada plan
   - Precio mensual/anual
   - Features destacadas
   - Estado (activo/inactivo)
   - Botones: Editar, Activar/Desactivar, Eliminar

2. Botón "Crear Nuevo Plan"
   - Modal o página con formulario:
     * Nombre del plan
     * Código (auto-generar)
     * Descripción
     * Precio mensual
     * Precio anual (opcional)
     * Límites:
       - Max pacientes
       - Max usuarios
       - Storage GB
     * Features (checklist):
       - Odontogramas
       - Planes de tratamiento
       - Facturación
       - WhatsApp
       - Reportes avanzados
       - API access
       - Soporte prioritario
     * Orden de visualización
     * ¿Visible en página pública?

3. Comparación de Planes
   - Tabla comparativa de todos los planes
   - Ver features lado a lado
```

---

### 3.2 Asignación de Planes a Tenants (✅ Parcialmente Implementado)

**Estado:** Backend existe, Frontend mejorable

**Funcionalidades Actuales:**
- ✅ Cambiar plan de tenant (SuperAdminSubscriptionsPage)
- ✅ Actualizar límites manualmente

**Funcionalidades Faltantes:**
- ❌ Historial de cambios de plan
- ❌ Programar cambio de plan futuro
- ❌ Downgrade/Upgrade con proration
- ❌ Validación de límites antes de downgrade

**Backend Requerido:**
```typescript
// Agregar a admin.service.ts
async changeTenantPlan(
  tenantId: string,
  userId: string,
  data: {
    newPlanId: string;
    effectiveDate?: Date; // Inmediato o programado
    prorate?: boolean;
  }
) {
  // 1. Validar que el tenant no exceda límites del nuevo plan
  // 2. Calcular proration si aplica
  // 3. Actualizar plan
  // 4. Registrar en historial
  // 5. Notificar al tenant
}

async getPlanChangeHistory(tenantId: string) {
  // Retornar historial de cambios de plan
}
```

---

### 3.3 Gestión de Trials (❌ Parcialmente Implementado)

**Estado:** Estructura existe, lógica faltante

**Funcionalidades Requeridas:**

**Backend:**
```typescript
// Agregar a admin.service.ts
async extendTrial(tenantId: string, days: number) {
  // Extender trial por X días
}

async convertTrialToActive(tenantId: string, planId: string) {
  // Convertir trial a suscripción activa
}

async getExpiringTrials(daysUntilExpiration: number = 3) {
  // Obtener trials que expiran pronto
}
```

**Frontend:**
```typescript
// En SuperAdminDashboard.tsx
- Widget "Trials Expirando"
  - Lista de tenants con trial próximo a expirar
  - Botón "Extender Trial"
  - Botón "Convertir a Pago"

// En TenantDetailPage.tsx, tab Suscripción
- Si está en trial:
  - Fecha de inicio del trial
  - Fecha de expiración
  - Días restantes
  - Botón "Extender Trial"
  - Botón "Convertir a Plan Pago"
```

---

## 💰 MÓDULO 4: SISTEMA DE FACTURACIÓN

### 4.1 Integración con Stripe (❌ NO IMPLEMENTADO)

**Estado:** CRÍTICO - Completamente faltante

**Funcionalidades Requeridas:**

**Backend - Configuración:**
```typescript
// Instalar: npm install stripe @nestjs/stripe

// stripe.module.ts
import { Module } from '@nestjs/common';
import { StripeModule } from '@nestjs/stripe';

@Module({
  imports: [
    StripeModule.forRoot({
      apiKey: process.env.STRIPE_SECRET_KEY,
      apiVersion: '2023-10-16',
    }),
  ],
})
export class StripeConfigModule {}
```

**Backend - Servicio de Facturación:**
```typescript
// billing.service.ts
@Injectable()
export class BillingService {
  constructor(
    private stripe: Stripe,
    private prisma: PrismaService,
  ) {}

  async createCustomer(tenantId: string, email: string, name: string) {
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: { tenantId },
    });
    
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId: customer.id },
    });
    
    return customer;
  }

  async createSubscription(tenantId: string, priceId: string) {
    // Crear suscripción en Stripe
  }

  async cancelSubscription(tenantId: string) {
    // Cancelar suscripción
  }

  async updatePaymentMethod(tenantId: string, paymentMethodId: string) {
    // Actualizar método de pago
  }

  async createInvoice(tenantId: string, items: InvoiceItem[]) {
    // Crear factura manual
  }

  async getInvoices(tenantId: string) {
    // Obtener facturas del tenant
  }
}
```

**Backend - Webhooks de Stripe:**
```typescript
// stripe-webhook.controller.ts
@Controller('webhooks/stripe')
export class StripeWebhookController {
  @Post()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    const event = this.stripe.webhooks.constructEvent(
      request.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    // Actualizar estado de suscripción a ACTIVE
    // Registrar pago
    // Enviar email de confirmación
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    // Cambiar estado a PAST_DUE
    // Notificar al tenant
    // Programar reintento
  }
}
```

**Backend - Endpoints:**
```typescript
// billing.controller.ts
@Get('tenants/:id/invoices')
async getTenantInvoices(@Param('id') tenantId: string) {
  return this.billingService.getInvoices(tenantId);
}

@Post('tenants/:id/invoices')
async createManualInvoice(
  @Param('id') tenantId: string,
  @Body() data: CreateInvoiceDto,
) {
  return this.billingService.createInvoice(tenantId, data);
}

@Get('invoices/upcoming')
async getUpcomingInvoices() {
  return this.billingService.getUpcomingInvoices();
}

@Post('tenants/:id/payment-method')
async updatePaymentMethod(
  @Param('id') tenantId: string,
  @Body() data: { paymentMethodId: string },
) {
  return this.billingService.updatePaymentMethod(tenantId, data.paymentMethodId);
}
```

---

### 4.2 Gestión de Facturas (❌ NO IMPLEMENTADO)

**Frontend - Página de Facturas:**
```typescript
// SuperAdminInvoicesPage.tsx

Secciones:
1. Filtros
   - Por tenant
   - Por estado (pagada, pendiente, vencida)
   - Por rango de fechas
   - Por monto

2. Lista de Facturas
   - Número de factura
   - Tenant
   - Fecha de emisión
   - Fecha de vencimiento
   - Monto
   - Estado
   - Acciones: Ver PDF, Reenviar, Marcar como pagada

3. Estadísticas
   - Total facturado este mes
   - Facturas pendientes
   - Facturas vencidas
   - Tasa de cobro

4. Botón "Crear Factura Manual"
   - Seleccionar tenant
   - Agregar items
   - Calcular total
   - Generar y enviar
```

---

### 4.3 Reportes Financieros (❌ NO IMPLEMENTADO)

**Frontend:**
```typescript
// SuperAdminFinancialReportsPage.tsx

Reportes:
1. MRR (Monthly Recurring Revenue)
   - Gráfico de tendencia
   - MRR por plan
   - Nuevos MRR vs Churn MRR

2. ARR (Annual Recurring Revenue)
   - Proyección anual
   - Crecimiento año a año

3. Churn Rate
   - Tasa de cancelación mensual
   - Razones de cancelación

4. LTV (Lifetime Value)
   - Valor promedio por cliente
   - Por plan

5. Exportar Reportes
   - PDF
   - Excel
   - CSV
```

---


## 📧 MÓDULO 5: CONFIGURACIÓN DE CORREOS

### 5.1 Configuración SMTP (❌ NO IMPLEMENTADO)

**Estado:** CRÍTICO - Sistema de correos faltante

**Funcionalidades Requeridas:**

**Backend - Modelo de Datos:**
```typescript
// Agregar a schema.prisma
model EmailConfiguration {
  id          String   @id @default(uuid())
  
  // SMTP Settings
  smtpHost    String   @map("smtp_host")
  smtpPort    Int      @map("smtp_port")
  smtpUser    String   @map("smtp_user")
  smtpPassword String  @map("smtp_password") // Encriptado
  smtpSecure  Boolean  @default(true) @map("smtp_secure")
  
  // From Settings
  fromEmail   String   @map("from_email")
  fromName    String   @map("from_name")
  replyToEmail String? @map("reply_to_email")
  
  // Status
  isActive    Boolean  @default(true) @map("is_active")
  isVerified  Boolean  @default(false) @map("is_verified")
  
  // Testing
  lastTestedAt DateTime? @map("last_tested_at")
  testResult   String?   @map("test_result")
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@map("email_configurations")
}
```

**Backend - Servicio de Email:**
```typescript
// email.service.ts
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    this.initializeTransporter();
  }

  async initializeTransporter() {
    const config = await this.prisma.emailConfiguration.findFirst({
      where: { isActive: true },
    });

    if (config) {
      this.transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          user: config.smtpUser,
          pass: this.decryptPassword(config.smtpPassword),
        },
      });
    }
  }

  async sendEmail(to: string, subject: string, html: string) {
    const config = await this.prisma.emailConfiguration.findFirst({
      where: { isActive: true },
    });

    return this.transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      html,
    });
  }

  async testConnection(configId: string) {
    // Probar conexión SMTP
    // Enviar email de prueba
    // Actualizar lastTestedAt y testResult
  }
}
```

**Backend - Endpoints:**
```typescript
// email-config.controller.ts
@Get('email-config')
async getEmailConfig() {
  return this.emailService.getConfig();
}

@Post('email-config')
async createEmailConfig(@Body() data: CreateEmailConfigDto) {
  return this.emailService.createConfig(data);
}

@Put('email-config/:id')
async updateEmailConfig(@Param('id') id: string, @Body() data: UpdateEmailConfigDto) {
  return this.emailService.updateConfig(id, data);
}

@Post('email-config/:id/test')
async testEmailConfig(@Param('id') id: string, @Body() data: { testEmail: string }) {
  return this.emailService.testConnection(id, data.testEmail);
}
```

**Frontend - Página de Configuración de Email:**
```typescript
// SuperAdminEmailConfigPage.tsx

Secciones:
1. Configuración SMTP
   - Host SMTP
   - Puerto
   - Usuario
   - Contraseña (campo seguro)
   - Usar SSL/TLS (toggle)
   - Botón "Probar Conexión"

2. Configuración de Remitente
   - Email del remitente
   - Nombre del remitente
   - Email de respuesta (opcional)

3. Prueba de Envío
   - Campo para email de prueba
   - Botón "Enviar Email de Prueba"
   - Resultado de la prueba

4. Proveedores Preconfigurados
   - Gmail (botón con config automática)
   - SendGrid (botón con config automática)
   - Mailgun (botón con config automática)
   - AWS SES (botón con config automática)
```

---

### 5.2 Plantillas de Email (❌ NO IMPLEMENTADO)

**Estado:** CRÍTICO - Sistema de plantillas faltante

**Backend - Modelo de Datos:**
```typescript
// Agregar a schema.prisma
enum EmailTemplateType {
  WELCOME
  TRIAL_EXPIRING
  TRIAL_EXPIRED
  SUBSCRIPTION_ACTIVATED
  SUBSCRIPTION_CANCELLED
  PAYMENT_SUCCESS
  PAYMENT_FAILED
  PASSWORD_RESET
  INVITATION
  SUPPORT_TICKET_CREATED
  SUPPORT_TICKET_UPDATED
}

model EmailTemplate {
  id          String            @id @default(uuid())
  type        EmailTemplateType @unique
  name        String
  description String?
  
  subject     String
  htmlBody    String            @map("html_body") @db.Text
  textBody    String?           @map("text_body") @db.Text
  
  // Variables disponibles (JSON array)
  variables   Json              // ["{{tenantName}}", "{{trialDays}}", etc.]
  
  isActive    Boolean           @default(true) @map("is_active")
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@map("email_templates")
}
```

**Backend - Servicio de Plantillas:**
```typescript
// email-template.service.ts
@Injectable()
export class EmailTemplateService {
  async renderTemplate(
    type: EmailTemplateType,
    variables: Record<string, any>,
  ): Promise<{ subject: string; html: string; text: string }> {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { type },
    });

    if (!template) {
      throw new Error(`Template ${type} not found`);
    }

    // Reemplazar variables en subject y body
    let subject = template.subject;
    let html = template.htmlBody;
    let text = template.textBody || '';

    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, variables[key]);
      html = html.replace(regex, variables[key]);
      text = text.replace(regex, variables[key]);
    });

    return { subject, html, text };
  }

  async sendTemplatedEmail(
    to: string,
    type: EmailTemplateType,
    variables: Record<string, any>,
  ) {
    const { subject, html } = await this.renderTemplate(type, variables);
    return this.emailService.sendEmail(to, subject, html);
  }
}
```

**Backend - Endpoints:**
```typescript
// email-templates.controller.ts
@Get('email-templates')
async getAllTemplates() {
  return this.templateService.findAll();
}

@Get('email-templates/:type')
async getTemplate(@Param('type') type: EmailTemplateType) {
  return this.templateService.findByType(type);
}

@Put('email-templates/:type')
async updateTemplate(
  @Param('type') type: EmailTemplateType,
  @Body() data: UpdateTemplateDto,
) {
  return this.templateService.update(type, data);
}

@Post('email-templates/:type/preview')
async previewTemplate(
  @Param('type') type: EmailTemplateType,
  @Body() variables: Record<string, any>,
) {
  return this.templateService.renderTemplate(type, variables);
}

@Post('email-templates/:type/test')
async testTemplate(
  @Param('type') type: EmailTemplateType,
  @Body() data: { email: string; variables: Record<string, any> },
) {
  return this.templateService.sendTemplatedEmail(data.email, type, data.variables);
}
```

**Frontend - Editor de Plantillas:**
```typescript
// SuperAdminEmailTemplatesPage.tsx

Secciones:
1. Lista de Plantillas
   - Tarjetas con cada tipo de plantilla
   - Nombre y descripción
   - Estado (activa/inactiva)
   - Botón "Editar"

2. Editor de Plantilla (Modal o página)
   - Tipo de plantilla (readonly)
   - Nombre
   - Descripción
   - Asunto (con variables disponibles)
   - Editor HTML (con preview en vivo)
     * Toolbar: Bold, Italic, Link, Image
     * Insertar variables (dropdown)
     * Vista previa en tiempo real
   - Variables disponibles (lista con descripción)
   - Botón "Vista Previa"
   - Botón "Enviar Prueba"
   - Botón "Guardar"

3. Variables Dinámicas
   - {{tenantName}} - Nombre del tenant
   - {{ownerName}} - Nombre del owner
   - {{ownerEmail}} - Email del owner
   - {{trialDays}} - Días de trial
   - {{expirationDate}} - Fecha de expiración
   - {{planName}} - Nombre del plan
   - {{amount}} - Monto
   - {{invoiceNumber}} - Número de factura
   - {{supportUrl}} - URL de soporte
   - {{loginUrl}} - URL de login
```

**Plantillas Requeridas:**

1. **WELCOME** - Email de bienvenida
   - Se envía al crear un nuevo tenant
   - Variables: tenantName, ownerName, loginUrl, trialDays

2. **TRIAL_EXPIRING** - Trial próximo a expirar
   - Se envía 3 días antes de expirar
   - Variables: tenantName, daysRemaining, upgradeUrl

3. **TRIAL_EXPIRED** - Trial expirado
   - Se envía al expirar el trial
   - Variables: tenantName, upgradeUrl

4. **SUBSCRIPTION_ACTIVATED** - Suscripción activada
   - Se envía al activar suscripción paga
   - Variables: tenantName, planName, amount

5. **SUBSCRIPTION_CANCELLED** - Suscripción cancelada
   - Se envía al cancelar
   - Variables: tenantName, cancellationDate

6. **PAYMENT_SUCCESS** - Pago exitoso
   - Se envía al recibir pago
   - Variables: tenantName, amount, invoiceNumber, invoiceUrl

7. **PAYMENT_FAILED** - Pago fallido
   - Se envía al fallar un pago
   - Variables: tenantName, amount, retryDate, updatePaymentUrl

8. **PASSWORD_RESET** - Reseteo de contraseña
   - Se envía al solicitar reset
   - Variables: userName, resetUrl, expirationTime

9. **INVITATION** - Invitación a tenant
   - Se envía al invitar usuario
   - Variables: inviterName, tenantName, invitationUrl

10. **SUPPORT_TICKET_CREATED** - Ticket creado
    - Se envía al crear ticket
    - Variables: ticketNumber, subject, tenantName

---

### 5.3 Logs de Emails Enviados (❌ NO IMPLEMENTADO)

**Backend - Modelo de Datos:**
```typescript
// Agregar a schema.prisma
model EmailLog {
  id          String   @id @default(uuid())
  
  to          String
  subject     String
  templateType EmailTemplateType? @map("template_type")
  
  status      String   // 'sent', 'failed', 'bounced'
  error       String?
  
  sentAt      DateTime? @map("sent_at")
  openedAt    DateTime? @map("opened_at")
  clickedAt   DateTime? @map("clicked_at")
  
  metadata    Json?
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@index([to])
  @@index([status])
  @@index([createdAt])
  @@map("email_logs")
}
```

**Frontend - Página de Logs:**
```typescript
// SuperAdminEmailLogsPage.tsx

Secciones:
1. Filtros
   - Por destinatario
   - Por tipo de plantilla
   - Por estado (enviado, fallido, rebotado)
   - Por rango de fechas

2. Lista de Emails
   - Fecha/hora
   - Destinatario
   - Asunto
   - Tipo de plantilla
   - Estado
   - ¿Abierto?
   - ¿Clickeado?
   - Acciones: Ver detalles, Reenviar

3. Estadísticas
   - Total enviados hoy
   - Tasa de apertura
   - Tasa de clicks
   - Emails fallidos
```

---

## 📊 MÓDULO 6: ANALYTICS Y REPORTES

### 6.1 Dashboard de Analytics (✅ Implementado Parcialmente)

**Estado:** Básico implementado, necesita más métricas

**Funcionalidades Actuales:**
- ✅ Métricas del sistema (total tenants, usuarios, citas)
- ✅ Gráficos básicos

**Funcionalidades Faltantes:**
- ❌ Métricas de crecimiento (nuevos tenants por mes)
- ❌ Métricas de engagement (tenants activos vs inactivos)
- ❌ Métricas de uso (features más usadas)
- ❌ Comparación período anterior
- ❌ Exportar reportes

**Backend Requerido:**
```typescript
// analytics.service.ts
async getGrowthMetrics(startDate: Date, endDate: Date) {
  // Nuevos tenants por día/semana/mes
  // Tasa de crecimiento
  // Comparación con período anterior
}

async getEngagementMetrics() {
  // Tenants activos (con actividad en últimos 7 días)
  // Tenants inactivos
  // Promedio de citas por tenant
  // Promedio de pacientes por tenant
}

async getFeatureUsage() {
  // % de tenants usando odontogramas
  // % de tenants usando planes de tratamiento
  // % de tenants usando facturación
  // % de tenants con WhatsApp conectado
}

async getRetentionMetrics() {
  // Tasa de retención mensual
  // Cohort analysis
  // Churn rate
}
```

**Frontend - Mejoras al Dashboard:**
```typescript
// SuperAdminAnalyticsPage.tsx

Agregar:
1. Selector de período (últimos 7 días, 30 días, 90 días, año)
2. Comparación con período anterior (% de cambio)
3. Gráfico de crecimiento de tenants
4. Gráfico de MRR/ARR histórico
5. Mapa de calor de actividad
6. Top 10 tenants más activos
7. Botón "Exportar Reporte"
```

---

### 6.2 Reportes Personalizados (❌ NO IMPLEMENTADO)

**Funcionalidades Requeridas:**

**Frontend:**
```typescript
// SuperAdminCustomReportsPage.tsx

Constructor de Reportes:
1. Seleccionar Métricas
   - Tenants
   - Usuarios
   - Suscripciones
   - Ingresos
   - Actividad
   - Features

2. Filtros
   - Rango de fechas
   - Plan específico
   - Estado de suscripción
   - Región/país

3. Agrupación
   - Por día/semana/mes
   - Por plan
   - Por estado

4. Visualización
   - Tabla
   - Gráfico de líneas
   - Gráfico de barras
   - Gráfico de pastel

5. Exportar
   - PDF
   - Excel
   - CSV
   - Programar envío recurrente
```

---


## 🔍 MÓDULO 7: AUDIT LOGS

### 7.1 Visualización de Logs (✅ Implementado)

**Estado:** Funcional

**Funcionalidades:**
- ✅ Listar audit logs con paginación
- ✅ Filtrar por usuario, tenant, acción, entidad
- ✅ Ver detalles de cambios (before/after)
- ✅ Estadísticas de auditoría

**Mejoras Requeridas:**
- ❌ Exportar logs a CSV
- ❌ Búsqueda avanzada (por IP, user agent)
- ❌ Alertas de actividad sospechosa
- ❌ Retención de logs configurable

---

## ⚙️ MÓDULO 8: CONFIGURACIÓN GLOBAL

### 8.1 Configuración de Plataforma (✅ Implementado Parcialmente)

**Estado:** Frontend existe, backend faltante

**Funcionalidades Actuales:**
- ✅ Configuración general (nombre, email soporte)
- ✅ Configuración de notificaciones
- ✅ Configuración de seguridad
- ✅ Configuración de backups

**Funcionalidades Faltantes:**

**Backend:**
```typescript
// settings.model.ts
model PlatformSettings {
  id    String @id @default(uuid())
  key   String @unique
  value Json
  
  updatedAt DateTime @updatedAt
  updatedBy String   @map("updated_by")
  
  @@map("platform_settings")
}

// settings.service.ts
async getSetting(key: string) {
  return this.prisma.platformSettings.findUnique({ where: { key } });
}

async updateSetting(key: string, value: any, userId: string) {
  return this.prisma.platformSettings.upsert({
    where: { key },
    create: { key, value, updatedBy: userId },
    update: { value, updatedBy: userId },
  });
}
```

**Configuraciones Requeridas:**
1. **General**
   - Nombre de la plataforma
   - Email de soporte
   - URL base
   - Timezone por defecto

2. **Límites**
   - Tamaño máximo de archivo
   - Timeout de sesión
   - Intentos de login

3. **Features**
   - Permitir auto-registro
   - Requerir verificación de email
   - Habilitar modo mantenimiento

4. **Integrations**
   - API keys de servicios externos
   - WhatsApp Business API
   - Google Analytics
   - Sentry (error tracking)

---

## 🎫 MÓDULO 9: SOPORTE Y TICKETS

### 9.1 Sistema de Tickets (❌ NO IMPLEMENTADO)

**Estado:** CRÍTICO - Completamente faltante

**Backend - Modelo de Datos:**
```typescript
// Agregar a schema.prisma
enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_CUSTOMER
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model SupportTicket {
  id          String         @id @default(uuid())
  ticketNumber String        @unique @map("ticket_number") // AUTO-1001
  
  tenantId    String         @map("tenant_id")
  userId      String         @map("user_id") // Usuario que creó el ticket
  
  subject     String
  description String         @db.Text
  
  status      TicketStatus   @default(OPEN)
  priority    TicketPriority @default(MEDIUM)
  
  assignedTo  String?        @map("assigned_to") // SuperAdmin asignado
  
  resolvedAt  DateTime?      @map("resolved_at")
  closedAt    DateTime?      @map("closed_at")
  
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")
  
  tenant      Tenant         @relation(fields: [tenantId], references: [id])
  messages    TicketMessage[]
  
  @@index([tenantId])
  @@index([status])
  @@index([assignedTo])
  @@map("support_tickets")
}

model TicketMessage {
  id        String   @id @default(uuid())
  ticketId  String   @map("ticket_id")
  userId    String   @map("user_id")
  
  message   String   @db.Text
  isInternal Boolean @default(false) @map("is_internal") // Notas internas
  
  attachments Json?
  
  createdAt DateTime @default(now()) @map("created_at")
  
  ticket    SupportTicket @relation(fields: [ticketId], references: [id])
  
  @@index([ticketId])
  @@map("ticket_messages")
}
```

**Backend - Endpoints:**
```typescript
// support.controller.ts
@Get('tickets')
async getAllTickets(
  @Query('status') status?: TicketStatus,
  @Query('priority') priority?: TicketPriority,
  @Query('assignedTo') assignedTo?: string,
) {
  return this.supportService.findAll({ status, priority, assignedTo });
}

@Get('tickets/:id')
async getTicket(@Param('id') id: string) {
  return this.supportService.findById(id);
}

@Put('tickets/:id/assign')
async assignTicket(
  @Param('id') id: string,
  @Body() data: { assignedTo: string },
) {
  return this.supportService.assign(id, data.assignedTo);
}

@Put('tickets/:id/status')
async updateTicketStatus(
  @Param('id') id: string,
  @Body() data: { status: TicketStatus },
) {
  return this.supportService.updateStatus(id, data.status);
}

@Post('tickets/:id/messages')
async addMessage(
  @Param('id') id: string,
  @Body() data: { message: string; isInternal: boolean },
) {
  return this.supportService.addMessage(id, data);
}
```

**Frontend - Página de Tickets:**
```typescript
// SuperAdminSupportPage.tsx

Secciones:
1. Filtros y Búsqueda
   - Por estado
   - Por prioridad
   - Por tenant
   - Por asignado a

2. Lista de Tickets
   - Número de ticket
   - Asunto
   - Tenant
   - Estado
   - Prioridad
   - Asignado a
   - Última actualización
   - Click para ver detalle

3. Detalle de Ticket (Modal o página)
   - Información del ticket
   - Historial de mensajes
   - Campo para responder
   - Botones:
     * Cambiar estado
     * Cambiar prioridad
     * Asignar a
     * Cerrar ticket
     * Agregar nota interna

4. Estadísticas
   - Tickets abiertos
   - Tickets en progreso
   - Tiempo promedio de resolución
   - Tickets por prioridad
```

---

## 🚪 MÓDULO 10: AUTO-REGISTRO DE TENANTS

### 10.1 Página Pública de Registro (❌ NO IMPLEMENTADO)

**Estado:** CRÍTICO - Completamente faltante

**Funcionalidades Requeridas:**

**Backend - Endpoint Público:**
```typescript
// public-registration.controller.ts
@Controller('public/register')
export class PublicRegistrationController {
  @Post()
  async registerTenant(@Body() data: {
    // Datos del tenant
    clinicName: string;
    subdomain: string;
    
    // Datos del owner
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerPhone?: string;
    
    // Plan seleccionado
    planId: string;
    
    // Términos
    acceptedTerms: boolean;
  }) {
    // 1. Validar subdomain disponible
    // 2. Validar email no existe
    // 3. Crear usuario owner
    // 4. Crear tenant con trial
    // 5. Crear membership
    // 6. Enviar email de bienvenida
    // 7. Retornar credenciales de acceso
  }
  
  @Get('check-subdomain/:subdomain')
  async checkSubdomainAvailability(@Param('subdomain') subdomain: string) {
    const exists = await this.prisma.tenant.findUnique({
      where: { subdomain },
    });
    return { available: !exists };
  }
}
```

**Frontend - Página de Registro:**
```typescript
// PublicRegistrationPage.tsx (fuera del dashboard)

Wizard de Registro:
Paso 1: Seleccionar Plan
  - Mostrar planes disponibles
  - Destacar plan recomendado
  - Botón "Comenzar Trial Gratis"

Paso 2: Información de la Clínica
  - Nombre de la clínica
  - Subdomain (con validación en tiempo real)
    * Mostrar: "tu-clinica.denticloud.com"
    * Validar disponibilidad

Paso 3: Información del Administrador
  - Nombre completo
  - Email
  - Teléfono
  - Contraseña (con validación de fortaleza)
  - Confirmar contraseña

Paso 4: Términos y Condiciones
  - Checkbox "Acepto términos y condiciones"
  - Checkbox "Acepto política de privacidad"
  - Botón "Crear Cuenta"

Paso 5: Confirmación
  - Mensaje de éxito
  - Email de verificación enviado
  - Botón "Ir al Dashboard"
```

**Features del Auto-Registro:**
1. ✅ Validación de subdomain en tiempo real
2. ✅ Validación de email único
3. ✅ Trial automático de 14 días
4. ✅ Email de bienvenida
5. ✅ Configuración inicial guiada
6. ✅ Verificación de email opcional
7. ✅ Integración con Google/OAuth (opcional)

---


## 📋 RESUMEN DE PRIORIDADES

### 🔴 PRIORIDAD ALTA (Crítico para MVP)

1. **Gestión de Usuarios en Tenants**
   - Backend: Endpoints para agregar/remover usuarios de tenants
   - Frontend: Tab "Usuarios" completo en TenantDetailPage
   - Estimación: 2-3 días

2. **Sistema de Gestión de Planes**
   - Backend: Modelo + CRUD de planes
   - Frontend: Página de gestión de planes
   - Estimación: 3-4 días

3. **Configuración de Correos (SMTP)**
   - Backend: Servicio de email + configuración
   - Frontend: Página de configuración SMTP
   - Estimación: 2-3 días

4. **Plantillas de Email**
   - Backend: Modelo + servicio de plantillas
   - Frontend: Editor de plantillas
   - Estimación: 4-5 días

5. **Auto-Registro de Tenants**
   - Backend: Endpoint público de registro
   - Frontend: Página pública de registro
   - Estimación: 3-4 días

### 🟡 PRIORIDAD MEDIA (Importante)

6. **Sistema de Facturación con Stripe**
   - Backend: Integración completa con Stripe
   - Frontend: Gestión de facturas
   - Estimación: 5-7 días

7. **Sistema de Tickets de Soporte**
   - Backend: Modelo + endpoints
   - Frontend: Interfaz de tickets
   - Estimación: 4-5 días

8. **Tabs Adicionales en Detalle de Tenant**
   - Facturación
   - Uso de Recursos
   - Actividad
   - Configuración
   - Estimación: 3-4 días

9. **Mejoras a Analytics**
   - Métricas de crecimiento
   - Métricas de engagement
   - Reportes personalizados
   - Estimación: 3-4 días

### 🟢 PRIORIDAD BAJA (Nice to Have)

10. **Exportación de Datos**
    - CSV, Excel, PDF
    - Estimación: 2 días

11. **Logs de Emails**
    - Tracking de emails enviados
    - Estimación: 2 días

12. **Webhooks de Stripe**
    - Manejo de eventos
    - Estimación: 2-3 días

13. **Impersonación Mejorada**
    - Banner, límite de tiempo
    - Estimación: 1 día

---

## 🗓️ PLAN DE IMPLEMENTACIÓN SUGERIDO

### Sprint 1 (2 semanas) - Fundamentos
- ✅ Gestión de usuarios en tenants
- ✅ Sistema de gestión de planes
- ✅ Configuración de correos SMTP

### Sprint 2 (2 semanas) - Comunicación
- ✅ Plantillas de email
- ✅ Auto-registro de tenants
- ✅ Logs de emails

### Sprint 3 (2 semanas) - Monetización
- ✅ Integración con Stripe
- ✅ Sistema de facturación
- ✅ Webhooks

### Sprint 4 (2 semanas) - Soporte
- ✅ Sistema de tickets
- ✅ Tabs adicionales en detalle de tenant
- ✅ Mejoras a analytics

### Sprint 5 (1 semana) - Pulido
- ✅ Exportación de datos
- ✅ Mejoras UX
- ✅ Testing completo

**Tiempo Total Estimado:** 9 semanas (~2 meses)

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### Módulo 1: Gestión de Tenants
- [x] Listar tenants (Backend)
- [x] Listar tenants (Frontend)
- [x] Detalle de tenant (Backend)
- [x] Detalle de tenant (Frontend - básico)
- [x] Tab Usuarios en detalle (Backend) ✅ **COMPLETADO 2026-01-05**
- [x] Tab Usuarios en detalle (Frontend) ✅ **COMPLETADO 2026-01-05**
- [ ] Tab Facturación (Backend)
- [ ] Tab Facturación (Frontend)
- [ ] Tab Uso de Recursos (Backend)
- [ ] Tab Uso de Recursos (Frontend)
- [ ] Tab Actividad (Backend)
- [ ] Tab Actividad (Frontend)
- [ ] Tab Configuración (Frontend)
- [x] Crear tenant (Backend)
- [ ] Crear tenant con wizard (Frontend)
- [x] Editar tenant (Backend)
- [x] Editar tenant (Frontend)
- [x] Suspender/Reactivar (Backend)
- [x] Suspender/Reactivar (Frontend)
- [x] Eliminar tenant (Backend)
- [x] Eliminar tenant (Frontend)
- [ ] Exportar lista de tenants
- [ ] Acciones masivas

### Módulo 2: Gestión de Usuarios
- [x] Listar usuarios (Backend)
- [x] Listar usuarios (Frontend)
- [x] Crear usuario (Backend)
- [x] Crear usuario (Frontend)
- [x] Editar usuario (Backend)
- [x] Editar usuario (Frontend)
- [x] Eliminar usuario (Backend)
- [x] Eliminar usuario (Frontend)
- [x] Impersonar usuario (Backend)
- [ ] Impersonar usuario mejorado (Frontend)
- [ ] Filtros avanzados
- [ ] Exportar usuarios

### Módulo 3: Planes y Suscripciones
- [x] Modelo de planes (Backend) ✅ **COMPLETADO 2026-01-05**
- [x] CRUD de planes (Backend) ✅ **COMPLETADO 2026-01-05**
- [x] Gestión de planes (Frontend) ✅ **COMPLETADO 2026-01-05**
- [x] Actualizar suscripción (Backend)
- [x] Actualizar suscripción (Frontend)
- [ ] Historial de cambios de plan
- [ ] Gestión de trials
- [ ] Programar cambios de plan

### Módulo 4: Facturación
- [ ] Integración con Stripe (Backend)
- [ ] Crear customer en Stripe
- [ ] Crear suscripción en Stripe
- [ ] Webhooks de Stripe
- [ ] Gestión de facturas (Backend)
- [ ] Gestión de facturas (Frontend)
- [ ] Reportes financieros
- [ ] Exportar facturas

### Módulo 5: Correos ✅ **COMPLETADO 2026-01-05**
- [x] Configuración SMTP (Backend) ✅ **COMPLETADO 2026-01-05**
- [x] Configuración SMTP (Frontend) ✅ **COMPLETADO 2026-01-05**
- [x] Servicio de email (Backend) ✅ **COMPLETADO 2026-01-05**
- [x] Modelo de plantillas (Backend) ✅ **COMPLETADO 2026-01-05**
- [x] CRUD de plantillas (Backend) ✅ **COMPLETADO 2026-01-05**
- [x] Editor de plantillas (Frontend) ✅ **COMPLETADO 2026-01-05**
- [x] Renderizado de plantillas ✅ **COMPLETADO 2026-01-05**
- [x] Logs de emails (Backend) ✅ **COMPLETADO 2026-01-05**
- [x] Logs de emails (Frontend) ✅ **COMPLETADO 2026-01-05**
- [ ] Tracking de emails (aperturas, clicks) - Opcional

### Módulo 6: Analytics
- [x] Métricas del sistema (Backend)
- [x] Métricas del sistema (Frontend)
- [x] Métricas de revenue (Backend)
- [x] Métricas de revenue (Frontend)
- [ ] Métricas de crecimiento
- [ ] Métricas de engagement
- [ ] Métricas de uso de features
- [ ] Reportes personalizados
- [ ] Exportar reportes

### Módulo 7: Audit Logs
- [x] Modelo de audit logs
- [x] Registro automático de acciones
- [x] Listar audit logs (Backend)
- [x] Listar audit logs (Frontend)
- [x] Filtros de audit logs
- [x] Estadísticas de auditoría
- [ ] Exportar logs
- [ ] Alertas de actividad sospechosa

### Módulo 8: Configuración Global
- [ ] Modelo de configuración (Backend)
- [ ] CRUD de configuración (Backend)
- [x] Interfaz de configuración (Frontend)
- [ ] Persistir configuración en BD
- [ ] Validación de configuración

### Módulo 9: Soporte
- [ ] Modelo de tickets (Backend)
- [ ] CRUD de tickets (Backend)
- [ ] Sistema de mensajes (Backend)
- [ ] Interfaz de tickets (Frontend)
- [ ] Asignación de tickets
- [ ] Notificaciones de tickets
- [ ] SLA tracking

### Módulo 10: Auto-Registro
- [ ] Endpoint público de registro (Backend)
- [ ] Validación de subdomain (Backend)
- [ ] Página pública de registro (Frontend)
- [ ] Wizard de registro
- [ ] Email de verificación
- [ ] Configuración inicial guiada

---

## 🎯 MÉTRICAS DE ÉXITO

### KPIs del SuperAdmin
1. **Eficiencia Operativa**
   - Tiempo promedio para crear un tenant: < 2 minutos
   - Tiempo promedio para resolver un ticket: < 24 horas
   - Uptime de la plataforma: > 99.9%

2. **Crecimiento**
   - Nuevos tenants por mes: Tracking
   - Tasa de conversión trial → pago: > 20%
   - Churn rate mensual: < 5%

3. **Financiero**
   - MRR growth rate: > 10% mensual
   - LTV/CAC ratio: > 3:1
   - Tasa de cobro: > 95%

4. **Soporte**
   - Tiempo de primera respuesta: < 2 horas
   - Satisfacción del cliente: > 4.5/5
   - Tickets resueltos en primera interacción: > 70%

---

## 🔧 STACK TECNOLÓGICO RECOMENDADO

### Backend
- **Framework:** NestJS (ya implementado)
- **Base de Datos:** PostgreSQL + Prisma (ya implementado)
- **Email:** Nodemailer + plantillas Handlebars
- **Pagos:** Stripe SDK
- **Cron Jobs:** @nestjs/schedule
- **File Storage:** AWS S3 o local
- **Logs:** Winston + Sentry

### Frontend
- **Framework:** React + TypeScript (ya implementado)
- **UI:** TailwindCSS + shadcn/ui (ya implementado)
- **Icons:** Lucide React (ya implementado)
- **Charts:** Recharts o Chart.js
- **Forms:** React Hook Form + Zod
- **HTTP:** Axios (ya implementado)
- **Editor:** TinyMCE o Quill (para plantillas)

### DevOps
- **Hosting:** Render, Railway, o AWS
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry + Uptime Robot
- **Backups:** Automatizados diarios

---

## 📚 DOCUMENTACIÓN ADICIONAL REQUERIDA

1. **Manual de Usuario SuperAdmin**
   - Guía de inicio rápido
   - Gestión de tenants
   - Gestión de facturación
   - Soporte y tickets

2. **API Documentation**
   - Swagger/OpenAPI completo
   - Ejemplos de uso
   - Rate limits
   - Autenticación

3. **Runbooks Operativos**
   - Procedimiento de backup/restore
   - Manejo de incidentes
   - Escalación de problemas
   - Mantenimiento programado

4. **Políticas y Procedimientos**
   - Política de privacidad
   - Términos de servicio
   - SLA commitments
   - Política de cancelación

---

## ✅ CONCLUSIÓN

Este roadmap detalla **TODAS** las funcionalidades necesarias para un módulo SuperAdmin completo y profesional en DentiCloud. La implementación completa tomará aproximadamente **9 semanas** con un equipo de desarrollo dedicado.

### Próximos Pasos Inmediatos:
1. ✅ Revisar y aprobar este roadmap
2. ✅ Priorizar funcionalidades según necesidades del negocio
3. ✅ Asignar recursos y equipo
4. ✅ Comenzar con Sprint 1: Fundamentos
5. ✅ Establecer métricas de seguimiento

### Notas Importantes:
- Este documento debe actualizarse conforme avanza la implementación
- Las estimaciones son aproximadas y pueden variar
- Se recomienda implementación iterativa con releases frecuentes
- Testing y QA deben ser continuos, no solo al final

---

**Documento creado:** 5 de Enero, 2026  
**Última actualización:** 5 de Enero, 2026  
**Versión:** 1.0  
**Autor:** Cascade AI  
**Estado:** Pendiente de aprobación

