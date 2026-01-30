import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DashboardSummaryDto,
  DashboardMetricsDto,
  TimelineItemDto,
  AlertDto,
} from './dto/dashboard-summary.dto';
import {
  AppointmentDetailDto,
  AppointmentClinicalNotesDto,
  AppointmentFinancialDto,
} from './dto/appointment-detail.dto';

@Injectable()
export class PatientsDashboardService {
  constructor(private prisma: PrismaService) {}

  async validatePatientAccess(dentistId: string, tenantId: string, patientId: string): Promise<void> {
    const relation = await this.prisma.patientDentistRelation.findFirst({
      where: {
        patientId,
        dentistId,
        tenantId,
        isActive: true,
      },
    });

    if (!relation) {
      throw new ForbiddenException('No access to this patient');
    }
  }

  async getDashboardSummary(
    patientId: string,
    dentistId: string,
    tenantId: string,
  ): Promise<DashboardSummaryDto> {
    await this.validatePatientAccess(dentistId, tenantId, patientId);

    const [metrics, timeline, alerts, quickStats] = await Promise.all([
      this.getMetrics(patientId, dentistId),
      this.getRecentTimeline(patientId, dentistId),
      this.getAlerts(patientId, dentistId),
      this.getQuickStats(patientId, dentistId),
    ]);

    return {
      metrics,
      recentTimeline: timeline,
      alerts,
      quickStats,
    };
  }

  private async getMetrics(
    patientId: string,
    dentistId: string,
  ): Promise<DashboardMetricsDto> {
    const now = new Date();

    // Next appointment
    const nextAppointment = await this.prisma.appointment.findFirst({
      where: {
        patientId,
        dentistId,
        appointmentDate: { gte: now },
        status: 'SCHEDULED',
      },
      orderBy: { appointmentDate: 'asc' },
    });

    // Active treatments
    const activeTreatments = await this.prisma.treatmentPlan.count({
      where: {
        patientId,
        dentistId,
        status: { in: ['PROPOSED', 'ACCEPTED', 'IN_PROGRESS'] },
      },
    });

    // Pending balance
    const invoices = await this.prisma.invoice.findMany({
      where: {
        patientId,
        dentistId,
        status: { in: ['SENT', 'OVERDUE'] },
      },
      select: { balance: true },
    });
    const pendingBalance = invoices.reduce((sum, inv) => sum + inv.balance, 0);

    // Last visit
    const lastVisit = await this.prisma.appointment.findFirst({
      where: {
        patientId,
        dentistId,
        status: 'COMPLETED',
        appointmentDate: { lt: now },
      },
      orderBy: { appointmentDate: 'desc' },
      select: { appointmentDate: true },
    });

    return {
      nextAppointment: nextAppointment
        ? {
            id: nextAppointment.id,
            date: nextAppointment.appointmentDate.toISOString().split('T')[0],
            time: nextAppointment.appointmentDate.toISOString().split('T')[1].substring(0, 5),
            type: nextAppointment.procedureType || 'Consulta',
            duration: nextAppointment.duration,
          }
        : undefined,
      activeTreatments,
      pendingBalance,
      lastVisit: lastVisit?.appointmentDate.toISOString().split('T')[0],
    };
  }

  private async getRecentTimeline(
    patientId: string,
    dentistId: string,
  ): Promise<TimelineItemDto[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timeline: TimelineItemDto[] = [];

    // Recent appointments
    const appointments = await this.prisma.appointment.findMany({
      where: {
        patientId,
        dentistId,
        appointmentDate: { gte: thirtyDaysAgo },
        status: 'COMPLETED',
      },
      orderBy: { appointmentDate: 'desc' },
      take: 10,
    });

    appointments.forEach((apt) => {
      timeline.push({
        id: apt.id,
        type: 'appointment',
        date: apt.appointmentDate.toISOString(),
        title: `Cita: ${apt.procedureType || 'Consulta'}`,
        description: apt.notes || 'Cita completada',
        icon: '📅',
        metadata: { status: apt.status },
      });
    });

    // Recent payments
    const payments = await this.prisma.payment.findMany({
      where: {
        invoice: {
          patientId,
          dentistId,
        },
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { invoice: true },
    });

    payments.forEach((payment) => {
      timeline.push({
        id: payment.id,
        type: 'payment',
        date: payment.createdAt.toISOString(),
        title: `Pago recibido: $${payment.amount}`,
        description: `Factura ${payment.invoice.invoiceNumber}`,
        icon: '💳',
        metadata: { method: payment.paymentMethod },
      });
    });

    // Recent documents
    const documents = await this.prisma.document.findMany({
      where: {
        patientId,
        dentistId,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    documents.forEach((doc) => {
      timeline.push({
        id: doc.id,
        type: 'document',
        date: doc.createdAt.toISOString(),
        title: `Documento: ${doc.title}`,
        description: doc.description || doc.type,
        icon: '📄',
        metadata: { type: doc.type },
      });
    });

    // Sort by date descending
    return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private async getAlerts(patientId: string, dentistId: string): Promise<AlertDto[]> {
    const alerts: AlertDto[] = [];
    const now = new Date();

    // Check for overdue invoices
    const overdueInvoices = await this.prisma.invoice.count({
      where: {
        patientId,
        dentistId,
        status: 'OVERDUE',
      },
    });

    if (overdueInvoices > 0) {
      alerts.push({
        id: 'overdue-invoices',
        type: 'danger',
        title: 'Facturas Vencidas',
        message: `${overdueInvoices} factura(s) vencida(s)`,
        priority: 'high',
      });
    }

    // Check for upcoming appointments
    const upcomingAppointments = await this.prisma.appointment.findMany({
      where: {
        patientId,
        dentistId,
        appointmentDate: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
        status: 'SCHEDULED',
      },
    });

    if (upcomingAppointments.length > 0) {
      alerts.push({
        id: 'upcoming-appointments',
        type: 'info',
        title: 'Citas Próximas',
        message: `${upcomingAppointments.length} cita(s) en los próximos 7 días`,
        priority: 'medium',
      });
    }

    // Check for allergies
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { allergies: true },
    });

    if (patient?.allergies && patient.allergies.length > 0) {
      alerts.push({
        id: 'allergies',
        type: 'warning',
        title: 'Alergias Registradas',
        message: `Paciente alérgico a: ${patient.allergies.join(', ')}`,
        priority: 'high',
      });
    }

    // Check for pending treatments
    const pendingTreatments = await this.prisma.treatmentPlan.count({
      where: {
        patientId,
        dentistId,
        status: { in: ['PROPOSED', 'ACCEPTED'] },
      },
    });

    if (pendingTreatments > 0) {
      alerts.push({
        id: 'pending-treatments',
        type: 'info',
        title: 'Tratamientos Pendientes',
        message: `${pendingTreatments} plan(es) de tratamiento pendiente(s)`,
        priority: 'medium',
      });
    }

    return alerts;
  }

  private async getQuickStats(patientId: string, dentistId: string) {
    const [totalAppointments, completedTreatments, payments, documentsCount] =
      await Promise.all([
        this.prisma.appointment.count({
          where: { patientId, dentistId },
        }),
        this.prisma.treatmentPlan.count({
          where: {
            patientId,
            dentistId,
            status: 'COMPLETED',
          },
        }),
        this.prisma.payment.findMany({
          where: {
            invoice: {
              patientId,
              dentistId,
            },
          },
          select: { amount: true },
        }),
        this.prisma.document.count({
          where: { patientId, dentistId },
        }),
      ]);

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalAppointments,
      completedTreatments,
      totalPaid,
      documentsCount,
    };
  }

  async getAppointmentDetail(
    patientId: string,
    appointmentId: string,
    dentistId: string,
    tenantId: string,
  ): Promise<AppointmentDetailDto> {
    await this.validatePatientAccess(dentistId, tenantId, patientId);

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        operatory: {
          include: {
            clinic: true,
          },
        },
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!appointment || appointment.patientId !== patientId) {
      throw new NotFoundException('Appointment not found');
    }

    // Get dentist info
    const dentist = await this.prisma.user.findUnique({
      where: { id: dentistId },
      select: { id: true, name: true },
    });

    // Get related invoice
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        patientId,
        dentistId,
        // Find invoice around appointment date
        createdAt: {
          gte: new Date(appointment.appointmentDate.getTime() - 7 * 24 * 60 * 60 * 1000),
          lte: new Date(appointment.appointmentDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        items: true,
        payments: true,
      },
    });

    // Get related documents
    const documents = await this.prisma.document.findMany({
      where: {
        patientId,
        dentistId,
        createdAt: {
          gte: new Date(appointment.appointmentDate.getTime() - 1 * 24 * 60 * 60 * 1000),
          lte: new Date(appointment.appointmentDate.getTime() + 1 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Get related treatment plan
    const treatmentPlan = await this.prisma.treatmentPlan.findFirst({
      where: {
        patientId,
        dentistId,
        status: { in: ['IN_PROGRESS', 'COMPLETED'] },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get related odontogram
    const odontogram = await this.prisma.odontogram.findFirst({
      where: {
        patientId,
        dentistId,
      },
      orderBy: { createdAt: 'desc' },
    });

    const clinicalNotes: AppointmentClinicalNotesDto = {
      notes: appointment.notes || undefined,
    };

    const financial: AppointmentFinancialDto = {
      totalCost: invoice?.total || 0,
      paidAmount: invoice?.payments.reduce((sum, p) => sum + p.amount, 0) || 0,
      pendingBalance: invoice?.balance || 0,
      invoiceId: invoice?.id,
      invoiceNumber: invoice?.invoiceNumber,
    };

    const appointmentTime = appointment.appointmentDate.toISOString().split('T')[1].substring(0, 5);
    const endTime = new Date(appointment.appointmentDate.getTime() + appointment.duration * 60000)
      .toISOString()
      .split('T')[1]
      .substring(0, 5);

    return {
      appointment: {
        id: appointment.id,
        date: appointment.appointmentDate.toISOString().split('T')[0],
        startTime: appointmentTime,
        endTime: endTime,
        duration: appointment.duration,
        status: appointment.status,
        type: appointment.procedureType || 'Consulta',
        operatory: appointment.operatory
          ? {
              id: appointment.operatory.id,
              name: appointment.operatory.name,
              clinic: appointment.operatory.clinic
                ? {
                    name: appointment.operatory.clinic.name,
                    address: JSON.stringify(appointment.operatory.clinic.address),
                  }
                : undefined,
            }
          : undefined,
        dentist: {
          id: dentist!.id,
          name: dentist!.name || 'Doctor',
        },
      },
      procedures: invoice?.items.map((item) => ({
        id: item.id,
        name: item.description,
        cost: item.unitPrice,
      })) || [],
      prescriptions: [],
      clinicalNotes,
      financial,
      media: documents.map((doc) => ({
        id: doc.id,
        type: doc.type,
        title: doc.title,
        url: `/api/documents/${doc.id}/download`,
      })),
      relatedRecords: {
        treatmentPlanId: treatmentPlan?.id,
        treatmentPlanTitle: treatmentPlan?.title,
        odontogramId: odontogram?.id,
        invoiceId: invoice?.id,
        invoiceNumber: invoice?.invoiceNumber,
      },
    };
  }
}
