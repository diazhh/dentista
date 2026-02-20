import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientPortalAPI, patientRegistrationAPI } from '../../services/api';
import {
    Shield,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    User,
    Building2,
    Calendar,
    Eye,
    Settings,
} from 'lucide-react';

interface Consent {
    id: string;
    provider: {
        id: string;
        name: string;
        specialty: string;
    };
    tenant: {
        id: string;
        name: string;
    };
    status: 'PENDING' | 'GRANTED' | 'DENIED' | 'REVOKED' | 'EXPIRED';
    dataAccessLevel: string;
    shareAppointments: boolean;
    shareMedicalHistory: boolean;
    shareDocuments: boolean;
    shareLabResults: boolean;
    shareBilling: boolean;
    requestedAt: string;
    grantedAt?: string;
    expiresAt?: string;
    revokedAt?: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
    PENDING: { label: 'Pendiente', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
    GRANTED: { label: 'Activo', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
    DENIED: { label: 'Denegado', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
    REVOKED: { label: 'Revocado', color: 'text-gray-700', bg: 'bg-gray-100', icon: XCircle },
    EXPIRED: { label: 'Expirado', color: 'text-orange-700', bg: 'bg-orange-100', icon: AlertCircle },
};

const accessLevelLabels: Record<string, string> = {
    FULL: 'Completo',
    CLINICAL_ONLY: 'Solo Clínico',
    SCHEDULING_ONLY: 'Solo Citas',
    MINIMAL: 'Mínimo',
};

const tabs = [
    { key: 'pending', label: 'Pendientes' },
    { key: 'active', label: 'Activos' },
    { key: 'history', label: 'Historial' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

function StatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${config.color} ${config.bg}`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    );
}

function ModifyConsentModal({
    consent,
    onClose,
    onSave,
    isPending,
}: {
    consent: Consent;
    onClose: () => void;
    onSave: (data: {
        dataAccessLevel: string;
        shareAppointments: boolean;
        shareMedicalHistory: boolean;
        shareDocuments: boolean;
        shareLabResults: boolean;
        shareBilling: boolean;
    }) => void;
    isPending: boolean;
}) {
    const [accessLevel, setAccessLevel] = useState(consent.dataAccessLevel || 'FULL');
    const [shareAppointments, setShareAppointments] = useState(consent.shareAppointments);
    const [shareMedicalHistory, setShareMedicalHistory] = useState(consent.shareMedicalHistory);
    const [shareDocuments, setShareDocuments] = useState(consent.shareDocuments);
    const [shareLabResults, setShareLabResults] = useState(consent.shareLabResults);
    const [shareBilling, setShareBilling] = useState(consent.shareBilling);

    const handleSubmit = () => {
        onSave({
            dataAccessLevel: accessLevel,
            shareAppointments,
            shareMedicalHistory,
            shareDocuments,
            shareLabResults,
            shareBilling,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-blue-600" />
                        Modificar Consentimiento
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {consent.provider.name} - {consent.tenant.name}
                    </p>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                    {/* Access Level */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Nivel de Acceso</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(accessLevelLabels).map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => setAccessLevel(value)}
                                    className={`text-left p-2.5 rounded-lg border transition text-sm ${
                                        accessLevel === value
                                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sharing Toggles */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Compartir Información</label>
                        <div className="space-y-2">
                            {[
                                { key: 'appointments', label: 'Citas', value: shareAppointments, setter: setShareAppointments },
                                { key: 'medicalHistory', label: 'Historial Médico', value: shareMedicalHistory, setter: setShareMedicalHistory },
                                { key: 'documents', label: 'Documentos', value: shareDocuments, setter: setShareDocuments },
                                { key: 'labResults', label: 'Resultados de Laboratorio', value: shareLabResults, setter: setShareLabResults },
                                { key: 'billing', label: 'Facturación', value: shareBilling, setter: setShareBilling },
                            ].map((toggle) => (
                                <label
                                    key={toggle.key}
                                    className="flex items-center justify-between p-2.5 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                                >
                                    <span className="text-sm text-gray-700">{toggle.label}</span>
                                    <button
                                        type="button"
                                        onClick={() => toggle.setter(!toggle.value)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                            toggle.value ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                                toggle.value ? 'translate-x-4' : 'translate-x-0.5'
                                            }`}
                                        />
                                    </button>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 border-t border-gray-100 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                        {isPending ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function GrantConsentModal({
    consent,
    onClose,
    onGrant,
    isPending,
}: {
    consent: Consent;
    onClose: () => void;
    onGrant: (data: {
        dataAccessLevel: string;
        shareAppointments: boolean;
        shareMedicalHistory: boolean;
        shareDocuments: boolean;
        shareLabResults: boolean;
        shareBilling: boolean;
    }) => void;
    isPending: boolean;
}) {
    const [accessLevel, setAccessLevel] = useState('CLINICAL_ONLY');
    const [shareAppointments, setShareAppointments] = useState(true);
    const [shareMedicalHistory, setShareMedicalHistory] = useState(true);
    const [shareDocuments, setShareDocuments] = useState(false);
    const [shareLabResults, setShareLabResults] = useState(false);
    const [shareBilling, setShareBilling] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Aceptar Solicitud
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {consent.provider.name} desea acceder a tu información clínica.
                    </p>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Nivel de Acceso</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(accessLevelLabels).map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => setAccessLevel(value)}
                                    className={`text-left p-2.5 rounded-lg border transition text-sm ${
                                        accessLevel === value
                                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Compartir</label>
                        <div className="space-y-2">
                            {[
                                { key: 'appointments', label: 'Citas', value: shareAppointments, setter: setShareAppointments },
                                { key: 'medicalHistory', label: 'Historial Médico', value: shareMedicalHistory, setter: setShareMedicalHistory },
                                { key: 'documents', label: 'Documentos', value: shareDocuments, setter: setShareDocuments },
                                { key: 'labResults', label: 'Resultados de Lab.', value: shareLabResults, setter: setShareLabResults },
                                { key: 'billing', label: 'Facturación', value: shareBilling, setter: setShareBilling },
                            ].map((toggle) => (
                                <label
                                    key={toggle.key}
                                    className="flex items-center justify-between p-2.5 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                                >
                                    <span className="text-sm text-gray-700">{toggle.label}</span>
                                    <button
                                        type="button"
                                        onClick={() => toggle.setter(!toggle.value)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                            toggle.value ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                                toggle.value ? 'translate-x-4' : 'translate-x-0.5'
                                            }`}
                                        />
                                    </button>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 border-t border-gray-100 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() =>
                            onGrant({
                                dataAccessLevel: accessLevel,
                                shareAppointments,
                                shareMedicalHistory,
                                shareDocuments,
                                shareLabResults,
                                shareBilling,
                            })
                        }
                        disabled={isPending}
                        className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                        {isPending ? 'Procesando...' : 'Aceptar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PatientConsents() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabKey>('pending');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [modifyConsent, setModifyConsent] = useState<Consent | null>(null);
    const [grantConsentModal, setGrantConsentModal] = useState<Consent | null>(null);

    const { data: consents, isLoading } = useQuery<Consent[]>({
        queryKey: ['patientConsents'],
        queryFn: patientRegistrationAPI.getMyConsents,
    });

    const grantMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => patientPortalAPI.grantConsent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patientConsents'] });
            setGrantConsentModal(null);
        },
    });

    const denyMutation = useMutation({
        mutationFn: (id: string) => patientPortalAPI.denyConsent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patientConsents'] });
        },
    });

    const modifyMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => patientPortalAPI.modifyConsent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patientConsents'] });
            setModifyConsent(null);
        },
    });

    const revokeMutation = useMutation({
        mutationFn: (id: string) => patientRegistrationAPI.revokeConsent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patientConsents'] });
        },
    });

    const pendingConsents = consents?.filter((c) => c.status === 'PENDING') || [];
    const activeConsents = consents?.filter((c) => c.status === 'GRANTED') || [];
    const historyConsents = [...(consents || [])].sort(
        (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );

    const currentList =
        activeTab === 'pending' ? pendingConsents : activeTab === 'active' ? activeConsents : historyConsents;

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
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-blue-600" />
                    Consentimientos
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Gestiona quién puede acceder a tu información de salud.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                {tabs.map((tab) => {
                    const count =
                        tab.key === 'pending'
                            ? pendingConsents.length
                            : tab.key === 'active'
                            ? activeConsents.length
                            : historyConsents.length;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                                activeTab === tab.key
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                            {count > 0 && (
                                <span
                                    className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                                        activeTab === tab.key
                                            ? 'bg-blue-100 text-blue-700'
                                            : tab.key === 'pending' && count > 0
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Consent List */}
            {currentList.length === 0 ? (
                <div className="bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        {activeTab === 'pending'
                            ? 'Sin solicitudes pendientes'
                            : activeTab === 'active'
                            ? 'Sin consentimientos activos'
                            : 'Sin registros'}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {activeTab === 'pending'
                            ? 'No tienes solicitudes de acceso por revisar.'
                            : activeTab === 'active'
                            ? 'Ningún proveedor tiene acceso activo a tu información.'
                            : 'No hay registros de consentimientos.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {currentList.map((consent) => {
                        const expanded = expandedId === consent.id;
                        return (
                            <div
                                key={consent.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                {/* Main Row */}
                                <div
                                    className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-gray-50 transition"
                                    onClick={() => setExpandedId(expanded ? null : consent.id)}
                                >
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                            {consent.provider.name}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                                            {consent.provider.specialty} - {consent.tenant.name}
                                        </p>
                                    </div>
                                    <StatusBadge status={consent.status} />
                                    {expanded ? (
                                        <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    )}
                                </div>

                                {/* Expanded Details */}
                                {expanded && (
                                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 pt-3 space-y-3">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                            <div>
                                                <p className="text-xs text-gray-400">Nivel de Acceso</p>
                                                <p className="font-medium text-gray-700">
                                                    {accessLevelLabels[consent.dataAccessLevel] || consent.dataAccessLevel}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400">Solicitado</p>
                                                <p className="font-medium text-gray-700">
                                                    {new Date(consent.requestedAt).toLocaleDateString('es', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                            {consent.grantedAt && (
                                                <div>
                                                    <p className="text-xs text-gray-400">Otorgado</p>
                                                    <p className="font-medium text-gray-700">
                                                        {new Date(consent.grantedAt).toLocaleDateString('es', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            )}
                                            {consent.expiresAt && (
                                                <div>
                                                    <p className="text-xs text-gray-400">Expira</p>
                                                    <p className="font-medium text-gray-700">
                                                        {new Date(consent.expiresAt).toLocaleDateString('es', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sharing info for active/granted */}
                                        {(consent.status === 'GRANTED' || consent.status === 'PENDING') && (
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1.5">Información Compartida</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {consent.shareAppointments && (
                                                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                                                            Citas
                                                        </span>
                                                    )}
                                                    {consent.shareMedicalHistory && (
                                                        <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">
                                                            Historial
                                                        </span>
                                                    )}
                                                    {consent.shareDocuments && (
                                                        <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">
                                                            Documentos
                                                        </span>
                                                    )}
                                                    {consent.shareLabResults && (
                                                        <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">
                                                            Lab
                                                        </span>
                                                    )}
                                                    {consent.shareBilling && (
                                                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                            Facturación
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {consent.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setGrantConsentModal(consent);
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Aceptar
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm('¿Estás seguro de denegar esta solicitud?')) {
                                                                denyMutation.mutate(consent.id);
                                                            }
                                                        }}
                                                        disabled={denyMutation.isPending}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Denegar
                                                    </button>
                                                </>
                                            )}
                                            {consent.status === 'GRANTED' && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setModifyConsent(consent);
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                                    >
                                                        <Settings className="w-3.5 h-3.5" />
                                                        Modificar
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (
                                                                window.confirm(
                                                                    '¿Estás seguro de revocar este consentimiento? El proveedor perderá acceso a tu información.'
                                                                )
                                                            ) {
                                                                revokeMutation.mutate(consent.id);
                                                            }
                                                        }}
                                                        disabled={revokeMutation.isPending}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Revocar
                                                    </button>
                                                </>
                                            )}
                                            {(consent.status === 'DENIED' || consent.status === 'REVOKED' || consent.status === 'EXPIRED') && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Solo lectura
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modify Modal */}
            {modifyConsent && (
                <ModifyConsentModal
                    consent={modifyConsent}
                    onClose={() => setModifyConsent(null)}
                    onSave={(data) => modifyMutation.mutate({ id: modifyConsent.id, data })}
                    isPending={modifyMutation.isPending}
                />
            )}

            {/* Grant Modal */}
            {grantConsentModal && (
                <GrantConsentModal
                    consent={grantConsentModal}
                    onClose={() => setGrantConsentModal(null)}
                    onGrant={(data) => grantMutation.mutate({ id: grantConsentModal.id, data })}
                    isPending={grantMutation.isPending}
                />
            )}
        </div>
    );
}
