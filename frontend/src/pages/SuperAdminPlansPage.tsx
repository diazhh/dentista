import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  DollarSign,
  Users,
  Database,
  Package,
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number | null;
  currency: string;
  maxPatients: number;
  maxUsers: number;
  storageGB: number;
  features: string[];
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function SuperAdminPlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [statistics, setStatistics] = useState({ total: 0, active: 0, inactive: 0 });

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxPatients: 100,
    maxUsers: 5,
    storageGB: 5,
    features: [] as string[],
    isPublic: true,
    sortOrder: 0,
  });

  const availableFeatures = [
    'odontograms',
    'treatment_plans',
    'invoicing',
    'whatsapp',
    'advanced_reports',
    'api_access',
    'priority_support',
    'multi_clinic',
    'custom_branding',
  ];

  useEffect(() => {
    fetchPlans();
    fetchStatistics();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:3000/api/admin/plans', {
        headers: { Authorization: `Bearer ${token}` },
        params: { includeInactive: 'true' },
      });
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:3000/api/admin/plans/statistics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleCreatePlan = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post('http://localhost:3000/api/admin/plans', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowCreateModal(false);
      resetForm();
      fetchPlans();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error creating plan:', error);
      alert(error.response?.data?.message || 'Error creating plan');
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`http://localhost:3000/api/admin/plans/${editingPlan.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingPlan(null);
      resetForm();
      fetchPlans();
    } catch (error: any) {
      console.error('Error updating plan:', error);
      alert(error.response?.data?.message || 'Error updating plan');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('¿Estas seguro de eliminar este plan?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`http://localhost:3000/api/admin/plans/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPlans();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      alert(error.response?.data?.message || 'Error deleting plan');
    }
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = plan.isActive ? 'deactivate' : 'activate';
      await axios.post(`http://localhost:3000/api/admin/plans/${plan.id}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPlans();
      fetchStatistics();
    } catch (error) {
      console.error('Error toggling plan status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxPatients: 100,
      maxUsers: 5,
      storageGB: 5,
      features: [],
      isPublic: true,
      sortOrder: 0,
    });
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      code: plan.code,
      description: plan.description || '',
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice || 0,
      maxPatients: plan.maxPatients,
      maxUsers: plan.maxUsers,
      storageGB: plan.storageGB,
      features: plan.features,
      isPublic: plan.isPublic,
      sortOrder: plan.sortOrder,
    });
    setShowCreateModal(true);
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando planes...</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Gestion de Planes</h1>
          <p className="text-sm sm:text-base text-gray-600">Administra los planes de suscripcion de la plataforma</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingPlan(null);
            setShowCreateModal(true);
          }}
          className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm sm:text-base"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          Crear Plan
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Planes</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.total}</p>
            </div>
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500" />
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Planes Activos</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{statistics.active}</p>
            </div>
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Planes Inactivos</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-600">{statistics.inactive}</p>
            </div>
            <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${
              plan.isActive ? 'border-indigo-500' : 'border-gray-300'
            }`}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{plan.name}</h3>
                <span
                  className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full ${
                    plan.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {plan.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {plan.description && (
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{plan.description}</p>
              )}

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-xl sm:text-2xl font-bold text-indigo-600">
                    ${plan.monthlyPrice}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">/mes</span>
                </div>
                {plan.yearlyPrice && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-base sm:text-lg font-semibold text-gray-700">
                      ${plan.yearlyPrice}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500">/ano</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4 sm:mb-6">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Pacientes
                  </span>
                  <span className="font-medium">{plan.maxPatients}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Usuarios
                  </span>
                  <span className="font-medium">{plan.maxUsers}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Storage
                  </span>
                  <span className="font-medium">{plan.storageGB} GB</span>
                </div>
              </div>

              {plan.features.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {plan.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => openEditModal(plan)}
                  className="flex-1 px-2 sm:px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleToggleActive(plan)}
                  className={`flex-1 px-2 sm:px-3 py-2 rounded flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm ${
                    plan.isActive
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {plan.isActive ? (
                    <>
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Desactivar</span>
                      <span className="sm:hidden">Off</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Activar</span>
                      <span className="sm:hidden">On</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="px-2 sm:px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                {editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Nombre del Plan
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ej: Professional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Codigo
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ej: PROFESSIONAL"
                      disabled={!!editingPlan}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Descripcion
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows={2}
                    placeholder="Descripcion del plan"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Precio Mensual ($)
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyPrice}
                      onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Precio Anual ($) - Opcional
                    </label>
                    <input
                      type="number"
                      value={formData.yearlyPrice}
                      onChange={(e) => setFormData({ ...formData, yearlyPrice: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Max Pacientes
                    </label>
                    <input
                      type="number"
                      value={formData.maxPatients}
                      onChange={(e) => setFormData({ ...formData, maxPatients: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Max Usuarios
                    </label>
                    <input
                      type="number"
                      value={formData.maxUsers}
                      onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Storage (GB)
                    </label>
                    <input
                      type="number"
                      value={formData.storageGB}
                      onChange={(e) => setFormData({ ...formData, storageGB: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Features
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableFeatures.map((feature) => (
                      <label key={feature} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.features.includes(feature)}
                          onChange={() => toggleFeature(feature)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs sm:text-sm text-gray-700">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs sm:text-sm text-gray-700">Visible en pagina publica</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-xs sm:text-sm text-gray-700">Orden:</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPlan(null);
                    resetForm();
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}
                  className="flex-1 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm sm:text-base"
                >
                  {editingPlan ? 'Actualizar' : 'Crear'} Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
