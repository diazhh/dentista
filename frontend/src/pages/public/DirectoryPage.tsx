import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicAPI } from '../../services/api';
import { Search, MapPin, Stethoscope } from 'lucide-react';

/** Helper: format MedicalSpecialty enum value to readable label */
const formatSpecialty = (value: string) =>
    value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const DirectoryPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [filters, setFilters] = useState({
        city: searchParams.get('city') || '',
        specialty: searchParams.get('specialty') || '',
    });

    // Fetch available specialties from API
    const { data: specialtiesData } = useQuery({
        queryKey: ['public-specialties'],
        queryFn: () => publicAPI.getSpecialties(),
        staleTime: 1000 * 60 * 30, // cache for 30 minutes
    });

    const specialties: { value: string; label: string }[] = specialtiesData?.data || [];

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
        const params: Record<string, string> = {};
        if (searchTerm) params.q = searchTerm;
        if (filters.city) params.city = filters.city;
        if (filters.specialty) params.specialty = filters.specialty;
        setSearchParams(params);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-8 sm:pb-12">
            {/* Search Header */}
            <div className="bg-white shadow border-b border-gray-200 py-4 sm:py-6 md:py-8">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Find Your Provider</h1>
                    <form onSubmit={handleSearch} className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="relative sm:col-span-2">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search clinics, providers..."
                                className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div>
                            <select
                                className="block w-full pl-3 pr-10 py-2.5 sm:py-3 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base rounded-md"
                                value={filters.specialty}
                                onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                            >
                                <option value="">All Specialties</option>
                                {specialties.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2.5 sm:py-3 px-3 sm:px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-6 md:mt-8">
                {isLoading ? (
                    <div className="flex justify-center items-center h-48 sm:h-64">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {clinics?.data?.map((clinic: any) => (
                            <div key={clinic.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200">
                                <div className="p-4 sm:p-6">
                                    <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">
                                            <Link to={`/clinic/${clinic.subdomain || clinic.id}`} className="hover:text-blue-600">
                                                {clinic.name}
                                            </Link>
                                        </h3>
                                        {clinic.logo && (
                                            <img src={clinic.logo} alt={clinic.name} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover flex-shrink-0" />
                                        )}
                                    </div>

                                    <div className="flex items-center text-gray-500 mb-2">
                                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                                        <span className="text-xs sm:text-sm truncate">{clinic.address || 'Address not listed'}</span>
                                    </div>

                                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Top Providers</h4>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            {clinic.memberships?.map((m: any) => (
                                                <div key={m.user.id} className="text-xs sm:text-sm">
                                                    <span className="font-medium text-gray-900">{m.user.name}</span>
                                                    {m.user.specialties && m.user.specialties.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                                            {m.user.specialties.slice(0, 2).map((spec: string) => (
                                                                <span
                                                                    key={spec}
                                                                    className="text-gray-500 text-xs bg-blue-50 text-blue-700 px-1.5 sm:px-2 py-0.5 rounded-full"
                                                                >
                                                                    {formatSpecialty(spec)}
                                                                </span>
                                                            ))}
                                                            {m.user.specialties.length > 2 && (
                                                                <span className="text-xs text-gray-400">
                                                                    +{m.user.specialties.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
                                    <Link
                                        to={`/clinic/${clinic.subdomain || clinic.id}`}
                                        className="block w-full text-center bg-white border border-gray-300 text-gray-700 font-medium py-1.5 sm:py-2 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                                    >
                                        View Profile
                                    </Link>
                                </div>
                            </div>
                        ))}

                        {clinics?.data?.length === 0 && (
                            <div className="col-span-full text-center py-8 sm:py-12">
                                <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm sm:text-base md:text-lg">No clinics found matching your criteria.</p>
                                {filters.specialty && (
                                    <button
                                        onClick={() => setFilters({ ...filters, specialty: '' })}
                                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        Clear specialty filter
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DirectoryPage;
