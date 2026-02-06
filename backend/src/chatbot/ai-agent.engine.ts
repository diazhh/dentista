import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ChatbotConfigService } from './chatbot-config.service';
import OpenAI from 'openai';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export enum AgentIntent {
  GREETING = 'GREETING',
  CHECK_AVAILABILITY = 'CHECK_AVAILABILITY',
  SCHEDULE_APPOINTMENT = 'SCHEDULE_APPOINTMENT',
  RESCHEDULE_APPOINTMENT = 'RESCHEDULE_APPOINTMENT',
  CANCEL_APPOINTMENT = 'CANCEL_APPOINTMENT',
  CONFIRM_APPOINTMENT = 'CONFIRM_APPOINTMENT',
  ASK_SERVICES = 'ASK_SERVICES',
  ASK_PRICES = 'ASK_PRICES',
  ASK_HOURS = 'ASK_HOURS',
  ASK_LOCATION = 'ASK_LOCATION',
  ASK_PREPARATION = 'ASK_PREPARATION',
  IDENTIFY_PATIENT = 'IDENTIFY_PATIENT',
  HUMAN_HANDOFF = 'HUMAN_HANDOFF',
  THANKS = 'THANKS',
  UNKNOWN = 'UNKNOWN',
}

export interface AgentAction {
  function: string;
  arguments: Record<string, any>;
  result?: any;
}

export interface AgentResponse {
  text: string;
  intent: string;
  actions?: AgentAction[];
  metadata?: Record<string, any>;
}

interface AvailableSlot {
  date: string;
  time: string;
  roomId: string;
  roomName: string;
  clinicName: string;
}

interface ProviderContext {
  tenantName: string;
  ownerName: string;
  specialties: string[];
  services: Array<{
    id: string;
    name: string;
    defaultPrice: number;
    duration: number;
    category: string;
  }>;
  operatingHours: Record<string, { open: string; close: string } | null> | null;
  practiceInfo: {
    name: string | null;
    address: string | null;
    phone: string | null;
    website: string | null;
  };
  availableSlots: AvailableSlot[];
  faqs: Array<{ question: string; answer: string }>;
  clinics: Array<{ id: string; name: string; address: any }>;
}

// ------------------------------------------------------------------
// OpenAI function-calling tool definitions
// ------------------------------------------------------------------

const TOOL_DEFINITIONS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description:
        'Check available appointment slots for a date range or service type.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description:
              'ISO date (YYYY-MM-DD) to check availability for. Omit to get the next 7 days.',
          },
          serviceType: {
            type: 'string',
            description:
              'Name or category of the medical service to filter slots by.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'schedule_appointment',
      description: 'Schedule a new appointment for a patient.',
      parameters: {
        type: 'object',
        properties: {
          patientId: { type: 'string', description: 'Patient UUID' },
          serviceId: { type: 'string', description: 'MedicalService UUID' },
          date: {
            type: 'string',
            description: 'ISO date (YYYY-MM-DD)',
          },
          time: {
            type: 'string',
            description: 'Time in HH:mm format',
          },
          roomId: { type: 'string', description: 'ConsultationRoom UUID' },
        },
        required: ['patientId', 'serviceId', 'date', 'time', 'roomId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_appointment',
      description: 'Cancel an existing appointment.',
      parameters: {
        type: 'object',
        properties: {
          appointmentId: { type: 'string', description: 'Appointment UUID' },
        },
        required: ['appointmentId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'identify_patient',
      description:
        'Look up a patient by their national document / ID number.',
      parameters: {
        type: 'object',
        properties: {
          documentId: {
            type: 'string',
            description: 'The patient document / ID number (digits only).',
          },
        },
        required: ['documentId'],
      },
    },
  },
];

// ------------------------------------------------------------------
// Keyword maps for fallback (no-OpenAI) mode
// ------------------------------------------------------------------

const KEYWORD_INTENT_MAP: Array<{ keywords: string[]; intent: AgentIntent }> = [
  {
    keywords: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hello'],
    intent: AgentIntent.GREETING,
  },
  {
    keywords: ['disponibilidad', 'disponible', 'hay espacio', 'tienen cupo'],
    intent: AgentIntent.CHECK_AVAILABILITY,
  },
  {
    keywords: ['agendar', 'reservar', 'cita', 'turno', 'appointment', 'schedule'],
    intent: AgentIntent.SCHEDULE_APPOINTMENT,
  },
  {
    keywords: ['reprogramar', 'cambiar fecha', 'mover cita', 'reschedule'],
    intent: AgentIntent.RESCHEDULE_APPOINTMENT,
  },
  {
    keywords: ['cancelar', 'anular', 'cancel'],
    intent: AgentIntent.CANCEL_APPOINTMENT,
  },
  {
    keywords: ['confirmar', 'confirmo', 'confirm'],
    intent: AgentIntent.CONFIRM_APPOINTMENT,
  },
  {
    keywords: ['servicio', 'servicios', 'tratamiento', 'tratamientos', 'que ofrecen'],
    intent: AgentIntent.ASK_SERVICES,
  },
  {
    keywords: ['precio', 'costo', 'cuanto', 'tarifa', 'valor', 'price'],
    intent: AgentIntent.ASK_PRICES,
  },
  {
    keywords: ['horario', 'hora', 'cuando', 'abren', 'cierran', 'hours'],
    intent: AgentIntent.ASK_HOURS,
  },
  {
    keywords: ['ubicación', 'dirección', 'donde', 'llegar', 'mapa', 'location'],
    intent: AgentIntent.ASK_LOCATION,
  },
  {
    keywords: ['preparación', 'preparar', 'antes de', 'recomendaciones', 'preparation'],
    intent: AgentIntent.ASK_PREPARATION,
  },
  {
    keywords: ['cédula', 'documento', 'identificar', 'identify', 'id'],
    intent: AgentIntent.IDENTIFY_PATIENT,
  },
  {
    keywords: ['humano', 'persona', 'agente', 'recepcionista', 'hablar con alguien'],
    intent: AgentIntent.HUMAN_HANDOFF,
  },
  {
    keywords: ['gracias', 'thank', 'thanks', 'perfecto', 'listo'],
    intent: AgentIntent.THANKS,
  },
];

// ------------------------------------------------------------------
// Service
// ------------------------------------------------------------------

@Injectable()
export class AIAgentEngine {
  private readonly logger = new Logger(AIAgentEngine.name);
  private openai: OpenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly chatbotConfigService: ChatbotConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized for AIAgentEngine');
    } else {
      this.logger.warn(
        'OPENAI_API_KEY not configured -- AIAgentEngine will use keyword fallback',
      );
    }
  }

  // ==================================================================
  // Main entry point
  // ==================================================================

  /**
   * Process a single user message and return a structured response.
   *
   * @param sessionId  Unique chat session identifier
   * @param tenantId   Tenant (provider) that the chatbot belongs to
   * @param message    The raw text sent by the user
   * @param patientId  Optional -- already-identified patient UUID
   */
  async process(
    sessionId: string,
    tenantId: string,
    message: string,
    patientId?: string,
  ): Promise<AgentResponse> {
    // 1. Build the RAG context for this tenant
    const context = await this.buildProviderContext(tenantId);

    // 2. Load tenant-specific chatbot configuration
    const config = await this.chatbotConfigService.getConfig(tenantId);

    // 3. If OpenAI is not available, fall back to keyword matching
    if (!this.openai) {
      return this.fallbackProcess(message, context, config, patientId);
    }

    try {
      // 4. Build the system prompt with the full RAG context
      const systemPrompt = this.buildSystemPrompt(context, config, patientId);

      // 5. Call OpenAI with function-calling tools
      const model = config.aiModel || 'gpt-4o-mini';
      const temperature = config.aiTemperature ?? 0.7;
      const maxTokens = config.maxTokens ?? 500;

      // Determine which tools the config allows
      const allowedTools = this.filterToolsByConfig(config);

      const completion = await this.openai.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        tools: allowedTools.length > 0 ? allowedTools : undefined,
        tool_choice: allowedTools.length > 0 ? 'auto' : undefined,
      });

      const choice = completion.choices[0];
      if (!choice) {
        return this.fallbackProcess(message, context, config, patientId);
      }

      // 6. Handle tool calls if the model chose to invoke functions
      const actions: AgentAction[] = [];
      let assistantText = choice.message.content || '';

      // Filter to only function-type tool calls (not custom tools)
      const functionToolCalls = (choice.message.tool_calls || []).filter(
        (tc): tc is OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall =>
          tc.type === 'function',
      );

      if (functionToolCalls.length > 0) {
        for (const toolCall of functionToolCalls) {
          const fnName = toolCall.function.name;
          const fnArgs = JSON.parse(toolCall.function.arguments);
          const result = await this.executeAction(fnName, fnArgs, tenantId, patientId);

          actions.push({ function: fnName, arguments: fnArgs, result });
        }

        // Make a follow-up call so the model can incorporate tool results
        const toolMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
          choice.message as OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam,
        ];

        for (const toolCall of functionToolCalls) {
          const matchingAction = actions.find(
            (a) => a.function === toolCall.function.name,
          );
          toolMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(matchingAction?.result ?? {}),
          });
        }

        const followUp = await this.openai.chat.completions.create({
          model,
          temperature,
          max_tokens: maxTokens,
          messages: toolMessages,
        });

        assistantText = followUp.choices[0]?.message.content || assistantText;
      }

      // 7. Classify the intent from the assistant response
      const intent = this.classifyIntentFromKeywords(message);

      return {
        text: assistantText,
        intent,
        actions: actions.length > 0 ? actions : undefined,
      };
    } catch (error) {
      this.logger.error('Error in AIAgentEngine.process', error);
      return this.fallbackProcess(message, context, config, patientId);
    }
  }

  // ==================================================================
  // Provider Context Builder (RAG)
  // ==================================================================

  private async buildProviderContext(tenantId: string): Promise<ProviderContext> {
    // Fetch tenant info
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { owner: { select: { name: true, specialties: true } } },
    });

    // Fetch medical services
    const services = await this.prisma.medicalService.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        defaultPrice: true,
        duration: true,
        category: true,
      },
      orderBy: { category: 'asc' },
    });

    // Fetch chatbot config (for operating hours + practice info)
    const config = await this.chatbotConfigService.getConfig(tenantId);

    const operatingHours = (config.operatingHours as Record<
      string,
      { open: string; close: string } | null
    >) || null;

    // Fetch available slots for the next 7 days
    const availableSlots = await this.getAvailableSlots(tenantId);

    // Fetch clinics where the provider has active room assignments
    const roomAssignments = await this.prisma.roomAssignment.findMany({
      where: { tenantId, isActive: true },
      include: {
        room: {
          include: {
            clinic: { select: { id: true, name: true, address: true } },
          },
        },
      },
    });

    const clinicsMap = new Map<string, { id: string; name: string; address: any }>();
    for (const ra of roomAssignments) {
      const clinic = ra.room.clinic;
      if (!clinicsMap.has(clinic.id)) {
        clinicsMap.set(clinic.id, {
          id: clinic.id,
          name: clinic.name,
          address: clinic.address,
        });
      }
    }

    // Build FAQs from pricingInfo as a proxy (the real FAQ field will be added
    // to the ChatbotConfig model later -- for now we adapt pricingInfo).
    const faqs: Array<{ question: string; answer: string }> = [];
    if (config.pricingInfo && Array.isArray(config.pricingInfo)) {
      const pricing = config.pricingInfo as Array<{
        service: string;
        price: number;
        description?: string;
      }>;
      for (const item of pricing) {
        faqs.push({
          question: `Cuanto cuesta ${item.service}?`,
          answer: `${item.service}: $${item.price}${item.description ? ` - ${item.description}` : ''}`,
        });
      }
    }

    return {
      tenantName: tenant?.name || 'Practica Medica',
      ownerName: tenant?.owner?.name || 'Doctor',
      specialties: (tenant?.owner?.specialties || []) as string[],
      services,
      operatingHours,
      practiceInfo: {
        name: config.practiceName || null,
        address: config.practiceAddress || null,
        phone: config.practicePhone || null,
        website: config.practiceWebsite || null,
      },
      availableSlots,
      faqs,
      clinics: Array.from(clinicsMap.values()),
    };
  }

  // ==================================================================
  // Available Slots Calculator
  // ==================================================================

  private async getAvailableSlots(tenantId: string): Promise<AvailableSlot[]> {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    // Get all room assignments for this tenant
    const assignments = await this.prisma.roomAssignment.findMany({
      where: {
        tenantId,
        isActive: true,
        startDate: { lte: endDate },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            isActive: true,
            clinic: { select: { name: true } },
          },
        },
      },
    });

    // Get existing appointments in the range
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        appointmentDate: { gte: now, lte: endDate },
        status: 'SCHEDULED',
      },
      select: { appointmentDate: true, duration: true, roomId: true },
    });

    // Index occupied times per room
    const occupiedByRoom = new Map<string, Array<{ start: Date; end: Date }>>();
    for (const apt of existingAppointments) {
      if (!apt.roomId) continue;
      const list = occupiedByRoom.get(apt.roomId) || [];
      const start = new Date(apt.appointmentDate);
      const end = new Date(start.getTime() + apt.duration * 60_000);
      list.push({ start, end });
      occupiedByRoom.set(apt.roomId, list);
    }

    const slots: AvailableSlot[] = [];
    const slotDurationMs = 30 * 60_000; // 30-minute slots

    // For each day in the 7-day window, each active room assignment,
    // generate free 30-min slots during working hours (08:00-18:00).
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const day = new Date(now);
      day.setDate(day.getDate() + dayOffset);
      day.setHours(0, 0, 0, 0);

      for (const assignment of assignments) {
        if (!assignment.room.isActive) continue;

        const dayStartHour = 8;
        const dayEndHour = 18;

        for (let hour = dayStartHour; hour < dayEndHour; hour++) {
          for (const halfHour of [0, 30]) {
            const slotStart = new Date(day);
            slotStart.setHours(hour, halfHour, 0, 0);

            // Skip past slots
            if (slotStart <= now) continue;

            const slotEnd = new Date(slotStart.getTime() + slotDurationMs);

            // Check if room is occupied at this time
            const occupied = occupiedByRoom.get(assignment.room.id) || [];
            const isOccupied = occupied.some(
              (o) => slotStart < o.end && slotEnd > o.start,
            );

            if (!isOccupied) {
              slots.push({
                date: slotStart.toISOString().slice(0, 10),
                time: `${String(hour).padStart(2, '0')}:${String(halfHour).padStart(2, '0')}`,
                roomId: assignment.room.id,
                roomName: assignment.room.name,
                clinicName: assignment.room.clinic.name,
              });
            }
          }
        }
      }

      // Limit to a reasonable number of total slots
      if (slots.length >= 200) break;
    }

    return slots;
  }

  // ==================================================================
  // System Prompt Builder
  // ==================================================================

  private buildSystemPrompt(
    ctx: ProviderContext,
    config: any,
    patientId?: string,
  ): string {
    const customPrompt = config.systemPrompt || '';

    const lines: string[] = [
      'Eres un asistente virtual amable y profesional para una practica medica. Tu nombre es el Asistente Virtual de ' +
        ctx.tenantName +
        '.',
      '',
      'REGLAS IMPORTANTES:',
      '- Se conciso y amable.',
      '- Usa emojis de forma moderada.',
      '- No proporciones diagnosticos medicos.',
      '- Si no puedes ayudar con algo especifico, sugiere contactar directamente a la practica.',
      '- Cuando se necesite agendar, cancelar o consultar disponibilidad, usa las funciones (tools) disponibles.',
      '- Responde siempre en espanol a menos que el paciente escriba en otro idioma.',
      '',
    ];

    // Practice info
    lines.push('== INFORMACION DE LA PRACTICA ==');
    if (ctx.practiceInfo.name) lines.push(`Nombre: ${ctx.practiceInfo.name}`);
    lines.push(`Propietario: ${ctx.ownerName}`);
    if (ctx.specialties.length > 0)
      lines.push(`Especialidades: ${ctx.specialties.join(', ')}`);
    if (ctx.practiceInfo.address)
      lines.push(`Direccion: ${ctx.practiceInfo.address}`);
    if (ctx.practiceInfo.phone)
      lines.push(`Telefono: ${ctx.practiceInfo.phone}`);
    if (ctx.practiceInfo.website) lines.push(`Web: ${ctx.practiceInfo.website}`);
    lines.push('');

    // Operating hours
    if (ctx.operatingHours) {
      const daysMap: Record<string, string> = {
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miercoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sabado',
        sunday: 'Domingo',
      };
      lines.push('== HORARIOS DE ATENCION ==');
      for (const [day, schedule] of Object.entries(ctx.operatingHours)) {
        if (schedule) {
          lines.push(`${daysMap[day] || day}: ${schedule.open} - ${schedule.close}`);
        } else {
          lines.push(`${daysMap[day] || day}: Cerrado`);
        }
      }
      lines.push('');
    }

    // Services
    if (ctx.services.length > 0) {
      lines.push('== SERVICIOS DISPONIBLES ==');
      for (const svc of ctx.services) {
        lines.push(
          `- ${svc.name} (${svc.category}): $${svc.defaultPrice} | ${svc.duration} min | ID: ${svc.id}`,
        );
      }
      lines.push('');
    }

    // Clinics
    if (ctx.clinics.length > 0) {
      lines.push('== CLINICAS ==');
      for (const c of ctx.clinics) {
        const addr =
          typeof c.address === 'string'
            ? c.address
            : JSON.stringify(c.address);
        lines.push(`- ${c.name}: ${addr}`);
      }
      lines.push('');
    }

    // Available slots summary
    if (ctx.availableSlots.length > 0) {
      const grouped = new Map<string, number>();
      for (const slot of ctx.availableSlots) {
        grouped.set(slot.date, (grouped.get(slot.date) || 0) + 1);
      }
      lines.push('== DISPONIBILIDAD PROXIMOS 7 DIAS (resumen) ==');
      for (const [date, count] of grouped) {
        lines.push(`${date}: ${count} espacios disponibles`);
      }
      lines.push(
        '(Usa la funcion check_availability para obtener horarios especificos.)',
      );
      lines.push('');
    }

    // FAQs
    if (ctx.faqs.length > 0) {
      lines.push('== PREGUNTAS FRECUENTES ==');
      for (const faq of ctx.faqs) {
        lines.push(`P: ${faq.question}`);
        lines.push(`R: ${faq.answer}`);
      }
      lines.push('');
    }

    // Patient context
    if (patientId) {
      lines.push(`El paciente esta identificado (ID: ${patientId}).`);
    } else {
      lines.push(
        'El paciente NO esta identificado. Si necesita agendar o consultar citas, pidele su numero de documento/cedula y usa identify_patient.',
      );
    }

    // Append any custom system prompt
    if (customPrompt) {
      lines.push('');
      lines.push('== INSTRUCCIONES ADICIONALES DEL PROVEEDOR ==');
      lines.push(customPrompt);
    }

    return lines.join('\n');
  }

  // ==================================================================
  // Tool filtering based on ChatbotConfig permissions
  // ==================================================================

  private filterToolsByConfig(
    config: any,
  ): OpenAI.Chat.Completions.ChatCompletionTool[] {
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [];

    for (const tool of TOOL_DEFINITIONS) {
      // All our tool definitions are function tools
      if (tool.type !== 'function') continue;
      const name = (tool as OpenAI.Chat.Completions.ChatCompletionFunctionTool).function.name;

      if (name === 'check_availability') {
        tools.push(tool);
        continue;
      }
      if (name === 'schedule_appointment' && config.allowScheduling) {
        tools.push(tool);
        continue;
      }
      if (name === 'cancel_appointment' && config.allowCancellation) {
        tools.push(tool);
        continue;
      }
      if (name === 'identify_patient') {
        tools.push(tool);
        continue;
      }
    }

    return tools;
  }

  // ==================================================================
  // Action Executors
  // ==================================================================

  private async executeAction(
    fnName: string,
    args: Record<string, any>,
    tenantId: string,
    patientId?: string,
  ): Promise<any> {
    switch (fnName) {
      case 'check_availability':
        return this.executeCheckAvailability(tenantId, args.date, args.serviceType);

      case 'schedule_appointment':
        return this.executeScheduleAppointment(
          tenantId,
          args.patientId,
          args.serviceId,
          args.date,
          args.time,
          args.roomId,
        );

      case 'cancel_appointment':
        return this.executeCancelAppointment(args.appointmentId, patientId);

      case 'identify_patient':
        return this.executeIdentifyPatient(args.documentId, tenantId);

      default:
        return { error: `Unknown function: ${fnName}` };
    }
  }

  /**
   * Check available appointment slots, optionally filtered by date and/or
   * service type.
   */
  async executeCheckAvailability(
    tenantId: string,
    date?: string,
    serviceType?: string,
  ): Promise<{ slots: AvailableSlot[]; total: number }> {
    let slots = await this.getAvailableSlots(tenantId);

    if (date) {
      slots = slots.filter((s) => s.date === date);
    }

    if (serviceType) {
      // Look up the service to get its duration -- slots that are too short
      // will be excluded in a future refinement.  For now return all matching
      // date slots.
      const normalised = serviceType.toLowerCase();
      const service = await this.prisma.medicalService.findFirst({
        where: {
          tenantId,
          isActive: true,
          OR: [
            { name: { contains: normalised, mode: 'insensitive' } },
            { category: { contains: normalised, mode: 'insensitive' } },
          ],
        },
      });

      if (service) {
        // Optionally narrow by rooms that have required capabilities
        // (future improvement)
      }
    }

    // Return at most 20 slots in the response to keep token usage low
    const limited = slots.slice(0, 20);
    return { slots: limited, total: slots.length };
  }

  /**
   * Find a patient by their document (cedula / ID) number.
   */
  async executeIdentifyPatient(
    documentId: string,
    tenantId?: string,
  ): Promise<{
    found: boolean;
    patientId?: string;
    patientName?: string;
  }> {
    const cleaned = documentId.replace(/\D/g, '');

    const patient = await this.prisma.patient.findFirst({
      where: { documentId: cleaned },
      select: { id: true, firstName: true, lastName: true },
    });

    if (patient) {
      return {
        found: true,
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
      };
    }

    return { found: false };
  }

  /**
   * Create a new appointment.
   */
  async executeScheduleAppointment(
    tenantId: string,
    patientId: string,
    serviceId: string,
    date: string,
    time: string,
    roomId: string,
  ): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
    try {
      // Resolve service
      const service = await this.prisma.medicalService.findUnique({
        where: { id: serviceId },
      });
      if (!service) return { success: false, error: 'Servicio no encontrado' };

      // Resolve provider via room assignment
      const roomAssignment = await this.prisma.roomAssignment.findFirst({
        where: { tenantId, roomId, isActive: true },
      });
      if (!roomAssignment)
        return { success: false, error: 'Consultorio no asignado a este proveedor' };

      const [hourStr, minuteStr] = time.split(':');
      const appointmentDate = new Date(`${date}T${hourStr}:${minuteStr}:00`);

      // Check for conflicts
      const endTime = new Date(
        appointmentDate.getTime() + service.duration * 60_000,
      );

      const conflict = await this.prisma.appointment.findFirst({
        where: {
          roomId,
          status: 'SCHEDULED',
          appointmentDate: { lt: endTime },
          // The existing appointment ends after our start
          AND: {
            appointmentDate: {
              gte: new Date(appointmentDate.getTime() - 24 * 60 * 60_000),
            },
          },
        },
      });

      if (conflict) {
        // More precise conflict check using duration
        const conflictEnd = new Date(
          conflict.appointmentDate.getTime() + conflict.duration * 60_000,
        );
        if (appointmentDate < conflictEnd && endTime > conflict.appointmentDate) {
          return {
            success: false,
            error: 'Ese horario ya esta ocupado. Por favor seleccione otro.',
          };
        }
      }

      const appointment = await this.prisma.appointment.create({
        data: {
          patientId,
          providerId: roomAssignment.providerId,
          tenantId,
          roomId,
          appointmentDate,
          duration: service.duration,
          procedureType: service.name,
          status: 'SCHEDULED',
        },
      });

      return { success: true, appointmentId: appointment.id };
    } catch (error) {
      this.logger.error('Error scheduling appointment via AI agent', error);
      return { success: false, error: 'Error interno al agendar la cita.' };
    }
  }

  /**
   * Cancel an existing appointment.
   */
  async executeCancelAppointment(
    appointmentId: string,
    patientId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment) {
        return { success: false, error: 'Cita no encontrada.' };
      }

      // Verify ownership when patientId is known
      if (patientId && appointment.patientId !== patientId) {
        return { success: false, error: 'No tienes permiso para cancelar esta cita.' };
      }

      if (appointment.status !== 'SCHEDULED') {
        return {
          success: false,
          error: `La cita no se puede cancelar porque su estado es ${appointment.status}.`,
        };
      }

      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' },
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Error cancelling appointment via AI agent', error);
      return { success: false, error: 'Error interno al cancelar la cita.' };
    }
  }

  // ==================================================================
  // Keyword-based fallback (no OpenAI key)
  // ==================================================================

  private classifyIntentFromKeywords(message: string): string {
    const normalised = message.toLowerCase().trim();
    for (const entry of KEYWORD_INTENT_MAP) {
      if (entry.keywords.some((kw) => normalised.includes(kw))) {
        return entry.intent;
      }
    }
    return AgentIntent.UNKNOWN;
  }

  private fallbackProcess(
    message: string,
    context: ProviderContext,
    config: any,
    patientId?: string,
  ): AgentResponse {
    const intent = this.classifyIntentFromKeywords(message);

    let text: string;

    switch (intent) {
      case AgentIntent.GREETING:
        text = config.welcomeMessage || `Hola! Bienvenido a ${context.tenantName}. En que puedo ayudarte?`;
        break;

      case AgentIntent.ASK_HOURS:
        if (context.operatingHours) {
          const daysMap: Record<string, string> = {
            monday: 'Lunes',
            tuesday: 'Martes',
            wednesday: 'Miercoles',
            thursday: 'Jueves',
            friday: 'Viernes',
            saturday: 'Sabado',
            sunday: 'Domingo',
          };
          const lines = Object.entries(context.operatingHours).map(([day, sched]) =>
            sched
              ? `${daysMap[day] || day}: ${sched.open} - ${sched.close}`
              : `${daysMap[day] || day}: Cerrado`,
          );
          text = `Horarios de Atencion:\n${lines.join('\n')}`;
        } else {
          text = 'Los horarios de atencion no estan configurados. Contacta directamente a la practica.';
        }
        break;

      case AgentIntent.ASK_LOCATION:
        text = context.practiceInfo.address
          ? `Nos encuentras en: ${context.practiceInfo.address}`
          : 'Para obtener la direccion, contacta directamente a la practica.';
        if (context.practiceInfo.phone) {
          text += `\nTelefono: ${context.practiceInfo.phone}`;
        }
        break;

      case AgentIntent.ASK_SERVICES:
        if (context.services.length > 0) {
          const list = context.services
            .slice(0, 10)
            .map((s) => `- ${s.name} (${s.category}): $${s.defaultPrice}`)
            .join('\n');
          text = `Nuestros servicios:\n${list}`;
        } else {
          text = 'Contacta a la practica para conocer los servicios disponibles.';
        }
        break;

      case AgentIntent.ASK_PRICES:
        if (context.services.length > 0) {
          const list = context.services
            .slice(0, 10)
            .map((s) => `- ${s.name}: $${s.defaultPrice}`)
            .join('\n');
          text = `Precios de referencia:\n${list}\n\nLos precios pueden variar. Agenda una consulta para un presupuesto personalizado.`;
        } else {
          text = 'Para consultar precios, contacta directamente a la practica.';
        }
        break;

      case AgentIntent.CHECK_AVAILABILITY:
      case AgentIntent.SCHEDULE_APPOINTMENT: {
        const summaryEntries: string[] = [];
        const grouped = new Map<string, number>();
        for (const slot of context.availableSlots) {
          grouped.set(slot.date, (grouped.get(slot.date) || 0) + 1);
        }
        for (const [date, count] of grouped) {
          summaryEntries.push(`${date}: ${count} espacios`);
        }
        if (summaryEntries.length > 0) {
          text = `Disponibilidad proximos dias:\n${summaryEntries.join('\n')}\n\nPara agendar, contacta a la practica o proporciona tu cedula para identificarte.`;
        } else {
          text = 'No hay disponibilidad en los proximos dias. Contacta a la practica para mas opciones.';
        }
        break;
      }

      case AgentIntent.CANCEL_APPOINTMENT:
      case AgentIntent.RESCHEDULE_APPOINTMENT:
        text = patientId
          ? 'Para cancelar o reprogramar tu cita, proporciona la fecha de la cita que deseas modificar.'
          : 'Primero necesito identificarte. Proporcioname tu numero de cedula o documento.';
        break;

      case AgentIntent.IDENTIFY_PATIENT:
        text = 'Proporcioname tu numero de cedula o documento de identidad para identificarte.';
        break;

      case AgentIntent.HUMAN_HANDOFF:
        text = 'Entiendo, te transferire con una persona de nuestro equipo. En un momento te atendera alguien.';
        break;

      case AgentIntent.THANKS:
        text = 'Con gusto! Si necesitas algo mas, no dudes en escribir.';
        break;

      default:
        text =
          config.fallbackMessage ||
          'Gracias por tu mensaje. Para una atencion mas personalizada, contacta directamente a la practica o escribe "ayuda" para ver las opciones.';
        break;
    }

    return { text, intent };
  }
}
