import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { LabCasesService } from './lab-cases.service';
import { LabCasesController } from './lab-cases.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LabCasesController],
  providers: [LabCasesService],
  exports: [LabCasesService],
})
export class LabCasesModule {}
