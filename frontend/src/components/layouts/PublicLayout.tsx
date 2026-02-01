import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const PublicLayout = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
                    <div className="flex justify-between items-center h-14 sm:h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link to="/" className="flex-shrink-0 flex items-center">
                                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                                    Dentista.App
                                </span>
                            </Link>
                            {/* Desktop Nav */}
                            <nav className="ml-6 lg:ml-10 hidden md:flex space-x-4 lg:space-x-8">
                                <Link
                                    to="/directory"
                                    className="text-gray-500 hover:text-gray-900 px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Buscar Dentista
                                </Link>
                                <Link
                                    to="/login"
                                    className="text-gray-500 hover:text-gray-900 px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Para Dentistas
                                </Link>
                            </nav>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
                            <Link
                                to="/login"
                                className="text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors"
                            >
                                Iniciar sesión
                            </Link>
                            <Link
                                to="/directory"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow"
                            >
                                Agendar Cita
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 -mr-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden border-t border-gray-200 py-3 space-y-1">
                            <Link
                                to="/directory"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Buscar Dentista
                            </Link>
                            <Link
                                to="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Para Dentistas
                            </Link>
                            <Link
                                to="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Iniciar sesión
                            </Link>
                            <div className="pt-2 px-3">
                                <Link
                                    to="/directory"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-base font-medium transition-colors shadow-sm"
                                >
                                    Agendar Cita
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8 sm:py-12">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        <div className="sm:col-span-2 lg:col-span-1">
                            <h3 className="text-lg font-semibold mb-3 sm:mb-4">Dentista.App</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Conectando pacientes con los mejores profesionales del cuidado dental.
                                Reservas simples, rápidas y seguras.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-3 sm:mb-4">Enlaces Rápidos</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link to="/directory" className="hover:text-white transition-colors">Buscar Clínica</Link></li>
                                <li><Link to="/directory" className="hover:text-white transition-colors">Especialidades</Link></li>
                                <li><Link to="/login" className="hover:text-white transition-colors">Acceso Dentistas</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-3 sm:mb-4">Contacto</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>support@dentista.app</li>
                                <li>+1 (555) 123-4567</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Dentista.App. Todos los derechos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
