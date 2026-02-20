import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PROPOSED: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PROPOSED: 'Propuesto',
  ACCEPTED: 'Aceptado',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

const ITEM_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const ITEM_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

interface TreatmentItem {
  id: string;
  tooth: string | null;
  surface: string | null;
  procedureCode: string;
  procedureName: string;
  description: string | null;
  status: string;
  estimatedCost: number;
  actualCost: number | null;
  priority: number;
  notes: string | null;
}

interface TreatmentPlan {
  id: string;
  title: string;
  description: string | null;
  diagnosis: string | null;
  status: string;
  totalCost: number;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  items: TreatmentItem[];
  createdAt: string;
}

interface Props {
  patientId: string;
}

export default function TreatmentPlansTab({ patientId }: Props) {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDiagnosis, setFormDiagnosis] = useState('');
  const [formItems, setFormItems] = useState<Array<{
    procedureCode: string;
    procedureName: string;
    tooth: string;
    estimatedCost: number;
    priority: number;
    notes: string;
  }>>([]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/treatment-plans', { params: { patientId } });
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching treatment plans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [patientId]);

  const getProgress = (plan: TreatmentPlan): number => {
    if (!plan.items || plan.items.length === 0) return 0;
    const completed = plan.items.filter(i => i.status === 'COMPLETED').length;
    return Math.round((completed / plan.items.length) * 100);
  };

  const initializeForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormDiagnosis('');
    setFormItems([{
      procedureCode: '',
      procedureName: '',
      tooth: '',
      estimatedCost: 0,
      priority: 1,
      notes: '',
    }]);
    setShowForm(true);
  };

  const addItem = () => {
    setFormItems(prev => [...prev, {
      procedureCode: '',
      procedureName: '',
      tooth: '',
      estimatedCost: 0,
      priority: 1,
      notes: '',
    }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) return;
    if (formItems.length === 0 || !formItems[0].procedureName.trim()) return;

    try {
      setSubmitting(true);
      await api.post('/treatment-plans', {
        patientId,
        title: formTitle,
        description: formDescription || undefined,
        diagnosis: formDiagnosis || undefined,
        items: formItems.map(item => ({
          procedureCode: item.procedureCode || 'GEN',
          procedureName: item.procedureName,
          tooth: item.tooth || undefined,
          estimatedCost: item.estimatedCost,
          priority: item.priority,
          notes: item.notes || undefined,
        })),
      });
      setShowForm(false);
      fetchPlans();
    } catch (error) {
      console.error('Error creating treatment plan:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, status: string) => {
    try {
      await api.patch(`/treatment-plans/items/${itemId}`, { status });
      fetchPlans();
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-6 w-6 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span className="text-gray-500">Cargando planes de tratamiento...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Planes de Tratamiento</h3>
        <Button onClick={initializeForm}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Plan
        </Button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Nuevo Plan de Tratamiento</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Plan de rehabilitacion oral"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripcion del plan..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnostico</label>
                <input
                  type="text"
                  value={formDiagnosis}
                  onChange={(e) => setFormDiagnosis(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Diagnostico asociado..."
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Procedimientos *</label>
                  <Button variant="outline" onClick={addItem} className="text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar
                  </Button>
                </div>

                <div className="space-y-3">
                  {formItems.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Procedimiento *</label>
                          <input
                            type="text"
                            value={item.procedureName}
                            onChange={(e) => updateItem(index, 'procedureName', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                            placeholder="Nombre del procedimiento"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Codigo</label>
                          <input
                            type="text"
                            value={item.procedureCode}
                            onChange={(e) => updateItem(index, 'procedureCode', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                            placeholder="Ej: D2140"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Diente</label>
                          <input
                            type="text"
                            value={item.tooth}
                            onChange={(e) => updateItem(index, 'tooth', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                            placeholder="Ej: 14"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Costo Estimado</label>
                          <input
                            type="number"
                            value={item.estimatedCost}
                            onChange={(e) => updateItem(index, 'estimatedCost', parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                            min={0}
                            step={0.01}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-2">
                        {formItems.length > 1 && (
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-400 hover:text-red-600 text-sm flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting || !formTitle.trim()}>
                {submitting && (
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                )}
                Crear Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Sin planes de tratamiento</h3>
              <p className="mt-1 text-sm text-gray-500">Cree el primer plan de tratamiento para este paciente.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const progress = getProgress(plan);
            return (
              <Card key={plan.id}>
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">{plan.title}</CardTitle>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[plan.status] || 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_LABELS[plan.status] || plan.status}
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === plan.id ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progreso</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-900">
                        ${plan.totalCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-500">Costo total</div>
                    </div>
                  </div>
                </CardHeader>

                {expandedId === plan.id && (
                  <CardContent>
                    {plan.diagnosis && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-gray-500">Diagnostico:</span>
                        <p className="text-sm text-gray-700">{plan.diagnosis}</p>
                      </div>
                    )}
                    {plan.description && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-gray-500">Descripcion:</span>
                        <p className="text-sm text-gray-700">{plan.description}</p>
                      </div>
                    )}

                    {plan.items && plan.items.length > 0 ? (
                      <div className="overflow-x-auto mt-2">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 font-medium text-gray-600">Procedimiento</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-600">Diente</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-600">Estado</th>
                              <th className="text-right py-2 px-3 font-medium text-gray-600">Costo Est.</th>
                              <th className="text-center py-2 px-3 font-medium text-gray-600">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plan.items.map((item) => (
                              <tr key={item.id} className="border-b border-gray-100">
                                <td className="py-2 px-3">
                                  <div className="font-medium">{item.procedureName}</div>
                                  <div className="text-xs text-gray-400">{item.procedureCode}</div>
                                </td>
                                <td className="py-2 px-3 font-mono">{item.tooth || '-'}</td>
                                <td className="py-2 px-3">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ITEM_STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-700'}`}>
                                    {ITEM_STATUS_LABELS[item.status] || item.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  ${item.estimatedCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <select
                                    value={item.status}
                                    onChange={(e) => handleUpdateItemStatus(item.id, e.target.value)}
                                    className="border border-gray-300 rounded px-1.5 py-1 text-xs"
                                  >
                                    {Object.entries(ITEM_STATUS_LABELS).map(([key, label]) => (
                                      <option key={key} value={key}>{label}</option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No hay procedimientos en este plan.</p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
