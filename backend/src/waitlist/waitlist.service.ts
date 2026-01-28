import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { UpdateWaitlistDto } from './dto/update-waitlist.dto';
import { ContactWaitlistDto } from './dto/contact-waitlist.dto';
import { WaitlistStatus } from '@prisma/client';

@Injectable()
export class WaitlistService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateWaitlistDto, dentistId: string, tenantId: string) {
    // Verify patient-dentist relation
    const relation = await this.prisma.patientDentistRelation.findFirst({
      where: {
        patientId: createDto.patientId,
        dentistId: dentistId,
        isActive: true,
      },
    });

    if (!relation) {
      throw new ForbiddenException('Patient is not associated with this dentist');
    }

    return this.prisma.waitlist.create({
      data: {
        patientId: createDto.patientId,
        dentistId: dentistId,
        tenantId: tenantId,
        preferredDates: createDto.preferredDates.map(d => new Date(d)),
        preferredTimes: createDto.preferredTimes,
        procedureType: createDto.procedureType,
        duration: createDto.duration,
        priority: createDto.priority || 1,
        notes: createDto.notes,
        expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null,
        status: WaitlistStatus.WAITING,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(dentistId: string, tenantId: string, status?: WaitlistStatus) {
    const where: any = {
      dentistId: dentistId,
      tenantId: tenantId,
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.waitlist.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async findOne(id: string, dentistId: string, tenantId: string) {
    const waitlist = await this.prisma.waitlist.findFirst({
      where: {
        id: id,
        dentistId: dentistId,
        tenantId: tenantId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!waitlist) {
      throw new NotFoundException('Waitlist entry not found');
    }

    return waitlist;
  }

  async update(id: string, updateDto: UpdateWaitlistDto, dentistId: string, tenantId: string) {
    await this.findOne(id, dentistId, tenantId);

    const data: any = {};

    if (updateDto.preferredDates) {
      data.preferredDates = updateDto.preferredDates.map(d => new Date(d));
    }
    if (updateDto.preferredTimes) {
      data.preferredTimes = updateDto.preferredTimes;
    }
    if (updateDto.procedureType) {
      data.procedureType = updateDto.procedureType;
    }
    if (updateDto.duration) {
      data.duration = updateDto.duration;
    }
    if (updateDto.priority !== undefined) {
      data.priority = updateDto.priority;
    }
    if (updateDto.notes !== undefined) {
      data.notes = updateDto.notes;
    }
    if (updateDto.expiresAt) {
      data.expiresAt = new Date(updateDto.expiresAt);
    }
    if (updateDto.status) {
      data.status = updateDto.status;
    }

    return this.prisma.waitlist.update({
      where: { id },
      data,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  async contact(id: string, contactDto: ContactWaitlistDto, dentistId: string, tenantId: string) {
    await this.findOne(id, dentistId, tenantId);

    return this.prisma.waitlist.update({
      where: { id },
      data: {
        status: WaitlistStatus.CONTACTED,
        contactedAt: new Date(),
        notes: contactDto.notes || undefined,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  async schedule(id: string, appointmentId: string, dentistId: string, tenantId: string) {
    await this.findOne(id, dentistId, tenantId);

    // Verify appointment exists and belongs to dentist
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        dentistId: dentistId,
        tenantId: tenantId,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return this.prisma.waitlist.update({
      where: { id },
      data: {
        status: WaitlistStatus.SCHEDULED,
        scheduledAppointmentId: appointmentId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  async cancel(id: string, dentistId: string, tenantId: string) {
    await this.findOne(id, dentistId, tenantId);

    return this.prisma.waitlist.update({
      where: { id },
      data: {
        status: WaitlistStatus.CANCELLED,
      },
    });
  }

  async remove(id: string, dentistId: string, tenantId: string) {
    await this.findOne(id, dentistId, tenantId);

    return this.prisma.waitlist.delete({
      where: { id },
    });
  }

  // Find available slots for waitlist entries
  async findAvailableSlots(dentistId: string, tenantId: string, date: string) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all appointments for the day
    const appointments = await this.prisma.appointment.findMany({
      where: {
        dentistId: dentistId,
        tenantId: tenantId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: 'CANCELLED',
        },
      },
      orderBy: {
        appointmentDate: 'asc',
      },
    });

    // Simple slot calculation (8am to 6pm, 30-min slots)
    const workStart = 8; // 8am
    const workEnd = 18; // 6pm
    const slotDuration = 30; // minutes

    const availableSlots: string[] = [];
    
    for (let hour = workStart; hour < workEnd; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotTime = new Date(targetDate);
        slotTime.setHours(hour, minute, 0, 0);

        // Check if slot conflicts with any appointment
        const hasConflict = appointments.some(apt => {
          const aptStart = new Date(apt.appointmentDate);
          const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
          const slotEnd = new Date(slotTime.getTime() + slotDuration * 60000);

          return (slotTime >= aptStart && slotTime < aptEnd) ||
                 (slotEnd > aptStart && slotEnd <= aptEnd) ||
                 (slotTime <= aptStart && slotEnd >= aptEnd);
        });

        if (!hasConflict) {
          availableSlots.push(
            `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          );
        }
      }
    }

    return {
      date: targetDate.toISOString().split('T')[0],
      availableSlots,
      totalSlots: availableSlots.length,
    };
  }

  // Expire old waitlist entries
  async expireOldEntries() {
    const now = new Date();

    const result = await this.prisma.waitlist.updateMany({
      where: {
        status: WaitlistStatus.WAITING,
        expiresAt: {
          lte: now,
        },
      },
      data: {
        status: WaitlistStatus.EXPIRED,
      },
    });

    return {
      message: `Expired ${result.count} waitlist entries`,
      count: result.count,
    };
  }
}
