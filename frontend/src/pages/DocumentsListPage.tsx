import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Plus, Eye, Filter, Download, Trash2, Upload, X } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Document {
  id: string;
  type: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  tags: string[];
  createdAt: string;
  patient?: {
    firstName: string;
    lastName: string;
    documentId: string;
  };
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  documentId: string;
}

export default function DocumentsListPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [uploadData, setUploadData] = useState({
    patientId: '',
    type: 'OTHER',
    title: '',
    description: '',
    tags: '',
    file: null as File | null,
  });

  useEffect(() => {
    fetchDocuments();
    fetchPatients();
  }, [typeFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      const response = await axios.get(`http://localhost:3000/api/documents?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/patients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) {
      alert('Por favor seleccione un archivo');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('patientId', uploadData.patientId);
      formData.append('type', uploadData.type);
      formData.append('title', uploadData.title);
      if (uploadData.description) {
        formData.append('description', uploadData.description);
      }
      if (uploadData.tags) {
        const tagsArray = uploadData.tags.split(',').map(t => t.trim());
        formData.append('tags', JSON.stringify(tagsArray));
      }

      await axios.post('http://localhost:3000/api/documents/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setShowUploadModal(false);
      setUploadData({
        patientId: '',
        type: 'OTHER',
        title: '',
        description: '',
        tags: '',
        file: null,
      });
      fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      alert(error.response?.data?.message || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/documents/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error al descargar documento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este documento?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar documento');
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      XRAY: 'bg-purple-100 text-purple-800',
      PHOTO: 'bg-blue-100 text-blue-800',
      CONSENT_FORM: 'bg-green-100 text-green-800',
      MEDICAL_RECORD: 'bg-red-100 text-red-800',
      PRESCRIPTION: 'bg-amber-100 text-amber-800',
      INVOICE: 'bg-indigo-100 text-indigo-800',
      INSURANCE_CLAIM: 'bg-pink-100 text-pink-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };

    const labels: Record<string, string> = {
      XRAY: 'Radiografía',
      PHOTO: 'Foto',
      CONSENT_FORM: 'Consentimiento',
      MEDICAL_RECORD: 'Historia Clínica',
      PRESCRIPTION: 'Receta',
      INVOICE: 'Factura',
      INSURANCE_CLAIM: 'Reclamo Seguro',
      OTHER: 'Otro',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
        {labels[type]}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      searchTerm === '' ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.patient?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.patient?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.patient?.documentId.includes(searchTerm);

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Documentos</h1>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Subir Documento
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título, archivo o paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los tipos</option>
                <option value="XRAY">Radiografía</option>
                <option value="PHOTO">Foto</option>
                <option value="CONSENT_FORM">Consentimiento</option>
                <option value="MEDICAL_RECORD">Historia Clínica</option>
                <option value="PRESCRIPTION">Receta</option>
                <option value="INVOICE">Factura</option>
                <option value="INSURANCE_CLAIM">Reclamo Seguro</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No se encontraron documentos</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-blue-600 hover:underline"
            >
              Subir primer documento
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tamaño
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                        {doc.description && (
                          <div className="text-sm text-gray-500">{doc.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {doc.patient?.firstName} {doc.patient?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{doc.patient?.documentId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(doc.type)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{doc.fileName}</div>
                        <div className="text-xs text-gray-500">{doc.mimeType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(doc.createdAt), 'dd MMM yyyy', { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(doc.id, doc.fileName)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Subir Documento</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paciente *
                  </label>
                  <select
                    value={uploadData.patientId}
                    onChange={(e) => setUploadData({ ...uploadData, patientId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccione un paciente</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} - {patient.documentId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento *
                  </label>
                  <select
                    value={uploadData.type}
                    onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="XRAY">Radiografía</option>
                    <option value="PHOTO">Foto</option>
                    <option value="CONSENT_FORM">Consentimiento</option>
                    <option value="MEDICAL_RECORD">Historia Clínica</option>
                    <option value="PRESCRIPTION">Receta</option>
                    <option value="INVOICE">Factura</option>
                    <option value="INSURANCE_CLAIM">Reclamo Seguro</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    required
                    placeholder="Ej: Radiografía panorámica"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    rows={3}
                    placeholder="Descripción adicional del documento..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etiquetas (separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={uploadData.tags}
                    onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                    placeholder="Ej: urgente, seguimiento, control"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo * (Máx. 10MB)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {uploadData.file && (
                    <p className="text-sm text-gray-500 mt-1">
                      {uploadData.file.name} ({formatFileSize(uploadData.file.size)})
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    <Upload className="w-5 h-5" />
                    {uploading ? 'Subiendo...' : 'Subir Documento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
