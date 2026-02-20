import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Building2, Users, Calendar,
  AlertTriangle, UserPlus, Activity, PieChart, BarChart3, Clock,
  ArrowUpRight, ArrowDownRight, RefreshCw,
} from 'lucide-react';
import { adminAPI, reportsAPI } from '../services/api';
import type { SystemMetrics, RevenueMetrics, TenantActivity } from '../types';

interface FinancialReport {
  period: { startDate: string; endDate: string };
  summary: { totalRevenue: number; pendingAmount: number; invoiceCount: number };
  invoicesByStatus: Array<{ status: string; count: number; total: number; amountPaid: number; balance: number }>;
  paymentsByMethod: Array<{ method: string; count: number; total: number }>;
  dailyRevenue: Array<{ date: string; total: number }>;
}

interface AppointmentReport {
  period: { startDate: string; endDate: string };
  summary: {
    total: number; completed: number; cancelled: number; noShows: number;
    noShowRate: string; completionRate: string; avgDuration: number;
  };
  byStatus: Array<{ status: string; count: number; percentage: string }>;
  byProcedure: Array<{ procedure: string; count: number }>;
}

interface PatientReport {
  period: { startDate: string; endDate: string };
  summary: { totalActive: number; newInPeriod: number; portalEnabled: number; portalAdoptionRate: string };
  byGender: Array<{ gender: string; count: number; percentage: string }>;
  byAgeGroup: Array<{ group: string; count: number; percentage: string }>;
}

interface TreatmentReport {
  period: { startDate: string; endDate: string };
  summary: {
    total: number; proposed: number; accepted: number; inProgress: number;
    completed: number; acceptanceRate: string; totalValue: number;
  };
  byStatus: Array<{ status: string; count: number; totalValue: number; percentage: string }>;
}

type TabKey = 'overview' | 'financial' | 'operational' | 'patients';

function fmt(n: number | undefined | null): string {
  return (n ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtCurrency(n: number | undefined | null): string {
  return '$' + fmt(n);
}

function GrowthBadge({ value }: { value: string | number }) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return <span className="text-xs text-gray-500">—</span>;
  const positive = num > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
      {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(num).toFixed(1)}%
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: React.ReactNode; color: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-3">
        <div className={`${color} p-2.5 rounded-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {sub && <div className="mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = 'bg-blue-600' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function SuperAdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const [system, setSystem] = useState<SystemMetrics | null>(null);
  const [revenue, setRevenue] = useState<RevenueMetrics | null>(null);
  const [activity, setActivity] = useState<TenantActivity[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [financial, setFinancial] = useState<FinancialReport | null>(null);
  const [appointments, setAppointments] = useState<AppointmentReport | null>(null);
  const [patients, setPatients] = useState<PatientReport | null>(null);
  const [treatments, setTreatments] = useState<TreatmentReport | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0];

      const [sys, rev, act, dash, fin, appts, pats, treats] = await Promise.allSettled([
        adminAPI.getSystemMetrics(),
        adminAPI.getRevenueMetrics(),
        adminAPI.getTenantActivity(30),
        reportsAPI.getDashboard(),
        reportsAPI.getFinancial({ startDate, endDate }),
        reportsAPI.getAppointments({ startDate, endDate }),
        reportsAPI.getPatients({ startDate, endDate }),
        reportsAPI.getTreatmentPlans({ startDate, endDate }),
      ]);

      if (sys.status === 'fulfilled') setSystem(sys.value);
      if (rev.status === 'fulfilled') setRevenue(rev.value);
      if (act.status === 'fulfilled') setActivity(act.value);
      if (dash.status === 'fulfilled') setDashboard(dash.value);
      if (fin.status === 'fulfilled') setFinancial(fin.value);
      if (appts.status === 'fulfilled') setAppointments(appts.value);
      if (pats.status === 'fulfilled') setPatients(pats.value);
      if (treats.status === 'fulfilled') setTreatments(treats.value);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Vista General', icon: Activity },
    { key: 'financial', label: 'Financiero', icon: DollarSign },
    { key: 'operational', label: 'Operacional', icon: Calendar },
    { key: 'patients', label: 'Pacientes', icon: Users },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Analytics Avanzado
          </h1>
          <p className="text-sm text-gray-500 mt-1">KPIs financieros, operacionales y de rendimiento</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 text-gray-700"
        >
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              system={system} revenue={revenue} activity={activity}
              dashboard={dashboard} appointments={appointments} patients={patients}
            />
          )}
          {activeTab === 'financial' && (
            <FinancialTab revenue={revenue} financial={financial} dashboard={dashboard} treatments={treatments} />
          )}
          {activeTab === 'operational' && (
            <OperationalTab system={system} appointments={appointments} activity={activity} />
          )}
          {activeTab === 'patients' && (
            <PatientsTab patients={patients} system={system} />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ system, revenue, activity, dashboard, appointments, patients }: {
  system: SystemMetrics | null; revenue: RevenueMetrics | null; activity: TenantActivity[];
  dashboard: any; appointments: AppointmentReport | null; patients: PatientReport | null;
}) {
  return (
    <div className="space-y-6">
      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign} label="MRR" value={fmtCurrency(revenue?.mrr)} color="bg-green-600"
          sub={<span className="text-xs text-gray-500">ARR: {fmtCurrency(revenue?.arr)}</span>}
        />
        <StatCard
          icon={Building2} label="Tenants Activos" value={fmt(system?.activeTenants)} color="bg-indigo-600"
          sub={<span className="text-xs text-gray-500">Total: {fmt(system?.totalTenants)}</span>}
        />
        <StatCard
          icon={Users} label="Usuarios Totales" value={fmt(system?.totalUsers)} color="bg-blue-600"
          sub={<span className="text-xs text-gray-500">En plataforma</span>}
        />
        <StatCard
          icon={UserPlus} label="Nuevos Tenants" value={fmt(revenue?.newTenantsThisMonth)} color="bg-purple-600"
          sub={<span className="text-xs text-gray-500">Este mes</span>}
        />
      </div>

      {/* Financial + Operational row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard
          icon={Calendar} label="Citas Este Mes" value={fmt(system?.appointmentsThisMonth)} color="bg-cyan-600"
          sub={appointments ? (
            <span className="text-xs text-gray-500">
              No-shows: {appointments.summary.noShows} ({appointments.summary.noShowRate})
            </span>
          ) : undefined}
        />
        <StatCard
          icon={TrendingUp} label="Revenue Mes" value={fmtCurrency(dashboard?.revenue?.currentMonth)} color="bg-emerald-600"
          sub={dashboard?.revenue?.growth ? <GrowthBadge value={dashboard.revenue.growth} /> : undefined}
        />
      </div>

      {/* Revenue by Tier */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue por Plan de Suscripcion</h3>
        <div className="space-y-3">
          {revenue?.revenueByTier?.map(tier => {
            const maxRevenue = Math.max(...(revenue.revenueByTier?.map(t => t.revenue) || [1]));
            return (
              <div key={tier.tier} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{tier.tier}</span>
                  <span className="text-gray-600">{fmtCurrency(tier.revenue)}/mes — {tier.count} tenants</span>
                </div>
                <ProgressBar value={tier.revenue} max={maxRevenue} color="bg-indigo-600" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribution cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-500" /> Distribucion por Plan
          </h3>
          <div className="space-y-2">
            {system?.tenantsByTier?.map(item => (
              <div key={item.subscriptionTier} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{item.subscriptionTier}</span>
                <span className="font-semibold text-gray-900">{item._count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" /> Estado de Suscripciones
          </h3>
          <div className="space-y-2">
            {system?.tenantsByStatus?.map(item => (
              <div key={item.subscriptionStatus} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{item.subscriptionStatus}</span>
                <span className={`font-semibold ${item.subscriptionStatus === 'ACTIVE' ? 'text-green-600' : 'text-gray-900'}`}>
                  {item._count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Active Tenants */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Tenants Activos (30 dias)</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Sin datos de actividad</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500 text-left">
                    <th className="pb-2 font-medium">Tenant</th>
                    <th className="pb-2 font-medium">Plan</th>
                    <th className="pb-2 font-medium text-right">Citas</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map(t => (
                    <tr key={t.tenantId} className="border-b last:border-0">
                      <td className="py-2 font-medium text-gray-900">{t.tenantName || t.tenantId}</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 text-xs rounded bg-indigo-100 text-indigo-700">{t.subscriptionTier}</span>
                      </td>
                      <td className="py-2 text-right font-semibold">{t.appointmentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-2">
              {activity.map(t => (
                <div key={t.tenantId} className="border rounded-lg p-3 bg-white flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.tenantName || t.tenantId}</p>
                    <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">{t.subscriptionTier}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{t.appointmentCount}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FinancialTab({ revenue, financial, dashboard, treatments }: {
  revenue: RevenueMetrics | null; financial: FinancialReport | null; dashboard: any; treatments: TreatmentReport | null;
}) {
  const totalRevenue = financial?.summary?.totalRevenue ?? 0;
  const pendingAR = financial?.summary?.pendingAmount ?? 0;
  const collected = totalRevenue - pendingAR;

  return (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign} label="Revenue Total (Mes)" value={fmtCurrency(totalRevenue)} color="bg-green-600"
          sub={dashboard?.revenue?.growth ? <GrowthBadge value={dashboard.revenue.growth} /> : undefined}
        />
        <StatCard
          icon={TrendingUp} label="Cobrado" value={fmtCurrency(collected)} color="bg-emerald-600"
          sub={<span className="text-xs text-gray-500">{totalRevenue > 0 ? ((collected / totalRevenue) * 100).toFixed(0) : 0}% del total</span>}
        />
        <StatCard
          icon={AlertTriangle} label="Cuentas por Cobrar" value={fmtCurrency(pendingAR)} color="bg-orange-500"
          sub={<span className="text-xs text-gray-500">{financial?.summary?.invoiceCount ?? 0} facturas</span>}
        />
        <StatCard
          icon={DollarSign} label="MRR Plataforma" value={fmtCurrency(revenue?.mrr)} color="bg-indigo-600"
          sub={<span className="text-xs text-gray-500">ARR: {fmtCurrency(revenue?.arr)}</span>}
        />
      </div>

      {/* Invoices by Status */}
      {financial?.invoicesByStatus && financial.invoicesByStatus.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Facturas por Estado</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500 text-left">
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium text-right">Cantidad</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2 font-medium text-right">Pagado</th>
                  <th className="pb-2 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {financial.invoicesByStatus.map(row => (
                  <tr key={row.status} className="border-b last:border-0">
                    <td className="py-2">
                      <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                        row.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        row.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                        row.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 text-right">{row.count}</td>
                    <td className="py-2 text-right">{fmtCurrency(row.total)}</td>
                    <td className="py-2 text-right text-green-600">{fmtCurrency(row.amountPaid)}</td>
                    <td className="py-2 text-right text-orange-600">{fmtCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments by Method */}
      {financial?.paymentsByMethod && financial.paymentsByMethod.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Metodos de Pago</h3>
          <div className="space-y-3">
            {financial.paymentsByMethod.map(pm => {
              const maxTotal = Math.max(...financial.paymentsByMethod.map(p => p.total));
              return (
                <div key={pm.method} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{pm.method}</span>
                    <span className="text-gray-600">{fmtCurrency(pm.total)} ({pm.count} pagos)</span>
                  </div>
                  <ProgressBar value={pm.total} max={maxTotal} color="bg-green-600" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Revenue Trend */}
      {financial?.dailyRevenue && financial.dailyRevenue.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Tendencia Diaria de Revenue</h3>
          <div className="flex items-end gap-1 h-32">
            {financial.dailyRevenue.map((day, i) => {
              const maxVal = Math.max(...financial.dailyRevenue.map(d => d.total));
              const height = maxVal > 0 ? (day.total / maxVal) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div className="absolute -top-6 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    {new Date(day.date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}: {fmtCurrency(day.total)}
                  </div>
                  <div
                    className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors cursor-pointer"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>{financial.dailyRevenue[0]?.date ? new Date(financial.dailyRevenue[0].date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' }) : ''}</span>
            <span>{financial.dailyRevenue[financial.dailyRevenue.length - 1]?.date ? new Date(financial.dailyRevenue[financial.dailyRevenue.length - 1].date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' }) : ''}</span>
          </div>
        </div>
      )}

      {/* Treatment Plans summary */}
      {treatments && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Planes de Tratamiento</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{treatments.summary.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{treatments.summary.acceptanceRate}</p>
              <p className="text-xs text-gray-500">Tasa Aceptacion</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{treatments.summary.inProgress}</p>
              <p className="text-xs text-gray-500">En Progreso</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{fmtCurrency(treatments.summary.totalValue)}</p>
              <p className="text-xs text-gray-500">Valor Total</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OperationalTab({ system, appointments, activity }: {
  system: SystemMetrics | null; appointments: AppointmentReport | null; activity: TenantActivity[];
}) {
  return (
    <div className="space-y-6">
      {/* Operational KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar} label="Citas Este Mes" value={fmt(appointments?.summary?.total)} color="bg-blue-600"
          sub={<span className="text-xs text-gray-500">Completadas: {fmt(appointments?.summary?.completed)}</span>}
        />
        <StatCard
          icon={AlertTriangle} label="No-Shows" value={fmt(appointments?.summary?.noShows)} color="bg-red-500"
          sub={<span className="text-xs text-red-500 font-medium">Tasa: {appointments?.summary?.noShowRate ?? '0%'}</span>}
        />
        <StatCard
          icon={TrendingUp} label="Tasa Completacion" value={appointments?.summary?.completionRate ?? '0%'} color="bg-green-600"
        />
        <StatCard
          icon={Clock} label="Duracion Promedio" value={`${appointments?.summary?.avgDuration ?? 0} min`} color="bg-cyan-600"
        />
      </div>

      {/* Appointments by Status */}
      {appointments?.byStatus && appointments.byStatus.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Citas por Estado</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {appointments.byStatus.map(s => {
              const colors: Record<string, string> = {
                COMPLETED: 'text-green-600',
                SCHEDULED: 'text-blue-600',
                CANCELLED: 'text-red-600',
                NO_SHOW: 'text-orange-600',
              };
              return (
                <div key={s.status} className="bg-white rounded-lg p-3 text-center">
                  <p className={`text-2xl font-bold ${colors[s.status] ?? 'text-gray-900'}`}>{s.count}</p>
                  <p className="text-xs text-gray-500">{s.status}</p>
                  <p className="text-xs text-gray-400">{s.percentage}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Procedures */}
      {appointments?.byProcedure && appointments.byProcedure.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Procedimientos Mas Frecuentes</h3>
          <div className="space-y-3">
            {appointments.byProcedure.slice(0, 10).map(proc => {
              const maxCount = Math.max(...appointments.byProcedure.map(p => p.count));
              return (
                <div key={proc.procedure} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{proc.procedure || 'Sin especificar'}</span>
                    <span className="font-medium text-gray-900">{proc.count}</span>
                  </div>
                  <ProgressBar value={proc.count} max={maxCount} color="bg-cyan-600" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Platform activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Citas Totales Plataforma</h3>
          <p className="text-3xl font-bold text-gray-900">{fmt(system?.totalAppointments)}</p>
          <p className="text-xs text-gray-500 mt-1">Este mes: {fmt(system?.appointmentsThisMonth)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Tenants Mas Activos</h3>
          {activity.slice(0, 5).map((t, i) => (
            <div key={t.tenantId} className="flex justify-between items-center py-1 text-sm">
              <span className="text-gray-600">
                <span className="text-gray-400 mr-2">#{i + 1}</span>
                {t.tenantName || t.tenantId}
              </span>
              <span className="font-medium text-gray-900">{t.appointmentCount} citas</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PatientsTab({ patients, system }: { patients: PatientReport | null; system: SystemMetrics | null }) {
  return (
    <div className="space-y-6">
      {/* Patient KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users} label="Pacientes Activos" value={fmt(patients?.summary?.totalActive)} color="bg-blue-600"
        />
        <StatCard
          icon={UserPlus} label="Nuevos (Mes)" value={fmt(patients?.summary?.newInPeriod)} color="bg-green-600"
        />
        <StatCard
          icon={Activity} label="Portal Habilitado" value={fmt(patients?.summary?.portalEnabled)} color="bg-purple-600"
          sub={<span className="text-xs text-gray-500">Adopcion: {patients?.summary?.portalAdoptionRate ?? '0%'}</span>}
        />
        <StatCard
          icon={Building2} label="Total Usuarios" value={fmt(system?.totalUsers)} color="bg-indigo-600"
        />
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gender Distribution */}
        {patients?.byGender && patients.byGender.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Distribucion por Genero</h3>
            <div className="space-y-3">
              {patients.byGender.map(g => {
                const maxCount = Math.max(...patients.byGender.map(x => x.count));
                const colors: Record<string, string> = {
                  MALE: 'bg-blue-500', FEMALE: 'bg-pink-500', OTHER: 'bg-purple-500',
                };
                return (
                  <div key={g.gender} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {g.gender === 'MALE' ? 'Masculino' : g.gender === 'FEMALE' ? 'Femenino' : 'Otro'}
                      </span>
                      <span className="text-gray-600">{g.count} ({g.percentage})</span>
                    </div>
                    <ProgressBar value={g.count} max={maxCount} color={colors[g.gender] ?? 'bg-gray-500'} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Age Distribution */}
        {patients?.byAgeGroup && patients.byAgeGroup.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Distribucion por Edad</h3>
            <div className="space-y-3">
              {patients.byAgeGroup.map(ag => {
                const maxCount = Math.max(...patients.byAgeGroup.map(x => x.count));
                return (
                  <div key={ag.group} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{ag.group} anos</span>
                      <span className="text-gray-600">{ag.count} ({ag.percentage})</span>
                    </div>
                    <ProgressBar value={ag.count} max={maxCount} color="bg-indigo-500" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Portal Adoption */}
      {patients && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Adopcion del Portal de Pacientes</h3>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <ProgressBar
                value={patients.summary.portalEnabled}
                max={patients.summary.totalActive || 1}
                color="bg-purple-600"
              />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">{patients.summary.portalAdoptionRate}</p>
              <p className="text-xs text-gray-500">{patients.summary.portalEnabled} de {patients.summary.totalActive}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
