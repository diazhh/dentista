import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import TenantSwitcher from '../TenantSwitcher';
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  FolderOpen,
  Smile,
  Settings,
  LogOut,
  Menu,
  X,
  Stethoscope,
  MessageSquare,
  Building2,
  UserPlus,
} from 'lucide-react';

interface TenantLayoutProps {
  children: React.ReactNode;
}

export default function TenantLayout({ children }: TenantLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

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
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      description: 'Vista general de tu práctica',
    },
    {
      name: 'Calendario',
      icon: Calendar,
      path: '/calendar',
      description: 'Gestión de citas',
    },
    {
      name: 'Pacientes',
      icon: Users,
      path: '/patients',
      description: 'Gestión de pacientes',
    },
    {
      name: 'Odontogramas',
      icon: Smile,
      path: '/odontograms',
      description: 'Registros dentales',
    },
    {
      name: 'Tratamientos',
      icon: Stethoscope,
      path: '/treatment-plans',
      description: 'Planes de tratamiento',
    },
    {
      name: 'Facturas',
      icon: DollarSign,
      path: '/invoices',
      description: 'Facturación y pagos',
    },
    {
      name: 'Documentos',
      icon: FolderOpen,
      path: '/documents',
      description: 'Archivos y documentos',
    },
    {
      name: 'Clínicas',
      icon: Building2,
      path: '/clinics',
      description: 'Gestión de sedes y consultorios',
    },
    {
      name: 'Equipo',
      icon: UserPlus,
      path: '/staff',
      description: 'Personal y colaboradores',
    },
    {
      name: 'WhatsApp',
      icon: MessageSquare,
      path: '/settings/whatsapp',
      description: 'Conexión y mensajes',
    },
    {
      name: 'Configuración',
      icon: Settings,
      path: '/settings',
      description: 'Configuración de la clínica',
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
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
          bg-gradient-to-b from-blue-900 to-blue-800 text-white
          transition-all duration-300 flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 flex items-center justify-between border-b border-blue-700">
          {(sidebarOpen || !isDesktop) && (
            <div>
              <h1 className="text-lg sm:text-xl font-bold">DentiCloud</h1>
              <p className="text-xs text-blue-300">Panel del Dentista</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors lg:block hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-lg transition-all ${active
                  ? 'bg-blue-700 text-white shadow-lg'
                  : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'
                  }`}
                title={!sidebarOpen && isDesktop ? item.name : ''}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                {(sidebarOpen || !isDesktop) && (
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{item.name}</div>
                    {active && (
                      <div className="text-xs text-blue-300 mt-0.5 hidden sm:block">{item.description}</div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-3 sm:p-4 border-t border-blue-700">
          <div className={`${sidebarOpen || !isDesktop ? 'mb-3' : ''}`}>
            {(sidebarOpen || !isDesktop) && (
              <div className="bg-blue-700/50 rounded-lg p-2 sm:p-3 mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                    {user?.email?.[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{user?.email}</p>
                    <p className="text-xs text-blue-300">Dentista</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-blue-200 hover:bg-blue-700 hover:text-white rounded-lg transition-colors"
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
                  {menuItems.find((item) => isActive(item.path))?.name || 'Dashboard'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 hidden sm:block truncate">
                  {menuItems.find((item) => isActive(item.path))?.description ||
                    'Gestión de tu práctica dental'}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:block">
                  <TenantSwitcher />
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-32 lg:max-w-none">{user?.email}</p>
                  <p className="text-xs text-gray-500">Dentista</p>
                </div>
              </div>
            </div>
            {/* Mobile TenantSwitcher */}
            <div className="mt-3 sm:hidden">
              <TenantSwitcher />
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
