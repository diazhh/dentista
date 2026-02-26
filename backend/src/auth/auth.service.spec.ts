import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { createMockPrismaService, MockPrismaService } from '../../test/helpers/prisma.helper';
import { mockUsers } from '../../test/helpers/auth.helper';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrismaService;
  let usersService: { findByEmail: jest.Mock; create: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let configService: { get: jest.Mock };
  let emailService: { sendTemplateEmail: jest.Mock };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('mock-jwt-token') };
    configService = { get: jest.fn().mockReturnValue('8h') };
    emailService = { sendTemplateEmail: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateUser', () => {
    it('should return user data (without passwordHash) on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const userWithHash = { ...mockUsers.provider, passwordHash: hashedPassword };
      usersService.findByEmail.mockResolvedValue(userWithHash);

      const result = await service.validateUser('dentist@dentista.com', 'Password123!');

      expect(result).toBeDefined();
      expect(result.email).toBe('dentist@dentista.com');
      expect(result.passwordHash).toBeUndefined();
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const userWithHash = { ...mockUsers.provider, passwordHash: hashedPassword };
      usersService.findByEmail.mockResolvedValue(userWithHash);

      await expect(
        service.validateUser('dentist@dentista.com', 'WrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent@test.com', 'Password123!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user has no passwordHash (OAuth user)', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUsers.provider,
        passwordHash: null,
      });

      await expect(
        service.validateUser('dentist@dentista.com', 'Password123!'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return accessToken, refreshToken and user data', async () => {
      prisma.session.create.mockResolvedValue({ id: 'session-1', refreshToken: 'mock-refresh' });

      const result = await service.login(mockUsers.provider);

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toMatchObject({
        id: mockUsers.provider.id,
        email: mockUsers.provider.email,
        name: mockUsers.provider.name,
        role: mockUsers.provider.role,
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockUsers.provider.email,
          sub: mockUsers.provider.id,
          role: mockUsers.provider.role,
          tenantId: 'tenant-001',
        }),
        expect.any(Object),
      );
    });

    it('should resolve tenantId from memberships if no owned tenants', async () => {
      prisma.session.create.mockResolvedValue({ id: 'session-2' });

      await service.login(mockUsers.patient);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-001' }),
        expect.any(Object),
      );
    });

    it('should set tenantId to null when user has no tenants', async () => {
      prisma.session.create.mockResolvedValue({ id: 'session-3' });
      const userNoTenants = { ...mockUsers.superAdmin, ownedTenants: [], tenantMemberships: [] };

      await service.login(userNoTenants);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: null }),
        expect.any(Object),
      );
    });
  });

  describe('register', () => {
    it('should create user with hashed password and return login response', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const createdUser = {
        ...mockUsers.provider,
        id: 'new-user-001',
        ownedTenants: [],
        tenantMemberships: [],
      };
      usersService.create.mockResolvedValue(createdUser);
      prisma.session.create.mockResolvedValue({ id: 'session-4' });

      const registerDto = {
        email: 'newdoctor@test.com',
        password: 'SecurePass123!',
        name: 'Dr. New',
        role: 'PROVIDER' as const,
      };

      const result = await service.register(registerDto as any);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newdoctor@test.com',
          passwordHash: expect.any(String),
          name: 'Dr. New',
        }),
      );
      // Verify password was hashed, not stored in plain text
      const createCall = usersService.create.mock.calls[0][0];
      expect(createCall.passwordHash).not.toBe('SecurePass123!');
      expect(result).toHaveProperty('accessToken');
    });

    it('should throw ConflictException when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUsers.provider);

      const registerDto = {
        email: 'dentist@dentista.com',
        password: 'SecurePass123!',
        name: 'Duplicate Doctor',
      };

      await expect(service.register(registerDto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('refreshAccessToken', () => {
    it('should return new accessToken and refreshToken for valid refresh token', async () => {
      const validSession = {
        id: 'session-existing',
        refreshToken: 'valid-refresh-token',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days from now
        user: {
          ...mockUsers.provider,
          ownedTenants: mockUsers.provider.ownedTenants,
          tenantMemberships: [],
        },
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      };
      prisma.session.findUnique.mockResolvedValue(validSession);
      prisma.session.update.mockResolvedValue({ ...validSession, isRevoked: true });
      prisma.session.create.mockResolvedValue({ id: 'session-new' });

      const result = await service.refreshAccessToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('refreshToken');
      // Old session should be revoked
      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session-existing' },
          data: { isRevoked: true },
        }),
      );
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-expired',
        refreshToken: 'expired-token',
        isRevoked: false,
        expiresAt: new Date(Date.now() - 1000), // expired
        user: mockUsers.provider,
      });

      await expect(
        service.refreshAccessToken('expired-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for revoked refresh token', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-revoked',
        refreshToken: 'revoked-token',
        isRevoked: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        user: mockUsers.provider,
      });

      await expect(
        service.refreshAccessToken('revoked-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent refresh token', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshAccessToken('nonexistent-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token session', async () => {
      prisma.session.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('some-refresh-token');

      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { refreshToken: 'some-refresh-token' },
        data: { isRevoked: true },
      });
    });
  });

  describe('forgotPassword', () => {
    it('should return success message even for non-existent email (prevents enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@test.com');

      expect(result.message).toContain('If an account exists');
      expect(emailService.sendTemplateEmail).not.toHaveBeenCalled();
    });

    it('should send reset email for existing user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUsers.provider);
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.passwordResetToken.create.mockResolvedValue({ id: 'reset-1', token: 'reset-token' });

      const result = await service.forgotPassword('dentist@dentista.com');

      expect(result.message).toContain('If an account exists');
      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
      expect(emailService.sendTemplateEmail).toHaveBeenCalledWith(
        'PASSWORD_RESET',
        'dentist@dentista.com',
        expect.objectContaining({ userName: 'Dr. Smith' }),
      );
    });
  });

  describe('getMe', () => {
    it('should return user data with tenants and memberships', async () => {
      const userData = {
        id: 'prov-001',
        email: 'dentist@dentista.com',
        name: 'Dr. Smith',
        role: 'PROVIDER',
        avatarUrl: null,
        phone: null,
        createdAt: new Date(),
        ownedTenants: [{ id: 'tenant-001', name: 'DrSmith Clinic', subdomain: 'drsmith' }],
        tenantMemberships: [],
      };
      prisma.user.findUnique.mockResolvedValue(userData);

      const result = await service.getMe('prov-001');

      expect(result).toMatchObject({ id: 'prov-001', email: 'dentist@dentista.com' });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe('nonexistent-id')).rejects.toThrow('User not found');
    });
  });
});
