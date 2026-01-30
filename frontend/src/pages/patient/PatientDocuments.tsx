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
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Documentos</h1>
                <p className="text-gray-500">Radiografías, recetas y otros archivos compartidos.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {!documents?.length ? (
                    <div className="p-8 text-center bg-gray-50">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No hay documentos</h3>
                        <p className="text-gray-500">Tu dentista aún no ha compartido documentos contigo.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
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
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(doc.createdAt).toLocaleDateString()}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <a
                                    href={`${import.meta.env.VITE_API_URL}/documents/${doc.id}/download`} // Assuming endpoint exists or handled via frontend API wrapper if complex auth needed
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
                )}
            </div>
        </div>
    );
}
