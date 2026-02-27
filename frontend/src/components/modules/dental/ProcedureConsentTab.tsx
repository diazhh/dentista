import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileCheck, Plus, PenTool, Shield, AlertCircle } from 'lucide-react';

const PROCEDURE_LABELS: Record<string, string> = {
  EXTRACTION: 'Extraccion',
  ROOT_CANAL: 'Endodoncia',
  CROWN: 'Corona',
  IMPLANT: 'Implante',
  SURGERY: 'Cirugia',
  OTHER: 'Otro',
};

const PROCEDURE_OPTIONS = Object.entries(PROCEDURE_LABELS);

interface ProcedureConsent {
  id: string;
  patientId: string;
  providerId: string;
  procedureType: string;
  procedureDesc: string | null;
  consentText: string;
  risks: string[];
  alternatives: string[];
  patientSignature: string | null;
  signedAt: string | null;
  witnessName: string | null;
  witnessSignature: string | null;
  createdAt: string;
}

export default function ProcedureConsentTab({ patientId }: { patientId: string }) {
  const [consents, setConsents] = useState<ProcedureConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Create form state
  const [formProcedure, setFormProcedure] = useState('EXTRACTION');
  const [formDesc, setFormDesc] = useState('');
  const [formConsentText, setFormConsentText] = useState('');
  const [formRisks, setFormRisks] = useState<string[]>([]);
  const [formAlternatives, setFormAlternatives] = useState<string[]>([]);
  const [newRisk, setNewRisk] = useState('');
  const [newAlternative, setNewAlternative] = useState('');

  // Sign form state
  const [signName, setSignName] = useState('');
  const [signWitnessName, setSignWitnessName] = useState('');
  const [signWitnessSig, setSignWitnessSig] = useState('');

  const fetchConsents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/modules/dental/consent/patient/${patientId}`);
      setConsents(res.data);
    } catch (err) {
      console.error('Error fetching consents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, [patientId]);

  const resetCreateForm = () => {
    setFormProcedure('EXTRACTION');
    setFormDesc('');
    setFormConsentText('');
    setFormRisks([]);
    setFormAlternatives([]);
    setNewRisk('');
    setNewAlternative('');
  };

  const handleCreate = async () => {
    if (!formConsentText.trim()) return;
    try {
      setSubmitting(true);
      await api.post('/modules/dental/consent', {
        patientId,
        procedureType: formProcedure,
        procedureDesc: formDesc || undefined,
        consentText: formConsentText,
        risks: formRisks,
        alternatives: formAlternatives,
      });
      setShowCreateModal(false);
      resetCreateForm();
      fetchConsents();
    } catch (err) {
      console.error('Error creating consent:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSign = async () => {
    if (!showSignModal || !signName.trim()) return;
    try {
      setSubmitting(true);
      await api.post(`/modules/dental/consent/${showSignModal}/sign`, {
        patientSignature: signName,
        witnessName: signWitnessName || undefined,
        witnessSignature: signWitnessSig || undefined,
      });
      setShowSignModal(null);
      setSignName('');
      setSignWitnessName('');
      setSignWitnessSig('');
      fetchConsents();
    } catch (err) {
      console.error('Error signing consent:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este consentimiento?')) return;
    try {
      await api.delete(`/modules/dental/consent/${id}`);
      fetchConsents();
    } catch (err) {
      console.error('Error deleting consent:', err);
    }
  };

  const addRisk = () => {
    if (newRisk.trim()) {
      setFormRisks((prev) => [...prev, newRisk.trim()]);
      setNewRisk('');
    }
  };

  const addAlternative = () => {
    if (newAlternative.trim()) {
      setFormAlternatives((prev) => [...prev, newAlternative.trim()]);
      setNewAlternative('');
    }
  };

  const formatDate = (dateStr: string) =>
    format(new Date(dateStr), "d 'de' MMMM yyyy, HH:mm", { locale: es });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-6 w-6 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-gray-500">Cargando consentimientos...</span>
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
          <Shield className="w-5 h-5 text-blue-600" />
          Consentimientos de Procedimiento
        </h3>
        <Button onClick={() => { resetCreateForm(); setShowCreateModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Consentimiento
        </Button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Nuevo Consentimiento</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Procedimiento *</label>
                <select
                  value={formProcedure}
                  onChange={(e) => setFormProcedure(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PROCEDURE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion del Procedimiento</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripcion adicional del procedimiento..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto del Consentimiento *</label>
                <textarea
                  value={formConsentText}
                  onChange={(e) => setFormConsentText(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Texto completo del consentimiento informado..."
                />
              </div>

              {/* Risks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Riesgos</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newRisk}
                    onChange={(e) => setNewRisk(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRisk())}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Agregar un riesgo..."
                  />
                  <Button variant="outline" onClick={addRisk} disabled={!newRisk.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formRisks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formRisks.map((risk, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs px-2 py-1 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        {risk}
                        <button onClick={() => setFormRisks((p) => p.filter((_, idx) => idx !== i))} className="hover:text-red-900 ml-1">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Alternatives */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alternativas</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newAlternative}
                    onChange={(e) => setNewAlternative(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAlternative())}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Agregar una alternativa..."
                  />
                  <Button variant="outline" onClick={addAlternative} disabled={!newAlternative.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formAlternatives.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formAlternatives.map((alt, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {alt}
                        <button onClick={() => setFormAlternatives((p) => p.filter((_, idx) => idx !== i))} className="hover:text-blue-900 ml-1">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={submitting || !formConsentText.trim()}>
                {submitting && (
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Crear Consentimiento
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-blue-600" />
                  Firmar Consentimiento
                </h2>
                <button onClick={() => setShowSignModal(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firma del Paciente (Nombre Completo) *</label>
                <input
                  type="text"
                  value={signName}
                  onChange={(e) => setSignName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre completo del paciente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Testigo</label>
                <input
                  type="text"
                  value={signWitnessName}
                  onChange={(e) => setSignWitnessName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del testigo (opcional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firma del Testigo</label>
                <input
                  type="text"
                  value={signWitnessSig}
                  onChange={(e) => setSignWitnessSig(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Firma del testigo (opcional)"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSignModal(null)}>Cancelar</Button>
              <Button onClick={handleSign} disabled={submitting || !signName.trim()}>
                {submitting && (
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <PenTool className="w-4 h-4 mr-2" />
                Firmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {consents.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Sin consentimientos</h3>
              <p className="mt-1 text-sm text-gray-500">Cree el primer consentimiento de procedimiento para este paciente.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {consents.map((consent) => {
            const isSigned = !!consent.signedAt;
            return (
              <Card key={consent.id}>
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === consent.id ? null : consent.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCheck className={`w-5 h-5 ${isSigned ? 'text-green-600' : 'text-gray-400'}`} />
                      <CardTitle className="text-base">
                        {PROCEDURE_LABELS[consent.procedureType] || consent.procedureType}
                      </CardTitle>
                      {isSigned ? (
                        <Badge className="bg-green-100 text-green-800">
                          Firmado
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Pendiente de firma
                        </Badge>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === consent.id ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>Creado: {formatDate(consent.createdAt)}</span>
                    {isSigned && consent.signedAt && (
                      <span className="text-green-600">Firmado: {formatDate(consent.signedAt)}</span>
                    )}
                  </div>
                </CardHeader>

                {expandedId === consent.id && (
                  <CardContent className="pt-0">
                    {consent.procedureDesc && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-gray-500">Descripcion:</span>
                        <p className="text-sm text-gray-700">{consent.procedureDesc}</p>
                      </div>
                    )}
                    <div className="mb-3">
                      <span className="text-xs font-medium text-gray-500">Texto del Consentimiento:</span>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1 bg-gray-50 rounded-md p-3">
                        {consent.consentText}
                      </p>
                    </div>
                    {consent.risks.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-gray-500">Riesgos:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {consent.risks.map((risk, i) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs px-2 py-1 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              {risk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {consent.alternatives.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-gray-500">Alternativas:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {consent.alternatives.map((alt, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">{alt}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {isSigned && (
                      <div className="mb-3 bg-green-50 border border-green-200 rounded-md p-3">
                        <span className="text-xs font-medium text-green-700">Datos de Firma:</span>
                        <p className="text-sm text-green-800 mt-1">Paciente: {consent.patientSignature}</p>
                        {consent.witnessName && (
                          <p className="text-sm text-green-800">Testigo: {consent.witnessName}</p>
                        )}
                      </div>
                    )}
                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                      {!isSigned && (
                        <Button
                          onClick={(e) => { e.stopPropagation(); setSignName(''); setSignWitnessName(''); setSignWitnessSig(''); setShowSignModal(consent.id); }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <PenTool className="w-4 h-4 mr-2" />
                          Firmar
                        </Button>
                      )}
                      {!isSigned && (
                        <Button
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handleDelete(consent.id); }}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
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
