import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ImagingService } from './imaging.service';
import { ImagingController } from './imaging.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ImagingController],
  providers: [ImagingService],
  exports: [ImagingService],
})
export class ImagingModule {}
