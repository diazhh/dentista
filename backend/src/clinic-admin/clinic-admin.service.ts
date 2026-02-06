import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateClinicAdminDto } from './dto/update-clinic.dto';
import { CreateClinicStaffDto } from './dto/create-clinic-staff.dto';
import { UpdateClinicStaffDto } from './dto/update-clinic-staff.dto';

@Injectable()
export class ClinicAdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolve the clinicId for the authenticated CLINIC_ADMIN user.
   * Throws ForbiddenException if user is not admin of any clinic.
   */
  async resolveClinicId(userId: string): Promise<string> {
    const clinic = await this.prisma.clinic.findFirst({
      where: { adminUserId: userId, isActive: true },
      select: { id: true },
    });

    if (!clinic) {
      throw new ForbiddenException(
        'You are not the administrator of any clinic',
      );
    }

    return clinic.id;
  }

  /**
   * Verify that the user is admin of the given clinic.
   */
  private async verifyClinicAdmin(
    clinicId: string,
    userId: string,
  ): Promise<void> {
    const clinic = await this.prisma.clinic.findFirst({
      where: { id: clinicId, adminUserId: userId, isActive: true },
    });

    if (!clinic) {
      throw new ForbiddenException(
        'You are not the administrator of this clinic',
      );
    }
  }

  // ==========================================
  // Dashboard
  // ==========================================

  async getDashboard(clinicId: string) {
    const [clinic, rooms, staff, activeAssignments] = await Promise.all([
      this.prisma.clinic.findUnique({
        where: { id: clinicId },
        include: {
          rooms: { where: { isActive: true } },
          clinicStaff: { where: { isActive: true } },
        },
      }),
      this.prisma.consultationRoom.count({
        where: { clinicId, isActive: true },
      }),
      this.prisma.clinicStaff.count({
        where: { clinicId, isActive: true },
      }),
      this.prisma.roomAssignment.count({
        where: {
          room: { clinicId },
          isActive: true,
        },
      }),
    ]);

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    const totalRooms = rooms;
    const assignedRooms = await this.prisma.consultationRoom.count({
      where: {
        clinicId,
        isActive: true,
        roomAssignments: {
          some: { isActive: true },
        },
      },
    });

    const occupancyPercentage =
      totalRooms > 0 ? Math.round((assignedRooms / totalRooms) * 100) : 0;

    // Revenue from active rental assignments
    const rentalAssignments = await this.prisma.roomAssignment.findMany({
      where: {
        room: { clinicId },
        isActive: true,
        rentalRate: { not: null },
      },
      select: {
        rentalRate: true,
        rentalPeriod: true,
      },
    });

    const estimatedMonthlyRevenue = rentalAssignments.reduce((total, ra) => {
      if (!ra.rentalRate) return total;
      switch (ra.rentalPeriod) {
        case 'HOURLY':
          return total + ra.rentalRate * 160; // ~160 working hours/month
        case 'DAILY':
          return total + ra.rentalRate * 22; // ~22 working days/month
        case 'MONTHLY':
          return total + ra.rentalRate;
        default:
          return total + ra.rentalRate;
      }
    }, 0);

    // Pending rental requests (assignments that are not yet active)
    const pendingRequests = await this.prisma.roomAssignment.count({
      where: {
        room: { clinicId },
        isActive: false,
        assignmentType: 'RENTAL_REQUEST',
      },
    });

    return {
      clinicName: clinic.name,
      occupancy: {
        totalRooms,
        assignedRooms,
        availableRooms: totalRooms - assignedRooms,
        occupancyPercentage,
      },
      revenue: {
        estimatedMonthlyRevenue,
        activeRentals: rentalAssignments.length,
      },
      staff: {
        totalStaff: staff,
      },
      activeAssignments,
      pendingRequests,
    };
  }

  // ==========================================
  // Clinic Management
  // ==========================================

  async getClinic(clinicId: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        rooms: {
          where: { isActive: true },
          orderBy: { roomNumber: 'asc' },
        },
        clinicStaff: {
          where: { isActive: true },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    return clinic;
  }

  async updateClinic(clinicId: string, dto: UpdateClinicAdminDto) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    return this.prisma.clinic.update({
      where: { id: clinicId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        ...(dto.businessHours !== undefined && {
          businessHours: dto.businessHours,
        }),
        ...(dto.specialties !== undefined && { specialties: dto.specialties }),
        ...(dto.amenities !== undefined && { amenities: dto.amenities }),
        ...(dto.rentalEnabled !== undefined && {
          rentalEnabled: dto.rentalEnabled,
        }),
        ...(dto.rentalRateHourly !== undefined && {
          rentalRateHourly: dto.rentalRateHourly,
        }),
        ...(dto.rentalRateDaily !== undefined && {
          rentalRateDaily: dto.rentalRateDaily,
        }),
        ...(dto.rentalRateMonthly !== undefined && {
          rentalRateMonthly: dto.rentalRateMonthly,
        }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
    });
  }

  // ==========================================
  // Consultation Rooms
  // ==========================================

  async getRooms(clinicId: string) {
    return this.prisma.consultationRoom.findMany({
      where: { clinicId, isActive: true },
      include: {
        roomAssignments: {
          where: { isActive: true },
          select: {
            id: true,
            providerId: true,
            schedule: true,
            startDate: true,
            endDate: true,
            assignmentType: true,
            rentalRate: true,
            rentalPeriod: true,
          },
        },
      },
      orderBy: { roomNumber: 'asc' },
    });
  }

  async getRoomSchedule(clinicId: string, roomId: string, date: string) {
    // Verify room belongs to this clinic
    const room = await this.prisma.consultationRoom.findFirst({
      where: { id: roomId, clinicId, isActive: true },
    });

    if (!room) {
      throw new NotFoundException(
        'Room not found or does not belong to this clinic',
      );
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [assignments, appointments] = await Promise.all([
      this.prisma.roomAssignment.findMany({
        where: {
          roomId,
          isActive: true,
          startDate: { lte: endOfDay },
          OR: [{ endDate: null }, { endDate: { gte: startOfDay } }],
        },
        select: {
          id: true,
          providerId: true,
          schedule: true,
          assignmentType: true,
          rentalRate: true,
        },
      }),
      this.prisma.appointment.findMany({
        where: {
          roomId,
          appointmentDate: { gte: startOfDay, lte: endOfDay },
          status: { not: 'CANCELLED' },
        },
        select: {
          id: true,
          providerId: true,
          appointmentDate: true,
          duration: true,
          procedureType: true,
          status: true,
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { appointmentDate: 'asc' },
      }),
    ]);

    return {
      room,
      date: targetDate.toISOString().split('T')[0],
      assignments,
      appointments,
    };
  }

  // ==========================================
  // Reports
  // ==========================================

  async getOccupancyReport(clinicId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const rooms = await this.prisma.consultationRoom.findMany({
      where: { clinicId, isActive: true },
      include: {
        roomAssignments: {
          where: {
            isActive: true,
            startDate: { lte: end },
            OR: [{ endDate: null }, { endDate: { gte: start } }],
          },
        },
        appointments: {
          where: {
            appointmentDate: { gte: start, lte: end },
            status: { not: 'CANCELLED' },
          },
        },
      },
    });

    const roomStats = rooms.map((room) => {
      const totalAppointments = room.appointments.length;
      const totalHoursBooked = room.appointments.reduce(
        (sum, apt) => sum + apt.duration / 60,
        0,
      );

      // Calculate total available hours in period
      const daysDiff = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
      const totalAvailableHours = daysDiff * room.maxDailyHours;

      const utilizationPercentage =
        totalAvailableHours > 0
          ? Math.round((totalHoursBooked / totalAvailableHours) * 100)
          : 0;

      return {
        roomId: room.id,
        roomName: room.name,
        roomNumber: room.roomNumber,
        totalAppointments,
        totalHoursBooked: Math.round(totalHoursBooked * 100) / 100,
        totalAvailableHours,
        utilizationPercentage: Math.min(utilizationPercentage, 100),
        activeAssignments: room.roomAssignments.length,
      };
    });

    const averageUtilization =
      roomStats.length > 0
        ? Math.round(
            roomStats.reduce((sum, r) => sum + r.utilizationPercentage, 0) /
              roomStats.length,
          )
        : 0;

    return {
      period: { startDate, endDate },
      summary: {
        totalRooms: rooms.length,
        averageUtilization,
        totalAppointments: roomStats.reduce(
          (sum, r) => sum + r.totalAppointments,
          0,
        ),
      },
      rooms: roomStats,
    };
  }

  async getRevenueReport(clinicId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const rentalAssignments = await this.prisma.roomAssignment.findMany({
      where: {
        room: { clinicId },
        isActive: true,
        rentalRate: { not: null },
        startDate: { lte: end },
        OR: [{ endDate: null }, { endDate: { gte: start } }],
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
          },
        },
      },
    });

    const revenueByRoom: Record<
      string,
      { roomName: string; roomNumber: string | null; totalRevenue: number; rentalCount: number }
    > = {};

    let totalRevenue = 0;

    rentalAssignments.forEach((ra) => {
      const roomKey = ra.room.id;
      if (!revenueByRoom[roomKey]) {
        revenueByRoom[roomKey] = {
          roomName: ra.room.name,
          roomNumber: ra.room.roomNumber,
          totalRevenue: 0,
          rentalCount: 0,
        };
      }

      // Calculate revenue for the period
      const overlapStart = new Date(
        Math.max(start.getTime(), ra.startDate.getTime()),
      );
      const overlapEnd = ra.endDate
        ? new Date(Math.min(end.getTime(), ra.endDate.getTime()))
        : end;
      const overlapDays = Math.ceil(
        (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24),
      );

      let revenue = 0;
      if (ra.rentalRate) {
        switch (ra.rentalPeriod) {
          case 'HOURLY':
            revenue = ra.rentalRate * 8 * overlapDays; // 8 hours/day
            break;
          case 'DAILY':
            revenue = ra.rentalRate * overlapDays;
            break;
          case 'MONTHLY':
            revenue = ra.rentalRate * (overlapDays / 30);
            break;
          default:
            revenue = ra.rentalRate * overlapDays;
        }
      }

      revenueByRoom[roomKey].totalRevenue += revenue;
      revenueByRoom[roomKey].rentalCount += 1;
      totalRevenue += revenue;
    });

    return {
      period: { startDate, endDate },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        activeRentals: rentalAssignments.length,
      },
      rooms: Object.entries(revenueByRoom).map(([roomId, data]) => ({
        roomId,
        ...data,
        totalRevenue: Math.round(data.totalRevenue * 100) / 100,
      })),
    };
  }

  // ==========================================
  // Staff Management
  // ==========================================

  async getStaff(clinicId: string) {
    return this.prisma.clinicStaff.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addStaff(clinicId: string, dto: CreateClinicStaffDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if staff member already exists for this clinic
    const existing = await this.prisma.clinicStaff.findUnique({
      where: {
        clinicId_userId: {
          clinicId,
          userId: dto.userId,
        },
      },
    });

    if (existing) {
      if (existing.isActive) {
        throw new BadRequestException(
          'This user is already a staff member of this clinic',
        );
      }
      // Reactivate
      return this.prisma.clinicStaff.update({
        where: { id: existing.id },
        data: { isActive: true, role: dto.role },
      });
    }

    return this.prisma.clinicStaff.create({
      data: {
        clinicId,
        userId: dto.userId,
        role: dto.role,
      },
    });
  }

  async updateStaff(clinicId: string, staffId: string, dto: UpdateClinicStaffDto) {
    const staff = await this.prisma.clinicStaff.findFirst({
      where: { id: staffId, clinicId },
    });

    if (!staff) {
      throw new NotFoundException(
        'Staff member not found in this clinic',
      );
    }

    return this.prisma.clinicStaff.update({
      where: { id: staffId },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async removeStaff(clinicId: string, staffId: string) {
    const staff = await this.prisma.clinicStaff.findFirst({
      where: { id: staffId, clinicId },
    });

    if (!staff) {
      throw new NotFoundException(
        'Staff member not found in this clinic',
      );
    }

    return this.prisma.clinicStaff.update({
      where: { id: staffId },
      data: { isActive: false },
    });
  }

  // ==========================================
  // Rental Requests
  // ==========================================

  async getRentalRequests(clinicId: string) {
    return this.prisma.roomAssignment.findMany({
      where: {
        room: { clinicId },
        assignmentType: 'RENTAL_REQUEST',
        isActive: false,
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveRental(clinicId: string, requestId: string) {
    const request = await this.prisma.roomAssignment.findFirst({
      where: {
        id: requestId,
        room: { clinicId },
        assignmentType: 'RENTAL_REQUEST',
      },
      include: { room: true },
    });

    if (!request) {
      throw new NotFoundException(
        'Rental request not found for this clinic',
      );
    }

    if (request.isActive) {
      throw new BadRequestException(
        'This rental request has already been approved',
      );
    }

    return this.prisma.roomAssignment.update({
      where: { id: requestId },
      data: {
        isActive: true,
        assignmentType: 'RENTAL',
      },
    });
  }

  async rejectRental(clinicId: string, requestId: string) {
    const request = await this.prisma.roomAssignment.findFirst({
      where: {
        id: requestId,
        room: { clinicId },
        assignmentType: 'RENTAL_REQUEST',
      },
    });

    if (!request) {
      throw new NotFoundException(
        'Rental request not found for this clinic',
      );
    }

    return this.prisma.roomAssignment.delete({
      where: { id: requestId },
    });
  }
}
