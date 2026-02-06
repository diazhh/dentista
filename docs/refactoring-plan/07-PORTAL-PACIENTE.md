# 07 - Portal del Paciente

## 1. Visión

El paciente tiene un **dashboard unificado** donde ve TODO su mundo médico: todos sus providers, todas sus citas, todos sus documentos, en un solo lugar. No depende de ningún provider específico.

---

## 2. Features del Portal

### 2.1 Dashboard Principal

```
┌────────────────────────────────────────────────────┐
│  Hola, María 👋                                    │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Próxima cita │  │ Providers    │  │ Documentos│ │
│  │ Mar 11 Feb   │  │ 3 activos    │  │ 12 total  │ │
│  │ 9:00 AM      │  │              │  │           │ │
│  │ Dr. García   │  │              │  │           │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│                                                     │
│  📅 Próximas Citas                                  │
│  ├── Mar 11 Feb 9:00 - Dr. García (Limpieza)      │
│  ├── Jue 13 Feb 15:00 - Lic. Pérez (Sesión)       │
│  └── Lun 17 Feb 10:00 - Dr. López (Control)       │
│                                                     │
│  🔔 Notificaciones                                  │
│  ├── Dr. García solicita acceso a tu historia       │
│  └── Recordatorio: cita mañana con Lic. Pérez      │
│                                                     │
│  📊 Mis Exámenes Recientes                          │
│  ├── Hemograma completo - 5 Feb 2026               │
│  └── Radiografía dental - 20 Ene 2026              │
└────────────────────────────────────────────────────┘
```

### 2.2 Mis Providers

```
Mis Profesionales de Salud
├── Dr. Carlos García - Odontólogo
│   ├── Clínica San Rafael
│   ├── Vinculado desde: Ene 2025
│   ├── Acceso compartido: Citas + Historia clínica
│   ├── [Modificar acceso] [Desvincular]
│   └── [Chat con asistente]
│
├── Lic. Ana Pérez - Psicóloga
│   ├── Consultorio Centro
│   ├── Vinculada desde: Mar 2025
│   ├── Acceso compartido: Solo citas
│   ├── [Modificar acceso] [Desvincular]
│   └── [Chat con asistente]
│
├── Dr. Roberto López - Cardiólogo
│   ├── Centro Médico Nacional
│   ├── Vinculado desde: Dic 2025
│   ├── Acceso compartido: Citas + Documentos compartidos
│   ├── [Modificar acceso] [Desvincular]
│   └── [Chat con asistente]
│
└── [+ Buscar provider en directorio]
```

### 2.3 Mis Citas

Calendario unificado con citas de TODOS sus providers:

```
Febrero 2026
├── Color por provider:
│   🟦 Dr. García  🟩 Lic. Pérez  🟥 Dr. López
│
│  Lu   Ma   Mi   Ju   Vi
│  10   11   12   13   14
│       🟦         🟩
│       9:00       15:00
│
│  17   18   19   20   21
│  🟥
│  10:00

Acciones:
├── [Agendar nueva cita] → Seleccionar provider → Ver disponibilidad
├── [Reagendar] → Seleccionar cita → Ver alternativas
└── [Cancelar] → Seleccionar cita → Confirmar
```

### 2.4 Mis Documentos y Exámenes

```
Mis Exámenes Médicos
├── Subidos por mí:
│   ├── 📄 Hemograma completo - 5 Feb 2026
│   │   ├── Compartido con: Dr. García, Dr. López
│   │   ├── [Ver] [Compartir] [Dejar de compartir]
│   │   └── 🤖 Resumen IA: "Valores dentro de rangos normales..."
│   │
│   ├── 📄 Radiografía torácica - 20 Ene 2026
│   │   ├── Compartido con: Dr. López (expira 20 Feb)
│   │   └── [Ver] [Compartir] [Renovar acceso]
│   │
│   └── [+ Subir nuevo examen]
│
├── Documentos de mis providers:
│   ├── 📄 Plan de tratamiento dental - Dr. García
│   ├── 📄 Receta médica - Dr. López
│   └── 📄 Informe psicológico - Lic. Pérez (restringido)
│
└── [Solicitar documento a provider]
```

### 2.5 Mi Perfil de Salud

```
Mi Perfil Médico
├── Datos Personales
│   ├── Nombre: María López
│   ├── Cédula: 001-1234567-8
│   ├── Fecha de nacimiento: 15/03/1990
│   ├── Tipo de sangre: O+
│   └── [Editar]
│
├── Alergias
│   ├── Penicilina
│   ├── Mariscos
│   └── [Agregar] [Editar]
│
├── Medicamentos actuales
│   ├── Losartán 50mg - 1 vez al día
│   └── [Agregar] [Editar]
│
├── Condiciones crónicas
│   ├── Hipertensión
│   └── [Agregar] [Editar]
│
├── Contacto de emergencia
│   ├── Juan López (esposo) - 809-555-1234
│   └── [Editar]
│
└── Privacidad y Consentimiento
    ├── Acceso por defecto: Mínimo
    ├── Consentimientos activos: 3
    ├── Solicitudes pendientes: 1
    └── [Gestionar consentimientos]
```

### 2.6 Gestión de Consentimientos

```
Mis Consentimientos
├── Activos:
│   ├── Dr. García - Citas + Historia clínica
│   │   ├── Otorgado: 15 Ene 2025
│   │   ├── Sin expiración
│   │   └── [Modificar nivel] [Revocar]
│   │
│   ├── Lic. Pérez - Solo citas
│   │   ├── Otorgado: 1 Mar 2025
│   │   ├── Sin expiración
│   │   └── [Modificar nivel] [Revocar]
│   │
│   └── Dr. López - Citas + Documentos compartidos
│       ├── Otorgado: 20 Dic 2025
│       ├── Expira: 20 Jun 2026
│       └── [Modificar nivel] [Renovar] [Revocar]
│
├── Pendientes:
│   └── Dr. Fernández solicita acceso a: Historia clínica
│       ├── Solicitado: 5 Feb 2026
│       ├── Motivo: "Referido por Dr. García para evaluación"
│       └── [Aceptar] [Aceptar parcial] [Rechazar]
│
└── Historial:
    ├── 20 Dic 2025 - Otorgado a Dr. López
    ├── 1 Mar 2025 - Otorgado a Lic. Pérez
    └── 15 Ene 2025 - Otorgado a Dr. García
```

---

## 3. Flujos del Paciente

### 3.1 Registro de Paciente

```
1. Paciente visita medicloud.app/register
2. Selecciona "Soy paciente"
3. Llena formulario: nombre, email, cédula, teléfono
4. Verifica email
5. Completa perfil: fecha de nacimiento, género, alergias, etc.
6. Sistema busca si ya existe un Patient con esa cédula
   a) Si existe → vincular cuenta a perfil existente
   b) Si no → crear nuevo Patient
7. Portal listo para usar
```

### 3.2 Vincularse a un Provider

```
1. Paciente busca provider en directorio
   - Por nombre, especialidad, ubicación
2. Ve perfil público del provider
   - Especialidad, servicios, precios, horarios, ubicaciones, reseñas
3. Click "Vincularme"
4. Selecciona nivel de acceso a compartir
5. Provider recibe notificación
6. Si el provider ya lo tiene como paciente (por cédula):
   a) Se vinculan automáticamente
   b) Se le notifica al provider
7. Si no → provider acepta → relación MUTUAL
```

### 3.3 Subir Examen Médico

```
1. Paciente va a "Mis Exámenes" → "Subir nuevo"
2. Selecciona archivo (PDF, imagen, DICOM)
3. Llena metadata:
   - Tipo de examen (hemograma, radiografía, etc.)
   - Fecha del examen
   - Laboratorio/centro de imágenes
   - Notas
4. (Futuro) IA procesa el documento:
   - Extrae valores clave
   - Genera resumen
   - Identifica valores fuera de rango
5. Paciente decide si compartir con algún provider
```

### 3.4 Agendar Cita desde Portal

```
1. Paciente va a "Mis Citas" → "Agendar nueva"
2. Selecciona provider (de sus providers vinculados)
3. Selecciona servicio
4. Ve calendario de disponibilidad
5. Selecciona slot
6. Confirma
7. Recibe confirmación por email/SMS/WhatsApp
```

---

## 4. Tecnología

### 4.1 Frontend

- React con componentes existentes
- Nuevo layout: `PatientLayout.tsx` (ya existe, se extiende)
- Dashboard con tabs:
  - Resumen
  - Citas (calendario unificado)
  - Providers
  - Exámenes/Documentos
  - Consentimientos
  - Perfil de salud
  - Facturación

### 4.2 Backend

- Nuevos endpoints bajo `/api/patient-portal/`
- Middleware que valida que el usuario es PATIENT y tiene patientId
- Queries que cruzan TODOS los tenants donde el paciente tiene relación

### 4.3 Seguridad

- El paciente SOLO ve datos que le pertenecen
- Nunca ve datos de otros pacientes
- Los documentos del provider tienen control de acceso por consentimiento
- Toda acción se registra en audit_logs
