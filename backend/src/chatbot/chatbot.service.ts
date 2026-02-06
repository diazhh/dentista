import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AIAgentEngine } from './ai-agent.engine';
import OpenAI from 'openai';

interface ConversationContext {
  tenantId?: string;
  patientId?: string;
  patientName?: string;
  lastIntent?: string;
  awaitingInput?: string;
}

// Store conversation contexts in memory (in production, use Redis)
const conversationContexts = new Map<string, ConversationContext>();

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private openai: OpenAI | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private aiAgentEngine: AIAgentEngine,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI initialized');
    } else {
      this.logger.warn('OPENAI_API_KEY not configured - Chatbot will use fallback responses');
    }
  }

  /**
   * Process an incoming WhatsApp message and generate a response
   */
  async processMessage(phoneNumber: string, message: string, tenantId?: string): Promise<string> {
    const context = conversationContexts.get(phoneNumber) || {};

    // Update context with tenant if provided
    if (tenantId) {
      context.tenantId = tenantId;
    }

    // Try to identify the patient by phone number
    if (!context.patientId) {
      const patient = await this.findPatientByPhone(phoneNumber);
      if (patient) {
        context.patientId = patient.id;
        context.patientName = `${patient.firstName} ${patient.lastName}`;
      }
    }

    // Try AI engine first
    if (context.tenantId) {
      try {
        const result = await this.aiAgentEngine.process(
          phoneNumber, // sessionId
          context.tenantId,
          message,
          context.patientId,
        );
        if (result?.text) {
          // Update context from AI result
          if (result.metadata?.patientId) {
            context.patientId = result.metadata.patientId;
            context.patientName = result.metadata.patientName;
          }
          conversationContexts.set(phoneNumber, context);
          return result.text;
        }
      } catch (error) {
        this.logger.warn(`AI engine failed, falling back to keyword matching: ${error.message}`);
      }
    }

    // Fall through to existing keyword matching...
    const normalizedMessage = message.toLowerCase().trim();
    let response: string;

    // Handle awaiting input states
    if (context.awaitingInput) {
      response = await this.handleAwaitingInput(phoneNumber, normalizedMessage, context);
    }
    // Check for common intents
    else if (this.matchesIntent(normalizedMessage, ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hello'])) {
      response = await this.handleGreeting(context);
    } else if (this.matchesIntent(normalizedMessage, ['cita', 'agendar', 'reservar', 'turno', 'appointment'])) {
      response = await this.handleAppointmentQuery(phoneNumber, normalizedMessage, context);
    } else if (this.matchesIntent(normalizedMessage, ['cancelar', 'reprogramar', 'cambiar cita'])) {
      response = await this.handleCancelOrReschedule(phoneNumber, normalizedMessage, context);
    } else if (this.matchesIntent(normalizedMessage, ['horario', 'hora', 'disponibilidad', 'cuando'])) {
      response = await this.handleScheduleQuery(context);
    } else if (this.matchesIntent(normalizedMessage, ['precio', 'costo', 'cuanto', 'tarifa'])) {
      response = await this.handlePricingQuery(normalizedMessage, context);
    } else if (this.matchesIntent(normalizedMessage, ['ubicación', 'dirección', 'donde', 'llegar'])) {
      response = await this.handleLocationQuery(context);
    } else if (this.matchesIntent(normalizedMessage, ['ayuda', 'help', 'opciones', 'menu'])) {
      response = this.getHelpMenu();
    } else {
      // Use AI for complex queries
      response = await this.handleWithAI(message, context);
    }

    // Save context
    conversationContexts.set(phoneNumber, context);

    return response;
  }

  private matchesIntent(message: string, keywords: string[]): boolean {
    return keywords.some((keyword) => message.includes(keyword));
  }

  private async findPatientByPhone(phoneNumber: string) {
    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);

    return this.prisma.patient.findFirst({
      where: {
        OR: [
          { phone: { contains: cleanPhone } },
          { user: { phone: { contains: cleanPhone } } },
        ],
      },
      include: {
        user: true,
        providerPatientRelations: {
          where: { isActive: true },
          include: { tenant: true },
        },
      },
    });
  }

  private async handleGreeting(context: ConversationContext): Promise<string> {
    const greeting = context.patientName
      ? `¡Hola ${context.patientName}! 👋`
      : '¡Hola! 👋 Bienvenido a MediCloud.';

    return `${greeting}

¿En qué puedo ayudarte hoy?

1️⃣ Agendar una cita
2️⃣ Ver mis próximas citas
3️⃣ Cancelar o reprogramar
4️⃣ Consultar horarios
5️⃣ Preguntas sobre servicios

Escribe el número de la opción o describe tu consulta.`;
  }

  private async handleAppointmentQuery(
    phoneNumber: string,
    message: string,
    context: ConversationContext,
  ): Promise<string> {
    if (!context.patientId) {
      context.awaitingInput = 'patient_identification';
      return `Para agendar una cita, necesito identificarte primero.

Por favor, envíame tu número de cédula o documento de identidad.`;
    }

    // Check for upcoming appointments
    const upcomingAppointments = await this.prisma.appointment.findMany({
      where: {
        patientId: context.patientId,
        appointmentDate: { gte: new Date() },
        status: 'SCHEDULED',
      },
      orderBy: { appointmentDate: 'asc' },
      take: 3,
    });

    if (upcomingAppointments.length > 0) {
      const appointmentsList = upcomingAppointments
        .map((apt) => {
          const date = apt.appointmentDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          const time = apt.appointmentDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          });
          return `📅 ${date} a las ${time}\n   Tipo: ${apt.procedureType || 'Consulta general'}`;
        })
        .join('\n\n');

      return `Tienes las siguientes citas programadas:

${appointmentsList}

¿Deseas agendar una cita adicional? Responde "sí" para continuar.`;
    }

    context.awaitingInput = 'appointment_type';
    return `¡Perfecto! Vamos a agendar tu cita.

¿Qué tipo de consulta necesitas?

1️⃣ Consulta general
2️⃣ Revisión de seguimiento
3️⃣ Consulta especializada
4️⃣ Procedimiento
5️⃣ Otro servicio

Escribe el número o describe tu necesidad.`;
  }

  private async handleCancelOrReschedule(
    phoneNumber: string,
    message: string,
    context: ConversationContext,
  ): Promise<string> {
    if (!context.patientId) {
      context.awaitingInput = 'patient_identification';
      return `Para cancelar o reprogramar una cita, necesito identificarte primero.

Por favor, envíame tu número de cédula o documento de identidad.`;
    }

    const upcomingAppointments = await this.prisma.appointment.findMany({
      where: {
        patientId: context.patientId,
        appointmentDate: { gte: new Date() },
        status: 'SCHEDULED',
      },
      orderBy: { appointmentDate: 'asc' },
      take: 5,
    });

    if (upcomingAppointments.length === 0) {
      return `No tienes citas programadas actualmente.

¿Te gustaría agendar una nueva cita? Escribe "agendar cita" para comenzar.`;
    }

    const appointmentsList = upcomingAppointments
      .map((apt, index) => {
        const date = apt.appointmentDate.toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        const time = apt.appointmentDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return `${index + 1}️⃣ ${date} - ${time} (${apt.procedureType || 'Consulta'})`;
      })
      .join('\n');

    context.awaitingInput = 'select_appointment_to_modify';
    return `Estas son tus próximas citas:

${appointmentsList}

Escribe el número de la cita que deseas modificar.`;
  }

  private async handleScheduleQuery(context: ConversationContext): Promise<string> {
    // Get practice schedule - this would typically come from the database
    return `📅 *Horarios de Atención*

Lunes a Viernes: 8:00 AM - 6:00 PM
Sábados: 9:00 AM - 2:00 PM
Domingos: Cerrado

Los horarios pueden variar según el profesional y tipo de servicio.

¿Deseas agendar una cita? Escribe "agendar cita" para ver disponibilidad.`;
  }

  private async handlePricingQuery(message: string, context: ConversationContext): Promise<string> {
    // General pricing info
    return `💰 *Información de Precios*

Los precios de nuestros servicios pueden variar según el caso específico.

Para una cotización personalizada, te recomendamos agendar una consulta de evaluación.

¿Te gustaría agendar una cita de evaluación? Responde "sí" para continuar.`;
  }

  private async handleLocationQuery(context: ConversationContext): Promise<string> {
    // This would typically come from the tenant's configuration
    return `📍 *Ubicación*

Puedes encontrarnos en nuestra práctica médica.

Para obtener la dirección exacta y cómo llegar, por favor comunícate con nosotros al teléfono de la práctica o visita nuestra página web.

¿Necesitas algo más?`;
  }

  private getHelpMenu(): string {
    return `📋 *Menú de Opciones*

Puedo ayudarte con:

1️⃣ *Agendar cita* - Escribe "agendar cita"
2️⃣ *Ver mis citas* - Escribe "mis citas"
3️⃣ *Cancelar/Reprogramar* - Escribe "cancelar cita"
4️⃣ *Horarios* - Escribe "horarios"
5️⃣ *Precios* - Escribe "precios"
6️⃣ *Ubicación* - Escribe "ubicación"

También puedes escribir tu consulta directamente y te ayudaré.`;
  }

  private async handleAwaitingInput(
    phoneNumber: string,
    message: string,
    context: ConversationContext,
  ): Promise<string> {
    switch (context.awaitingInput) {
      case 'patient_identification':
        // Try to find patient by document ID
        const patient = await this.prisma.patient.findFirst({
          where: { documentId: message.replace(/\D/g, '') },
        });

        if (patient) {
          context.patientId = patient.id;
          context.patientName = `${patient.firstName} ${patient.lastName}`;
          context.awaitingInput = undefined;
          return `¡Te encontré, ${context.patientName}! ✅

¿En qué puedo ayudarte?`;
        } else {
          return `No encontré un registro con ese documento.

¿Es la primera vez que nos visitas? Te recomendamos llamar a la práctica para registrarte.

¿O prefieres intentar con otro documento?`;
        }

      case 'appointment_type':
        context.awaitingInput = 'appointment_date_preference';
        return `Perfecto, has seleccionado: ${message}

¿Para cuándo te gustaría la cita?
- Escribe una fecha (ej: "próximo lunes", "15 de febrero")
- O escribe "lo más pronto posible"`;

      case 'appointment_date_preference':
        context.awaitingInput = undefined;
        return `Gracias por tu preferencia.

Para confirmar la disponibilidad exacta y agendar tu cita, por favor contacta directamente a la práctica o espera a que un miembro de nuestro equipo te contacte.

¿Hay algo más en lo que pueda ayudarte?`;

      case 'select_appointment_to_modify':
        context.awaitingInput = 'modify_action';
        return `Has seleccionado la cita #${message}.

¿Qué deseas hacer?
1️⃣ Cancelar la cita
2️⃣ Reprogramar para otra fecha

Escribe el número de tu elección.`;

      case 'modify_action':
        context.awaitingInput = undefined;
        if (message === '1' || message.includes('cancelar')) {
          return `Para confirmar la cancelación de tu cita, por favor contacta directamente a la práctica.

Recuerda que las cancelaciones deben hacerse con al menos 24 horas de anticipación.

¿Hay algo más en lo que pueda ayudarte?`;
        } else {
          return `Para reprogramar tu cita, por favor contacta directamente a la práctica con tu preferencia de nueva fecha.

¿Hay algo más en lo que pueda ayudarte?`;
        }

      default:
        context.awaitingInput = undefined;
        return this.getHelpMenu();
    }
  }

  private async handleWithAI(message: string, context: ConversationContext): Promise<string> {
    if (!this.openai) {
      return this.getFallbackResponse(message);
    }

    try {
      const systemPrompt = `Eres un asistente virtual amable y profesional para una práctica médica llamada MediCloud.
Tu objetivo es ayudar a los pacientes con:
- Información sobre servicios médicos
- Agendar, cancelar o reprogramar citas
- Responder preguntas frecuentes sobre tratamientos
- Proporcionar información general de la práctica

Reglas importantes:
- Sé conciso y amable
- Usa emojis de forma moderada
- Si no puedes ayudar con algo específico, sugiere contactar directamente a la práctica
- No proporciones diagnósticos médicos
- No confirmes citas directamente, solo ayuda con el proceso
${context.patientName ? `El paciente se llama ${context.patientName}.` : 'El paciente no está identificado aún.'}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || this.getFallbackResponse(message);
    } catch (error) {
      this.logger.error('Error calling OpenAI API', error);
      return this.getFallbackResponse(message);
    }
  }

  private getFallbackResponse(message: string): string {
    return `Gracias por tu mensaje.

Para una atención más personalizada, te recomiendo:
- Llamar directamente a la práctica
- Escribir "ayuda" para ver las opciones disponibles

¿Hay algo específico en lo que pueda ayudarte?`;
  }

  /**
   * Clear conversation context for a phone number
   */
  clearContext(phoneNumber: string): void {
    conversationContexts.delete(phoneNumber);
  }
}
