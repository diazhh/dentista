import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useNavigate } from 'react-router-dom';
import { Calendar, Filter, Plus } from 'lucide-react';
import axios from 'axios';

interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  clinicId: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  notes?: string;
  patient?: {
    firstName: string;
    lastName: string;
  };
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
  });

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

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

  const handleDateClick = (arg: any) => {
    navigate(`/appointments/new?date=${arg.dateStr}&time=${arg.date.toISOString()}`);
  };

  const handleEventClick = (info: any) => {
    navigate(`/appointments/${info.event.id}`);
  };

  const handleEventDrop = async (info: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/appointments/${info.event.id}`,
        {
          startTime: info.event.start.toISOString(),
          endTime: info.event.end?.toISOString() || info.event.start.toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      info.revert();
    }
  };

  const events = appointments
    .filter((apt) => {
      if (filters.status !== 'all' && apt.status !== filters.status) return false;
      if (filters.type !== 'all' && apt.type !== filters.type) return false;
      return true;
    })
    .map((apt) => ({
      id: apt.id,
      title: apt.patient
        ? `${apt.patient.firstName} ${apt.patient.lastName}`
        : 'Cita sin paciente',
      start: apt.startTime,
      end: apt.endTime,
      backgroundColor: getStatusColor(apt.status),
      borderColor: getStatusColor(apt.status),
    }));

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      SCHEDULED: '#3b82f6',
      CONFIRMED: '#10b981',
      IN_PROGRESS: '#f59e0b',
      COMPLETED: '#6b7280',
      CANCELLED: '#ef4444',
      NO_SHOW: '#dc2626',
    };
    return colors[status] || '#6b7280';
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Calendario de Citas</h1>
          </div>
          <button
            onClick={() => navigate('/appointments/new')}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Nueva Cita
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 hidden sm:block" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="CHECKUP">Revisión</option>
                  <option value="CLEANING">Limpieza</option>
                  <option value="FILLING">Empaste</option>
                  <option value="ROOT_CANAL">Endodoncia</option>
                  <option value="EXTRACTION">Extracción</option>
                  <option value="ORTHODONTICS">Ortodoncia</option>
                  <option value="EMERGENCY">Emergencia</option>
                  <option value="CONSULTATION">Consulta</option>
                  <option value="FOLLOW_UP">Seguimiento</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-2 sm:p-6 calendar-responsive">
          {loading ? (
            <div className="flex items-center justify-center h-64 sm:h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView={window.innerWidth < 768 ? 'listWeek' : 'timeGridWeek'}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: window.innerWidth < 640 ? 'listWeek,dayGridMonth' : 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
              }}
              locale="es"
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
                list: 'Lista',
              }}
              slotMinTime="07:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              editable={true}
              droppable={true}
              eventDrop={handleEventDrop}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              events={events}
              height="auto"
              contentHeight="auto"
              nowIndicator={true}
              weekends={true}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '08:00',
                endTime: '18:00',
              }}
            />
          )}
        </div>

        <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow-sm p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Leyenda</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-500 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-600">Programada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-500 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-600">Confirmada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-amber-500 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-600">En Progreso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-gray-500 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-600">Completada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-500 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-600">Cancelada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-600 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-600">No Asistió</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
