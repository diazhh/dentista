import { Module } from '@nestjs/common';
import { TenantMembershipService } from './tenant-membership.service';
import { TenantMembershipController } from './tenant-membership.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TenantMembershipController],
  providers: [TenantMembershipService],
  exports: [TenantMembershipService],
})
export class TenantMembershipModule {}
