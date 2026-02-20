import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface SkinLesion {
  id: string;
  bodyLocation: string;
  locationDetails: string | null;
  lesionType: string;
  color: string | null;
  shape: string | null;
  borders: string | null;
  texture: string | null;
  symptoms: string[];
  diagnosis: string | null;
  differentialDiagnosis: string[];
  biopsyRequired: boolean;
  biopsyDate: string | null;
  biopsyResult: string | null;
  status: string;
  followUpDate: string | null;
  notes: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  MONITORING: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-blue-100 text-blue-800',
  REFERRED: 'bg-purple-100 text-purple-800',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  MONITORING: 'Monitoreo',
  RESOLVED: 'Resuelto',
  REFERRED: 'Referido',
};

const LESION_TYPES = ['MACULE', 'PAPULE', 'NODULE', 'VESICLE', 'PUSTULE', 'PLAQUE', 'PATCH', 'ULCER', 'OTHER'];

const LESION_LABELS: Record<string, string> = {
  MACULE: 'Macula', PAPULE: 'Papula', NODULE: 'Nodulo', VESICLE: 'Vesicula',
  PUSTULE: 'Pustula', PLAQUE: 'Placa', PATCH: 'Parche', ULCER: 'Ulcera', OTHER: 'Otro',
};

interface Props {
  patientId: string;
}

export default function SkinLesionsTab({ patientId }: Props) {
  const [items, setItems] = useState<SkinLesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SkinLesion | null>(null);
  const [formData, setFormData] = useState({
    bodyLocation: '', locationDetails: '', lesionType: 'MACULE', color: '', shape: '', borders: '', texture: '',
    symptoms: '', diagnosis: '', differentialDiagnosis: '', biopsyRequired: false, biopsyDate: '', biopsyResult: '',
    status: 'ACTIVE', followUpDate: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/modules/dermatology/skin-lesions', { params: { patientId } });
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  const resetForm = () => {
    setFormData({ bodyLocation: '', locationDetails: '', lesionType: 'MACULE', color: '', shape: '', borders: '', texture: '', symptoms: '', diagnosis: '', differentialDiagnosis: '', biopsyRequired: false, biopsyDate: '', biopsyResult: '', status: 'ACTIVE', followUpDate: '', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (item: SkinLesion) => {
    setEditing(item);
    setFormData({
      bodyLocation: item.bodyLocation, locationDetails: item.locationDetails || '', lesionType: item.lesionType,
      color: item.color || '', shape: item.shape || '', borders: item.borders || '', texture: item.texture || '',
      symptoms: item.symptoms?.join(', ') || '', diagnosis: item.diagnosis || '',
      differentialDiagnosis: item.differentialDiagnosis?.join(', ') || '',
      biopsyRequired: item.biopsyRequired, biopsyDate: item.biopsyDate ? item.biopsyDate.substring(0, 10) : '',
      biopsyResult: item.biopsyResult || '', status: item.status,
      followUpDate: item.followUpDate ? item.followUpDate.substring(0, 10) : '', notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        bodyLocation: formData.bodyLocation, locationDetails: formData.locationDetails || undefined,
        lesionType: formData.lesionType, color: formData.color || undefined, shape: formData.shape || undefined,
        borders: formData.borders || undefined, texture: formData.texture || undefined,
        symptoms: formData.symptoms ? formData.symptoms.split(',').map(s => s.trim()).filter(Boolean) : [],
        diagnosis: formData.diagnosis || undefined,
        differentialDiagnosis: formData.differentialDiagnosis ? formData.differentialDiagnosis.split(',').map(s => s.trim()).filter(Boolean) : [],
        biopsyRequired: formData.biopsyRequired, biopsyDate: formData.biopsyDate || undefined,
        biopsyResult: formData.biopsyResult || undefined, status: formData.status,
        followUpDate: formData.followUpDate || undefined, notes: formData.notes || undefined,
      };
      if (editing) {
        await api.patch(`/modules/dermatology/skin-lesions/${editing.id}`, payload);
      } else {
        await api.post('/modules/dermatology/skin-lesions', { ...payload, patientId });
      }
      resetForm();
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta lesion?')) return;
    try { await api.delete(`/modules/dermatology/skin-lesions/${id}`); fetchData(); } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <Card><CardContent className="p-6"><div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div><span className="text-gray-500">Cargando lesiones...</span></div></CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Lesiones Cutaneas</h3>
        <Button onClick={openCreate}>+ Nueva Lesion</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{editing ? 'Editar Lesion' : 'Nueva Lesion Cutanea'}</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicacion Corporal</label>
                  <input type="text" value={formData.bodyLocation} onChange={e => setFormData(p => ({ ...p, bodyLocation: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Ej: Brazo derecho" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detalles Ubicacion</label>
                  <input type="text" value={formData.locationDetails} onChange={e => setFormData(p => ({ ...p, locationDetails: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Lesion</label>
                  <select value={formData.lesionType} onChange={e => setFormData(p => ({ ...p, lesionType: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    {LESION_TYPES.map(t => <option key={t} value={t}>{LESION_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="ACTIVE">Activo</option>
                    <option value="MONITORING">Monitoreo</option>
                    <option value="RESOLVED">Resuelto</option>
                    <option value="REFERRED">Referido</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Color</label><input type="text" value={formData.color} onChange={e => setFormData(p => ({ ...p, color: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Forma</label><input type="text" value={formData.shape} onChange={e => setFormData(p => ({ ...p, shape: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Bordes</label><input type="text" value={formData.borders} onChange={e => setFormData(p => ({ ...p, borders: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Textura</label><input type="text" value={formData.texture} onChange={e => setFormData(p => ({ ...p, texture: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sintomas (separados por coma)</label>
                <input type="text" value={formData.symptoms} onChange={e => setFormData(p => ({ ...p, symptoms: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Prurito, ardor, dolor" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Diagnostico</label><input type="text" value={formData.diagnosis} onChange={e => setFormData(p => ({ ...p, diagnosis: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Diagnosticos Diferenciales</label><input type="text" value={formData.differentialDiagnosis} onChange={e => setFormData(p => ({ ...p, differentialDiagnosis: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Separados por coma" /></div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.biopsyRequired} onChange={e => setFormData(p => ({ ...p, biopsyRequired: e.target.checked }))} className="rounded border-gray-300" />
                  Biopsia Requerida
                </label>
              </div>
              {formData.biopsyRequired && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Biopsia</label><input type="date" value={formData.biopsyDate} onChange={e => setFormData(p => ({ ...p, biopsyDate: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Resultado Biopsia</label><input type="text" value={formData.biopsyResult} onChange={e => setFormData(p => ({ ...p, biopsyResult: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Seguimiento</label>
                <input type="date" value={formData.followUpDate} onChange={e => setFormData(p => ({ ...p, followUpDate: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={handleSubmit}>{editing ? 'Guardar' : 'Crear'}</Button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="p-6 text-center py-8"><p className="text-gray-500">Sin lesiones cutaneas registradas.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{item.bodyLocation}</CardTitle>
                    <Badge className="bg-gray-100 text-gray-800">{LESION_LABELS[item.lesionType] || item.lesionType}</Badge>
                    <Badge className={STATUS_COLORS[item.status]}>{STATUS_LABELS[item.status] || item.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => openEdit(item)} className="text-sm h-8">Editar</Button>
                    <Button variant="outline" onClick={() => handleDelete(item.id)} className="text-sm h-8 text-red-600">Eliminar</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {item.diagnosis && <div><span className="text-gray-500">Diagnostico:</span> <span className="font-medium">{item.diagnosis}</span></div>}
                  {item.biopsyRequired && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Biopsia:</span>
                      {item.biopsyResult ? (
                        <span className="font-medium text-green-700">{item.biopsyResult}</span>
                      ) : (
                        <span className="text-yellow-600 font-medium">Pendiente</span>
                      )}
                    </div>
                  )}
                  {item.followUpDate && <div><span className="text-gray-500">Seguimiento:</span> <span className="font-medium">{new Date(item.followUpDate).toLocaleDateString()}</span></div>}
                  <div><span className="text-gray-500">Fecha:</span> <span>{new Date(item.createdAt).toLocaleDateString()}</span></div>
                </div>
                {item.symptoms && item.symptoms.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {item.symptoms.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                  </div>
                )}
                {item.notes && <p className="text-sm text-gray-600 mt-2">{item.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
