import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth/auth.service';
import { AuthController } from '../src/auth/auth.controller';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/users/users.service';
import { EmailService } from '../src/email/email.service';
import { ConfigService } from '@nestjs/config';
import { createMockPrismaService, MockPrismaService } from './helpers/prisma.helper';
import { mockUsers } from './helpers/auth.helper';
import * as bcrypt from 'bcrypt';

/**
 * Auth E2E-style tests – these test the AuthController + AuthService integration
 * using a testing module with mocked dependencies (no real DB/HTTP).
 */
describe('Auth Controller (integration)', () => {
  let authController: AuthController;
  let authService: AuthService;
  let prisma: MockPrismaService;
  let usersService: { findByEmail: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-access-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultVal?: string) => {
              const config: Record<string, string> = {
                JWT_EXPIRES_IN: '8h',
                JWT_REFRESH_EXPIRES_IN: '7d',
                JWT_SECRET: 'test-secret',
                FRONTEND_URL: 'http://localhost:3001',
              };
              return config[key] || defaultVal;
            }),
          },
        },
        {
          provide: EmailService,
          useValue: { sendTemplateEmail: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('POST /auth/register', () => {
    it('should register new user and return login response (201-equivalent)', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const createdUser = {
        id: 'new-user-001',
        email: 'newuser@test.com',
        name: 'New User',
        role: 'PATIENT',
        ownedTenants: [],
        tenantMemberships: [],
      };
      usersService.create.mockResolvedValue(createdUser);
      prisma.session.create.mockResolvedValue({ id: 'session-1' });

      const result = await authController.register({
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        name: 'New User',
      } as any);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('newuser@test.com');
    });

    it('should throw ConflictException for duplicate email (409-equivalent)', async () => {
      usersService.findByEmail.mockResolvedValue(mockUsers.provider);

      await expect(
        authController.register({
          email: 'dentist@dentista.com',
          password: 'SecurePass123!',
          name: 'Duplicate',
        } as any),
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('POST /auth/login', () => {
    it('should return tokens for valid credentials (200-equivalent)', async () => {
      prisma.session.create.mockResolvedValue({ id: 'session-2' });
      const req = {
        user: mockUsers.provider,
        headers: { 'user-agent': 'test' },
        ip: '127.0.0.1',
      };

      const result = await authController.login(req, {
        email: 'dentist@dentista.com',
        password: 'Password123!',
      } as any);

      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toMatchObject({
        id: mockUsers.provider.id,
        email: mockUsers.provider.email,
      });
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return new tokens for valid refresh token (200-equivalent)', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-existing',
        refreshToken: 'valid-token',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        user: { ...mockUsers.provider, ownedTenants: mockUsers.provider.ownedTenants, tenantMemberships: [] },
        userAgent: 'test',
        ipAddress: '127.0.0.1',
      });
      prisma.session.update.mockResolvedValue({});
      prisma.session.create.mockResolvedValue({ id: 'new-session' });

      const result = await authController.refresh('valid-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid token (401-equivalent)', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(
        authController.refresh('invalid-token'),
      ).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('POST /auth/logout', () => {
    it('should revoke session and return success (200-equivalent)', async () => {
      prisma.session.updateMany.mockResolvedValue({ count: 1 });

      const result = await authController.logout('some-refresh-token');

      expect(result).toEqual({ message: 'Successfully logged out' });
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user data when authenticated', async () => {
      const userData = {
        id: mockUsers.provider.id,
        email: mockUsers.provider.email,
        name: mockUsers.provider.name,
        role: mockUsers.provider.role,
        avatarUrl: null,
        phone: null,
        createdAt: new Date(),
        ownedTenants: mockUsers.provider.ownedTenants,
        tenantMemberships: [],
      };
      prisma.user.findUnique.mockResolvedValue(userData);

      const req = { user: { userId: mockUsers.provider.id } };
      const result = await authController.getMe(req);

      expect(result.email).toBe(mockUsers.provider.email);
    });
  });

  describe('POST /auth/switch-tenant', () => {
    it('should switch tenant for user with valid membership', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue({
        id: 'membership-001',
        userId: mockUsers.provider.id,
        tenantId: 'tenant-002',
        status: 'ACTIVE',
        isActive: true,
        user: mockUsers.provider,
        tenant: { id: 'tenant-002', name: 'MediCentro' },
      });
      prisma.session.create.mockResolvedValue({ id: 'session-switch' });

      const req = {
        user: { userId: mockUsers.provider.id },
        headers: { 'user-agent': 'test' },
        ip: '127.0.0.1',
      };
      const result = await authController.switchTenant(req, 'tenant-002');

      expect(result).toHaveProperty('accessToken');
    });
  });
});
