import { Module } from '@nestjs/common';
import { SharedDocumentsController } from './shared-documents.controller';
import { SharedDocumentsService } from './shared-documents.service';

@Module({
  controllers: [SharedDocumentsController],
  providers: [SharedDocumentsService],
  exports: [SharedDocumentsService],
})
export class SharedDocumentsModule {}
