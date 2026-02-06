import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @Request() req,
  ) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.documentsService.upload(
      file,
      createDocumentDto,
      providerId,
      tenantId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents' })
  findAll(
    @Request() req,
    @Query('patientId') patientId?: string,
    @Query('type') type?: string,
  ) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.documentsService.findAll(
      providerId,
      tenantId,
      patientId,
      type,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.documentsService.findOne(id, providerId, tenantId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document file' })
  async download(
    @Param('id') id: string,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    const document = await this.documentsService.findOne(
      id,
      providerId,
      tenantId,
    );

    const file = createReadStream(join(process.cwd(), document.filePath));
    
    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.fileName}"`,
    });

    return new StreamableFile(file);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document' })
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Request() req,
  ) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.documentsService.update(
      id,
      updateDocumentDto,
      providerId,
      tenantId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.documentsService.remove(id, providerId, tenantId);
  }
}
