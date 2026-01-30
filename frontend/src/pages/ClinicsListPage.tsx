import { useState, useEffect } from 'react';
import { Building2, Plus, Search, MapPin, Phone, Mail, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { clinicsAPI } from '../services/api';

interface Operatory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface Clinic {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  operatories: Operatory[];
  createdAt: string;
}

export default function ClinicsListPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClinic, setExpandedClinic] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOperatoryModal, setShowOperatoryModal] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
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
      await clinicsAPI.create(formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        phone: '',
        email: '',
      });
      fetchClinics();
    } catch (error) {
      console.error('Error creating clinic:', error);
      alert('Error al crear la clínica');
    }
  };

  const handleDeleteClinic = async (id: string) => {
    if (!confirm('¿Está seguro de que desea desactivar esta clínica?')) return;

    try {
      await clinicsAPI.delete(id);
      fetchClinics();
    } catch (error) {
      console.error('Error deleting clinic:', error);
      alert('Error al desactivar la clínica');
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
    if (!confirm('¿Está seguro de que desea desactivar este consultorio?')) return;

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
      clinic.city?.toLowerCase().includes(search) ||
      clinic.address?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Clínicas</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Clínica
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, ciudad o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClinics.map((clinic) => (
              <div key={clinic.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Clinic Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{clinic.name}</h3>
                      <div className="mt-2 space-y-1">
                        {clinic.address && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {clinic.address}
                              {clinic.city && `, ${clinic.city}`}
                              {clinic.state && `, ${clinic.state}`}
                            </span>
                          </div>
                        )}
                        {clinic.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{clinic.phone}</span>
                          </div>
                        )}
                        {clinic.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{clinic.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          clinic.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {clinic.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                      <button
                        onClick={() => handleDeleteClinic(clinic.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Expand/Collapse */}
                  <button
                    onClick={() =>
                      setExpandedClinic(expandedClinic === clinic.id ? null : clinic.id)
                    }
                    className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
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
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Consultorios</h4>
                      <button
                        onClick={() => {
                          setSelectedClinicId(clinic.id);
                          setShowOperatoryModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar
                      </button>
                    </div>

                    {clinic.operatories.length === 0 ? (
                      <p className="text-sm text-gray-500">No hay consultorios registrados</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {clinic.operatories.map((operatory) => (
                          <div
                            key={operatory.id}
                            className="bg-white rounded-lg border border-gray-200 p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-medium text-gray-900">{operatory.name}</h5>
                                {operatory.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {operatory.description}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteOperatory(operatory.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron clínicas</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          Mostrando {filteredClinics.length} de {clinics.length} clínicas
        </div>
      </div>

      {/* Create Clinic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Nueva Clínica</h2>
            <form onSubmit={handleCreateClinic} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado/Provincia
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Crear Clínica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Operatory Modal */}
      {showOperatoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Nuevo Consultorio</h2>
            <form onSubmit={handleCreateOperatory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={operatoryForm.name}
                  onChange={(e) =>
                    setOperatoryForm({ ...operatoryForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Consultorio 1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={operatoryForm.description}
                  onChange={(e) =>
                    setOperatoryForm({ ...operatoryForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descripción opcional del consultorio"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOperatoryModal(false);
                    setSelectedClinicId(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
