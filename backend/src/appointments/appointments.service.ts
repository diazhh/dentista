import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto, dentistId: string, tenantId: string) {
    // Verify patient has relation with this dentist
    const patientRelation = await this.prisma.patientDentistRelation.findFirst({
      where: {
        patientId: createAppointmentDto.patientId,
        dentistId: dentistId,
        isActive: true,
      },
    });

    if (!patientRelation) {
      throw new ForbiddenException('Patient is not associated with this dentist');
    }

    // If operatory is specified, verify dentist has access
    if (createAppointmentDto.operatoryId) {
      const operatoryAssignment = await this.prisma.operatoryAssignment.findFirst({
        where: {
          operatoryId: createAppointmentDto.operatoryId,
          dentistId: dentistId,
          isActive: true,
        },
      });

      if (!operatoryAssignment) {
        throw new ForbiddenException('Dentist does not have access to this operatory');
      }
    }

    // Check for scheduling conflicts
    const appointmentDate = new Date(createAppointmentDto.appointmentDate);
    const endTime = new Date(appointmentDate.getTime() + createAppointmentDto.duration * 60000);

    const conflicts = await this.prisma.appointment.findMany({
      where: {
        dentistId: dentistId,
        tenantId: tenantId, // Agregado: validación de tenant
        operatoryId: createAppointmentDto.operatoryId || undefined,
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

    // Simple conflict check (can be enhanced)
    for (const conflict of conflicts) {
      const conflictEnd = new Date(conflict.appointmentDate.getTime() + conflict.duration * 60000);
      if (
        (appointmentDate >= conflict.appointmentDate && appointmentDate < conflictEnd) ||
        (endTime > conflict.appointmentDate && endTime <= conflictEnd)
      ) {
        throw new BadRequestException('Time slot conflicts with existing appointment');
      }
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        ...createAppointmentDto,
        dentistId,
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
        operatory: {
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
      console.error('Failed to send notifications:', error);
    }

    return appointment;
  }

  async findAll(dentistId: string, tenantId: string, startDate?: string, endDate?: string) {
    const where: any = {
      dentistId,
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
        operatory: {
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

  async findOne(id: string, dentistId: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        dentistId,
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
        operatory: {
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

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto, dentistId: string, tenantId: string) {
    await this.findOne(id, dentistId, tenantId);

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
        operatory: {
          include: {
            clinic: true,
          },
        },
      },
    });
  }

  async remove(id: string, dentistId: string, tenantId: string) {
    await this.findOne(id, dentistId, tenantId);

    return this.prisma.appointment.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: AppointmentStatus, dentistId: string, tenantId: string) {
    await this.findOne(id, dentistId, tenantId);

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
}
