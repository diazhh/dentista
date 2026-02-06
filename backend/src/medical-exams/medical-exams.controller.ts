import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MedicalExamsService } from './medical-exams.service';
import { CreateMedicalExamDto } from './dto/create-medical-exam.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Medical Exams')
@Controller('medical-exams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MedicalExamsController {
    constructor(private readonly medicalExamsService: MedicalExamsService) { }

    @Post()
    @ApiOperation({ summary: 'Upload a medical exam (patient only)' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/medical-exams',
            filename: (req, file, cb) => {
                const uniqueName = uuidv4() + extname(file.originalname);
                cb(null, uniqueName);
            },
        }),
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }))
    async create(@Request() req, @Body() dto: CreateMedicalExamDto, @UploadedFile() file: Express.Multer.File) {
        return this.medicalExamsService.create(req.user.userId, dto, file);
    }

    @Get()
    @ApiOperation({ summary: 'List patient medical exams' })
    async findAll(@Request() req) {
        return this.medicalExamsService.findAll(req.user.userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get medical exam detail' })
    async findOne(@Request() req, @Param('id') id: string) {
        return this.medicalExamsService.findOne(req.user.userId, id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete own medical exam' })
    async remove(@Request() req, @Param('id') id: string) {
        return this.medicalExamsService.remove(req.user.userId, id);
    }
}
