import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { createMockPrismaService, MockPrismaService } from '../../test/helpers/prisma.helper';
import { mockPatients, mockUsers, mockTenants } from '../../test/helpers/auth.helper';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prisma: MockPrismaService;
  let notificationsService: {
    sendAppointmentConfirmation: jest.Mock;
    scheduleAppointmentReminders: jest.Mock;
  };
  let schedulingService: { validateAppointmentSlot: jest.Mock };

  const providerId = mockUsers.provider.id;
  const tenantId = mockTenants.drsmith.id;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    notificationsService = {
      sendAppointmentConfirmation: jest.fn().mockResolvedValue(undefined),
      scheduleAppointmentReminders: jest.fn().mockResolvedValue(undefined),
    };
    schedulingService = {
      validateAppointmentSlot: jest.fn().mockResolvedValue({ valid: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: SchedulingService, useValue: schedulingService },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  describe('create', () => {
    const futureDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const baseDto = {
      patientId: mockPatients.janeDoe.id,
      appointmentDate: futureDate,
      duration: 30,
      procedureType: 'General Checkup',
    };

    it('should create appointment when provider-patient relation exists and no conflicts', async () => {
      prisma.providerPatientRelation.findFirst.mockResolvedValue({
        id: 'rel-001',
        patientId: mockPatients.janeDoe.id,
        providerId,
        isActive: true,
      });
      // No conflicts (no room specified, basic check)
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.appointment.create.mockResolvedValue({
        id: 'apt-001',
        ...baseDto,
        providerId,
        tenantId,
        status: 'SCHEDULED',
        patient: { user: { email: 'jane@test.com', phone: '+18095551234', name: 'Jane Doe' } },
        room: null,
      });

      const result = await service.create(baseDto as any, providerId, tenantId);

      expect(result.id).toBe('apt-001');
      expect(result.status).toBe('SCHEDULED');
      expect(notificationsService.sendAppointmentConfirmation).toHaveBeenCalledWith('apt-001');
    });

    it('should throw ForbiddenException when patient is not associated with provider', async () => {
      prisma.providerPatientRelation.findFirst.mockResolvedValue(null);

      await expect(
        service.create(baseDto as any, providerId, tenantId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when provider has no access to specified room', async () => {
      prisma.providerPatientRelation.findFirst.mockResolvedValue({ id: 'rel-001' });
      prisma.roomAssignment.findFirst.mockResolvedValue(null);

      const dtoWithRoom = { ...baseDto, roomId: 'room-001' };

      await expect(
        service.create(dtoWithRoom as any, providerId, tenantId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should use SchedulingService for room-based conflict check', async () => {
      prisma.providerPatientRelation.findFirst.mockResolvedValue({ id: 'rel-001' });
      prisma.roomAssignment.findFirst.mockResolvedValue({ id: 'assignment-001' });
      schedulingService.validateAppointmentSlot.mockResolvedValue({ valid: true });
      prisma.appointment.create.mockResolvedValue({
        id: 'apt-002',
        ...baseDto,
        roomId: 'room-001',
        status: 'SCHEDULED',
        patient: { user: {} },
        room: { clinic: {} },
      });

      const dtoWithRoom = { ...baseDto, roomId: 'room-001' };
      await service.create(dtoWithRoom as any, providerId, tenantId);

      expect(schedulingService.validateAppointmentSlot).toHaveBeenCalledWith(
        providerId,
        'room-001',
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('should throw BadRequestException when scheduling service reports conflict', async () => {
      prisma.providerPatientRelation.findFirst.mockResolvedValue({ id: 'rel-001' });
      prisma.roomAssignment.findFirst.mockResolvedValue({ id: 'assignment-001' });
      schedulingService.validateAppointmentSlot.mockResolvedValue({
        valid: false,
        conflict: 'Provider has a conflicting appointment',
      });

      const dtoWithRoom = { ...baseDto, roomId: 'room-001' };

      await expect(
        service.create(dtoWithRoom as any, providerId, tenantId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should detect time overlap in basic provider-only conflict check (no room)', async () => {
      prisma.providerPatientRelation.findFirst.mockResolvedValue({ id: 'rel-001' });

      const conflictDate = new Date(baseDto.appointmentDate);
      prisma.appointment.findMany.mockResolvedValue([
        {
          id: 'existing-apt',
          appointmentDate: conflictDate,
          duration: 30,
          status: 'SCHEDULED',
        },
      ]);

      await expect(
        service.create(baseDto as any, providerId, tenantId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should filter appointments by providerId and tenantId', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);

      await service.findAll(providerId, tenantId);

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            providerId,
            tenantId,
          }),
        }),
      );
    });

    it('should apply date range filters when provided', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);

      await service.findAll(providerId, tenantId, '2025-01-01', '2025-01-31');

      const callArgs = prisma.appointment.findMany.mock.calls[0][0];
      expect(callArgs.where.appointmentDate).toBeDefined();
      expect(callArgs.where.appointmentDate.gte).toEqual(new Date('2025-01-01'));
      expect(callArgs.where.appointmentDate.lte).toEqual(new Date('2025-01-31'));
    });
  });

  describe('findOne', () => {
    it('should return appointment scoped to provider and tenant', async () => {
      const mockApt = {
        id: 'apt-001',
        providerId,
        tenantId,
        status: 'SCHEDULED',
        patient: { user: { email: 'test@test.com' } },
        room: null,
      };
      prisma.appointment.findFirst.mockResolvedValue(mockApt);

      const result = await service.findOne('apt-001', providerId, tenantId);

      expect(result.id).toBe('apt-001');
    });

    it('should throw NotFoundException when appointment not found', async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent', providerId, tenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should change appointment status to CANCELLED', async () => {
      prisma.appointment.findFirst.mockResolvedValue({
        id: 'apt-001',
        status: 'SCHEDULED',
        patient: { user: {} },
      });
      prisma.appointment.update.mockResolvedValue({
        id: 'apt-001',
        status: 'CANCELLED',
        patient: { user: {} },
      });

      const result = await service.updateStatus('apt-001', 'CANCELLED' as any, providerId, tenantId);

      expect(result.status).toBe('CANCELLED');
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'apt-001' },
          data: { status: 'CANCELLED' },
        }),
      );
    });

    it('should change appointment status to COMPLETED', async () => {
      prisma.appointment.findFirst.mockResolvedValue({
        id: 'apt-001',
        status: 'SCHEDULED',
        patient: { user: {} },
      });
      prisma.appointment.update.mockResolvedValue({
        id: 'apt-001',
        status: 'COMPLETED',
        patient: { user: {} },
      });

      const result = await service.updateStatus('apt-001', 'COMPLETED' as any, providerId, tenantId);

      expect(result.status).toBe('COMPLETED');
    });

    it('should throw NotFoundException for non-existent appointment', async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', 'CANCELLED' as any, providerId, tenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete appointment after verifying access', async () => {
      prisma.appointment.findFirst.mockResolvedValue({
        id: 'apt-001',
        providerId,
        tenantId,
        patient: { user: {} },
        room: null,
      });
      prisma.appointment.delete.mockResolvedValue({ id: 'apt-001' });

      const result = await service.remove('apt-001', providerId, tenantId);

      expect(prisma.appointment.delete).toHaveBeenCalledWith({ where: { id: 'apt-001' } });
    });
  });

  describe('findToday', () => {
    it('should filter appointments for today only', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);

      await service.findToday(providerId, tenantId);

      const callArgs = prisma.appointment.findMany.mock.calls[0][0];
      expect(callArgs.where.providerId).toBe(providerId);
      expect(callArgs.where.tenantId).toBe(tenantId);
      expect(callArgs.where.appointmentDate.gte).toBeDefined();
      expect(callArgs.where.appointmentDate.lt).toBeDefined();
    });
  });
});
