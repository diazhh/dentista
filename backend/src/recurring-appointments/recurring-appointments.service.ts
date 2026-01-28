import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringAppointmentDto } from './dto/create-recurring-appointment.dto';
import { UpdateRecurringAppointmentDto } from './dto/update-recurring-appointment.dto';
import { RecurrenceFrequency } from '@prisma/client';

@Injectable()
export class RecurringAppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateRecurringAppointmentDto, dentistId: string, tenantId: string) {
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

    // Create recurring appointment
    const recurring = await this.prisma.recurringAppointment.create({
      data: {
        patientId: createDto.patientId,
        dentistId: dentistId,
        tenantId: tenantId,
        operatoryId: createDto.operatoryId,
        frequency: createDto.frequency,
        interval: createDto.interval || 1,
        startDate: new Date(createDto.startDate),
        endDate: createDto.endDate ? new Date(createDto.endDate) : null,
        duration: createDto.duration,
        procedureType: createDto.procedureType,
        notes: createDto.notes,
        timeOfDay: createDto.timeOfDay,
        daysOfWeek: createDto.daysOfWeek,
      },
    });

    // Generate initial appointments (next 3 months)
    await this.generateAppointments(recurring.id, dentistId, tenantId);

    return this.findOne(recurring.id, dentistId, tenantId);
  }

  async findAll(dentistId: string, tenantId: string, patientId?: string) {
    const where: any = {
      dentistId: dentistId,
      tenantId: tenantId,
      isActive: true,
    };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.recurringAppointment.findMany({
      where,
      include: {
        appointments: {
          where: {
            appointmentDate: {
              gte: new Date(),
            },
          },
          orderBy: {
            appointmentDate: 'asc',
          },
          take: 5,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, dentistId: string, tenantId: string) {
    const recurring = await this.prisma.recurringAppointment.findFirst({
      where: {
        id: id,
        dentistId: dentistId,
        tenantId: tenantId,
      },
      include: {
        appointments: {
          orderBy: {
            appointmentDate: 'asc',
          },
        },
      },
    });

    if (!recurring) {
      throw new NotFoundException('Recurring appointment not found');
    }

    return recurring;
  }

  async update(id: string, updateDto: UpdateRecurringAppointmentDto, dentistId: string, tenantId: string) {
    await this.findOne(id, dentistId, tenantId);

    const updated = await this.prisma.recurringAppointment.update({
      where: { id },
      data: {
        operatoryId: updateDto.operatoryId,
        frequency: updateDto.frequency,
        interval: updateDto.interval,
        endDate: updateDto.endDate ? new Date(updateDto.endDate) : undefined,
        duration: updateDto.duration,
        procedureType: updateDto.procedureType,
        notes: updateDto.notes,
        timeOfDay: updateDto.timeOfDay,
        daysOfWeek: updateDto.daysOfWeek,
      },
    });

    // Regenerate future appointments if pattern changed
    if (updateDto.frequency || updateDto.interval || updateDto.timeOfDay || updateDto.daysOfWeek) {
      await this.regenerateFutureAppointments(id, dentistId, tenantId);
    }

    return this.findOne(id, dentistId, tenantId);
  }

  async remove(id: string, dentistId: string, tenantId: string) {
    await this.findOne(id, dentistId, tenantId);

    // Soft delete recurring appointment
    await this.prisma.recurringAppointment.update({
      where: { id },
      data: { isActive: false },
    });

    // Cancel future appointments
    await this.prisma.appointment.updateMany({
      where: {
        recurringId: id,
        appointmentDate: {
          gte: new Date(),
        },
        status: 'SCHEDULED',
      },
      data: {
        status: 'CANCELLED',
      },
    });

    return { message: 'Recurring appointment cancelled successfully' };
  }

  // Generate appointments for the next 3 months
  async generateAppointments(recurringId: string, dentistId: string, tenantId: string) {
    const recurring = await this.prisma.recurringAppointment.findUnique({
      where: { id: recurringId },
    });

    if (!recurring || !recurring.isActive) {
      return;
    }

    const appointments = this.calculateOccurrences(recurring, 3);

    for (const appointmentDate of appointments) {
      // Check if appointment already exists
      const existing = await this.prisma.appointment.findFirst({
        where: {
          recurringId: recurringId,
          appointmentDate: appointmentDate,
        },
      });

      if (!existing) {
        await this.prisma.appointment.create({
          data: {
            patientId: recurring.patientId,
            dentistId: dentistId,
            tenantId: tenantId,
            operatoryId: recurring.operatoryId,
            recurringId: recurringId,
            appointmentDate: appointmentDate,
            duration: recurring.duration,
            procedureType: recurring.procedureType,
            notes: recurring.notes,
            status: 'SCHEDULED',
          },
        });
      }
    }
  }

  // Regenerate future appointments (delete and recreate)
  private async regenerateFutureAppointments(recurringId: string, dentistId: string, tenantId: string) {
    // Delete future scheduled appointments
    await this.prisma.appointment.deleteMany({
      where: {
        recurringId: recurringId,
        appointmentDate: {
          gte: new Date(),
        },
        status: 'SCHEDULED',
      },
    });

    // Generate new appointments
    await this.generateAppointments(recurringId, dentistId, tenantId);
  }

  // Calculate occurrence dates based on recurrence pattern
  private calculateOccurrences(recurring: any, months: number): Date[] {
    const occurrences: Date[] = [];
    const startDate = new Date(recurring.startDate);
    const endDate = recurring.endDate ? new Date(recurring.endDate) : null;
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + months);

    const [hours, minutes] = recurring.timeOfDay.split(':').map(Number);

    let currentDate = new Date(startDate);
    currentDate.setHours(hours, minutes, 0, 0);

    // Ensure we start from today or later
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (currentDate < today) {
      currentDate = new Date(today);
      currentDate.setHours(hours, minutes, 0, 0);
    }

    while (currentDate <= maxDate && (!endDate || currentDate <= endDate)) {
      if (this.matchesRecurrencePattern(currentDate, recurring)) {
        occurrences.push(new Date(currentDate));
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return occurrences;
  }

  private matchesRecurrencePattern(date: Date, recurring: any): boolean {
    const dayOfWeek = date.getDay();

    // Check if day of week matches
    if (!recurring.daysOfWeek.includes(dayOfWeek)) {
      return false;
    }

    const startDate = new Date(recurring.startDate);
    const diffTime = Math.abs(date.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (recurring.frequency) {
      case RecurrenceFrequency.DAILY:
        return diffDays % recurring.interval === 0;
      
      case RecurrenceFrequency.WEEKLY:
        const diffWeeks = Math.floor(diffDays / 7);
        return diffWeeks % recurring.interval === 0;
      
      case RecurrenceFrequency.BIWEEKLY:
        const diffBiweeks = Math.floor(diffDays / 14);
        return diffBiweeks % recurring.interval === 0;
      
      case RecurrenceFrequency.MONTHLY:
        const monthsDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + 
                          (date.getMonth() - startDate.getMonth());
        return monthsDiff % recurring.interval === 0 && date.getDate() === startDate.getDate();
      
      case RecurrenceFrequency.QUARTERLY:
        const quartersDiff = Math.floor(
          ((date.getFullYear() - startDate.getFullYear()) * 12 + 
           (date.getMonth() - startDate.getMonth())) / 3
        );
        return quartersDiff % recurring.interval === 0 && date.getDate() === startDate.getDate();
      
      case RecurrenceFrequency.YEARLY:
        const yearsDiff = date.getFullYear() - startDate.getFullYear();
        return yearsDiff % recurring.interval === 0 && 
               date.getMonth() === startDate.getMonth() && 
               date.getDate() === startDate.getDate();
      
      default:
        return false;
    }
  }
}
