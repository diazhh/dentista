import { useQuery } from '@tanstack/react-query';
import { clinicAdminAPI } from '../../services/api';
import type { ClinicDashboardData } from '../../types';
import { Link } from 'react-router-dom';
import {
    Building2,
    TrendingUp,
    DollarSign,
    Users,
    Clock,
    DoorOpen,
    KeyRound,
    BarChart3,
    Settings,
    ArrowRight,
} from 'lucide-react';

export default function ClinicDashboard() {
    const { data, isLoading, isError } = useQuery<ClinicDashboardData>({
        queryKey: ['clinicDashboard'],
        queryFn: clinicAdminAPI.getDashboard,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <span className="ml-3 text-gray-500">Cargando...</span>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-700 font-medium">Error al cargar el dashboard.</p>
                <p className="text-red-500 text-sm mt-1">Intenta recargar la página.</p>
            </div>
        );
    }

    const quickLinks = [
        {
            name: 'Consultorios',
            description: 'Gestionar salas y equipamiento',
            icon: DoorOpen,
            path: '/clinic-admin/rooms',
            color: 'text-emerald-600',
        },
        {
            name: 'Personal',
            description: 'Administrar el equipo',
            icon: Users,
            path: '/clinic-admin/staff',
            color: 'text-purple-600',
        },
        {
            name: 'Alquileres',
            description: 'Solicitudes y contratos',
            icon: KeyRound,
            path: '/clinic-admin/rentals',
            color: 'text-blue-600',
        },
        {
            name: 'Reportes',
            description: 'Ocupación e ingresos',
            icon: BarChart3,
            path: '/clinic-admin/reports',
            color: 'text-orange-600',
        },
        {
            name: 'Configuración',
            description: 'Datos y preferencias',
            icon: Settings,
            path: '/clinic-admin/settings',
            color: 'text-gray-600',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-emerald-600" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                    <p className="text-gray-500">Gestión de tu clínica</p>
                </div>
            </div>

            {/* 4 Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Occupancy */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Ocupación</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {data.occupancy.occupancyPercentage}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {data.occupancy.assignedRooms}/{data.occupancy.totalRooms} consultorios
                    </p>
                </div>

                {/* Revenue */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Ingresos Estimados</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        ${data.revenue.estimatedMonthlyRevenue.toLocaleString()}/mes
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {data.revenue.activeRentals} alquileres activos
                    </p>
                </div>

                {/* Staff */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Personal</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {data.staff.totalStaff}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        miembros activos
                    </p>
                </div>

                {/* Pending Requests */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center relative">
                            <Clock className="w-5 h-5 text-yellow-600" />
                            {data.pendingRequests > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {data.pendingRequests}
                                </span>
                            )}
                        </div>
                        <span className="text-sm font-medium text-gray-500">Solicitudes</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {data.pendingRequests}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        alquileres por revisar
                    </p>
                </div>
            </div>

            {/* Quick Links */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Acceso Rápido</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {quickLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-5 h-5 ${link.color}`} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{link.name}</p>
                                        <p className="text-xs text-gray-500">{link.description}</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
