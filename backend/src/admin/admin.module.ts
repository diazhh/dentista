import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditLogService } from './audit-log.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AdminController, UsersController, PlansController],
  providers: [AdminService, AuditLogService, UsersService, PlansService],
  exports: [AdminService, AuditLogService, UsersService, PlansService],
})
export class AdminModule {}
