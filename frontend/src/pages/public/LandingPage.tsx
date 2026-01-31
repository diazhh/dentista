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
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8">
                            Tu Sonrisa Perfecta Comienza Aquí
                        </h1>
                        <p className="text-xl md:text-2xl text-blue-100 mb-10 font-light">
                            Encuentra dentistas calificados, compara servicios y agenda citas al instante. Sin llamadas, sin complicaciones.
                        </p>

                        <form onSubmit={handleSearch} className="max-w-xl mx-auto relative flex items-center">
                            <input
                                type="text"
                                placeholder="Buscar por ciudad, especialidad o nombre de clínica..."
                                className="w-full h-14 pl-6 pr-16 rounded-full text-gray-900 shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 text-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-2 bottom-2 bg-blue-600 hovered:bg-blue-700 text-white rounded-full p-3 transition-colors duration-200"
                            >
                                <Search className="h-6 w-6" />
                            </button>
                        </form>

                        <div className="mt-8 flex justify-center space-x-6 text-sm text-blue-200">
                            <span className="flex items-center"><BadgeCheck className="h-4 w-4 mr-1" /> Clínicas Verificadas</span>
                            <span className="flex items-center"><BadgeCheck className="h-4 w-4 mr-1" /> Reserva Instantánea</span>
                            <span className="flex items-center"><BadgeCheck className="h-4 w-4 mr-1" /> Gratis para Pacientes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">Cómo funciona Dentista.App</h2>
                        <p className="mt-4 text-gray-600">Pasos simples para obtener el cuidado dental que necesitas.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="text-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                                <Search className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">1. Encuentra un Dentista</h3>
                            <p className="text-gray-600">Busca por ubicación, especialidad o seguro. Lee reseñas y consulta perfiles de clínicas.</p>
                        </div>

                        <div className="text-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                                <Calendar className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">2. Reserva al Instante</h3>
                            <p className="text-gray-600">Elige un horario que te funcione. Reserva 24/7 sin esperar en línea.</p>
                        </div>

                        <div className="text-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                                <BadgeCheck className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">3. Recibe Atención</h3>
                            <p className="text-gray-600">Recibe recordatorios, gestiona formularios en línea y enfócate en tu sonrisa.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-blue-600 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">¿Eres un Profesional Dental?</h2>
                    <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                        Únete a Dentista.App para optimizar tu consultorio, gestionar citas y aumentar tu base de pacientes.
                    </p>
                    <Link
                        to="/login"
                        className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-lg"
                    >
                        Comenzar Gratis
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
