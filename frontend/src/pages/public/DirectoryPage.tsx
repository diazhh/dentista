import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicAPI } from '../../services/api';
import { Search, MapPin, Star } from 'lucide-react';

const DirectoryPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [filters, setFilters] = useState({
        city: searchParams.get('city') || '',
        specialty: searchParams.get('specialty') || '',
    });

    const { data: clinics, isLoading } = useQuery({
        queryKey: ['public-clinics', searchTerm, filters],
        queryFn: () =>
            publicAPI.getClinics({
                q: searchTerm,
                city: filters.city,
                specialty: filters.specialty,
            }),
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchParams({ q: searchTerm, ...filters });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Search Header */}
            <div className="bg-white shadow border-b border-gray-200 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Your Dentist</h1>
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative md:col-span-2">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search clinics, dentists..."
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div>
                            <select
                                className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                value={filters.specialty}
                                onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                            >
                                <option value="">All Specialties</option>
                                <option value="General Dentist">General Dentist</option>
                                <option value="Orthodontist">Orthodontist</option>
                                <option value="Pediatric Dentist">Pediatric Dentist</option>
                                <option value="Endodontist">Endodontist</option>
                            </select>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clinics?.data?.map((clinic: any) => (
                            <div key={clinic.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-gray-900 truncate">
                                            <Link to={`/clinic/${clinic.subdomain || clinic.id}`} className="hover:text-blue-600">
                                                {clinic.name}
                                            </Link>
                                        </h3>
                                        {clinic.logo && (
                                            <img src={clinic.logo} alt={clinic.name} className="h-10 w-10 rounded-full object-cover" />
                                        )}
                                    </div>

                                    <div className="flex items-center text-gray-500 mb-2">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        <span className="text-sm">{clinic.address || 'Address not listed'}</span>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Top Dentists</h4>
                                        <div className="space-y-2">
                                            {clinic.users?.map((dentist: any) => (
                                                <div key={dentist.id} className="text-sm">
                                                    <span className="font-medium text-gray-900">{dentist.name}</span>
                                                    {dentist.specialization && (
                                                        <span className="text-gray-500 ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                                            {dentist.specialization}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                    <Link
                                        to={`/clinic/${clinic.subdomain || clinic.id}`}
                                        className="block w-full text-center bg-white border border-gray-300 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        View Profile
                                    </Link>
                                </div>
                            </div>
                        ))}

                        {clinics?.data?.length === 0 && (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-500 text-lg">No clinics found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DirectoryPage;
