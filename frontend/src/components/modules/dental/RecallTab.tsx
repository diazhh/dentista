import { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Bell, Plus, Check, AlertTriangle, Calendar } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  PROPHY: 'Profilaxis', PERIO_MAINTENANCE: 'Mantenimiento Periodontal',
  EXAM: 'Examen', XRAY: 'Radiografia', FLUORIDE: 'Fluoruro',
  SEALANT_CHECK: 'Revision de Sellantes', ORTHO_CHECK: 'Control Ortodoncia', OTHER: 'Otro',
};

const STATUS_STYLES: Record<string, string> = {
  OVERDUE: 'bg-red-100 text-red-800', SCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800', CANCELLED: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<string, string> = {
  OVERDUE: 'Vencido', SCHEDULED: 'Programado', COMPLETED: 'Completado', CANCELLED: 'Cancelado',
};

interface DentalRecall {
  id: string; patientId: string; recallType: string; intervalMonths: number;
  lastVisitDate: string | null; dueDate: string; status: string;
  remindersSent: number; lastReminderAt: string | null; notes: string | null; createdAt: string;
}

function getDaysDiff(dueDate: string): number {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

const Spinner = () => (
  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function RecallTab({ patientId }: { patientId: string }) {
  const [recalls, setRecalls] = useState<DentalRecall[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formType, setFormType] = useState('PROPHY');
  const [formInterval, setFormInterval] = useState(6);
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const fetchRecalls = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/modules/dental/recall/patient/${patientId}`);
      setRecalls(res.data);
    } catch (e) { console.error('Error fetching recalls:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecalls(); }, [patientId]);

  const grouped = useMemo(() => ({
    overdue: recalls.filter(r => r.status === 'OVERDUE'),
    scheduled: recalls.filter(r => r.status === 'SCHEDULED'),
    completed: recalls.filter(r => r.status === 'COMPLETED'),
    cancelled: recalls.filter(r => r.status === 'CANCELLED'),
  }), [recalls]);

  const initializeForm = () => {
    setFormType('PROPHY'); setFormInterval(6); setFormNotes('');
    const d = new Date(); d.setMonth(d.getMonth() + 6);
    setFormDueDate(d.toISOString().split('T')[0]);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formDueDate) return;
    try {
      setSubmitting(true);
      await api.post('/modules/dental/recall', {
        patientId, recallType: formType,
        intervalMonths: formInterval, dueDate: formDueDate,
        notes: formNotes || undefined,
      });
      setShowForm(false); fetchRecalls();
    } catch (e) { console.error('Error creating recall:', e); }
    finally { setSubmitting(false); }
  };

  const handleComplete = async (id: string) => {
    try { await api.post(`/modules/dental/recall/${id}/complete`); fetchRecalls(); }
    catch (e) { console.error('Error completing recall:', e); }
  };

  const handleCancel = async (id: string) => {
    try { await api.patch(`/modules/dental/recall/${id}`, { status: 'CANCELLED' }); fetchRecalls(); }
    catch (e) { console.error('Error cancelling recall:', e); }
  };

  const renderDaysIndicator = (recall: DentalRecall) => {
    if (recall.status === 'COMPLETED' || recall.status === 'CANCELLED') return null;
    const days = getDaysDiff(recall.dueDate);
    if (days < 0) return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
        <AlertTriangle className="w-3 h-3" />{Math.abs(days)} dias vencido
      </span>
    );
    if (days === 0) return <span className="text-xs font-medium text-amber-600">Vence hoy</span>;
    const color = days <= 30 ? 'text-amber-600 font-medium' : 'text-gray-500';
    return (
      <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
        <Calendar className="w-3 h-3" />{days} dias restantes
      </span>
    );
  };

  const renderRecallCard = (recall: DentalRecall) => (
    <Card key={recall.id} className={recall.status === 'OVERDUE' ? 'border-red-300 bg-red-50/30' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900">{TYPE_LABELS[recall.recallType] || recall.recallType}</span>
              <Badge className={STATUS_STYLES[recall.status] || 'bg-gray-100 text-gray-800'}>
                {STATUS_LABELS[recall.status] || recall.status}
              </Badge>
            </div>
            <div className="mt-1.5 flex items-center gap-4 text-sm text-gray-500 flex-wrap">
              <span>Cada {recall.intervalMonths} meses</span>
              <span>Vence: {formatDate(recall.dueDate)}</span>
              {recall.remindersSent > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Bell className="w-3 h-3" />{recall.remindersSent} recordatorio{recall.remindersSent !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="mt-1">{renderDaysIndicator(recall)}</div>
            {recall.notes && <p className="mt-1.5 text-sm text-gray-600 italic">{recall.notes}</p>}
          </div>
          {(recall.status === 'SCHEDULED' || recall.status === 'OVERDUE') && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" className="text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => handleComplete(recall.id)}>
                <Check className="w-4 h-4 mr-1" />Completar
              </Button>
              <button onClick={() => handleCancel(recall.id)}
                className="text-gray-400 hover:text-red-500 text-sm" title="Cancelar">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const SECTIONS = [
    { key: 'overdue', label: 'Vencidos', color: 'text-red-700', icon: <AlertTriangle className="w-4 h-4" /> },
    { key: 'scheduled', label: 'Programados', color: 'text-blue-700', icon: <Calendar className="w-4 h-4" /> },
    { key: 'completed', label: 'Completados', color: 'text-green-700', icon: <Check className="w-4 h-4" /> },
    { key: 'cancelled', label: 'Cancelados', color: 'text-gray-500', icon: null },
  ] as const;

  if (loading) return (
    <Card><CardContent className="p-6">
      <div className="flex items-center justify-center py-8">
        <Spinner /><span className="text-gray-500">Cargando recalls...</span>
      </div>
    </CardContent></Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Recall / Recitaciones</h3>
        <Button onClick={initializeForm}><Plus className="w-4 h-4 mr-2" />Nuevo Recall</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Nuevo Recall</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Recall *</label>
                <select value={formType} onChange={e => setFormType(e.target.value)} className={inputCls}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo (meses) *</label>
                <input type="number" value={formInterval} min={1} max={36}
                  onChange={e => setFormInterval(parseInt(e.target.value) || 1)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento *</label>
                <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)}
                  rows={3} className={inputCls} placeholder="Observaciones adicionales..." />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting || !formDueDate}>
                {submitting && <Spinner />}Crear Recall
              </Button>
            </div>
          </div>
        </div>
      )}

      {recalls.length === 0 ? (
        <Card><CardContent className="p-6">
          <div className="text-center py-8">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Sin recalls programados</h3>
            <p className="mt-1 text-sm text-gray-500">Programe el primer recall para este paciente.</p>
          </div>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {SECTIONS.map(({ key, label, color, icon }) => {
            const items = grouped[key];
            if (items.length === 0) return null;
            return (
              <div key={key}>
                <h4 className={`text-sm font-semibold ${color} mb-2 flex items-center gap-1`}>
                  {icon}{label} ({items.length})
                </h4>
                <div className="space-y-2">{items.map(renderRecallCard)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
