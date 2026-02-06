import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSharedDocumentDto } from './dto/create-shared-document.dto';

@Injectable()
export class SharedDocumentsService {
  constructor(private prisma: PrismaService) {}

  async shareDocument(userId: string, dto: CreateSharedDocumentDto) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient profile not found');

    // Verify document belongs to the patient (via MedicalExam)
    const exam = await this.prisma.medicalExam.findFirst({
      where: { id: dto.documentId, patientId: patient.id },
    });
    if (!exam) throw new NotFoundException('Document not found or does not belong to you');

    // Check for existing active share
    const existing = await this.prisma.sharedDocument.findUnique({
      where: { documentId_providerId: { documentId: dto.documentId, providerId: dto.providerId } },
    });
    if (existing && existing.isActive) {
      throw new ConflictException('Document already shared with this provider');
    }

    if (existing && !existing.isActive) {
      // Reactivate
      return this.prisma.sharedDocument.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          revokedAt: null,
          sharedAt: new Date(),
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        },
      });
    }

    return this.prisma.sharedDocument.create({
      data: {
        patientId: patient.id,
        documentId: dto.documentId,
        providerId: dto.providerId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async getMySharedDocuments(userId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient profile not found');

    return this.prisma.sharedDocument.findMany({
      where: { patientId: patient.id, isActive: true },
      orderBy: { sharedAt: 'desc' },
    });
  }

  async revokeShare(userId: string, shareId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient profile not found');

    const share = await this.prisma.sharedDocument.findFirst({
      where: { id: shareId, patientId: patient.id },
    });
    if (!share) throw new NotFoundException('Shared document not found');
    if (!share.isActive) throw new ConflictException('Share already revoked');

    return this.prisma.sharedDocument.update({
      where: { id: shareId },
      data: { isActive: false, revokedAt: new Date() },
    });
  }

  async renewShare(userId: string, shareId: string, expiresAt: string) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient profile not found');

    const share = await this.prisma.sharedDocument.findFirst({
      where: { id: shareId, patientId: patient.id, isActive: true },
    });
    if (!share) throw new NotFoundException('Active shared document not found');

    return this.prisma.sharedDocument.update({
      where: { id: shareId },
      data: { expiresAt: new Date(expiresAt) },
    });
  }

  async getSharedWithProvider(providerId: string) {
    return this.prisma.sharedDocument.findMany({
      where: { providerId, isActive: true },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { sharedAt: 'desc' },
    });
  }
}
