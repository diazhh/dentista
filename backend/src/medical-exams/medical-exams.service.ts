import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalExamDto } from './dto/create-medical-exam.dto';

@Injectable()
export class MedicalExamsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateMedicalExamDto, file: { path: string; originalname: string; size: number; mimetype: string }) {
        const patient = await this.prisma.patient.findUnique({ where: { userId } });
        if (!patient) throw new NotFoundException('Perfil de paciente no encontrado');

        return this.prisma.medicalExam.create({
            data: {
                patientId: patient.id,
                title: dto.title,
                examType: dto.examType,
                description: dto.description,
                examDate: new Date(dto.examDate),
                filePath: file.path,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                tags: dto.tags || [],
            },
        });
    }

    async findAll(userId: string) {
        const patient = await this.prisma.patient.findUnique({ where: { userId } });
        if (!patient) throw new NotFoundException('Perfil de paciente no encontrado');

        return this.prisma.medicalExam.findMany({
            where: { patientId: patient.id },
            orderBy: { examDate: 'desc' },
        });
    }

    async findOne(userId: string, examId: string) {
        const patient = await this.prisma.patient.findUnique({ where: { userId } });
        if (!patient) throw new NotFoundException('Perfil de paciente no encontrado');

        const exam = await this.prisma.medicalExam.findFirst({
            where: { id: examId, patientId: patient.id },
        });
        if (!exam) throw new NotFoundException('Examen no encontrado');
        return exam;
    }

    async remove(userId: string, examId: string) {
        const patient = await this.prisma.patient.findUnique({ where: { userId } });
        if (!patient) throw new NotFoundException('Perfil de paciente no encontrado');

        const exam = await this.prisma.medicalExam.findFirst({
            where: { id: examId, patientId: patient.id },
        });
        if (!exam) throw new NotFoundException('Examen no encontrado');

        await this.prisma.medicalExam.delete({ where: { id: examId } });
        return { message: 'Examen eliminado exitosamente' };
    }
}
