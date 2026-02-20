import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface BodyMeasurement {
  id: string;
  measurementDate: string;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bodyFatPercentage: number | null;
  muscleMass: number | null;
  waistCircumference: number | null;
  hipCircumference: number | null;
  chestCircumference: number | null;
  armCircumference: number | null;
  thighCircumference: number | null;
  notes: string | null;
  createdAt: string;
}

interface Props {
  patientId: string;
}

export default function BodyMeasurementsTab({ patientId }: Props) {
  const [items, setItems] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BodyMeasurement | null>(null);
  const [formData, setFormData] = useState({
    measurementDate: '', weight: '', height: '', bmi: '', bodyFatPercentage: '', muscleMass: '',
    waistCircumference: '', hipCircumference: '', chestCircumference: '', armCircumference: '', thighCircumference: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/modules/nutrition/body-measurements', { params: { patientId } });
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  const resetForm = () => {
    setFormData({ measurementDate: '', weight: '', height: '', bmi: '', bodyFatPercentage: '', muscleMass: '', waistCircumference: '', hipCircumference: '', chestCircumference: '', armCircumference: '', thighCircumference: '', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (item: BodyMeasurement) => {
    setEditing(item);
    setFormData({
      measurementDate: item.measurementDate ? item.measurementDate.substring(0, 10) : '',
      weight: item.weight?.toString() || '', height: item.height?.toString() || '',
      bmi: item.bmi?.toString() || '', bodyFatPercentage: item.bodyFatPercentage?.toString() || '',
      muscleMass: item.muscleMass?.toString() || '', waistCircumference: item.waistCircumference?.toString() || '',
      hipCircumference: item.hipCircumference?.toString() || '', chestCircumference: item.chestCircumference?.toString() || '',
      armCircumference: item.armCircumference?.toString() || '', thighCircumference: item.thighCircumference?.toString() || '',
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      const toNum = (v: string) => v ? Number(v) : undefined;
      const payload = {
        measurementDate: formData.measurementDate,
        weight: toNum(formData.weight), height: toNum(formData.height), bmi: toNum(formData.bmi),
        bodyFatPercentage: toNum(formData.bodyFatPercentage), muscleMass: toNum(formData.muscleMass),
        waistCircumference: toNum(formData.waistCircumference), hipCircumference: toNum(formData.hipCircumference),
        chestCircumference: toNum(formData.chestCircumference), armCircumference: toNum(formData.armCircumference),
        thighCircumference: toNum(formData.thighCircumference), notes: formData.notes || undefined,
      };
      if (editing) {
        await api.patch(`/modules/nutrition/body-measurements/${editing.id}`, payload);
      } else {
        await api.post('/modules/nutrition/body-measurements', { ...payload, patientId });
      }
      resetForm();
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta medicion?')) return;
    try { await api.delete(`/modules/nutrition/body-measurements/${id}`); fetchData(); } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <Card><CardContent className="p-6"><div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div><span className="text-gray-500">Cargando mediciones corporales...</span></div></CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Mediciones Corporales</h3>
        <Button onClick={openCreate}>+ Nueva Medicion</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{editing ? 'Editar Medicion' : 'Nueva Medicion Corporal'}</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label><input type="date" value={formData.measurementDate} onChange={e => setFormData(p => ({ ...p, measurementDate: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label><input type="number" step="0.1" value={formData.weight} onChange={e => setFormData(p => ({ ...p, weight: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Talla (cm)</label><input type="number" step="0.1" value={formData.height} onChange={e => setFormData(p => ({ ...p, height: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">IMC</label><input type="number" step="0.1" value={formData.bmi} onChange={e => setFormData(p => ({ ...p, bmi: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Grasa Corporal (%)</label><input type="number" step="0.1" value={formData.bodyFatPercentage} onChange={e => setFormData(p => ({ ...p, bodyFatPercentage: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Masa Muscular (kg)</label><input type="number" step="0.1" value={formData.muscleMass} onChange={e => setFormData(p => ({ ...p, muscleMass: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <p className="text-sm font-medium text-gray-700">Circunferencias (cm)</p>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-xs text-gray-500 mb-1">Cintura</label><input type="number" step="0.1" value={formData.waistCircumference} onChange={e => setFormData(p => ({ ...p, waistCircumference: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Cadera</label><input type="number" step="0.1" value={formData.hipCircumference} onChange={e => setFormData(p => ({ ...p, hipCircumference: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Pecho</label><input type="number" step="0.1" value={formData.chestCircumference} onChange={e => setFormData(p => ({ ...p, chestCircumference: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-gray-500 mb-1">Brazo</label><input type="number" step="0.1" value={formData.armCircumference} onChange={e => setFormData(p => ({ ...p, armCircumference: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Muslo</label><input type="number" step="0.1" value={formData.thighCircumference} onChange={e => setFormData(p => ({ ...p, thighCircumference: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
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
        <Card><CardContent className="p-6 text-center py-8"><p className="text-gray-500">Sin mediciones corporales registradas.</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Fecha</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Peso (kg)</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">IMC</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Grasa (%)</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Musculo (kg)</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Cintura</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Cadera</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">{new Date(item.measurementDate).toLocaleDateString()}</td>
                      <td className="py-2 px-3 text-center font-medium">{item.weight ?? '-'}</td>
                      <td className="py-2 px-3 text-center">{item.bmi ?? '-'}</td>
                      <td className="py-2 px-3 text-center">{item.bodyFatPercentage != null ? `${item.bodyFatPercentage}%` : '-'}</td>
                      <td className="py-2 px-3 text-center">{item.muscleMass ?? '-'}</td>
                      <td className="py-2 px-3 text-center">{item.waistCircumference ?? '-'}</td>
                      <td className="py-2 px-3 text-center">{item.hipCircumference ?? '-'}</td>
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
