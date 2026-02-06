import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { CreateRoomRentalDto } from './dto/create-room-rental.dto';

interface TimeBlock {
  start: Date;
  end: Date;
}

export interface AvailableSlot {
  time: string;
  duration: number;
  roomId: string;
  roomName: string;
  clinicName: string;
  clinicId: string;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

@Injectable()
export class SchedulingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get available slots for a provider on a given date.
   *
   * Algorithm:
   * 1. Get all RoomAssignments for the provider that are active and cover the given date
   * 2. For each assignment, get the schedule for that day of week
   * 3. Get all existing appointments for the provider on that date
   * 4. Get all existing appointments for each room on that date
   * 5. If serviceId provided, get the MedicalService to know duration and requiredCapabilities,
   *    filter rooms that have those capabilities
   * 6. Calculate free slots by subtracting booked times (including bufferMinutes) from shift times
   * 7. Return array of { time, duration, roomId, roomName, clinicName, clinicId }
   */
  async getAvailableSlots(
    providerId: string,
    date: string,
    serviceId?: string,
    clinicId?: string,
  ): Promise<AvailableSlot[]> {
    const targetDate = new Date(date);
    const dayName = DAY_NAMES[targetDate.getDay()];

    // If serviceId provided, get the service to know duration and required capabilities
    let serviceDuration = 30; // default 30 min
    let requiredCapabilities: string[] = [];

    if (serviceId) {
      const service = await this.prisma.medicalService.findUnique({
        where: { id: serviceId },
      });
      if (!service) {
        throw new NotFoundException('Service not found');
      }
      serviceDuration = service.duration;
      requiredCapabilities = service.requiredCapabilities;
    }

    // 1. Get active RoomAssignments for this provider covering the target date
    const assignments = await this.prisma.roomAssignment.findMany({
      where: {
        providerId,
        isActive: true,
        startDate: { lte: targetDate },
        OR: [
          { endDate: null },
          { endDate: { gte: targetDate } },
        ],
      },
      include: {
        room: {
          include: {
            clinic: true,
          },
        },
      },
    });

    if (assignments.length === 0) {
      return [];
    }

    // Filter by clinicId if provided
    const filteredAssignments = clinicId
      ? assignments.filter((a) => a.room.clinic.id === clinicId)
      : assignments;

    if (filteredAssignments.length === 0) {
      return [];
    }

    // Filter rooms by required capabilities
    const capableAssignments = requiredCapabilities.length > 0
      ? filteredAssignments.filter((a) =>
          requiredCapabilities.every((cap) => a.room.capabilities.includes(cap)),
        )
      : filteredAssignments;

    if (capableAssignments.length === 0) {
      return [];
    }

    // 3. Get all existing appointments for the provider on that date
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const providerAppointments = await this.prisma.appointment.findMany({
      where: {
        providerId,
        status: AppointmentStatus.SCHEDULED,
        appointmentDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    // 4. Get all existing appointments for each room on that date
    const roomIds = capableAssignments.map((a) => a.roomId);
    const roomAppointments = await this.prisma.appointment.findMany({
      where: {
        roomId: { in: roomIds },
        status: AppointmentStatus.SCHEDULED,
        appointmentDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    // Build a map of room appointments
    const roomAppointmentMap = new Map<string, typeof roomAppointments>();
    for (const apt of roomAppointments) {
      if (!apt.roomId) continue;
      const existing = roomAppointmentMap.get(apt.roomId) || [];
      existing.push(apt);
      roomAppointmentMap.set(apt.roomId, existing);
    }

    // 6. For each assignment, calculate free slots
    const availableSlots: AvailableSlot[] = [];

    for (const assignment of capableAssignments) {
      const schedule = assignment.schedule as Record<string, { start: string; end: string }[]>;
      const daySchedule = schedule[dayName];

      if (!daySchedule || daySchedule.length === 0) {
        continue;
      }

      const bufferMinutes = assignment.room.bufferMinutes;

      for (const shift of daySchedule) {
        // Parse shift times into Date objects for the target date
        const shiftStart = this.parseTimeToDate(targetDate, shift.start);
        const shiftEnd = this.parseTimeToDate(targetDate, shift.end);

        // Collect all blocked times: provider appointments + room appointments (with buffer)
        const blockedTimes: TimeBlock[] = [];

        // Provider's appointments (blocks the provider regardless of room)
        for (const apt of providerAppointments) {
          blockedTimes.push({
            start: new Date(apt.appointmentDate),
            end: new Date(apt.appointmentDate.getTime() + (apt.duration + bufferMinutes) * 60000),
          });
        }

        // Room's appointments from other providers (blocks the room)
        const thisRoomApts = roomAppointmentMap.get(assignment.roomId) || [];
        for (const apt of thisRoomApts) {
          // Avoid double-counting if provider is the same
          if (apt.providerId === providerId) continue;
          blockedTimes.push({
            start: new Date(apt.appointmentDate),
            end: new Date(apt.appointmentDate.getTime() + (apt.duration + bufferMinutes) * 60000),
          });
        }

        // Sort blocked times by start
        blockedTimes.sort((a, b) => a.start.getTime() - b.start.getTime());

        // Calculate free windows
        const freeWindows = this.subtractBlocks(
          { start: shiftStart, end: shiftEnd },
          blockedTimes,
        );

        // Generate slots from free windows
        for (const window of freeWindows) {
          const windowDurationMs = window.end.getTime() - window.start.getTime();
          const windowDurationMin = windowDurationMs / 60000;

          if (windowDurationMin >= serviceDuration) {
            // Generate slots every 15 minutes within this free window
            let slotStart = new Date(window.start);
            while (slotStart.getTime() + serviceDuration * 60000 <= window.end.getTime()) {
              availableSlots.push({
                time: slotStart.toISOString(),
                duration: serviceDuration,
                roomId: assignment.room.id,
                roomName: assignment.room.name,
                clinicName: assignment.room.clinic.name,
                clinicId: assignment.room.clinic.id,
              });
              slotStart = new Date(slotStart.getTime() + 15 * 60000);
            }
          }
        }
      }
    }

    // Sort by time, then by room
    availableSlots.sort((a, b) => {
      const timeDiff = new Date(a.time).getTime() - new Date(b.time).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.roomName.localeCompare(b.roomName);
    });

    return availableSlots;
  }

  /**
   * Validate that an appointment slot is available.
   * Checks:
   * - Provider has no conflicting appointments
   * - Room has no conflicting appointments (with buffer)
   * - Provider has an active assignment in that room at that time
   */
  async validateAppointmentSlot(
    providerId: string,
    roomId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<{ valid: boolean; conflict?: string }> {
    // Get room for buffer config
    const room = await this.prisma.consultationRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return { valid: false, conflict: 'Consultation room not found' };
    }

    if (!room.isActive) {
      return { valid: false, conflict: 'Consultation room is not active' };
    }

    const bufferMinutes = room.bufferMinutes;
    const bufferedEnd = new Date(endTime.getTime() + bufferMinutes * 60000);

    // Check provider has an active assignment in this room at this time
    const dayName = DAY_NAMES[startTime.getDay()];
    const timeStr = this.formatTime(startTime);

    const assignment = await this.prisma.roomAssignment.findFirst({
      where: {
        roomId,
        providerId,
        isActive: true,
        startDate: { lte: startTime },
        OR: [
          { endDate: null },
          { endDate: { gte: startTime } },
        ],
      },
    });

    if (!assignment) {
      return { valid: false, conflict: 'Provider does not have an active assignment in this room for the given date' };
    }

    // Check the assignment schedule covers this time
    const schedule = assignment.schedule as Record<string, { start: string; end: string }[]>;
    const daySchedule = schedule[dayName];

    if (!daySchedule || daySchedule.length === 0) {
      return { valid: false, conflict: `Provider has no scheduled hours in this room on ${dayName}` };
    }

    const endTimeStr = this.formatTime(endTime);
    const withinShift = daySchedule.some(
      (shift) => timeStr >= shift.start && endTimeStr <= shift.end,
    );

    if (!withinShift) {
      return { valid: false, conflict: 'Appointment time is outside provider\'s scheduled hours in this room' };
    }

    // Check provider conflicts (any room) on the same day
    const dayStart = new Date(startTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(startTime);
    dayEnd.setHours(23, 59, 59, 999);

    const providerAppts = await this.prisma.appointment.findMany({
      where: {
        providerId,
        status: AppointmentStatus.SCHEDULED,
        appointmentDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    for (const apt of providerAppts) {
      const aptStart = new Date(apt.appointmentDate);
      const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);

      if (startTime < aptEnd && endTime > aptStart) {
        return {
          valid: false,
          conflict: `Provider has a conflicting appointment from ${aptStart.toISOString()} to ${aptEnd.toISOString()}`,
        };
      }
    }

    // Check room conflicts (with buffer) - appointments from ANY provider in this room
    const roomAppts = await this.prisma.appointment.findMany({
      where: {
        roomId,
        status: AppointmentStatus.SCHEDULED,
        appointmentDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    for (const apt of roomAppts) {
      const aptStart = new Date(apt.appointmentDate);
      const aptEndWithBuffer = new Date(aptStart.getTime() + (apt.duration + bufferMinutes) * 60000);

      // Check if new appointment (with buffer considered) overlaps
      if (startTime < aptEndWithBuffer && bufferedEnd > aptStart) {
        return {
          valid: false,
          conflict: `Room has a conflicting appointment from ${aptStart.toISOString()} to ${aptEndWithBuffer.toISOString()} (includes ${bufferMinutes}min buffer)`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Get all appointments for a room in a date range.
   */
  async getRoomCalendar(roomId: string, startDate: string, endDate: string) {
    const room = await this.prisma.consultationRoom.findUnique({
      where: { id: roomId },
      include: { clinic: true },
    });

    if (!room) {
      throw new NotFoundException('Consultation room not found');
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        roomId,
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.COMPLETED] },
        appointmentDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        id: true,
        appointmentDate: true,
        duration: true,
        status: true,
        procedureType: true,
        providerId: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { appointmentDate: 'asc' },
    });

    return {
      room: {
        id: room.id,
        name: room.name,
        floor: room.floor,
        roomNumber: room.roomNumber,
        bufferMinutes: room.bufferMinutes,
        clinic: {
          id: room.clinic.id,
          name: room.clinic.name,
        },
      },
      appointments,
    };
  }

  /**
   * Get all rooms with their appointments for a clinic on a given date.
   */
  async getClinicCalendar(clinicId: string, date: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        rooms: {
          where: { isActive: true },
          orderBy: [{ floor: 'asc' }, { name: 'asc' }],
        },
      },
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const roomsWithAppointments = await Promise.all(
      clinic.rooms.map(async (room) => {
        const appointments = await this.prisma.appointment.findMany({
          where: {
            roomId: room.id,
            status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.COMPLETED] },
            appointmentDate: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          select: {
            id: true,
            appointmentDate: true,
            duration: true,
            status: true,
            procedureType: true,
            providerId: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { appointmentDate: 'asc' },
        });

        // Get assignments for the day to show who is using the room
        const assignments = await this.prisma.roomAssignment.findMany({
          where: {
            roomId: room.id,
            isActive: true,
            startDate: { lte: dayEnd },
            OR: [
              { endDate: null },
              { endDate: { gte: dayStart } },
            ],
          },
          select: {
            id: true,
            providerId: true,
            schedule: true,
            assignmentType: true,
          },
        });

        return {
          id: room.id,
          name: room.name,
          floor: room.floor,
          roomNumber: room.roomNumber,
          bufferMinutes: room.bufferMinutes,
          capabilities: room.capabilities,
          appointments,
          assignments,
        };
      }),
    );

    return {
      clinic: {
        id: clinic.id,
        name: clinic.name,
        address: clinic.address,
      },
      date,
      rooms: roomsWithAppointments,
    };
  }

  /**
   * Request a room rental - creates a RoomAssignment with assignmentType='RENTAL'.
   */
  async requestRental(
    providerId: string,
    tenantId: string,
    dto: CreateRoomRentalDto,
  ) {
    // Verify room exists and is shared/available for rental
    const room = await this.prisma.consultationRoom.findUnique({
      where: { id: dto.roomId },
      include: { clinic: true },
    });

    if (!room) {
      throw new NotFoundException('Consultation room not found');
    }

    if (!room.isActive) {
      throw new BadRequestException('Consultation room is not active');
    }

    if (!room.isShared) {
      throw new BadRequestException('This consultation room is not available for sharing/rental');
    }

    if (!room.clinic.rentalEnabled) {
      throw new BadRequestException('This clinic does not have rental enabled');
    }

    // Verify there are no conflicting assignments for the same schedule slots
    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    const existingAssignments = await this.prisma.roomAssignment.findMany({
      where: {
        roomId: dto.roomId,
        isActive: true,
        startDate: { lte: endDate || new Date('2099-12-31') },
        OR: [
          { endDate: null },
          { endDate: { gte: startDate } },
        ],
      },
    });

    // Check for schedule overlap
    for (const existing of existingAssignments) {
      const existingSchedule = existing.schedule as Record<string, { start: string; end: string }[]>;
      for (const [day, slots] of Object.entries(dto.schedule)) {
        const existingSlots = existingSchedule[day];
        if (!existingSlots) continue;

        for (const newSlot of slots) {
          for (const existSlot of existingSlots) {
            if (newSlot.start < existSlot.end && newSlot.end > existSlot.start) {
              throw new BadRequestException(
                `Schedule conflict on ${day}: ${newSlot.start}-${newSlot.end} overlaps with existing assignment ${existSlot.start}-${existSlot.end}`,
              );
            }
          }
        }
      }
    }

    // Determine rental rate (use room's hourly rate if not specified)
    const rentalRate = dto.rentalRate ?? room.hourlyRate ?? room.clinic.rentalRateHourly;

    const assignment = await this.prisma.roomAssignment.create({
      data: {
        roomId: dto.roomId,
        providerId,
        tenantId,
        schedule: dto.schedule,
        startDate,
        endDate,
        assignmentType: dto.assignmentType || 'RENTAL',
        rentalRate,
        rentalPeriod: dto.rentalPeriod || 'HOURLY',
        isActive: true,
      },
      include: {
        room: {
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
      },
    });

    return assignment;
  }

  // ========================================
  // Helper methods
  // ========================================

  /**
   * Parse a time string (HH:MM) to a Date on the given target date.
   */
  private parseTimeToDate(targetDate: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const d = new Date(targetDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  /**
   * Format a Date to HH:MM string.
   */
  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  /**
   * Subtract blocked time blocks from a shift, returning remaining free windows.
   */
  private subtractBlocks(shift: TimeBlock, blocks: TimeBlock[]): TimeBlock[] {
    let freeWindows: TimeBlock[] = [{ start: new Date(shift.start), end: new Date(shift.end) }];

    for (const block of blocks) {
      const newFreeWindows: TimeBlock[] = [];

      for (const window of freeWindows) {
        // No overlap - keep window as-is
        if (block.end <= window.start || block.start >= window.end) {
          newFreeWindows.push(window);
          continue;
        }

        // Block starts after window start - keep the part before the block
        if (block.start > window.start) {
          newFreeWindows.push({ start: window.start, end: new Date(block.start) });
        }

        // Block ends before window end - keep the part after the block
        if (block.end < window.end) {
          newFreeWindows.push({ start: new Date(block.end), end: window.end });
        }
      }

      freeWindows = newFreeWindows;
    }

    return freeWindows;
  }
}
