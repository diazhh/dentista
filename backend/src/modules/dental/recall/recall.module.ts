import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { RecallService } from './recall.service';
import { RecallController } from './recall.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RecallController],
  providers: [RecallService],
  exports: [RecallService],
})
export class RecallModule {}
