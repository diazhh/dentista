# 03 - Sistema de Consentimiento y Data Sharing

## 1. Principio Fundamental

> El paciente es dueño de su data. El provider puede tener datos locales sobre un paciente, pero la data global del paciente solo se comparte con consentimiento explícito.

---

## 2. Escenarios de Relación Provider-Paciente

### Escenario 1: Provider registra paciente que NO está en el sistema

```
1. Dr. García necesita registrar a "María López" como paciente
2. María NO tiene cuenta en MediCloud
3. Dr. García crea un registro de paciente con datos mínimos:
   - Nombre, cédula, teléfono, fecha de nacimiento
4. Se crea ProviderPatientRelation con tipo = REGISTERED_BY_PROVIDER
5. Los datos clínicos se almacenan en localMedicalHistory
6. María NO tiene acceso a estos datos (no tiene cuenta)
```

**Resultado:** El provider tiene sus propios datos del paciente. No hay consentimiento porque no hay cuenta.

### Escenario 2: Paciente crea cuenta y se vincula a provider

```
1. María crea cuenta en MediCloud
2. El sistema detecta que existe un Patient con su cédula
3. María "reclama" su perfil y se vincula a su userId
4. María ve que Dr. García la tiene como paciente
5. María puede:
   a) Aceptar la relación → MUTUAL (comparte datos según su preferencia)
   b) Ignorar → PROVIDER_ONLY (Dr. García mantiene datos locales)
   c) Rechazar → Dr. García mantiene datos locales pero sin acceso a data compartida
```

### Escenario 3: Paciente busca provider y se vincula

```
1. María ya tiene cuenta en MediCloud
2. María busca al Dr. Rodríguez en el directorio
3. María solicita vincularse → LINKED_BY_PATIENT
4. Dr. Rodríguez acepta → Relación se vuelve MUTUAL
5. María configura qué datos comparte con Dr. Rodríguez
```

### Escenario 4: Paciente comparte exámenes temporalmente

```
1. María tiene un examen de sangre subido en su perfil
2. Dr. Rodríguez necesita verlo para una consulta
3. María comparte el documento con Dr. Rodríguez por 30 días
4. Se crea SharedDocument con expiresAt = now + 30 días
5. Después de 30 días, Dr. Rodríguez ya no tiene acceso
```

### Escenario 5: Provider quiere datos pero paciente no consiente

```
1. Dr. García tiene a Juan como paciente
2. Juan tiene cuenta pero NO quiere compartir su historia clínica
3. Dr. García puede:
   - Mantener sus notas LOCALES (localMedicalHistory)
   - Ver solo datos mínimos (nombre, contacto)
   - NO puede ver la historia global de Juan
4. Todo queda registrado en audit_logs
```

---

## 3. Modelo de Consentimiento

### 3.1 Niveles de Acceso

```
FULL              → Todo: historia, documentos, citas, facturación
CLINICAL_ONLY     → Solo datos clínicos y notas del provider
SCHEDULING_ONLY   → Solo calendario y citas
DOCUMENTS_SHARED  → Solo documentos explícitamente compartidos
MINIMAL           → Solo nombre y teléfono (default)
```

### 3.2 Categorías Granulares

Un paciente puede configurar por cada provider:

| Categoría | Default | Descripción |
|-----------|---------|-------------|
| Citas | Compartido | El provider siempre ve las citas que tiene con este paciente |
| Historia clínica | No compartido | Datos médicos globales del paciente |
| Documentos/Exámenes | No compartido | Exámenes y documentos subidos por el paciente |
| Resultados de lab | No compartido | Resultados de laboratorio |
| Facturación | Compartido | Facturas y pagos (siempre visibles para provider que factura) |

### 3.3 Flujo de Consentimiento

```
┌──────────┐     Solicita acceso     ┌──────────┐
│ PROVIDER │─────────────────────────▶│ PATIENT  │
│          │                          │          │
│          │◀─────────────────────────│          │
│          │  Otorga/Deniega/Revoca   │          │
└──────────┘                          └──────────┘
     │                                      │
     │  Audit Log                           │  Audit Log
     ▼                                      ▼
┌────────────────────────────────────────────────┐
│              CONSENT REGISTRY                   │
│  - Quién solicitó                               │
│  - Qué se solicitó                              │
│  - Cuándo se otorgó/denegó                      │
│  - Cuándo expira                                │
│  - Estado actual                                │
└────────────────────────────────────────────────┘
```

---

## 4. Datos Locales vs. Datos Compartidos

### 4.1 Datos Locales del Provider

El provider SIEMPRE puede mantener sus propias notas sobre un paciente, independientemente del consentimiento:

```
ProviderPatientRelation {
  localMedicalHistory: Json   // Historia que el provider registra por su cuenta
  localAllergies: String[]    // Alergias reportadas en consulta
  localMedications: String[]  // Medicamentos que el paciente menciona
  providerNotes: String       // Notas privadas del provider
}
```

Estos datos son **propiedad del provider** y el paciente NO los ve.

### 4.2 Datos Globales del Paciente

Los datos en el modelo `Patient` son propiedad del paciente:

```
Patient {
  medicalHistory: Json        // Historia global
  allergies: String[]         // Lista maestra de alergias
  medications: String[]       // Medicamentos actuales
  chronicConditions: String[] // Condiciones crónicas
}
```

Estos datos solo se comparten si el paciente otorga consentimiento.

### 4.3 Cómo se resuelve la data en la API

```typescript
// Cuando un provider consulta datos de un paciente:
async getPatientData(providerId: string, patientId: string) {
  const relation = await getRelation(providerId, patientId);
  const consent = await getActiveConsent(providerId, patientId);

  const patientData = {
    // SIEMPRE visible
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    phone: patient.phone,

    // Datos locales del provider (SIEMPRE visible para ese provider)
    localNotes: relation.providerNotes,
    localHistory: relation.localMedicalHistory,
    localAllergies: relation.localAllergies,
    localMedications: relation.localMedications,

    // Datos globales del paciente (SOLO si hay consentimiento)
    medicalHistory: consent?.shareMedicalHistory ? patient.medicalHistory : null,
    allergies: consent?.shareMedicalHistory ? patient.allergies : relation.localAllergies,
    medications: consent?.shareMedicalHistory ? patient.medications : relation.localMedications,
    documents: consent?.shareDocuments ? await getSharedDocuments(patientId, providerId) : [],
    labResults: consent?.shareLabResults ? await getLabResults(patientId) : [],
  };

  return patientData;
}
```

---

## 5. API de Consentimiento

### Endpoints

```
POST   /api/consents/request          # Provider solicita consentimiento
GET    /api/consents/pending          # Paciente ve solicitudes pendientes
POST   /api/consents/:id/grant        # Paciente otorga
POST   /api/consents/:id/deny         # Paciente deniega
POST   /api/consents/:id/revoke       # Paciente revoca (fue otorgado)
GET    /api/consents/active           # Consentimientos activos del paciente
PUT    /api/consents/:id              # Paciente modifica nivel de acceso

POST   /api/documents/:id/share       # Paciente comparte documento con provider
POST   /api/documents/:id/unshare     # Paciente revoca acceso a documento
GET    /api/documents/shared-with-me   # Provider ve documentos compartidos con él
```

---

## 6. Notificaciones de Consentimiento

| Evento | Notificación a Provider | Notificación a Paciente |
|--------|------------------------|------------------------|
| Provider solicita consentimiento | - | "Dr. X solicita acceso a tu historia" |
| Paciente otorga | "María otorgó acceso a su historia" | Confirmación |
| Paciente deniega | "María denegó la solicitud" | Confirmación |
| Paciente revoca | "María revocó el acceso" | Confirmación |
| Consentimiento por expirar | - | "Tu consentimiento con Dr. X expira en 7 días" |
| Consentimiento expirado | "El acceso a datos de María expiró" | "Tu consentimiento con Dr. X ha expirado" |

---

## 7. Auditoría

Todo acceso a datos del paciente se registra:

```json
{
  "action": "VIEW",
  "entity": "PatientMedicalHistory",
  "entityId": "patient-uuid",
  "userId": "provider-uuid",
  "metadata": {
    "consentId": "consent-uuid",
    "dataAccessed": ["medicalHistory", "allergies"],
    "accessLevel": "CLINICAL_ONLY"
  }
}
```
