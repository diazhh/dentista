import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
                operatory: { include: { clinic: true } },
                tenant: { include: { owner: { select: { name: true } } } }, // Get dentist/clinic name
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
                dentist: apt.tenant.name, // Or tenant owner name
                location: apt.operatory?.clinic?.name || 'TBD',
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
}
