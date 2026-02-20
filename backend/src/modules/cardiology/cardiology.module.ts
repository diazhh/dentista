import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CardiacAssessmentsService } from './cardiac-assessments.service';
import { CardiacAssessmentsController } from './cardiac-assessments.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CardiacAssessmentsController],
  providers: [CardiacAssessmentsService],
  exports: [CardiacAssessmentsService],
})
export class CardiologyModule {}
