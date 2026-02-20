import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SkinLesionsService } from './skin-lesions.service';
import { SkinLesionsController } from './skin-lesions.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SkinLesionsController],
  providers: [SkinLesionsService],
  exports: [SkinLesionsService],
})
export class DermatologyModule {}
