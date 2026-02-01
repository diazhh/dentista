import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, User, FileText, Edit, Trash2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
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
    documentId: string;
  };
}

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAppointment();
    }
  }, [id]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointment(response.data);
    } catch (error) {
      console.error('Error fetching appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!appointment) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/appointments/${id}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchAppointment();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de que desea cancelar esta cita?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/calendar');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Error al cancelar la cita');
    }
  };

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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Cita no encontrada</p>
          <button
            onClick={() => navigate('/calendar')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Volver al calendario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Detalle de Cita</h1>
            </div>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm sm:text-base"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Cancelar Cita</span>
              <span className="xs:hidden">Cancelar</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-xl font-semibold text-gray-900">Información de la Cita</h2>
            {getStatusBadge(appointment.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-500 mb-1">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  Paciente
                </label>
                <p className="text-base sm:text-lg font-medium text-gray-900">
                  {appointment.patient
                    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                    : 'Sin paciente'}
                </p>
                {appointment.patient && (
                  <div className="mt-1 space-y-1">
                    <p className="text-xs sm:text-sm text-gray-600">Cédula: {appointment.patient.documentId}</p>
                    <p className="text-xs sm:text-sm text-gray-600">Teléfono: {appointment.patient.phone}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-500 mb-1">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  Tipo de Cita
                </label>
                <p className="text-base sm:text-lg text-gray-900">{getTypeLabel(appointment.type)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-500 mb-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  Fecha
                </label>
                <p className="text-base sm:text-lg text-gray-900">
                  {format(new Date(appointment.startTime), 'PPPP', { locale: es })}
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-500 mb-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  Hora
                </label>
                <p className="text-base sm:text-lg text-gray-900">
                  {format(new Date(appointment.startTime), 'p', { locale: es })} -{' '}
                  {format(new Date(appointment.endTime), 'p', { locale: es })}
                </p>
              </div>
            </div>
          </div>

          {appointment.notes && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-500 mb-2">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                Notas
              </label>
              <p className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{appointment.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-xl font-semibold text-gray-900 mb-4">Cambiar Estado</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <button
              onClick={() => handleStatusChange('CONFIRMED')}
              disabled={appointment.status === 'CONFIRMED'}
              className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Confirmar
            </button>
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              disabled={appointment.status === 'IN_PROGRESS'}
              className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 border border-amber-600 text-amber-600 rounded-lg hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
            >
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">En Progreso</span>
              <span className="sm:hidden">Progreso</span>
            </button>
            <button
              onClick={() => handleStatusChange('COMPLETED')}
              disabled={appointment.status === 'COMPLETED'}
              className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 border border-gray-600 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Completar
            </button>
            <button
              onClick={() => handleStatusChange('CANCELLED')}
              disabled={appointment.status === 'CANCELLED'}
              className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
            >
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Cancelar
            </button>
            <button
              onClick={() => handleStatusChange('NO_SHOW')}
              disabled={appointment.status === 'NO_SHOW'}
              className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 border border-red-700 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
            >
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              No Asistió
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
