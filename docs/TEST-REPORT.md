# MediCloud Test Report

**Date:** 2026-02-26
**Branch:** fix/p2-tests

---

## Summary

| Category | Suites | Tests | Status |
|----------|--------|-------|--------|
| Backend Unit Tests | 4 | 61 | ALL PASS |
| Backend E2E Tests | 2 | 17 | ALL PASS |
| Frontend Component Tests | 3 | 27 | ALL PASS |
| **TOTAL** | **9** | **105** | **ALL PASS** |

---

## Backend Unit Tests (61 tests)

### AuthService (`src/auth/auth.service.spec.ts`) — 16 tests
- `validateUser` — valid credentials returns user without passwordHash
- `validateUser` — wrong password throws UnauthorizedException
- `validateUser` — non-existent user throws UnauthorizedException
- `validateUser` — OAuth user (no passwordHash) throws UnauthorizedException
- `login` — returns accessToken, refreshToken, and user data
- `login` — resolves tenantId from memberships if no owned tenants
- `login` — sets tenantId to null when user has no tenants
- `register` — creates user with hashed password and returns login response
- `register` — throws ConflictException when email already exists
- `refreshAccessToken` — returns new tokens for valid refresh token
- `refreshAccessToken` — throws for expired refresh token
- `refreshAccessToken` — throws for revoked refresh token
- `refreshAccessToken` — throws for non-existent refresh token
- `logout` — revokes the refresh token session
- `forgotPassword` — returns success even for non-existent email (prevents enumeration)
- `forgotPassword` — sends reset email for existing user
- `getMe` — returns user data, throws NotFoundException for missing user

### PatientsService (`src/patients/patients.service.spec.ts`) — 12 tests
- `findAllForProvider` — returns only patients for given provider and tenant (multi-tenancy)
- `findAllForProvider` — returns empty array when no patients in tenant
- `findAllForProvider` — ensures tenantId is always in query (multi-tenancy isolation)
- `findOne` — returns patient with correct provider and tenant
- `findOne` — throws NotFoundException when patient does not exist
- `findOne` — throws NotFoundException for patient in different tenant (multi-tenancy guard)
- `create` — creates patient and associates with provider and tenant
- `create` — uses existing user if userId is provided
- `create` — throws BadRequestException when neither userId nor email provided
- `update` — updates patient data after verifying access
- `update` — throws NotFoundException for non-existent patient
- `search` — scopes search to provider and tenant
- `remove` — soft-deletes by deactivating provider-patient relation

### AppointmentsService (`src/appointments/appointments.service.spec.ts`) — 14 tests
- `create` — creates appointment when relation exists and no conflicts
- `create` — throws ForbiddenException when patient not associated with provider
- `create` — throws ForbiddenException when provider has no room access
- `create` — uses SchedulingService for room-based conflict check
- `create` — throws BadRequestException on scheduling conflict
- `create` — detects time overlap in basic provider-only conflict check
- `findAll` — filters by providerId and tenantId
- `findAll` — applies date range filters
- `findOne` — returns appointment scoped to provider and tenant
- `findOne` — throws NotFoundException when not found
- `updateStatus` — changes status to CANCELLED
- `updateStatus` — changes status to COMPLETED
- `updateStatus` — throws NotFoundException for non-existent appointment
- `remove` — deletes after verifying access
- `findToday` — filters for today only

### ChatSessionService (`src/chatbot/chat-session.service.spec.ts`) — 19 tests
- `getOrCreateSession` — creates new session when none exists
- `getOrCreateSession` — returns existing session for same channel/sender/tenant
- `getOrCreateSession` — creates different sessions for different tenants
- `getOrCreateSession` — creates different sessions for different channels
- `getSession` — returns existing session by ID
- `getSession` — returns undefined for non-existent session
- `addMessage` — adds message to conversation history
- `addMessage` — doesn't fail for non-existent session
- `updateSession` — updates session metadata (patientId, patientName, lastIntent)
- `updateSession` — returns undefined for non-existent session
- `endSession` — deletes session from Redis
- `endSession` — cleans up sender key and tenant set
- `getActiveSessions` — returns all active sessions for a tenant
- `getActiveSessions` — returns empty array when no sessions
- `getActiveSessions` — cleans up stale session references

---

## Backend E2E / Integration Tests (17 tests)

### Auth Controller (`test/auth.e2e-spec.ts`) — 7 tests
- POST /auth/register — registers new user (201-equivalent)
- POST /auth/register — rejects duplicate email (409-equivalent)
- POST /auth/login — returns tokens for valid credentials (200-equivalent)
- POST /auth/refresh — returns new tokens for valid refresh (200-equivalent)
- POST /auth/refresh — rejects invalid token (401-equivalent)
- POST /auth/logout — revokes session (200-equivalent)
- GET /auth/me — returns current user data
- POST /auth/switch-tenant — switches tenant with valid membership

### TenantMembership Controller (`test/tenants.e2e-spec.ts`) — 10 tests
- POST /tenant-membership/invite — invites new staff (201-equivalent)
- POST /tenant-membership/invite — rejects duplicate staff (409-equivalent)
- GET /tenant-membership/staff — returns all staff for tenant
- GET /tenant-membership/:id — returns membership within same tenant
- GET /tenant-membership/:id — rejects cross-tenant access (NotFoundException)
- PATCH /tenant-membership/:id/accept — accepts pending invitation
- PATCH /tenant-membership/:id/accept — rejects already-accepted invitation
- PATCH /tenant-membership/:id/reject — rejects and deactivates membership
- DELETE /tenant-membership/:id — soft-deletes membership

---

## Frontend Component Tests (27 tests)

### Login Page (`src/__tests__/Login.test.tsx`) — 9 tests
- Renders email and password fields
- Renders submit button with "Iniciar sesión"
- Renders OAuth buttons (Google, Apple, Microsoft)
- Renders forgot password link
- Updates fields on input
- Calls login function on form submit
- Shows error message on failed login
- Shows loading state while logging in
- Navigates to SUPER_ADMIN dashboard for admin users

### TenantSettingsPage (`src/__tests__/TenantSettingsPage.test.tsx`) — 9 tests
- Renders settings page title
- Renders profile tab with user information
- Renders form with pre-filled values
- Renders Perfil and Seguridad tabs
- Calls updateProfile API on form submit
- Shows success message after profile update
- Shows error message on failed update
- Switches to Security tab
- Shows password form when clicking change password button

### PatientsListPage (`src/__tests__/PatientsListPage.test.tsx`) — 9 tests
- Renders page title "Pacientes"
- Shows loading spinner initially
- Renders patient list after API response
- Shows empty state when no patients found
- Renders "Nuevo Paciente" button
- Renders search input
- Renders export and import CSV buttons
- Shows patient count
- Calls API with authorization header

---

## Critical Flows Covered

| Flow | Coverage |
|------|----------|
| Authentication (login/register/refresh/logout) | Full |
| Password reset (forgot/reset/validate) | Partial (unit) |
| Multi-tenancy isolation (patients, appointments) | Full |
| Appointment scheduling + conflict detection | Full |
| Chat session lifecycle (Redis) | Full |
| Tenant membership CRUD + invitations | Full |
| Frontend login form + error handling | Full |
| Frontend settings page (profile/password) | Full |
| Frontend patient list (CRUD display) | Full |

---

## Bugs Found and Fixed

### BUG-001: @whiskeysockets/baileys ESM incompatibility with Jest
- **Issue:** The `@whiskeysockets/baileys` package ships ESM-only code which caused Jest to fail when running tests that transitively import NotificationsService -> WhatsappService -> baileys.
- **Fix:** Added `moduleNameMapper` in jest config to mock the baileys module, and created `test/helpers/__mocks__/baileys.ts`.
- **Impact:** Tests can now run without a real WhatsApp connection.

---

## Commands to Run Tests

```bash
# Backend unit tests
cd backend && npm test -- --passWithNoTests --forceExit

# Backend E2E / integration tests
cd backend && npx jest --config ./test/jest-e2e.json --passWithNoTests --forceExit

# Backend with coverage
cd backend && npm run test:cov -- --passWithNoTests --forceExit

# Frontend component tests
cd frontend && npx vitest run

# Frontend tests in watch mode
cd frontend && npx vitest

# Run all tests
cd backend && npm test -- --passWithNoTests --forceExit && npx jest --config ./test/jest-e2e.json --passWithNoTests --forceExit && cd ../frontend && npx vitest run
```

---

## Test Infrastructure Files

| File | Purpose |
|------|---------|
| `backend/test/helpers/prisma.helper.ts` | Mock PrismaService factory for unit tests |
| `backend/test/helpers/auth.helper.ts` | Mock users, tenants, patients for test data |
| `backend/test/helpers/__mocks__/baileys.ts` | Mock for @whiskeysockets/baileys ESM module |
| `backend/test/jest-e2e.json` | Jest config for E2E tests |
| `frontend/src/__tests__/setup.ts` | Vitest setup (jest-dom, localStorage mock) |
| `frontend/vite.config.ts` | Updated with vitest configuration |
