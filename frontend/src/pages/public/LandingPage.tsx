import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Calendar, BadgeCheck } from 'lucide-react'; // Using lucide-react

const LandingPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(`/directory?q=${searchQuery}`);
    };

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2068&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 md:py-28 lg:py-40">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 sm:mb-6 md:mb-8">
                            Tu Sonrisa Perfecta Comienza Aqui
                        </h1>
                        <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-blue-100 mb-6 sm:mb-8 md:mb-10 font-light px-2 sm:px-0">
                            Encuentra dentistas calificados, compara servicios y agenda citas al instante. Sin llamadas, sin complicaciones.
                        </p>

                        <form onSubmit={handleSearch} className="max-w-xl mx-auto relative flex items-center px-2 sm:px-0">
                            <input
                                type="text"
                                placeholder="Buscar por ciudad, especialidad..."
                                className="w-full h-10 sm:h-12 md:h-14 pl-4 sm:pl-6 pr-12 sm:pr-16 rounded-full text-gray-900 shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 text-sm sm:text-base md:text-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="absolute right-3 sm:right-2 top-1 sm:top-2 bottom-1 sm:bottom-2 bg-blue-600 hovered:bg-blue-700 text-white rounded-full p-2 sm:p-3 transition-colors duration-200"
                            >
                                <Search className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                            </button>
                        </form>

                        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 md:gap-6 text-xs sm:text-sm text-blue-200 px-2 sm:px-0">
                            <span className="flex items-center"><BadgeCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Clinicas Verificadas</span>
                            <span className="flex items-center"><BadgeCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Reserva Instantanea</span>
                            <span className="flex items-center"><BadgeCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Gratis para Pacientes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-12 sm:py-16 md:py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="text-center mb-8 sm:mb-12 md:mb-16">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Como funciona Dentista.App</h2>
                        <p className="mt-2 sm:mt-4 text-sm sm:text-base text-gray-600">Pasos simples para obtener el cuidado dental que necesitas.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-12">
                        <div className="text-center p-4 sm:p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-blue-100 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-blue-600">
                                <Search className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                            </div>
                            <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">1. Encuentra un Dentista</h3>
                            <p className="text-sm sm:text-base text-gray-600">Busca por ubicacion, especialidad o seguro. Lee resenas y consulta perfiles de clinicas.</p>
                        </div>

                        <div className="text-center p-4 sm:p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-blue-100 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-blue-600">
                                <Calendar className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                            </div>
                            <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">2. Reserva al Instante</h3>
                            <p className="text-sm sm:text-base text-gray-600">Elige un horario que te funcione. Reserva 24/7 sin esperar en linea.</p>
                        </div>

                        <div className="text-center p-4 sm:p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1 sm:max-w-md sm:mx-auto lg:max-w-none">
                            <div className="bg-blue-100 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-blue-600">
                                <BadgeCheck className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                            </div>
                            <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">3. Recibe Atencion</h3>
                            <p className="text-sm sm:text-base text-gray-600">Recibe recordatorios, gestiona formularios en linea y enfocate en tu sonrisa.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-blue-600 py-10 sm:py-12 md:py-16">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center text-white">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Eres un Profesional Dental?</h2>
                    <p className="text-sm sm:text-base text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-2 sm:px-0">
                        Unete a Dentista.App para optimizar tu consultorio, gestionar citas y aumentar tu base de pacientes.
                    </p>
                    <Link
                        to="/login"
                        className="inline-block bg-white text-blue-600 px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-bold text-sm sm:text-base hover:bg-gray-100 transition-colors shadow-lg"
                    >
                        Comenzar Gratis
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
