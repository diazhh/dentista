import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clinicAdminAPI } from '../../services/api';
import type { ClinicDetail } from '../../types';
import { Settings, Save, Plus, X, Check } from 'lucide-react';

const weekDays = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
];

export default function ClinicSettings() {
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<Partial<ClinicDetail>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [newAmenity, setNewAmenity] = useState('');
    const [newSpecialty, setNewSpecialty] = useState('');

    const { data: clinic, isLoading } = useQuery<ClinicDetail>({
        queryKey: ['clinicSettings'],
        queryFn: clinicAdminAPI.getClinic,
    });

    useEffect(() => {
        if (clinic) setFormData(clinic);
    }, [clinic]);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            await clinicAdminAPI.updateClinic({
                name: formData.name || undefined,
                phone: formData.phone || undefined,
                email: formData.email || undefined,
                description: formData.description || undefined,
                website: formData.website || undefined,
                taxId: formData.taxId || undefined,
                businessHours: formData.businessHours || undefined,
                specialties: formData.specialties || undefined,
                amenities: formData.amenities || undefined,
                rentalEnabled: formData.rentalEnabled,
                rentalRateHourly: formData.rentalRateHourly || undefined,
                rentalRateDaily: formData.rentalRateDaily || undefined,
                rentalRateMonthly: formData.rentalRateMonthly || undefined,
                isPublic: formData.isPublic,
            });
            queryClient.invalidateQueries({ queryKey: ['clinicSettings'] });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch {
            alert('Error al guardar los cambios');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSpecialty = () => {
        const trimmed = newSpecialty.trim();
        if (trimmed && !(formData.specialties || []).includes(trimmed)) {
            setFormData({
                ...formData,
                specialties: [...(formData.specialties || []), trimmed],
            });
            setNewSpecialty('');
        }
    };

    const handleRemoveSpecialty = (index: number) => {
        setFormData({
            ...formData,
            specialties: (formData.specialties || []).filter((_, i) => i !== index),
        });
    };

    const handleAddAmenity = () => {
        const trimmed = newAmenity.trim();
        if (trimmed && !(formData.amenities || []).includes(trimmed)) {
            setFormData({
                ...formData,
                amenities: [...(formData.amenities || []), trimmed],
            });
            setNewAmenity('');
        }
    };

    const handleRemoveAmenity = (index: number) => {
        setFormData({
            ...formData,
            amenities: (formData.amenities || []).filter((_, i) => i !== index),
        });
    };

    const toggleDayEnabled = (dayKey: string) => {
        const bh = formData.businessHours || {};
        if (bh[dayKey]) {
            // Disable this day
            setFormData({
                ...formData,
                businessHours: { ...bh, [dayKey]: null },
            });
        } else {
            // Enable with default hours
            setFormData({
                ...formData,
                businessHours: { ...bh, [dayKey]: { open: '08:00', close: '18:00' } },
            });
        }
    };

    const updateDayHours = (dayKey: string, field: 'open' | 'close', value: string) => {
        const bh = formData.businessHours || {};
        const current = bh[dayKey] || { open: '08:00', close: '18:00' };
        setFormData({
            ...formData,
            businessHours: {
                ...bh,
                [dayKey]: { ...current, [field]: value },
            },
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <span className="ml-3 text-gray-500">Cargando...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header + Save button */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-emerald-600" />
                        Configuración de Clínica
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestiona la información y preferencias de tu clínica
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm font-medium disabled:opacity-50"
                >
                    {isSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Guardar Cambios
                </button>
            </div>

            {saveSuccess && (
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" /> Cambios guardados exitosamente
                </div>
            )}

            {/* Section 1: Info General */}
            <div className="bg-white rounded-xl border p-5 space-y-4">
                <h2 className="font-semibold text-gray-900">Información General</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">Nombre</label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">Teléfono</label>
                        <input
                            type="text"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">Sitio Web</label>
                        <input
                            type="url"
                            value={formData.website || ''}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">RUT/NIT</label>
                        <input
                            type="text"
                            value={formData.taxId || ''}
                            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-sm text-gray-600 block mb-1">Descripción</label>
                    <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.isPublic ?? false}
                        onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">
                        Clínica visible en directorio público
                    </span>
                </label>
            </div>

            {/* Section 2: Horario de Atención */}
            <div className="bg-white rounded-xl border p-5 space-y-4">
                <h2 className="font-semibold text-gray-900">Horario de Atención</h2>
                <div className="space-y-3">
                    {weekDays.map((day) => {
                        const bh = formData.businessHours || {};
                        const dayData = bh[day.key];
                        const isEnabled = dayData !== null && dayData !== undefined;

                        return (
                            <div
                                key={day.key}
                                className="flex items-center gap-3 flex-wrap"
                            >
                                <label className="w-24 text-sm font-medium text-gray-700">
                                    {day.label}
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={() => toggleDayEnabled(day.key)}
                                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                </label>
                                {isEnabled && dayData ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={dayData.open}
                                            onChange={(e) =>
                                                updateDayHours(day.key, 'open', e.target.value)
                                            }
                                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm"
                                        />
                                        <span className="text-sm text-gray-400">a</span>
                                        <input
                                            type="time"
                                            value={dayData.close}
                                            onChange={(e) =>
                                                updateDayHours(day.key, 'close', e.target.value)
                                            }
                                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400">Cerrado</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Section 3: Especialidades */}
            <div className="bg-white rounded-xl border p-5 space-y-3">
                <h2 className="font-semibold text-gray-900">Especialidades</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSpecialty();
                            }
                        }}
                        placeholder="Agregar especialidad..."
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleAddSpecialty}
                        disabled={!newSpecialty.trim()}
                        className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm"
                    >
                        <Plus className="w-4 h-4" /> Agregar
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(formData.specialties || []).map((specialty, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1 text-sm px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full"
                        >
                            {specialty}
                            <button
                                onClick={() => handleRemoveSpecialty(i)}
                                className="hover:text-red-500 transition"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    {(formData.specialties || []).length === 0 && (
                        <p className="text-sm text-gray-400 italic">Sin especialidades registradas</p>
                    )}
                </div>
            </div>

            {/* Section 4: Amenidades */}
            <div className="bg-white rounded-xl border p-5 space-y-3">
                <h2 className="font-semibold text-gray-900">Amenidades</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newAmenity}
                        onChange={(e) => setNewAmenity(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddAmenity();
                            }
                        }}
                        placeholder="Agregar amenidad..."
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleAddAmenity}
                        disabled={!newAmenity.trim()}
                        className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm"
                    >
                        <Plus className="w-4 h-4" /> Agregar
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(formData.amenities || []).map((amenity, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1 text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full"
                        >
                            {amenity}
                            <button
                                onClick={() => handleRemoveAmenity(i)}
                                className="hover:text-red-500 transition"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    {(formData.amenities || []).length === 0 && (
                        <p className="text-sm text-gray-400 italic">Sin amenidades registradas</p>
                    )}
                </div>
            </div>

            {/* Section 5: Configuración de Alquiler */}
            <div className="bg-white rounded-xl border p-5 space-y-4">
                <h2 className="font-semibold text-gray-900">Configuración de Alquiler</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.rentalEnabled ?? false}
                        onChange={(e) =>
                            setFormData({ ...formData, rentalEnabled: e.target.checked })
                        }
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">
                        Habilitar alquiler de consultorios
                    </span>
                </label>
                {formData.rentalEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">
                                Tarifa por Hora
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    $
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.rentalRateHourly ?? ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            rentalRateHourly: e.target.value
                                                ? parseFloat(e.target.value)
                                                : null,
                                        })
                                    }
                                    className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">
                                Tarifa por Día
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    $
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.rentalRateDaily ?? ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            rentalRateDaily: e.target.value
                                                ? parseFloat(e.target.value)
                                                : null,
                                        })
                                    }
                                    className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">
                                Tarifa por Mes
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    $
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.rentalRateMonthly ?? ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            rentalRateMonthly: e.target.value
                                                ? parseFloat(e.target.value)
                                                : null,
                                        })
                                    }
                                    className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
