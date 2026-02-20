import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

const CONDITION_LABELS: Record<string, string> = {
  HEALTHY: 'Sano',
  CAVITY: 'Caries',
  FILLED: 'Obturado',
  CROWN: 'Corona',
  BRIDGE: 'Puente',
  IMPLANT: 'Implante',
  MISSING: 'Ausente',
  EXTRACTION_NEEDED: 'Extraccion',
  ROOT_CANAL: 'Endodoncia',
  FRACTURED: 'Fracturado',
  WORN: 'Desgastado',
  ABSCESS: 'Absceso',
};

const CONDITION_COLORS: Record<string, string> = {
  HEALTHY: 'bg-green-100 text-green-800',
  CAVITY: 'bg-red-100 text-red-800',
  FILLED: 'bg-blue-100 text-blue-800',
  CROWN: 'bg-yellow-100 text-yellow-800',
  BRIDGE: 'bg-purple-100 text-purple-800',
  IMPLANT: 'bg-indigo-100 text-indigo-800',
  MISSING: 'bg-gray-100 text-gray-800',
  EXTRACTION_NEEDED: 'bg-red-200 text-red-900',
  ROOT_CANAL: 'bg-pink-100 text-pink-800',
  FRACTURED: 'bg-orange-100 text-orange-800',
  WORN: 'bg-gray-200 text-gray-700',
  ABSCESS: 'bg-red-300 text-red-900',
};

// FDI adult teeth numbers
const ADULT_TEETH = [
  // Upper right
  18, 17, 16, 15, 14, 13, 12, 11,
  // Upper left
  21, 22, 23, 24, 25, 26, 27, 28,
  // Lower left
  31, 32, 33, 34, 35, 36, 37, 38,
  // Lower right
  48, 47, 46, 45, 44, 43, 42, 41,
];

interface ToothEntry {
  toothNumber: number;
  condition: string;
  surfaces: string[];
  notes: string;
}

interface OdontogramData {
  id: string;
  date: string;
  notes: string | null;
  teeth: Array<{
    id: string;
    toothNumber: number;
    condition: string;
    surfaces: string[];
    notes: string | null;
  }>;
  createdAt: string;
}

interface Props {
  patientId: string;
}

export default function OdontogramsTab({ patientId }: Props) {
  const [odontograms, setOdontograms] = useState<OdontogramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formNotes, setFormNotes] = useState('');
  const [teeth, setTeeth] = useState<ToothEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchOdontograms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/odontograms', { params: { patientId } });
      setOdontograms(response.data);
    } catch (error) {
      console.error('Error fetching odontograms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOdontograms();
  }, [patientId]);

  const initializeForm = () => {
    setFormNotes('');
    setTeeth([]);
    setShowForm(true);
  };

  const addTooth = () => {
    setTeeth(prev => [
      ...prev,
      { toothNumber: 11, condition: 'HEALTHY', surfaces: [], notes: '' },
    ]);
  };

  const updateTooth = (index: number, field: keyof ToothEntry, value: any) => {
    setTeeth(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeTooth = (index: number) => {
    setTeeth(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await api.post('/odontograms', {
        patientId,
        notes: formNotes || undefined,
        teeth: teeth.length > 0
          ? teeth.map(t => ({
              toothNumber: t.toothNumber,
              condition: t.condition,
              surfaces: t.surfaces,
              notes: t.notes || undefined,
            }))
          : undefined,
      });
      setShowForm(false);
      fetchOdontograms();
    } catch (error) {
      console.error('Error creating odontogram:', error);
    } finally {
      setSubmitting(false);
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
            <span className="text-gray-500">Cargando odontogramas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Odontogramas</h3>
        <Button onClick={initializeForm}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Odontograma
        </Button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Nuevo Odontograma</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas generales</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observaciones del odontograma..."
                />
              </div>

              {/* Teeth entries */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Dientes</label>
                  <Button variant="outline" onClick={addTooth} className="text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Diente
                  </Button>
                </div>

                {teeth.length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    No se han agregado dientes. Puede crear el odontograma vacio y editarlo despues.
                  </p>
                )}

                <div className="space-y-3">
                  {teeth.map((tooth, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-start gap-3">
                        {/* Tooth number */}
                        <div className="flex-shrink-0">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Diente</label>
                          <select
                            value={tooth.toothNumber}
                            onChange={(e) => updateTooth(index, 'toothNumber', parseInt(e.target.value))}
                            className="border border-gray-300 rounded px-2 py-1.5 text-sm w-20"
                          >
                            {ADULT_TEETH.map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </div>

                        {/* Condition */}
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Condicion</label>
                          <select
                            value={tooth.condition}
                            onChange={(e) => updateTooth(index, 'condition', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          >
                            {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeTooth(index)}
                          className="mt-5 text-red-400 hover:text-red-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Notes for tooth */}
                      <div className="mt-2">
                        <input
                          type="text"
                          value={tooth.notes}
                          onChange={(e) => updateTooth(index, 'notes', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          placeholder="Notas del diente..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && (
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                )}
                Crear Odontograma
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {odontograms.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Sin odontogramas</h3>
              <p className="mt-1 text-sm text-gray-500">Cree el primer odontograma para este paciente.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {odontograms.map((odontogram) => (
            <Card key={odontogram.id}>
              <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(expandedId === odontogram.id ? null : odontogram.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">
                      Odontograma - {new Date(odontogram.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </CardTitle>
                    <Badge variant="secondary">
                      {odontogram.teeth?.length || 0} dientes
                    </Badge>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === odontogram.id ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {odontogram.notes && (
                  <p className="text-sm text-gray-500 mt-1">{odontogram.notes}</p>
                )}
              </CardHeader>

              {expandedId === odontogram.id && (
                <CardContent>
                  {odontogram.teeth && odontogram.teeth.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Diente</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Condicion</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Superficies</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Notas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {odontogram.teeth
                            .sort((a, b) => a.toothNumber - b.toothNumber)
                            .map((tooth) => (
                            <tr key={tooth.id} className="border-b border-gray-100">
                              <td className="py-2 px-3 font-mono font-semibold">{tooth.toothNumber}</td>
                              <td className="py-2 px-3">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${CONDITION_COLORS[tooth.condition] || 'bg-gray-100 text-gray-800'}`}>
                                  {CONDITION_LABELS[tooth.condition] || tooth.condition}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-gray-600">
                                {tooth.surfaces?.length > 0 ? tooth.surfaces.join(', ') : '-'}
                              </td>
                              <td className="py-2 px-3 text-gray-600">{tooth.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No se registraron dientes en este odontograma.</p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
