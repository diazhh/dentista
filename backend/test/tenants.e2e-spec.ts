import { Test, TestingModule } from '@nestjs/testing';
import { TenantMembershipController } from '../src/tenant-membership/tenant-membership.controller';
import { TenantMembershipService } from '../src/tenant-membership/tenant-membership.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from './helpers/prisma.helper';
import { mockUsers, mockTenants } from './helpers/auth.helper';
import { ConflictException, NotFoundException } from '@nestjs/common';

/**
 * Tenant membership integration tests – verifies tenant CRUD operations
 * and multi-tenant access control.
 */
describe('TenantMembership Controller (integration)', () => {
  let controller: TenantMembershipController;
  let membershipService: TenantMembershipService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantMembershipController],
      providers: [
        TenantMembershipService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<TenantMembershipController>(TenantMembershipController);
    membershipService = module.get<TenantMembershipService>(TenantMembershipService);
  });

  describe('POST /tenant-membership/invite', () => {
    it('should invite new staff member (201-equivalent)', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // user doesn't exist yet
      prisma.user.create.mockResolvedValue({
        id: 'new-staff-001',
        email: 'newstaff@test.com',
        name: 'New Staff',
        role: 'STAFF_RECEPTIONIST',
      });
      prisma.tenantMembership.findUnique.mockResolvedValue(null); // no existing membership
      prisma.tenantMembership.create.mockResolvedValue({
        id: 'membership-001',
        userId: 'new-staff-001',
        tenantId: mockTenants.drsmith.id,
        role: 'STAFF_RECEPTIONIST',
        status: 'PENDING_INVITATION',
        user: { id: 'new-staff-001', email: 'newstaff@test.com', name: 'New Staff', role: 'STAFF_RECEPTIONIST' },
        tenant: { id: mockTenants.drsmith.id, name: 'DrSmith Clinic', subdomain: 'drsmith' },
      });

      const req = { user: { tenantId: mockTenants.drsmith.id, userId: mockUsers.provider.id } };
      const result = await controller.inviteStaff(
        { email: 'newstaff@test.com', name: 'New Staff', role: 'STAFF_RECEPTIONIST' as any },
        req,
      );

      expect(result).toHaveProperty('id', 'membership-001');
      expect(result.status).toBe('PENDING_INVITATION');
      expect(result.user.email).toBe('newstaff@test.com');
    });

    it('should throw ConflictException if staff already exists in workspace', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@test.com',
      });
      prisma.tenantMembership.findUnique.mockResolvedValue({
        id: 'existing-membership',
        userId: 'existing-user',
        tenantId: mockTenants.drsmith.id,
      });

      const req = { user: { tenantId: mockTenants.drsmith.id, userId: mockUsers.provider.id } };

      await expect(
        controller.inviteStaff(
          { email: 'existing@test.com', name: 'Existing', role: 'STAFF_RECEPTIONIST' as any },
          req,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('GET /tenant-membership/staff', () => {
    it('should return all staff for a tenant', async () => {
      const staffList = [
        {
          id: 'm-001',
          userId: 'u-001',
          tenantId: mockTenants.drsmith.id,
          isActive: true,
          user: { id: 'u-001', email: 'staff1@test.com', name: 'Staff One', role: 'STAFF_RECEPTIONIST' },
        },
        {
          id: 'm-002',
          userId: 'u-002',
          tenantId: mockTenants.drsmith.id,
          isActive: true,
          user: { id: 'u-002', email: 'staff2@test.com', name: 'Staff Two', role: 'STAFF_BILLING' },
        },
      ];
      prisma.tenantMembership.findMany.mockResolvedValue(staffList);

      const req = { user: { tenantId: mockTenants.drsmith.id } };
      const result = await controller.findAllStaff(req);

      expect(result).toHaveLength(2);
    });
  });

  describe('GET /tenant-membership/:id', () => {
    it('should return membership by ID within same tenant', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue({
        id: 'm-001',
        tenantId: mockTenants.drsmith.id,
        user: { id: 'u-001', email: 'staff@test.com', name: 'Staff', role: 'STAFF_RECEPTIONIST' },
        tenant: { id: mockTenants.drsmith.id, name: 'DrSmith Clinic', subdomain: 'drsmith' },
      });

      const req = { user: { tenantId: mockTenants.drsmith.id } };
      const result = await controller.findOne('m-001', req);

      expect(result.id).toBe('m-001');
    });

    it('should throw NotFoundException for membership in different tenant', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue(null);

      const req = { user: { tenantId: mockTenants.medicentro.id } };

      await expect(
        controller.findOne('m-001', req),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /tenant-membership/:id/accept', () => {
    it('should accept pending invitation', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue({
        id: 'm-001',
        userId: 'u-001',
        status: 'PENDING_INVITATION',
      });
      prisma.tenantMembership.update.mockResolvedValue({
        id: 'm-001',
        status: 'ACTIVE',
        tenant: { id: mockTenants.drsmith.id, name: 'DrSmith Clinic', subdomain: 'drsmith' },
      });

      const req = { user: { userId: 'u-001' } };
      const result = await controller.acceptInvitation('m-001', req);

      expect(result.status).toBe('ACTIVE');
    });

    it('should throw NotFoundException for already-accepted invitation', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue(null);

      const req = { user: { userId: 'u-001' } };

      await expect(
        controller.acceptInvitation('m-001', req),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /tenant-membership/:id/reject', () => {
    it('should reject invitation and deactivate membership', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue({
        id: 'm-001',
        userId: 'u-001',
        status: 'PENDING_INVITATION',
      });
      prisma.tenantMembership.update.mockResolvedValue({
        id: 'm-001',
        status: 'INACTIVE',
        isActive: false,
      });

      const req = { user: { userId: 'u-001' } };
      const result = await controller.rejectInvitation('m-001', req);

      expect(result.status).toBe('INACTIVE');
      expect(result.isActive).toBe(false);
    });
  });

  describe('DELETE /tenant-membership/:id', () => {
    it('should soft-delete membership', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue({
        id: 'm-001',
        tenantId: mockTenants.drsmith.id,
        user: { id: 'u-001' },
        tenant: { id: mockTenants.drsmith.id },
      });
      prisma.tenantMembership.update.mockResolvedValue({
        id: 'm-001',
        isActive: false,
        status: 'INACTIVE',
      });

      const req = { user: { tenantId: mockTenants.drsmith.id } };
      const result = await controller.remove('m-001', req);

      expect(result.isActive).toBe(false);
      expect(result.status).toBe('INACTIVE');
    });
  });
});
