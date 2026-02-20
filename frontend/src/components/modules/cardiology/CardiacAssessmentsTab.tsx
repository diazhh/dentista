import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface CardiacAssessment {
  id: string;
  assessmentType: string;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  heartRate: number | null;
  rhythm: string | null;
  ecgFindings: string | null;
  riskFactors: string[];
  riskScore: number | null;
  diagnosis: string | null;
  plan: string | null;
  notes: string | null;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  INITIAL: 'bg-blue-100 text-blue-800',
  FOLLOW_UP: 'bg-yellow-100 text-yellow-800',
  EMERGENCY: 'bg-red-100 text-red-800',
};

const TYPE_LABELS: Record<string, string> = {
  INITIAL: 'Inicial',
  FOLLOW_UP: 'Seguimiento',
  EMERGENCY: 'Emergencia',
};

const RHYTHM_COLORS: Record<string, string> = {
  REGULAR: 'bg-green-100 text-green-800',
  IRREGULAR: 'bg-yellow-100 text-yellow-800',
  ARRHYTHMIA: 'bg-red-100 text-red-800',
};

const RHYTHM_LABELS: Record<string, string> = {
  REGULAR: 'Regular',
  IRREGULAR: 'Irregular',
  ARRHYTHMIA: 'Arritmia',
};

const RISK_FACTOR_OPTIONS = [
  'Tabaquismo', 'Diabetes', 'Hipertension', 'Obesidad', 'Historia Familiar', 'Sedentarismo',
];

interface Props {
  patientId: string;
}

export default function CardiacAssessmentsTab({ patientId }: Props) {
  const [items, setItems] = useState<CardiacAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CardiacAssessment | null>(null);
  const [formData, setFormData] = useState({
    assessmentType: 'INITIAL',
    bloodPressureSystolic: '', bloodPressureDiastolic: '', heartRate: '',
    rhythm: 'REGULAR', ecgFindings: '', riskFactors: [] as string[],
    riskScore: '', diagnosis: '', plan: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/modules/cardiology/cardiac-assessments', { params: { patientId } });
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  const resetForm = () => {
    setFormData({ assessmentType: 'INITIAL', bloodPressureSystolic: '', bloodPressureDiastolic: '', heartRate: '', rhythm: 'REGULAR', ecgFindings: '', riskFactors: [], riskScore: '', diagnosis: '', plan: '', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (item: CardiacAssessment) => {
    setEditing(item);
    setFormData({
      assessmentType: item.assessmentType,
      bloodPressureSystolic: item.bloodPressureSystolic?.toString() || '',
      bloodPressureDiastolic: item.bloodPressureDiastolic?.toString() || '',
      heartRate: item.heartRate?.toString() || '',
      rhythm: item.rhythm || 'REGULAR',
      ecgFindings: item.ecgFindings || '',
      riskFactors: item.riskFactors || [],
      riskScore: item.riskScore?.toString() || '',
      diagnosis: item.diagnosis || '',
      plan: item.plan || '',
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const toggleRiskFactor = (factor: string) => {
    setFormData(prev => ({
      ...prev,
      riskFactors: prev.riskFactors.includes(factor)
        ? prev.riskFactors.filter(f => f !== factor)
        : [...prev.riskFactors, factor],
    }));
  };

  const handleSubmit = async () => {
    try {
      const toNum = (v: string) => v ? Number(v) : undefined;
      const payload = {
        assessmentType: formData.assessmentType,
        bloodPressureSystolic: toNum(formData.bloodPressureSystolic),
        bloodPressureDiastolic: toNum(formData.bloodPressureDiastolic),
        heartRate: toNum(formData.heartRate),
        rhythm: formData.rhythm,
        ecgFindings: formData.ecgFindings || undefined,
        riskFactors: formData.riskFactors,
        riskScore: toNum(formData.riskScore),
        diagnosis: formData.diagnosis || undefined,
        plan: formData.plan || undefined,
        notes: formData.notes || undefined,
      };
      if (editing) {
        await api.patch(`/modules/cardiology/cardiac-assessments/${editing.id}`, payload);
      } else {
        await api.post('/modules/cardiology/cardiac-assessments', { ...payload, patientId });
      }
      resetForm();
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta evaluacion?')) return;
    try { await api.delete(`/modules/cardiology/cardiac-assessments/${id}`); fetchData(); } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <Card><CardContent className="p-6"><div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div><span className="text-gray-500">Cargando evaluaciones cardiacas...</span></div></CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Evaluaciones Cardiacas</h3>
        <Button onClick={openCreate}>+ Nueva Evaluacion</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{editing ? 'Editar Evaluacion' : 'Nueva Evaluacion Cardiaca'}</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={formData.assessmentType} onChange={e => setFormData(p => ({ ...p, assessmentType: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="INITIAL">Inicial</option>
                  <option value="FOLLOW_UP">Seguimiento</option>
                  <option value="EMERGENCY">Emergencia</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">PA Sistolica</label><input type="number" value={formData.bloodPressureSystolic} onChange={e => setFormData(p => ({ ...p, bloodPressureSystolic: e.target.value }))} placeholder="mmHg" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">PA Diastolica</label><input type="number" value={formData.bloodPressureDiastolic} onChange={e => setFormData(p => ({ ...p, bloodPressureDiastolic: e.target.value }))} placeholder="mmHg" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">FC (bpm)</label><input type="number" value={formData.heartRate} onChange={e => setFormData(p => ({ ...p, heartRate: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ritmo</label>
                <select value={formData.rhythm} onChange={e => setFormData(p => ({ ...p, rhythm: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="REGULAR">Regular</option>
                  <option value="IRREGULAR">Irregular</option>
                  <option value="ARRHYTHMIA">Arritmia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hallazgos ECG</label>
                <textarea value={formData.ecgFindings} onChange={e => setFormData(p => ({ ...p, ecgFindings: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Factores de Riesgo</label>
                <div className="flex flex-wrap gap-2">
                  {RISK_FACTOR_OPTIONS.map(factor => (
                    <label key={factor} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer border ${formData.riskFactors.includes(factor) ? 'bg-red-50 border-red-300 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                      <input type="checkbox" checked={formData.riskFactors.includes(factor)} onChange={() => toggleRiskFactor(factor)} className="sr-only" />
                      {factor}
                    </label>
                  ))}
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Puntaje de Riesgo</label><input type="number" value={formData.riskScore} onChange={e => setFormData(p => ({ ...p, riskScore: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Diagnostico</label><input type="text" value={formData.diagnosis} onChange={e => setFormData(p => ({ ...p, diagnosis: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Plan</label><textarea value={formData.plan} onChange={e => setFormData(p => ({ ...p, plan: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
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
        <Card><CardContent className="p-6 text-center py-8"><p className="text-gray-500">Sin evaluaciones cardiacas registradas.</p></CardContent></Card>
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
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <p className="text-xs text-gray-500">Presion Arterial</p>
                    <p className="text-lg font-bold">
                      {item.bloodPressureSystolic ?? '-'}/{item.bloodPressureDiastolic ?? '-'}
                      <span className="text-xs font-normal text-gray-500 ml-1">mmHg</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <p className="text-xs text-gray-500">Frec. Cardiaca</p>
                    <p className="text-lg font-bold">
                      {item.heartRate ?? '-'}
                      <span className="text-xs font-normal text-gray-500 ml-1">bpm</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <p className="text-xs text-gray-500">Ritmo</p>
                    {item.rhythm && <Badge className={RHYTHM_COLORS[item.rhythm]}>{RHYTHM_LABELS[item.rhythm] || item.rhythm}</Badge>}
                  </div>
                </div>
                {item.riskFactors && item.riskFactors.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-2">
                    {item.riskFactors.map((f, i) => <Badge key={i} variant="secondary" className="text-xs bg-red-50 text-red-700">{f}</Badge>)}
                  </div>
                )}
                {item.riskScore != null && <p className="text-sm"><span className="text-gray-500">Puntaje Riesgo:</span> <span className="font-semibold">{item.riskScore}</span></p>}
                {item.diagnosis && <p className="text-sm mt-1"><span className="text-gray-500">Diagnostico:</span> <span className="font-medium">{item.diagnosis}</span></p>}
                {item.notes && <p className="text-sm text-gray-600 mt-2">{item.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
