import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface EyeExam {
  id: string;
  examType: string;
  visualAcuityRight: string | null;
  visualAcuityLeft: string | null;
  intraocularPressureRight: number | null;
  intraocularPressureLeft: number | null;
  pupilResponse: string | null;
  colorVision: string | null;
  peripheralVision: string | null;
  diagnosis: string | null;
  notes: string | null;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  COMPREHENSIVE: 'bg-blue-100 text-blue-800',
  FOLLOW_UP: 'bg-yellow-100 text-yellow-800',
  EMERGENCY: 'bg-red-100 text-red-800',
};

const TYPE_LABELS: Record<string, string> = {
  COMPREHENSIVE: 'Completo',
  FOLLOW_UP: 'Seguimiento',
  EMERGENCY: 'Emergencia',
};

interface Props {
  patientId: string;
}

export default function EyeExamsTab({ patientId }: Props) {
  const [items, setItems] = useState<EyeExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EyeExam | null>(null);
  const [formData, setFormData] = useState({
    examType: 'COMPREHENSIVE', visualAcuityRight: '', visualAcuityLeft: '',
    intraocularPressureRight: '', intraocularPressureLeft: '',
    pupilResponse: '', colorVision: '', peripheralVision: '', diagnosis: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/modules/ophthalmology/eye-exams', { params: { patientId } });
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  const resetForm = () => {
    setFormData({ examType: 'COMPREHENSIVE', visualAcuityRight: '', visualAcuityLeft: '', intraocularPressureRight: '', intraocularPressureLeft: '', pupilResponse: '', colorVision: '', peripheralVision: '', diagnosis: '', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (item: EyeExam) => {
    setEditing(item);
    setFormData({
      examType: item.examType, visualAcuityRight: item.visualAcuityRight || '', visualAcuityLeft: item.visualAcuityLeft || '',
      intraocularPressureRight: item.intraocularPressureRight?.toString() || '', intraocularPressureLeft: item.intraocularPressureLeft?.toString() || '',
      pupilResponse: item.pupilResponse || '', colorVision: item.colorVision || '', peripheralVision: item.peripheralVision || '',
      diagnosis: item.diagnosis || '', notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        examType: formData.examType,
        visualAcuityRight: formData.visualAcuityRight || undefined,
        visualAcuityLeft: formData.visualAcuityLeft || undefined,
        intraocularPressureRight: formData.intraocularPressureRight ? Number(formData.intraocularPressureRight) : undefined,
        intraocularPressureLeft: formData.intraocularPressureLeft ? Number(formData.intraocularPressureLeft) : undefined,
        pupilResponse: formData.pupilResponse || undefined,
        colorVision: formData.colorVision || undefined,
        peripheralVision: formData.peripheralVision || undefined,
        diagnosis: formData.diagnosis || undefined,
        notes: formData.notes || undefined,
      };
      if (editing) {
        await api.patch(`/modules/ophthalmology/eye-exams/${editing.id}`, payload);
      } else {
        await api.post('/modules/ophthalmology/eye-exams', { ...payload, patientId });
      }
      resetForm();
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este examen?')) return;
    try { await api.delete(`/modules/ophthalmology/eye-exams/${id}`); fetchData(); } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <Card><CardContent className="p-6"><div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div><span className="text-gray-500">Cargando examenes oculares...</span></div></CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Examenes Oculares</h3>
        <Button onClick={openCreate}>+ Nuevo Examen</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{editing ? 'Editar Examen' : 'Nuevo Examen Ocular'}</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Examen</label>
                <select value={formData.examType} onChange={e => setFormData(p => ({ ...p, examType: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="COMPREHENSIVE">Completo</option>
                  <option value="FOLLOW_UP">Seguimiento</option>
                  <option value="EMERGENCY">Emergencia</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Agudeza Visual OD</label><input type="text" value={formData.visualAcuityRight} onChange={e => setFormData(p => ({ ...p, visualAcuityRight: e.target.value }))} placeholder="20/20" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Agudeza Visual OS</label><input type="text" value={formData.visualAcuityLeft} onChange={e => setFormData(p => ({ ...p, visualAcuityLeft: e.target.value }))} placeholder="20/20" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">PIO OD (mmHg)</label><input type="number" value={formData.intraocularPressureRight} onChange={e => setFormData(p => ({ ...p, intraocularPressureRight: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">PIO OS (mmHg)</label><input type="number" value={formData.intraocularPressureLeft} onChange={e => setFormData(p => ({ ...p, intraocularPressureLeft: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Resp. Pupilar</label><input type="text" value={formData.pupilResponse} onChange={e => setFormData(p => ({ ...p, pupilResponse: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Vision Color</label><input type="text" value={formData.colorVision} onChange={e => setFormData(p => ({ ...p, colorVision: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Vision Periferica</label><input type="text" value={formData.peripheralVision} onChange={e => setFormData(p => ({ ...p, peripheralVision: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Diagnostico</label><input type="text" value={formData.diagnosis} onChange={e => setFormData(p => ({ ...p, diagnosis: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notas</label><textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={handleSubmit}>{editing ? 'Guardar' : 'Crear'}</Button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="p-6 text-center py-8"><p className="text-gray-500">Sin examenes oculares registrados.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={TYPE_COLORS[item.examType]}>{TYPE_LABELS[item.examType] || item.examType}</Badge>
                    <span className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => openEdit(item)} className="text-sm h-8">Editar</Button>
                    <Button variant="outline" onClick={() => handleDelete(item.id)} className="text-sm h-8 text-red-600">Eliminar</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">OD (Ojo Derecho)</p>
                    <p>AV: <span className="font-semibold">{item.visualAcuityRight || '-'}</span></p>
                    <p>PIO: <span className="font-semibold">{item.intraocularPressureRight != null ? `${item.intraocularPressureRight} mmHg` : '-'}</span></p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">OS (Ojo Izquierdo)</p>
                    <p>AV: <span className="font-semibold">{item.visualAcuityLeft || '-'}</span></p>
                    <p>PIO: <span className="font-semibold">{item.intraocularPressureLeft != null ? `${item.intraocularPressureLeft} mmHg` : '-'}</span></p>
                  </div>
                </div>
                {item.diagnosis && <p className="text-sm mt-3"><span className="text-gray-500">Diagnostico:</span> <span className="font-medium">{item.diagnosis}</span></p>}
                {item.notes && <p className="text-sm text-gray-600 mt-2">{item.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
