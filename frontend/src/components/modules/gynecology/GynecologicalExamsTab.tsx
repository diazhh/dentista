import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface GynecologicalExam {
  id: string;
  examType: string;
  lastMenstrualPeriod: string | null;
  menstrualCycleLength: number | null;
  menstrualRegularity: string | null;
  contraceptiveMethod: string | null;
  papSmearResult: string | null;
  diagnosis: string | null;
  plan: string | null;
  nextAppointmentDate: string | null;
  notes: string | null;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  ROUTINE: 'bg-green-100 text-green-800',
  PRENATAL: 'bg-pink-100 text-pink-800',
  COLPOSCOPY: 'bg-purple-100 text-purple-800',
  ULTRASOUND: 'bg-blue-100 text-blue-800',
  PAP_SMEAR: 'bg-yellow-100 text-yellow-800',
};

const TYPE_LABELS: Record<string, string> = {
  ROUTINE: 'Rutina',
  PRENATAL: 'Prenatal',
  COLPOSCOPY: 'Colposcopia',
  ULTRASOUND: 'Ecografia',
  PAP_SMEAR: 'Papanicolau',
};

const REGULARITY_LABELS: Record<string, string> = {
  REGULAR: 'Regular',
  IRREGULAR: 'Irregular',
  AMENORRHEA: 'Amenorrea',
};

const REGULARITY_COLORS: Record<string, string> = {
  REGULAR: 'bg-green-100 text-green-800',
  IRREGULAR: 'bg-yellow-100 text-yellow-800',
  AMENORRHEA: 'bg-red-100 text-red-800',
};

interface Props {
  patientId: string;
}

export default function GynecologicalExamsTab({ patientId }: Props) {
  const [items, setItems] = useState<GynecologicalExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GynecologicalExam | null>(null);
  const [formData, setFormData] = useState({
    examType: 'ROUTINE', lastMenstrualPeriod: '', menstrualCycleLength: '', menstrualRegularity: 'REGULAR',
    contraceptiveMethod: '', papSmearResult: '', diagnosis: '', plan: '', nextAppointmentDate: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/modules/gynecology/gynecological-exams', { params: { patientId } });
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  const resetForm = () => {
    setFormData({ examType: 'ROUTINE', lastMenstrualPeriod: '', menstrualCycleLength: '', menstrualRegularity: 'REGULAR', contraceptiveMethod: '', papSmearResult: '', diagnosis: '', plan: '', nextAppointmentDate: '', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (item: GynecologicalExam) => {
    setEditing(item);
    setFormData({
      examType: item.examType,
      lastMenstrualPeriod: item.lastMenstrualPeriod ? item.lastMenstrualPeriod.substring(0, 10) : '',
      menstrualCycleLength: item.menstrualCycleLength?.toString() || '',
      menstrualRegularity: item.menstrualRegularity || 'REGULAR',
      contraceptiveMethod: item.contraceptiveMethod || '',
      papSmearResult: item.papSmearResult || '',
      diagnosis: item.diagnosis || '',
      plan: item.plan || '',
      nextAppointmentDate: item.nextAppointmentDate ? item.nextAppointmentDate.substring(0, 10) : '',
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        examType: formData.examType,
        lastMenstrualPeriod: formData.lastMenstrualPeriod || undefined,
        menstrualCycleLength: formData.menstrualCycleLength ? Number(formData.menstrualCycleLength) : undefined,
        menstrualRegularity: formData.menstrualRegularity,
        contraceptiveMethod: formData.contraceptiveMethod || undefined,
        papSmearResult: formData.papSmearResult || undefined,
        diagnosis: formData.diagnosis || undefined,
        plan: formData.plan || undefined,
        nextAppointmentDate: formData.nextAppointmentDate || undefined,
        notes: formData.notes || undefined,
      };
      if (editing) {
        await api.patch(`/modules/gynecology/gynecological-exams/${editing.id}`, payload);
      } else {
        await api.post('/modules/gynecology/gynecological-exams', { ...payload, patientId });
      }
      resetForm();
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este examen?')) return;
    try { await api.delete(`/modules/gynecology/gynecological-exams/${id}`); fetchData(); } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <Card><CardContent className="p-6"><div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div><span className="text-gray-500">Cargando examenes ginecologicos...</span></div></CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Examenes Ginecologicos</h3>
        <Button onClick={openCreate}>+ Nuevo Examen</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{editing ? 'Editar Examen' : 'Nuevo Examen Ginecologico'}</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Examen</label>
                <select value={formData.examType} onChange={e => setFormData(p => ({ ...p, examType: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="ROUTINE">Rutina</option>
                  <option value="PRENATAL">Prenatal</option>
                  <option value="COLPOSCOPY">Colposcopia</option>
                  <option value="ULTRASOUND">Ecografia</option>
                  <option value="PAP_SMEAR">Papanicolau</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Ultima Menstruacion (FUM)</label><input type="date" value={formData.lastMenstrualPeriod} onChange={e => setFormData(p => ({ ...p, lastMenstrualPeriod: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Duracion Ciclo (dias)</label><input type="number" value={formData.menstrualCycleLength} onChange={e => setFormData(p => ({ ...p, menstrualCycleLength: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regularidad</label>
                  <select value={formData.menstrualRegularity} onChange={e => setFormData(p => ({ ...p, menstrualRegularity: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="REGULAR">Regular</option>
                    <option value="IRREGULAR">Irregular</option>
                    <option value="AMENORRHEA">Amenorrea</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Metodo Anticonceptivo</label><input type="text" value={formData.contraceptiveMethod} onChange={e => setFormData(p => ({ ...p, contraceptiveMethod: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Resultado PAP</label><input type="text" value={formData.papSmearResult} onChange={e => setFormData(p => ({ ...p, papSmearResult: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Diagnostico</label><input type="text" value={formData.diagnosis} onChange={e => setFormData(p => ({ ...p, diagnosis: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Plan</label><textarea value={formData.plan} onChange={e => setFormData(p => ({ ...p, plan: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Proxima Cita</label><input type="date" value={formData.nextAppointmentDate} onChange={e => setFormData(p => ({ ...p, nextAppointmentDate: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
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
        <Card><CardContent className="p-6 text-center py-8"><p className="text-gray-500">Sin examenes ginecologicos registrados.</p></CardContent></Card>
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
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  {item.lastMenstrualPeriod && (
                    <div><span className="text-gray-500">FUM:</span> <span className="font-medium">{new Date(item.lastMenstrualPeriod).toLocaleDateString()}</span></div>
                  )}
                  {item.menstrualCycleLength && (
                    <div><span className="text-gray-500">Ciclo:</span> <span className="font-medium">{item.menstrualCycleLength} dias</span></div>
                  )}
                  {item.menstrualRegularity && (
                    <div><span className="text-gray-500">Regularidad:</span> <Badge className={`${REGULARITY_COLORS[item.menstrualRegularity]} text-xs`}>{REGULARITY_LABELS[item.menstrualRegularity] || item.menstrualRegularity}</Badge></div>
                  )}
                  {item.contraceptiveMethod && (
                    <div><span className="text-gray-500">Anticonceptivo:</span> <span>{item.contraceptiveMethod}</span></div>
                  )}
                </div>
                {item.papSmearResult && (
                  <p className="text-sm mb-1"><span className="text-gray-500">PAP:</span> <span className="font-medium">{item.papSmearResult}</span></p>
                )}
                {item.diagnosis && (
                  <p className="text-sm mb-1"><span className="text-gray-500">Diagnostico:</span> <span className="font-medium">{item.diagnosis}</span></p>
                )}
                {item.nextAppointmentDate && (
                  <p className="text-sm mb-1"><span className="text-gray-500">Proxima cita:</span> <span>{new Date(item.nextAppointmentDate).toLocaleDateString()}</span></p>
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
