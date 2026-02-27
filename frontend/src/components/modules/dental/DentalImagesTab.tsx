import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Image, Camera, Plus, Filter, Trash2, Eye } from 'lucide-react';

const IMAGE_TYPES = [
  { value: 'PERIAPICAL', label: 'Periapical', color: 'bg-blue-100 text-blue-800' },
  { value: 'BITEWING', label: 'Bitewing', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'PANORAMIC', label: 'Panoramica', color: 'bg-purple-100 text-purple-800' },
  { value: 'CEPHALOMETRIC', label: 'Cefalometrica', color: 'bg-pink-100 text-pink-800' },
  { value: 'CBCT', label: 'CBCT', color: 'bg-red-100 text-red-800' },
  { value: 'INTRAORAL_PHOTO', label: 'Foto Intraoral', color: 'bg-amber-100 text-amber-800' },
  { value: 'EXTRAORAL_PHOTO', label: 'Foto Extraoral', color: 'bg-teal-100 text-teal-800' },
];

const TYPE_COLOR: Record<string, string> = Object.fromEntries(IMAGE_TYPES.map((t) => [t.value, t.color]));
const TYPE_LABEL: Record<string, string> = Object.fromEntries(IMAGE_TYPES.map((t) => [t.value, t.label]));

const REGIONS = [
  'superior-derecho', 'superior-izquierdo', 'inferior-derecho',
  'inferior-izquierdo', 'boca-completa', 'anterior', 'posterior',
];

interface DentalImageRecord {
  id: string; imageType: string; toothNumber: number | null; region: string | null;
  fileName: string; filePath: string; thumbnailPath: string | null;
  findings: string | null; notes: string | null; takenAt: string; createdAt: string;
}

const Spinner = () => (
  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const CloseBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="text-gray-400 hover:text-gray-600">
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);

const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

export default function DentalImagesTab({ patientId }: { patientId: string }) {
  const [images, setImages] = useState<DentalImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<DentalImageRecord | null>(null);

  const [formType, setFormType] = useState('PERIAPICAL');
  const [formTooth, setFormTooth] = useState('');
  const [formRegion, setFormRegion] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formFindings, setFormFindings] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const fetchImages = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filterType) params.imageType = filterType;
      const res = await api.get(`/modules/dental/imaging/patient/${patientId}`, { params });
      setImages(res.data);
    } catch (err) { console.error('Error fetching dental images:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchImages(); }, [patientId, filterType]);

  const openForm = () => {
    setFormType('PERIAPICAL'); setFormTooth(''); setFormRegion('');
    setFormFileName(''); setFormFindings(''); setFormNotes('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formFileName.trim()) return;
    try {
      setSubmitting(true);
      await api.post('/modules/dental/imaging', {
        patientId, imageType: formType,
        toothNumber: formTooth ? parseInt(formTooth, 10) : undefined,
        region: formRegion || undefined,
        fileName: formFileName, filePath: `/uploads/dental/${formFileName}`,
        findings: formFindings || undefined, notes: formNotes || undefined,
      });
      setShowForm(false);
      fetchImages();
    } catch (err) { console.error('Error creating dental image:', err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este registro de imagen?')) return;
    try {
      setDeleting(id);
      await api.delete(`/modules/dental/imaging/${id}`);
      fetchImages();
    } catch (err) { console.error('Error deleting dental image:', err); }
    finally { setDeleting(null); }
  };

  if (loading) {
    return (
      <Card><CardContent className="p-6">
        <div className="flex items-center justify-center py-8">
          <Spinner /><span className="text-gray-500">Cargando imagenes dentales...</span>
        </div>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" /> Imagenes Dentales
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Todos los tipos</option>
              {IMAGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Button onClick={openForm}><Plus className="w-4 h-4 mr-1" /> Nueva Imagen</Button>
        </div>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Registrar Imagen Dental</h2>
              <CloseBtn onClick={() => setShowForm(false)} />
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de imagen *</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} className={inputCls}>
                  {IMAGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numero de diente</label>
                  <input type="number" value={formTooth} onChange={(e) => setFormTooth(e.target.value)}
                    className={inputCls} placeholder="Ej: 14" min={11} max={48} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select value={formRegion} onChange={(e) => setFormRegion(e.target.value)} className={inputCls}>
                    <option value="">Sin especificar</option>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de archivo *</label>
                <input type="text" value={formFileName} onChange={(e) => setFormFileName(e.target.value)}
                  className={inputCls} placeholder="Ej: panoramica_2026-02.jpg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hallazgos</label>
                <textarea value={formFindings} onChange={(e) => setFormFindings(e.target.value)}
                  rows={2} className={inputCls} placeholder="Hallazgos radiograficos..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                  rows={2} className={inputCls} placeholder="Notas adicionales..." />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting || !formFileName.trim()}>
                {submitting && <Spinner />} Guardar Imagen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Detalle de Imagen</h2>
              <CloseBtn onClick={() => setViewImage(null)} />
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-center bg-gray-100 rounded-lg h-40">
                <Image className="w-16 h-16 text-gray-300" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 block">Tipo</span>
                  <Badge className={TYPE_COLOR[viewImage.imageType] || 'bg-gray-100 text-gray-800'}>
                    {TYPE_LABEL[viewImage.imageType] || viewImage.imageType}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500 block">Fecha</span>
                  <span className="font-medium">{format(new Date(viewImage.takenAt), "d 'de' MMM yyyy", { locale: es })}</span>
                </div>
                {viewImage.toothNumber && <div>
                  <span className="text-gray-500 block">Diente</span>
                  <span className="font-mono font-medium">#{viewImage.toothNumber}</span>
                </div>}
                {viewImage.region && <div>
                  <span className="text-gray-500 block">Region</span>
                  <span className="font-medium">{viewImage.region}</span>
                </div>}
              </div>
              <div>
                <span className="text-gray-500 text-sm block">Archivo</span>
                <span className="text-sm font-medium">{viewImage.fileName}</span>
              </div>
              {viewImage.findings && <div>
                <span className="text-gray-500 text-sm block">Hallazgos</span>
                <p className="text-sm">{viewImage.findings}</p>
              </div>}
              {viewImage.notes && <div>
                <span className="text-gray-500 text-sm block">Notas</span>
                <p className="text-sm">{viewImage.notes}</p>
              </div>}
            </div>
            <div className="p-6 border-t flex justify-end">
              <Button variant="outline" onClick={() => setViewImage(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery */}
      {images.length === 0 ? (
        <Card><CardContent className="p-6">
          <div className="text-center py-8">
            <Image className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">Sin imagenes dentales</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterType ? 'No hay imagenes con este filtro. Pruebe otro tipo.' : 'Registre la primera imagen dental para este paciente.'}
            </p>
          </div>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img) => (
            <Card key={img.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gray-100 h-36 flex items-center justify-center relative">
                <Image className="w-12 h-12 text-gray-300" />
                <div className="absolute top-2 left-2">
                  <Badge className={TYPE_COLOR[img.imageType] || 'bg-gray-100 text-gray-800'}>
                    {TYPE_LABEL[img.imageType] || img.imageType}
                  </Badge>
                </div>
                {img.toothNumber && (
                  <div className="absolute top-2 right-2 bg-white/90 rounded px-1.5 py-0.5 text-xs font-mono font-semibold text-gray-700">
                    #{img.toothNumber}
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{img.fileName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(img.takenAt), "d 'de' MMM yyyy, HH:mm", { locale: es })}
                    </p>
                    {img.findings && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{img.findings}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setViewImage(img)} title="Ver detalle"
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(img.id)} disabled={deleting === img.id} title="Eliminar"
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
