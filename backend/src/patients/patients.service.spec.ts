import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConsentsService } from '../consents/consents.service';
import { createMockPrismaService, MockPrismaService } from '../../test/helpers/prisma.helper';
import { mockPatients, mockUsers, mockTenants } from '../../test/helpers/auth.helper';

describe('PatientsService', () => {
  let service: PatientsService;
  let prisma: MockPrismaService;
  let consentsService: { checkProviderAccess: jest.Mock };

  const providerId = mockUsers.provider.id;
  const tenantId = mockTenants.drsmith.id;
  const otherTenantId = mockTenants.medicentro.id;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    consentsService = {
      checkProviderAccess: jest.fn().mockResolvedValue({
        hasConsent: true,
        dataAccessLevel: 'FULL',
        shareAppointments: true,
        shareMedicalHistory: true,
        shareDocuments: true,
        shareLabResults: true,
        shareBilling: true,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConsentsService, useValue: consentsService },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  describe('findAllForProvider', () => {
    it('should return only patients for the given provider and tenant', async () => {
      const tenantPatients = [mockPatients.janeDoe, mockPatients.johnSmith];
      prisma.patient.findMany.mockResolvedValue(tenantPatients);

      const result = await service.findAllForProvider(providerId, tenantId);

      expect(result).toEqual(tenantPatients);
      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            providerPatientRelations: {
              some: {
                providerId,
                tenantId,
                isActive: true,
              },
            },
          },
        }),
      );
    });

    it('should return empty array when provider has no patients in tenant', async () => {
      prisma.patient.findMany.mockResolvedValue([]);

      const result = await service.findAllForProvider(providerId, otherTenantId);

      expect(result).toEqual([]);
    });

    it('should filter by tenantId ensuring multi-tenancy isolation', async () => {
      prisma.patient.findMany.mockResolvedValue([]);

      await service.findAllForProvider(providerId, tenantId);

      // Verify tenantId is always part of the query
      const callArgs = prisma.patient.findMany.mock.calls[0][0];
      expect(callArgs.where.providerPatientRelations.some.tenantId).toBe(tenantId);
    });
  });

  describe('findOne', () => {
    it('should return patient when found with correct provider and tenant', async () => {
      const patientWithRelations = {
        ...mockPatients.janeDoe,
        user: { email: 'jane@test.com', phone: '+18095551234' },
        providerPatientRelations: [
          { providerId, tenantId, isActive: true, tenant: { name: 'DrSmith Clinic' } },
        ],
        documents: [],
        medicalExams: [],
      };
      prisma.patient.findFirst.mockResolvedValue(patientWithRelations);

      const result = await service.findOne(mockPatients.janeDoe.id, providerId, tenantId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockPatients.janeDoe.id);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent-id', providerId, tenantId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when patient belongs to a different tenant (multi-tenancy guard)', async () => {
      // Simulates patient not found because tenant filter doesn't match
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockPatients.janeDoe.id, providerId, otherTenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create patient and associate with provider and tenant', async () => {
      const createDto = {
        email: 'newpatient@test.com',
        firstName: 'Maria',
        lastName: 'Santos',
        documentId: '003-0000000-0',
        phone: '+18095559999',
        dateOfBirth: '1992-05-10',
        gender: 'FEMALE' as const,
      };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'newpatient@test.com',
        name: 'Maria Santos',
        role: 'PATIENT',
      });
      prisma.patient.create.mockResolvedValue({
        id: 'new-patient-id',
        ...createDto,
        userId: 'new-user-id',
      });
      prisma.providerPatientRelation.create.mockResolvedValue({ id: 'rel-001' });

      const result = await service.create(providerId, tenantId, createDto as any);

      expect(result.id).toBe('new-patient-id');
      // Verify provider-patient relation was created with correct tenantId
      expect(prisma.providerPatientRelation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          patientId: 'new-patient-id',
          providerId,
          tenantId,
          isActive: true,
        }),
      });
    });

    it('should use existing user if userId is provided', async () => {
      const createDto = {
        userId: 'existing-user-id',
        firstName: 'Pedro',
        lastName: 'Ramirez',
        documentId: '004-0000000-0',
        phone: '+18095558888',
        dateOfBirth: '1988-01-20',
        gender: 'MALE' as const,
      };

      prisma.patient.create.mockResolvedValue({
        id: 'new-patient-id',
        ...createDto,
      });
      prisma.providerPatientRelation.create.mockResolvedValue({ id: 'rel-002' });

      await service.create(providerId, tenantId, createDto as any);

      // Should NOT create a new user
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when neither userId nor email is provided', async () => {
      const createDto = {
        firstName: 'Bad',
        lastName: 'Patient',
        documentId: '005-0000000-0',
        phone: '+18095557777',
        dateOfBirth: '2000-01-01',
        gender: 'MALE' as const,
      };

      await expect(
        service.create(providerId, tenantId, createDto as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update patient data after verifying access', async () => {
      const patientWithRelations = {
        ...mockPatients.janeDoe,
        user: { email: 'jane@test.com', phone: '+18095551234' },
        providerPatientRelations: [
          { providerId, tenantId, isActive: true, tenant: { name: 'DrSmith Clinic' } },
        ],
        documents: [],
        medicalExams: [],
      };
      prisma.patient.findFirst.mockResolvedValue(patientWithRelations);
      prisma.patient.update.mockResolvedValue({
        ...mockPatients.janeDoe,
        phone: '+18095559999',
      });

      const result = await service.update(
        mockPatients.janeDoe.id,
        providerId,
        tenantId,
        { phone: '+18095559999' } as any,
      );

      expect(result.phone).toBe('+18095559999');
    });

    it('should throw NotFoundException when updating non-existent patient', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', providerId, tenantId, { phone: '123' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should search patients scoped to provider and tenant', async () => {
      prisma.patient.findMany.mockResolvedValue([mockPatients.janeDoe]);

      const result = await service.search(providerId, tenantId, { firstName: 'Jane' });

      expect(result).toHaveLength(1);
      const callArgs = prisma.patient.findMany.mock.calls[0][0];
      expect(callArgs.where.providerPatientRelations.some).toMatchObject({
        providerId,
        tenantId,
        isActive: true,
      });
    });
  });

  describe('remove', () => {
    it('should soft-delete by deactivating the provider-patient relation', async () => {
      const patientWithRelations = {
        ...mockPatients.janeDoe,
        user: { email: 'jane@test.com', phone: '+18095551234' },
        providerPatientRelations: [
          { providerId, tenantId, isActive: true, tenant: { name: 'DrSmith Clinic' } },
        ],
        documents: [],
        medicalExams: [],
      };
      prisma.patient.findFirst.mockResolvedValue(patientWithRelations);
      prisma.providerPatientRelation.updateMany.mockResolvedValue({ count: 1 });

      await service.remove(mockPatients.janeDoe.id, providerId, tenantId);

      expect(prisma.providerPatientRelation.updateMany).toHaveBeenCalledWith({
        where: {
          patientId: mockPatients.janeDoe.id,
          providerId,
        },
        data: {
          isActive: false,
          endedAt: expect.any(Date),
        },
      });
    });
  });
});
