# MediCloud - Plan de Mejoras Priorizado

**Fecha:** 2026-02-17
**Basado en:** Auditoría integral de fases 0-6
**Formato:** P0 (Crítico) → P1 (Alto) → P2 (Medio) → P3 (Bajo)

---

## P0 — Crítico (Bloquea funcionalidad)

> No hay items P0 pendientes. Los 2 bugs P0/P1 encontrados fueron corregidos durante la auditoría.

### ~~P0-001: PatientConsents.tsx — Método API inexistente~~ CORREGIDO
- **Descripción:** `patientPortalAPI.getConsents()` no existía, rompía la página de consentimientos
- **Corrección:** Cambiado a `patientRegistrationAPI.getMyConsents()`
- **Archivo:** `frontend/src/pages/patient/PatientConsents.tsx:332`

---

## P1 — Alto (Funcionalidad degradada o riesgo de seguridad)

### ~~P1-001: Ruta incorrecta validate-reset-token~~ CORREGIDO
- **Descripción:** Frontend llamaba `/auth/reset-password/validate` pero backend expone `/auth/validate-reset-token`
- **Corrección:** Actualizado path en api.ts
- **Archivo:** `frontend/src/services/api.ts:156`

### ~~P1-002: Chat Controller sin validación de input~~ CORREGIDO
- **Descripción:** El `ChatController` usaba interfaces TypeScript inline en lugar de DTOs con class-validator.
- **Corrección:** Creado `backend/src/chatbot/dto/chat-message.dto.ts` con `SendMessageDto` y `EndSessionDto` usando `@IsString()`, `@IsNotEmpty()`, `@MaxLength(2000)`. Controller reescrito para usar los DTOs y eliminar dead try-catch en `endSession`.

### P1-003: Chat Controller sin rate limiting
- **Descripción:** El endpoint `/api/chat/send` es público (sin JWT) y no tiene rate limiting, vulnerable a abuso/spam.
- **Archivos afectados:**
  - `backend/src/chatbot/chat.controller.ts` — Agregar `@Throttle()` decorator
  - `backend/src/app.module.ts` — Importar `ThrottlerModule` si no existe
- **Complejidad:** Baja (1-2 horas)
- **Dependencias:** Instalar `@nestjs/throttler` si no está
- **Pasos:**
  1. `yarn add @nestjs/throttler`
  2. Configurar `ThrottlerModule.forRoot({ ttl: 60, limit: 20 })` en app.module
  3. Agregar `@Throttle(20, 60)` al ChatController
  4. Considerar throttle más agresivo para `/send` (10 req/min)

### P1-004: TenantSettingsPage — profile update no implementado
- **Descripción:** La página de configuración del tenant tiene un TODO para implementar la llamada API de actualización de perfil.
- **Archivos afectados:**
  - `frontend/src/pages/TenantSettingsPage.tsx:18`
  - `frontend/src/services/api.ts` — Verificar si existe `tenantAPI.updateSettings()`
- **Complejidad:** Baja (2-3 horas)
- **Pasos:**
  1. Verificar endpoint backend `PATCH /api/tenants/:id` o similar
  2. Implementar llamada API en el handler del formulario
  3. Agregar feedback de éxito/error con toast

---

## P2 — Medio (Mejora la experiencia de desarrollo/demo)

### P2-001: Completar seed data para 7 especialidades faltantes
- **Descripción:** Los módulos de psicología (TherapySession, PsychologicalAssessment), dermatología (SkinLesion), cardiología (CardiacAssessment), nutrición (NutritionPlan, BodyMeasurement) y ginecología (GynecologicalExam) no tienen datos semilla. Los tabs correspondientes aparecen vacíos.
- **Archivos afectados:**
  - `backend/prisma/seed.ts` — Agregar secciones de seeds para 7 modelos
- **Complejidad:** Media (4-6 horas)
- **Pacientes existentes para asociar:**
  - `andres.martinez@mail.com` → derma + psico + nutri
  - `maria.santos@mail.com` → ginecología
  - `pedro.ramirez@mail.com` → cardiología
- **Pasos:**
  1. Agregar 2-3 TherapySessions para el paciente de psicología
  2. Agregar 1-2 PsychologicalAssessments (PHQ-9, GAD-7) con scores
  3. Agregar 2 SkinLesions para Andrés (dermatologo)
  4. Agregar 2 CardiacAssessments para Pedro (cardiologo)
  5. Agregar 1 NutritionPlan + 2 BodyMeasurements para Andrés (nutricionista)
  6. Agregar 1-2 GynecologicalExams para María (ginecologa)

### P2-002: Completar seed data para Invoice y Payment
- **Descripción:** No hay facturas ni pagos en las semillas. Las páginas de facturación (InvoicesListPage, InvoiceDetailPage) aparecen vacías.
- **Archivos afectados:**
  - `backend/prisma/seed.ts`
- **Complejidad:** Media (3-4 horas)
- **Pasos:**
  1. Crear 3-5 invoices con diferentes estados (PENDING, PAID, OVERDUE)
  2. Crear 2-3 payments asociados a invoices PAID
  3. Asociar a pacientes existentes con citas completadas

### P2-003: ChatSession persistencia en Redis
- **Descripción:** `ChatSessionService` usa Map en memoria con auto-expiry de 30 minutos. Los datos se pierden al reiniciar el servidor. Debería usar Redis (ya disponible en docker-compose).
- **Archivos afectados:**
  - `backend/src/chatbot/chat-session.service.ts`
- **Complejidad:** Media (4-6 horas)
- **Dependencias:** Redis ya corriendo en puerto 6381
- **Pasos:**
  1. Instalar `@nestjs/cache-manager` + `cache-manager-redis-store` si no están
  2. Refactorizar dual-index Maps a Redis HASH + SET
  3. Usar Redis TTL nativo para expiración de 30 min
  4. Mantener interfaz pública del servicio idéntica

### P2-004: Tests unitarios y E2E
- **Descripción:** No se encontraron tests en el proyecto. Con 54 modelos Prisma y 52+ endpoints, es crítico tener al menos tests de integración para los flujos principales.
- **Archivos afectados:**
  - `backend/test/` — Directorio de tests
  - `package.json` — Scripts de test
- **Complejidad:** Alta (20-40 horas)
- **Prioridad de tests sugerida:**
  1. Auth flow (login, register, reset password)
  2. Consent system (grant, deny, revoke, check access)
  3. Patient portal (dashboard, health profile, exams)
  4. Module CRUD (al menos 1 especialidad como template)
  5. Clinic admin (dashboard, rooms, staff)

### P2-005: Prisma relations faltantes en modelos Phase 6
- **Descripción:** Los 11 modelos de Fase 6 (ExercisePlan, SkinLesion, EyeExam, etc.) no tienen relaciones Prisma (`@relation`) hacia Patient, Provider ni Tenant. Solo tienen campos `patientId`, `providerId`, `tenantId` como strings con `@@index`. Esto impide hacer includes/joins eficientes.
- **Archivos afectados:**
  - `backend/prisma/schema.prisma` — Agregar `@relation` fields a 11 modelos
  - Los modelos Patient, Provider, Tenant necesitarían campos inversos
- **Complejidad:** Media (3-4 horas)
- **Riesgo:** Requiere `prisma db push` después de cambios. Sin datos en los 7 modelos faltantes, el riesgo es bajo.
- **Pasos:**
  1. Agregar `patient Patient @relation(fields: [patientId], references: [id])` a cada modelo
  2. Agregar `provider Provider @relation(...)` a cada modelo
  3. Agregar campos inversos en Patient/Provider/Tenant (e.g., `exercisePlans ExercisePlan[]`)
  4. Ejecutar `npx prisma db push`

---

## P3 — Bajo (Nice-to-have, mejoras cosméticas)

### P3-001: Eliminar `version` attribute de docker-compose.yml
- **Descripción:** `version: '3.8'` genera un warning de Docker Compose: "the attribute `version` is obsolete".
- **Archivos afectados:**
  - `docker-compose.yml` — Eliminar línea `version: '3.8'`
- **Complejidad:** Trivial (1 minuto)

### P3-002: Seeds para RecurringAppointment y CalendarSync
- **Descripción:** No hay datos demo para citas recurrentes ni sincronización de calendario. Funcionalidad existe pero sin demostración.
- **Archivos afectados:**
  - `backend/prisma/seed.ts`
- **Complejidad:** Baja (1-2 horas)

### ~~P3-003: Agregar logging estructurado~~ CORREGIDO
- **Descripción:** `main.ts`, `prisma.service.ts`, `appointments.service.ts` usaban `console.log/error`.
- **Corrección:** Migrados a NestJS `Logger` con instancias nombradas. También se agregó `Logger.warn` en `services.service.ts` (silent catch) y `consent-check.middleware.ts`.

### P3-004: Bundle size optimization
- **Descripción:** El bundle principal es 1.1MB. Con 17 tabs de módulos ya lazy-loaded, el core bundle podría optimizarse más separando librerías grandes.
- **Archivos afectados:**
  - `frontend/vite.config.ts` — Configurar manual chunks
- **Complejidad:** Baja (2-3 horas)
- **Pasos:**
  1. Analizar con `npx vite-bundle-visualizer`
  2. Separar chunks: react-vendor, ui-vendor, api-client
  3. Evaluar lazy loading para rutas SuperAdmin y ClinicAdmin

### P3-005: Seed data para Waitlist
- **Descripción:** El modelo Waitlist existe pero no tiene datos demo ni UI visible.
- **Archivos afectados:**
  - `backend/prisma/seed.ts`
- **Complejidad:** Trivial (30 min)

### P3-006: Documentación de API (Swagger/OpenAPI)
- **Descripción:** No hay documentación de API generada. NestJS soporta `@nestjs/swagger` para generar OpenAPI spec automáticamente.
- **Archivos afectados:**
  - `backend/src/main.ts` — Setup Swagger
  - `backend/package.json` — Agregar dependencia
  - DTOs existentes — Agregar `@ApiProperty()` decoradores
- **Complejidad:** Alta (10-15 horas para 52+ endpoints)
- **Pasos:**
  1. `yarn add @nestjs/swagger swagger-ui-express`
  2. Configurar en main.ts con `SwaggerModule.setup('api/docs', ...)`
  3. Agregar `@ApiTags()` a cada controller
  4. Agregar `@ApiProperty()` a DTOs críticos gradualmente

---

## Roadmap Sugerido

### Sprint 1 (Inmediato — 1-2 días) COMPLETADO
- [x] ~~P0-001: Fix PatientConsents.tsx~~ DONE
- [x] ~~P1-001: Fix validate-reset-token path~~ DONE
- [x] ~~P1-002: Chat DTO validation~~ DONE
- [x] ~~P3-001: Docker compose version cleanup~~ DONE
- [x] ~~P3-003: Structured logging~~ DONE
- [x] ~~Stale branding DentiCloud → MediCloud~~ DONE
- [x] ~~Dead code: example-casl.controller.ts~~ DONE
- [x] ~~Silent catches sin logging~~ DONE
- [x] ~~Dead try-catch chat.controller.ts~~ DONE
- [ ] P1-003: Rate limiting (requiere instalar `@nestjs/throttler`)

### Sprint 2 (Próxima semana — 3-5 días)
- [ ] P1-003: Rate limiting
- [ ] P1-004: TenantSettingsPage implementation
- [ ] P2-001: Seeds para 7 especialidades faltantes
- [ ] P2-002: Seeds para Invoice/Payment
- [ ] P2-005: Prisma relations para modelos Phase 6

### Sprint 3 (Próximas 2 semanas)
- [ ] P2-003: ChatSession Redis persistencia
- [ ] P2-004: Tests unitarios (empezar con auth + consents)
- [ ] P3-004: Bundle optimization
- [ ] P3-006: Swagger setup básico

### Sprint 4 (Siguiente mes)
- [ ] P2-004: Tests E2E completos
- [ ] P3-002: Seeds RecurringAppointment
- [ ] P3-005: Seed Waitlist
- [ ] P3-006: Swagger completo con ApiProperty

---

## Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Modelos Prisma | 54 |
| Módulos NestJS | 45 |
| Endpoints verificados | 52/52 (100%) |
| Páginas frontend | 57 |
| Rutas frontend | 70+ |
| Métodos API frontend | 100+ |
| Componentes de tabs | 17 (10 módulos) |
| Usuarios seed | 21 |
| Pacientes seed | 8 |
| Líneas de código seed | ~2,500 |
| TypeScript errors | 0 (backend + frontend) |
| Build status | OK |
| TODOs pendientes | 1 |
| Bugs encontrados | 2 (corregidos) |
| Issues de código corregidos | 9 (DTOs, logging, branding, dead code) |
| Items pendientes | 3 (rate limiting, seeds, TenantSettings) |
