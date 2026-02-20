import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clinicAdminAPI } from '../../services/api';
import type { ClinicConsultationRoom, RoomScheduleData } from '../../types';
import {
  DoorOpen,
  Calendar,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

function getAssignmentBadge(type: string) {
  switch (type) {
    case 'RENTAL':
      return { label: 'Alquiler', className: 'bg-green-50 text-green-700' };
    case 'RECURRING':
      return { label: 'Recurrente', className: 'bg-blue-50 text-blue-700' };
    case 'ONE_TIME':
      return { label: 'Unico', className: 'bg-purple-50 text-purple-700' };
    case 'RENTAL_REQUEST':
      return { label: 'Solicitud', className: 'bg-yellow-50 text-yellow-700' };
    default:
      return { label: type, className: 'bg-gray-50 text-gray-700' };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'SCHEDULED':
      return { label: 'Agendada', className: 'bg-blue-50 text-blue-700' };
    case 'COMPLETED':
      return { label: 'Completada', className: 'bg-green-50 text-green-700' };
    case 'CANCELLED':
      return { label: 'Cancelada', className: 'bg-red-50 text-red-700' };
    case 'NO_SHOW':
      return { label: 'No asistio', className: 'bg-orange-50 text-orange-700' };
    default:
      return { label: status, className: 'bg-gray-50 text-gray-700' };
  }
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

export default function ClinicRooms() {
  const [selectedRoom, setSelectedRoom] = useState<ClinicConsultationRoom | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: rooms, isLoading } = useQuery<ClinicConsultationRoom[]>({
    queryKey: ['clinicRooms'],
    queryFn: clinicAdminAPI.getRooms,
  });

  const { data: scheduleData, isLoading: scheduleLoading } = useQuery<RoomScheduleData>({
    queryKey: ['roomSchedule', selectedRoom?.id, scheduleDate],
    queryFn: () => clinicAdminAPI.getRoomSchedule(selectedRoom!.id, scheduleDate),
    enabled: !!selectedRoom,
  });

  const changeDate = (days: number) => {
    const d = new Date(scheduleDate);
    d.setDate(d.getDate() + days);
    setScheduleDate(d.toISOString().split('T')[0]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-500">Cargando consultorios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <DoorOpen className="w-8 h-8 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultorios</h1>
          <p className="text-gray-500">Gestion de consultorios de la clinica</p>
        </div>
      </div>

      {/* Room Cards Grid */}
      {!rooms?.length ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <DoorOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No hay consultorios registrados</h3>
          <p className="text-sm text-gray-500 mt-1">
            Los consultorios de la clinica apareceran aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const activeAssignments = room.roomAssignments?.filter((a) => a.isActive).length || 0;
            return (
              <div
                key={room.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
              >
                {/* Room header: name + roomNumber badge */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{room.name}</h3>
                  {room.roomNumber && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {room.roomNumber}
                    </span>
                  )}
                </div>

                {/* Floor */}
                <p className="text-sm text-gray-500 mb-2">Piso {room.floor}</p>

                {/* Capabilities as chips */}
                {room.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {room.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                      >
                        {cap.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}

                {/* Info row: shared badge + hourly rate + buffer */}
                <div className="flex flex-wrap gap-2 mb-3 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                      room.isShared
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {room.isShared ? 'Compartido' : 'Privado'}
                  </span>
                  {room.hourlyRate && (
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                      ${room.hourlyRate}/hora
                    </span>
                  )}
                  <span className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {room.bufferMinutes} min buffer
                  </span>
                </div>

                {/* Assignments count */}
                <p className="text-xs text-gray-500 mb-3">
                  {activeAssignments} asignaciones activas
                </p>

                {/* View Schedule Button */}
                <button
                  onClick={() => setSelectedRoom(room)}
                  className="w-full py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" /> Ver Horario
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Horario - {selectedRoom.name}</h2>
                <p className="text-sm text-gray-500">
                  {selectedRoom.roomNumber ? `Sala ${selectedRoom.roomNumber}` : ''}{selectedRoom.roomNumber ? ' · ' : ''}Piso {selectedRoom.floor}
                </p>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Date picker */}
            <div className="p-4 border-b flex items-center gap-3">
              <button
                onClick={() => changeDate(-1)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <button
                onClick={() => changeDate(1)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {scheduleLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                </div>
              ) : (
                <>
                  {/* Assignments section */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Asignaciones</h3>
                    {scheduleData?.assignments.length ? (
                      <div className="space-y-2">
                        {scheduleData.assignments.map((assignment) => {
                          const badge = getAssignmentBadge(assignment.assignmentType);
                          return (
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  Proveedor: {assignment.providerId.slice(0, 8)}...
                                </p>
                                {assignment.rentalRate && (
                                  <p className="text-xs text-gray-500">
                                    Tarifa: ${assignment.rentalRate}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Sin asignaciones para esta fecha.</p>
                    )}
                  </div>

                  {/* Appointments section */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Citas del Dia</h3>
                    {scheduleData?.appointments.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-gray-500">
                              <th className="pb-2 pr-3">Hora</th>
                              <th className="pb-2 pr-3">Paciente</th>
                              <th className="pb-2 pr-3">Procedimiento</th>
                              <th className="pb-2 pr-3">Estado</th>
                              <th className="pb-2">Duracion</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {scheduleData.appointments.map((appt) => {
                              const statusBadge = getStatusBadge(appt.status);
                              return (
                                <tr key={appt.id} className="text-gray-700">
                                  <td className="py-2 pr-3">
                                    {formatTime(appt.appointmentDate)}
                                  </td>
                                  <td className="py-2 pr-3">
                                    {appt.patient.firstName} {appt.patient.lastName}
                                  </td>
                                  <td className="py-2 pr-3">{appt.procedureType}</td>
                                  <td className="py-2 pr-3">
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge.className}`}
                                    >
                                      {statusBadge.label}
                                    </span>
                                  </td>
                                  <td className="py-2">{appt.duration} min</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Sin citas para esta fecha.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
