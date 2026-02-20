import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { ClaimProfileDto } from './dto/claim-profile.dto';
import { UpdateHealthProfileDto } from './dto/update-health-profile.dto';
import { GrantConsentDto } from './dto/grant-consent.dto';
import { ModifyConsentDto } from './dto/modify-consent.dto';
import { ShareExamDto } from './dto/share-exam.dto';
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

    // ==========================================
    // Phase 4 - Portal del Paciente Avanzado
    // ==========================================

    async getEnhancedDashboard(userId: string) {
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
                tenant: { include: { owner: { select: { name: true } } } },
            },
        });

        // Recent invoices
        const recentInvoices = await this.prisma.invoice.findMany({
            where: { patientId: patient.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        // Providers count
        const providersCount = await this.prisma.providerPatientRelation.count({
            where: { patientId: patient.id, isActive: true },
        });

        // Exams count
        const examsCount = await this.prisma.medicalExam.count({
            where: { patientId: patient.id },
        });

        // Pending consents count
        const pendingConsentsCount = await this.prisma.patientConsent.count({
            where: { patientId: patient.id, status: 'PENDING' },
        });

        // Recent exams
        const recentExams = await this.prisma.medicalExam.findMany({
            where: { patientId: patient.id },
            orderBy: { examDate: 'desc' },
            take: 3,
        });

        return {
            patient: {
                id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                email: patient.email,
            },
            upcomingAppointments: upcomingAppointments.map(apt => ({
                id: apt.id,
                date: apt.appointmentDate,
                procedure: apt.procedureType,
                provider: apt.tenant.name,
                location: apt.room?.clinic?.name || 'TBD',
            })),
            recentInvoices: recentInvoices.map(inv => ({
                id: inv.id,
                number: inv.invoiceNumber,
                amount: inv.total,
                status: inv.status,
                date: inv.issueDate,
            })),
            providersCount,
            examsCount,
            pendingConsentsCount,
            recentExams: recentExams.map(exam => ({
                id: exam.id,
                title: exam.title,
                examType: exam.examType,
                examDate: exam.examDate,
            })),
        };
    }

    async getHealthProfile(userId: string) {
        const patient = await this.prisma.patient.findUnique({
            where: { userId },
        });

        if (!patient) {
            throw new NotFoundException('Patient profile not found');
        }

        return {
            id: patient.id,
            bloodType: patient.bloodType,
            allergies: patient.allergies,
            medications: patient.medications,
            chronicConditions: patient.chronicConditions,
            emergencyContactName: patient.emergencyContactName,
            emergencyContactPhone: patient.emergencyContactPhone,
            emergencyContactRelation: patient.emergencyContactRelation,
            medicalHistory: patient.medicalHistory,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
        };
    }

    async updateHealthProfile(userId: string, dto: UpdateHealthProfileDto) {
        const patient = await this.prisma.patient.findUnique({
            where: { userId },
        });

        if (!patient) {
            throw new NotFoundException('Patient profile not found');
        }

        const data: any = {};
        if (dto.bloodType !== undefined) data.bloodType = dto.bloodType;
        if (dto.allergies !== undefined) data.allergies = dto.allergies;
        if (dto.medications !== undefined) data.medications = dto.medications;
        if (dto.chronicConditions !== undefined) data.chronicConditions = dto.chronicConditions;
        if (dto.emergencyContactName !== undefined) data.emergencyContactName = dto.emergencyContactName;
        if (dto.emergencyContactPhone !== undefined) data.emergencyContactPhone = dto.emergencyContactPhone;
        if (dto.emergencyContactRelation !== undefined) data.emergencyContactRelation = dto.emergencyContactRelation;

        return this.prisma.patient.update({
            where: { id: patient.id },
            data,
            select: {
                id: true,
                bloodType: true,
                allergies: true,
                medications: true,
                chronicConditions: true,
                emergencyContactName: true,
                emergencyContactPhone: true,
                emergencyContactRelation: true,
            },
        });
    }

    async getNotifications(userId: string) {
        const patient = await this.prisma.patient.findUnique({
            where: { userId },
        });

        if (!patient) {
            throw new NotFoundException('Patient profile not found');
        }

        // Pending consent requests
        const pendingConsents = await this.prisma.patientConsent.findMany({
            where: { patientId: patient.id, status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
        });

        // Upcoming appointments within 48 hours
        const now = new Date();
        const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const upcomingAppointments = await this.prisma.appointment.findMany({
            where: {
                patientId: patient.id,
                appointmentDate: { gte: now, lte: in48Hours },
                status: 'SCHEDULED',
            },
            orderBy: { appointmentDate: 'asc' },
            include: {
                tenant: { select: { name: true } },
                room: { include: { clinic: { select: { name: true } } } },
            },
        });

        const notifications: Array<{
            id: string;
            type: string;
            title: string;
            message: string;
            date: Date;
            data?: any;
        }> = [];

        for (const consent of pendingConsents) {
            notifications.push({
                id: consent.id,
                type: 'CONSENT_REQUEST',
                title: 'Solicitud de consentimiento',
                message: `Un proveedor ha solicitado acceso a tus datos médicos.`,
                date: consent.createdAt,
                data: { consentId: consent.id, providerId: consent.providerId },
            });
        }

        for (const apt of upcomingAppointments) {
            notifications.push({
                id: apt.id,
                type: 'APPOINTMENT_REMINDER',
                title: 'Recordatorio de cita',
                message: `Tienes una cita de ${apt.procedureType} en ${apt.tenant.name} el ${apt.appointmentDate.toISOString()}.`,
                date: apt.appointmentDate,
                data: { appointmentId: apt.id, provider: apt.tenant.name, location: apt.room?.clinic?.name || 'TBD' },
            });
        }

        // Sort by date descending
        notifications.sort((a, b) => b.date.getTime() - a.date.getTime());

        return notifications;
    }

    async grantConsent(userId: string, consentId: string, dto: GrantConsentDto) {
        const patient = await this.prisma.patient.findUnique({ where: { userId } });
        if (!patient) throw new NotFoundException('Perfil no encontrado');

        const consent = await this.prisma.patientConsent.findFirst({
            where: { id: consentId, patientId: patient.id },
        });
        if (!consent) throw new NotFoundException('Consentimiento no encontrado');

        if (consent.status !== 'PENDING') {
            throw new BadRequestException('Solo se puede otorgar un consentimiento pendiente');
        }

        const data: any = {
            status: 'GRANTED',
            grantedAt: new Date(),
        };

        if (dto.dataAccessLevel) {
            data.dataAccessLevel = dto.dataAccessLevel as DataAccessLevel;
        }
        if (dto.shareAppointments !== undefined) data.shareAppointments = dto.shareAppointments;
        if (dto.shareMedicalHistory !== undefined) data.shareMedicalHistory = dto.shareMedicalHistory;
        if (dto.shareDocuments !== undefined) data.shareDocuments = dto.shareDocuments;
        if (dto.shareLabResults !== undefined) data.shareLabResults = dto.shareLabResults;
        if (dto.shareBilling !== undefined) data.shareBilling = dto.shareBilling;

        return this.prisma.patientConsent.update({
            where: { id: consentId },
            data,
        });
    }

    async denyConsent(userId: string, consentId: string) {
        const patient = await this.prisma.patient.findUnique({ where: { userId } });
        if (!patient) throw new NotFoundException('Perfil no encontrado');

        const consent = await this.prisma.patientConsent.findFirst({
            where: { id: consentId, patientId: patient.id },
        });
        if (!consent) throw new NotFoundException('Consentimiento no encontrado');

        if (consent.status !== 'PENDING') {
            throw new BadRequestException('Solo se puede denegar un consentimiento pendiente');
        }

        return this.prisma.patientConsent.update({
            where: { id: consentId },
            data: { status: 'DENIED' },
        });
    }

    async modifyConsent(userId: string, consentId: string, dto: ModifyConsentDto) {
        const patient = await this.prisma.patient.findUnique({ where: { userId } });
        if (!patient) throw new NotFoundException('Perfil no encontrado');

        const consent = await this.prisma.patientConsent.findFirst({
            where: { id: consentId, patientId: patient.id },
        });
        if (!consent) throw new NotFoundException('Consentimiento no encontrado');

        if (consent.status !== 'GRANTED') {
            throw new BadRequestException('Solo se puede modificar un consentimiento otorgado');
        }

        const data: any = {};
        if (dto.dataAccessLevel) {
            data.dataAccessLevel = dto.dataAccessLevel as DataAccessLevel;
        }
        if (dto.shareAppointments !== undefined) data.shareAppointments = dto.shareAppointments;
        if (dto.shareMedicalHistory !== undefined) data.shareMedicalHistory = dto.shareMedicalHistory;
        if (dto.shareDocuments !== undefined) data.shareDocuments = dto.shareDocuments;
        if (dto.shareLabResults !== undefined) data.shareLabResults = dto.shareLabResults;
        if (dto.shareBilling !== undefined) data.shareBilling = dto.shareBilling;

        return this.prisma.patientConsent.update({
            where: { id: consentId },
            data,
        });
    }

    async shareExam(userId: string, examId: string, dto: ShareExamDto) {
        const patient = await this.prisma.patient.findUnique({ where: { userId } });
        if (!patient) throw new NotFoundException('Perfil no encontrado');

        // Verify exam belongs to patient
        const exam = await this.prisma.medicalExam.findFirst({
            where: { id: examId, patientId: patient.id },
        });
        if (!exam) throw new NotFoundException('Examen no encontrado');

        // Check for existing active share
        const existing = await this.prisma.sharedDocument.findUnique({
            where: { documentId_providerId: { documentId: examId, providerId: dto.providerId } },
        });

        if (existing && existing.isActive) {
            throw new ConflictException('Este examen ya está compartido con este proveedor');
        }

        if (existing && !existing.isActive) {
            // Reactivate existing share
            return this.prisma.sharedDocument.update({
                where: { id: existing.id },
                data: {
                    isActive: true,
                    revokedAt: null,
                    sharedAt: new Date(),
                    expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                },
            });
        }

        return this.prisma.sharedDocument.create({
            data: {
                patientId: patient.id,
                documentId: examId,
                providerId: dto.providerId,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            },
        });
    }

    async unshareExam(userId: string, shareId: string) {
        const patient = await this.prisma.patient.findUnique({ where: { userId } });
        if (!patient) throw new NotFoundException('Perfil no encontrado');

        const share = await this.prisma.sharedDocument.findFirst({
            where: { id: shareId, patientId: patient.id },
        });
        if (!share) throw new NotFoundException('Compartición no encontrada');

        if (!share.isActive) {
            throw new ConflictException('Esta compartición ya fue revocada');
        }

        return this.prisma.sharedDocument.update({
            where: { id: shareId },
            data: { isActive: false, revokedAt: new Date() },
        });
    }

    async getExamShares(userId: string) {
        const patient = await this.prisma.patient.findUnique({ where: { userId } });
        if (!patient) throw new NotFoundException('Perfil no encontrado');

        const shares = await this.prisma.sharedDocument.findMany({
            where: { patientId: patient.id, isActive: true },
            orderBy: { sharedAt: 'desc' },
        });

        // Enrich with exam and provider info
        const enrichedShares = await Promise.all(
            shares.map(async (share) => {
                const exam = await this.prisma.medicalExam.findUnique({
                    where: { id: share.documentId },
                    select: { id: true, title: true, examType: true, examDate: true },
                });

                const providerRelation = await this.prisma.providerPatientRelation.findFirst({
                    where: { providerId: share.providerId },
                    include: {
                        tenant: { include: { owner: { select: { id: true, name: true, email: true } } } },
                    },
                });

                return {
                    id: share.id,
                    sharedAt: share.sharedAt,
                    expiresAt: share.expiresAt,
                    exam: exam || { id: share.documentId, title: 'Unknown', examType: 'Unknown', examDate: null },
                    provider: providerRelation
                        ? {
                            id: providerRelation.tenant.owner.id,
                            name: providerRelation.tenant.owner.name,
                            email: providerRelation.tenant.owner.email,
                            practiceName: providerRelation.tenant.name,
                        }
                        : { id: share.providerId, name: 'Unknown', email: null, practiceName: null },
                };
            }),
        );

        return enrichedShares;
    }
}
