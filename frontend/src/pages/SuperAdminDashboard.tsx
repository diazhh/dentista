import { useEffect, useState } from 'react';
import axios from 'axios';
import { Building2, Users, DollarSign, TrendingUp, Activity, AlertCircle } from 'lucide-react';

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  monthlyRevenue: number;
  systemUptime: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
    systemUptime: 99.98,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const [metricsRes, revenueRes] = await Promise.all([
        axios.get('http://localhost:3000/api/admin/metrics/system', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:3000/api/admin/metrics/revenue', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats({
        totalTenants: metricsRes.data.totalTenants || 0,
        activeTenants: metricsRes.data.activeTenants || 0,
        totalUsers: metricsRes.data.totalUsers || 0,
        monthlyRevenue: revenueRes.data.mrr || 0,
        systemUptime: 99.98,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando estadísticas...</div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Tenants',
      value: stats.totalTenants,
      icon: Building2,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      name: 'Tenants Activos',
      value: stats.activeTenants,
      icon: Activity,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      name: 'Total Usuarios',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-purple-500',
      change: '+23%',
      changeType: 'positive' as const,
    },
    {
      name: 'MRR',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+15%',
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-lg shadow-lg p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Bienvenido al Panel de Super Admin</h1>
        <p className="text-indigo-100 text-sm sm:text-base">
          Vista general de la plataforma DentiCloud
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`${stat.color} p-2 sm:p-3 rounded-lg`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">{stat.name}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
            Estado del Sistema
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">Uptime</span>
              <span className="text-xs sm:text-sm font-medium text-green-600">{stats.systemUptime}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${stats.systemUptime}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs sm:text-sm text-gray-600">API Response Time</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900">45ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">Database Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Healthy
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
            Alertas Recientes
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900">
                  Alto uso de almacenamiento
                </p>
                <p className="text-xs text-gray-600 mt-1 truncate">
                  Tenant "Clínica Dental ABC" está usando 85% de su cuota
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900">
                  Nuevo tenant registrado
                </p>
                <p className="text-xs text-gray-600 mt-1 truncate">
                  "Odontología Moderna" se registró hace 2 horas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Actividad Reciente</h3>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {[
              {
                action: 'Nuevo tenant creado',
                tenant: 'Clínica Dental XYZ',
                time: 'Hace 1 hora',
                type: 'success',
              },
              {
                action: 'Suscripción actualizada',
                tenant: 'Odontología Premium',
                time: 'Hace 3 horas',
                type: 'info',
              },
              {
                action: 'Pago recibido',
                tenant: 'Dental Care 24/7',
                time: 'Hace 5 horas',
                type: 'success',
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{activity.action}</p>
                    <p className="text-xs text-gray-600 truncate">{activity.tenant}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
