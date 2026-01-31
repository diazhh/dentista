import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PatientsPortalService {
    constructor(private prisma: PrismaService) { }

    private async getPatientByUserId(userId: string) {
        const patient = await this.prisma.patient.findUnique({
            where: { userId },
        });

        if (!patient) {
            throw new NotFoundException('Patient profile not found');
        }

        return patient;
    }

    async getDashboard(userId: string) {
        const patient = await this.getPatientByUserId(userId);

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
                operatory: { include: { clinic: true } },
                tenant: { include: { owner: { select: { name: true } } } },
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

        // Pending treatment plans
        const pendingTreatments = await this.prisma.treatmentPlan.count({
            where: {
                patientId: patient.id,
                status: { in: ['PROPOSED', 'IN_PROGRESS'] },
            },
        });

        // Pending pre-visit forms
        const pendingForms = await this.prisma.preVisitForm.count({
            where: {
                patientId: patient.id,
                status: 'PENDING',
            },
        });

        // Pending balance
        const pendingBalance = await this.prisma.invoice.aggregate({
            where: {
                patientId: patient.id,
                status: { in: ['SENT', 'OVERDUE'] },
            },
            _sum: { balance: true },
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
                dentist: apt.tenant.name,
                location: apt.operatory?.clinic?.name || 'TBD',
                hasPreVisitForm: false, // Will check below
            })),
            recentInvoices: recentInvoices.map(inv => ({
                id: inv.id,
                number: inv.invoiceNumber,
                amount: inv.total,
                status: inv.status,
                date: inv.issueDate,
            })),
            summary: {
                pendingTreatments,
                pendingForms,
                pendingBalance: pendingBalance._sum.balance || 0,
                upcomingAppointmentsCount: upcomingAppointments.length,
            },
        };
    }

    async getAppointments(userId: string) {
        const patient = await this.getPatientByUserId(userId);

        const appointments = await this.prisma.appointment.findMany({
            where: { patientId: patient.id },
            orderBy: { appointmentDate: 'desc' },
            include: {
                tenant: { select: { name: true } },
                operatory: { include: { clinic: true } },
            },
        });

        // Get pre-visit forms for upcoming appointments
        const appointmentIds = appointments.map(a => a.id);
        const preVisitForms = await this.prisma.preVisitForm.findMany({
            where: { appointmentId: { in: appointmentIds } },
            select: { appointmentId: true, status: true },
        });

        const formsByAppointment = new Map(preVisitForms.map(f => [f.appointmentId, f]));

        return appointments.map(apt => ({
            ...apt,
            preVisitForm: formsByAppointment.get(apt.id) || null,
        }));
    }

    async getDocuments(userId: string) {
        const patient = await this.getPatientByUserId(userId);

        return this.prisma.document.findMany({
            where: { patientId: patient.id },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ==========================================
    // Treatment Plans
    // ==========================================

    async getTreatmentPlans(userId: string) {
        const patient = await this.getPatientByUserId(userId);

        return this.prisma.treatmentPlan.findMany({
            where: { patientId: patient.id },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    orderBy: { priority: 'asc' },
                },
            },
        });
    }

    async getTreatmentPlanById(userId: string, planId: string) {
        const patient = await this.getPatientByUserId(userId);

        const plan = await this.prisma.treatmentPlan.findFirst({
            where: {
                id: planId,
                patientId: patient.id,
            },
            include: {
                items: {
                    orderBy: { priority: 'asc' },
                },
            },
        });

        if (!plan) {
            throw new NotFoundException('Treatment plan not found');
        }

        return plan;
    }

    async acceptTreatmentPlan(userId: string, planId: string) {
        const patient = await this.getPatientByUserId(userId);

        const plan = await this.prisma.treatmentPlan.findFirst({
            where: {
                id: planId,
                patientId: patient.id,
                status: 'PROPOSED',
            },
        });

        if (!plan) {
            throw new NotFoundException('Treatment plan not found or not in PROPOSED status');
        }

        return this.prisma.treatmentPlan.update({
            where: { id: planId },
            data: {
                status: 'ACCEPTED',
                startDate: new Date(),
            },
            include: {
                items: true,
            },
        });
    }

    async rejectTreatmentPlan(userId: string, planId: string, reason?: string) {
        const patient = await this.getPatientByUserId(userId);

        const plan = await this.prisma.treatmentPlan.findFirst({
            where: {
                id: planId,
                patientId: patient.id,
                status: 'PROPOSED',
            },
        });

        if (!plan) {
            throw new NotFoundException('Treatment plan not found or not in PROPOSED status');
        }

        return this.prisma.treatmentPlan.update({
            where: { id: planId },
            data: {
                status: 'CANCELLED',
                notes: reason ? `Patient declined: ${reason}` : 'Patient declined',
            },
            include: {
                items: true,
            },
        });
    }

    // ==========================================
    // Payments History
    // ==========================================

    async getPayments(userId: string) {
        const patient = await this.getPatientByUserId(userId);

        return this.prisma.payment.findMany({
            where: { patientId: patient.id },
            orderBy: { paymentDate: 'desc' },
            include: {
                invoice: {
                    select: {
                        invoiceNumber: true,
                        total: true,
                    },
                },
            },
        });
    }

    async getPaymentsSummary(userId: string) {
        const patient = await this.getPatientByUserId(userId);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const [totalPaid, paidThisMonth, paidThisYear, pendingBalance] = await Promise.all([
            this.prisma.payment.aggregate({
                where: {
                    patientId: patient.id,
                    status: 'COMPLETED',
                },
                _sum: { amount: true },
            }),
            this.prisma.payment.aggregate({
                where: {
                    patientId: patient.id,
                    status: 'COMPLETED',
                    paymentDate: { gte: startOfMonth },
                },
                _sum: { amount: true },
            }),
            this.prisma.payment.aggregate({
                where: {
                    patientId: patient.id,
                    status: 'COMPLETED',
                    paymentDate: { gte: startOfYear },
                },
                _sum: { amount: true },
            }),
            this.prisma.invoice.aggregate({
                where: {
                    patientId: patient.id,
                    status: { in: ['SENT', 'OVERDUE'] },
                },
                _sum: { balance: true },
            }),
        ]);

        return {
            totalPaid: totalPaid._sum.amount || 0,
            paidThisMonth: paidThisMonth._sum.amount || 0,
            paidThisYear: paidThisYear._sum.amount || 0,
            pendingBalance: pendingBalance._sum.balance || 0,
        };
    }

    // ==========================================
    // Invoices (extended)
    // ==========================================

    async getInvoices(userId: string) {
        const patient = await this.getPatientByUserId(userId);

        return this.prisma.invoice.findMany({
            where: { patientId: patient.id },
            orderBy: { createdAt: 'desc' },
            include: {
                items: true,
                payments: {
                    orderBy: { paymentDate: 'desc' },
                },
            },
        });
    }

    async getInvoiceById(userId: string, invoiceId: string) {
        const patient = await this.getPatientByUserId(userId);

        const invoice = await this.prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                patientId: patient.id,
            },
            include: {
                items: true,
                payments: {
                    orderBy: { paymentDate: 'desc' },
                },
                treatmentPlan: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        return invoice;
    }

    // ==========================================
    // Pre-Visit Forms
    // ==========================================

    async getPreVisitForms(userId: string) {
        const patient = await this.getPatientByUserId(userId);

        return this.prisma.preVisitForm.findMany({
            where: { patientId: patient.id },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getPreVisitFormForAppointment(userId: string, appointmentId: string) {
        const patient = await this.getPatientByUserId(userId);

        // Verify appointment belongs to patient
        const appointment = await this.prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                patientId: patient.id,
            },
        });

        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        let form = await this.prisma.preVisitForm.findFirst({
            where: {
                appointmentId,
                patientId: patient.id,
            },
        });

        // Create form if it doesn't exist
        if (!form) {
            // Get patient's existing data to pre-fill
            form = await this.prisma.preVisitForm.create({
                data: {
                    patientId: patient.id,
                    appointmentId,
                    tenantId: appointment.tenantId,
                    currentMedications: patient.medications || [],
                    allergiesUpdate: patient.allergies || [],
                    medicalConditions: [],
                    emergencyContactName: patient.emergencyContactName,
                    emergencyContactPhone: patient.emergencyContactPhone,
                },
            });
        }

        return form;
    }

    async submitPreVisitForm(userId: string, appointmentId: string, data: {
        currentMedications?: string[];
        allergiesUpdate?: string[];
        medicalConditions?: string[];
        recentSurgeries?: string;
        chiefComplaint?: string;
        painLevel?: number;
        painLocation?: string;
        symptomsDuration?: string;
        lastDentalVisit?: Date;
        brushingFrequency?: string;
        flossingFrequency?: string;
        hasInsuranceChanges?: boolean;
        insuranceProvider?: string;
        insurancePolicyNumber?: string;
        insuranceGroupNumber?: string;
        emergencyContactName?: string;
        emergencyContactPhone?: string;
        emergencyContactRelation?: string;
        consentGiven?: boolean;
        additionalNotes?: string;
    }) {
        const patient = await this.getPatientByUserId(userId);

        // Verify appointment belongs to patient
        const appointment = await this.prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                patientId: patient.id,
            },
        });

        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        if (!data.consentGiven) {
            throw new BadRequestException('Consent must be given to submit the form');
        }

        const form = await this.prisma.preVisitForm.upsert({
            where: {
                id: (await this.prisma.preVisitForm.findFirst({
                    where: { appointmentId, patientId: patient.id },
                    select: { id: true },
                }))?.id || 'new',
            },
            create: {
                patientId: patient.id,
                appointmentId,
                tenantId: appointment.tenantId,
                ...data,
                status: 'SUBMITTED',
                submittedAt: new Date(),
                consentDate: new Date(),
            },
            update: {
                ...data,
                status: 'SUBMITTED',
                submittedAt: new Date(),
                consentDate: new Date(),
            },
        });

        // Update patient's emergency contact if changed
        if (data.emergencyContactName || data.emergencyContactPhone) {
            await this.prisma.patient.update({
                where: { id: patient.id },
                data: {
                    emergencyContactName: data.emergencyContactName,
                    emergencyContactPhone: data.emergencyContactPhone,
                },
            });
        }

        // Update patient's medications and allergies
        if (data.currentMedications || data.allergiesUpdate) {
            await this.prisma.patient.update({
                where: { id: patient.id },
                data: {
                    medications: data.currentMedications || undefined,
                    allergies: data.allergiesUpdate || undefined,
                },
            });
        }

        return form;
    }

    // ==========================================
    // Insurance Documents
    // ==========================================

    async getInsuranceDocuments(userId: string) {
        const patient = await this.getPatientByUserId(userId);

        return this.prisma.insuranceDocument.findMany({
            where: { patientId: patient.id },
            orderBy: { createdAt: 'desc' },
        });
    }

    async uploadInsuranceDocument(
        userId: string,
        file: Express.Multer.File,
        data: {
            documentType: string;
            title: string;
            insuranceProvider?: string;
            policyNumber?: string;
            groupNumber?: string;
            expirationDate?: Date;
        }
    ) {
        const patient = await this.getPatientByUserId(userId);

        // Get tenant from patient's active relation
        const relation = await this.prisma.patientDentistRelation.findFirst({
            where: {
                patientId: patient.id,
                isActive: true,
            },
        });

        if (!relation) {
            throw new BadRequestException('No active dental practice found');
        }

        // Save file
        const uploadDir = path.join(process.cwd(), 'uploads', 'insurance', relation.tenantId);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);

        return this.prisma.insuranceDocument.create({
            data: {
                patientId: patient.id,
                tenantId: relation.tenantId,
                documentType: data.documentType,
                title: data.title,
                filePath: `/uploads/insurance/${relation.tenantId}/${fileName}`,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                insuranceProvider: data.insuranceProvider,
                policyNumber: data.policyNumber,
                groupNumber: data.groupNumber,
                expirationDate: data.expirationDate,
            },
        });
    }

    async deleteInsuranceDocument(userId: string, documentId: string) {
        const patient = await this.getPatientByUserId(userId);

        const document = await this.prisma.insuranceDocument.findFirst({
            where: {
                id: documentId,
                patientId: patient.id,
            },
        });

        if (!document) {
            throw new NotFoundException('Insurance document not found');
        }

        // Delete file from disk
        const fullPath = path.join(process.cwd(), document.filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        return this.prisma.insuranceDocument.delete({
            where: { id: documentId },
        });
    }

    // ==========================================
    // Profile
    // ==========================================

    async getProfile(userId: string) {
        const patient = await this.prisma.patient.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        if (!patient) {
            throw new NotFoundException('Patient profile not found');
        }

        return {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.user?.email,
            phone: patient.phone,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            documentId: patient.documentId,
            allergies: patient.allergies,
            medications: patient.medications,
            emergencyContactName: patient.emergencyContactName,
            emergencyContactPhone: patient.emergencyContactPhone,
            avatarUrl: patient.user?.avatarUrl,
        };
    }

    async updateProfile(userId: string, data: {
        phone?: string;
        emergencyContactName?: string;
        emergencyContactPhone?: string;
    }) {
        const patient = await this.getPatientByUserId(userId);

        return this.prisma.patient.update({
            where: { id: patient.id },
            data,
        });
    }
}
