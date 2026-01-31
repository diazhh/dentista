import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
    LayoutDashboard,
    Calendar,
    FileText,
    CreditCard,
    LogOut,
    Menu,
    X,
    User,
    ClipboardList,
    DollarSign,
    Shield,
} from 'lucide-react';

interface PatientLayoutProps {
    children: React.ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const menuItems = [
        {
            name: 'Inicio',
            icon: LayoutDashboard,
            path: '/patient/dashboard',
        },
        {
            name: 'Mis Citas',
            icon: Calendar,
            path: '/patient/appointments',
        },
        {
            name: 'Mis Tratamientos',
            icon: ClipboardList,
            path: '/patient/treatments',
        },
        {
            name: 'Facturas',
            icon: CreditCard,
            path: '/patient/invoices',
        },
        {
            name: 'Mis Pagos',
            icon: DollarSign,
            path: '/patient/payments',
        },
        {
            name: 'Documentos',
            icon: FileText,
            path: '/patient/documents',
        },
        {
            name: 'Seguro',
            icon: Shield,
            path: '/patient/insurance',
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
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-20'
                    } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-gray-200">
                    {sidebarOpen && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">D</span>
                            </div>
                            <span className="font-bold text-gray-900">DentiCloud</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${active
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                title={!sidebarOpen ? item.name : ''}
                            >
                                <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-blue-600' : ''}`} />
                                {sidebarOpen && <span className="font-medium text-sm">{item.name}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-gray-200">
                    <div className={`${sidebarOpen ? 'mb-3' : ''}`}>
                        {sidebarOpen && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate text-gray-900">{user?.name || user?.email}</p>
                                        <p className="text-xs text-gray-500">Paciente</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        {sidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center px-6 justify-between">
                    <h1 className="text-xl font-semibold text-gray-800">
                        {menuItems.find(i => isActive(i.path))?.name || 'Portal Paciente'}
                    </h1>
                </header>
                <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                    <div className="max-w-5xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}
