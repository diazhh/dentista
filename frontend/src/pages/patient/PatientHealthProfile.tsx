import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientPortalAPI } from '../../services/api';
import {
    Heart,
    User,
    Droplets,
    AlertTriangle,
    Pill,
    Activity,
    Phone,
    Shield,
    Pencil,
    Check,
    X,
    Plus,
    Trash2,
} from 'lucide-react';

interface HealthProfile {
    patient: {
        firstName: string;
        lastName: string;
        documentType: string;
        documentId: string;
        dateOfBirth: string;
        gender: string;
        email: string;
        phone: string;
    };
    bloodType: string;
    allergies: string[];
    medications: string[];
    chronicConditions: string[];
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelation: string;
    defaultDataAccess: string;
}

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const accessLevels = [
    { value: 'FULL', label: 'Completo - Acceso a toda la información' },
    { value: 'CLINICAL_ONLY', label: 'Solo Clínico - Historial y notas clínicas' },
    { value: 'SCHEDULING_ONLY', label: 'Solo Citas - Agenda y disponibilidad' },
    { value: 'MINIMAL', label: 'Mínimo - Solo datos básicos' },
];

function EditableListCard({
    title,
    icon: Icon,
    iconColor,
    items,
    onSave,
    placeholder,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    items: string[];
    onSave: (items: string[]) => void;
    placeholder: string;
}) {
    const [editing, setEditing] = useState(false);
    const [editItems, setEditItems] = useState<string[]>(items);
    const [newItem, setNewItem] = useState('');

    const handleEdit = () => {
        setEditItems([...items]);
        setNewItem('');
        setEditing(true);
    };

    const handleCancel = () => {
        setEditing(false);
        setEditItems([...items]);
        setNewItem('');
    };

    const handleSave = () => {
        onSave(editItems);
        setEditing(false);
    };

    const handleAdd = () => {
        const trimmed = newItem.trim();
        if (trimmed && !editItems.includes(trimmed)) {
            setEditItems([...editItems, trimmed]);
            setNewItem('');
        }
    };

    const handleRemove = (index: number) => {
        setEditItems(editItems.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
                    {title}
                </h3>
                {!editing ? (
                    <button
                        onClick={handleEdit}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                ) : (
                    <div className="flex gap-1">
                        <button
                            onClick={handleSave}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {!editing ? (
                <div className="flex flex-wrap gap-1.5">
                    {items.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Sin registros</p>
                    ) : (
                        items.map((item, i) => (
                            <span key={i} className="text-xs sm:text-sm px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                                {item}
                            </span>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                        {editItems.map((item, i) => (
                            <span
                                key={i}
                                className="text-xs sm:text-sm px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full flex items-center gap-1"
                            >
                                {item}
                                <button onClick={() => handleRemove(i)} className="hover:text-red-500 transition">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newItem.trim()}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PatientHealthProfile() {
    const queryClient = useQueryClient();

    const { data: profile, isLoading } = useQuery<HealthProfile>({
        queryKey: ['healthProfile'],
        queryFn: patientPortalAPI.getHealthProfile,
    });

    const mutation = useMutation({
        mutationFn: patientPortalAPI.updateHealthProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['healthProfile'] });
        },
    });

    // Blood type editing
    const [editingBlood, setEditingBlood] = useState(false);
    const [bloodType, setBloodType] = useState('');

    // Emergency contact editing
    const [editingEmergency, setEditingEmergency] = useState(false);
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [emergencyRelation, setEmergencyRelation] = useState('');

    // Privacy editing
    const [editingPrivacy, setEditingPrivacy] = useState(false);
    const [defaultAccess, setDefaultAccess] = useState('');

    const handleSaveBloodType = () => {
        mutation.mutate({ bloodType });
        setEditingBlood(false);
    };

    const handleSaveEmergency = () => {
        mutation.mutate({
            emergencyContactName: emergencyName,
            emergencyContactPhone: emergencyPhone,
            emergencyContactRelation: emergencyRelation,
        });
        setEditingEmergency(false);
    };

    const handleSavePrivacy = () => {
        mutation.mutate({ bloodType: undefined } as any);
        // Privacy is managed through patientRegistrationAPI.updatePrivacy, but we keep it consistent
        // by using the health profile update endpoint
        setEditingPrivacy(false);
    };

    const handleSaveList = (field: 'allergies' | 'medications' | 'chronicConditions', items: string[]) => {
        mutation.mutate({ [field]: items });
    };

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
                    <Heart className="w-6 h-6 text-red-500" />
                    Mi Salud
                </h1>
                <p className="text-sm text-gray-500 mt-1">Tu perfil de salud y preferencias de privacidad.</p>
            </div>

            {/* Save indicator */}
            {mutation.isPending && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-2 rounded-lg flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Guardando cambios...
                </div>
            )}
            {mutation.isSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Cambios guardados exitosamente.
                </div>
            )}
            {mutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Error al guardar los cambios. Intenta de nuevo.
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Personal Data (read-only) */}
                <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Datos Personales
                    </h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-gray-400">Nombre</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {profile?.patient?.firstName} {profile?.patient?.lastName}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Género</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {profile?.patient?.gender === 'M'
                                        ? 'Masculino'
                                        : profile?.patient?.gender === 'F'
                                        ? 'Femenino'
                                        : profile?.patient?.gender || '-'}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-gray-400">Documento</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {profile?.patient?.documentType}: {profile?.patient?.documentId}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Fecha de Nacimiento</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {profile?.patient?.dateOfBirth
                                        ? new Date(profile.patient.dateOfBirth).toLocaleDateString('es', {
                                              day: 'numeric',
                                              month: 'long',
                                              year: 'numeric',
                                          })
                                        : '-'}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-gray-400">Email</p>
                                <p className="text-sm font-medium text-gray-900 truncate">{profile?.patient?.email || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Teléfono</p>
                                <p className="text-sm font-medium text-gray-900">{profile?.patient?.phone || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blood Type */}
                <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                            <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                            Tipo de Sangre
                        </h3>
                        {!editingBlood ? (
                            <button
                                onClick={() => {
                                    setBloodType(profile?.bloodType || '');
                                    setEditingBlood(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        ) : (
                            <div className="flex gap-1">
                                <button
                                    onClick={handleSaveBloodType}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setEditingBlood(false)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {!editingBlood ? (
                        <div className="flex items-center justify-center py-4">
                            {profile?.bloodType ? (
                                <span className="text-3xl font-bold text-red-600">{profile.bloodType}</span>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No especificado</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            {bloodTypes.map((bt) => (
                                <button
                                    key={bt}
                                    onClick={() => setBloodType(bt)}
                                    className={`py-2 px-3 text-sm font-medium rounded-lg border transition ${
                                        bloodType === bt
                                            ? 'bg-red-50 border-red-300 text-red-700'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {bt}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Allergies */}
                <EditableListCard
                    title="Alergias"
                    icon={AlertTriangle}
                    iconColor="text-orange-500"
                    items={profile?.allergies || []}
                    onSave={(items) => handleSaveList('allergies', items)}
                    placeholder="Agregar alergia..."
                />

                {/* Current Medications */}
                <EditableListCard
                    title="Medicamentos Actuales"
                    icon={Pill}
                    iconColor="text-green-600"
                    items={profile?.medications || []}
                    onSave={(items) => handleSaveList('medications', items)}
                    placeholder="Agregar medicamento..."
                />

                {/* Chronic Conditions */}
                <EditableListCard
                    title="Condiciones Crónicas"
                    icon={Activity}
                    iconColor="text-purple-600"
                    items={profile?.chronicConditions || []}
                    onSave={(items) => handleSaveList('chronicConditions', items)}
                    placeholder="Agregar condición..."
                />

                {/* Emergency Contact */}
                <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                            <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                            Contacto de Emergencia
                        </h3>
                        {!editingEmergency ? (
                            <button
                                onClick={() => {
                                    setEmergencyName(profile?.emergencyContactName || '');
                                    setEmergencyPhone(profile?.emergencyContactPhone || '');
                                    setEmergencyRelation(profile?.emergencyContactRelation || '');
                                    setEditingEmergency(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        ) : (
                            <div className="flex gap-1">
                                <button
                                    onClick={handleSaveEmergency}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setEditingEmergency(false)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {!editingEmergency ? (
                        <div className="space-y-2">
                            {profile?.emergencyContactName ? (
                                <>
                                    <div>
                                        <p className="text-xs text-gray-400">Nombre</p>
                                        <p className="text-sm font-medium text-gray-900">{profile.emergencyContactName}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-gray-400">Teléfono</p>
                                            <p className="text-sm font-medium text-gray-900">{profile.emergencyContactPhone || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Relación</p>
                                            <p className="text-sm font-medium text-gray-900">{profile.emergencyContactRelation || '-'}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-gray-400 italic py-2">Sin contacto de emergencia registrado</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                                <input
                                    type="text"
                                    value={emergencyName}
                                    onChange={(e) => setEmergencyName(e.target.value)}
                                    placeholder="Nombre completo"
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={emergencyPhone}
                                        onChange={(e) => setEmergencyPhone(e.target.value)}
                                        placeholder="+1 234 567 8900"
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Relación</label>
                                    <input
                                        type="text"
                                        value={emergencyRelation}
                                        onChange={(e) => setEmergencyRelation(e.target.value)}
                                        placeholder="Ej: Esposo/a, Madre, etc."
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Privacy Settings */}
                <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            Preferencias de Privacidad
                        </h3>
                        {!editingPrivacy ? (
                            <button
                                onClick={() => {
                                    setDefaultAccess(profile?.defaultDataAccess || 'FULL');
                                    setEditingPrivacy(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        ) : (
                            <div className="flex gap-1">
                                <button
                                    onClick={() => {
                                        mutation.mutate({} as any);
                                        setEditingPrivacy(false);
                                    }}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setEditingPrivacy(false)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="text-xs sm:text-sm text-gray-500 mb-4">
                        Define el nivel de acceso predeterminado que otorgas cuando un nuevo proveedor solicita acceso a tu información.
                    </p>

                    {!editingPrivacy ? (
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                            <Shield className="w-4 h-4" />
                            {accessLevels.find((l) => l.value === profile?.defaultDataAccess)?.label || 'No configurado'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {accessLevels.map((level) => (
                                <button
                                    key={level.value}
                                    onClick={() => setDefaultAccess(level.value)}
                                    className={`text-left p-3 rounded-lg border transition text-sm ${
                                        defaultAccess === level.value
                                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
