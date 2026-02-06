import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { CreateConsultationRoomDto } from './dto/create-consultation-room.dto';
import { UpdateConsultationRoomDto } from './dto/update-consultation-room.dto';
import { AssignRoomDto } from './dto/assign-room.dto';

@Injectable()
export class ClinicsService {
  constructor(private prisma: PrismaService) {}

  // Clinics CRUD
  async createClinic(createClinicDto: CreateClinicDto, createdBy: string) {
    return this.prisma.clinic.create({
      data: {
        ...createClinicDto,
        createdBy,
      },
      include: {
        rooms: true,
      },
    });
  }

  async findAllClinics() {
    return this.prisma.clinic.findMany({
      where: { isActive: true },
      include: {
        rooms: {
          where: { isActive: true },
        },
      },
    });
  }

  async findOneClinic(id: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
      include: {
        rooms: {
          where: { isActive: true },
          include: {
            roomAssignments: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    return clinic;
  }

  async updateClinic(id: string, updateClinicDto: UpdateClinicDto) {
    await this.findOneClinic(id);

    return this.prisma.clinic.update({
      where: { id },
      data: updateClinicDto,
      include: {
        rooms: true,
      },
    });
  }

  async removeClinic(id: string) {
    await this.findOneClinic(id);

    return this.prisma.clinic.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Consultation Rooms CRUD
  async createConsultationRoom(createConsultationRoomDto: CreateConsultationRoomDto) {
    // Verify clinic exists
    await this.findOneClinic(createConsultationRoomDto.clinicId);

    return this.prisma.consultationRoom.create({
      data: createConsultationRoomDto,
      include: {
        clinic: true,
      },
    });
  }

  async findAllConsultationRooms(clinicId?: string) {
    const where: any = { isActive: true };
    if (clinicId) {
      where.clinicId = clinicId;
    }

    return this.prisma.consultationRoom.findMany({
      where,
      include: {
        clinic: true,
        roomAssignments: {
          where: { isActive: true },
        },
      },
    });
  }

  async findOneConsultationRoom(id: string) {
    const room = await this.prisma.consultationRoom.findUnique({
      where: { id },
      include: {
        clinic: true,
        roomAssignments: {
          where: { isActive: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Consultation room not found');
    }

    return room;
  }

  async updateConsultationRoom(id: string, updateConsultationRoomDto: UpdateConsultationRoomDto) {
    await this.findOneConsultationRoom(id);

    return this.prisma.consultationRoom.update({
      where: { id },
      data: updateConsultationRoomDto,
      include: {
        clinic: true,
      },
    });
  }

  async removeConsultationRoom(id: string) {
    await this.findOneConsultationRoom(id);

    return this.prisma.consultationRoom.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Room Assignments
  async assignRoom(assignRoomDto: AssignRoomDto) {
    // Verify consultation room exists
    await this.findOneConsultationRoom(assignRoomDto.roomId);

    // Verify provider exists
    const provider = await this.prisma.user.findUnique({
      where: { id: assignRoomDto.providerId },
      include: { ownedTenants: true },
    });

    if (!provider || provider.role !== 'PROVIDER') {
      throw new NotFoundException('Provider not found');
    }

    if (!provider.ownedTenants || provider.ownedTenants.length === 0) {
      throw new ForbiddenException('Provider does not have a tenant');
    }

    const tenantId = provider.ownedTenants[0].id;

    return this.prisma.roomAssignment.create({
      data: {
        roomId: assignRoomDto.roomId,
        providerId: assignRoomDto.providerId,
        tenantId: tenantId,
        schedule: assignRoomDto.schedule,
        startDate: new Date(assignRoomDto.startDate),
        endDate: assignRoomDto.endDate ? new Date(assignRoomDto.endDate) : null,
      },
      include: {
        room: {
          include: {
            clinic: true,
          },
        },
      },
    });
  }

  async findRoomAssignments(roomId?: string, providerId?: string) {
    const where: any = { isActive: true };
    if (roomId) {
      where.roomId = roomId;
    }
    if (providerId) {
      where.providerId = providerId;
    }

    return this.prisma.roomAssignment.findMany({
      where,
      include: {
        room: {
          include: {
            clinic: true,
          },
        },
      },
    });
  }

  async removeRoomAssignment(id: string) {
    const assignment = await this.prisma.roomAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException('Room assignment not found');
    }

    return this.prisma.roomAssignment.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats() {
    // Obtener estadisticas generales de clinicas
    const [
      totalClinics,
      activeClinics,
      totalRooms,
      activeRooms,
      totalAssignments,
      activeAssignments,
    ] = await Promise.all([
      this.prisma.clinic.count(),
      this.prisma.clinic.count({ where: { isActive: true } }),
      this.prisma.consultationRoom.count(),
      this.prisma.consultationRoom.count({ where: { isActive: true } }),
      this.prisma.roomAssignment.count(),
      this.prisma.roomAssignment.count({ where: { isActive: true } }),
    ]);

    // Obtener clinicas con conteo de consultorios
    const clinicsWithRooms = await this.prisma.clinic.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    });

    // Obtener distribucion de consultorios por piso
    const rooms = await this.prisma.consultationRoom.findMany({
      where: { isActive: true },
      select: { floor: true },
    });

    const roomsByFloor = rooms.reduce((acc, room) => {
      const floor = `Piso ${room.floor}`;
      acc[floor] = (acc[floor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      overview: {
        totalClinics,
        activeClinics,
        inactiveClinics: totalClinics - activeClinics,
        totalRooms,
        activeRooms,
        inactiveRooms: totalRooms - activeRooms,
        totalAssignments,
        activeAssignments,
      },
      clinicsWithRooms: clinicsWithRooms.map(c => ({
        id: c.id,
        name: c.name,
        roomCount: c._count.rooms,
      })),
      roomsByFloor: Object.entries(roomsByFloor).map(([floor, count]) => ({
        floor,
        count,
      })),
    };
  }
}
