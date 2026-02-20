import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { SchedulingService } from '../scheduling/scheduling.service';

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
            in: [AppointmentStatus.SCHEDULED],
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
      include: {
        patient: {
          include: {
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
      },
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

  async findAll(providerId: string, tenantId: string, startDate?: string, endDate?: string) {
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

    // Optimized query with specific selects instead of full includes
    return this.prisma.appointment.findMany({
      where,
      select: {
        id: true,
        appointmentDate: true,
        duration: true,
        status: true,
        procedureType: true,
        notes: true,
        reminderSent: true,
        confirmedVia: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
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
      },
      orderBy: {
        appointmentDate: 'asc',
      },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        providerId: providerId,
        tenantId,
      },
      include: {
        patient: {
          include: {
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
      },
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
      include: {
        patient: {
          include: {
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
      },
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
      include: {
        patient: {
          include: {
            user: {
              select: {
                email: true,
                phone: true,
                name: true,
              },
            },
          },
        },
      },
    });
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
        status: AppointmentStatus.SCHEDULED,
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
