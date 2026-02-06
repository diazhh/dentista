# 05 - Consultorios Compartidos y Scheduling

## 1. Modelo Conceptual

```
CLÍNICA
├── Consultorio A (piso 1) → Dental chair, X-ray
│   ├── Lunes 8-12: Dr. García (dentista)
│   ├── Lunes 14-18: Dra. Martínez (dentista)
│   ├── Martes 8-18: Dr. García
│   └── Miércoles 8-12: [DISPONIBLE para alquiler]
│
├── Consultorio B (piso 1) → Exam table, ECG
│   ├── Lunes-Viernes 8-12: Dr. López (cardiólogo)
│   └── Lunes-Viernes 14-18: Dra. Rodríguez (medicina general)
│
├── Consultorio C (piso 2) → Therapy room
│   ├── Lunes, Miércoles 8-18: Lic. Pérez (psicólogo)
│   └── Martes, Jueves 8-18: Lic. Sánchez (psicólogo)
│
└── Sala de conferencias → Projector, whiteboard
    └── Reservable por horas
```

---

## 2. Entidades

### 2.1 Clinic (Clínica)
- Es el edificio/local físico
- Tiene un admin (CLINIC_ADMIN)
- Tiene sus propios staff (ClinicStaff)
- Ofrece consultorios para uso o alquiler
- Puede pertenecer al Super Admin o ser reclamada por un admin de clínica

### 2.2 ConsultationRoom (Consultorio)
- Pertenece a una clínica
- Tiene capacidades/equipamiento (tags)
- Tiene horario configurable de disponibilidad
- Puede ser compartido entre múltiples providers
- Tiene tiempo buffer entre citas

### 2.3 RoomAssignment (Asignación)
- Vincula un provider con un consultorio
- Define el horario recurrente (qué días/horas)
- Puede ser permanente, temporal, o por alquiler
- Tiene fecha de inicio y (opcionalmente) fin

---

## 3. Algoritmo de Disponibilidad

### 3.1 Slot disponible = Provider disponible AND Consultorio disponible

```
Para determinar si un slot está disponible para una cita:

1. Obtener shifts del provider en ese día:
   - RoomAssignment.schedule[dayOfWeek] → [{start, end}]

2. Obtener citas existentes del provider ese día:
   - Appointment WHERE providerId AND date

3. Obtener citas existentes del consultorio ese día:
   - Appointment WHERE roomId AND date

4. Calcular slots libres:
   slot_libre = shift_del_provider
                MINUS citas_del_provider
                MINUS citas_del_consultorio
                MINUS buffer_time_del_consultorio

5. Verificar capacidades del consultorio:
   - Si el servicio requiere 'DENTAL_CHAIR', el consultorio debe tenerlo
```

### 3.2 Pseudocódigo

```typescript
async function getAvailableSlots(
  providerId: string,
  date: Date,
  serviceId: string, // Para conocer duración y requerimientos
  clinicId?: string,  // Opcional: filtrar por clínica específica
): Promise<AvailableSlot[]> {

  const service = await getService(serviceId);
  const requiredCapabilities = service.requiredCapabilities;
  const duration = service.duration;

  // 1. Obtener todas las asignaciones de consultorio del provider para ese día
  const dayOfWeek = date.getDay(); // 0=domingo, 1=lunes, etc.
  const assignments = await getRoomAssignments(providerId, date);

  const availableSlots: AvailableSlot[] = [];

  for (const assignment of assignments) {
    const room = assignment.room;

    // 2. Verificar capacidades del consultorio
    if (!hasRequiredCapabilities(room, requiredCapabilities)) continue;
    if (clinicId && room.clinicId !== clinicId) continue;

    // 3. Obtener horario del provider en este consultorio hoy
    const shifts = assignment.schedule[dayOfWeek]; // [{start: "08:00", end: "12:00"}]
    if (!shifts || shifts.length === 0) continue;

    // 4. Obtener citas existentes del provider hoy
    const providerAppointments = await getAppointments(providerId, date);

    // 5. Obtener citas existentes del consultorio hoy
    const roomAppointments = await getRoomAppointments(room.id, date);

    // 6. Calcular slots libres
    for (const shift of shifts) {
      const slots = calculateFreeSlots(
        shift,
        providerAppointments,
        roomAppointments,
        duration,
        room.bufferMinutes,
      );
      availableSlots.push(...slots.map(s => ({
        ...s,
        roomId: room.id,
        roomName: room.name,
        clinicName: room.clinic.name,
        clinicId: room.clinicId,
      })));
    }
  }

  return availableSlots;
}
```

### 3.3 Prevención de Conflictos

```typescript
// Antes de crear una cita, verificar:
async function validateAppointmentSlot(
  providerId: string,
  roomId: string,
  startTime: Date,
  endTime: Date,
): Promise<{ valid: boolean; conflict?: string }> {

  // 1. Conflicto de provider
  const providerConflict = await prisma.appointment.findFirst({
    where: {
      providerId,
      status: 'SCHEDULED',
      appointmentDate: { gte: startTime, lt: endTime },
    },
  });
  if (providerConflict) {
    return { valid: false, conflict: 'Provider ya tiene cita en ese horario' };
  }

  // 2. Conflicto de consultorio (con buffer)
  const room = await prisma.consultationRoom.findUnique({ where: { id: roomId } });
  const bufferedStart = subMinutes(startTime, room.bufferMinutes);
  const bufferedEnd = addMinutes(endTime, room.bufferMinutes);

  const roomConflict = await prisma.appointment.findFirst({
    where: {
      operatoryId: roomId,
      status: 'SCHEDULED',
      appointmentDate: { gte: bufferedStart, lt: bufferedEnd },
    },
  });
  if (roomConflict) {
    return { valid: false, conflict: 'Consultorio ocupado en ese horario' };
  }

  // 3. Verificar que el provider tiene asignación en ese consultorio en ese horario
  const hasAssignment = await verifyAssignment(providerId, roomId, startTime);
  if (!hasAssignment) {
    return { valid: false, conflict: 'Provider no tiene asignación en ese consultorio' };
  }

  return { valid: true };
}
```

---

## 4. Vistas de Calendario

### 4.1 Vista por Provider (la que ya existe)
- Muestra todas las citas del provider en todos sus consultorios
- Color-coded por consultorio/clínica
- El provider y su staff ven esta vista

### 4.2 Vista por Consultorio (NUEVA)
- Muestra todas las citas en un consultorio específico
- Muestra qué provider está en cada slot
- Útil para el admin de clínica

### 4.3 Vista por Clínica (NUEVA)
- Vista general de todos los consultorios de una clínica
- Columns = consultorios, Rows = tiempo
- Muestra ocupación y disponibilidad
- Útil para el CLINIC_ADMIN

```
Clínica San Rafael - Lunes 10 Feb
═══════════════════════════════════════════
        Consult. A      Consult. B      Consult. C
8:00    Dr. García      Dr. López       Lic. Pérez
        (Limpieza)      (Control)       (Sesión)
8:30    Dr. García      Dr. López       Lic. Pérez
        (Extracción)    (ECG)           (Sesión)
9:00    Dr. García      [LIBRE]         Lic. Pérez
        (Corona)                        (Evaluación)
...
```

### 4.4 Sincronización con Calendarios Externos

El sistema de Calendar Sync existente se extiende:

```
Provider activa Google Calendar sync
→ Sus citas en MediCloud se sincronizan a Google Calendar
→ Eventos externos de Google Calendar bloquean slots en MediCloud
→ Bidireccional: crear cita en Google → aparece en MediCloud
```

Esto es crítico para providers que atienden en múltiples clínicas y necesitan que su agenda personal refleje TODOS sus compromisos.

---

## 5. Alquiler de Consultorios

### 5.1 Flujo

```
1. Clinic Admin marca consultorio como "compartido" y define tarifas
2. Provider busca consultorios disponibles en el directorio
3. Provider solicita alquiler → selecciona horarios
4. Clinic Admin aprueba → se crea RoomAssignment tipo RENTAL
5. Se genera factura de alquiler (mensual/por uso)
```

### 5.2 Tipos de Alquiler

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **Mensual fijo** | Horarios fijos recurrentes | "Lunes y Miércoles 8-12, $500/mes" |
| **Por hora** | Reservar horas específicas | "$50/hora, reservar ad-hoc" |
| **Por día** | Día completo | "$200/día" |

### 5.3 Panel del Clinic Admin

```
Dashboard de Clínica:
├── Ocupación general: 73% (esta semana)
├── Ingresos por alquiler: $3,200 (este mes)
├── Consultorios:
│   ├── A: 90% ocupado (Dr. García, Dra. Martínez)
│   ├── B: 75% ocupado (Dr. López, Dra. Rodríguez)
│   ├── C: 60% ocupado (Lic. Pérez, Lic. Sánchez)
│   └── Sala conf: 20% ocupado
├── Solicitudes pendientes: 2
└── Mantenimiento programado: 1
```

---

## 6. Impacto en la Base de Datos

### Cambios en Appointment

```prisma
model Appointment {
  id              String            @id @default(uuid())
  patientId       String            @map("patient_id")
  providerId      String            @map("provider_id")  // RENOMBRADO de dentistId
  tenantId        String            @map("tenant_id")
  roomId          String?           @map("room_id")      // RENOMBRADO de operatoryId
  recurringId     String?           @map("recurring_id")

  // NUEVO: referencia al servicio
  serviceId       String?           @map("service_id")

  appointmentDate DateTime          @map("appointment_date")
  duration        Int
  status          AppointmentStatus @default(SCHEDULED)
  procedureType   String            @map("procedure_type") // Se mantiene por compatibilidad
  notes           String?

  reminderSent Boolean @default(false)
  confirmedVia String?

  // NUEVO: metadata de ubicación
  clinicId     String?           @map("clinic_id")  // Denormalized for easy querying
  clinicName   String?           @map("clinic_name") // Denormalized

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  patient   Patient              @relation(fields: [patientId], references: [id])
  tenant    Tenant               @relation(fields: [tenantId], references: [id])
  room      ConsultationRoom?    @relation(fields: [roomId], references: [id])
  recurring RecurringAppointment? @relation(fields: [recurringId], references: [id])

  @@index([patientId])
  @@index([providerId])
  @@index([tenantId])
  @@index([roomId])
  @@index([clinicId])
  @@index([appointmentDate])
  @@map("appointments")
}
```
