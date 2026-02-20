import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { GrowthRecordsService } from './growth-records.service';
import { GrowthRecordsController } from './growth-records.controller';
import { VaccinationRecordsService } from './vaccination-records.service';
import { VaccinationRecordsController } from './vaccination-records.controller';

@Module({
  imports: [PrismaModule],
  controllers: [GrowthRecordsController, VaccinationRecordsController],
  providers: [GrowthRecordsService, VaccinationRecordsService],
  exports: [GrowthRecordsService, VaccinationRecordsService],
})
export class PediatricsModule {}
