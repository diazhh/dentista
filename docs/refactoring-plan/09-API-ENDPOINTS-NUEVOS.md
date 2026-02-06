# 09 - API Endpoints Nuevos y Modificados

## 1. Endpoints que se RENOMBRAN (sin cambio de lógica)

| Actual | Nuevo | Motivo |
|--------|-------|--------|
| `/api/patients/:id/dentist-relations` | `/api/patients/:id/provider-relations` | Naming |
| `/api/dental-services` | `/api/medical-services` | Naming |
| `/api/operatories` | `/api/consultation-rooms` | Naming |
| `/api/operatory-assignments` | `/api/room-assignments` | Naming |

Todos los DTOs que tienen `dentistId` cambian a `providerId`.
Todos los DTOs que tienen `operatoryId` cambian a `roomId`.

---

## 2. Endpoints NUEVOS

### 2.1 Consentimiento del Paciente

```
POST   /api/consents                     # Provider solicita consentimiento
GET    /api/consents/pending             # Paciente ve solicitudes pendientes
GET    /api/consents/active              # Consentimientos activos
POST   /api/consents/:id/grant           # Paciente otorga consentimiento
POST   /api/consents/:id/deny            # Paciente deniega
POST   /api/consents/:id/revoke          # Paciente revoca
PUT    /api/consents/:id                 # Paciente modifica nivel de acceso
GET    /api/consents/history             # Historial de consentimientos
```

### 2.2 Documentos Compartidos

```
POST   /api/shared-documents             # Paciente comparte documento
DELETE /api/shared-documents/:id          # Paciente revoca share
PUT    /api/shared-documents/:id/renew    # Renovar acceso temporal
GET    /api/shared-documents/mine         # Provider: docs compartidos conmigo
GET    /api/shared-documents/shared       # Paciente: docs que he compartido
```

### 2.3 Exámenes Médicos del Paciente

```
POST   /api/medical-exams                 # Paciente sube examen
GET    /api/medical-exams                 # Listar exámenes del paciente
GET    /api/medical-exams/:id             # Ver examen
PUT    /api/medical-exams/:id             # Actualizar metadata
DELETE /api/medical-exams/:id             # Eliminar examen
POST   /api/medical-exams/:id/ai-summary  # Solicitar resumen IA (futuro)
```

### 2.4 Portal del Paciente

```
GET    /api/patient-portal/dashboard       # Dashboard unificado
GET    /api/patient-portal/providers       # Mis providers
GET    /api/patient-portal/appointments    # Citas de todos mis providers
POST   /api/patient-portal/appointments    # Agendar cita desde portal
GET    /api/patient-portal/documents       # Todos mis documentos
GET    /api/patient-portal/health-profile  # Mi perfil de salud
PUT    /api/patient-portal/health-profile  # Actualizar perfil de salud
GET    /api/patient-portal/notifications   # Notificaciones
```

### 2.5 Vinculación Paciente-Provider

```
POST   /api/patient-portal/link-provider           # Paciente solicita vinculación
POST   /api/patient-portal/accept-link/:relationId  # Paciente acepta link
POST   /api/patient-portal/reject-link/:relationId  # Paciente rechaza link
DELETE /api/patient-portal/providers/:providerId    # Paciente se desvincula
POST   /api/providers/link-patient                  # Provider solicita vinculación
GET    /api/providers/patient-requests              # Solicitudes pendientes
```

### 2.6 Módulos

```
GET    /api/modules/available              # Módulos disponibles
GET    /api/modules/active                 # Módulos activos del provider
POST   /api/modules/:key/activate          # Activar módulo
POST   /api/modules/:key/deactivate        # Desactivar módulo
PUT    /api/modules/:key/config            # Configurar módulo
```

### 2.7 Gestión de Clínica (CLINIC_ADMIN)

```
GET    /api/clinic-admin/dashboard         # Dashboard de clínica
GET    /api/clinic-admin/rooms             # Consultorios de la clínica
POST   /api/clinic-admin/rooms             # Crear consultorio
PUT    /api/clinic-admin/rooms/:id         # Editar consultorio
GET    /api/clinic-admin/rooms/:id/schedule # Ver calendario del consultorio
GET    /api/clinic-admin/occupancy         # Reporte de ocupación
GET    /api/clinic-admin/revenue           # Ingresos por alquiler

GET    /api/clinic-admin/staff             # Staff de la clínica
POST   /api/clinic-admin/staff             # Agregar staff
PUT    /api/clinic-admin/staff/:id         # Editar staff
DELETE /api/clinic-admin/staff/:id         # Remover staff

GET    /api/clinic-admin/rental-requests   # Solicitudes de alquiler
POST   /api/clinic-admin/rental-requests/:id/approve  # Aprobar
POST   /api/clinic-admin/rental-requests/:id/reject   # Rechazar
```

### 2.8 Alquiler de Consultorios

```
GET    /api/rentals/available-rooms        # Buscar consultorios disponibles
POST   /api/rentals/request               # Provider solicita alquiler
GET    /api/rentals/my-rentals            # Mis alquileres activos
PUT    /api/rentals/:id                   # Modificar alquiler
DELETE /api/rentals/:id                   # Cancelar alquiler
```

### 2.9 Directorio Público

```
GET    /api/public/providers               # Buscar providers
GET    /api/public/providers/:id           # Perfil público de provider
GET    /api/public/providers/:id/availability  # Disponibilidad
GET    /api/public/clinics                 # Buscar clínicas
GET    /api/public/clinics/:id             # Perfil público de clínica
GET    /api/public/specialties             # Lista de especialidades
```

### 2.10 Web Chat

```
WebSocket /chat                            # Namespace de Socket.io
  → event: 'message'                      # Enviar mensaje
  → event: 'response'                     # Recibir respuesta
  → event: 'typing'                       # Indicador de escritura
  → event: 'handoff'                      # Escalamiento a humano
  → event: 'session-end'                  # Fin de sesión
```

### 2.11 Módulo: Medicina General

```
POST   /api/modules/general/clinical-notes           # Crear nota clínica
GET    /api/modules/general/clinical-notes            # Listar notas
GET    /api/modules/general/clinical-notes/:id        # Ver nota
PUT    /api/modules/general/clinical-notes/:id        # Editar nota

POST   /api/modules/general/prescriptions             # Crear receta
GET    /api/modules/general/prescriptions              # Listar recetas
GET    /api/modules/general/prescriptions/:id          # Ver receta
GET    /api/modules/general/prescriptions/:id/pdf      # PDF de receta

POST   /api/modules/general/vitals                    # Registrar signos vitales
GET    /api/modules/general/vitals/:patientId         # Historial de vitales
```

### 2.12 Módulo: Psicología

```
POST   /api/modules/psychology/sessions                # Crear sesión terapéutica
GET    /api/modules/psychology/sessions                 # Listar sesiones
GET    /api/modules/psychology/sessions/:id             # Ver sesión
PUT    /api/modules/psychology/sessions/:id             # Editar sesión

POST   /api/modules/psychology/assessments             # Aplicar evaluación
GET    /api/modules/psychology/assessments              # Listar evaluaciones
GET    /api/modules/psychology/assessments/:id          # Ver resultado
GET    /api/modules/psychology/assessments/templates    # Plantillas disponibles

GET    /api/modules/psychology/progress/:patientId     # Progreso terapéutico
```

### 2.13 Módulo: Dental (ya existente, reorganizado)

```
# Se mueven bajo el prefijo de módulo:
/api/modules/dental/odontograms          # (antes: /api/odontograms)
/api/modules/dental/treatment-plans      # (antes: /api/treatment-plans)
/api/modules/dental/cdt-codes            # NUEVO: catálogo CDT
```

---

## 3. Endpoints que se MODIFICAN

### 3.1 POST /api/patients (Crear Paciente)

**Antes:**
```json
{
  "documentId": "001-1234567-8",
  "firstName": "María",
  "lastName": "López",
  "dateOfBirth": "1990-03-15",
  "gender": "FEMALE",
  "phone": "809-555-1234"
}
```

**Después:**
```json
{
  "documentType": "CEDULA",
  "documentId": "001-1234567-8",
  "firstName": "María",
  "lastName": "López",
  "dateOfBirth": "1990-03-15",
  "gender": "FEMALE",
  "phone": "809-555-1234",
  "email": "maria@email.com",
  "bloodType": "O+",
  "chronicConditions": ["Hipertensión"]
}
```

### 3.2 GET /api/patients/:id (Ver Paciente)

**Cambio:** La respuesta ahora respeta el nivel de consentimiento.

Si el provider tiene consentimiento FULL:
```json
{
  "id": "...",
  "firstName": "María",
  "medicalHistory": { "..." },
  "allergies": ["Penicilina"],
  "sharedDocuments": [ ... ]
}
```

Si el provider tiene consentimiento MINIMAL:
```json
{
  "id": "...",
  "firstName": "María",
  "phone": "809-555-1234",
  "medicalHistory": null,
  "allergies": null,
  "localData": {
    "providerNotes": "...",
    "localAllergies": ["Penicilina"],
    "localMedications": []
  }
}
```

### 3.3 POST /api/appointments (Crear Cita)

**Cambio:** Validar disponibilidad del consultorio compartido.

```json
{
  "patientId": "...",
  "providerId": "...",
  "roomId": "...",
  "serviceId": "...",
  "appointmentDate": "2026-02-11T09:00:00Z",
  "duration": 30,
  "notes": "..."
}
```

El backend ahora valida:
1. Provider tiene asignación en ese room a esa hora
2. Room no tiene otra cita a esa hora (con buffer)
3. Provider no tiene otra cita a esa hora
4. Room tiene las capabilities que requiere el servicio

### 3.4 GET /api/appointments/available-slots (Slots Disponibles)

**Antes:** Solo consideraba horario del provider.
**Después:** Considera intersección de provider + room + capabilities.

```
GET /api/appointments/available-slots?providerId=xxx&date=2026-02-11&serviceId=yyy

Response:
[
  {
    "time": "09:00",
    "roomId": "room-1",
    "roomName": "Consultorio A",
    "clinicName": "Clínica San Rafael",
    "clinicId": "clinic-1"
  },
  {
    "time": "10:30",
    "roomId": "room-1",
    "roomName": "Consultorio A",
    "clinicName": "Clínica San Rafael",
    "clinicId": "clinic-1"
  },
  {
    "time": "15:00",
    "roomId": "room-5",
    "roomName": "Consultorio 2",
    "clinicName": "Consultorio Centro",
    "clinicId": "clinic-2"
  }
]
```

---

## 4. Autenticación y Headers

### Headers nuevos

```
Authorization: Bearer <jwt-token>
X-Tenant-Id: <tenant-uuid>        # Para staff multi-tenant
X-Module-Context: dental           # Para endpoints de módulos
```

### JWT Claims actualizados

```json
{
  "sub": "user-uuid",
  "email": "user@email.com",
  "role": "PROVIDER",
  "tenantId": "tenant-uuid",
  "specialties": ["GENERAL_DENTISTRY"],
  "activeModules": ["dental", "general-medicine"],
  "iat": 1707235200,
  "exp": 1707236100
}
```
