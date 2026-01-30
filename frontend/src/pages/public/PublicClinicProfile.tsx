import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicAPI } from '../../services/api';
import { MapPin, Phone, Star, Clock, Calendar } from 'lucide-react';

const PublicClinicProfile = () => {
    const { slug } = useParams<{ slug: string }>();

    const { data: clinicData, isLoading, error } = useQuery({
        queryKey: ['public-clinic', slug],
        queryFn: () => publicAPI.getClinicBySlug(slug!),
        enabled: !!slug,
    });

    const clinic = clinicData?.data;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !clinic) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Clinic Not Found</h2>
                    <p className="text-gray-600 mb-4">The clinic you are looking for does not exist or is currently unavailable.</p>
                    <Link to="/directory" className="text-blue-600 hover:text-blue-800 font-medium">
                        Browse other clinics
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            {/* Clinic Header / Hero */}
            <div className="relative bg-gray-900 h-64 md:h-80">
                <div className="absolute inset-0 bg-opacity-50 bg-black">
                    {/* Use clinic banner if available, else placeholder */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-gray-900 opacity-90"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-8">
                    <div className="flex items-end">
                        {clinic.logo ? (
                            <img src={clinic.logo} alt={clinic.name} className="h-24 w-24 md:h-32 md:w-32 rounded-xl border-4 border-white shadow-lg bg-white object-cover" />
                        ) : (
                            <div className="h-24 w-24 md:h-32 md:w-32 rounded-xl border-4 border-white shadow-lg bg-white flex items-center justify-center text-3xl font-bold text-blue-600">
                                {clinic.name.charAt(0)}
                            </div>
                        )}
                        <div className="ml-6 text-white pb-2">
                            <h1 className="text-3xl md:text-4xl font-bold">{clinic.name}</h1>
                            <div className="flex items-center mt-2 text-blue-200">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{clinic.city || 'Location unavailable'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Details & Dentists */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* About Section */}
                        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Clinic</h2>
                            <p className="text-gray-600 leading-relaxed">
                                {clinic.description || `Welcome to ${clinic.name}. We provide top-quality dental care with a focus on patient comfort and health. Our experienced team uses the latest technology to ensure the best results for your smile.`}
                            </p>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start">
                                    <MapPin className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Address</h4>
                                        <p className="text-gray-600">{clinic.address || 'Address not listed'}</p>
                                        <p className="text-gray-600">{clinic.city}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <Phone className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Phone</h4>
                                        <p className="text-gray-600">{clinic.phone || 'Phone not listed'}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Dentists Section */}
                        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Specialists</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {clinic.users?.map((dentist: any) => (
                                    <div key={dentist.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                                            {dentist.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{dentist.name}</h3>
                                            <p className="text-sm text-blue-600 mb-1">{dentist.specialization || 'General Dentist'}</p>
                                            {dentist.bio && <p className="text-xs text-gray-500 line-clamp-2">{dentist.bio}</p>}
                                        </div>
                                    </div>
                                ))}
                                {(!clinic.users || clinic.users.length === 0) && (
                                    <p className="text-gray-500 italic">No dentists listed currently.</p>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 sticky top-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Book an Appointment</h3>
                            <p className="text-gray-600 text-sm mb-6">Simple, fast, and secure booking process.</p>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="h-5 w-5 text-blue-500 mr-3" />
                                    <span>Available Today, {new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                                    <span>Next opening at 09:00 AM</span>
                                </div>
                            </div>

                            <Link
                                to={`/directory`} // Placeholder for booking flow
                                className="w-full block bg-blue-600 hover:bg-blue-700 text-white text-center font-bold py-3 rounded-lg transition-colors shadow-md"
                            >
                                Book Now
                            </Link>

                            <p className="text-xs text-center text-gray-400 mt-4">
                                You will be asked to sign in or create a guest account to finalize your booking.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PublicClinicProfile;
