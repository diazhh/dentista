import { useQuery } from '@tanstack/react-query';
import { patientPortalAPI } from '../../services/api';
import { Calendar, Clock, MapPin, Receipt, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ['patientDashboard'],
        queryFn: patientPortalAPI.getDashboard,
    });

    if (isLoading) {
        return <div className="flex justify-center p-8">Cargando...</div>;
    }

    return (
        <div className="p-3 sm:p-6 space-y-6 sm:space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Hola, {data?.patient?.firstName} 👋</h1>
                <p className="text-sm sm:text-base text-gray-500">Bienvenido a tu portal de salud dental.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Proximas Citas */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                            Proximas Citas
                        </h2>
                        <Link to="/patient/appointments" className="text-xs sm:text-sm text-blue-600 hover:underline">
                            Ver todas
                        </Link>
                    </div>

                    {!data?.upcomingAppointments?.length ? (
                        <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
                            <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">No tienes citas programadas.</p>
                            <Link to="/patient/appointments/new" className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition">
                                Agendar Cita
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {data.upcomingAppointments.map((apt: any) => (
                                <div key={apt.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition">
                                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-lg flex flex-col items-center justify-center">
                                        <span className="text-[10px] sm:text-xs font-bold uppercase">{new Date(apt.date).toLocaleDateString([], { month: 'short' })}</span>
                                        <span className="text-sm sm:text-lg font-bold">{new Date(apt.date).getDate()}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{apt.procedure}</h3>
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                            <span>{new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{apt.location} - {apt.dentist}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Facturas Recientes */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                            <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                            Facturas Recientes
                        </h2>
                    </div>

                    {!data?.recentInvoices?.length ? (
                        <p className="text-sm sm:text-base text-gray-500 py-6 sm:py-8 text-center">No hay facturas recientes.</p>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {data.recentInvoices.map((inv: any) => (
                                <div key={inv.id} className="flex justify-between items-center p-2 sm:p-3 border-b last:border-0">
                                    <div>
                                        <p className="font-medium text-sm sm:text-base text-gray-900"># {inv.number}</p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm sm:text-base text-gray-900">${inv.amount.toFixed(2)}</p>
                                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {inv.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
