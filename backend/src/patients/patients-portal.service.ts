import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { ClaimProfileDto } from './dto/claim-profile.dto';
import { DataAccessLevel } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientsPortalService {
    constructor(private prisma: PrismaService) { }

    async getDashboard(userId: string) {
        const patient = await this.prisma.patient.findUnique({
            where: { userId },
        });

        if (!patient) {
            throw new NotFoundException('Patient profile not found');
        }

        const now = new Date();

        // Next appointments
        const upcomingAppointments = await this.prisma.appointment.findMany({
            where: {
                patientId: patient.id,
                appointmentDate: { gte: now },
                status: 'SCHEDULED',
            },
            orderBy: { appointmentDate: 'asc' },
            take: 3,
            include: {
                room: { include: { clinic: true } },
                tenant: { include: { owner: { select: { name: true } } } }, // Get provider/clinic name
            },
        });

        // Recent invoices
        const recentInvoices = await this.prisma.invoice.findMany({
            where: {
                patientId: patient.id,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        return {
            patient: {
                firstName: patient.firstName,
                lastName: patient.lastName,
            },
            upcomingAppointments: upcomingAppointments.map(apt => ({
                id: apt.id,
                date: apt.appointmentDate,
                procedure: apt.procedureType,
                provider: apt.tenant.name, // Or tenant owner name
                location: apt.room?.clinic?.name || 'TBD',
            })),
            recentInvoices: recentInvoices.map(inv => ({
                id: inv.id,
                number: inv.invoiceNumber,
                amount: inv.total,
                status: inv.status,
                date: inv.issueDate,
            })),
        };
    }

    async getAppointments(userId: string) {
        const patient = await this.prisma.patient.findUnique({
            where: { userId },
        });

        if (!patient) return [];

        return this.prisma.appointment.findMany({
            where: { patientId: patient.id },
            orderBy: { appointmentDate: 'desc' },
            include: {
                tenant: { select: { name: true } },
            },
        });
    }

    async getDocuments(userId: string) {
        const patient = await this.prisma.patient.findUnique({
            where: { userId },
        });

        if (!patient) return [];

        return this.prisma.document.findMany({
            where: { patientId: patient.id },
            orderBy: { createdAt: 'desc' },
        });
    }

    async registerIndependent(dto: RegisterPatientDto) {
        const eu = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (eu) throw new ConflictException("El correo ya esta registrado");
        const ep = await this.prisma.patient.findUnique({ where: { documentType_documentId: { documentType: dto.documentType || "CEDULA", documentId: dto.documentId } } });
        if (ep) throw new ConflictException("Ya existe un paciente con este documento.");
        return this.prisma.$transaction(async (tx) => {
            const hp = await bcrypt.hash(dto.password, 10);
            const u = await tx.user.create({ data: { email: dto.email, name: dto.firstName + " " + dto.lastName, passwordHash: hp, role: "PATIENT" } });
            const pt = await tx.patient.create({ data: { userId: u.id, documentType: dto.documentType || "CEDULA", documentId: dto.documentId, firstName: dto.firstName, lastName: dto.lastName, dateOfBirth: new Date(dto.dateOfBirth), gender: dto.gender, phone: dto.phone, email: dto.email, portalEnabled: true } });
            return { user: { id: u.id, email: u.email }, patient: { id: pt.id } };
        });
    }

    async claimProfile(userId: string, dto: ClaimProfileDto) {
        const u = await this.prisma.user.findUnique({ where: { id: userId }, include: { patientProfile: true } });
        if (!u) throw new NotFoundException("Usuario no encontrado");
        if (u.patientProfile) throw new ConflictException("Ya tienes un perfil vinculado");
        const p = await this.prisma.patient.findUnique({ where: { documentType_documentId: { documentType: dto.documentType || "CEDULA", documentId: dto.documentId } } });
        if (!p) throw new NotFoundException("No se encontro paciente con ese documento");
        if (p.userId) throw new ConflictException("Perfil ya vinculado a otra cuenta");
        const up = await this.prisma.patient.update({ where: { id: p.id }, data: { userId, portalEnabled: true, email: u.email } });
        return { message: "Perfil reclamado exitosamente", patient: { id: up.id, firstName: up.firstName, lastName: up.lastName } };
    }

    async getMyProviders(userId: string) {
        const p = await this.prisma.patient.findUnique({ where: { userId } });
        if (!p) throw new NotFoundException("Perfil no encontrado");
        const r = await this.prisma.providerPatientRelation.findMany({ where: { patientId: p.id, isActive: true }, include: { tenant: { include: { owner: { select: { id: true, name: true, email: true, specialties: true } } } } }, orderBy: { startedAt: "desc" } });
        return r.map((x) => ({ id: x.id, providerId: x.providerId, providerName: x.tenant.owner.name, providerEmail: x.tenant.owner.email, providerSpecialties: x.tenant.owner.specialties, practiceName: x.tenant.name, relationType: x.relationType, dataAccessLevel: x.dataAccessLevel, startedAt: x.startedAt }));
    }

    async getMyConsents(userId: string) {
        const p = await this.prisma.patient.findUnique({ where: { userId } });
        if (!p) throw new NotFoundException("Perfil no encontrado");
        return this.prisma.patientConsent.findMany({ where: { patientId: p.id }, orderBy: { createdAt: "desc" } });
    }

    async updateDefaultAccess(userId: string, level: DataAccessLevel) {
        const p = await this.prisma.patient.findUnique({ where: { userId } });
        if (!p) throw new NotFoundException("Perfil no encontrado");
        return this.prisma.patient.update({ where: { id: p.id }, data: { defaultDataAccess: level }, select: { id: true, defaultDataAccess: true } });
    }

    async revokeConsent(userId: string, consentId: string) {
        const p = await this.prisma.patient.findUnique({ where: { userId } });
        if (!p) throw new NotFoundException("Perfil no encontrado");
        const cn = await this.prisma.patientConsent.findFirst({ where: { id: consentId, patientId: p.id } });
        if (!cn) throw new NotFoundException("Consentimiento no encontrado");
        return this.prisma.patientConsent.update({ where: { id: consentId }, data: { status: "REVOKED", revokedAt: new Date() } });
    }
}
