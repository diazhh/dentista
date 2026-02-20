import { useQuery } from '@tanstack/react-query';
import { patientPortalAPI } from '../../services/api';
import { Calendar, Clock, MapPin, Users, FlaskConical, Bell, FileText, ChevronRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MetricCard {
    nextAppointment?: { date: string; provider: string; procedure: string } | null;
    activeProviders: number;
    totalExams: number;
}

interface Appointment {
    id: string;
    date: string;
    procedure: string;
    provider: string;
    location: string;
    status: string;
}

interface Notification {
    id: string;
    type: 'consent_request' | 'appointment_reminder' | 'exam_result' | 'general';
    title: string;
    message: string;
    date: string;
    read: boolean;
    actionUrl?: string;
}

interface Exam {
    id: string;
    name: string;
    type: string;
    date: string;
    status: string;
}

interface EnhancedDashboardData {
    patient: { firstName: string; lastName: string };
    metrics: MetricCard;
    upcomingAppointments: Appointment[];
    recentExams: Exam[];
}

export default function PatientDashboard() {
    const { data, isLoading } = useQuery<EnhancedDashboardData>({
        queryKey: ['patientEnhancedDashboard'],
        queryFn: patientPortalAPI.getEnhancedDashboard,
    });

    const { data: notifications } = useQuery<Notification[]>({
        queryKey: ['patientNotifications'],
        queryFn: patientPortalAPI.getNotifications,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500">Cargando...</span>
            </div>
        );
    }

    const unreadNotifications = notifications?.filter((n) => !n.read) || [];
    const nextApt = data?.metrics?.nextAppointment;

    return (
        <div className="p-3 sm:p-6 space-y-6 sm:space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    Hola, {data?.patient?.firstName} 👋
                </h1>
                <p className="text-sm sm:text-base text-gray-500">Bienvenido a tu portal de salud.</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Next Appointment */}
                <Link
                    to="/patient/appointments"
                    className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Próxima Cita</span>
                    </div>
                    {nextApt ? (
                        <div>
                            <p className="text-lg font-bold text-gray-900">
                                {new Date(nextApt.date).toLocaleDateString('es', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                })}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{nextApt.provider}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">Sin citas programadas</p>
                    )}
                </Link>

                {/* Active Providers */}
                <Link
                    to="/patient/providers"
                    className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Providers</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{data?.metrics?.activeProviders ?? 0} activos</p>
                </Link>

                {/* Total Exams */}
                <Link
                    to="/patient/exams"
                    className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                            <FlaskConical className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Exámenes</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{data?.metrics?.totalExams ?? 0} total</p>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Upcoming Appointments */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                            Próximas Citas
                            {data?.upcomingAppointments?.length ? (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                    {data.upcomingAppointments.length}
                                </span>
                            ) : null}
                        </h2>
                        <Link to="/patient/appointments" className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center gap-1">
                            Ver todas <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {!data?.upcomingAppointments?.length ? (
                        <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
                            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">No tienes citas programadas.</p>
                            <Link
                                to="/patient/appointments/new"
                                className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition"
                            >
                                Agendar Cita
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {data.upcomingAppointments.slice(0, 3).map((apt) => (
                                <div key={apt.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition">
                                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-lg flex flex-col items-center justify-center">
                                        <span className="text-[10px] sm:text-xs font-bold uppercase">
                                            {new Date(apt.date).toLocaleDateString('es', { month: 'short' })}
                                        </span>
                                        <span className="text-sm sm:text-lg font-bold">{new Date(apt.date).getDate()}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{apt.procedure}</h3>
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                            <span>{new Date(apt.date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">
                                                {apt.location} - {apt.provider}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                            Notificaciones
                            {unreadNotifications.length > 0 && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                    {unreadNotifications.length}
                                </span>
                            )}
                        </h2>
                    </div>

                    {!notifications?.length ? (
                        <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
                            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm sm:text-base text-gray-500">No tienes notificaciones.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 sm:space-y-3">
                            {notifications.slice(0, 5).map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`flex gap-3 p-3 rounded-lg border transition ${
                                        notif.read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100'
                                    }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {notif.type === 'consent_request' ? (
                                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                                        ) : notif.type === 'appointment_reminder' ? (
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                        ) : notif.type === 'exam_result' ? (
                                            <FlaskConical className="w-4 h-4 text-purple-500" />
                                        ) : (
                                            <Bell className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm ${notif.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>{notif.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {new Date(notif.date).toLocaleDateString('es', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    {notif.actionUrl && (
                                        <Link to={notif.actionUrl} className="flex-shrink-0 self-center">
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Exams */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                        Exámenes Recientes
                    </h2>
                    <Link to="/patient/exams" className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center gap-1">
                        Ver todos <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>

                {!data?.recentExams?.length ? (
                    <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
                        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm sm:text-base text-gray-500">No tienes exámenes recientes.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {data.recentExams.slice(0, 3).map((exam) => (
                            <div key={exam.id} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition">
                                <div className="flex items-center gap-2 mb-2">
                                    <FlaskConical className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium text-gray-900 truncate">{exam.name}</span>
                                </div>
                                <p className="text-xs text-gray-500">{exam.type}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] sm:text-xs text-gray-400">
                                        {new Date(exam.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span
                                        className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full ${
                                            exam.status === 'COMPLETED'
                                                ? 'bg-green-100 text-green-700'
                                                : exam.status === 'PENDING'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {exam.status === 'COMPLETED' ? 'Completado' : exam.status === 'PENDING' ? 'Pendiente' : exam.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
