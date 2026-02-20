import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
    LayoutDashboard,
    DoorOpen,
    Users,
    KeyRound,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    User,
} from 'lucide-react';

interface ClinicAdminLayoutProps {
    children: React.ReactNode;
}

export default function ClinicAdminLayout({ children }: ClinicAdminLayoutProps) {
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
            path: '/clinic-admin/dashboard',
        },
        {
            name: 'Consultorios',
            icon: DoorOpen,
            path: '/clinic-admin/rooms',
        },
        {
            name: 'Personal',
            icon: Users,
            path: '/clinic-admin/staff',
        },
        {
            name: 'Alquileres',
            icon: KeyRound,
            path: '/clinic-admin/rentals',
        },
        {
            name: 'Reportes',
            icon: BarChart3,
            path: '/clinic-admin/reports',
        },
        {
            name: 'Configuración',
            icon: Settings,
            path: '/clinic-admin/settings',
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
                    bg-gradient-to-b from-emerald-900 to-emerald-800
                    transition-all duration-300 flex flex-col
                `}
            >
                {/* Header */}
                <div className="p-3 sm:p-4 flex items-center justify-between border-b border-emerald-700">
                    {(sidebarOpen || !isDesktop) && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">C</span>
                            </div>
                            <span className="font-bold text-white">MediCloud Admin</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-emerald-700 rounded-lg transition-colors text-emerald-300 lg:block hidden"
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 hover:bg-emerald-700 rounded-lg transition-colors text-emerald-300 lg:hidden"
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
                                        ? 'bg-emerald-700 text-white'
                                        : 'text-emerald-200 hover:bg-emerald-700 hover:text-white'
                                    }`}
                                title={!sidebarOpen && isDesktop ? item.name : ''}
                            >
                                <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                                {(sidebarOpen || !isDesktop) && <span className="font-medium text-sm">{item.name}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* User Info & Logout */}
                <div className="p-3 sm:p-4 border-t border-emerald-700">
                    <div className={`${sidebarOpen || !isDesktop ? 'mb-3' : ''}`}>
                        {(sidebarOpen || !isDesktop) && (
                            <div className="bg-emerald-700/50 rounded-lg p-2 sm:p-3 mb-3">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                                        <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium truncate text-white">{user?.name || user?.email}</p>
                                        <p className="text-xs text-emerald-300">Administrador de Clínica</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        {(sidebarOpen || !isDesktop) && <span className="text-sm font-medium">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm border-b border-gray-200 h-14 sm:h-16 flex items-center px-3 sm:px-4 lg:px-6 justify-between gap-2 sm:gap-4">
                    {/* Mobile menu button */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                    >
                        <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    </button>

                    <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 truncate flex-1">
                        {menuItems.find(i => isActive(i.path))?.name || 'Admin Clínica'}
                    </h1>

                    {/* User info - desktop only */}
                    <div className="hidden md:flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-gray-700 truncate max-w-32">{user?.name || user?.email}</span>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto bg-gray-50 p-3 sm:p-4 lg:p-6">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}
