import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import {
  BarChart3, DollarSign, Users, Calendar, TrendingUp, FileSpreadsheet, FileText,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 0 }).format(amount);
}

type Tab = 'dashboard' | 'financial' | 'appointments' | 'patients';

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [financial, setFinancial] = useState<any>(null);
  const [appointments, setAppointments] = useState<any>(null);
  const [patients, setPatients] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = dateRange.startDate ? dateRange : undefined;
      switch (tab) {
        case 'dashboard':
          setDashboard(await reportsAPI.getDashboard());
          break;
        case 'financial':
          setFinancial(await reportsAPI.getFinancial(params));
          break;
        case 'appointments':
          setAppointments(await reportsAPI.getAppointments(params));
          break;
        case 'patients':
          setPatients(await reportsAPI.getPatients(params));
          break;
      }
    } catch (e) {
      console.error('Error loading reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      let blob: Blob | undefined;
      const params = dateRange.startDate ? dateRange : undefined;
      switch (tab) {
        case 'financial':
          blob = type === 'excel' ? await reportsAPI.exportFinancialExcel(params) : await reportsAPI.exportFinancialPdf(params);
          break;
        case 'appointments':
          blob = type === 'excel' ? await reportsAPI.exportAppointmentsExcel(params) : await reportsAPI.exportAppointmentsPdf(params);
          break;
        case 'patients':
          blob = type === 'excel' ? await reportsAPI.exportPatientsExcel(params) : await reportsAPI.exportPatientsPdf(params);
          break;
        default:
          return;
      }
      if (!blob) return;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${tab}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Resumen' },
    { key: 'financial', label: 'Financiero' },
    { key: 'appointments', label: 'Citas' },
    { key: 'patients', label: 'Pacientes' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Reportes y Analíticas</h1>
          </div>
          {tab !== 'dashboard' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={dateRange.startDate} onChange={e => setDateRange(p => ({ ...p, startDate: e.target.value }))} className="px-3 py-1.5 border rounded-md text-sm" />
              <span className="text-gray-400">-</span>
              <input type="date" value={dateRange.endDate} onChange={e => setDateRange(p => ({ ...p, endDate: e.target.value }))} className="px-3 py-1.5 border rounded-md text-sm" />
              <button onClick={loadData} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Filtrar</button>
              <button onClick={() => handleExport('excel')} className="px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 flex items-center gap-1"><FileSpreadsheet className="w-4 h-4" />Excel</button>
              <button onClick={() => handleExport('pdf')} className="px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 flex items-center gap-1"><FileText className="w-4 h-4" />PDF</button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <nav className="flex border-b overflow-x-auto">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.label}</button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : (
          <>
            {tab === 'dashboard' && dashboard && <DashboardView data={dashboard} />}
            {tab === 'financial' && financial && <FinancialView data={financial} />}
            {tab === 'appointments' && appointments && <AppointmentsView data={appointments} />}
            {tab === 'patients' && patients && <PatientsView data={patients} />}
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function DashboardView({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard icon={DollarSign} label="Ingresos del Mes" value={formatCurrency(data.revenue || 0)} color="bg-green-500" />
      <MetricCard icon={Calendar} label="Citas del Mes" value={data.appointments || 0} color="bg-blue-500" />
      <MetricCard icon={Users} label="Pacientes Activos" value={data.activePatients || 0} color="bg-purple-500" />
      <MetricCard icon={TrendingUp} label="Facturas Pendientes" value={data.pendingInvoices || 0} color="bg-yellow-500" />
    </div>
  );
}

function FinancialView({ data }: { data: any }) {
  const invoicesByStatus = data.invoicesByStatus ? Object.entries(data.invoicesByStatus).map(([name, value]) => ({ name: name.replace('_', ' '), value })) : [];
  const dailyRevenue = data.dailyRevenue || [];
  const paymentMethods = data.paymentMethods ? Object.entries(data.paymentMethods).map(([name, value]) => ({ name: name.replace('_', ' '), value })) : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={DollarSign} label="Ingresos Totales" value={formatCurrency(data.totalRevenue || 0)} color="bg-green-500" />
        <MetricCard icon={TrendingUp} label="Total Facturas" value={data.totalInvoices || 0} color="bg-blue-500" />
        <MetricCard icon={DollarSign} label="Pendiente por Cobrar" value={formatCurrency(data.totalPending || 0)} color="bg-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold mb-4">Ingresos Diarios</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold mb-4">Facturas por Estado</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={invoicesByStatus} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {invoicesByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {paymentMethods.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold mb-4">Métodos de Pago</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={paymentMethods} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function AppointmentsView({ data }: { data: any }) {
  const statusData = data.byStatus ? Object.entries(data.byStatus).map(([name, value]) => ({ name, value })) : [];
  const procedureData = data.byProcedure ? Object.entries(data.byProcedure).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard icon={Calendar} label="Total Citas" value={data.total || 0} color="bg-blue-500" />
        <MetricCard icon={Calendar} label="Completadas" value={data.completed || 0} color="bg-green-500" />
        <MetricCard icon={Calendar} label="No Asistieron" value={data.noShow || 0} color="bg-red-500" />
        <MetricCard icon={TrendingUp} label="Tasa Completación" value={`${data.completionRate || 0}%`} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold mb-4">Citas por Estado</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold mb-4">Por Procedimiento</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={procedureData.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function PatientsView({ data }: { data: any }) {
  const genderData = data.byGender ? Object.entries(data.byGender).map(([name, value]) => ({ name: name === 'MALE' ? 'Masculino' : name === 'FEMALE' ? 'Femenino' : 'Otro', value })) : [];
  const ageGroups = data.byAgeGroup ? Object.entries(data.byAgeGroup).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={Users} label="Total Pacientes" value={data.total || 0} color="bg-blue-500" />
        <MetricCard icon={Users} label="Nuevos este Mes" value={data.newThisMonth || 0} color="bg-green-500" />
        <MetricCard icon={TrendingUp} label="Adopción Portal" value={`${data.portalAdoption || 0}%`} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold mb-4">Distribución por Género</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold mb-4">Distribución por Edad</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageGroups}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
