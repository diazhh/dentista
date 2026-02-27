import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, FileText, DollarSign, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { reportsAPI } from '../services/api';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardData {
  revenue: { currentMonth: number; lastMonth: number; growth: string };
  appointments: { today: number; thisMonth: number };
  patients: { active: number };
  invoices: { pendingCount: number; pendingAmount: number };
}

interface TodayAppointment {
  id: string;
  appointmentDate: string;
  duration: number;
  status: string;
  procedureType: string;
  clinicalNoteComplete?: boolean;
  patient?: { id: string; firstName: string; lastName: string; phone: string };
}

const PROCEDURE_LABELS: Record<string, string> = {
  CHECKUP: 'Revisión', CLEANING: 'Limpieza', FILLING: 'Empaste',
  ROOT_CANAL: 'Endodoncia', EXTRACTION: 'Extracción', CROWN: 'Corona',
  ORTHODONTICS: 'Ortodoncia', EMERGENCY: 'Emergencia', CONSULTATION: 'Consulta',
  FOLLOW_UP: 'Seguimiento', IMPLANT: 'Implante', WHITENING: 'Blanqueamiento',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programada', CONFIRMED: 'Confirmada', IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completada', CANCELLED: 'Cancelada', NO_SHOW: 'No Asistió',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, todayRes] = await Promise.all([
        reportsAPI.getDashboard(),
        api.get('/appointments/today'),
      ]);
      setDashboardData(dashRes);
      setTodayAppointments(todayRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = dashboardData;
  const growth = stats ? parseFloat(stats.revenue.growth) : 0;

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Bienvenido, {user?.name}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Resumen de actividad de tu clínica</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link to="/calendar" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
              <div className="ml-4 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Citas Hoy</dt>
                  <dd className="text-xl sm:text-2xl font-semibold text-gray-900">{stats?.appointments.today || 0}</dd>
                  <dd className="text-xs text-gray-400">{stats?.appointments.thisMonth || 0} este mes</dd>
                </dl>
              </div>
            </div>
          </Link>

          <Link to="/patients" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
              <div className="ml-4 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Pacientes Activos</dt>
                  <dd className="text-xl sm:text-2xl font-semibold text-gray-900">{stats?.patients.active || 0}</dd>
                </dl>
              </div>
            </div>
          </Link>

          <Link to="/invoices" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
              </div>
              <div className="ml-4 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Facturas Pendientes</dt>
                  <dd className="text-xl sm:text-2xl font-semibold text-gray-900">{stats?.invoices.pendingCount || 0}</dd>
                  <dd className="text-xs text-gray-400">RD$ {(stats?.invoices.pendingAmount || 0).toFixed(0)}</dd>
                </dl>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
              </div>
              <div className="ml-4 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Ingresos del Mes</dt>
                  <dd className="text-xl sm:text-2xl font-semibold text-gray-900">
                    RD$ {(stats?.revenue.currentMonth || 0).toFixed(0)}
                  </dd>
                  <dd className={`text-xs flex items-center gap-1 ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(growth).toFixed(1)}% vs mes anterior
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link to="/appointments/new" className="bg-blue-600 text-white rounded-lg shadow p-4 sm:p-6 hover:bg-blue-700 transition-colors">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
            <h3 className="text-base sm:text-lg font-semibold">Nueva Cita</h3>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">Agendar una nueva cita</p>
          </Link>
          <Link to="/patients/new" className="bg-green-600 text-white rounded-lg shadow p-4 sm:p-6 hover:bg-green-700 transition-colors">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
            <h3 className="text-base sm:text-lg font-semibold">Nuevo Paciente</h3>
            <p className="text-green-100 text-xs sm:text-sm mt-1">Registrar un nuevo paciente</p>
          </Link>
          <Link to="/invoices/new" className="bg-purple-600 text-white rounded-lg shadow p-4 sm:p-6 hover:bg-purple-700 transition-colors sm:col-span-2 lg:col-span-1">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
            <h3 className="text-base sm:text-lg font-semibold">Nueva Factura</h3>
            <p className="text-purple-100 text-xs sm:text-sm mt-1">Crear una nueva factura</p>
          </Link>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Citas de Hoy</h2>
            <Link to="/calendar" className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium">
              Ver Calendario
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {todayAppointments.length === 0 ? (
              <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-gray-500">
                <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm sm:text-base">No hay citas programadas para hoy</p>
              </div>
            ) : (
              todayAppointments.map((apt) => {
                const endTime = addMinutes(new Date(apt.appointmentDate), apt.duration);
                return (
                  <Link
                    key={apt.id}
                    to={`/appointments/${apt.id}`}
                    className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div className="flex items-center min-w-0">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Sin paciente'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {format(new Date(apt.appointmentDate), 'p', { locale: es })} - {format(endTime, 'p', { locale: es })} | {PROCEDURE_LABELS[apt.procedureType] || apt.procedureType}
                        </p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      apt.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                      apt.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                      apt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {STATUS_LABELS[apt.status] || apt.status}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
