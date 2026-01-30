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
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Hola, {data?.patient?.firstName} 👋</h1>
                <p className="text-gray-500">Bienvenido a tu portal de salud dental.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Próximas Citas */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Próximas Citas
                        </h2>
                        <Link to="/patient/appointments" className="text-sm text-blue-600 hover:underline">
                            Ver todas
                        </Link>
                    </div>

                    {!data?.upcomingAppointments?.length ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 mb-4">No tienes citas programadas.</p>
                            <Link to="/patient/appointments/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                Agendar Cita
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.upcomingAppointments.map((apt: any) => (
                                <div key={apt.id} className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition">
                                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex flex-col items-center justify-center">
                                        <span className="text-xs font-bold uppercase">{new Date(apt.date).toLocaleDateString([], { month: 'short' })}</span>
                                        <span className="text-lg font-bold">{new Date(apt.date).getDate()}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{apt.procedure}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <MapPin className="w-3 h-3" />
                                            {apt.location} - {apt.dentist}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Facturas Recientes */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-green-600" />
                            Facturas Recientes
                        </h2>
                    </div>

                    {!data?.recentInvoices?.length ? (
                        <p className="text-gray-500 py-8 text-center">No hay facturas recientes.</p>
                    ) : (
                        <div className="space-y-4">
                            {data.recentInvoices.map((inv: any) => (
                                <div key={inv.id} className="flex justify-between items-center p-3 border-b last:border-0">
                                    <div>
                                        <p className="font-medium text-gray-900"># {inv.number}</p>
                                        <p className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">${inv.amount.toFixed(2)}</p>
                                        <span className={`text-xs px-2 py-1 rounded-full ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
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
