import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
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
}
