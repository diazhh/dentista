import { useQuery } from '@tanstack/react-query';
import { patientPortalAPI } from '../../services/api';
import { FileText, Download, Calendar } from 'lucide-react';

export default function PatientDocuments() {
    const { data: documents, isLoading } = useQuery({
        queryKey: ['patientDocuments'],
        queryFn: patientPortalAPI.getDocuments,
    });

    if (isLoading) {
        return <div className="flex justify-center p-8">Cargando documentos...</div>;
    }

    return (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Mis Documentos</h1>
                <p className="text-sm sm:text-base text-gray-500">Radiografias, recetas y otros archivos compartidos.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {!documents?.length ? (
                    <div className="p-6 sm:p-8 text-center bg-gray-50">
                        <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">No hay documentos</h3>
                        <p className="text-sm sm:text-base text-gray-500">Tu dentista aun no ha compartido documentos contigo.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop View */}
                        <div className="hidden md:block divide-y divide-gray-100">
                            {documents.map((doc: any) => (
                                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{doc.title}</h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                                <span className="capitalize">{doc.type.toLowerCase().replace('_', ' ')}</span>
                                                <span>-</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <a
                                        href={`${import.meta.env.VITE_API_URL}/documents/${doc.id}/download`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Descargar"
                                    >
                                        <Download className="w-5 h-5" />
                                    </a>
                                </div>
                            ))}
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {documents.map((doc: any) => (
                                <div key={doc.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate">{doc.title}</h3>
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-500 mt-1">
                                                <span className="capitalize">{doc.type.toLowerCase().replace('_', ' ')}</span>
                                                <span className="hidden sm:inline">-</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <a
                                            href={`${import.meta.env.VITE_API_URL}/documents/${doc.id}/download`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                                            title="Descargar"
                                        >
                                            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
