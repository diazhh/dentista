import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface GrowthRecord {
  id: string;
  measurementDate: string;
  ageMonths: number;
  weight: number | null;
  height: number | null;
  headCircumference: number | null;
  bmi: number | null;
  weightPercentile: number | null;
  heightPercentile: number | null;
  headPercentile: number | null;
  bmiPercentile: number | null;
  notes: string | null;
  createdAt: string;
}

function percentileColor(p: number | null): string {
  if (p == null) return 'text-gray-500';
  if (p < 5) return 'text-red-600 font-semibold';
  if (p > 95) return 'text-yellow-600 font-semibold';
  return 'text-green-600';
}

interface Props {
  patientId: string;
}

export default function GrowthRecordsTab({ patientId }: Props) {
  const [items, setItems] = useState<GrowthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GrowthRecord | null>(null);
  const [formData, setFormData] = useState({
    measurementDate: '', ageMonths: '', weight: '', height: '', headCircumference: '',
    bmi: '', weightPercentile: '', heightPercentile: '', headPercentile: '', bmiPercentile: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/modules/pediatrics/growth-records', { params: { patientId } });
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  const resetForm = () => {
    setFormData({ measurementDate: '', ageMonths: '', weight: '', height: '', headCircumference: '', bmi: '', weightPercentile: '', heightPercentile: '', headPercentile: '', bmiPercentile: '', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (item: GrowthRecord) => {
    setEditing(item);
    setFormData({
      measurementDate: item.measurementDate ? item.measurementDate.substring(0, 10) : '',
      ageMonths: item.ageMonths?.toString() || '', weight: item.weight?.toString() || '',
      height: item.height?.toString() || '', headCircumference: item.headCircumference?.toString() || '',
      bmi: item.bmi?.toString() || '', weightPercentile: item.weightPercentile?.toString() || '',
      heightPercentile: item.heightPercentile?.toString() || '', headPercentile: item.headPercentile?.toString() || '',
      bmiPercentile: item.bmiPercentile?.toString() || '', notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      const toNum = (v: string) => v ? Number(v) : undefined;
      const payload = {
        measurementDate: formData.measurementDate, ageMonths: toNum(formData.ageMonths),
        weight: toNum(formData.weight), height: toNum(formData.height),
        headCircumference: toNum(formData.headCircumference), bmi: toNum(formData.bmi),
        weightPercentile: toNum(formData.weightPercentile), heightPercentile: toNum(formData.heightPercentile),
        headPercentile: toNum(formData.headPercentile), bmiPercentile: toNum(formData.bmiPercentile),
        notes: formData.notes || undefined,
      };
      if (editing) {
        await api.patch(`/modules/pediatrics/growth-records/${editing.id}`, payload);
      } else {
        await api.post('/modules/pediatrics/growth-records', { ...payload, patientId });
      }
      resetForm();
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try { await api.delete(`/modules/pediatrics/growth-records/${id}`); fetchData(); } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <Card><CardContent className="p-6"><div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div><span className="text-gray-500">Cargando registros de crecimiento...</span></div></CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Registros de Crecimiento</h3>
        <Button onClick={openCreate}>+ Nuevo Registro</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{editing ? 'Editar Registro' : 'Nuevo Registro de Crecimiento'}</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Medicion</label><input type="date" value={formData.measurementDate} onChange={e => setFormData(p => ({ ...p, measurementDate: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Edad (meses)</label><input type="number" value={formData.ageMonths} onChange={e => setFormData(p => ({ ...p, ageMonths: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label><input type="number" step="0.1" value={formData.weight} onChange={e => setFormData(p => ({ ...p, weight: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Talla (cm)</label><input type="number" step="0.1" value={formData.height} onChange={e => setFormData(p => ({ ...p, height: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">PC (cm)</label><input type="number" step="0.1" value={formData.headCircumference} onChange={e => setFormData(p => ({ ...p, headCircumference: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">IMC</label><input type="number" step="0.1" value={formData.bmi} onChange={e => setFormData(p => ({ ...p, bmi: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              <p className="text-sm font-medium text-gray-700">Percentiles</p>
              <div className="grid grid-cols-4 gap-4">
                <div><label className="block text-xs text-gray-500 mb-1">Peso</label><input type="number" value={formData.weightPercentile} onChange={e => setFormData(p => ({ ...p, weightPercentile: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Talla</label><input type="number" value={formData.heightPercentile} onChange={e => setFormData(p => ({ ...p, heightPercentile: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">PC</label><input type="number" value={formData.headPercentile} onChange={e => setFormData(p => ({ ...p, headPercentile: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">IMC</label><input type="number" value={formData.bmiPercentile} onChange={e => setFormData(p => ({ ...p, bmiPercentile: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
              </div>
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
        <Card><CardContent className="p-6 text-center py-8"><p className="text-gray-500">Sin registros de crecimiento.</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Fecha</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Edad (m)</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Peso (kg)</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Talla (cm)</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">PC (cm)</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">IMC</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">%Peso</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">%Talla</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">%PC</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">%IMC</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">{new Date(item.measurementDate).toLocaleDateString()}</td>
                      <td className="py-2 px-3 text-center">{item.ageMonths}</td>
                      <td className="py-2 px-3 text-center">{item.weight ?? '-'}</td>
                      <td className="py-2 px-3 text-center">{item.height ?? '-'}</td>
                      <td className="py-2 px-3 text-center">{item.headCircumference ?? '-'}</td>
                      <td className="py-2 px-3 text-center">{item.bmi ?? '-'}</td>
                      <td className={`py-2 px-3 text-center ${percentileColor(item.weightPercentile)}`}>{item.weightPercentile ?? '-'}</td>
                      <td className={`py-2 px-3 text-center ${percentileColor(item.heightPercentile)}`}>{item.heightPercentile ?? '-'}</td>
                      <td className={`py-2 px-3 text-center ${percentileColor(item.headPercentile)}`}>{item.headPercentile ?? '-'}</td>
                      <td className={`py-2 px-3 text-center ${percentileColor(item.bmiPercentile)}`}>{item.bmiPercentile ?? '-'}</td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-800 text-xs">Editar</button>
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 text-xs">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
