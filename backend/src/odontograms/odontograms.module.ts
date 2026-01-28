import { Module } from '@nestjs/common';
import { OdontogramsService } from './odontograms.service';
import { OdontogramsController } from './odontograms.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OdontogramsController],
  providers: [OdontogramsService],
  exports: [OdontogramsService],
})
export class OdontogramsModule {}
