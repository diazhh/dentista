import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, DollarSign, Activity, Users, Building2 } from 'lucide-react';

export default function SuperAdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    system: null as any,
    revenue: null as any,
    activity: [] as any[],
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const [systemRes, revenueRes, activityRes] = await Promise.all([
        axios.get('http://localhost:3000/api/admin/metrics/system', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:3000/api/admin/metrics/revenue', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:3000/api/admin/metrics/activity?days=30', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setMetrics({
        system: systemRes.data,
        revenue: revenueRes.data,
        activity: activityRes.data,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics de la Plataforma</h1>
        <p className="text-gray-600">Métricas y estadísticas detalladas</p>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">MRR</h3>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${metrics.revenue?.mrr?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">Monthly Recurring Revenue</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">ARR</h3>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${metrics.revenue?.arr?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">Annual Recurring Revenue</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Nuevos Tenants</h3>
            <Building2 className="h-8 w-8 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {metrics.revenue?.newTenantsThisMonth || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">Este mes</p>
        </div>
      </div>

      {/* Revenue by Tier */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue por Plan</h3>
        <div className="space-y-4">
          {metrics.revenue?.revenueByTier?.map((tier: any) => (
            <div key={tier.tier} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-32">
                  <span className="text-sm font-medium text-gray-700">{tier.tier}</span>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 w-64">
                  <div
                    className="bg-indigo-600 h-4 rounded-full"
                    style={{ width: `${(tier.count / (metrics.system?.totalTenants || 1)) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">${tier.revenue?.toLocaleString()}/mes</p>
                <p className="text-xs text-gray-500">{tier.count} tenants</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Plan</h3>
          <div className="space-y-3">
            {metrics.system?.tenantsByTier?.map((item: any) => (
              <div key={item.subscriptionTier} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{item.subscriptionTier}</span>
                <span className="text-sm font-semibold text-gray-900">{item._count} tenants</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Suscripciones</h3>
          <div className="space-y-3">
            {metrics.system?.tenantsByStatus?.map((item: any) => (
              <div key={item.subscriptionStatus} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{item.subscriptionStatus}</span>
                <span className="text-sm font-semibold text-gray-900">{item._count} tenants</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Active Tenants */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tenants Más Activos (Últimos 30 días)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Citas Creadas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.activity?.map((tenant: any) => (
                <tr key={tenant.tenantId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tenant.tenantName || tenant.tenantId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tenant.subscriptionTier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tenant.appointmentCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
