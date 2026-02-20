import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  duration: string;
  instructions: string;
}

interface ExercisePlan {
  id: string;
  title: string;
  description: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  status: string;
  exercises: Exercise[];
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

const emptyExercise = (): Exercise => ({ name: '', sets: '', reps: '', duration: '', instructions: '' });

interface Props {
  patientId: string;
}

export default function ExercisePlansTab({ patientId }: Props) {
  const [items, setItems] = useState<ExercisePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExercisePlan | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    exercises: [emptyExercise()] as Exercise[],
    notes: '',
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/modules/physiotherapy/exercise-plans', { params: { patientId } });
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  const resetForm = () => {
    setFormData({ title: '', description: '', frequency: '', startDate: '', endDate: '', status: 'ACTIVE', exercises: [emptyExercise()], notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (item: ExercisePlan) => {
    setEditing(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      frequency: item.frequency || '',
      startDate: item.startDate ? item.startDate.substring(0, 10) : '',
      endDate: item.endDate ? item.endDate.substring(0, 10) : '',
      status: item.status,
      exercises: item.exercises && item.exercises.length > 0 ? item.exercises : [emptyExercise()],
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        endDate: formData.endDate || undefined,
        notes: formData.notes || undefined,
        exercises: formData.exercises.filter(e => e.name.trim()),
      };
      if (editing) {
        await api.patch(`/modules/physiotherapy/exercise-plans/${editing.id}`, payload);
      } else {
        await api.post('/modules/physiotherapy/exercise-plans', { ...payload, patientId });
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este plan de ejercicios?')) return;
    try {
      await api.delete(`/modules/physiotherapy/exercise-plans/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const addExercise = () => {
    setFormData(prev => ({ ...prev, exercises: [...prev.exercises, emptyExercise()] }));
  };

  const removeExercise = (index: number) => {
    setFormData(prev => ({ ...prev, exercises: prev.exercises.filter((_, i) => i !== index) }));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    setFormData(prev => {
      const updated = [...prev.exercises];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, exercises: updated };
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-gray-500">Cargando planes de ejercicios...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Planes de Ejercicios</h3>
        <Button onClick={openCreate}>+ Nuevo Plan</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{editing ? 'Editar Plan' : 'Nuevo Plan de Ejercicios'}</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
                <input type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                  <input type="text" value={formData.frequency} onChange={e => setFormData(p => ({ ...p, frequency: e.target.value }))} placeholder="Ej: 3 veces/semana" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="ACTIVE">Activo</option>
                    <option value="COMPLETED">Completado</option>
                    <option value="PAUSED">Pausado</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
              </div>

              {/* Exercises */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Ejercicios</label>
                  <Button variant="outline" onClick={addExercise} className="text-sm">+ Agregar Ejercicio</Button>
                </div>
                <div className="space-y-3">
                  {formData.exercises.map((ex, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input type="text" value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)} placeholder="Nombre" className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
                          <input type="text" value={ex.duration} onChange={e => updateExercise(i, 'duration', e.target.value)} placeholder="Duracion" className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
                          <input type="text" value={ex.sets} onChange={e => updateExercise(i, 'sets', e.target.value)} placeholder="Series" className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
                          <input type="text" value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} placeholder="Repeticiones" className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
                        </div>
                        <button onClick={() => removeExercise(i)} className="mt-1 text-red-400 hover:text-red-600 text-lg">&times;</button>
                      </div>
                      <input type="text" value={ex.instructions} onChange={e => updateExercise(i, 'instructions', e.target.value)} placeholder="Instrucciones" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-2" />
                    </div>
                  ))}
                </div>
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
            <p className="text-gray-500">Sin planes de ejercicios registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item.id}>
              <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <Badge className={STATUS_COLORS[item.status]}>{STATUS_LABELS[item.status] || item.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{item.frequency}</span>
                    <Badge variant="secondary">{item.exercises?.length || 0} ejercicios</Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {item.startDate && new Date(item.startDate).toLocaleDateString()}
                  {item.endDate && ` - ${new Date(item.endDate).toLocaleDateString()}`}
                </p>
              </CardHeader>
              {expandedId === item.id && (
                <CardContent>
                  {item.exercises && item.exercises.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {item.exercises.map((ex, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
                          <span className="font-medium">{ex.name}</span>
                          <span className="text-gray-400">-</span>
                          <span>{ex.sets && ex.reps ? `${ex.sets}x${ex.reps}` : '-'}</span>
                          {ex.duration && <span className="text-gray-400">({ex.duration})</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic mb-4">Sin ejercicios definidos.</p>
                  )}
                  {item.notes && <p className="text-sm text-gray-600 mb-4">{item.notes}</p>}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openEdit(item)} className="text-sm">Editar</Button>
                    <Button variant="outline" onClick={() => handleDelete(item.id)} className="text-sm text-red-600 hover:text-red-700">Eliminar</Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
