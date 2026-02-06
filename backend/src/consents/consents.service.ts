import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestConsentDto } from './dto/request-consent.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { ConsentStatus, DataAccessLevel } from '@prisma/client';

export interface ConsentAccessResult {
  hasConsent: boolean;
  dataAccessLevel: DataAccessLevel;
  shareAppointments: boolean;
  shareMedicalHistory: boolean;
  shareDocuments: boolean;
  shareLabResults: boolean;
  shareBilling: boolean;
}

@Injectable()
export class ConsentsService {
  private readonly logger = new Logger(ConsentsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Provider requests consent from a patient.
   * Creates a PatientConsent record with status PENDING.
   */
  async requestConsent(
    providerId: string,
    tenantId: string,
    dto: RequestConsentDto,
  ) {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Check if there is already a pending or active consent for this provider-patient pair
    const existing = await this.prisma.patientConsent.findFirst({
      where: {
        patientId: dto.patientId,
        providerId,
        status: { in: ['PENDING', 'GRANTED'] },
      },
    });
    if (existing) {
      throw new BadRequestException(
        existing.status === 'PENDING'
          ? 'A consent request is already pending for this patient'
          : 'An active consent already exists for this patient. The patient can update it.',
      );
    }

    const consent = await this.prisma.patientConsent.create({
      data: {
        patientId: dto.patientId,
        providerId,
        dataAccessLevel: dto.dataAccessLevel,
        shareAppointments: dto.shareAppointments ?? true,
        shareMedicalHistory: dto.shareMedicalHistory ?? false,
        shareDocuments: dto.shareDocuments ?? false,
        shareLabResults: dto.shareLabResults ?? false,
        shareBilling: dto.shareBilling ?? false,
        status: ConsentStatus.PENDING,
        requestedBy: providerId,
        reason: dto.reason,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    // Audit log
    await this.createAuditLog(
      'CREATE',
      consent.id,
      providerId,
      tenantId,
      dto.patientId,
      providerId,
      dto.dataAccessLevel,
    );

    return consent;
  }

  /**
   * Patient sees their pending consent requests.
   */
  async getPendingForPatient(userId: string) {
    const patient = await this.getPatientByUserId(userId);

    return this.prisma.patientConsent.findMany({
      where: {
        patientId: patient.id,
        status: ConsentStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Patient sees their active (granted) consents.
   */
  async getActiveForPatient(userId: string) {
    const patient = await this.getPatientByUserId(userId);

    return this.prisma.patientConsent.findMany({
      where: {
        patientId: patient.id,
        status: ConsentStatus.GRANTED,
      },
      orderBy: { grantedAt: 'desc' },
    });
  }

  /**
   * Patient grants a pending consent request.
   */
  async grantConsent(userId: string, consentId: string) {
    const patient = await this.getPatientByUserId(userId);

    const consent = await this.prisma.patientConsent.findFirst({
      where: {
        id: consentId,
        patientId: patient.id,
        status: ConsentStatus.PENDING,
      },
    });

    if (!consent) {
      throw new NotFoundException(
        'Pending consent request not found',
      );
    }

    const updated = await this.prisma.patientConsent.update({
      where: { id: consentId },
      data: {
        status: ConsentStatus.GRANTED,
        grantedAt: new Date(),
      },
    });

    // Also update the ProviderPatientRelation dataAccessLevel if one exists
    await this.prisma.providerPatientRelation.updateMany({
      where: {
        patientId: patient.id,
        providerId: consent.providerId,
        isActive: true,
      },
      data: {
        dataAccessLevel: consent.dataAccessLevel,
      },
    });

    // Audit log
    await this.createAuditLog(
      'UPDATE',
      consentId,
      userId,
      null,
      patient.id,
      consent.providerId,
      consent.dataAccessLevel,
    );

    return updated;
  }

  /**
   * Patient denies a pending consent request.
   */
  async denyConsent(userId: string, consentId: string) {
    const patient = await this.getPatientByUserId(userId);

    const consent = await this.prisma.patientConsent.findFirst({
      where: {
        id: consentId,
        patientId: patient.id,
        status: ConsentStatus.PENDING,
      },
    });

    if (!consent) {
      throw new NotFoundException(
        'Pending consent request not found',
      );
    }

    const updated = await this.prisma.patientConsent.update({
      where: { id: consentId },
      data: {
        status: ConsentStatus.DENIED,
      },
    });

    // Audit log
    await this.createAuditLog(
      'UPDATE',
      consentId,
      userId,
      null,
      patient.id,
      consent.providerId,
      consent.dataAccessLevel,
    );

    return updated;
  }

  /**
   * Patient revokes a previously granted consent.
   */
  async revokeConsent(userId: string, consentId: string) {
    const patient = await this.getPatientByUserId(userId);

    const consent = await this.prisma.patientConsent.findFirst({
      where: {
        id: consentId,
        patientId: patient.id,
        status: ConsentStatus.GRANTED,
      },
    });

    if (!consent) {
      throw new NotFoundException(
        'Active consent not found',
      );
    }

    const updated = await this.prisma.patientConsent.update({
      where: { id: consentId },
      data: {
        status: ConsentStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    // Revert ProviderPatientRelation dataAccessLevel to MINIMAL
    await this.prisma.providerPatientRelation.updateMany({
      where: {
        patientId: patient.id,
        providerId: consent.providerId,
        isActive: true,
      },
      data: {
        dataAccessLevel: DataAccessLevel.MINIMAL,
      },
    });

    // Audit log
    await this.createAuditLog(
      'UPDATE',
      consentId,
      userId,
      null,
      patient.id,
      consent.providerId,
      consent.dataAccessLevel,
    );

    return updated;
  }

  /**
   * Patient modifies access levels on an active (granted) consent.
   */
  async updateConsent(
    userId: string,
    consentId: string,
    dto: UpdateConsentDto,
  ) {
    const patient = await this.getPatientByUserId(userId);

    const consent = await this.prisma.patientConsent.findFirst({
      where: {
        id: consentId,
        patientId: patient.id,
        status: ConsentStatus.GRANTED,
      },
    });

    if (!consent) {
      throw new NotFoundException(
        'Active consent not found',
      );
    }

    const updateData: any = {};
    if (dto.dataAccessLevel !== undefined) updateData.dataAccessLevel = dto.dataAccessLevel;
    if (dto.shareAppointments !== undefined) updateData.shareAppointments = dto.shareAppointments;
    if (dto.shareMedicalHistory !== undefined) updateData.shareMedicalHistory = dto.shareMedicalHistory;
    if (dto.shareDocuments !== undefined) updateData.shareDocuments = dto.shareDocuments;
    if (dto.shareLabResults !== undefined) updateData.shareLabResults = dto.shareLabResults;
    if (dto.shareBilling !== undefined) updateData.shareBilling = dto.shareBilling;

    const updated = await this.prisma.patientConsent.update({
      where: { id: consentId },
      data: updateData,
    });

    // Sync dataAccessLevel to the ProviderPatientRelation if it was changed
    if (dto.dataAccessLevel) {
      await this.prisma.providerPatientRelation.updateMany({
        where: {
          patientId: patient.id,
          providerId: consent.providerId,
          isActive: true,
        },
        data: {
          dataAccessLevel: dto.dataAccessLevel,
        },
      });
    }

    // Audit log
    await this.createAuditLog(
      'UPDATE',
      consentId,
      userId,
      null,
      patient.id,
      consent.providerId,
      updated.dataAccessLevel,
    );

    return updated;
  }

  /**
   * Full consent history for a patient.
   */
  async getConsentHistory(userId: string) {
    const patient = await this.getPatientByUserId(userId);

    return this.prisma.patientConsent.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check what access level a provider has for a specific patient.
   * Used by middleware/guards and services to determine data filtering.
   */
  async checkProviderAccess(
    providerId: string,
    patientId: string,
  ): Promise<ConsentAccessResult> {
    // First check for an active (GRANTED) consent
    const consent = await this.prisma.patientConsent.findFirst({
      where: {
        patientId,
        providerId,
        status: ConsentStatus.GRANTED,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { grantedAt: 'desc' },
    });

    if (consent) {
      return {
        hasConsent: true,
        dataAccessLevel: consent.dataAccessLevel,
        shareAppointments: consent.shareAppointments,
        shareMedicalHistory: consent.shareMedicalHistory,
        shareDocuments: consent.shareDocuments,
        shareLabResults: consent.shareLabResults,
        shareBilling: consent.shareBilling,
      };
    }

    // Fall back to ProviderPatientRelation dataAccessLevel
    const relation = await this.prisma.providerPatientRelation.findFirst({
      where: {
        patientId,
        providerId,
        isActive: true,
      },
    });

    if (relation) {
      return {
        hasConsent: false,
        dataAccessLevel: relation.dataAccessLevel,
        shareAppointments: relation.dataAccessLevel !== DataAccessLevel.MINIMAL,
        shareMedicalHistory:
          relation.dataAccessLevel === DataAccessLevel.FULL ||
          relation.dataAccessLevel === DataAccessLevel.CLINICAL_ONLY,
        shareDocuments:
          relation.dataAccessLevel === DataAccessLevel.FULL ||
          relation.dataAccessLevel === DataAccessLevel.DOCUMENTS_SHARED,
        shareLabResults:
          relation.dataAccessLevel === DataAccessLevel.FULL ||
          relation.dataAccessLevel === DataAccessLevel.CLINICAL_ONLY,
        shareBilling: relation.dataAccessLevel === DataAccessLevel.FULL,
      };
    }

    // No relationship at all - MINIMAL access
    return {
      hasConsent: false,
      dataAccessLevel: DataAccessLevel.MINIMAL,
      shareAppointments: false,
      shareMedicalHistory: false,
      shareDocuments: false,
      shareLabResults: false,
      shareBilling: false,
    };
  }

  /**
   * Expire consents that have passed their expiresAt date.
   * Can be called from a cron job, a scheduled task, or manually.
   */
  async handleExpiredConsents() {
    const now = new Date();

    const expired = await this.prisma.patientConsent.updateMany({
      where: {
        status: ConsentStatus.GRANTED,
        expiresAt: { lte: now },
      },
      data: {
        status: ConsentStatus.EXPIRED,
      },
    });

    if (expired.count > 0) {
      this.logger.log(`Expired ${expired.count} consent(s)`);
    }
  }

  // ==========================================
  // Private Helpers
  // ==========================================

  private async getPatientByUserId(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    return patient;
  }

  private async createAuditLog(
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW',
    consentId: string,
    userId: string,
    tenantId: string | null,
    patientId: string,
    providerId: string,
    accessLevel: DataAccessLevel,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          entity: 'PatientConsent',
          entityId: consentId,
          userId,
          tenantId,
          metadata: {
            patientId,
            providerId,
            accessLevel,
          },
        },
      });
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      this.logger.error(`Failed to create audit log: ${error.message}`);
    }
  }
}
