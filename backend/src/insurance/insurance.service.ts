import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInsuranceProviderDto,
  UpdateInsuranceProviderDto,
  CreatePatientInsuranceDto,
  UpdatePatientInsuranceDto,
  VerifyInsuranceDto,
} from './dto/insurance.dto';

@Injectable()
export class InsuranceService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // Insurance Providers (catalog)
  // ==========================================

  async getProviders(tenantId: string, includeInactive = false) {
    return this.prisma.insuranceProvider.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: { _count: { select: { patientInsurances: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getProvider(id: string, tenantId: string) {
    const provider = await this.prisma.insuranceProvider.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { patientInsurances: true } } },
    });
    if (!provider) throw new NotFoundException('Aseguradora no encontrada');
    return provider;
  }

  async createProvider(tenantId: string, dto: CreateInsuranceProviderDto) {
    return this.prisma.insuranceProvider.create({
      data: {
        tenantId,
        ...JSON.parse(JSON.stringify(dto)),
      },
    });
  }

  async updateProvider(id: string, tenantId: string, dto: UpdateInsuranceProviderDto) {
    await this.getProvider(id, tenantId);
    return this.prisma.insuranceProvider.update({
      where: { id },
      data: JSON.parse(JSON.stringify(dto)),
    });
  }

  async deleteProvider(id: string, tenantId: string) {
    await this.getProvider(id, tenantId);
    return this.prisma.insuranceProvider.delete({ where: { id } });
  }

  // ==========================================
  // Patient Insurances
  // ==========================================

  async getPatientInsurances(patientId: string, tenantId: string) {
    return this.prisma.patientInsurance.findMany({
      where: { patientId, tenantId },
      include: { insuranceProvider: { select: { id: true, name: true, code: true } } },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getPatientInsurance(id: string, tenantId: string) {
    const insurance = await this.prisma.patientInsurance.findFirst({
      where: { id, tenantId },
      include: { insuranceProvider: true },
    });
    if (!insurance) throw new NotFoundException('Seguro del paciente no encontrado');
    return insurance;
  }

  async createPatientInsurance(tenantId: string, dto: CreatePatientInsuranceDto) {
    // If marked as primary, unset other primaries for same patient
    if (dto.isPrimary) {
      await this.prisma.patientInsurance.updateMany({
        where: { patientId: dto.patientId, tenantId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.patientInsurance.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        insuranceProviderId: dto.insuranceProviderId,
        policyNumber: dto.policyNumber,
        groupNumber: dto.groupNumber,
        subscriberName: dto.subscriberName,
        subscriberRelation: dto.subscriberRelation,
        coverageType: dto.coverageType || 'BASIC',
        effectiveDate: new Date(dto.effectiveDate),
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
        isPrimary: dto.isPrimary || false,
        copayAmount: dto.copayAmount,
        coinsurancePercent: dto.coinsurancePercent,
        deductible: dto.deductible,
        maxAnnualBenefit: dto.maxAnnualBenefit,
      },
      include: { insuranceProvider: { select: { id: true, name: true, code: true } } },
    });
  }

  async updatePatientInsurance(id: string, tenantId: string, dto: UpdatePatientInsuranceDto) {
    const existing = await this.getPatientInsurance(id, tenantId);

    // If setting as primary, unset others
    if (dto.isPrimary && !existing.isPrimary) {
      await this.prisma.patientInsurance.updateMany({
        where: { patientId: existing.patientId, tenantId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const data: any = { ...JSON.parse(JSON.stringify(dto)) };
    if (dto.effectiveDate) data.effectiveDate = new Date(dto.effectiveDate);
    if (dto.expirationDate) data.expirationDate = new Date(dto.expirationDate);

    return this.prisma.patientInsurance.update({
      where: { id },
      data,
      include: { insuranceProvider: { select: { id: true, name: true, code: true } } },
    });
  }

  async deletePatientInsurance(id: string, tenantId: string) {
    await this.getPatientInsurance(id, tenantId);
    return this.prisma.patientInsurance.delete({ where: { id } });
  }

  // ==========================================
  // Verification
  // ==========================================

  async verifyInsurance(id: string, tenantId: string, userId: string, dto: VerifyInsuranceDto) {
    await this.getPatientInsurance(id, tenantId);

    return this.prisma.patientInsurance.update({
      where: { id },
      data: {
        verificationStatus: dto.verificationStatus,
        verificationNotes: dto.verificationNotes,
        verifiedAt: new Date(),
        verifiedBy: userId,
      },
      include: { insuranceProvider: { select: { id: true, name: true, code: true } } },
    });
  }

  // ==========================================
  // Check coverage for an appointment/service
  // ==========================================

  async checkCoverage(patientId: string, tenantId: string) {
    const insurances = await this.prisma.patientInsurance.findMany({
      where: {
        patientId,
        tenantId,
        isActive: true,
        verificationStatus: 'VERIFIED',
        effectiveDate: { lte: new Date() },
        OR: [
          { expirationDate: null },
          { expirationDate: { gte: new Date() } },
        ],
      },
      include: { insuranceProvider: true },
      orderBy: { isPrimary: 'desc' },
    });

    if (insurances.length === 0) {
      return { covered: false, insurances: [], message: 'Sin seguro activo verificado' };
    }

    const primary = insurances.find((i) => i.isPrimary) || insurances[0];
    const remainingBenefit =
      primary.maxAnnualBenefit != null
        ? primary.maxAnnualBenefit - (primary.usedBenefit || 0)
        : null;

    return {
      covered: true,
      primary: {
        id: primary.id,
        provider: primary.insuranceProvider.name,
        policyNumber: primary.policyNumber,
        coverageType: primary.coverageType,
        copayAmount: primary.copayAmount,
        coinsurancePercent: primary.coinsurancePercent,
        deductible: primary.deductible,
        remainingBenefit,
      },
      insurances: insurances.map((i) => ({
        id: i.id,
        provider: i.insuranceProvider.name,
        policyNumber: i.policyNumber,
        isPrimary: i.isPrimary,
        coverageType: i.coverageType,
      })),
    };
  }
}
