import { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CONDITION_LABELS: Record<string, string> = {
  HEALTHY: 'Sano', CAVITY: 'Caries', FILLED: 'Obturado', CROWN: 'Corona',
  BRIDGE: 'Puente', IMPLANT: 'Implante', MISSING: 'Ausente',
  EXTRACTION_NEEDED: 'Extracción', ROOT_CANAL: 'Endodoncia',
  FRACTURED: 'Fracturado', WORN: 'Desgastado', ABSCESS: 'Absceso',
};

const CONDITION_COLORS: Record<string, string> = {
  HEALTHY: '#ffffff', CAVITY: '#ef4444', FILLED: '#3b82f6', CROWN: '#f59e0b',
  BRIDGE: '#8b5cf6', IMPLANT: '#10b981', MISSING: '#6b7280',
  EXTRACTION_NEEDED: '#dc2626', ROOT_CANAL: '#a855f7', FRACTURED: '#f97316',
  WORN: '#a3a3a3', ABSCESS: '#991b1b',
};

const CONDITION_BORDER: Record<string, string> = {
  HEALTHY: '#d1d5db', CAVITY: '#ef4444', FILLED: '#3b82f6', CROWN: '#f59e0b',
  BRIDGE: '#8b5cf6', IMPLANT: '#10b981', MISSING: '#374151',
  EXTRACTION_NEEDED: '#dc2626', ROOT_CANAL: '#a855f7', FRACTURED: '#f97316',
  WORN: '#9ca3af', ABSCESS: '#991b1b',
};

const SURFACES = ['OCCLUSAL', 'MESIAL', 'DISTAL', 'BUCCAL', 'LINGUAL', 'INCISAL'];
const SURFACE_LABELS: Record<string, string> = {
  OCCLUSAL: 'O', MESIAL: 'M', DISTAL: 'D', BUCCAL: 'B', LINGUAL: 'L', INCISAL: 'I',
};

// FDI adult teeth layout
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

interface ToothData {
  id: string;
  toothNumber: number;
  condition: string;
  surfaces: string[];
  notes: string | null;
  updatedAt: string;
  history?: HistoryEntry[];
}

interface HistoryEntry {
  id: string;
  previousCondition: string;
  newCondition: string;
  surfaces: string[];
  notes: string | null;
  changedAt: string;
  appointment?: { id: string; appointmentDate: string; procedureType: string } | null;
  tooth?: { toothNumber: number };
}

interface OdontogramData {
  id: string;
  date: string;
  notes: string | null;
  teeth: ToothData[];
  updatedAt: string;
  patient?: { firstName: string; lastName: string; documentId: string; dateOfBirth?: string };
}

interface Props {
  patientId: string;
}

export default function OdontogramsTab({ patientId }: Props) {
  const [odontogram, setOdontogram] = useState<OdontogramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingTooth, setEditingTooth] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchOdontogram = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/odontograms/patient/${patientId}/latest`);
      setOdontogram(response.data);
    } catch (error) {
      console.error('Error fetching odontogram:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOdontogram(); }, [patientId]);

  const handleCreateInitial = async () => {
    try {
      setCreating(true);
      // Create with all 32 adult teeth as HEALTHY
      const allTeeth = [...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_LEFT, ...LOWER_RIGHT];
      const teeth = allTeeth.map(num => ({ toothNumber: num, condition: 'HEALTHY', surfaces: [] }));
      await api.post('/odontograms', { patientId, notes: 'Odontograma inicial', teeth });
      fetchOdontogram();
    } catch (error) {
      console.error('Error creating odontogram:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleToothClick = (toothNumber: number) => {
    setEditingTooth(toothNumber);
  };

  const handleToothSave = async (data: { condition: string; surfaces: string[]; notes: string }) => {
    if (!editingTooth || !odontogram) return;
    try {
      const existingTooth = odontogram.teeth.find(t => t.toothNumber === editingTooth);
      if (existingTooth) {
        await api.patch(`/odontograms/${odontogram.id}/teeth/${existingTooth.id}`, data);
      } else {
        await api.post(`/odontograms/${odontogram.id}/teeth`, { toothNumber: editingTooth, ...data });
      }
      await fetchOdontogram();
      setEditingTooth(null);
    } catch (error) {
      console.error('Error saving tooth:', error);
    }
  };

  const handleShowHistory = async () => {
    if (!odontogram) return;
    try {
      setHistoryLoading(true);
      setShowHistory(true);
      const response = await api.get(`/odontograms/${odontogram.id}/history`);
      setHistoryData(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const teethMap = useMemo(() => {
    const map = new Map<number, ToothData>();
    odontogram?.teeth.forEach(t => map.set(t.toothNumber, t));
    return map;
  }, [odontogram]);

  const stats = useMemo(() => {
    if (!odontogram) return { total: 0, healthy: 0, withConditions: 0 };
    const total = odontogram.teeth.length;
    const healthy = odontogram.teeth.filter(t => t.condition === 'HEALTHY').length;
    return { total, healthy, withConditions: total - healthy };
  }, [odontogram]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-6 w-6 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span className="text-gray-500">Cargando odontograma...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No odontogram yet — show create button
  if (!odontogram) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin odontograma</h3>
            <p className="text-sm text-gray-500 mb-6">Este paciente no tiene un odontograma registrado.</p>
            <Button onClick={handleCreateInitial} disabled={creating} size="lg">
              {creating ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Creando...
                </>
              ) : 'Crear Odontograma Inicial'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Odontograma
          </h3>
          <p className="text-xs text-gray-500">
            Ultima actualizacion: {format(new Date(odontogram.updatedAt), "dd MMM yyyy, HH:mm", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShowHistory}>
            Ver Historial
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-blue-700">Dientes</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-600">{stats.healthy}</div>
          <div className="text-xs text-green-700">Sanos</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-amber-600">{stats.withConditions}</div>
          <div className="text-xs text-amber-700">Con condicion</div>
        </div>
      </div>

      {/* Visual Odontogram */}
      <Card>
        <CardContent className="p-4">
          {/* Upper arch */}
          <div className="mb-1">
            <div className="text-xs font-medium text-gray-500 text-center mb-2">ARCADA SUPERIOR</div>
            <div className="flex justify-center gap-0.5 sm:gap-1">
              <div className="flex gap-0.5">
                {UPPER_RIGHT.map(num => (
                  <ToothCell key={num} number={num} tooth={teethMap.get(num)} onClick={handleToothClick} />
                ))}
              </div>
              <div className="w-px bg-gray-300 mx-1" />
              <div className="flex gap-0.5">
                {UPPER_LEFT.map(num => (
                  <ToothCell key={num} number={num} tooth={teethMap.get(num)} onClick={handleToothClick} />
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 my-3" />

          {/* Lower arch */}
          <div className="mt-1">
            <div className="flex justify-center gap-0.5 sm:gap-1">
              <div className="flex gap-0.5">
                {LOWER_RIGHT.map(num => (
                  <ToothCell key={num} number={num} tooth={teethMap.get(num)} onClick={handleToothClick} />
                ))}
              </div>
              <div className="w-px bg-gray-300 mx-1" />
              <div className="flex gap-0.5">
                {LOWER_LEFT.map(num => (
                  <ToothCell key={num} number={num} tooth={teethMap.get(num)} onClick={handleToothClick} />
                ))}
              </div>
            </div>
            <div className="text-xs font-medium text-gray-500 text-center mt-2">ARCADA INFERIOR</div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-sm border"
                    style={{
                      backgroundColor: CONDITION_COLORS[key],
                      borderColor: CONDITION_BORDER[key],
                    }}
                  />
                  <span className="text-[10px] text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teeth with conditions (summary) */}
      {stats.withConditions > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Dientes con condiciones ({stats.withConditions})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {odontogram.teeth
                .filter(t => t.condition !== 'HEALTHY')
                .sort((a, b) => a.toothNumber - b.toothNumber)
                .map(tooth => (
                  <div
                    key={tooth.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleToothClick(tooth.toothNumber)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-gray-800 w-6">{tooth.toothNumber}</span>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: CONDITION_COLORS[tooth.condition] + '20',
                          color: CONDITION_BORDER[tooth.condition],
                          borderColor: CONDITION_BORDER[tooth.condition],
                        }}
                      >
                        {CONDITION_LABELS[tooth.condition] || tooth.condition}
                      </Badge>
                    </div>
                    {tooth.surfaces.length > 0 && (
                      <span className="text-[10px] text-gray-500">
                        {tooth.surfaces.map(s => SURFACE_LABELS[s] || s).join('')}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tooth Editor Modal */}
      {editingTooth !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <ToothEditorModal
            toothNumber={editingTooth}
            tooth={teethMap.get(editingTooth)}
            toothHistory={teethMap.get(editingTooth)?.history || []}
            onSave={handleToothSave}
            onCancel={() => setEditingTooth(null)}
          />
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Historial de Cambios</h2>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </div>
              ) : historyData.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay cambios registrados aun.</p>
              ) : (
                <div className="space-y-2">
                  {historyData.map(entry => (
                    <div key={entry.id} className="border rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">#{entry.tooth?.toothNumber}</span>
                          <span className="text-gray-400">→</span>
                          <Badge variant="secondary" className="text-xs" style={{
                            backgroundColor: CONDITION_COLORS[entry.previousCondition] + '20',
                            color: CONDITION_BORDER[entry.previousCondition],
                          }}>
                            {CONDITION_LABELS[entry.previousCondition]}
                          </Badge>
                          <span className="text-gray-400">→</span>
                          <Badge variant="secondary" className="text-xs" style={{
                            backgroundColor: CONDITION_COLORS[entry.newCondition] + '20',
                            color: CONDITION_BORDER[entry.newCondition],
                          }}>
                            {CONDITION_LABELS[entry.newCondition]}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(entry.changedAt), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </div>
                      {entry.notes && <p className="text-xs text-gray-600">{entry.notes}</p>}
                      {entry.appointment && (
                        <p className="text-xs text-blue-600">
                          Cita: {format(new Date(entry.appointment.appointmentDate), 'dd/MM/yyyy', { locale: es })} - {entry.appointment.procedureType}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tooth Cell Component ──────────────────────────────────────────────────

function ToothCell({ number, tooth, onClick }: { number: number; tooth?: ToothData; onClick: (n: number) => void }) {
  const condition = tooth?.condition || 'HEALTHY';
  const isHealthy = condition === 'HEALTHY';
  const isMissing = condition === 'MISSING';
  const isExtracted = condition === 'EXTRACTION_NEEDED';

  return (
    <div
      className="flex flex-col items-center cursor-pointer group"
      onClick={() => onClick(number)}
    >
      <div className="text-[9px] sm:text-[10px] font-mono text-gray-500 mb-0.5 group-hover:text-blue-600">
        {number}
      </div>
      <div
        className={`w-6 h-7 sm:w-8 sm:h-9 rounded border-2 transition-all flex items-center justify-center
          group-hover:scale-110 group-hover:shadow-md group-hover:border-blue-400
          ${isMissing || isExtracted ? 'opacity-60' : ''}
        `}
        style={{
          backgroundColor: CONDITION_COLORS[condition] || '#ffffff',
          borderColor: CONDITION_BORDER[condition] || '#d1d5db',
        }}
      >
        {isMissing && <span className="text-white font-bold text-xs">X</span>}
        {isExtracted && <span className="text-white font-bold text-xs">!</span>}
        {condition === 'FILLED' && <span className="text-white font-bold text-[8px]">F</span>}
        {condition === 'ROOT_CANAL' && <span className="text-white font-bold text-[8px]">R</span>}
        {condition === 'CROWN' && <span className="text-white font-bold text-[8px]">C</span>}
        {condition === 'IMPLANT' && <span className="text-white font-bold text-[8px]">I</span>}
      </div>
      {!isHealthy && tooth?.surfaces && tooth.surfaces.length > 0 && (
        <div className="text-[7px] text-gray-400 mt-0.5">
          {tooth.surfaces.map(s => SURFACE_LABELS[s] || '').join('')}
        </div>
      )}
    </div>
  );
}

// ─── Tooth Editor Modal ──────────────────────────────────────────────────

interface ToothEditorModalProps {
  toothNumber: number;
  tooth?: ToothData;
  toothHistory: HistoryEntry[];
  onSave: (data: { condition: string; surfaces: string[]; notes: string }) => void;
  onCancel: () => void;
}

function ToothEditorModal({ toothNumber, tooth, toothHistory, onSave, onCancel }: ToothEditorModalProps) {
  const [condition, setCondition] = useState(tooth?.condition || 'HEALTHY');
  const [surfaces, setSurfaces] = useState<string[]>(tooth?.surfaces || []);
  const [notes, setNotes] = useState(tooth?.notes || '');
  const [saving, setSaving] = useState(false);

  const toggleSurface = (s: string) => {
    setSurfaces(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ condition, surfaces, notes });
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
      <div className="p-5 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            Diente #{toothNumber}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {tooth && (
          <p className="text-sm text-gray-500 mt-1">
            Estado actual: <span className="font-medium" style={{ color: CONDITION_BORDER[tooth.condition] }}>
              {CONDITION_LABELS[tooth.condition]}
            </span>
          </p>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nuevo estado</label>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.entries(CONDITION_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCondition(key)}
                className={`px-2 py-1.5 rounded text-xs font-medium transition-all border ${
                  condition === key
                    ? 'ring-2 ring-blue-400 border-blue-400'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={condition === key ? {
                  backgroundColor: CONDITION_COLORS[key] + '30',
                  color: CONDITION_BORDER[key],
                } : {}}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Surfaces */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Superficies afectadas</label>
          <div className="flex gap-2">
            {SURFACES.map(s => (
              <button
                key={s}
                onClick={() => toggleSurface(s)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                  surfaces.includes(s)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {SURFACE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Observaciones del diente..."
          />
        </div>

        {/* History */}
        {toothHistory.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Historial</label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {toothHistory.map(h => (
                <div key={h.id} className="text-xs text-gray-600 flex items-center gap-1">
                  <span className="text-gray-400">{format(new Date(h.changedAt), 'dd/MM/yy')}</span>
                  <span>{CONDITION_LABELS[h.previousCondition]}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{CONDITION_LABELS[h.newCondition]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-5 border-t flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
