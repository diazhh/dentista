import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExercisePlansService } from './exercise-plans.service';
import { ExercisePlansController } from './exercise-plans.controller';
import { FunctionalAssessmentsService } from './functional-assessments.service';
import { FunctionalAssessmentsController } from './functional-assessments.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ExercisePlansController, FunctionalAssessmentsController],
  providers: [ExercisePlansService, FunctionalAssessmentsService],
  exports: [ExercisePlansService, FunctionalAssessmentsService],
})
export class PhysiotherapyModule {}
