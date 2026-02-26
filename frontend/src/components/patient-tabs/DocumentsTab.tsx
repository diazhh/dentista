import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Download, Eye, Calendar, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';

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

const PAGE_SIZE = 10;

export default function PatientDocumentsTab({ patientId }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [selectedType]);

  useEffect(() => {
    fetchDocuments();
  }, [patientId, page, selectedType]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { patientId, page, pageSize: PAGE_SIZE };
      if (selectedType !== 'all') {
        params.type = selectedType;
      }
      const response = await api.get('/documents', { params });
      const result = response.data;
      if (result.data) {
        setDocuments(result.data);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } else {
        setDocuments(result);
        setTotalPages(1);
        setTotal(result.length);
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

  if (loading && documents.length === 0) {
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
        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className="text-sm text-muted-foreground">{total} documentos</span>
          )}
          <Button>Subir Documento</Button>
        </div>
      </div>

      {/* Document Type Filter */}
      <div className="flex flex-wrap gap-2">
        {documentTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedType === type.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            {selectedType === 'all'
              ? 'No hay documentos registrados'
              : `No hay documentos de tipo ${getTypeLabel(selectedType)}`
            }
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {documents.map((doc) => (
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
                            {doc.fileType?.toUpperCase()}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
