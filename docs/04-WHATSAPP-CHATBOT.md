# WhatsApp Chatbot - Feature Crítico ⭐

**Integración con Baileys + OpenAI GPT-4**

---

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Setup del Dentista](#setup-del-dentista)
4. [Funcionalidades del Bot](#funcionalidades-del-bot)
5. [Flujos de Conversación](#flujos-de-conversación)
6. [Implementación Técnica](#implementación-técnica)
7. [Roadmap](#roadmap)

---

## Visión General

### ¿Por qué es crítico?

WhatsApp es el canal de comunicación #1 en LATAM. El chatbot permite:
- ✅ Agendar citas 24/7 sin intervención humana
- ✅ Responder preguntas frecuentes automáticamente
- ✅ Enviar recordatorios automáticos
- ✅ Enviar facturas y recetas por WhatsApp
- ✅ Reducir carga de trabajo del staff

### Diferenciador clave

La mayoría de sistemas dentales NO tienen integración con WhatsApp chatbot. Este es un **diferenciador competitivo importante**.

---

## Arquitectura

### Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                     PACIENTE                                 │
│                                                              │
│  Escribe al WhatsApp del dentista:                          │
│  "Hola, quiero agendar una cita"                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                WHATSAPP (Baileys)                            │
│                                                              │
│  - Número del dentista: +52-xxx-xxx-xxxx                    │
│  - Conectado via Baileys (escaneo QR)                       │
│  - Recibe mensaje                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            DENTICLOUD BACKEND (NestJS)                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  WhatsApp Service                                    │   │
│  │  - Recibe webhook de mensaje                        │   │
│  │  - Identifica dentista por número                   │   │
│  │  - Crea/continúa ChatSession                        │   │
│  └─────────────────┬───────────────────────────────────┘   │
│                    │                                         │
│                    ▼                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Chatbot Service (OpenAI GPT-4)                     │   │
│  │  - Analiza mensaje con IA                           │   │
│  │  - Extrae intent (agendar, consultar, etc.)        │   │
│  │  - Extrae entities (fecha, hora, tipo de cita)     │   │
│  │  - Genera respuesta personalizada                   │   │
│  └─────────────────┬───────────────────────────────────┘   │
│                    │                                         │
│                    ▼                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Action Handlers                                     │   │
│  │  - AgendarCitaHandler                               │   │
│  │  - ConsultarDisponibilidadHandler                   │   │
│  │  - EnviarFacturaHandler                             │   │
│  │  - CancelarCitaHandler                              │   │
│  │  - FAQHandler                                       │   │
│  └─────────────────┬───────────────────────────────────┘   │
│                    │                                         │
│                    ▼                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Database                                            │   │
│  │  - Crea appointment                                  │   │
│  │  - Guarda chat history                              │   │
│  │  - Actualiza patient info                           │   │
│  └─────────────────┬───────────────────────────────────┘   │
│                    │                                         │
└────────────────────┼─────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                WHATSAPP (Respuesta)                          │
│                                                              │
│  "Perfecto! Encontré disponibilidad el Viernes 3 de Enero   │
│  a las 10:00 AM. ¿Confirmo tu cita?"                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup del Dentista

### Paso 1: Configuración en DentiCloud

```
1. Dentista hace login
2. Va a Configuración → WhatsApp
3. Click en "Conectar WhatsApp"
4. Sistema genera QR code (Baileys)
5. Dentista escanea QR con su WhatsApp
6. Sistema valida conexión
7. ✅ WhatsApp conectado!
```

### Paso 2: Configuración del Bot

```
Dentista configura:
├─ Horarios de atención del bot
│  └─ Ej: Lun-Vie 8am-8pm (fuera de horario: mensaje automático)
│
├─ Mensaje de bienvenida
│  └─ "Hola! Soy el asistente virtual del Dr. Pérez. ¿En qué puedo ayudarte?"
│
├─ Información de servicios (para el prompt del bot)
│  ├─ Tipos de citas disponibles
│  ├─ Precios (opcional)
│  ├─ Ubicación del consultorio
│  └─ Políticas de cancelación
│
└─ Features habilitados
   ├─ [✓] Agendar citas
   ├─ [✓] Consultar disponibilidad
   ├─ [✓] Responder FAQs
   ├─ [✓] Enviar recordatorios
   └─ [✓] Enviar facturas/recetas
```

### UI de Setup

```
┌─────────────────────────────────────────────────────────┐
│  CONFIGURACIÓN WHATSAPP                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Status: [🟢 Conectado] +52-555-1234-567                │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │            [QR CODE aparece aquí]                │  │
│  │                                                   │  │
│  │   Escanea con tu WhatsApp para conectar         │  │
│  │                                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [Desconectar]  [Regenerar QR]                          │
│                                                          │
│  ───────────────────────────────────────────────────────│
│                                                          │
│  CONFIGURACIÓN DEL BOT                                   │
│                                                          │
│  Mensaje de bienvenida:                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Hola! Soy el asistente del Dr. Pérez.           │  │
│  │ ¿En qué puedo ayudarte?                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Horario del bot:                                       │
│  Lun-Vie: [8:00 AM] - [8:00 PM]                        │
│  Sábado:  [9:00 AM] - [2:00 PM]                        │
│  Domingo: [Deshabilitado]                               │
│                                                          │
│  Features habilitados:                                   │
│  [✓] Agendar citas automáticamente                     │
│  [✓] Consultar disponibilidad                           │
│  [✓] Responder preguntas frecuentes                    │
│  [✓] Enviar recordatorios de citas                     │
│  [✓] Enviar facturas por WhatsApp                      │
│                                                          │
│  [Guardar Cambios]                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Funcionalidades del Bot

### 1. Agendar Cita 📅

**Conversación:**
```
Paciente: "Hola, quiero agendar una cita"

Bot: "Perfecto! ¿Qué tipo de cita necesitas?
     - Limpieza dental
     - Revisión general
     - Emergencia
     - Otro (dime cuál)"

Paciente: "Limpieza"

Bot: "Genial! Déjame ver disponibilidad...
     Tengo estos horarios disponibles:

     🗓️ Jueves 2 Enero
     ├─ 10:00 AM
     ├─ 2:00 PM
     └─ 4:00 PM

     🗓️ Viernes 3 Enero
     ├─ 9:00 AM
     ├─ 11:00 AM
     └─ 3:00 PM

     ¿Cuál prefieres?"

Paciente: "Viernes 3 a las 9am"

Bot: "Perfecto! Necesito confirmar tus datos:

     Nombre completo: [esperando...]"

Paciente: "Juan Pérez"

Bot: "Excelente! Tu cita está confirmada:

     👤 Paciente: Juan Pérez
     📅 Fecha: Viernes 3 de Enero, 2025
     ⏰ Hora: 9:00 AM
     🏥 Consultorio: Clínica ABC, Consultorio 1
     📍 Dirección: Av. Reforma 123

     Te enviaré un recordatorio 24 horas antes.

     ¿Necesitas algo más?"
```

**Backend Logic:**
```typescript
async function handleAgendarCita(session: ChatSession) {
  // 1. Extraer información con GPT-4
  const intent = await extractIntent(session.messages);

  // 2. Consultar disponibilidad
  const availableSlots = await getAvailableSlots({
    dentistId: session.dentist_id,
    appointmentType: intent.appointmentType,
    startDate: intent.preferredDate || new Date(),
    days: 7
  });

  // 3. Presentar opciones
  await sendMessage({
    to: session.patient_phone,
    message: formatAvailableSlots(availableSlots)
  });

  // 4. Esperar selección
  session.context = {
    state: 'waiting_for_time_selection',
    availableSlots
  };

  // ... continúa el flujo
}
```

### 2. Consultar Disponibilidad 🔍

```
Paciente: "¿Tienen disponibilidad esta semana?"

Bot: "Sí! Esta semana tenemos:

     Hoy (Lunes): LLENO
     Martes: 2:00 PM, 4:00 PM
     Miércoles: 10:00 AM, 11:30 AM, 3:00 PM
     Jueves: 9:00 AM, 1:00 PM
     Viernes: 10:00 AM, 2:00 PM

     ¿Quieres agendar alguna?"
```

### 3. FAQs ❓

```
Paciente: "¿Cuánto cuesta una limpieza?"

Bot: "El costo de una limpieza dental es de $800 MXN.

     Incluye:
     ✓ Limpieza profunda
     ✓ Pulido dental
     ✓ Aplicación de flúor
     ✓ Revisión general

     ¿Te gustaría agendar una cita?"
```

**Configuración de FAQs:**
- Dentista agrega preguntas frecuentes en configuración
- Bot usa esas respuestas con GPT-4 para contexto
- Si no sabe responder, escala a humano

### 4. Cancelar/Reprogramar Cita 🔄

```
Paciente: "Necesito cancelar mi cita"

Bot: "Déjame buscar tu cita...

     Encontré:
     📅 Viernes 3 Enero, 9:00 AM - Limpieza

     ¿Es esta la que quieres cancelar?"

Paciente: "Sí"

Bot: "¿Quieres:
     1. Cancelar definitivamente
     2. Reprogramar para otra fecha"

Paciente: "Reprogramar"

Bot: "Perfecto! ¿Qué fecha te viene mejor?"
```

### 5. Recordatorios Automáticos ⏰

```
[24 horas antes de la cita]

Bot: "Hola Juan! 👋

     Te recuerdo tu cita de mañana:

     📅 Viernes 3 Enero
     ⏰ 9:00 AM
     🏥 Clínica ABC, Consultorio 1

     ¿Confirmas tu asistencia?
     1. Sí, ahí estaré
     2. Necesito reprogramar"
```

**Configuración:**
- Dentista configura cuándo enviar recordatorios (24h, 2h, etc.)
- Recordatorios se envían automáticamente vía BullMQ

### 6. Enviar Factura/Receta 💊

```
[Después de la cita]

Bot: "Hola Juan!

     Aquí está tu factura de la cita de hoy:

     📄 [Factura-001.pdf]

     Total: $800 MXN

     Puedes pagar en:
     🔗 [Link de pago Stripe]

     Y aquí está tu receta:

     💊 [Receta-001.pdf]

     Cualquier duda, escríbeme!"
```

**Backend:**
```typescript
async function sendInvoiceViaWhatsApp(
  invoiceId: string,
  patientPhone: string
) {
  // 1. Generate PDF
  const pdfUrl = await generateInvoicePDF(invoiceId);

  // 2. Get payment link
  const paymentLink = await createStripePaymentLink(invoiceId);

  // 3. Send via WhatsApp
  await whatsappService.sendDocument({
    to: patientPhone,
    documentUrl: pdfUrl,
    caption: `Aquí está tu factura. Total: $${invoice.total}\n\nPagar: ${paymentLink}`
  });
}
```

### 7. Handoff a Humano 🙋

```
Bot: "Entiendo que necesitas hablar con el doctor sobre un caso específico.

     Voy a conectarte con nuestro equipo. Un momento por favor..."

[Sistema notifica al staff]

Staff: "Hola Juan, soy Ana, asistente del Dr. Pérez. ¿En qué puedo ayudarte?"
```

**Triggers para handoff:**
- Paciente dice "hablar con el doctor", "emergencia"
- Bot no entiende después de 2 intentos
- Paciente lo solicita explícitamente
- Horario fuera de atención del bot

---

## Flujos de Conversación

### State Machine

```typescript
enum ConversationState {
  INITIAL = 'initial',
  AWAITING_APPOINTMENT_TYPE = 'awaiting_appointment_type',
  AWAITING_DATE_SELECTION = 'awaiting_date_selection',
  AWAITING_TIME_SELECTION = 'awaiting_time_selection',
  AWAITING_PATIENT_NAME = 'awaiting_patient_name',
  AWAITING_CONFIRMATION = 'awaiting_confirmation',
  COMPLETED = 'completed',
  HANDED_OFF = 'handed_off'
}

interface ChatContext {
  state: ConversationState;
  intent?: string; // 'agendar_cita' | 'consultar' | 'faq' | ...
  appointmentType?: string;
  selectedDate?: Date;
  selectedTime?: string;
  patientName?: string;
  patientId?: string;
  availableSlots?: TimeSlot[];
}
```

### Flujo Completo de Agendamiento

```
┌──────────────────────────────────────────────────┐
│  PACIENTE ENVÍA MENSAJE                           │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│  GPT-4 ANALIZA MENSAJE                            │
│  - Detecta intent: "agendar_cita"                │
│  - Extrae entities: { tipo: "limpieza" }        │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│  CONSULTAR DISPONIBILIDAD                         │
│  - Query appointments WHERE dentist_id           │
│  - Find available slots                          │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│  PRESENTAR OPCIONES                               │
│  - Format slots as message                       │
│  - Send via WhatsApp                             │
│  - Update context.state = awaiting_time_sel...  │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│  PACIENTE SELECCIONA HORARIO                      │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│  SOLICITAR DATOS DEL PACIENTE                     │
│  - Si existe: confirmar                          │
│  - Si no: solicitar nombre, teléfono            │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│  CREAR APPOINTMENT                                │
│  - Create appointment in DB                      │
│  - Schedule reminder jobs                        │
│  - Send confirmation                             │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│  CONFIRMACIÓN ENVIADA ✅                         │
└──────────────────────────────────────────────────┘
```

---

## Implementación Técnica

### 1. Baileys Setup

```typescript
// whatsapp-connection.service.ts
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';

@Injectable()
export class WhatsAppConnectionService {
  private connections = new Map<string, WASocket>(); // dentistId -> socket

  async connectDentist(dentistId: string) {
    // 1. Load session from DB (if exists)
    const connection = await prisma.whatsAppConnection.findUnique({
      where: { dentist_id: dentistId }
    });

    // 2. Setup auth state
    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${dentistId}`);

    // 3. Create socket
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false, // We'll handle QR ourselves
    });

    // 4. Handle QR
    sock.ev.on('connection.update', async (update) => {
      const { connection: connStatus, qr } = update;

      if (qr) {
        // Save QR to DB for frontend to display
        await prisma.whatsAppConnection.update({
          where: { dentist_id: dentistId },
          data: {
            qr_code: qr,
            qr_generated_at: new Date(),
            connection_status: 'connecting'
          }
        });
      }

      if (connStatus === 'open') {
        // Connected!
        await prisma.whatsAppConnection.update({
          where: { dentist_id: dentistId },
          data: {
            connection_status: 'connected',
            connected_at: new Date(),
            qr_code: null
          }
        });
      }
    });

    // 5. Handle messages
    sock.ev.on('messages.upsert', async (m) => {
      const message = m.messages[0];
      if (!message.message) return;

      await this.handleIncomingMessage(dentistId, message);
    });

    // 6. Save credentials
    sock.ev.on('creds.update', saveCreds);

    // 7. Store connection
    this.connections.set(dentistId, sock);

    return sock;
  }

  async handleIncomingMessage(dentistId: string, message: any) {
    const from = message.key.remoteJid; // Patient phone
    const text = message.message.conversation || message.message.extendedTextMessage?.text;

    // Process with chatbot service
    await this.chatbotService.processMessage({
      dentistId,
      patientPhone: from,
      messageText: text,
      messageId: message.key.id
    });
  }

  async sendMessage(dentistId: string, to: string, text: string) {
    const sock = this.connections.get(dentistId);
    if (!sock) throw new Error('WhatsApp not connected');

    await sock.sendMessage(to, { text });
  }
}
```

### 2. Chatbot con GPT-4

```typescript
// chatbot.service.ts
@Injectable()
export class ChatbotService {
  constructor(
    private openai: OpenAIService,
    private whatsapp: WhatsAppConnectionService
  ) {}

  async processMessage(params: {
    dentistId: string;
    patientPhone: string;
    messageText: string;
  }) {
    const { dentistId, patientPhone, messageText } = params;

    // 1. Get or create chat session
    let session = await prisma.chatSession.findFirst({
      where: {
        dentist_id: dentistId,
        patient_phone: patientPhone,
        status: 'active'
      }
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          dentist_id: dentistId,
          patient_phone: patientPhone,
          whatsapp_connection_id: /* ... */,
          tenant_id: dentistId,
          messages: [],
          context: { state: 'initial' }
        }
      });
    }

    // 2. Add message to history
    const messages = [
      ...session.messages,
      { role: 'user', content: messageText, timestamp: new Date() }
    ];

    // 3. Get system prompt with dentist info
    const systemPrompt = await this.buildSystemPrompt(dentistId);

    // 4. Call GPT-4
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      functions: [
        {
          name: 'agendar_cita',
          description: 'Agenda una cita para el paciente',
          parameters: {
            type: 'object',
            properties: {
              appointmentType: { type: 'string' },
              preferredDate: { type: 'string', format: 'date' },
              preferredTime: { type: 'string' }
            }
          }
        },
        {
          name: 'consultar_disponibilidad',
          description: 'Consulta horarios disponibles',
          parameters: {
            type: 'object',
            properties: {
              startDate: { type: 'string', format: 'date' },
              endDate: { type: 'string', format: 'date' }
            }
          }
        }
        // ... más funciones
      ],
      function_call: 'auto'
    });

    // 5. Handle function calls
    const functionCall = completion.choices[0].message.function_call;

    if (functionCall) {
      const result = await this.executeFunctionCall(functionCall, dentistId, session);

      // Add assistant message
      messages.push({
        role: 'assistant',
        content: completion.choices[0].message.content || '',
        function_call: functionCall,
        timestamp: new Date()
      });

      // Add function result
      messages.push({
        role: 'function',
        name: functionCall.name,
        content: JSON.stringify(result),
        timestamp: new Date()
      });

      // Call GPT again with function result
      const finalCompletion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      });

      const response = finalCompletion.choices[0].message.content;

      // 6. Send response
      await this.whatsapp.sendMessage(dentistId, patientPhone, response);

      // 7. Update session
      messages.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });
    } else {
      // No function call, just send response
      const response = completion.choices[0].message.content;
      await this.whatsapp.sendMessage(dentistId, patientPhone, response);

      messages.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });
    }

    // 8. Save updated session
    await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        messages,
        last_message_at: new Date()
      }
    });
  }

  private async buildSystemPrompt(dentistId: string): Promise<string> {
    const dentist = await prisma.user.findUnique({
      where: { id: dentistId },
      include: {
        tenant: {
          include: {
            subscription_plan: true
          }
        }
      }
    });

    const connection = await prisma.whatsAppConnection.findUnique({
      where: { dentist_id: dentistId }
    });

    return `Eres un asistente virtual del Dr. ${dentist.name}.

Tu objetivo es ayudar a los pacientes a:
- Agendar citas
- Consultar disponibilidad
- Responder preguntas frecuentes
- Brindar información del consultorio

Información del consultorio:
- Nombre: ${dentist.business_name || dentist.name}
- Especialización: ${dentist.specialization}
- Ubicación: ${dentist.business_address}

Horarios de atención del bot:
${connection.business_hours}

IMPORTANTE:
- Sé amable y profesional
- Usa emojis moderadamente 😊
- Habla en español
- Si no sabes algo, ofrece conectar con el equipo humano
- Confirma siempre los detalles de las citas antes de crearlas

Cuando el paciente quiera agendar una cita:
1. Pregunta el tipo de cita
2. Consulta disponibilidad
3. Presenta opciones
4. Confirma datos del paciente
5. Crea la cita
6. Envía confirmación con todos los detalles
`;
  }

  private async executeFunctionCall(
    functionCall: any,
    dentistId: string,
    session: ChatSession
  ) {
    const args = JSON.parse(functionCall.arguments);

    switch (functionCall.name) {
      case 'agendar_cita':
        return await this.handleAgendarCita(dentistId, args, session);

      case 'consultar_disponibilidad':
        return await this.handleConsultarDisponibilidad(dentistId, args);

      // ... más handlers

      default:
        throw new Error(`Unknown function: ${functionCall.name}`);
    }
  }

  private async handleAgendarCita(dentistId: string, args: any, session: ChatSession) {
    // Implementation...
    const availableSlots = await this.getAvailableSlots(dentistId, args);

    if (availableSlots.length === 0) {
      return { success: false, message: 'No hay disponibilidad en las fechas solicitadas' };
    }

    return {
      success: true,
      availableSlots: availableSlots.map(slot => ({
        date: slot.start_time.toISOString(),
        formattedDate: formatDate(slot.start_time, 'es'),
        formattedTime: formatTime(slot.start_time, 'es')
      }))
    };
  }
}
```

### 3. Recordatorios Automáticos

```typescript
// appointment-reminders.processor.ts
@Processor('appointment-reminders')
export class AppointmentRemindersProcessor {
  @Process('send-reminder')
  async handleSendReminder(job: Job) {
    const { appointmentId } = job.data;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        dentist: true
      }
    });

    // Send via WhatsApp
    await this.whatsappService.sendMessage(
      appointment.dentist_id,
      appointment.patient.phone,
      this.buildReminderMessage(appointment)
    );

    // Mark as sent
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { reminder_sent: true }
    });
  }

  private buildReminderMessage(appointment: Appointment): string {
    return `Hola ${appointment.patient.first_name}! 👋

Te recuerdo tu cita de mañana:

📅 ${formatDate(appointment.start_time, 'es')}
⏰ ${formatTime(appointment.start_time, 'es')}
🏥 ${appointment.operatory.name}

¿Confirmas tu asistencia?
1. Sí, ahí estaré
2. Necesito reprogramar`;
  }
}

// Cuando se crea appointment, schedule reminder
await appointmentRemindersQueue.add(
  'send-reminder',
  { appointmentId: appointment.id },
  {
    delay: calculateDelayUntil(appointment.start_time, -24, 'hours')
  }
);
```

---

## Roadmap

### MVP (Fase 1 o Fase 2 temprano)

✅ **Features mínimos:**
- Conexión WhatsApp (Baileys + QR)
- Respuestas básicas con GPT-4
- Agendar citas simple
- Consultar disponibilidad
- Recordatorios automáticos (24h antes)

⏱️ **Timeline:** 3-4 semanas

### Fase 2

✅ **Features avanzados:**
- FAQs personalizadas por dentista
- Cancelar/reprogramar citas
- Handoff a humano
- Analytics de conversaciones
- Enviar documentos (facturas)

⏱️ **Timeline:** 2-3 semanas

### Fase 3

✅ **Features premium:**
- Multi-idioma
- Envío de recetas
- Pagos vía WhatsApp (link Stripe)
- Seguimiento post-cita
- Encuestas de satisfacción

⏱️ **Timeline:** 2-3 semanas

---

**Versión:** 3.0
**Última actualización:** 30 de Diciembre, 2025

**NOTA:** Este es un diferenciador clave del producto. Priorizar en MVP o Fase 2.
