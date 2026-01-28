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
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    return this.documentsService.upload(
      file,
      createDocumentDto,
      dentistId,
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
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    return this.documentsService.findAll(
      dentistId,
      tenantId,
      patientId,
      type,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    return this.documentsService.findOne(id, dentistId, tenantId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document file' })
  async download(
    @Param('id') id: string,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    const document = await this.documentsService.findOne(
      id,
      dentistId,
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
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    return this.documentsService.update(
      id,
      updateDocumentDto,
      dentistId,
      tenantId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  remove(@Param('id') id: string, @Request() req) {
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    return this.documentsService.remove(id, dentistId, tenantId);
  }
}
