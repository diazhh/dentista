import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface ReportFilters extends DateRange {
  tenantId: string;
  dentistId?: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get financial summary report
   */
  async getFinancialSummary(filters: ReportFilters) {
    const { tenantId, startDate, endDate, dentistId } = filters;

    const whereClause: any = {
      tenantId,
      issueDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (dentistId) {
      whereClause.dentistId = dentistId;
    }

    // Get invoice totals by status
    const invoicesByStatus = await this.prisma.invoice.groupBy({
      by: ['status'],
      where: whereClause,
      _sum: { total: true, amountPaid: true, balance: true },
      _count: true,
    });

    // Get total revenue (paid invoices)
    const totalRevenue = await this.prisma.invoice.aggregate({
      where: {
        ...whereClause,
        status: 'PAID',
      },
      _sum: { total: true },
    });

    // Get pending amount
    const pendingAmount = await this.prisma.invoice.aggregate({
      where: {
        ...whereClause,
        status: { in: ['SENT', 'OVERDUE'] },
      },
      _sum: { balance: true },
    });

    // Get payments by method
    const paymentsByMethod = await this.prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: {
        tenantId,
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
      _count: true,
    });

    // Daily revenue for the period
    const dailyRevenue = await this.prisma.$queryRaw<
      { date: Date; total: number }[]
    >`
      SELECT
        DATE(payment_date) as date,
        SUM(amount)::numeric as total
      FROM payments
      WHERE tenant_id = ${tenantId}
        AND payment_date >= ${startDate}
        AND payment_date <= ${endDate}
        AND status = 'COMPLETED'
      GROUP BY DATE(payment_date)
      ORDER BY date
    `;

    return {
      period: { startDate, endDate },
      summary: {
        totalRevenue: totalRevenue._sum.total || 0,
        pendingAmount: pendingAmount._sum.balance || 0,
        invoiceCount: invoicesByStatus.reduce((sum, s) => sum + s._count, 0),
      },
      invoicesByStatus: invoicesByStatus.map((s) => ({
        status: s.status,
        count: s._count,
        total: s._sum.total || 0,
        amountPaid: s._sum.amountPaid || 0,
        balance: s._sum.balance || 0,
      })),
      paymentsByMethod: paymentsByMethod.map((p) => ({
        method: p.paymentMethod,
        count: p._count,
        total: p._sum.amount || 0,
      })),
      dailyRevenue,
    };
  }

  /**
   * Get appointment statistics report
   */
  async getAppointmentStats(filters: ReportFilters) {
    const { tenantId, startDate, endDate, dentistId } = filters;

    const whereClause: any = {
      tenantId,
      appointmentDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (dentistId) {
      whereClause.dentistId = dentistId;
    }

    // Appointments by status
    const byStatus = await this.prisma.appointment.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    });

    // Appointments by procedure type
    const byProcedure = await this.prisma.appointment.groupBy({
      by: ['procedureType'],
      where: whereClause,
      _count: true,
      orderBy: { _count: { procedureType: 'desc' } },
      take: 10,
    });

    // Daily appointment count
    const dailyAppointments = await this.prisma.$queryRaw<
      { date: Date; count: number }[]
    >`
      SELECT
        DATE(appointment_date) as date,
        COUNT(*)::int as count
      FROM appointments
      WHERE tenant_id = ${tenantId}
        AND appointment_date >= ${startDate}
        AND appointment_date <= ${endDate}
      GROUP BY DATE(appointment_date)
      ORDER BY date
    `;

    // No-show rate
    const totalAppointments = byStatus.reduce((sum, s) => sum + s._count, 0);
    const noShows = byStatus.find((s) => s.status === 'NO_SHOW')?._count || 0;
    const completed = byStatus.find((s) => s.status === 'COMPLETED')?._count || 0;
    const cancelled = byStatus.find((s) => s.status === 'CANCELLED')?._count || 0;

    // Average appointment duration
    const avgDuration = await this.prisma.appointment.aggregate({
      where: {
        ...whereClause,
        status: 'COMPLETED',
      },
      _avg: { duration: true },
    });

    return {
      period: { startDate, endDate },
      summary: {
        total: totalAppointments,
        completed,
        cancelled,
        noShows,
        noShowRate: totalAppointments > 0 ? ((noShows / totalAppointments) * 100).toFixed(1) : 0,
        completionRate:
          totalAppointments > 0 ? ((completed / totalAppointments) * 100).toFixed(1) : 0,
        avgDuration: avgDuration._avg.duration || 0,
      },
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        percentage:
          totalAppointments > 0 ? ((s._count / totalAppointments) * 100).toFixed(1) : 0,
      })),
      byProcedure: byProcedure.map((p) => ({
        procedure: p.procedureType,
        count: p._count,
      })),
      dailyAppointments,
    };
  }

  /**
   * Get patient statistics report
   */
  async getPatientStats(filters: ReportFilters) {
    const { tenantId, startDate, endDate } = filters;

    // New patients in period
    const newPatients = await this.prisma.patientDentistRelation.count({
      where: {
        tenantId,
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Total active patients
    const totalActivePatients = await this.prisma.patientDentistRelation.count({
      where: {
        tenantId,
        isActive: true,
      },
    });

    // Patients by gender
    const patientIds = await this.prisma.patientDentistRelation.findMany({
      where: { tenantId, isActive: true },
      select: { patientId: true },
    });

    const byGender = await this.prisma.patient.groupBy({
      by: ['gender'],
      where: {
        id: { in: patientIds.map((p) => p.patientId) },
      },
      _count: true,
    });

    // Patients by age group
    const patients = await this.prisma.patient.findMany({
      where: {
        id: { in: patientIds.map((p) => p.patientId) },
      },
      select: { dateOfBirth: true },
    });

    const ageGroups = { '0-17': 0, '18-34': 0, '35-54': 0, '55-74': 0, '75+': 0 };
    const today = new Date();

    patients.forEach((p) => {
      const age = Math.floor(
        (today.getTime() - new Date(p.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      );
      if (age < 18) ageGroups['0-17']++;
      else if (age < 35) ageGroups['18-34']++;
      else if (age < 55) ageGroups['35-54']++;
      else if (age < 75) ageGroups['55-74']++;
      else ageGroups['75+']++;
    });

    // Patients with portal access
    const portalEnabled = await this.prisma.patient.count({
      where: {
        id: { in: patientIds.map((p) => p.patientId) },
        portalEnabled: true,
      },
    });

    return {
      period: { startDate, endDate },
      summary: {
        totalActive: totalActivePatients,
        newInPeriod: newPatients,
        portalEnabled,
        portalAdoptionRate:
          totalActivePatients > 0
            ? ((portalEnabled / totalActivePatients) * 100).toFixed(1)
            : 0,
      },
      byGender: byGender.map((g) => ({
        gender: g.gender,
        count: g._count,
        percentage:
          totalActivePatients > 0 ? ((g._count / totalActivePatients) * 100).toFixed(1) : 0,
      })),
      byAgeGroup: Object.entries(ageGroups).map(([group, count]) => ({
        group,
        count,
        percentage: totalActivePatients > 0 ? ((count / totalActivePatients) * 100).toFixed(1) : 0,
      })),
    };
  }

  /**
   * Get treatment plan statistics
   */
  async getTreatmentPlanStats(filters: ReportFilters) {
    const { tenantId, startDate, endDate, dentistId } = filters;

    const whereClause: any = {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (dentistId) {
      whereClause.dentistId = dentistId;
    }

    // Treatment plans by status
    const byStatus = await this.prisma.treatmentPlan.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
      _sum: { totalCost: true },
    });

    // Total value of treatment plans
    const totalValue = await this.prisma.treatmentPlan.aggregate({
      where: whereClause,
      _sum: { totalCost: true },
    });

    // Accepted vs proposed rate
    const proposed = byStatus.find((s) => s.status === 'PROPOSED')?._count || 0;
    const accepted = byStatus.find((s) => s.status === 'ACCEPTED')?._count || 0;
    const inProgress = byStatus.find((s) => s.status === 'IN_PROGRESS')?._count || 0;
    const completed = byStatus.find((s) => s.status === 'COMPLETED')?._count || 0;

    const total = byStatus.reduce((sum, s) => sum + s._count, 0);
    const acceptanceRate = proposed + accepted > 0 ? (accepted / (proposed + accepted)) * 100 : 0;

    return {
      period: { startDate, endDate },
      summary: {
        total,
        proposed,
        accepted,
        inProgress,
        completed,
        acceptanceRate: acceptanceRate.toFixed(1),
        totalValue: totalValue._sum.totalCost || 0,
      },
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        totalValue: s._sum.totalCost || 0,
        percentage: total > 0 ? ((s._count / total) * 100).toFixed(1) : 0,
      })),
    };
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardSummary(tenantId: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // This month's revenue
    const currentMonthRevenue = await this.prisma.payment.aggregate({
      where: {
        tenantId,
        paymentDate: { gte: startOfMonth },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    // Last month's revenue
    const lastMonthRevenue = await this.prisma.payment.aggregate({
      where: {
        tenantId,
        paymentDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    // Today's appointments
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayAppointments = await this.prisma.appointment.count({
      where: {
        tenantId,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
      },
    });

    // This month's appointments
    const monthAppointments = await this.prisma.appointment.count({
      where: {
        tenantId,
        appointmentDate: { gte: startOfMonth },
      },
    });

    // Active patients
    const activePatients = await this.prisma.patientDentistRelation.count({
      where: { tenantId, isActive: true },
    });

    // Pending invoices
    const pendingInvoices = await this.prisma.invoice.aggregate({
      where: {
        tenantId,
        status: { in: ['SENT', 'OVERDUE'] },
      },
      _sum: { balance: true },
      _count: true,
    });

    // Calculate growth
    const currentRevenue = currentMonthRevenue._sum.amount || 0;
    const previousRevenue = lastMonthRevenue._sum.amount || 0;
    const revenueGrowth =
      previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      revenue: {
        currentMonth: currentRevenue,
        lastMonth: previousRevenue,
        growth: revenueGrowth.toFixed(1),
      },
      appointments: {
        today: todayAppointments,
        thisMonth: monthAppointments,
      },
      patients: {
        active: activePatients,
      },
      invoices: {
        pendingCount: pendingInvoices._count,
        pendingAmount: pendingInvoices._sum.balance || 0,
      },
    };
  }
}
