import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientPortalAPI } from '../../services/api';
import { Calendar, Clock, MapPin, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PatientAppointments() {
    const { data: appointments, isLoading } = useQuery({
        queryKey: ['patientAppointments'],
        queryFn: patientPortalAPI.getAppointments,
    });

    const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);

    if (isLoading) {
        return <div className="flex justify-center p-8">Cargando citas...</div>;
    }

    return (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Mis Citas</h1>
                    <p className="text-sm sm:text-base text-gray-500">Historial y proximas visitas.</p>
                </div>
                <button
                    onClick={() => setShowNewAppointmentModal(true)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Solicitar Cita
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {!appointments?.length ? (
                    <div className="p-6 sm:p-8 text-center bg-gray-50">
                        <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">No hay citas registradas</h3>
                        <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Aun no tienes citas en tu historial.</p>
                        <button
                            onClick={() => setShowNewAppointmentModal(true)}
                            className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Agendar mi primera cita
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {appointments.map((apt: any) => {
                            const date = new Date(apt.appointmentDate);
                            const isPast = date < new Date();

                            return (
                                <div key={apt.id} className={`p-4 sm:p-6 flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 hover:bg-gray-50 transition-colors ${isPast ? 'opacity-75' : ''}`}>
                                    {/* Date Badge */}
                                    <div className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex flex-col items-center justify-center border ${isPast ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-blue-50 border-blue-100 text-blue-600'
                                        }`}>
                                        <span className="text-[10px] sm:text-xs font-bold uppercase">{format(date, 'MMM', { locale: es })}</span>
                                        <span className="text-xl sm:text-2xl font-bold">{format(date, 'd')}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                                {apt.procedureType || 'Consulta General'}
                                            </h3>
                                            <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                    apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {apt.status === 'SCHEDULED' ? 'Programada' :
                                                    apt.status === 'COMPLETED' ? 'Completada' :
                                                        apt.status === 'CANCELLED' ? 'Cancelada' : apt.status}
                                            </span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-6 text-xs sm:text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                {format(date, 'h:mm a')} ({apt.duration} min)
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                <span className="truncate">{apt.operatory?.clinic?.name || apt.tenant?.name || 'Consultorio Principal'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {!isPast && apt.status === 'SCHEDULED' && (
                                        <div className="flex-shrink-0">
                                            <button className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium hover:bg-red-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors">
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showNewAppointmentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Solicitar Cita</h2>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                            Para agendar una nueva cita, por favor comunicate con nosotros via WhatsApp o llamanos.
                            <br /><br />
                            Proximamente podras agendar directamente desde aqui.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                            <button
                                onClick={() => setShowNewAppointmentModal(false)}
                                className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 text-sm sm:text-base rounded-lg hover:bg-gray-200 order-2 sm:order-1"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={() => window.open(`https://wa.me/` /* Add number logic */, '_blank')}
                                className="px-3 sm:px-4 py-2 bg-green-500 text-white text-sm sm:text-base rounded-lg hover:bg-green-600 order-1 sm:order-2"
                            >
                                Contactar por WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
