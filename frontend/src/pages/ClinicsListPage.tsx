import { useState, useEffect } from 'react';
import { Building2, Plus, Search, MapPin, Phone, Mail, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { clinicsAPI } from '../services/api';
import { useAbility } from '../casl/AbilityContext';
import { Action } from '../casl/AbilityContext';

interface Operatory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

interface Clinic {
  id: string;
  name: string;
  address?: Address;
  phone?: string;
  email?: string;
  isActive: boolean;
  operatories: Operatory[];
  createdAt: string;
}

export default function ClinicsListPage() {
  const ability = useAbility();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClinic, setExpandedClinic] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOperatoryModal, setShowOperatoryModal] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    phone: '',
    email: '',
  });
  const [operatoryForm, setOperatoryForm] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const data = await clinicsAPI.getAll();
      setClinics(data);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const clinicData = {
        name: formData.name,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zipCode: formData.zipCode,
        },
        phone: formData.phone,
        email: formData.email,
      };
      await clinicsAPI.create(clinicData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        phone: '',
        email: '',
      });
      fetchClinics();
    } catch (error) {
      console.error('Error creating clinic:', error);
      alert('Error al crear la clinica');
    }
  };

  const handleDeleteClinic = async (id: string) => {
    if (!confirm('Esta seguro de que desea desactivar esta clinica?')) return;

    try {
      await clinicsAPI.delete(id);
      fetchClinics();
    } catch (error) {
      console.error('Error deleting clinic:', error);
      alert('Error al desactivar la clinica');
    }
  };

  const handleCreateOperatory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinicId) return;

    try {
      await clinicsAPI.createOperatory({
        clinicId: selectedClinicId,
        name: operatoryForm.name,
        description: operatoryForm.description || undefined,
      });
      setShowOperatoryModal(false);
      setOperatoryForm({ name: '', description: '' });
      setSelectedClinicId(null);
      fetchClinics();
    } catch (error) {
      console.error('Error creating operatory:', error);
      alert('Error al crear el consultorio');
    }
  };

  const handleDeleteOperatory = async (id: string) => {
    if (!confirm('Esta seguro de que desea desactivar este consultorio?')) return;

    try {
      await clinicsAPI.deleteOperatory(id);
      fetchClinics();
    } catch (error) {
      console.error('Error deleting operatory:', error);
      alert('Error al desactivar el consultorio');
    }
  };

  const filteredClinics = clinics.filter((clinic) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      clinic.name.toLowerCase().includes(search) ||
      clinic.address?.city?.toLowerCase().includes(search) ||
      clinic.address?.street?.toLowerCase().includes(search) ||
      clinic.address?.state?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Clinicas</h1>
          </div>
          {ability.can(Action.Create, 'Clinic') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Nueva Clinica
            </button>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, ciudad o direccion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredClinics.map((clinic) => (
              <div key={clinic.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Clinic Header */}
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{clinic.name}</h3>
                      <div className="mt-2 space-y-1">
                        {clinic.address && (clinic.address.street || clinic.address.city || clinic.address.state) && (
                          <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="break-words">
                              {clinic.address.street}
                              {clinic.address.city && `${clinic.address.street ? ', ' : ''}${clinic.address.city}`}
                              {clinic.address.state && `, ${clinic.address.state}`}
                              {clinic.address.zipCode && ` ${clinic.address.zipCode}`}
                            </span>
                          </div>
                        )}
                        {clinic.phone && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{clinic.phone}</span>
                          </div>
                        )}
                        {clinic.email && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{clinic.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          clinic.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {clinic.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                      {ability.can(Action.Delete, 'Clinic') && (
                        <button
                          onClick={() => handleDeleteClinic(clinic.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expand/Collapse */}
                  <button
                    onClick={() =>
                      setExpandedClinic(expandedClinic === clinic.id ? null : clinic.id)
                    }
                    className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700"
                  >
                    {expandedClinic === clinic.id ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Ocultar consultorios
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Ver consultorios ({clinic.operatories.length})
                      </>
                    )}
                  </button>
                </div>

                {/* Operatories */}
                {expandedClinic === clinic.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">Consultorios</h4>
                      {ability.can(Action.Create, 'Operatory') && (
                        <button
                          onClick={() => {
                            setSelectedClinicId(clinic.id);
                            setShowOperatoryModal(true);
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-1 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar
                        </button>
                      )}
                    </div>

                    {clinic.operatories.length === 0 ? (
                      <p className="text-xs sm:text-sm text-gray-500">No hay consultorios registrados</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {clinic.operatories.map((operatory) => (
                          <div
                            key={operatory.id}
                            className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-gray-900 text-sm sm:text-base">{operatory.name}</h5>
                                {operatory.description && (
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    {operatory.description}
                                  </p>
                                )}
                              </div>
                              {ability.can(Action.Delete, 'Operatory') && (
                                <button
                                  onClick={() => handleDeleteOperatory(operatory.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {filteredClinics.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">No se encontraron clinicas</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-xs sm:text-sm text-gray-500">
          Mostrando {filteredClinics.length} de {clinics.length} clinicas
        </div>
      </div>

      {/* Create Clinic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Nueva Clinica</h2>
            <form onSubmit={handleCreateClinic} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Direccion (Calle)
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Estado/Provincia
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Pais
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Codigo Postal
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 sm:px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                >
                  Crear Clinica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Operatory Modal */}
      {showOperatoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Nuevo Consultorio</h2>
            <form onSubmit={handleCreateOperatory} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={operatoryForm.name}
                  onChange={(e) =>
                    setOperatoryForm({ ...operatoryForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Ej: Consultorio 1"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Descripcion
                </label>
                <textarea
                  value={operatoryForm.description}
                  onChange={(e) =>
                    setOperatoryForm({ ...operatoryForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  rows={3}
                  placeholder="Descripcion opcional del consultorio"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOperatoryModal(false);
                    setSelectedClinicId(null);
                  }}
                  className="px-3 sm:px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                >
                  Crear Consultorio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
