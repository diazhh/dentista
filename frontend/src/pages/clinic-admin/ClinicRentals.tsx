import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicAdminAPI } from '../../services/api';
import type { ClinicRentalRequest } from '../../types';
import {
    KeyRound,
    CheckCircle,
    XCircle,
    Calendar,
    DollarSign,
} from 'lucide-react';

const dayLabels: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
};

const periodLabels: Record<string, string> = {
    HOURLY: 'hora',
    DAILY: 'día',
    MONTHLY: 'mes',
};

export default function ClinicRentals() {
    const queryClient = useQueryClient();

    const { data: requests, isLoading } = useQuery<ClinicRentalRequest[]>({
        queryKey: ['rentalRequests'],
        queryFn: clinicAdminAPI.getRentalRequests,
    });

    const approveMutation = useMutation({
        mutationFn: (id: string) => clinicAdminAPI.approveRental(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rentalRequests'] });
            queryClient.invalidateQueries({ queryKey: ['clinicDashboard'] });
        },
    });

    const rejectMutation = useMutation({
        mutationFn: (id: string) => clinicAdminAPI.rejectRental(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rentalRequests'] });
            queryClient.invalidateQueries({ queryKey: ['clinicDashboard'] });
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <span className="ml-3 text-gray-500">Cargando...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <KeyRound className="w-6 h-6 text-emerald-600" />
                    Solicitudes de Alquiler
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Gestión de solicitudes de alquiler de consultorios
                </p>
            </div>

            {/* Request cards */}
            {requests?.length === 0 ? (
                <div className="bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                    <KeyRound className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No hay solicitudes pendientes
                    </h3>
                    <p className="text-sm text-gray-500">
                        Las solicitudes de alquiler de proveedores aparecerán aquí.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests?.map((request) => (
                        <div
                            key={request.id}
                            className="bg-white rounded-xl border border-gray-200 p-5"
                        >
                            {/* Top: Room name + created date */}
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">
                                    {request.room.name}
                                </h3>
                                <span className="text-xs text-gray-400">
                                    {new Date(request.createdAt).toLocaleDateString('es')}
                                </span>
                            </div>

                            {/* Provider */}
                            <p className="text-sm text-gray-600 mb-2">
                                Proveedor:{' '}
                                <span className="font-medium">{request.providerId}</span>
                            </p>

                            {/* Schedule */}
                            <div className="mb-3">
                                <p className="text-xs font-medium text-gray-500 mb-1">
                                    Horario Solicitado:
                                </p>
                                <div className="space-y-1">
                                    {Object.entries(request.schedule).map(([day, slots]) => (
                                        <div key={day} className="text-sm text-gray-700">
                                            <span className="font-medium">
                                                {dayLabels[day] || day}:
                                            </span>{' '}
                                            {(
                                                slots as Array<{
                                                    start: string;
                                                    end: string;
                                                }>
                                            ).map((s, i) => (
                                                <span key={i}>
                                                    {s.start} - {s.end}
                                                    {i < (slots as Array<{ start: string; end: string }>).length - 1
                                                        ? ', '
                                                        : ''}
                                                </span>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Date range + Rate */}
                            <div className="flex flex-wrap gap-3 mb-4 text-xs">
                                <span className="flex items-center gap-1 bg-gray-50 text-gray-600 px-2 py-1 rounded">
                                    <Calendar className="w-3 h-3" />{' '}
                                    {new Date(request.startDate).toLocaleDateString('es')} —{' '}
                                    {request.endDate
                                        ? new Date(request.endDate).toLocaleDateString('es')
                                        : 'Indefinido'}
                                </span>
                                {request.rentalRate && (
                                    <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded">
                                        <DollarSign className="w-3 h-3" /> $
                                        {request.rentalRate}/
                                        {periodLabels[request.rentalPeriod || ''] ||
                                            request.rentalPeriod}
                                    </span>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                '¿Aprobar esta solicitud?'
                                            )
                                        )
                                            approveMutation.mutate(request.id);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                                    disabled={approveMutation.isPending}
                                >
                                    <CheckCircle className="w-4 h-4" /> Aprobar
                                </button>
                                <button
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                '¿Rechazar esta solicitud?'
                                            )
                                        )
                                            rejectMutation.mutate(request.id);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 border border-red-300 text-red-600 py-2 rounded-lg hover:bg-red-50 transition text-sm font-medium"
                                    disabled={rejectMutation.isPending}
                                >
                                    <XCircle className="w-4 h-4" /> Rechazar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
