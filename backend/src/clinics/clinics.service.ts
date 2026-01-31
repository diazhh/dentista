import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { CreateOperatoryDto } from './dto/create-operatory.dto';
import { UpdateOperatoryDto } from './dto/update-operatory.dto';
import { AssignOperatoryDto } from './dto/assign-operatory.dto';

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
        operatories: true,
      },
    });
  }

  async findAllClinics() {
    return this.prisma.clinic.findMany({
      where: { isActive: true },
      include: {
        operatories: {
          where: { isActive: true },
        },
      },
    });
  }

  async findOneClinic(id: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
      include: {
        operatories: {
          where: { isActive: true },
          include: {
            operatoryAssignments: {
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
        operatories: true,
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

  // Operatories CRUD
  async createOperatory(createOperatoryDto: CreateOperatoryDto) {
    // Verify clinic exists
    await this.findOneClinic(createOperatoryDto.clinicId);

    return this.prisma.operatory.create({
      data: createOperatoryDto,
      include: {
        clinic: true,
      },
    });
  }

  async findAllOperatories(clinicId?: string) {
    const where: any = { isActive: true };
    if (clinicId) {
      where.clinicId = clinicId;
    }

    return this.prisma.operatory.findMany({
      where,
      include: {
        clinic: true,
        operatoryAssignments: {
          where: { isActive: true },
        },
      },
    });
  }

  async findOneOperatory(id: string) {
    const operatory = await this.prisma.operatory.findUnique({
      where: { id },
      include: {
        clinic: true,
        operatoryAssignments: {
          where: { isActive: true },
        },
      },
    });

    if (!operatory) {
      throw new NotFoundException('Operatory not found');
    }

    return operatory;
  }

  async updateOperatory(id: string, updateOperatoryDto: UpdateOperatoryDto) {
    await this.findOneOperatory(id);

    return this.prisma.operatory.update({
      where: { id },
      data: updateOperatoryDto,
      include: {
        clinic: true,
      },
    });
  }

  async removeOperatory(id: string) {
    await this.findOneOperatory(id);

    return this.prisma.operatory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Operatory Assignments
  async assignOperatory(assignOperatoryDto: AssignOperatoryDto) {
    // Verify operatory exists
    await this.findOneOperatory(assignOperatoryDto.operatoryId);

    // Verify dentist exists
    const dentist = await this.prisma.user.findUnique({
      where: { id: assignOperatoryDto.dentistId },
      include: { ownedTenants: true },
    });

    if (!dentist || dentist.role !== 'DENTIST') {
      throw new NotFoundException('Dentist not found');
    }

    if (!dentist.ownedTenants || dentist.ownedTenants.length === 0) {
      throw new ForbiddenException('Dentist does not have a tenant');
    }

    const tenantId = dentist.ownedTenants[0].id;

    return this.prisma.operatoryAssignment.create({
      data: {
        operatoryId: assignOperatoryDto.operatoryId,
        dentistId: assignOperatoryDto.dentistId,
        tenantId: tenantId,
        schedule: assignOperatoryDto.schedule,
        startDate: new Date(assignOperatoryDto.startDate),
        endDate: assignOperatoryDto.endDate ? new Date(assignOperatoryDto.endDate) : null,
      },
      include: {
        operatory: {
          include: {
            clinic: true,
          },
        },
      },
    });
  }

  async findOperatoryAssignments(operatoryId?: string, dentistId?: string) {
    const where: any = { isActive: true };
    if (operatoryId) {
      where.operatoryId = operatoryId;
    }
    if (dentistId) {
      where.dentistId = dentistId;
    }

    return this.prisma.operatoryAssignment.findMany({
      where,
      include: {
        operatory: {
          include: {
            clinic: true,
          },
        },
      },
    });
  }

  async removeOperatoryAssignment(id: string) {
    const assignment = await this.prisma.operatoryAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException('Operatory assignment not found');
    }

    return this.prisma.operatoryAssignment.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats() {
    // Obtener estadísticas generales de clínicas
    const [
      totalClinics,
      activeClinics,
      totalOperatories,
      activeOperatories,
      totalAssignments,
      activeAssignments,
    ] = await Promise.all([
      this.prisma.clinic.count(),
      this.prisma.clinic.count({ where: { isActive: true } }),
      this.prisma.operatory.count(),
      this.prisma.operatory.count({ where: { isActive: true } }),
      this.prisma.operatoryAssignment.count(),
      this.prisma.operatoryAssignment.count({ where: { isActive: true } }),
    ]);

    // Obtener clínicas con conteo de operatorios
    const clinicsWithOperatories = await this.prisma.clinic.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            operatories: true,
          },
        },
      },
    });

    // Obtener distribución de operatorios por piso
    const operatories = await this.prisma.operatory.findMany({
      where: { isActive: true },
      select: { floor: true },
    });

    const operatoriesByFloor = operatories.reduce((acc, op) => {
      const floor = `Piso ${op.floor}`;
      acc[floor] = (acc[floor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      overview: {
        totalClinics,
        activeClinics,
        inactiveClinics: totalClinics - activeClinics,
        totalOperatories,
        activeOperatories,
        inactiveOperatories: totalOperatories - activeOperatories,
        totalAssignments,
        activeAssignments,
      },
      clinicsWithOperatories: clinicsWithOperatories.map(c => ({
        id: c.id,
        name: c.name,
        operatoryCount: c._count.operatories,
      })),
      operatoriesByFloor: Object.entries(operatoriesByFloor).map(([floor, count]) => ({
        floor,
        count,
      })),
    };
  }
}
