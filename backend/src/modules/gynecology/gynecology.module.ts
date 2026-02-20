import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { GynecologicalExamsService } from './gynecological-exams.service';
import { GynecologicalExamsController } from './gynecological-exams.controller';

@Module({
  imports: [PrismaModule],
  controllers: [GynecologicalExamsController],
  providers: [GynecologicalExamsService],
  exports: [GynecologicalExamsService],
})
export class GynecologyModule {}
