import { useQuery } from '@tanstack/react-query';
import { patientRegistrationAPI } from '../../services/api';
import { Users, Building2, Shield, ExternalLink, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProviderRelation {
    id: string;
    provider: {
        id: string;
        name: string;
        specialty: string;
        email: string;
        phone?: string;
    };
    tenant: {
        id: string;
        name: string;
    };
    relationshipType: string;
    dataAccessLevel: string;
    status: string;
    createdAt: string;
}

const accessLevelConfig: Record<string, { label: string; color: string; bg: string }> = {
    FULL: { label: 'Completo', color: 'text-green-700', bg: 'bg-green-100' },
    CLINICAL_ONLY: { label: 'Solo Clínico', color: 'text-blue-700', bg: 'bg-blue-100' },
    SCHEDULING_ONLY: { label: 'Solo Citas', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    MINIMAL: { label: 'Mínimo', color: 'text-gray-700', bg: 'bg-gray-100' },
};

function AccessBadge({ level }: { level: string }) {
    const config = accessLevelConfig[level] || accessLevelConfig.MINIMAL;
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color} ${config.bg}`}>
            {config.label}
        </span>
    );
}

export default function PatientProviders() {
    const { data: providers, isLoading } = useQuery<ProviderRelation[]>({
        queryKey: ['myProviders'],
        queryFn: patientRegistrationAPI.getMyProviders,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500">Cargando...</span>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        Mis Providers
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Profesionales de salud que tienen acceso a tu información.
                    </p>
                </div>
                <Link
                    to="/directory"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                >
                    <Search className="w-4 h-4" />
                    Buscar en directorio
                </Link>
            </div>

            {/* Providers List */}
            {!providers?.length ? (
                <div className="bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin providers vinculados</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Aún no tienes profesionales de salud vinculados a tu perfil.
                    </p>
                    <Link
                        to="/directory"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                    >
                        <Search className="w-4 h-4" />
                        Buscar en directorio
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providers.map((relation) => (
                        <div
                            key={relation.id}
                            className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm sm:text-lg font-bold">
                                            {relation.provider.name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                            {relation.provider.name}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                                            {relation.provider.specialty}
                                        </p>
                                    </div>
                                </div>
                                <AccessBadge level={relation.dataAccessLevel} />
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">{relation.tenant.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                                    <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>
                                        Relación:{' '}
                                        {relation.relationshipType === 'PRIMARY'
                                            ? 'Primario'
                                            : relation.relationshipType === 'SPECIALIST'
                                            ? 'Especialista'
                                            : relation.relationshipType === 'REFERRED'
                                            ? 'Referido'
                                            : relation.relationshipType}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-400">
                                    Vinculado desde:{' '}
                                    {new Date(relation.createdAt).toLocaleDateString('es', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end">
                                <Link
                                    to="/patient/consents"
                                    className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                                >
                                    <Shield className="w-3.5 h-3.5" />
                                    Modificar acceso
                                    <ExternalLink className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
