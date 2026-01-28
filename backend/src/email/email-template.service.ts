import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../admin/audit-log.service';
import { EmailTemplateType } from '@prisma/client';

@Injectable()
export class EmailTemplateService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };

    return this.prisma.emailTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    return template;
  }

  async findByType(type: EmailTemplateType) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { type },
    });

    if (!template) {
      throw new NotFoundException(`Email template ${type} not found`);
    }

    return template;
  }

  async create(data: {
    type: EmailTemplateType;
    name: string;
    description?: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    variables?: string[];
  }, userId: string) {
    // Check if template type already exists
    const existing = await this.prisma.emailTemplate.findUnique({
      where: { type: data.type },
    });

    if (existing) {
      throw new BadRequestException(`Template type ${data.type} already exists`);
    }

    const template = await this.prisma.emailTemplate.create({
      data: {
        type: data.type,
        name: data.name,
        description: data.description,
        subject: data.subject,
        htmlBody: data.htmlBody,
        textBody: data.textBody,
        variables: data.variables || [],
        isActive: true,
      },
    });

    await this.auditLogService.create({
      userId,
      action: 'CREATE',
      entity: 'EmailTemplate',
      entityId: template.id,
      metadata: {
        type: data.type,
        name: data.name,
      },
    });

    return template;
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    subject?: string;
    htmlBody?: string;
    textBody?: string;
    variables?: string[];
    isActive?: boolean;
  }, userId: string) {
    const template = await this.findById(id);

    const updated = await this.prisma.emailTemplate.update({
      where: { id },
      data,
    });

    await this.auditLogService.create({
      userId,
      action: 'UPDATE',
      entity: 'EmailTemplate',
      entityId: id,
      metadata: {
        type: template.type,
        changes: data,
      },
    });

    return updated;
  }

  async delete(id: string, userId: string) {
    const template = await this.findById(id);

    await this.prisma.emailTemplate.delete({
      where: { id },
    });

    await this.auditLogService.create({
      userId,
      action: 'DELETE',
      entity: 'EmailTemplate',
      entityId: id,
      metadata: {
        type: template.type,
        name: template.name,
      },
    });

    return { message: 'Email template deleted successfully', template };
  }

  async activate(id: string, userId: string) {
    const template = await this.findById(id);

    const updated = await this.prisma.emailTemplate.update({
      where: { id },
      data: { isActive: true },
    });

    await this.auditLogService.create({
      userId,
      action: 'UPDATE',
      entity: 'EmailTemplate',
      entityId: id,
      metadata: {
        type: template.type,
        action: 'activated',
      },
    });

    return updated;
  }

  async deactivate(id: string, userId: string) {
    const template = await this.findById(id);

    const updated = await this.prisma.emailTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditLogService.create({
      userId,
      action: 'UPDATE',
      entity: 'EmailTemplate',
      entityId: id,
      metadata: {
        type: template.type,
        action: 'deactivated',
      },
    });

    return updated;
  }

  async getStatistics() {
    const [total, active, inactive] = await Promise.all([
      this.prisma.emailTemplate.count(),
      this.prisma.emailTemplate.count({ where: { isActive: true } }),
      this.prisma.emailTemplate.count({ where: { isActive: false } }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  }

  async getEmailLogs(templateId?: string, limit = 50) {
    const where = templateId ? { templateId } : {};

    return this.prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        template: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });
  }
}
