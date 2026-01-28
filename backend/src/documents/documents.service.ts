import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async upload(
    file: Express.Multer.File,
    createDocumentDto: CreateDocumentDto,
    dentistId: string,
    tenantId: string,
  ) {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'documents', tenantId);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedFilename}`;
    const filePath = join('uploads', 'documents', tenantId, filename);
    const fullPath = join(process.cwd(), filePath);

    // Save file to disk
    await writeFile(fullPath, file.buffer);

    // Create document record
    const document = await this.prisma.document.create({
      data: {
        patientId: createDocumentDto.patientId,
        dentistId,
        tenantId,
        type: createDocumentDto.type,
        title: createDocumentDto.title,
        description: createDocumentDto.description,
        filePath,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: dentistId,
        tags: createDocumentDto.tags || [],
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
    });

    return document;
  }

  async findAll(
    dentistId: string,
    tenantId: string,
    patientId?: string,
    type?: string,
  ) {
    const where: any = { tenantId };

    if (patientId) {
      where.patientId = patientId;
    }

    if (type) {
      where.type = type;
    }

    return this.prisma.document.findMany({
      where,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, dentistId: string, tenantId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, tenantId },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async update(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
    dentistId: string,
    tenantId: string,
  ) {
    const document = await this.prisma.document.findFirst({
      where: { id, tenantId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.prisma.document.update({
      where: { id },
      data: updateDocumentDto,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
    });
  }

  async remove(id: string, dentistId: string, tenantId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, tenantId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete file from disk
    const fullPath = join(process.cwd(), document.filePath);
    if (existsSync(fullPath)) {
      await unlink(fullPath);
    }

    // Delete document record
    await this.prisma.document.delete({ where: { id } });

    return { message: 'Document deleted successfully' };
  }
}
