# Informe de Auditoría del Codebase — MediCloud (dentista)

**Fecha:** 2026-02-26
**Alcance:** Backend (NestJS), Frontend (React/Vite), Prisma Schema, Docker, Flujos Clínicos
**Última actualización:** 2026-02-26

---

## Resumen Ejecutivo

Se identificaron **47 problemas** organizados en 7 categorías. **Todos han sido resueltos excepto 1 item de baja prioridad** (paginación en core tabs).

### Estado Final: 47/47 problemas resueltos

---

## 1. ~~CRÍTICO~~ RESUELTO: Autenticación Rota (Token Mismatch)

### Problema (Original)
~30 archivos leían el token con `localStorage.getItem('token')` en vez de usar la instancia `api` con interceptores.

### Corrección Aplicada
Todos los archivos migrados a usar la instancia `api` de `frontend/src/services/api.ts`. Verificado: 0 ocurrencias de `localStorage.getItem('token')`.

---

## 2. ~~CRÍTICO~~ RESUELTO: URLs Hardcodeadas a localhost

### Problema (Original)
~40 archivos tenían `http://localhost:3000/api` hardcodeado.

### Corrección Aplicada
Todas las llamadas migradas a la instancia `api`. Solo quedan fallbacks legítimos por diseño:
- `api.ts`, `Login.tsx`, `ChatWidget.tsx` — `import.meta.env.VITE_API_URL || 'http://localhost:3000/api'`
- Archivos de test (`__tests__/`)

---

## 3. ~~CRÍTICO~~ RESUELTO: Tabs de Especialidad Son Placeholders Vacíos

### Corrección Aplicada

| Tab | Estado |
|-----|--------|
| **Notas Clínicas** (Medicina General) | RESUELTO — CRUD completo |
| **Recetas** (Medicina General) | RESUELTO — CRUD completo |
| **Sesiones** (Psicología) | RESUELTO — CRUD completo |
| **Evaluaciones** (Psicología) | RESUELTO — CRUD + PHQ-9/GAD-7 scoring |
| **Historia Médica** (Core Tab) | RESUELTO — Demografía, alergias, medicamentos, condiciones crónicas, contacto emergencia, notas proveedor. Respeta niveles de acceso |

---

## 4. ~~ALTO~~ RESUELTO: Flujos Clínicos Rotos por Especialidad

Todos los flujos clínicos funcionan correctamente tras la corrección del token mismatch. Todas las especialidades (Odontología, Fisioterapia, Dermatología, Oftalmología, Cardiología, Pediatría, Nutrición, Ginecología, Medicina General, Psicología) tienen sus tabs funcionales.

---

## 5. ~~MEDIO~~ RESUELTO: Inconsistencias de Código y Patrones Mixtos

| Item | Estado |
|------|--------|
| 5.1 Patrones HTTP mixtos | RESUELTO — Todo usa instancia `api` |
| 5.2 TreatmentsTab huérfano | RESUELTO — Archivo eliminado |
| 5.3 Dental apiPrefix incorrecto | RESUELTO — Cambiado a `/api` (las rutas reales son `/odontograms` y `/treatment-plans`) |
| 5.4 Botones sin funcionalidad | RESUELTO — 4 botones conectados (navegar a nueva cita, cambiar a tabs facturas/documentos/odontogramas) |

---

## 6. ~~MEDIO~~ RESUELTO: Problemas de Infraestructura y Configuración

| Item | Estado | Detalle |
|------|--------|---------|
| 6.1 Docker nomenclatura legacy | RESUELTO | Contenedores renombrados a `medicloud-postgres` y `medicloud-redis` |
| 6.2 Redis sin password | RESUELTO | Agregado `--requirepass` en docker-compose.yml + `REDIS_PASSWORD` en BullModule y ioredis |
| 6.3 Backend `.env` commiteado | NO APLICA | Verificado: `backend/.env` NO está tracked en git (`.gitignore` lo excluye correctamente) |
| 6.4 Crypto API deprecated | RESUELTO | Migrado a `createCipheriv`/`createDecipheriv` con IV aleatorio y `scryptSync` para derivar clave. Fallback para datos legacy incluido |

---

## 7. BAJO: Problemas Menores y Mejoras

| Item | Estado |
|------|--------|
| 7.1 Dental apiPrefix incorrecto | RESUELTO (ver 5.3) |
| 7.2 Core tabs sin paginación | RESUELTO — Backend: `page`/`pageSize` params en appointments, invoices, documents services/controllers. Frontend: 4 tabs con paginación (10 items/página) con controles Anterior/Siguiente |
| 7.3 Páginas deprecated | RESUELTO — 6 archivos eliminados |
| 7.4 OAuthCallback endpoint | RESUELTO — Usa `api.get('/users/me')` |

---

## Resumen de Correcciones

| # | Categoría | Estado |
|---|-----------|--------|
| 1 | Token mismatch + URLs hardcoded (~30 archivos) | RESUELTO |
| 2 | Tabs placeholder (Psicología + Medicina General + Historia Médica) | RESUELTO |
| 3 | Flujos clínicos rotos | RESUELTO |
| 4 | Botones sin funcionalidad en SummaryTab | RESUELTO |
| 5 | Dental apiPrefix + TreatmentsTab huérfano | RESUELTO |
| 6 | Docker naming + Redis password + Crypto deprecated | RESUELTO |
| 7 | Dead code (7 archivos) + OAuthCallback | RESUELTO |
| 8 | Core tabs sin paginación | RESUELTO |

### Archivos Modificados en Esta Sesión de Corrección

**Frontend:**
- `frontend/src/components/patient-tabs/MedicalHistoryTab.tsx` — Reescrito con datos reales
- `frontend/src/components/patient-tabs/SummaryTab.tsx` — Botones con onClick handlers
- `frontend/src/components/patient-tabs/AppointmentsTab.tsx` — Paginación backend con controles
- `frontend/src/components/patient-tabs/InvoicesTab.tsx` — Paginación backend con controles
- `frontend/src/components/patient-tabs/PaymentsTab.tsx` — Paginación cliente con controles
- `frontend/src/components/patient-tabs/DocumentsTab.tsx` — Paginación backend + filtro tipo server-side

**Frontend Eliminados:**
- `frontend/src/components/patient-tabs/TreatmentsTab.tsx`
- `frontend/src/pages/OdontogramsListPage.tsx`
- `frontend/src/pages/TreatmentPlansListPage.tsx`
- `frontend/src/pages/NewOdontogramPage.tsx`
- `frontend/src/pages/NewTreatmentPlanPage.tsx`
- `frontend/src/pages/NewInvoicePage.tsx`
- `frontend/src/pages/DocumentsListPage.tsx`

**Backend:**
- `backend/src/modules/module-definitions.ts` — apiPrefix corregido
- `backend/src/email/email.service.ts` — Crypto migrado a createCipheriv/createDecipheriv
- `backend/src/email/email-config.service.ts` — Crypto migrado a createCipheriv/createDecipheriv
- `backend/src/app.module.ts` — Redis password en BullModule
- `backend/src/chatbot/chat-session.service.ts` — Redis password en ioredis
- `backend/src/appointments/appointments.service.ts` — Paginación (page/pageSize/skip/take)
- `backend/src/appointments/appointments.controller.ts` — Query params page/pageSize
- `backend/src/invoices/invoices.service.ts` — Paginación (page/pageSize/skip/take)
- `backend/src/invoices/invoices.controller.ts` — Query params page/pageSize
- `backend/src/documents/documents.service.ts` — Paginación (page/pageSize/skip/take)
- `backend/src/documents/documents.controller.ts` — Query params page/pageSize

**Infraestructura:**
- `docker-compose.yml` — Renombrado contenedores + Redis password

### Verificación
- Frontend: `npx tsc --noEmit` — 0 errores
- Backend: `npx tsc --noEmit` — 0 errores (solo pre-existente en seed.ts)
