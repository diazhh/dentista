import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SharedDocumentsService } from './shared-documents.service';
import { CreateSharedDocumentDto } from './dto/create-shared-document.dto';
import { RenewSharedDocumentDto } from './dto/renew-shared-document.dto';

@ApiTags('Shared Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shared-documents')
export class SharedDocumentsController {
  constructor(private readonly sharedDocumentsService: SharedDocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Share a document with a provider (patient action)' })
  async shareDocument(@Request() req, @Body() dto: CreateSharedDocumentDto) {
    return this.sharedDocumentsService.shareDocument(req.user.userId, dto);
  }

  @Get('my-shares')
  @ApiOperation({ summary: 'List documents I have shared (patient action)' })
  async getMySharedDocuments(@Request() req) {
    return this.sharedDocumentsService.getMySharedDocuments(req.user.userId);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke a shared document (patient action)' })
  async revokeShare(@Request() req, @Param('id') shareId: string) {
    return this.sharedDocumentsService.revokeShare(req.user.userId, shareId);
  }

  @Patch(':id/renew')
  @ApiOperation({ summary: 'Renew/extend shared document expiration (patient action)' })
  async renewShare(@Request() req, @Param('id') shareId: string, @Body() dto: RenewSharedDocumentDto) {
    return this.sharedDocumentsService.renewShare(req.user.userId, shareId, dto.expiresAt);
  }

  @Get('provider')
  @ApiOperation({ summary: 'List documents shared with me (provider action)' })
  async getSharedWithProvider(@Request() req) {
    return this.sharedDocumentsService.getSharedWithProvider(req.user.userId);
  }
}
