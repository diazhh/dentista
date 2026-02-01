import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, TrendingUp, Package, Edit, CheckCircle } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  email: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  maxPatients: number;
  storageGB: number;
  createdAt: string;
}

export default function SuperAdminSubscriptionsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTenant, setEditingTenant] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    subscriptionTier: '',
    subscriptionStatus: '',
    maxPatients: 0,
    storageGB: 0,
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:3000/api/admin/tenants', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTenants(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant.id);
    setEditForm({
      subscriptionTier: tenant.subscriptionTier,
      subscriptionStatus: tenant.subscriptionStatus,
      maxPatients: tenant.maxPatients,
      storageGB: tenant.storageGB,
    });
  };

  const handleSave = async (tenantId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(
        `http://localhost:3000/api/admin/tenants/${tenantId}/subscription`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingTenant(null);
      fetchTenants();
      alert('Suscripcion actualizada exitosamente');
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Error al actualizar suscripcion');
    }
  };

  const handleCancel = () => {
    setEditingTenant(null);
  };

  const getTierBadgeColor = (tier: string) => {
    const colors: Record<string, string> = {
      STARTER: 'bg-blue-100 text-blue-800',
      PROFESSIONAL: 'bg-purple-100 text-purple-800',
      ENTERPRISE: 'bg-yellow-100 text-yellow-800',
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      TRIAL: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      PAST_DUE: 'bg-orange-100 text-orange-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const tierPricing = {
    STARTER: 29,
    PROFESSIONAL: 79,
    ENTERPRISE: 199,
  };

  const totalMRR = tenants
    .filter(t => t.subscriptionStatus === 'ACTIVE')
    .reduce((sum, t) => sum + (tierPricing[t.subscriptionTier as keyof typeof tierPricing] || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando suscripciones...</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Gestion de Suscripciones</h1>
        <p className="text-sm sm:text-base text-gray-600">Administra planes y facturacion de todos los tenants</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">MRR Total</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">${totalMRR.toLocaleString()}</p>
            </div>
            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">ARR Total</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">${(totalMRR * 12).toLocaleString()}</p>
            </div>
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Suscripciones Activas</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {tenants.filter(t => t.subscriptionStatus === 'ACTIVE').length}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Tenants</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{tenants.length}</p>
            </div>
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Planes de Suscripcion</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="border-2 border-blue-200 rounded-lg p-3 sm:p-4">
            <h4 className="text-base sm:text-lg font-bold text-blue-600">STARTER</h4>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">$29<span className="text-xs sm:text-sm text-gray-500">/mes</span></p>
            <ul className="mt-3 sm:mt-4 space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <li>Hasta 50 pacientes</li>
              <li>5 GB almacenamiento</li>
              <li>1 usuario</li>
            </ul>
          </div>
          <div className="border-2 border-purple-200 rounded-lg p-3 sm:p-4 bg-purple-50">
            <h4 className="text-base sm:text-lg font-bold text-purple-600">PROFESSIONAL</h4>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">$79<span className="text-xs sm:text-sm text-gray-500">/mes</span></p>
            <ul className="mt-3 sm:mt-4 space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <li>Hasta 200 pacientes</li>
              <li>20 GB almacenamiento</li>
              <li>5 usuarios</li>
            </ul>
          </div>
          <div className="border-2 border-yellow-200 rounded-lg p-3 sm:p-4">
            <h4 className="text-base sm:text-lg font-bold text-yellow-600">ENTERPRISE</h4>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">$199<span className="text-xs sm:text-sm text-gray-500">/mes</span></p>
            <ul className="mt-3 sm:mt-4 space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <li>Pacientes ilimitados</li>
              <li>100 GB almacenamiento</li>
              <li>Usuarios ilimitados</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Subscriptions Table/Cards */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Limites
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MRR
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{tenant.email}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {editingTenant === tenant.id ? (
                      <select
                        value={editForm.subscriptionTier}
                        onChange={(e) => setEditForm({ ...editForm, subscriptionTier: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="STARTER">STARTER</option>
                        <option value="PROFESSIONAL">PROFESSIONAL</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTierBadgeColor(tenant.subscriptionTier)}`}>
                        {tenant.subscriptionTier}
                      </span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {editingTenant === tenant.id ? (
                      <select
                        value={editForm.subscriptionStatus}
                        onChange={(e) => setEditForm({ ...editForm, subscriptionStatus: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="TRIAL">TRIAL</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PAST_DUE">PAST_DUE</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(tenant.subscriptionStatus)}`}>
                        {tenant.subscriptionStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingTenant === tenant.id ? (
                      <div className="space-y-1">
                        <input
                          type="number"
                          value={editForm.maxPatients}
                          onChange={(e) => setEditForm({ ...editForm, maxPatients: parseInt(e.target.value) })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Pacientes"
                        />
                        <input
                          type="number"
                          value={editForm.storageGB}
                          onChange={(e) => setEditForm({ ...editForm, storageGB: parseInt(e.target.value) })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="GB"
                        />
                      </div>
                    ) : (
                      <>
                        <div>{tenant.maxPatients} pacientes</div>
                        <div>{tenant.storageGB} GB</div>
                      </>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {tenant.subscriptionStatus === 'ACTIVE'
                      ? `$${tierPricing[tenant.subscriptionTier as keyof typeof tierPricing] || 0}`
                      : '-'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingTenant === tenant.id ? (
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => handleSave(tenant.id)}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(tenant)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar suscripcion"
                      >
                        <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Cards */}
        <div className="lg:hidden divide-y divide-gray-200">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tenant.name}</p>
                  <p className="text-xs text-gray-500 truncate">{tenant.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getTierBadgeColor(tenant.subscriptionTier)}`}>
                    {tenant.subscriptionTier}
                  </span>
                  <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(tenant.subscriptionStatus)}`}>
                    {tenant.subscriptionStatus}
                  </span>
                </div>
              </div>

              {editingTenant === tenant.id ? (
                <div className="space-y-3 mb-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Plan</label>
                      <select
                        value={editForm.subscriptionTier}
                        onChange={(e) => setEditForm({ ...editForm, subscriptionTier: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="STARTER">STARTER</option>
                        <option value="PROFESSIONAL">PROFESSIONAL</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Estado</label>
                      <select
                        value={editForm.subscriptionStatus}
                        onChange={(e) => setEditForm({ ...editForm, subscriptionStatus: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="TRIAL">TRIAL</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PAST_DUE">PAST_DUE</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Max Pacientes</label>
                      <input
                        type="number"
                        value={editForm.maxPatients}
                        onChange={(e) => setEditForm({ ...editForm, maxPatients: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Storage GB</label>
                      <input
                        type="number"
                        value={editForm.storageGB}
                        onChange={(e) => setEditForm({ ...editForm, storageGB: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(tenant.id)}
                      className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-3">
                    <div>
                      <span className="font-medium">Pacientes:</span> {tenant.maxPatients}
                    </div>
                    <div>
                      <span className="font-medium">Storage:</span> {tenant.storageGB} GB
                    </div>
                    <div>
                      <span className="font-medium">MRR:</span>{' '}
                      {tenant.subscriptionStatus === 'ACTIVE'
                        ? `$${tierPricing[tenant.subscriptionTier as keyof typeof tierPricing] || 0}`
                        : '-'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(tenant)}
                    className="w-full px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded text-sm flex items-center justify-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar Suscripcion
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
