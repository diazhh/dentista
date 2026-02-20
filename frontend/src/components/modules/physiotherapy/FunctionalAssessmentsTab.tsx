import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface FunctionalAssessment {
  id: string;
  assessmentType: string;
  painScale: number;
  functionalScore: number | null;
  notes: string | null;
  rangeOfMotion: any;
  goals: any;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  INITIAL: 'bg-blue-100 text-blue-800',
  PROGRESS: 'bg-yellow-100 text-yellow-800',
  DISCHARGE: 'bg-green-100 text-green-800',
};

const TYPE_LABELS: Record<string, string> = {
  INITIAL: 'Inicial',
  PROGRESS: 'Progreso',
  DISCHARGE: 'Alta',
};

function painColor(scale: number): string {
  if (scale <= 3) return 'bg-green-500';
  if (scale <= 6) return 'bg-yellow-500';
  return 'bg-red-500';
}

interface Props {
  patientId: string;
}

export default function FunctionalAssessmentsTab({ patientId }: Props) {
  const [items, setItems] = useState<FunctionalAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FunctionalAssessment | null>(null);
  const [formData, setFormData] = useState({
    assessmentType: 'INITIAL',
    painScale: 0,
    functionalScore: '',
    notes: '',
    rangeOfMotion: '',
    goals: '',
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/modules/physiotherapy/functional-assessments', { params: { patientId } });
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  const resetForm = () => {
    setFormData({ assessmentType: 'INITIAL', painScale: 0, functionalScore: '', notes: '', rangeOfMotion: '', goals: '' });
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (item: FunctionalAssessment) => {
    setEditing(item);
    setFormData({
      assessmentType: item.assessmentType,
      painScale: item.painScale,
      functionalScore: item.functionalScore?.toString() || '',
      notes: item.notes || '',
      rangeOfMotion: item.rangeOfMotion ? JSON.stringify(item.rangeOfMotion, null, 2) : '',
      goals: item.goals ? JSON.stringify(item.goals, null, 2) : '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      const payload: any = {
        assessmentType: formData.assessmentType,
        painScale: formData.painScale,
        functionalScore: formData.functionalScore ? Number(formData.functionalScore) : undefined,
        notes: formData.notes || undefined,
      };
      try { if (formData.rangeOfMotion) payload.rangeOfMotion = JSON.parse(formData.rangeOfMotion); } catch { /* ignore */ }
      try { if (formData.goals) payload.goals = JSON.parse(formData.goals); } catch { /* ignore */ }

      if (editing) {
        await api.patch(`/modules/physiotherapy/functional-assessments/${editing.id}`, payload);
      } else {
        await api.post('/modules/physiotherapy/functional-assessments', { ...payload, patientId });
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta evaluacion?')) return;
    try {
      await api.delete(`/modules/physiotherapy/functional-assessments/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-gray-500">Cargando evaluaciones...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Evaluaciones Funcionales</h3>
        <Button onClick={openCreate}>+ Nueva Evaluacion</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{editing ? 'Editar Evaluacion' : 'Nueva Evaluacion Funcional'}</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evaluacion</label>
                <select value={formData.assessmentType} onChange={e => setFormData(p => ({ ...p, assessmentType: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="INITIAL">Inicial</option>
                  <option value="PROGRESS">Progreso</option>
                  <option value="DISCHARGE">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Escala de Dolor (0-10): {formData.painScale}</label>
                <input type="range" min={0} max={10} value={formData.painScale} onChange={e => setFormData(p => ({ ...p, painScale: Number(e.target.value) }))} className="w-full" />
                <div className="flex justify-between text-xs text-gray-400"><span>0 - Sin dolor</span><span>10 - Maximo</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Puntaje Funcional</label>
                <input type="number" value={formData.functionalScore} onChange={e => setFormData(p => ({ ...p, functionalScore: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rango de Movimiento (JSON)</label>
                <textarea value={formData.rangeOfMotion} onChange={e => setFormData(p => ({ ...p, rangeOfMotion: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono" placeholder='{"hombro": "90°", "codo": "120°"}' />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivos (JSON)</label>
                <textarea value={formData.goals} onChange={e => setFormData(p => ({ ...p, goals: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono" placeholder='["Mejorar flexion", "Reducir dolor"]' />
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
        <Card>
          <CardContent className="p-6 text-center py-8">
            <p className="text-gray-500">Sin evaluaciones funcionales registradas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={TYPE_COLORS[item.assessmentType]}>{TYPE_LABELS[item.assessmentType] || item.assessmentType}</Badge>
                    <span className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => openEdit(item)} className="text-sm h-8">Editar</Button>
                    <Button variant="outline" onClick={() => handleDelete(item.id)} className="text-sm h-8 text-red-600">Eliminar</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Escala de Dolor</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div className={`h-3 rounded-full ${painColor(item.painScale)}`} style={{ width: `${item.painScale * 10}%` }} />
                      </div>
                      <span className="text-sm font-semibold">{item.painScale}/10</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Puntaje Funcional</p>
                    <p className="text-lg font-semibold">{item.functionalScore ?? '-'}</p>
                  </div>
                </div>
                {item.notes && <p className="text-sm text-gray-600 mt-3">{item.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
