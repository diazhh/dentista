import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  AlertCircle,
  Package,
  Mail,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [emailMenuOpen, setEmailMenuOpen] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isDesktop]);

  const menuItems = [
    {
      name: 'Tablero',
      icon: LayoutDashboard,
      path: '/superadmin',
      description: 'Vista general de la plataforma',
    },
    {
      name: 'Clínicas',
      icon: Building2,
      path: '/superadmin/tenants',
      description: 'Gestión de clínicas suscritas',
    },
    {
      name: 'Usuarios',
      icon: Users,
      path: '/superadmin/users',
      description: 'Administración de usuarios',
    },
    {
      name: 'Planes',
      icon: Package,
      path: '/superadmin/plans',
      description: 'Gestión de planes de suscripción',
    },
    {
      name: 'Suscripciones',
      icon: CreditCard,
      path: '/superadmin/subscriptions',
      description: 'Planes y facturación',
    },
    {
      name: 'Email',
      icon: Mail,
      path: '/superadmin/email',
      description: 'Sistema de correos',
      submenu: [
        {
          name: 'Configuración SMTP',
          path: '/superadmin/email/config',
          description: 'Configurar servidor de correo',
        },
        {
          name: 'Plantillas',
          path: '/superadmin/email/templates',
          description: 'Gestionar plantillas de email',
        },
        {
          name: 'Logs',
          path: '/superadmin/email/logs',
          description: 'Historial de emails enviados',
        },
      ],
    },
    {
      name: 'Análisis',
      icon: BarChart3,
      path: '/superadmin/analytics',
      description: 'Métricas de la plataforma',
    },
    {
      name: 'Logs de Auditoría',
      icon: AlertCircle,
      path: '/superadmin/audit-logs',
      description: 'Registro de actividades',
    },
    {
      name: 'Configuración',
      icon: Settings,
      path: '/superadmin/settings',
      description: 'Configuración de la plataforma',
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:w-20 lg:translate-x-0'}
          bg-gradient-to-b from-indigo-900 to-indigo-800 text-white
          transition-all duration-300 flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 flex items-center justify-between border-b border-indigo-700">
          {(sidebarOpen || !isDesktop) && (
            <div>
              <h1 className="text-lg sm:text-xl font-bold">DentiCloud</h1>
              <p className="text-xs text-indigo-300">Panel de Super Administrador</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-indigo-700 rounded-lg transition-colors lg:block hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-indigo-700 rounded-lg transition-colors lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isEmailMenuActive = location.pathname.startsWith('/superadmin/email');

            if (hasSubmenu) {
              return (
                <div key={item.path}>
                  <button
                    onClick={() => setEmailMenuOpen(!emailMenuOpen)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-lg transition-all ${
                      isEmailMenuActive
                        ? 'bg-indigo-700 text-white shadow-lg'
                        : 'text-indigo-200 hover:bg-indigo-700/50 hover:text-white'
                    }`}
                    title={!sidebarOpen && isDesktop ? item.name : ''}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isEmailMenuActive ? 'text-white' : ''}`} />
                    {(sidebarOpen || !isDesktop) && (
                      <>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{item.name}</div>
                          {isEmailMenuActive && (
                            <div className="text-xs text-indigo-300 mt-0.5 hidden sm:block">{item.description}</div>
                          )}
                        </div>
                        {emailMenuOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </button>
                  {(sidebarOpen || !isDesktop) && emailMenuOpen && (
                    <div className="ml-6 sm:ml-8 mt-1 sm:mt-2 space-y-1">
                      {item.submenu.map((subItem) => {
                        const subActive = isActive(subItem.path);
                        return (
                          <button
                            key={subItem.path}
                            onClick={() => navigate(subItem.path)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                              subActive
                                ? 'bg-indigo-600 text-white'
                                : 'text-indigo-200 hover:bg-indigo-700/50 hover:text-white'
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{subItem.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-lg transition-all ${
                  active
                    ? 'bg-indigo-700 text-white shadow-lg'
                    : 'text-indigo-200 hover:bg-indigo-700/50 hover:text-white'
                }`}
                title={!sidebarOpen && isDesktop ? item.name : ''}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                {(sidebarOpen || !isDesktop) && (
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{item.name}</div>
                    {active && (
                      <div className="text-xs text-indigo-300 mt-0.5 hidden sm:block">{item.description}</div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-3 sm:p-4 border-t border-indigo-700">
          <div className={`${sidebarOpen || !isDesktop ? 'mb-3' : ''}`}>
            {(sidebarOpen || !isDesktop) && (
              <div className="bg-indigo-700/50 rounded-lg p-2 sm:p-3 mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                    {user?.email?.[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{user?.email}</p>
                    <p className="text-xs text-indigo-300">Super Administrador</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-indigo-200 hover:bg-indigo-700 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {(sidebarOpen || !isDesktop) && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </button>

              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {menuItems.find((item) => isActive(item.path))?.name || 'Tablero'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 hidden sm:block truncate">
                  {menuItems.find((item) => isActive(item.path))?.description ||
                    'Panel de administración de la plataforma'}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-32 lg:max-w-none">{user?.email}</p>
                  <p className="text-xs text-gray-500">Super Administrador</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
