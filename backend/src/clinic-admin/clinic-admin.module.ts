import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicAdminService } from './clinic-admin.service';
import { ClinicAdminController } from './clinic-admin.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ClinicAdminController],
  providers: [ClinicAdminService],
  exports: [ClinicAdminService],
})
export class ClinicAdminModule {}
