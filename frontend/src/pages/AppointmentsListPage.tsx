import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, Filter, Plus, Eye } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Appointment {
  id: string;
  patientId: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  notes?: string;
  patient?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

export default function AppointmentsListPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      searchTerm === '' ||
      apt.patient?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient?.phone.includes(searchTerm);

    const matchesStatus = filters.status === 'all' || apt.status === filters.status;
    const matchesType = filters.type === 'all' || apt.type === filters.type;

    let matchesDate = true;
    if (filters.dateFrom) {
      matchesDate = matchesDate && new Date(apt.startTime) >= new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      matchesDate = matchesDate && new Date(apt.startTime) <= new Date(filters.dateTo);
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-amber-100 text-amber-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-red-200 text-red-900',
    };

    const labels: Record<string, string> = {
      SCHEDULED: 'Programada',
      CONFIRMED: 'Confirmada',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
      NO_SHOW: 'No Asistió',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CHECKUP: 'Revisión',
      CLEANING: 'Limpieza',
      FILLING: 'Empaste',
      ROOT_CANAL: 'Endodoncia',
      EXTRACTION: 'Extracción',
      ORTHODONTICS: 'Ortodoncia',
      EMERGENCY: 'Emergencia',
      CONSULTATION: 'Consulta',
      FOLLOW_UP: 'Seguimiento',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Citas</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/calendar')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Ver Calendario
            </button>
            <button
              onClick={() => navigate('/appointments/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nueva Cita
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono del paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="SCHEDULED">Programada</option>
                    <option value="CONFIRMED">Confirmada</option>
                    <option value="IN_PROGRESS">En Progreso</option>
                    <option value="COMPLETED">Completada</option>
                    <option value="CANCELLED">Cancelada</option>
                    <option value="NO_SHOW">No Asistió</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="CHECKUP">Revisión</option>
                    <option value="CLEANING">Limpieza</option>
                    <option value="FILLING">Empaste</option>
                    <option value="ROOT_CANAL">Endodoncia</option>
                    <option value="EXTRACTION">Extracción</option>
                    <option value="ORTHODONTICS">Ortodoncia</option>
                    <option value="EMERGENCY">Emergencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron citas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.patient
                            ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                            : 'Sin paciente'}
                        </div>
                        {appointment.patient && (
                          <div className="text-sm text-gray-500">{appointment.patient.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(appointment.startTime), 'PPP', { locale: es })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(appointment.startTime), 'p', { locale: es })} -{' '}
                          {format(new Date(appointment.endTime), 'p', { locale: es })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getTypeLabel(appointment.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(appointment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => navigate(`/appointments/${appointment.id}`)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredAppointments.length} de {appointments.length} citas
        </div>
      </div>
    </div>
  );
}
