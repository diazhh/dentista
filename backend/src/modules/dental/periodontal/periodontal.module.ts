import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PeriodontalService } from './periodontal.service';
import { PeriodontalController } from './periodontal.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PeriodontalController],
  providers: [PeriodontalService],
  exports: [PeriodontalService],
})
export class PeriodontalModule {}
