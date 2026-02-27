import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const EXAM_TYPE_LABELS: Record<string, string> = {
  COMPREHENSIVE: 'Completo', LIMITED: 'Limitado', MAINTENANCE: 'Mantenimiento',
};
const DIAGNOSIS_LABELS: Record<string, string> = {
  HEALTHY: 'Sano', GINGIVITIS: 'Gingivitis', MILD_PERIODONTITIS: 'Periodontitis Leve',
  MODERATE_PERIODONTITIS: 'Periodontitis Moderada', SEVERE_PERIODONTITIS: 'Periodontitis Severa',
};
const DIAGNOSIS_COLORS: Record<string, string> = {
  HEALTHY: 'bg-green-100 text-green-800', GINGIVITIS: 'bg-yellow-100 text-yellow-800',
  MILD_PERIODONTITIS: 'bg-orange-100 text-orange-800', MODERATE_PERIODONTITIS: 'bg-red-100 text-red-800',
  SEVERE_PERIODONTITIS: 'bg-red-200 text-red-900',
};
const ALL_TEETH = [
  18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28,
  38,37,36,35,34,33,32,31, 48,47,46,45,44,43,42,41,
];

interface PerioReading {
  id: string; toothNumber: number;
  pocketDepthBuccal: number[]; pocketDepthLingual: number[];
  gingivalMarginBuccal: number[]; gingivalMarginLingual: number[];
  bleedingBuccal: boolean[]; bleedingLingual: boolean[];
  plaque: boolean; calculus: boolean; suppuration: boolean;
  furcation: number; mobility: number;
}
interface PerioExam {
  id: string; patientId: string; examDate: string; examType: string;
  diagnosis: string | null; overallPlaque: number | null; overallBleeding: number | null;
  notes: string | null; readings: PerioReading[]; createdAt: string; updatedAt: string;
}

export default function PeriodontalChartTab({ patientId }: { patientId: string }) {
  const [exams, setExams] = useState<PerioExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState<PerioExam | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formData, setFormData] = useState({ examType: 'COMPREHENSIVE', diagnosis: '', notes: '', plaque: '', bleeding: '' });

  // Reading modal
  const [readingExamId, setReadingExamId] = useState<string | null>(null);
  const [rForm, setRForm] = useState({
    tooth: '', pdb: '3,3,3', pdl: '3,3,3', gmb: '0,0,0', gml: '0,0,0',
    bleedB: '0,0,0', bleedL: '0,0,0', plaque: false, calculus: false,
    suppuration: false, furcation: 0, mobility: 0,
  });
  const [savingReading, setSavingReading] = useState(false);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/modules/dental/periodontal/patient/${patientId}`);
      setExams(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error('Error fetching periodontal exams:', e); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchExams(); }, [patientId]);

  const resetForm = () => { setFormData({ examType: 'COMPREHENSIVE', diagnosis: '', notes: '', plaque: '', bleeding: '' }); setEditingExam(null); };
  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (exam: PerioExam) => {
    setEditingExam(exam);
    setFormData({
      examType: exam.examType, diagnosis: exam.diagnosis || '', notes: exam.notes || '',
      plaque: exam.overallPlaque != null ? String(exam.overallPlaque) : '',
      bleeding: exam.overallBleeding != null ? String(exam.overallBleeding) : '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        examType: formData.examType,
        diagnosis: formData.diagnosis || undefined,
        notes: formData.notes || undefined,
        overallPlaque: formData.plaque ? parseFloat(formData.plaque) : undefined,
        overallBleeding: formData.bleeding ? parseFloat(formData.bleeding) : undefined,
      };
      if (editingExam) await api.patch(`/modules/dental/periodontal/${editingExam.id}`, payload);
      else { payload.patientId = patientId; await api.post('/modules/dental/periodontal', payload); }
      setShowForm(false); resetForm(); fetchExams();
    } catch (e) { console.error('Error saving periodontal exam:', e); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este examen periodontal?')) return;
    try { setDeleting(id); await api.delete(`/modules/dental/periodontal/${id}`); if (expandedId === id) setExpandedId(null); fetchExams(); }
    catch (e) { console.error('Error deleting exam:', e); }
    finally { setDeleting(null); }
  };

  const parseInts = (s: string) => s.split(',').map(v => parseInt(v.trim(), 10) || 0);
  const parseBools = (s: string) => s.split(',').map(v => v.trim() === '1');

  const openReading = (examId: string) => {
    setReadingExamId(examId);
    setRForm({ tooth: '', pdb: '3,3,3', pdl: '3,3,3', gmb: '0,0,0', gml: '0,0,0', bleedB: '0,0,0', bleedL: '0,0,0', plaque: false, calculus: false, suppuration: false, furcation: 0, mobility: 0 });
  };

  const handleSaveReading = async () => {
    if (!readingExamId || !rForm.tooth) return;
    try {
      setSavingReading(true);
      await api.post(`/modules/dental/periodontal/${readingExamId}/readings`, {
        toothNumber: parseInt(rForm.tooth, 10),
        pocketDepthBuccal: parseInts(rForm.pdb), pocketDepthLingual: parseInts(rForm.pdl),
        gingivalMarginBuccal: parseInts(rForm.gmb), gingivalMarginLingual: parseInts(rForm.gml),
        bleedingBuccal: parseBools(rForm.bleedB), bleedingLingual: parseBools(rForm.bleedL),
        plaque: rForm.plaque, calculus: rForm.calculus, suppuration: rForm.suppuration,
        furcation: rForm.furcation, mobility: rForm.mobility,
      });
      setReadingExamId(null); fetchExams();
    } catch (e) { console.error('Error saving reading:', e); }
    finally { setSavingReading(false); }
  };

  const pocketCls = (d: number) => d <= 3 ? 'text-green-700 bg-green-50' : d <= 5 ? 'text-yellow-700 bg-yellow-50' : d <= 6 ? 'text-orange-700 bg-orange-50' : 'text-red-700 bg-red-50';

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  const CloseBtn = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="text-gray-400 hover:text-gray-600">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  if (loading) return (
    <Card><CardContent className="p-6"><div className="flex items-center justify-center py-8"><Spinner /><span className="text-gray-500">Cargando examenes periodontales...</span></div></CardContent></Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Periodontograma</h3>
        <Button onClick={openCreate}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo Examen
        </Button>
      </div>

      {/* Exam Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingExam ? 'Editar Examen' : 'Nuevo Examen Periodontal'}</h2>
              <CloseBtn onClick={() => { setShowForm(false); resetForm(); }} />
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Examen</label>
                <select value={formData.examType} onChange={e => setFormData(p => ({ ...p, examType: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  {Object.entries(EXAM_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnostico</label>
                <select value={formData.diagnosis} onChange={e => setFormData(p => ({ ...p, diagnosis: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Seleccionar --</option>
                  {Object.entries(DIAGNOSIS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placa General (%)</label>
                  <input type="number" value={formData.plaque} onChange={e => setFormData(p => ({ ...p, plaque: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="0-100" min={0} max={100} step={0.1} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sangrado General (%)</label>
                  <input type="number" value={formData.bleeding} onChange={e => setFormData(p => ({ ...p, bleeding: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="0-100" min={0} max={100} step={0.1} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Observaciones del examen..." />
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting}>{submitting && <Spinner />}{editingExam ? 'Guardar Cambios' : 'Crear Examen'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Reading Entry Modal */}
      {readingExamId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Registrar Lectura por Diente</h2>
              <CloseBtn onClick={() => setReadingExamId(null)} />
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diente (FDI) *</label>
                <select value={rForm.tooth} onChange={e => setRForm(p => ({ ...p, tooth: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="">-- Seleccionar diente --</option>
                  {ALL_TEETH.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ['pdb', 'Prof. Sondaje Vest. (M,C,D)'],
                  ['pdl', 'Prof. Sondaje Ling. (M,C,D)'],
                  ['gmb', 'Margen Ging. Vest. (M,C,D)'],
                  ['gml', 'Margen Ging. Ling. (M,C,D)'],
                  ['bleedB', 'Sangrado Vest. (0/1)'],
                  ['bleedL', 'Sangrado Ling. (0/1)'],
                ] as [string, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                    <input type="text" value={(rForm as any)[key]} onChange={e => setRForm(p => ({ ...p, [key]: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono" />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                {([['plaque', 'Placa'], ['calculus', 'Calculo'], ['suppuration', 'Supuracion']] as [string, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={(rForm as any)[key]} onChange={e => setRForm(p => ({ ...p, [key]: e.target.checked }))} className="rounded" />
                    {label}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Furcacion (0-3)</label>
                  <select value={rForm.furcation} onChange={e => setRForm(p => ({ ...p, furcation: +e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
                    {[0,1,2,3].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Movilidad (0-3)</label>
                  <select value={rForm.mobility} onChange={e => setRForm(p => ({ ...p, mobility: +e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
                    {[0,1,2,3].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setReadingExamId(null)}>Cancelar</Button>
              <Button onClick={handleSaveReading} disabled={savingReading || !rForm.tooth}>{savingReading && <Spinner />}Guardar Lectura</Button>
            </div>
          </div>
        </div>
      )}

      {/* Exam List */}
      {exams.length === 0 ? (
        <Card><CardContent className="p-6">
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Sin examenes periodontales</h3>
            <p className="mt-1 text-sm text-gray-500">Cree el primer examen periodontal para este paciente.</p>
          </div>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {exams.map(exam => {
            const isOpen = expandedId === exam.id;
            return (
              <Card key={exam.id}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : exam.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <CardTitle className="text-base">{format(new Date(exam.examDate), "dd MMM yyyy", { locale: es })}</CardTitle>
                      <Badge variant="secondary" className="text-xs">{EXAM_TYPE_LABELS[exam.examType] || exam.examType}</Badge>
                      {exam.diagnosis && (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIAGNOSIS_COLORS[exam.diagnosis] || 'bg-gray-100 text-gray-800'}`}>
                          {DIAGNOSIS_LABELS[exam.diagnosis] || exam.diagnosis}
                        </span>
                      )}
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-6 mt-2 text-sm text-gray-500">
                    {exam.overallPlaque != null && <span>Placa: <strong className="text-gray-700">{exam.overallPlaque.toFixed(1)}%</strong></span>}
                    {exam.overallBleeding != null && <span>Sangrado: <strong className="text-gray-700">{exam.overallBleeding.toFixed(1)}%</strong></span>}
                    <span>Lecturas: <strong className="text-gray-700">{exam.readings?.length || 0}</strong></span>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent>
                    <div className="flex gap-2 mb-4">
                      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); openEdit(exam); }}>Editar</Button>
                      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); openReading(exam.id); }}>Agregar Lectura</Button>
                      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); handleDelete(exam.id); }} disabled={deleting === exam.id} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        {deleting === exam.id ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                    </div>
                    {exam.notes && <div className="mb-4"><span className="text-xs font-medium text-gray-500">Notas:</span><p className="text-sm text-gray-700">{exam.notes}</p></div>}

                    {exam.readings && exam.readings.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-2 font-medium text-gray-600">Diente</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-600">P.S. Vest.</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-600">P.S. Ling.</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-600">M.G. Vest.</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-600">M.G. Ling.</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-600">Sang.</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-600">Placa</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-600">Calc.</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-600">Sup.</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-600">Furc.</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-600">Mov.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exam.readings.sort((a, b) => a.toothNumber - b.toothNumber).map(r => {
                              const bleedCount = [...(r.bleedingBuccal || []), ...(r.bleedingLingual || [])].filter(Boolean).length;
                              return (
                                <tr key={r.id} className="border-b border-gray-100">
                                  <td className="py-1.5 px-2 font-mono font-bold text-gray-800">{r.toothNumber}</td>
                                  <td className="py-1.5 px-2 text-center"><div className="flex justify-center gap-0.5">{(r.pocketDepthBuccal || []).map((d, i) => <span key={i} className={`inline-block w-5 text-center rounded ${pocketCls(d)}`}>{d}</span>)}</div></td>
                                  <td className="py-1.5 px-2 text-center"><div className="flex justify-center gap-0.5">{(r.pocketDepthLingual || []).map((d, i) => <span key={i} className={`inline-block w-5 text-center rounded ${pocketCls(d)}`}>{d}</span>)}</div></td>
                                  <td className="py-1.5 px-2 text-center font-mono">{(r.gingivalMarginBuccal || []).join(',')}</td>
                                  <td className="py-1.5 px-2 text-center font-mono">{(r.gingivalMarginLingual || []).join(',')}</td>
                                  <td className="py-1.5 px-2 text-center">{bleedCount > 0 ? <span className="text-red-600 font-semibold">{bleedCount}/6</span> : <span className="text-green-600">0</span>}</td>
                                  <td className="py-1.5 px-2 text-center">{r.plaque ? <span className="text-red-500 font-bold">+</span> : <span className="text-gray-300">-</span>}</td>
                                  <td className="py-1.5 px-2 text-center">{r.calculus ? <span className="text-red-500 font-bold">+</span> : <span className="text-gray-300">-</span>}</td>
                                  <td className="py-1.5 px-2 text-center">{r.suppuration ? <span className="text-red-500 font-bold">+</span> : <span className="text-gray-300">-</span>}</td>
                                  <td className="py-1.5 px-2 text-center">{r.furcation > 0 ? <span className="text-orange-600 font-semibold">{r.furcation}</span> : <span className="text-gray-300">0</span>}</td>
                                  <td className="py-1.5 px-2 text-center">{r.mobility > 0 ? <span className="text-orange-600 font-semibold">{r.mobility}</span> : <span className="text-gray-300">0</span>}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No hay lecturas registradas. Use "Agregar Lectura" para registrar datos por diente.</p>
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
