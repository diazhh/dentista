import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Package, Plus, ArrowRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const WORK_TYPE_LABELS: Record<string, string> = {
  CROWN: 'Corona', BRIDGE: 'Puente', DENTURE: 'Protesis', PARTIAL: 'Parcial',
  IMPLANT_ABUTMENT: 'Pilar de Implante', NIGHT_GUARD: 'Guarda Nocturna',
  RETAINER: 'Retenedor', VENEER: 'Carilla', INLAY_ONLAY: 'Inlay/Onlay', OTHER: 'Otro',
};

const MATERIAL_LABELS: Record<string, string> = {
  PFM: 'Porcelana sobre Metal', ZIRCONIA: 'Zirconia', EMAX: 'E.max', GOLD: 'Oro',
  ACRYLIC: 'Acrilico', COMPOSITE: 'Composite', METAL: 'Metal', OTHER: 'Otro',
};

const STATUS_STYLES: Record<string, string> = {
  SENT: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RECEIVED: 'bg-purple-100 text-purple-800',
  TRIED_IN: 'bg-orange-100 text-orange-800',
  ADJUSTMENT: 'bg-red-100 text-red-800',
  SEATED: 'bg-green-100 text-green-800',
};

const STATUS_LABELS: Record<string, string> = {
  SENT: 'Enviado', IN_PROGRESS: 'En Proceso', RECEIVED: 'Recibido',
  TRIED_IN: 'Probado', ADJUSTMENT: 'Ajuste', SEATED: 'Cementado',
};

const STATUS_FLOW = ['SENT', 'IN_PROGRESS', 'RECEIVED', 'TRIED_IN', 'ADJUSTMENT', 'SEATED'];

const WORK_TYPES = Object.keys(WORK_TYPE_LABELS);
const MATERIALS = Object.keys(MATERIAL_LABELS);

interface LabCase {
  id: string;
  labName: string;
  workType: string;
  toothNumbers: number[];
  shade: string | null;
  material: string | null;
  status: string;
  sentDate: string;
  dueDate: string | null;
  receivedDate: string | null;
  seatedDate: string | null;
  labFee: number | null;
  patientFee: number | null;
  notes: string | null;
  createdAt: string;
}

const emptyForm = {
  labName: '', workType: 'CROWN', toothNumbers: '', shade: '', material: '',
  dueDate: '', labFee: '', patientFee: '', notes: '',
};

export default function LabCasesTab({ patientId }: { patientId: string }) {
  const [cases, setCases] = useState<LabCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/modules/dental/lab-cases/patient/${patientId}`);
      setCases(res.data);
    } catch (err) {
      console.error('Error fetching lab cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCases(); }, [patientId]);

  const setField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const openForm = () => { setForm(emptyForm); setShowForm(true); };

  const handleCreate = async () => {
    if (!form.labName.trim() || !form.workType) return;
    const teeth = form.toothNumbers.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    try {
      setSubmitting(true);
      await api.post('/modules/dental/lab-cases', {
        patientId,
        labName: form.labName,
        workType: form.workType,
        toothNumbers: teeth,
        shade: form.shade || undefined,
        material: form.material || undefined,
        dueDate: form.dueDate || undefined,
        labFee: form.labFee ? parseFloat(form.labFee) : undefined,
        patientFee: form.patientFee ? parseFloat(form.patientFee) : undefined,
        notes: form.notes || undefined,
      });
      setShowForm(false);
      fetchCases();
    } catch (err) {
      console.error('Error creating lab case:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const advanceStatus = async (labCase: LabCase) => {
    const idx = STATUS_FLOW.indexOf(labCase.status);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[idx + 1];
    try {
      await api.patch(`/modules/dental/lab-cases/${labCase.id}/status`, { status: nextStatus });
      fetchCases();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este caso de laboratorio?')) return;
    try {
      await api.delete(`/modules/dental/lab-cases/${id}`);
      fetchCases();
    } catch (err) {
      console.error('Error deleting lab case:', err);
    }
  };

  const fmtDate = (d: string | null) => d ? format(new Date(d), 'dd MMM yyyy', { locale: es }) : '—';
  const fmtFee = (v: number | null) => v != null ? `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-6 w-6 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-gray-500">Cargando casos de laboratorio...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5" /> Casos de Laboratorio
        </h3>
        <Button onClick={openForm}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Caso
        </Button>
      </div>

      {/* Empty state */}
      {cases.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No hay casos de laboratorio registrados.
          </CardContent>
        </Card>
      )}

      {/* Cases list */}
      {cases.map(c => {
        const nextIdx = STATUS_FLOW.indexOf(c.status);
        const canAdvance = nextIdx >= 0 && nextIdx < STATUS_FLOW.length - 1;
        return (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{c.labName}</span>
                    <Badge className={STATUS_STYLES[c.status] || 'bg-gray-100 text-gray-800'}>
                      {STATUS_LABELS[c.status] || c.status}
                    </Badge>
                    <Badge variant="outline">{WORK_TYPE_LABELS[c.workType] || c.workType}</Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm text-gray-600">
                    {c.toothNumbers.length > 0 && (
                      <span>Dientes: <strong>{c.toothNumbers.join(', ')}</strong></span>
                    )}
                    {c.shade && <span>Tono: <strong>{c.shade}</strong></span>}
                    {c.material && <span>Material: <strong>{MATERIAL_LABELS[c.material] || c.material}</strong></span>}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Enviado: {fmtDate(c.sentDate)}</span>
                    {c.dueDate && <span>Entrega: {fmtDate(c.dueDate)}</span>}
                    {c.receivedDate && <span>Recibido: {fmtDate(c.receivedDate)}</span>}
                    {c.seatedDate && <span>Cementado: {fmtDate(c.seatedDate)}</span>}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Costo Lab: {fmtFee(c.labFee)}</span>
                    <span>Costo Paciente: {fmtFee(c.patientFee)}</span>
                  </div>

                  {c.notes && <p className="text-sm text-gray-600 italic">{c.notes}</p>}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {canAdvance && (
                    <Button variant="outline" size="sm" onClick={() => advanceStatus(c)} title={STATUS_LABELS[STATUS_FLOW[nextIdx + 1]]}>
                      <ArrowRight className="w-4 h-4 mr-1" />
                      {STATUS_LABELS[STATUS_FLOW[nextIdx + 1]]}
                    </Button>
                  )}
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:text-red-700">
                    Eliminar
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Nuevo Caso de Laboratorio</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio *</label>
                <input type="text" value={form.labName} onChange={e => setField('labName', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del laboratorio" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Trabajo *</label>
                  <select value={form.workType} onChange={e => setField('workType', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    {WORK_TYPES.map(wt => <option key={wt} value={wt}>{WORK_TYPE_LABELS[wt]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                  <select value={form.material} onChange={e => setField('material', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">— Sin especificar —</option>
                    {MATERIALS.map(m => <option key={m} value={m}>{MATERIAL_LABELS[m]}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dientes (separados por coma)</label>
                  <input type="text" value={form.toothNumbers} onChange={e => setField('toothNumbers', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 11, 12, 21" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tono / Shade</label>
                  <input type="text" value={form.shade} onChange={e => setField('shade', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: A2, B1" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Entrega</label>
                  <input type="date" value={form.dueDate} onChange={e => setField('dueDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo Lab</label>
                  <input type="number" step="0.01" value={form.labFee} onChange={e => setField('labFee', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo Paciente</label>
                  <input type="number" step="0.01" value={form.patientFee} onChange={e => setField('patientFee', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea rows={3} value={form.notes} onChange={e => setField('notes', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Indicaciones adicionales..." />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={submitting || !form.labName.trim()}>
                {submitting ? 'Guardando...' : 'Crear Caso'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
