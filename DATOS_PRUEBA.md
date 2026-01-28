# 📊 Datos de Prueba - DentiCloud

Este documento contiene todos los datos de ejemplo creados en el sistema para facilitar las pruebas.

---

## 🔐 Credenciales de Usuarios

### Super Administrador
- **Email:** `admin@dentista.com`
- **Password:** `Admin123!`
- **Rol:** SUPER_ADMIN
- **Acceso:** Panel SuperAdmin completo

### Dentistas

#### Dentista 1 - Dr. John Smith
- **Email:** `dentist@dentista.com`
- **Password:** `Dentist123!`
- **Rol:** DENTIST
- **Tenant:** Dr. Smith Dental Practice
- **Plan:** PROFESSIONAL (ACTIVE)
- **Licencia:** DDS-12345
- **Especialización:** General Dentistry

#### Dentista 2 - Dr. Maria Garcia
- **Email:** `dentist2@dentista.com`
- **Password:** `Dentist456!`
- **Rol:** DENTIST
- **Tenant:** Dr. Garcia Orthodontics
- **Plan:** STARTER (TRIAL - 14 días)
- **Licencia:** DDS-67890
- **Especialización:** Orthodontics

#### Dentista 3 - Dr. Robert Chen
- **Email:** `dentist3@dentista.com`
- **Password:** `Dentist789!`
- **Rol:** DENTIST
- **Tenant:** Smile Care Dental Center
- **Plan:** ENTERPRISE (ACTIVE)
- **Licencia:** DDS-11111
- **Especialización:** Cosmetic Dentistry

### Personal (Staff)

#### Recepcionista 1 - Sarah Johnson
- **Email:** `staff@dentista.com`
- **Password:** `Staff123!`
- **Rol:** STAFF_RECEPTIONIST
- **Tenant:** Dr. Smith Dental Practice

#### Recepcionista 2 - Michael Brown
- **Email:** `staff2@dentista.com`
- **Password:** `Staff456!`
- **Rol:** STAFF_RECEPTIONIST
- **Tenant:** Smile Care Dental Center

#### Asistente - Lisa Martinez
- **Email:** `assistant@dentista.com`
- **Password:** `Assistant123!`
- **Rol:** STAFF_ASSISTANT
- **Tenant:** Smile Care Dental Center

### Pacientes

#### Paciente 1 - Jane Doe
- **Email:** `patient@dentista.com`
- **Password:** `Patient123!`
- **Rol:** PATIENT
- **Documento:** 001-1234567-8
- **Fecha Nacimiento:** 15/05/1990
- **Género:** Femenino
- **Alergias:** Penicillin
- **Medicamentos:** Aspirin

#### Paciente 2 - John Smith
- **Email:** `patient2@dentista.com`
- **Password:** `Patient456!`
- **Rol:** PATIENT
- **Documento:** 002-9876543-2
- **Fecha Nacimiento:** 20/08/1985
- **Género:** Masculino
- **Cirugías:** Appendectomy 2010

---

## 🏢 Tenants (Clínicas)

### 1. Dr. Smith Dental Practice
- **Subdomain:** `drsmith`
- **Owner:** Dr. John Smith
- **Plan:** PROFESSIONAL
- **Estado:** ACTIVE
- **Trial:** 30 días desde hoy
- **Límites:**
  - Pacientes: 500
  - Usuarios: 10
  - Storage: 20GB
- **Features:** odontograms, treatment_plans, invoicing, whatsapp, advanced_reports, multi_clinic
- **Usuarios:**
  - Dr. John Smith (DENTIST)
  - Sarah Johnson (STAFF_RECEPTIONIST)

### 2. Dr. Garcia Orthodontics
- **Subdomain:** `drgarcia`
- **Owner:** Dr. Maria Garcia
- **Plan:** STARTER
- **Estado:** TRIAL (14 días)
- **Límites:**
  - Pacientes: 100
  - Usuarios: 3
  - Storage: 5GB
- **Features:** odontograms, treatment_plans, invoicing
- **Usuarios:**
  - Dr. Maria Garcia (DENTIST)

### 3. Smile Care Dental Center
- **Subdomain:** `smilecare`
- **Owner:** Super Admin
- **Plan:** ENTERPRISE
- **Estado:** ACTIVE
- **Límites:**
  - Pacientes: Ilimitado
  - Usuarios: Ilimitado
  - Storage: 100GB
- **Features:** Todas (odontograms, treatment_plans, invoicing, whatsapp, advanced_reports, api_access, priority_support, multi_clinic, custom_branding)
- **Usuarios:**
  - Dr. Robert Chen (DENTIST)
  - Michael Brown (STAFF_RECEPTIONIST)
  - Lisa Martinez (STAFF_ASSISTANT)

### 4. Bright Smile Clinic
- **Subdomain:** `brightsmile`
- **Owner:** Super Admin
- **Plan:** STARTER
- **Estado:** CANCELLED (expirado hace 5 días)
- **Límites:**
  - Pacientes: 100
  - Usuarios: 3
  - Storage: 5GB

### 5. Dental Plus Associates
- **Subdomain:** `dentalplus`
- **Owner:** Super Admin
- **Plan:** PROFESSIONAL
- **Estado:** TRIAL (7 días restantes)
- **Límites:**
  - Pacientes: 500
  - Usuarios: 10
  - Storage: 20GB

---

## 💳 Planes de Suscripción

### Starter - $29.99/mes
- **Código:** STARTER
- **Pacientes:** 100
- **Usuarios:** 3
- **Storage:** 5GB
- **Features:** odontograms, treatment_plans, invoicing
- **Estado:** Activo y Público

### Professional - $79.99/mes
- **Código:** PROFESSIONAL
- **Pacientes:** 500
- **Usuarios:** 10
- **Storage:** 20GB
- **Features:** odontograms, treatment_plans, invoicing, whatsapp, advanced_reports, multi_clinic
- **Estado:** Activo y Público

### Enterprise - $199.99/mes
- **Código:** ENTERPRISE
- **Pacientes:** Ilimitado
- **Usuarios:** Ilimitado
- **Storage:** 100GB
- **Features:** Todas las features disponibles
- **Estado:** Activo y Público

### Test Plan (Inactive) - $9.99/mes
- **Código:** TEST_PLAN
- **Estado:** Inactivo (para testing)

---

## 📧 Plantillas de Email

### 1. Bienvenida a DentiCloud
- **Tipo:** WELCOME
- **Variables:** tenantName, ownerName, trialEndDate
- **Estado:** Activa
- **Uso:** Email de bienvenida para nuevos tenants

### 2. Trial Expirando
- **Tipo:** TRIAL_EXPIRING
- **Variables:** tenantName, ownerName, daysRemaining, trialEndDate, upgradeUrl
- **Estado:** Activa
- **Uso:** Notificación cuando el trial está por expirar

### 3. Restablecer Contraseña
- **Tipo:** PASSWORD_RESET
- **Variables:** userName, resetUrl, expirationTime
- **Estado:** Activa
- **Uso:** Email para restablecer contraseña

### 4. Pago Exitoso
- **Tipo:** PAYMENT_SUCCESS
- **Variables:** tenantName, ownerName, amount, currency, planName, paymentDate, nextPaymentDate, invoiceUrl
- **Estado:** Activa
- **Uso:** Confirmación de pago recibido

---

## 📨 Configuración SMTP

- **Host:** smtp.mailtrap.io
- **Puerto:** 587
- **Usuario:** your-mailtrap-user (actualizar con credenciales reales)
- **Seguridad:** No SSL/TLS
- **From Email:** noreply@denticloud.com
- **From Name:** DentiCloud
- **Reply To:** soporte@denticloud.com
- **Estado:** Activa (no verificada)

**Nota:** Esta es una configuración de ejemplo. Para enviar emails reales, actualiza con credenciales válidas de SMTP.

---

## 🏥 Clínicas y Operatorios

### Downtown Dental Clinic
- **Dirección:** 123 Main Street, New York, NY 10001, USA
- **Teléfono:** +1234567893
- **Email:** info@downtowndental.com

#### Operatory 1
- **Nombre:** Operatory 1
- **Descripción:** Main treatment room with digital X-ray
- **Equipamiento:**
  - Silla: Adec 500
  - Rayos X: Digital Panoramic
  - Luz: LED Operatory Light
- **Asignado a:** Dr. John Smith
- **Horario:**
  - Lunes a Jueves: 09:00 - 17:00
  - Viernes: 09:00 - 15:00

---

## 🔗 URLs de Acceso

### Frontend (Puerto 5173)
- **Login:** `http://localhost:5173/login`
- **SuperAdmin Dashboard:** `http://localhost:5173/superadmin`
- **Tenants:** `http://localhost:5173/superadmin/tenants`
- **Usuarios:** `http://localhost:5173/superadmin/users`
- **Planes:** `http://localhost:5173/superadmin/plans`
- **Email Config:** `http://localhost:5173/superadmin/email/config`
- **Email Templates:** `http://localhost:5173/superadmin/email/templates`
- **Email Logs:** `http://localhost:5173/superadmin/email/logs`
- **Analytics:** `http://localhost:5173/superadmin/analytics`
- **Audit Logs:** `http://localhost:5173/superadmin/audit-logs`

### Backend (Puerto 3000)
- **API Base:** `http://localhost:3000/api`
- **Health Check:** `http://localhost:3000/api/health`

---

## 🧪 Scripts de Prueba

### Probar todos los endpoints de Email
```bash
cd /home/diazhh/dev/dentista
./test-email.sh
```

### Probar endpoints de Planes
```bash
cd /home/diazhh/dev/dentista
./test-plans.sh
```

### Resetear base de datos y ejecutar seeds
```bash
cd /home/diazhh/dev/dentista/backend
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```

---

## 📝 Notas Importantes

1. **Todos los passwords** siguen el patrón: `[Rol]123!` (ej: Admin123!, Dentist123!)
2. **Los tenants 3, 4 y 5** tienen al SuperAdmin como owner para facilitar pruebas
3. **El tenant 4** está en estado CANCELLED para probar esa funcionalidad
4. **El tenant 5** tiene solo 7 días de trial restantes
5. **La configuración SMTP** es de ejemplo y debe actualizarse con credenciales reales para enviar emails
6. **Las plantillas de email** usan variables dinámicas con formato `{{variable}}`

---

## 🎯 Casos de Uso para Probar

### Como SuperAdmin
1. Login con `admin@dentista.com`
2. Ver dashboard con métricas de todos los tenants
3. Gestionar tenants (crear, editar, suspender, reactivar)
4. Ver detalles de cada tenant con tabs (Info, Usuarios, Suscripción)
5. Gestionar usuarios globales
6. Configurar planes de suscripción
7. Configurar SMTP y plantillas de email
8. Ver logs de auditoría
9. Ver analytics del sistema

### Como Dentista
1. Login con `dentist@dentista.com`
2. Acceder al dashboard del tenant
3. Gestionar pacientes
4. Crear citas
5. Ver calendario
6. Gestionar planes de tratamiento
7. Crear facturas
8. Ver odontogramas

### Como Staff
1. Login con `staff@dentista.com`
2. Gestionar citas
3. Registrar pacientes
4. Ver calendario
5. Acceso limitado según permisos

### Como Paciente
1. Login con `patient@dentista.com`
2. Ver sus propias citas
3. Ver su historial médico
4. Acceso al portal de paciente

---

**Última actualización:** 2026-01-05
**Versión de seeds:** 1.0
