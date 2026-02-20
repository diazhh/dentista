import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clinicAdminAPI } from '../../services/api';
import type { ClinicOccupancyReport, ClinicRevenueReport } from '../../types';
import {
    BarChart3,
    Building2,
    DollarSign,
    TrendingUp,
    Calendar,
} from 'lucide-react';

const getUtilColor = (pct: number) => {
    if (pct >= 70) return 'bg-emerald-500';
    if (pct >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
};

export default function ClinicReports() {
    const [activeTab, setActiveTab] = useState<'occupancy' | 'revenue'>('occupancy');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: occupancy, isLoading: occLoading } = useQuery<ClinicOccupancyReport>({
        queryKey: ['clinicOccupancy', startDate, endDate],
        queryFn: () => clinicAdminAPI.getOccupancy(startDate, endDate),
        enabled: activeTab === 'occupancy',
    });

    const { data: revenue, isLoading: revLoading } = useQuery<ClinicRevenueReport>({
        queryKey: ['clinicRevenue', startDate, endDate],
        queryFn: () => clinicAdminAPI.getRevenue(startDate, endDate),
        enabled: activeTab === 'revenue',
    });

    const setPreset = (preset: 'week' | 'month' | 'quarter') => {
        const end = new Date();
        const start = new Date();
        if (preset === 'week') start.setDate(end.getDate() - 7);
        else if (preset === 'month') start.setMonth(end.getMonth() - 1);
        else start.setMonth(end.getMonth() - 3);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-emerald-600" />
                    Reportes
                </h1>
                <p className="text-sm text-gray-500 mt-1">Analíticas de la clínica</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                    className={
                        activeTab === 'occupancy'
                            ? 'bg-white shadow rounded-md px-4 py-2 text-sm font-medium'
                            : 'px-4 py-2 text-sm text-gray-500'
                    }
                    onClick={() => setActiveTab('occupancy')}
                >
                    Ocupación
                </button>
                <button
                    className={
                        activeTab === 'revenue'
                            ? 'bg-white shadow rounded-md px-4 py-2 text-sm font-medium'
                            : 'px-4 py-2 text-sm text-gray-500'
                    }
                    onClick={() => setActiveTab('revenue')}
                >
                    Ingresos
                </button>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Desde:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded-lg px-3 py-1.5 text-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Hasta:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded-lg px-3 py-1.5 text-sm"
                    />
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setPreset('week')}
                        className="text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                    >
                        Última Semana
                    </button>
                    <button
                        onClick={() => setPreset('month')}
                        className="text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                    >
                        Último Mes
                    </button>
                    <button
                        onClick={() => setPreset('quarter')}
                        className="text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                    >
                        Último Trimestre
                    </button>
                </div>
            </div>

            {/* Occupancy Tab */}
            {activeTab === 'occupancy' && (
                <>
                    {occLoading ? (
                        <div className="flex justify-center items-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            <span className="ml-3 text-gray-500">Cargando...</span>
                        </div>
                    ) : (
                        occupancy && (
                            <>
                                {/* Summary cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Building2 className="w-4 h-4 text-blue-600" />
                                            <span className="text-xs text-blue-600 font-medium">
                                                Total Consultorios
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {occupancy.summary.totalRooms}
                                        </p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                                            <span className="text-xs text-emerald-600 font-medium">
                                                Utilización Promedio
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {occupancy.summary.averageUtilization.toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar className="w-4 h-4 text-purple-600" />
                                            <span className="text-xs text-purple-600 font-medium">
                                                Total Citas
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {occupancy.summary.totalAppointments}
                                        </p>
                                    </div>
                                </div>

                                {/* Room breakdown table */}
                                <div className="bg-white rounded-xl border">
                                    <div className="p-4 border-b">
                                        <h3 className="font-semibold text-gray-900">
                                            Desglose por Consultorio
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-gray-50 text-gray-500 text-left">
                                                    <th className="p-3">Consultorio</th>
                                                    <th className="p-3">Citas</th>
                                                    <th className="p-3">Hrs Reservadas</th>
                                                    <th className="p-3">Hrs Disponibles</th>
                                                    <th className="p-3">Utilización</th>
                                                    <th className="p-3">Asignaciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {occupancy.rooms.map((room) => (
                                                    <tr
                                                        key={room.roomId}
                                                        className="border-b last:border-0 hover:bg-gray-50"
                                                    >
                                                        <td className="p-3 font-medium text-gray-900">
                                                            {room.roomName}
                                                            {room.roomNumber && (
                                                                <span className="text-xs text-gray-400 ml-1">
                                                                    ({room.roomNumber})
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-gray-700">
                                                            {room.totalAppointments}
                                                        </td>
                                                        <td className="p-3 text-gray-700">
                                                            {room.totalHoursBooked.toFixed(1)}
                                                        </td>
                                                        <td className="p-3 text-gray-700">
                                                            {room.totalAvailableHours}
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className={`h-2 rounded-full ${getUtilColor(
                                                                            room.utilizationPercentage
                                                                        )}`}
                                                                        style={{
                                                                            width: `${Math.min(
                                                                                room.utilizationPercentage,
                                                                                100
                                                                            )}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-gray-600">
                                                                    {room.utilizationPercentage.toFixed(
                                                                        1
                                                                    )}
                                                                    %
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-gray-700">
                                                            {room.activeAssignments}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )
                    )}
                </>
            )}

            {/* Revenue Tab */}
            {activeTab === 'revenue' && (
                <>
                    {revLoading ? (
                        <div className="flex justify-center items-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            <span className="ml-3 text-gray-500">Cargando...</span>
                        </div>
                    ) : (
                        revenue && (
                            <>
                                {/* Summary cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <DollarSign className="w-4 h-4 text-emerald-600" />
                                            <span className="text-xs text-emerald-600 font-medium">
                                                Ingresos Totales
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            ${revenue.summary.totalRevenue.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Building2 className="w-4 h-4 text-blue-600" />
                                            <span className="text-xs text-blue-600 font-medium">
                                                Alquileres Activos
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {revenue.summary.activeRentals}
                                        </p>
                                    </div>
                                </div>

                                {/* Room revenue table */}
                                <div className="bg-white rounded-xl border">
                                    <div className="p-4 border-b">
                                        <h3 className="font-semibold text-gray-900">
                                            Ingresos por Consultorio
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-gray-50 text-gray-500 text-left">
                                                    <th className="p-3">Consultorio</th>
                                                    <th className="p-3">Ingresos</th>
                                                    <th className="p-3">N° Alquileres</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...revenue.rooms]
                                                    .sort(
                                                        (a, b) =>
                                                            b.totalRevenue - a.totalRevenue
                                                    )
                                                    .map((room) => (
                                                        <tr
                                                            key={room.roomId}
                                                            className="border-b last:border-0 hover:bg-gray-50"
                                                        >
                                                            <td className="p-3 font-medium text-gray-900">
                                                                {room.roomName}
                                                                {room.roomNumber && (
                                                                    <span className="text-xs text-gray-400 ml-1">
                                                                        ({room.roomNumber})
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-gray-700">
                                                                $
                                                                {room.totalRevenue.toLocaleString()}
                                                            </td>
                                                            <td className="p-3 text-gray-700">
                                                                {room.rentalCount}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )
                    )}
                </>
            )}
        </div>
    );
}
