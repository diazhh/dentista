import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalExamsAPI, patientPortalAPI, patientRegistrationAPI } from '../../services/api';
import type { MedicalExam, ExamShare, ProviderRelation } from '../../types';
import {
  FlaskConical,
  Upload,
  X,
  Eye,
  Share2,
  Trash2,
  Calendar,
  FileText,
  Tag,
  Brain,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const EXAM_TYPES = [
  { value: 'hemograma', label: 'Hemograma' },
  { value: 'radiografia', label: 'Radiografia' },
  { value: 'resonancia', label: 'Resonancia' },
  { value: 'ecografia', label: 'Ecografia' },
  { value: 'analisis_sangre', label: 'Analisis de Sangre' },
  { value: 'otro', label: 'Otro' },
];

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  hemograma: { bg: 'bg-blue-100', text: 'text-blue-700' },
  radiografia: { bg: 'bg-purple-100', text: 'text-purple-700' },
  resonancia: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  ecografia: { bg: 'bg-teal-100', text: 'text-teal-700' },
  analisis_sangre: { bg: 'bg-red-100', text: 'text-red-700' },
  otro: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

function getTypeColor(type: string) {
  return TYPE_COLORS[type] || TYPE_COLORS.otro;
}

function getTypeLabel(type: string) {
  return EXAM_TYPES.find((t) => t.value === type)?.label || type;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---- Upload Modal ----
function UploadModal({
  onClose,
  onUpload,
  isUploading,
}: {
  onClose: () => void;
  onUpload: (formData: FormData) => void;
  isUploading: boolean;
}) {
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('hemograma');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('examType', examType);
    formData.append('examDate', examDate);
    if (description) formData.append('description', description);
    if (tags) {
      const tagsArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
      tagsArray.forEach((tag) => formData.append('tags[]', tag));
    }

    onUpload(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Subir Nuevo Examen</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ej: Hemograma completo enero 2026"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Examen *</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {EXAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del Examen *</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Archivo *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition cursor-pointer">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png,.dicom"
                className="hidden"
                id="exam-file-upload"
                required
              />
              <label htmlFor="exam-file-upload" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-gray-400">({formatFileSize(file.size)})</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Haz clic para seleccionar archivo</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG o DICOM</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Notas adicionales sobre el examen..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etiquetas</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Separadas por coma: control, anual, urgente"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!file || !title || isUploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Subir Examen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Share Modal ----
function ShareModal({
  exam,
  providers,
  onClose,
  onShare,
  isSharing,
}: {
  exam: MedicalExam;
  providers: ProviderRelation[];
  onClose: () => void;
  onShare: (data: { examId: string; providerId: string; expiresAt?: string }) => void;
  isSharing: boolean;
}) {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    onShare({
      examId: exam.id,
      providerId: selectedProvider,
      expiresAt: expiresAt || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Compartir Examen</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900">{exam.title}</p>
            <p className="text-xs text-gray-500 mt-1">{getTypeLabel(exam.examType)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profesional *</label>
            {providers.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No tienes profesionales vinculados.</p>
            ) : (
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Seleccionar profesional...</option>
                {providers.map((p) => (
                  <option key={p.providerId} value={p.providerId}>
                    {p.providerName} - {p.providerSpecialties?.join(', ') || p.practiceName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de expiracion (opcional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Dejar vacio para compartir sin limite de tiempo.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedProvider || isSharing}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {isSharing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Compartiendo...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Compartir
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Main Component ----
export default function PatientExams() {
  const queryClient = useQueryClient();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [shareExam, setShareExam] = useState<MedicalExam | null>(null);
  const [activeTab, setActiveTab] = useState<'exams' | 'shares'>('exams');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Queries
  const { data: exams, isLoading: examsLoading } = useQuery<MedicalExam[]>({
    queryKey: ['patientExams'],
    queryFn: medicalExamsAPI.getAll,
  });

  const { data: examShares, isLoading: sharesLoading } = useQuery<ExamShare[]>({
    queryKey: ['patientExamShares'],
    queryFn: patientPortalAPI.getExamShares,
  });

  const { data: providers } = useQuery<ProviderRelation[]>({
    queryKey: ['patientProviders'],
    queryFn: patientRegistrationAPI.getMyProviders,
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => medicalExamsAPI.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientExams'] });
      setShowUploadModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => medicalExamsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientExams'] });
      queryClient.invalidateQueries({ queryKey: ['patientExamShares'] });
      setDeleteConfirm(null);
    },
  });

  const shareMutation = useMutation({
    mutationFn: (data: { examId: string; providerId: string; expiresAt?: string }) =>
      patientPortalAPI.shareExam(data.examId, {
        providerId: data.providerId,
        expiresAt: data.expiresAt,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientExamShares'] });
      setShareExam(null);
    },
  });

  const unshareMutation = useMutation({
    mutationFn: (shareId: string) => patientPortalAPI.unshareExam(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientExamShares'] });
    },
  });

  const isLoading = examsLoading || sharesLoading;

  if (isLoading) {
    return <div className="flex justify-center p-8">Cargando examenes...</div>;
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Mis Examenes Medicos
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Sube, organiza y comparte tus examenes con tus profesionales.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Subir Nuevo Examen
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-auto sm:inline-flex">
        <button
          onClick={() => setActiveTab('exams')}
          className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition ${
            activeTab === 'exams'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <FlaskConical className="w-4 h-4" />
            Examenes ({exams?.length || 0})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('shares')}
          className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition ${
            activeTab === 'shares'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Users className="w-4 h-4" />
            Mis Compartidos ({examShares?.filter((s) => s.isActive).length || 0})
          </span>
        </button>
      </div>

      {/* Exams Tab */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          {!exams?.length ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
              <FlaskConical className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                No tienes examenes
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mt-1">
                Sube tu primer examen medico para comenzar.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Subir Examen
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Examen
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tamano
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IA
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Etiquetas
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {exams.map((exam) => {
                      const color = getTypeColor(exam.examType);
                      return (
                        <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {exam.title}
                                </p>
                                {exam.description && (
                                  <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                    {exam.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`}
                            >
                              {getTypeLabel(exam.examType)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(exam.examDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatFileSize(exam.fileSize)}
                          </td>
                          <td className="px-4 py-3">
                            {exam.aiProcessed ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Procesado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3.5 h-3.5" />
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {exam.tags?.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                >
                                  <Tag className="w-2.5 h-2.5" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <a
                                href={`${import.meta.env.VITE_API_URL}/medical-exams/${exam.id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Ver / Descargar"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => setShareExam(exam)}
                                className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="Compartir"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              {deleteConfirm === exam.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => deleteMutation.mutate(exam.id)}
                                    disabled={deleteMutation.isPending}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Confirmar"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                                    title="Cancelar"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(exam.id)}
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {exams.map((exam) => {
                  const color = getTypeColor(exam.examType);
                  return (
                    <div
                      key={exam.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-gray-900 truncate">
                            {exam.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`}
                            >
                              {getTypeLabel(exam.examType)}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(exam.examDate).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatFileSize(exam.fileSize)}
                            </span>
                          </div>
                          {exam.description && (
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {exam.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {exam.aiProcessed ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <Brain className="w-3 h-3" />
                                IA procesado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                IA pendiente
                              </span>
                            )}
                          </div>
                          {exam.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {exam.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                >
                                  <Tag className="w-2.5 h-2.5" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <a
                          href={`${import.meta.env.VITE_API_URL}/medical-exams/${exam.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </a>
                        <button
                          onClick={() => setShareExam(exam)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Compartir
                        </button>
                        {deleteConfirm === exam.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteMutation.mutate(exam.id)}
                              disabled={deleteMutation.isPending}
                              className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(exam.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Shares Tab */}
      {activeTab === 'shares' && (
        <div className="space-y-4">
          {!examShares?.length ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                No has compartido examenes
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mt-1">
                Comparte tus examenes con tus profesionales de salud desde la pestana de examenes.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Desktop Share View */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Examen
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Compartido con
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expira
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {examShares.map((share) => {
                      const color = getTypeColor(share.examType);
                      return (
                        <tr key={share.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {share.examTitle}
                              </p>
                              <span
                                className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text} mt-0.5`}
                              >
                                {getTypeLabel(share.examType)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {share.providerName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(share.sharedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {share.expiresAt
                              ? new Date(share.expiresAt).toLocaleDateString()
                              : 'Sin limite'}
                          </td>
                          <td className="px-4 py-3">
                            {share.isActive ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                <XCircle className="w-3 h-3" />
                                Revocado
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {share.isActive && (
                              <button
                                onClick={() => unshareMutation.mutate(share.id)}
                                disabled={unshareMutation.isPending}
                                className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition"
                              >
                                Revocar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Share Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {examShares.map((share) => {
                  const color = getTypeColor(share.examType);
                  return (
                    <div key={share.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {share.examTitle}
                          </p>
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text} mt-1`}
                          >
                            {getTypeLabel(share.examType)}
                          </span>
                        </div>
                        {share.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">
                            <CheckCircle className="w-3 h-3" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                            <XCircle className="w-3 h-3" />
                            Revocado
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-gray-500">
                        <p className="flex items-center gap-1.5">
                          <Users className="w-3 h-3" />
                          {share.providerName}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          Compartido: {new Date(share.sharedAt).toLocaleDateString()}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          Expira: {share.expiresAt ? new Date(share.expiresAt).toLocaleDateString() : 'Sin limite'}
                        </p>
                      </div>
                      {share.isActive && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => unshareMutation.mutate(share.id)}
                            disabled={unshareMutation.isPending}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Revocar Acceso
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Messages */}
      {(uploadMutation.isError || deleteMutation.isError || shareMutation.isError || unshareMutation.isError) && (
        <div className="fixed bottom-4 right-4 z-40 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            Ocurrio un error. Por favor intenta de nuevo.
          </p>
        </div>
      )}

      {/* Modals */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={(formData) => uploadMutation.mutate(formData)}
          isUploading={uploadMutation.isPending}
        />
      )}

      {shareExam && (
        <ShareModal
          exam={shareExam}
          providers={providers || []}
          onClose={() => setShareExam(null)}
          onShare={(data) => shareMutation.mutate(data)}
          isSharing={shareMutation.isPending}
        />
      )}
    </div>
  );
}
