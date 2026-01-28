import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Download, Eye, Calendar, Tag } from 'lucide-react';

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: string;
  tags?: string[];
  uploadedAt: string;
  filePath: string;
}

interface Props {
  patientId: string;
}

export default function PatientDocumentsTab({ patientId }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchDocuments();
  }, [patientId]);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/documents?patientId=${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'XRAY':
        return 'bg-blue-100 text-blue-800';
      case 'PHOTO':
        return 'bg-purple-100 text-purple-800';
      case 'PRESCRIPTION':
        return 'bg-green-100 text-green-800';
      case 'CONSENT':
        return 'bg-yellow-100 text-yellow-800';
      case 'LAB':
        return 'bg-orange-100 text-orange-800';
      case 'INSURANCE':
        return 'bg-pink-100 text-pink-800';
      case 'REPORT':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      XRAY: 'Radiografía',
      PHOTO: 'Foto Clínica',
      PRESCRIPTION: 'Receta',
      CONSENT: 'Consentimiento',
      LAB: 'Laboratorio',
      INSURANCE: 'Seguro',
      REPORT: 'Reporte',
      OTHER: 'Otro',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const documentTypes = [
    { value: 'all', label: 'Todos' },
    { value: 'XRAY', label: 'Radiografías' },
    { value: 'PHOTO', label: 'Fotos' },
    { value: 'PRESCRIPTION', label: 'Recetas' },
    { value: 'CONSENT', label: 'Consentimientos' },
    { value: 'LAB', label: 'Laboratorio' },
    { value: 'INSURANCE', label: 'Seguros' },
    { value: 'REPORT', label: 'Reportes' },
    { value: 'OTHER', label: 'Otros' },
  ];

  const filteredDocuments = selectedType === 'all' 
    ? documents 
    : documents.filter(doc => doc.documentType === selectedType);

  const documentsByType = documentTypes.reduce((acc, type) => {
    if (type.value !== 'all') {
      acc[type.value] = documents.filter(doc => doc.documentType === type.value).length;
    }
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Documentos</h2>
        <Button>Subir Documento</Button>
      </div>

      {/* Document Categories Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {documentTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedType === type.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600">{type.label}</p>
              {type.value !== 'all' && (
                <p className="text-lg font-bold text-gray-900">
                  {documentsByType[type.value] || 0}
                </p>
              )}
              {type.value === 'all' && (
                <p className="text-lg font-bold text-gray-900">{documents.length}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            {selectedType === 'all' 
              ? 'No hay documentos registrados'
              : `No hay documentos de tipo ${getTypeLabel(selectedType)}`
            }
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-gray-100 rounded">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{doc.fileName}</CardTitle>
                        <Badge className={getTypeColor(doc.documentType)}>
                          {getTypeLabel(doc.documentType)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          {formatDate(doc.uploadedAt)}
                        </div>
                        <div className="flex items-center">
                          <FileText className="mr-1 h-4 w-4" />
                          {doc.fileType.toUpperCase()}
                        </div>
                        <div className="flex items-center">
                          <Download className="mr-1 h-4 w-4" />
                          {formatFileSize(doc.fileSize)}
                        </div>
                      </div>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <div className="flex gap-1 flex-wrap">
                            {doc.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
