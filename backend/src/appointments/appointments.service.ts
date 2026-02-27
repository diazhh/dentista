import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto, UpdateAppointmentSoapDto, CreateAppointmentProcedureDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { SchedulingService } from '../scheduling/scheduling.service';

const appointmentInclude = {
  patient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      documentId: true,
      dateOfBirth: true,
      gender: true,
      user: {
        select: {
          email: true,
          phone: true,
          name: true,
        },
      },
    },
  },
  room: {
    include: {
      clinic: true,
    },
  },
  procedures: {
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private schedulingService: SchedulingService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto, providerId: string, tenantId: string) {
    // Verify patient has relation with this provider
    const patientRelation = await this.prisma.providerPatientRelation.findFirst({
      where: {
        patientId: createAppointmentDto.patientId,
        providerId: providerId,
        isActive: true,
      },
    });

    if (!patientRelation) {
      throw new ForbiddenException('Patient is not associated with this provider');
    }

    // If room is specified, verify provider has access
    if (createAppointmentDto.roomId) {
      const roomAssignment = await this.prisma.roomAssignment.findFirst({
        where: {
          roomId: createAppointmentDto.roomId,
          providerId: providerId,
          isActive: true,
        },
      });

      if (!roomAssignment) {
        throw new ForbiddenException('Provider does not have access to this consultation room');
      }
    }

    // Check for scheduling conflicts using the scheduling service
    const appointmentDate = new Date(createAppointmentDto.appointmentDate);
    const endTime = new Date(appointmentDate.getTime() + createAppointmentDto.duration * 60000);

    // Use SchedulingService for precise room + provider double-booking prevention
    if (createAppointmentDto.roomId) {
      const validation = await this.schedulingService.validateAppointmentSlot(
        providerId,
        createAppointmentDto.roomId,
        appointmentDate,
        endTime,
      );

      if (!validation.valid) {
        throw new BadRequestException(validation.conflict || 'Time slot is not available');
      }
    } else {
      // Fallback: basic provider-only conflict check when no room is specified
      const conflicts = await this.prisma.appointment.findMany({
        where: {
          providerId: providerId,
          tenantId: tenantId,
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
          },
          OR: [
            {
              AND: [
                { appointmentDate: { lte: appointmentDate } },
                { appointmentDate: { gte: new Date(appointmentDate.getTime() - 24 * 60 * 60000) } },
              ],
            },
          ],
        },
      });

      for (const conflict of conflicts) {
        const conflictEnd = new Date(conflict.appointmentDate.getTime() + conflict.duration * 60000);
        if (
          (appointmentDate >= conflict.appointmentDate && appointmentDate < conflictEnd) ||
          (endTime > conflict.appointmentDate && endTime <= conflictEnd)
        ) {
          throw new BadRequestException('Time slot conflicts with existing appointment');
        }
      }
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        ...createAppointmentDto,
        providerId: providerId,
        tenantId,
        status: createAppointmentDto.status || AppointmentStatus.SCHEDULED,
      },
      include: appointmentInclude,
    });

    // Send confirmation and schedule reminders
    try {
      await this.notificationsService.sendAppointmentConfirmation(appointment.id);
      await this.notificationsService.scheduleAppointmentReminders(appointment.id);
    } catch (error) {
      this.logger.error('Failed to send notifications:', error);
    }

    return appointment;
  }

  async findAll(providerId: string, tenantId: string, startDate?: string, endDate?: string, page?: number, pageSize?: number) {
    const where: any = {
      providerId: providerId,
      tenantId,
    };

    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) {
        where.appointmentDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.appointmentDate.lte = new Date(endDate);
      }
    }

    const selectFields = {
      id: true,
      appointmentDate: true,
      duration: true,
      status: true,
      procedureType: true,
      notes: true,
      chiefComplaint: true,
      clinicalNoteComplete: true,
      reminderSent: true,
      confirmedVia: true,
      createdAt: true,
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          documentId: true,
          user: {
            select: {
              email: true,
              phone: true,
            },
          },
        },
      },
      room: {
        select: {
          id: true,
          name: true,
          floor: true,
          clinic: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: { procedures: true },
      },
    };

    if (page && pageSize) {
      const [data, total] = await Promise.all([
        this.prisma.appointment.findMany({
          where,
          select: selectFields,
          orderBy: { appointmentDate: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.appointment.count({ where }),
      ]);
      return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    return this.prisma.appointment.findMany({
      where,
      select: selectFields,
      orderBy: { appointmentDate: 'asc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        providerId: providerId,
        tenantId,
      },
      include: appointmentInclude,
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto, providerId: string, tenantId: string) {
    await this.findOne(id, providerId, tenantId);

    return this.prisma.appointment.update({
      where: { id },
      data: updateAppointmentDto,
      include: appointmentInclude,
    });
  }

  async updateSoap(id: string, soapDto: UpdateAppointmentSoapDto, providerId: string, tenantId: string) {
    await this.findOne(id, providerId, tenantId);

    return this.prisma.appointment.update({
      where: { id },
      data: {
        chiefComplaint: soapDto.chiefComplaint,
        painScale: soapDto.painScale,
        subjectiveFindings: soapDto.subjectiveFindings,
        objectiveFindings: soapDto.objectiveFindings,
        assessment: soapDto.assessment,
        plan: soapDto.plan,
        postProcedureInstructions: soapDto.postProcedureInstructions,
        followUpNotes: soapDto.followUpNotes,
        vitalSigns: soapDto.vitalSigns,
        clinicalNoteComplete: soapDto.clinicalNoteComplete,
        notes: soapDto.notes,
      },
      include: appointmentInclude,
    });
  }

  async remove(id: string, providerId: string, tenantId: string) {
    await this.findOne(id, providerId, tenantId);

    return this.prisma.appointment.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: AppointmentStatus, providerId: string, tenantId: string) {
    await this.findOne(id, providerId, tenantId);

    return this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: appointmentInclude,
    });
  }

  // === Procedures CRUD ===

  async addProcedure(appointmentId: string, dto: CreateAppointmentProcedureDto, providerId: string, tenantId: string) {
    await this.findOne(appointmentId, providerId, tenantId);

    const procedure = await this.prisma.appointmentProcedure.create({
      data: {
        appointmentId,
        tenantId,
        procedureType: dto.procedureType,
        toothNumber: dto.toothNumber,
        surfaces: dto.surfaces || [],
        material: dto.material,
        notes: dto.notes,
        cost: dto.cost || 0,
        cdtCode: dto.cdtCode,
      },
    });

    // Auto-update odontogram if tooth number is specified
    if (dto.toothNumber) {
      await this.autoUpdateOdontogram(appointmentId, dto, tenantId);
    }

    return procedure;
  }

  async updateProcedure(appointmentId: string, procedureId: string, dto: Partial<CreateAppointmentProcedureDto>, providerId: string, tenantId: string) {
    await this.findOne(appointmentId, providerId, tenantId);

    return this.prisma.appointmentProcedure.update({
      where: { id: procedureId },
      data: {
        procedureType: dto.procedureType,
        toothNumber: dto.toothNumber,
        surfaces: dto.surfaces,
        material: dto.material,
        notes: dto.notes,
        cost: dto.cost,
        cdtCode: dto.cdtCode,
      },
    });
  }

  async removeProcedure(appointmentId: string, procedureId: string, providerId: string, tenantId: string) {
    await this.findOne(appointmentId, providerId, tenantId);

    await this.prisma.appointmentProcedure.delete({
      where: { id: procedureId },
    });

    return { message: 'Procedure removed successfully' };
  }

  async getProcedures(appointmentId: string, providerId: string, tenantId: string) {
    await this.findOne(appointmentId, providerId, tenantId);

    return this.prisma.appointmentProcedure.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Auto-update odontogram based on procedure
  private async autoUpdateOdontogram(appointmentId: string, dto: CreateAppointmentProcedureDto, tenantId: string) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { patientId: true, providerId: true },
      });
      if (!appointment) return;

      // Find latest odontogram for patient
      const odontogram = await this.prisma.odontogram.findFirst({
        where: { patientId: appointment.patientId, tenantId },
        orderBy: { date: 'desc' },
        include: { teeth: true },
      });

      if (!odontogram || !dto.toothNumber) return;

      // Map procedure type to tooth condition
      const conditionMap: Record<string, string> = {
        EXTRACTION: 'MISSING',
        FILLING: 'FILLED',
        ROOT_CANAL: 'ROOT_CANAL',
        CROWN: 'CROWN',
      };

      const newCondition = conditionMap[dto.procedureType];
      if (!newCondition) return;

      const existingTooth = odontogram.teeth.find(t => t.toothNumber === dto.toothNumber);

      if (existingTooth) {
        await this.prisma.odontogramTooth.update({
          where: { id: existingTooth.id },
          data: {
            condition: newCondition as any,
            surfaces: (dto.surfaces || existingTooth.surfaces) as any,
          },
        });
      } else {
        await this.prisma.odontogramTooth.create({
          data: {
            odontogramId: odontogram.id,
            toothNumber: dto.toothNumber,
            condition: newCondition as any,
            surfaces: (dto.surfaces || []) as any,
          },
        });
      }
    } catch (error) {
      this.logger.warn('Failed to auto-update odontogram:', error);
    }
  }

  async findToday(providerId: string, tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.appointment.findMany({
      where: {
        providerId: providerId,
        tenantId,
        appointmentDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        id: true,
        appointmentDate: true,
        duration: true,
        status: true,
        procedureType: true,
        notes: true,
        clinicalNoteComplete: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { procedures: true },
        },
      },
      orderBy: {
        appointmentDate: 'asc',
      },
    });
  }

  async findUpcoming(providerId: string, tenantId: string, daysAhead: number = 7) {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    return this.prisma.appointment.findMany({
      where: {
        providerId: providerId,
        tenantId,
        appointmentDate: {
          gte: now,
          lte: endDate,
        },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
      },
      select: {
        id: true,
        appointmentDate: true,
        duration: true,
        status: true,
        procedureType: true,
        notes: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        appointmentDate: 'asc',
      },
    });
  }
}
