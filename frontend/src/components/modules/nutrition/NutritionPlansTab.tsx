import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface NutritionPlan {
  id: string;
  title: string;
  objective: string;
  dailyCalories: number | null;
  startDate: string;
  endDate: string | null;
  status: string;
  restrictions: string[];
  supplements: string[];
  notes: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  COMPLETED: 'Completado',
  PAUSED: 'Pausado',
};

const OBJECTIVE_COLORS: Record<string, string> = {
  WEIGHT_LOSS: 'bg-orange-100 text-orange-800',
  WEIGHT_GAIN: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-green-100 text-green-800',
  THERAPEUTIC: 'bg-purple-100 text-purple-800',
  SPORTS: 'bg-indigo-100 text-indigo-800',
};

const OBJECTIVE_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'Perdida de Peso',
  WEIGHT_GAIN: 'Ganancia de Peso',
  MAINTENANCE: 'Mantenimiento',
  THERAPEUTIC: 'Terapeutico',
  SPORTS: 'Deportivo',
};

interface Props {
  patientId: string;
}

export default function NutritionPlansTab({ patientId }: Props) {
  const [items, setItems] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NutritionPlan | null>(null);
  const [formData, setFormData] = useState({
    title: '', objective: 'MAINTENANCE', dailyCalories: '', startDate: '', endDate: '',
    status: 'ACTIVE', restrictions: '', supplements: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/modules/nutrition/nutrition-plans', { params: { patientId } });
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  const resetForm = () => {
    setFormData({ title: '', objective: 'MAINTENANCE', dailyCalories: '', startDate: '', endDate: '', status: 'ACTIVE', restrictions: '', supplements: '', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (item: NutritionPlan) => {
    setEditing(item);
    setFormData({
      title: item.title, objective: item.objective, dailyCalories: item.dailyCalories?.toString() || '',
      startDate: item.startDate ? item.startDate.substring(0, 10) : '',
      endDate: item.endDate ? item.endDate.substring(0, 10) : '',
      status: item.status, restrictions: item.restrictions?.join(', ') || '',
      supplements: item.supplements?.join(', ') || '', notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        title: formData.title, objective: formData.objective,
        dailyCalories: formData.dailyCalories ? Number(formData.dailyCalories) : undefined,
        startDate: formData.startDate, endDate: formData.endDate || undefined,
        status: formData.status,
        restrictions: formData.restrictions ? formData.restrictions.split(',').map(s => s.trim()).filter(Boolean) : [],
        supplements: formData.supplements ? formData.supplements.split(',').map(s => s.trim()).filter(Boolean) : [],
        notes: formData.notes || undefined,
      };
      if (editing) {
        await api.patch(`/modules/nutrition/nutrition-plans/${editing.id}`, payload);
      } else {
        await api.post('/modules/nutrition/nutrition-plans', { ...payload, patientId });
      }
      resetForm();
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este plan nutricional?')) return;
    try { await api.delete(`/modules/nutrition/nutrition-plans/${id}`); fetchData(); } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <Card><CardContent className="p-6"><div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div><span className="text-gray-500">Cargando planes nutricionales...</span></div></CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Planes Nutricionales</h3>
        <Button onClick={openCreate}>+ Nuevo Plan</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{editing ? 'Editar Plan' : 'Nuevo Plan Nutricional'}</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label><input type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
                  <select value={formData.objective} onChange={e => setFormData(p => ({ ...p, objective: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="WEIGHT_LOSS">Perdida de Peso</option>
                    <option value="WEIGHT_GAIN">Ganancia de Peso</option>
                    <option value="MAINTENANCE">Mantenimiento</option>
                    <option value="THERAPEUTIC">Terapeutico</option>
                    <option value="SPORTS">Deportivo</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Calorias Diarias</label><input type="number" value={formData.dailyCalories} onChange={e => setFormData(p => ({ ...p, dailyCalories: e.target.value }))} placeholder="kcal" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label><input type="date" value={formData.startDate} onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label><input type="date" value={formData.endDate} onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="ACTIVE">Activo</option>
                  <option value="COMPLETED">Completado</option>
                  <option value="PAUSED">Pausado</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Restricciones (separadas por coma)</label><input type="text" value={formData.restrictions} onChange={e => setFormData(p => ({ ...p, restrictions: e.target.value }))} placeholder="Sin gluten, Sin lactosa" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Suplementos (separados por coma)</label><input type="text" value={formData.supplements} onChange={e => setFormData(p => ({ ...p, supplements: e.target.value }))} placeholder="Vitamina D, Omega 3" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
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
        <Card><CardContent className="p-6 text-center py-8"><p className="text-gray-500">Sin planes nutricionales registrados.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <Badge className={OBJECTIVE_COLORS[item.objective]}>{OBJECTIVE_LABELS[item.objective] || item.objective}</Badge>
                    <Badge className={STATUS_COLORS[item.status]}>{STATUS_LABELS[item.status] || item.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => openEdit(item)} className="text-sm h-8">Editar</Button>
                    <Button variant="outline" onClick={() => handleDelete(item.id)} className="text-sm h-8 text-red-600">Eliminar</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Calorias/dia:</span>{' '}
                    <span className="font-semibold">{item.dailyCalories ? `${item.dailyCalories} kcal` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Periodo:</span>{' '}
                    <span>{item.startDate && new Date(item.startDate).toLocaleDateString()}{item.endDate && ` - ${new Date(item.endDate).toLocaleDateString()}`}</span>
                  </div>
                </div>
                {item.restrictions && item.restrictions.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">Restricciones:</span>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {item.restrictions.map((r, i) => <Badge key={i} variant="secondary" className="text-xs bg-red-50 text-red-700">{r}</Badge>)}
                    </div>
                  </div>
                )}
                {item.supplements && item.supplements.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">Suplementos:</span>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {item.supplements.map((s, i) => <Badge key={i} variant="secondary" className="text-xs bg-green-50 text-green-700">{s}</Badge>)}
                    </div>
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
