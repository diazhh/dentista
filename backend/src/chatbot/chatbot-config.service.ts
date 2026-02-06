import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatbotConfigDto, UpdateChatbotConfigDto } from './dto/chatbot-config.dto';

@Injectable()
export class ChatbotConfigService {
  private readonly logger = new Logger(ChatbotConfigService.name);

  // Cache for config to avoid DB hits on every message
  private configCache = new Map<string, { config: any; expiresAt: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  /**
   * Get chatbot configuration for a tenant
   */
  async getConfig(tenantId: string) {
    // Check cache first
    const cached = this.configCache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.config;
    }

    let config = await this.prisma.chatbotConfig.findUnique({
      where: { tenantId },
    });

    // If no config exists, create default
    if (!config) {
      config = await this.createDefaultConfig(tenantId);
    }

    // Update cache
    this.configCache.set(tenantId, {
      config,
      expiresAt: Date.now() + this.CACHE_TTL,
    });

    return config;
  }

  /**
   * Create or update chatbot configuration
   */
  async upsertConfig(tenantId: string, dto: CreateChatbotConfigDto | UpdateChatbotConfigDto) {
    const config = await this.prisma.chatbotConfig.upsert({
      where: { tenantId },
      update: {
        ...dto,
        operatingHours: dto.operatingHours ? dto.operatingHours : undefined,
        pricingInfo: dto.pricingInfo ? dto.pricingInfo : undefined,
      },
      create: {
        tenantId,
        ...dto,
        operatingHours: dto.operatingHours ? dto.operatingHours : undefined,
        pricingInfo: dto.pricingInfo ? dto.pricingInfo : undefined,
      },
    });

    // Invalidate cache
    this.configCache.delete(tenantId);

    this.logger.log(`Chatbot config updated for tenant ${tenantId}`);
    return config;
  }

  /**
   * Delete chatbot configuration
   */
  async deleteConfig(tenantId: string) {
    const config = await this.prisma.chatbotConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      throw new NotFoundException('Chatbot configuration not found');
    }

    await this.prisma.chatbotConfig.delete({
      where: { tenantId },
    });

    // Invalidate cache
    this.configCache.delete(tenantId);

    return { message: 'Configuration deleted successfully' };
  }

  /**
   * Create default configuration for a tenant
   */
  private async createDefaultConfig(tenantId: string) {
    // Get tenant info for defaults
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { owner: true },
    });

    const defaultWelcome = tenant
      ? `¡Hola! 👋 Bienvenido a ${tenant.name}. ¿En qué puedo ayudarte hoy?`
      : '¡Hola! 👋 Bienvenido. ¿En qué puedo ayudarte hoy?';

    return this.prisma.chatbotConfig.create({
      data: {
        tenantId,
        isEnabled: true,
        welcomeMessage: defaultWelcome,
        fallbackMessage:
          'Gracias por tu mensaje. Para una atención más personalizada, te recomiendo contactar directamente a la práctica o escribir "ayuda" para ver las opciones disponibles.',
        practiceName: tenant?.name || null,
        aiModel: 'gpt-3.5-turbo',
        aiTemperature: 0.7,
        maxTokens: 300,
        allowScheduling: true,
        allowCancellation: true,
        allowRescheduling: true,
        requireIdentification: true,
        autoResponseDelay: 1000,
        humanHandoffKeywords: ['humano', 'persona', 'agente', 'recepcionista', 'hablar con alguien'],
        maxMessagesPerHour: 100,
        operatingHours: {
          monday: { open: '08:00', close: '18:00' },
          tuesday: { open: '08:00', close: '18:00' },
          wednesday: { open: '08:00', close: '18:00' },
          thursday: { open: '08:00', close: '18:00' },
          friday: { open: '08:00', close: '18:00' },
          saturday: { open: '09:00', close: '14:00' },
          sunday: null,
        },
      },
    });
  }

  /**
   * Check if chatbot is enabled for a tenant
   */
  async isEnabled(tenantId: string): Promise<boolean> {
    const config = await this.getConfig(tenantId);
    return config?.isEnabled ?? false;
  }

  /**
   * Get the system prompt for AI with tenant customization
   */
  async getSystemPrompt(tenantId: string, patientName?: string): Promise<string> {
    const config = await this.getConfig(tenantId);

    const defaultPrompt = `Eres un asistente virtual amable y profesional para una práctica médica.
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
- No confirmes citas directamente, solo ayuda con el proceso`;

    let prompt = config.systemPrompt || defaultPrompt;

    // Add practice-specific info
    if (config.practiceName) {
      prompt += `\n\nInformación de la práctica:
- Nombre: ${config.practiceName}`;
    }

    if (config.practiceAddress) {
      prompt += `\n- Dirección: ${config.practiceAddress}`;
    }

    if (config.practicePhone) {
      prompt += `\n- Teléfono: ${config.practicePhone}`;
    }

    if (config.practiceWebsite) {
      prompt += `\n- Web: ${config.practiceWebsite}`;
    }

    // Add operating hours
    if (config.operatingHours) {
      const hours = config.operatingHours as Record<string, { open: string; close: string } | null>;
      const daysMap: Record<string, string> = {
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
        sunday: 'Domingo',
      };

      prompt += '\n\nHorarios de atención:';
      for (const [day, schedule] of Object.entries(hours)) {
        if (schedule) {
          prompt += `\n- ${daysMap[day]}: ${schedule.open} - ${schedule.close}`;
        } else {
          prompt += `\n- ${daysMap[day]}: Cerrado`;
        }
      }
    }

    // Add pricing info
    if (config.pricingInfo) {
      const pricing = config.pricingInfo as Array<{
        service: string;
        price: number;
        description?: string;
      }>;
      if (pricing.length > 0) {
        prompt += '\n\nPrecios de referencia:';
        for (const item of pricing) {
          prompt += `\n- ${item.service}: $${item.price}`;
          if (item.description) {
            prompt += ` (${item.description})`;
          }
        }
      }
    }

    // Add patient context
    if (patientName) {
      prompt += `\n\nEl paciente se llama ${patientName}.`;
    } else {
      prompt += '\n\nEl paciente no está identificado aún.';
    }

    return prompt;
  }

  /**
   * Clear cache for a tenant (useful after updates)
   */
  clearCache(tenantId?: string) {
    if (tenantId) {
      this.configCache.delete(tenantId);
    } else {
      this.configCache.clear();
    }
  }
}
