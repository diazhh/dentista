import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any, userAgent?: string, ipAddress?: string): Promise<LoginResponseDto> {
    // For dentists, get their tenant ID
    let tenantId = null;
    if (user.role === 'DENTIST' && user.ownedTenants && user.ownedTenants.length > 0) {
      tenantId = user.ownedTenants[0].id;
    }
    
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      tenantId: tenantId 
    };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '8h'),
    });
    
    const refreshToken = await this.generateRefreshToken(user.id, userAgent, ipAddress);
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async generateRefreshToken(userId: string, userAgent?: string, ipAddress?: string): Promise<string> {
    const token = randomBytes(64).toString('hex');
    const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date();
    
    // Parse expiration time (e.g., "7d" -> 7 days)
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      switch (unit) {
        case 'd': expiresAt.setDate(expiresAt.getDate() + value); break;
        case 'h': expiresAt.setHours(expiresAt.getHours() + value); break;
        case 'm': expiresAt.setMinutes(expiresAt.getMinutes() + value); break;
        case 's': expiresAt.setSeconds(expiresAt.getSeconds() + value); break;
      }
    }

    await this.prisma.session.create({
      data: {
        userId,
        refreshToken: token,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    return token;
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: { include: { ownedTenants: true } } },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = session.user;
    let tenantId = null;
    if (user.role === 'DENTIST' && user.ownedTenants && user.ownedTenants.length > 0) {
      tenantId = user.ownedTenants[0].id;
    }

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      tenantId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '8h'),
    });

    // Generate new refresh token and revoke old one
    await this.prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    const newRefreshToken = await this.generateRefreshToken(
      user.id,
      session.userAgent,
      session.ipAddress,
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { refreshToken },
      data: { isRevoked: true },
    });
  }

  async oauthLogin(oauthUser: any, userAgent?: string, ipAddress?: string): Promise<LoginResponseDto> {
    let user = await this.prisma.user.findUnique({
      where: {
        oauthProvider_oauthId: {
          oauthProvider: oauthUser.oauthProvider,
          oauthId: oauthUser.oauthId,
        },
      },
      include: { ownedTenants: true },
    });

    if (!user) {
      // Check if user exists with same email
      user = await this.prisma.user.findUnique({
        where: { email: oauthUser.email },
        include: { ownedTenants: true },
      });

      if (user) {
        // Link OAuth to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            oauthProvider: oauthUser.oauthProvider,
            oauthId: oauthUser.oauthId,
            avatarUrl: oauthUser.avatarUrl || user.avatarUrl,
          },
          include: { ownedTenants: true },
        });
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: oauthUser.email,
            name: oauthUser.name,
            oauthProvider: oauthUser.oauthProvider,
            oauthId: oauthUser.oauthId,
            avatarUrl: oauthUser.avatarUrl,
            role: 'PATIENT',
          },
          include: { ownedTenants: true },
        });
      }
    }

    return this.login(user, userAgent, ipAddress);
  }

  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const { password, ...userData } = registerDto;
    
    const user = await this.usersService.create({
      ...userData,
      passwordHash: hashedPassword,
    });

    return this.login(user);
  }

  /**
   * Generates a password reset token and sends email to the user
   * Returns success even if email doesn't exist (security best practice)
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return { message: 'If an account exists with this email, you will receive a password reset link.' };
    }

    // Invalidate any existing tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(), // Mark as used
      },
    });

    // Generate new token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Build reset URL
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3001');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // Send email
    try {
      await this.emailService.sendTemplateEmail('PASSWORD_RESET', email, {
        userName: user.name,
        resetUrl,
        expiresIn: '1 hour',
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      // Don't expose email sending failures to the user
    }

    return { message: 'If an account exists with this email, you will receive a password reset link.' };
  }

  /**
   * Validates the reset token and updates the user's password
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('This reset token has already been used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('This reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used in a transaction
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all sessions for security
      this.prisma.session.updateMany({
        where: { userId: resetToken.userId },
        data: { isRevoked: true },
      }),
    ]);

    this.logger.log(`Password reset successfully for user ${resetToken.userId}`);

    return { message: 'Password has been reset successfully. You can now login with your new password.' };
  }

  /**
   * Validates a reset token without using it (for frontend validation)
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { email: true } } },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return { valid: false };
    }

    return {
      valid: true,
      email: resetToken.user.email.replace(/(.{2}).*(@.*)/, '$1***$2') // Mask email for security
    };
  }

  /**
   * Switches the current tenant context for a user
   * Used when a user belongs to multiple tenants
   */
  async switchTenant(userId: string, tenantId: string, userAgent?: string, ipAddress?: string): Promise<LoginResponseDto> {
    // Verify user has access to this tenant
    const membership = await this.prisma.tenantMembership.findFirst({
      where: {
        userId,
        tenantId,
        status: 'ACTIVE',
        isActive: true,
      },
      include: {
        tenant: true,
        user: true,
      },
    });

    if (!membership) {
      // Check if user owns the tenant
      const ownedTenant = await this.prisma.tenant.findFirst({
        where: {
          id: tenantId,
          ownerId: userId,
        },
        include: {
          owner: true,
        },
      });

      if (!ownedTenant) {
        throw new UnauthorizedException('You do not have access to this tenant');
      }

      // Generate new tokens with the new tenant context
      const payload = {
        email: ownedTenant.owner.email,
        sub: userId,
        role: ownedTenant.owner.role,
        tenantId: ownedTenant.id,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '8h'),
      });

      const refreshToken = await this.generateRefreshToken(userId, userAgent, ipAddress);

      this.logger.log(`User ${userId} switched to owned tenant ${tenantId}`);

      return {
        accessToken,
        refreshToken,
        user: {
          id: userId,
          email: ownedTenant.owner.email,
          name: ownedTenant.owner.name,
          role: ownedTenant.owner.role,
        },
      };
    }

    // Generate new tokens with the new tenant context
    const payload = {
      email: membership.user.email,
      sub: userId,
      role: membership.role,
      tenantId: membership.tenantId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '8h'),
    });

    const refreshToken = await this.generateRefreshToken(userId, userAgent, ipAddress);

    this.logger.log(`User ${userId} switched to tenant ${tenantId} via membership`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email: membership.user.email,
        name: membership.user.name,
        role: membership.role,
      },
    };
  }
}
