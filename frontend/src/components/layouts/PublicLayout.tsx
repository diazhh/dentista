import { Outlet, Link } from 'react-router-dom';

const PublicLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex">
                            <Link to="/" className="flex-shrink-0 flex items-center">
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                                    Dentista.App
                                </span>
                            </Link>
                            <nav className="ml-10 flex space-x-8">
                                <Link
                                    to="/directory"
                                    className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Buscar Dentista
                                </Link>
                                <Link
                                    to="/login"
                                    className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Para Dentistas
                                </Link>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/login"
                                className="text-gray-700 hover:text-gray-900 font-medium text-sm"
                            >
                                Iniciar sesión
                            </Link>
                            <Link
                                to="/directory"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow"
                            >
                                Agendar Cita
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Dentista.App</h3>
                            <p className="text-gray-400 text-sm">
                                Conectando pacientes con los mejores profesionales del cuidado dental.
                                Reservas simples, rápidas y seguras.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link to="/directory" className="hover:text-white">Buscar Clínica</Link></li>
                                <li><Link to="/directory" className="hover:text-white">Especialidades</Link></li>
                                <li><Link to="/login" className="hover:text-white">Acceso Dentistas</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>support@dentista.app</li>
                                <li>+1 (555) 123-4567</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Dentista.App. Todos los derechos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
