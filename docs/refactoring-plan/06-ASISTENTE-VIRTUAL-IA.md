# 06 - Asistente Virtual IA

## 1. Visión

Cada provider tiene un **asistente virtual con IA** que los pacientes pueden usar para:
- Consultar disponibilidad
- Agendar, reagendar o cancelar citas
- Hacer preguntas frecuentes (horarios, servicios, precios, ubicación)
- Solicitar información pre-cita

El asistente funciona por múltiples canales: **WhatsApp** (ya implementado), **Web Chat** (nuevo), y **SMS** (existente via Twilio).

---

## 2. Arquitectura

### 2.1 Actual (solo WhatsApp)

```
WhatsApp (Baileys) → Chatbot Service → OpenAI GPT → Response
```

### 2.2 Nueva (Multi-canal con RAG)

```
                    ┌─────────────┐
                    │   WhatsApp  │──┐
                    │  (Baileys)  │  │
                    └─────────────┘  │
                                     │
                    ┌─────────────┐  │    ┌──────────────────┐
                    │  Web Chat   │──┼───▶│  Message Router   │
                    │  (Socket.io)│  │    │                  │
                    └─────────────┘  │    └────────┬─────────┘
                                     │             │
                    ┌─────────────┐  │             ▼
                    │    SMS      │──┘    ┌──────────────────┐
                    │  (Twilio)   │       │  AI Agent Engine  │
                    └─────────────┘       │                  │
                                          │  ┌─────────────┐ │
                                          │  │ Intent      │ │
                                          │  │ Classifier  │ │
                                          │  └─────────────┘ │
                                          │  ┌─────────────┐ │
                                          │  │ RAG Engine  │ │
                                          │  │ (Provider   │ │
                                          │  │  Context)   │ │
                                          │  └─────────────┘ │
                                          │  ┌─────────────┐ │
                                          │  │ Action      │ │
                                          │  │ Executor    │ │
                                          │  └─────────────┘ │
                                          └────────┬─────────┘
                                                   │
                                    ┌──────────────┼──────────────┐
                                    │              │              │
                              ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
                              │ Schedule  │  │ Patient │  │ Provider  │
                              │ Service   │  │ Service │  │ Config    │
                              └───────────┘  └─────────┘  └───────────┘
```

### 2.3 RAG (Retrieval-Augmented Generation)

En lugar de que la IA invente respuestas, usa datos reales del provider:

**Contexto que se inyecta al LLM:**

```typescript
interface ProviderContext {
  // Información del provider
  providerName: string;
  specialty: string;
  bio: string;

  // Servicios disponibles
  services: { name: string; price: number; duration: number; description: string }[];

  // Horarios disponibles (próximos 7 días)
  availability: { date: string; slots: string[] }[];

  // Ubicaciones
  clinics: { name: string; address: string; phone: string }[];

  // FAQs configuradas
  faqs: { question: string; answer: string }[];

  // Políticas
  cancellationPolicy: string;
  paymentMethods: string[];

  // Información adicional
  instructions: string; // System prompt del provider
}
```

---

## 3. Intents del Chatbot

### 3.1 Intents de Scheduling

| Intent | Descripción | Acción |
|--------|-------------|--------|
| `CHECK_AVAILABILITY` | "¿Tienen disponibilidad para el martes?" | Consultar slots y responder |
| `SCHEDULE_APPOINTMENT` | "Quiero agendar una cita para limpieza" | Flujo de agendamiento |
| `RESCHEDULE_APPOINTMENT` | "Necesito cambiar mi cita" | Buscar cita y ofrecer alternativas |
| `CANCEL_APPOINTMENT` | "Quiero cancelar mi cita" | Confirmar y cancelar |
| `CONFIRM_APPOINTMENT` | "Sí, confirmo mi cita" | Marcar como confirmada |

### 3.2 Intents de Información

| Intent | Descripción | Acción |
|--------|-------------|--------|
| `ASK_SERVICES` | "¿Qué servicios ofrecen?" | Listar servicios con precios |
| `ASK_PRICES` | "¿Cuánto cuesta una corona?" | Buscar precio del servicio |
| `ASK_HOURS` | "¿Cuál es su horario?" | Mostrar horario de atención |
| `ASK_LOCATION` | "¿Dónde están ubicados?" | Mostrar dirección con mapa |
| `ASK_PREPARATION` | "¿Debo hacer algo antes de mi cita?" | Instrucciones pre-cita |

### 3.3 Intents de Gestión

| Intent | Descripción | Acción |
|--------|-------------|--------|
| `IDENTIFY_PATIENT` | Paciente se identifica con cédula/nombre | Buscar en DB |
| `HUMAN_HANDOFF` | "Quiero hablar con una persona" | Escalar a staff |
| `GREETING` | "Hola" / "Buenos días" | Mensaje de bienvenida |
| `THANKS` | "Gracias" | Despedida amable |
| `UNKNOWN` | Cualquier cosa no reconocida | Fallback message |

---

## 4. Flujo de Agendamiento via Chat

```
Paciente: "Hola, quiero agendar una cita"

Bot: "¡Hola! Soy el asistente virtual del Dr. García.
     Con gusto te ayudo a agendar una cita.
     ¿Cuál es tu nombre o número de cédula?"

Paciente: "María López, cédula 001-1234567-8"

Bot: "¡Hola María! Te encontré en nuestro sistema.
     ¿Qué tipo de servicio necesitas?
     1. Limpieza dental ($50)
     2. Consulta general ($30)
     3. Ortodoncia ($80)
     4. Otro"

Paciente: "Limpieza dental"

Bot: "Perfecto. Estos son los horarios disponibles para limpieza dental:
     📅 Lunes 10 Feb:
       - 9:00 AM (Clínica San Rafael)
       - 10:30 AM (Clínica San Rafael)
       - 3:00 PM (Consultorio Centro)
     📅 Martes 11 Feb:
       - 8:00 AM (Clínica San Rafael)
       - 11:00 AM (Clínica San Rafael)
     ¿Cuál prefieres?"

Paciente: "El lunes a las 9"

Bot: "¡Listo! Tu cita ha sido agendada:
     📋 Limpieza dental
     👨‍⚕️ Dr. García
     📅 Lunes 10 Feb a las 9:00 AM
     📍 Clínica San Rafael, Av. Principal #45
     💰 $50

     Recibirás un recordatorio 24 horas antes.
     ¿Necesitas algo más?"
```

---

## 5. Web Chat Widget (NUEVO)

### 5.1 Widget Embeddable

El provider puede poner un chat widget en su sitio web:

```html
<!-- Embed en sitio web del provider -->
<script src="https://medicloud.app/chat-widget.js"
        data-provider-id="uuid-del-provider"
        data-theme="blue">
</script>
```

### 5.2 Chat en el Portal del Paciente

El paciente logueado ve un botón de chat que conecta con los providers a los que está vinculado.

### 5.3 Implementación: Socket.io

```typescript
// Backend: Chat Gateway
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway {
  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string; message: string },
  ) {
    // 1. Identificar o crear sesión
    const session = await this.chatService.getOrCreateSession(
      data.tenantId,
      client.handshake.auth,
    );

    // 2. Procesar con IA
    const response = await this.aiAgentEngine.process(
      session,
      data.message,
    );

    // 3. Responder
    client.emit('response', {
      message: response.text,
      actions: response.actions, // Botones, quick replies
      metadata: response.metadata,
    });
  }
}
```

---

## 6. Configuración por Provider

Cada provider configura su asistente en `ChatbotConfig`:

```
Settings → Asistente Virtual
├── General
│   ├── Nombre del asistente
│   ├── Mensaje de bienvenida
│   ├── Mensaje cuando no entiende
│   └── Horario de atención del bot
├── Canales
│   ├── ☑ WhatsApp
│   ├── ☑ Web Chat
│   └── ☐ SMS
├── Capacidades
│   ├── ☑ Permitir agendamiento
│   ├── ☑ Permitir cancelación
│   ├── ☑ Permitir reagendamiento
│   └── ☑ Requerir identificación
├── FAQs personalizadas
│   ├── "¿Aceptan seguro?" → "Sí, aceptamos..."
│   └── "¿Tienen estacionamiento?" → "Sí, contamos con..."
├── Instrucciones especiales
│   └── "Siempre preguntar si el paciente es alérgico..."
└── Escalamiento
    ├── Palabras clave para escalar a humano
    └── Notificar a: staff@ejemplo.com
```

---

## 7. Métricas del Asistente

Dashboard de analytics del chatbot:

```
Asistente Virtual - Últimos 30 días
├── Conversaciones: 342
├── Citas agendadas via chat: 89 (26%)
├── Preguntas respondidas: 253
├── Escaladas a humano: 28 (8%)
├── Satisfacción promedio: 4.2/5
├── Tiempo promedio de respuesta: 1.3s
├── Top intents:
│   ├── CHECK_AVAILABILITY: 31%
│   ├── SCHEDULE_APPOINTMENT: 26%
│   ├── ASK_PRICES: 18%
│   ├── ASK_HOURS: 12%
│   └── Otros: 13%
└── Canal más usado: WhatsApp (68%)
```
