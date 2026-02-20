import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NutritionPlansService } from './nutrition-plans.service';
import { NutritionPlansController } from './nutrition-plans.controller';
import { BodyMeasurementsService } from './body-measurements.service';
import { BodyMeasurementsController } from './body-measurements.controller';

@Module({
  imports: [PrismaModule],
  controllers: [NutritionPlansController, BodyMeasurementsController],
  providers: [NutritionPlansService, BodyMeasurementsService],
  exports: [NutritionPlansService, BodyMeasurementsService],
})
export class NutritionModule {}
