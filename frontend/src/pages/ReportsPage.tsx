import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../services/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  Calendar,
  Users,
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [activeTab, setActiveTab] = useState<'financial' | 'appointments' | 'patients' | 'treatments'>('financial');

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['reports-dashboard'],
    queryFn: reportsAPI.getDashboard,
  });

  const { data: financialData, isLoading: isFinancialLoading } = useQuery({
    queryKey: ['reports-financial', dateRange],
    queryFn: () => reportsAPI.getFinancial(dateRange),
    enabled: activeTab === 'financial',
  });

  const { data: appointmentsData, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ['reports-appointments', dateRange],
    queryFn: () => reportsAPI.getAppointments(dateRange),
    enabled: activeTab === 'appointments',
  });

  const { data: patientsData, isLoading: isPatientsLoading } = useQuery({
    queryKey: ['reports-patients', dateRange],
    queryFn: () => reportsAPI.getPatients(dateRange),
    enabled: activeTab === 'patients',
  });

  const { data: treatmentsData, isLoading: isTreatmentsLoading } = useQuery({
    queryKey: ['reports-treatments', dateRange],
    queryFn: () => reportsAPI.getTreatmentPlans(dateRange),
    enabled: activeTab === 'treatments',
  });

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      let blob;
      let filename;

      switch (activeTab) {
        case 'financial':
          blob = format === 'excel'
            ? await reportsAPI.exportFinancialExcel(dateRange)
            : await reportsAPI.exportFinancialPdf(dateRange);
          filename = `financial-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
          break;
        case 'appointments':
          blob = format === 'excel'
            ? await reportsAPI.exportAppointmentsExcel(dateRange)
            : await reportsAPI.exportAppointmentsPdf(dateRange);
          filename = `appointments-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
          break;
        case 'patients':
          blob = format === 'excel'
            ? await reportsAPI.exportPatientsExcel(dateRange)
            : await reportsAPI.exportPatientsPdf(dateRange);
          filename = `patients-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
          break;
        default:
          return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Track your clinic's performance</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500">Monthly Revenue</p>
                <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(dashboardData.revenue?.currentMonth || 0)}</p>
                <div className="flex items-center mt-1">
                  {parseFloat(dashboardData.revenue?.growth || 0) >= 0 ? (
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mr-1 flex-shrink-0" />
                  )}
                  <span className={`text-xs sm:text-sm ${parseFloat(dashboardData.revenue?.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboardData.revenue?.growth || 0}%
                  </span>
                  <span className="text-gray-500 text-xs sm:text-sm ml-1 hidden sm:inline">vs last month</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0 ml-2">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Today's Appointments</p>
                <p className="text-lg sm:text-2xl font-bold">{dashboardData.appointments?.today || 0}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {dashboardData.appointments?.thisMonth || 0} this month
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-2">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Active Patients</p>
                <p className="text-lg sm:text-2xl font-bold">{dashboardData.patients?.active || 0}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg flex-shrink-0 ml-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500">Pending Invoices</p>
                <p className="text-lg sm:text-2xl font-bold">{dashboardData.invoices?.pendingCount || 0}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                  {formatCurrency(dashboardData.invoices?.pendingAmount || 0)}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg flex-shrink-0 ml-2">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Range & Export */}
      <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
        <div className="p-3 sm:p-4 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <label className="block text-xs sm:text-sm text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs sm:text-sm text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b overflow-x-auto">
          <nav className="flex -mb-px min-w-max">
            {(['financial', 'appointments', 'patients', 'treatments'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-3 sm:p-6">
          {/* Financial Tab */}
          {activeTab === 'financial' && financialData && (
            <div className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Revenue by Day</h3>
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={financialData.dailyRevenue || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis tickFormatter={(value) => `$${value}`} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Invoices by Status</h3>
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financialData.invoicesByStatus || []}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {(financialData.invoicesByStatus || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Payments by Method</h3>
                <div className="h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialData.paymentsByMethod || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="method" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(value) => `$${value}`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && appointmentsData && (
            <div className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Appointments by Status</h3>
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={appointmentsData.byStatus || []}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {(appointmentsData.byStatus || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Top Procedures</h3>
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={appointmentsData.byProcedure || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="procedure" type="category" width={100} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Daily Appointments</h3>
                <div className="h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={appointmentsData.dailyAppointments || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Total</p>
                  <p className="text-lg sm:text-2xl font-bold">{appointmentsData.summary?.total || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Completion Rate</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{appointmentsData.summary?.completionRate || 0}%</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">No-Show Rate</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600">{appointmentsData.summary?.noShowRate || 0}%</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Avg Duration</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{appointmentsData.summary?.avgDuration || 0} min</p>
                </div>
              </div>
            </div>
          )}

          {/* Patients Tab */}
          {activeTab === 'patients' && patientsData && (
            <div className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Patients by Age Group</h3>
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={patientsData.byAgeGroup || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="group" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Patients by Gender</h3>
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={patientsData.byGender || []}
                          dataKey="count"
                          nameKey="gender"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {(patientsData.byGender || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Total Active</p>
                  <p className="text-lg sm:text-2xl font-bold">{patientsData.summary?.totalActive || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">New This Period</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{patientsData.summary?.newInPeriod || 0}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Portal Enabled</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{patientsData.summary?.portalEnabled || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Portal Adoption</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600">{patientsData.summary?.portalAdoptionRate || 0}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Treatments Tab */}
          {activeTab === 'treatments' && treatmentsData && (
            <div className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Treatment Plans by Status</h3>
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={treatmentsData.byStatus || []}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {(treatmentsData.byStatus || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Value by Status</h3>
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={treatmentsData.byStatus || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(value) => `$${value}`} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="totalValue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Total Plans</p>
                  <p className="text-lg sm:text-2xl font-bold">{treatmentsData.summary?.total || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Acceptance Rate</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{treatmentsData.summary?.acceptanceRate || 0}%</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">In Progress</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{treatmentsData.summary?.inProgress || 0}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Total Value</p>
                  <p className="text-base sm:text-2xl font-bold text-orange-600 truncate">{formatCurrency(treatmentsData.summary?.totalValue || 0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading States */}
          {(isFinancialLoading || isAppointmentsLoading || isPatientsLoading || isTreatmentsLoading) && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
