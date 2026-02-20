import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TherapySessionsService } from './therapy-sessions.service';
import { TherapySessionsController } from './therapy-sessions.controller';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TherapySessionsController, AssessmentsController],
  providers: [TherapySessionsService, AssessmentsService],
  exports: [TherapySessionsService, AssessmentsService],
})
export class PsychologyModule {}
