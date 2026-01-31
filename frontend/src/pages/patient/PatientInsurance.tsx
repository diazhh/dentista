import { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Upload,
  FileImage,
  FileText,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  Calendar,
} from 'lucide-react';
import api from '../../services/api';

interface InsuranceDocument {
  id: string;
  documentType: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  insuranceProvider?: string;
  policyNumber?: string;
  groupNumber?: string;
  expirationDate?: string;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

const documentTypeConfig = {
  insurance_card_front: { label: 'Tarjeta de Seguro (Frente)', icon: CreditCard },
  insurance_card_back: { label: 'Tarjeta de Seguro (Reverso)', icon: CreditCard },
  policy_document: { label: 'Póliza de Seguro', icon: FileText },
  other: { label: 'Otro Documento', icon: FileText },
};

export default function PatientInsurance() {
  const [documents, setDocuments] = useState<InsuranceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadData, setUploadData] = useState({
    documentType: 'insurance_card_front',
    title: '',
    insuranceProvider: '',
    policyNumber: '',
    groupNumber: '',
    expirationDate: '',
    file: null as File | null,
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/portal/insurance-documents');
      setDocuments(response.data);
    } catch (err) {
      console.error('Error fetching insurance documents:', err);
      setError('Error al cargar los documentos de seguro');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de archivo no permitido. Use JPG, PNG o PDF.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 5MB.');
        return;
      }

      setUploadData(prev => ({
        ...prev,
        file,
        title: prev.title || file.name,
      }));
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!uploadData.file) {
      setError('Seleccione un archivo');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('documentType', uploadData.documentType);
      formData.append('title', uploadData.title);
      if (uploadData.insuranceProvider) formData.append('insuranceProvider', uploadData.insuranceProvider);
      if (uploadData.policyNumber) formData.append('policyNumber', uploadData.policyNumber);
      if (uploadData.groupNumber) formData.append('groupNumber', uploadData.groupNumber);
      if (uploadData.expirationDate) formData.append('expirationDate', uploadData.expirationDate);

      await api.post('/portal/insurance-documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowUploadModal(false);
      setUploadData({
        documentType: 'insurance_card_front',
        title: '',
        insuranceProvider: '',
        policyNumber: '',
        groupNumber: '',
        expirationDate: '',
        file: null,
      });
      await fetchDocuments();
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(err.response?.data?.message || 'Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      await api.delete(`/portal/insurance-documents/${documentId}`);
      setDeleteConfirm(null);
      await fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Error al eliminar el documento');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isExpired = (expirationDate?: string) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  const isExpiringSoon = (expirationDate?: string) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expDate > new Date() && expDate < thirtyDaysFromNow;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos de Seguro</h1>
          <p className="text-gray-600 mt-1">Sube y gestiona tus documentos de seguro dental</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Subir documento
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Mantén tus documentos actualizados</h3>
            <p className="text-sm text-blue-700 mt-1">
              Sube las imágenes de tu tarjeta de seguro (frente y reverso) y cualquier documento de póliza.
              Esto nos ayuda a procesar tus reclamos de seguro más rápidamente.
            </p>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No has subido documentos de seguro</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Subir primer documento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const typeConfig = documentTypeConfig[doc.documentType as keyof typeof documentTypeConfig] || documentTypeConfig.other;
            const TypeIcon = typeConfig.icon;
            const expired = isExpired(doc.expirationDate);
            const expiringSoon = isExpiringSoon(doc.expirationDate);

            return (
              <div
                key={doc.id}
                className={`bg-white rounded-xl border overflow-hidden ${
                  expired ? 'border-red-200' : expiringSoon ? 'border-yellow-200' : 'border-gray-200'
                }`}
              >
                {/* Document Preview Header */}
                <div className={`h-32 flex items-center justify-center ${
                  expired ? 'bg-red-50' : expiringSoon ? 'bg-yellow-50' : 'bg-gray-50'
                }`}>
                  {doc.mimeType.startsWith('image/') ? (
                    <FileImage className="w-16 h-16 text-gray-400" />
                  ) : (
                    <FileText className="w-16 h-16 text-gray-400" />
                  )}
                </div>

                {/* Document Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <TypeIcon className="w-4 h-4" />
                        {typeConfig.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.isVerified ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Verificado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          <Clock className="w-3 h-3" />
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Insurance Details */}
                  {doc.insuranceProvider && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium text-gray-700">{doc.insuranceProvider}</p>
                      {doc.policyNumber && (
                        <p className="text-gray-500">Póliza: {doc.policyNumber}</p>
                      )}
                      {doc.groupNumber && (
                        <p className="text-gray-500">Grupo: {doc.groupNumber}</p>
                      )}
                    </div>
                  )}

                  {/* Expiration */}
                  {doc.expirationDate && (
                    <div className={`mt-3 flex items-center gap-2 text-sm ${
                      expired ? 'text-red-600' : expiringSoon ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {expired ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <Calendar className="w-4 h-4" />
                      )}
                      <span>
                        {expired ? 'Expirado: ' : expiringSoon ? 'Expira pronto: ' : 'Expira: '}
                        {formatDate(doc.expirationDate)}
                      </span>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>Subido {formatDate(doc.createdAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setDeleteConfirm(doc.id)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Subir documento de seguro</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    {uploadData.file ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileImage className="w-8 h-8 text-blue-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{uploadData.file.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(uploadData.file.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Haz clic para seleccionar un archivo</p>
                        <p className="text-sm text-gray-400 mt-1">JPG, PNG o PDF (máx. 5MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Document Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de documento
                  </label>
                  <select
                    value={uploadData.documentType}
                    onChange={(e) => setUploadData(prev => ({ ...prev, documentType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(documentTypeConfig).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={uploadData.title}
                    onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nombre descriptivo del documento"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Insurance Provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compañía de seguro
                  </label>
                  <input
                    type="text"
                    value={uploadData.insuranceProvider}
                    onChange={(e) => setUploadData(prev => ({ ...prev, insuranceProvider: e.target.value }))}
                    placeholder="Ej: MetLife, Cigna, Delta Dental"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Policy & Group Numbers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de póliza
                    </label>
                    <input
                      type="text"
                      value={uploadData.policyNumber}
                      onChange={(e) => setUploadData(prev => ({ ...prev, policyNumber: e.target.value }))}
                      placeholder="Número de póliza"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de grupo
                    </label>
                    <input
                      type="text"
                      value={uploadData.groupNumber}
                      onChange={(e) => setUploadData(prev => ({ ...prev, groupNumber: e.target.value }))}
                      placeholder="Número de grupo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Expiration Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de expiración
                  </label>
                  <input
                    type="date"
                    value={uploadData.expirationDate}
                    onChange={(e) => setUploadData(prev => ({ ...prev, expirationDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadData.file || uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Subir documento
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Eliminar documento</h2>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
